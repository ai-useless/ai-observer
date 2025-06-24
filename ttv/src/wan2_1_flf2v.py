from loguru import logger
import os
import time
import uuid
import base64
from io import BytesIO
from PIL import Image
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
from chutes.image import Image as ChutesImage
from chutes.chute import Chute, NodeSelector
from fastapi import Response, HTTPException, status
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)

os.environ["PYTHONWARNINGS"] = "ignore"

I2V_720_PATH = os.path.join(os.getenv("HF_HOME", "/cache"), "Wan2.1-FLF2V-14B-720P")

if os.getenv("CHUTES_EXECUTION_CONTEXT") == "REMOTE":
    from huggingface_hub import snapshot_download

    cache_dir = os.getenv("HF_HOME", "/cache")
    for _ in range(3):
        try:
            snapshot_download(
                repo_id="Wan-AI/Wan2.1-FLF2V-14B-720P",
                revision="c8db168d95d3ebeb63430b3b6d264885cb8a0df3",
                local_dir=I2V_720_PATH,
            )
            break
        except Exception as exc:
            logger.warning(f"Error downloading models: {exc}")
            time.sleep(30)

image = (
    ChutesImage(
        username="kikakkz",
        name="wan2_1_flf2v",
        tag="0.0.2",
        readme="## Video and image generation/editing model from Alibaba",
    )
    .from_base("parachutes/base-python:3.12.7")
    .set_user("root")
    .run_command("apt update")
    .apt_install("ffmpeg")
    .set_user("chutes")
    .run_command(
        "git clone https://github.com/Wan-Video/Wan2.1 && "
        "cd Wan2.1 && "
        "pip install --upgrade pip && "
        "pip install setuptools wheel && "
        "pip install torch==2.5.0 torchvision && "
        "pip install ninja && "
        "pip install flash-attn --no-build-isolation && "
        "pip install -r requirements.txt --no-build-isolation && "
        "pip install xfuser && "
        "perl -pi -e 's/sharding_strategy=sharding_strategy,/sharding_strategy=sharding_strategy,\\n        use_orig_params=True,/g' wan/distributed/fsdp.py && "
        "perl -pi -e 's/dtype=torch.float32,/dtype=torch.bfloat16,/g' wan/modules/t5.py && "
        "mv -f /app/Wan2.1/wan /home/chutes/.local/lib/python3.12/site-packages/"
    )
)

chute = Chute(
    username="kikakkz",
    name="wan2.1-14b-flf2v",
    tagline="Text-to-video, image-to-video, text-to-image with Wan2.1 14B",
    readme="Text-to-video, image-to-video, text-to-image with Wan2.1 14B",
    image=image,
    node_selector=NodeSelector(
        gpu_count=8, include=["h100", "h800", "h100_nvl", "h100_sxm", "h200"]
    ),
)


class Resolution(str, Enum):
    SIXTEEN_NINE = "1280*720"
    NINE_SIXTEEN = "720*1280"
    WIDESCREEN = "832*480"
    PORTRAIT = "480*832"
    SQUARE = "1024*1024"


# class I2VResolution(str, Enum):
#    SIXTEEN_NINE = "1280*720"
#    WIDESCREEN = "832*480"


class I2VInput(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = (
        "Vibrant colors, overexposed, static, blurry details, subtitles, style, artwork, "
        "painting, picture, still, overall grayish, worst quality, low quality, JPEG compression artifacts, "
        "ugly, incomplete, extra fingers, poorly drawn hands, poorly drawn face, deformed, disfigured, "
        "malformed limbs, fused fingers, motionless image, cluttered background, three legs, "
        "many people in the background, walking backwards, slow motion"
    )
    sample_shift: Optional[float] = Field(None, ge=1.0, le=7.0)
    guidance_scale: Optional[float] = Field(5.0, ge=1.0, le=7.5)
    resolution: Optional[Resolution] = Resolution.NINE_SIXTEEN
    seed: Optional[int] = 42
    first_image_b64: str
    last_image_b64: str
    steps: int = Field(25, ge=20, le=50)
    fps: int = Field(16, ge=16, le=60)
    frames: Optional[int] = Field(81, ge=81, le=241)
    single_frame: Optional[bool] = False


def initialize_model(rank, world_size, task_queue):
    """
    Load the models and use mp Queue to perform inference on the non-rank0 processes.
    """
    import torch
    import torch.distributed as dist
    import wan
    from wan.configs import WAN_CONFIGS
    from xfuser.core.distributed import (
        initialize_model_parallel,
        init_distributed_environment,
    )

    os.environ["RANK"] = str(rank)
    os.environ["WORLD_SIZE"] = str(world_size)
    os.environ["LOCAL_RANK"] = str(rank)

    local_rank = rank
    device = local_rank
    torch.cuda.set_device(local_rank)
    logger.info(f"Initializing distributed inference on {rank=}...")
    dist.init_process_group(
        backend="nccl",
        init_method="tcp://127.0.0.1:29501",
        rank=rank,
        world_size=world_size,
    )

    init_distributed_environment(rank=dist.get_rank(), world_size=dist.get_world_size())
    initialize_model_parallel(
        sequence_parallel_degree=dist.get_world_size(),
        ring_degree=1,
        ulysses_degree=8,
    )

    # Initialize the text-to-video model.
    base_seed = [42] if rank == 0 else [None]
    dist.broadcast_object_list(base_seed, src=0)

    # Initialize the image-to-video model.
    cfg = WAN_CONFIGS["flf2v-14B"]
    logger.info(f"Loading 720P image-to-video model on {rank=}")
    wan_i2v_720 = wan.WanFLF2V(
        config=cfg,
        checkpoint_dir=I2V_720_PATH,
        device_id=device,
        rank=rank,
        t5_fsdp=True,
        dit_fsdp=True,
        use_usp=True,
        t5_cpu=False,
    )
    logger.info("Compiling 720P image-to-video model...")
    wan_i2v_720.text_encoder = torch.compile(wan_i2v_720.text_encoder)
    wan_i2v_720.vae.model = torch.compile(wan_i2v_720.vae.model)
    wan_i2v_720.model = torch.compile(wan_i2v_720.model)

    logger.info(f"Finished loading models on {rank=}")
    if rank == 0:
        return wan_i2v_720
    else:
        while True:
            task = task_queue.get()
            prompt = task.get("prompt")
            args = task.get("args")
            if task.get("type") == "T2V":
                logger.info(f"Process {rank} executing T2V task...")
            #     _ = wan_t2v.generate(prompt, **args)
            # elif task.get("type") == "I2V_480":
            else:
                logger.info(f"Process {rank} executing I2V 720P task...")
                _ = wan_i2v_720.generate(
                    prompt, task["image_first"], task["image_last"], **args
                )
            dist.barrier()


@chute.on_startup()
async def initialize(self):
    """
    Initialize distributed execution of the models.
    """
    import torch
    import torch.multiprocessing as torch_mp
    import multiprocessing
    import numpy as np
    from wan.configs import MAX_AREA_CONFIGS

    start_time = int(time.time())
    self.world_size = torch.cuda.device_count()
    torch_mp.set_start_method("spawn", force=True)
    processes = []
    self.task_queue = multiprocessing.Queue()
    logger.info(f"Starting {self.world_size} processes for distributed execution...")
    start_time = time.time()
    for rank in range(1, self.world_size):
        p = torch_mp.Process(
            target=initialize_model, args=(rank, self.world_size, self.task_queue)
        )
        p.start()
        processes.append(p)
    self.processes = processes

    self.wan_i2v_720 = initialize_model(0, self.world_size, self.task_queue)
    delta = int(time.time()) - start_time
    logger.success(f"Initialized T2V and I2V models in {delta} seconds!")

    # Warmup the I2V model.
    array = np.zeros((720, 1280, 3), dtype=np.uint8)
    for x in range(1280):
        for y in range(720):
            r = int(255 * x / 1280)
            g = int(255 * y / 720)
            b = int(255 * (x + y) / (1280 + 720))
            array[y, x] = [r, g, b]
    warmup_image = Image.fromarray(array)
    prompt_args = {
        "max_area": MAX_AREA_CONFIGS[Resolution.WIDESCREEN.value],
        "frame_num": 81,
        "shift": 3.0,
        "sample_solver": "unipc",
        "sampling_steps": 25,
        "guide_scale": 5.0,
        "seed": 42,
        "offload_model": False,
    }
    logger.info("Warming up image-to-video model...")
    _infer(
        self,
        "Shifting gradient.",
        image_first=warmup_image,
        image_last=warmup_image,
        single_frame=False,
        fps=16,
        **prompt_args,
    )


def _infer(
    self,
    prompt,
    image_first=None,
    image_last=None,
    single_frame=False,
    fps: int = 16,
    **prompt_args,
):
    """
    Inference helper for either model and any task type.
    """
    import torch.distributed as dist
    from wan.utils.utils import cache_video, cache_image

    task_type = "I2V" if image_first else "T2V"
    if task_type == "I2V":
        _, height = image_first.size
        task_type += f"_{height}"
    for _ in range(self.world_size - 1):
        self.task_queue.put(
            {
                "type": task_type,
                "prompt": prompt,
                "image_first": image_first,
                "image_last": image_last,
                "args": prompt_args,
            }
        )
    model = getattr(self, f"wan_{task_type.lower()}")
    video = None
    if image_first:
        video = model.generate(prompt, image_first, image_last, **prompt_args)
    else:
        video = model.generate(prompt, **prompt_args)
    dist.barrier()
    if os.getenv("RANK") == "0":
        extension = "png" if single_frame else "mp4"
        output_file = f"/tmp/{uuid.uuid4()}.{extension}"
        try:
            if single_frame:
                output_file = cache_image(
                    tensor=video.squeeze(1)[None],
                    save_file=output_file,
                    nrow=1,
                    normalize=True,
                    value_range=(-1, 1),
                )
            else:
                output_file = cache_video(
                    tensor=video[None],
                    save_file=output_file,
                    fps=fps,
                    nrow=1,
                    normalize=True,
                    value_range=(-1, 1),
                )
            if not output_file:
                raise Exception("Failed to save output video!")
            buffer = BytesIO()
            with open(output_file, "rb") as infile:
                buffer.write(infile.read())
            buffer.seek(0)
            extension = "png" if single_frame else "mp4"
            return Response(
                content=buffer.getvalue(),
                media_type="video/mp4" if not single_frame else "image/png",
                headers={
                    "Content-Disposition": f'attachment; filename="{uuid.uuid4()}.{extension}"'
                },
            )
        finally:
            if output_file and os.path.exists(output_file):
                os.remove(output_file)


def prepare_input_image(image_b64):
    """
    Resize/crop/convert input images.
    """
    target_width = 1280
    target_height = 720
    try:
        input_image = Image.open(BytesIO(base64.b64decode(image_b64)))
        orig_width, orig_height = input_image.size
        width_ratio = target_width / orig_width
        height_ratio = target_height / orig_height
        scale_factor = max(width_ratio, height_ratio)
        new_width = int(orig_width * scale_factor)
        new_height = int(orig_height * scale_factor)
        input_image = input_image.resize(
            (new_width, new_height), Image.Resampling.LANCZOS
        )
        width, height = input_image.size
        left = (width - target_width) // 2
        top = (height - target_height) // 2
        right = left + target_width
        bottom = top + target_height
        input_image = input_image.crop((left, top, right, bottom)).convert("RGB")
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image input! {exc}",
        )
    return input_image


@chute.cord(
    public_api_path="/flf2video",
    public_api_method="POST",
    stream=False,
    output_content_type="video/mp4",
)
async def image_to_video(self, args: I2VInput):
    """
    Generate a video from an image.
    """
    from wan.configs import MAX_AREA_CONFIGS

    if args.sample_shift is None:
        args.sample_shift = 3.0

    if args.frames % 4 != 1:
        args.frames = args.frames - (args.frames % 4) + 1

    # Format and reshape the image.
    input_first_image = prepare_input_image(args.first_image_b64)
    input_last_image = prepare_input_image(args.last_image_b64)
    prompt_args = {
        "max_area": MAX_AREA_CONFIGS[Resolution.WIDESCREEN.value],
        "frame_num": args.frames,  # XXX the model seems to fail for any other frame count?
        "shift": args.sample_shift,
        "sample_solver": "unipc",
        "sampling_steps": args.steps,
        "guide_scale": args.guidance_scale,
        "seed": args.seed,
        "offload_model": False,
    }
    return _infer(
        self,
        args.prompt,
        image_first=input_first_image,
        image_last=input_last_image,
        single_frame=False,
        fps=args.fps,
        **prompt_args,
    )
