from loguru import logger
import os
import time
import uuid
from io import BytesIO
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
from chutes.image import Image as ChutesImage
from chutes.chute import Chute, NodeSelector
from fastapi import Response
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)

os.environ["PYTHONWARNINGS"] = "ignore"

T2V_540_PATH = os.path.join(os.getenv("HF_HOME", "/cache"), "SkyReels-V2-DF-1.3B-540P")

if os.getenv("CHUTES_EXECUTION_CONTEXT") == "REMOTE":
    from huggingface_hub import snapshot_download

    cache_dir = os.getenv("HF_HOME", "/cache")
    for _ in range(3):
        try:
            snapshot_download(
                repo_id="Skywork/SkyReels-V2-DF-1.3B-540P",
                local_dir=T2V_540_PATH,
            )
            break
        except Exception as exc:
            logger.warning(f"Error downloading models: {exc}")
            time.sleep(30)

image = (
    ChutesImage(
        username="kikakkz",
        name="skyreels-v2-1-3b",
        tag="0.0.2",
        readme="## Video and image generation/editing model from Alibaba",
    )
    .from_base("parachutes/base-python:3.12.7")
    .set_user("root")
    .run_command("apt update")
    .apt_install("ffmpeg")
    .set_user("chutes")
    .run_command(
        "git clone https://github.com/SkyworkAI/SkyReels-V2 && "
        "cd SkyReels-V2 && "
        "pip install --upgrade pip && "
        "pip install setuptools wheel && "
        "pip install torch==2.5.1 torchvision && "
        "pip install ninja && "
        "pip install -r requirements.txt --no-build-isolation && "
        "pip install xfuser"
    )
    .run_command("pip install decord")
    .run_command("pip install moviepy==v1.0.3")
    .run_command("mv -f SkyReels-V2/* /app/")
)

chute = Chute(
    username="kikakkz",
    name="skyreels-v2-1.3b-540p",
    tagline="Text-to-video with SkyReels-V2-DF-1.3B-540P",
    readme="Text-to-video with SkyReels-V2-DF-1.3B-540P",
    image=image,
    node_selector=NodeSelector(gpu_count=1, min_vram_gpu_per_gpu=48),
)


class Resolution(str, Enum):
    NINE_SIXTEEN = "720P"
    WIDESCREEN = "540P"


class ImageGenInput(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = (
        "色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走"
    )
    resolution: Optional[Resolution] = Resolution.WIDESCREEN
    guidance_scale: Optional[float] = Field(6.0, ge=1.0, le=7.5)
    seed: Optional[int] = 42
    img_b64_first: Optional[str] = None
    img_b64_last: Optional[str] = None


class VideoGenInput(ImageGenInput):
    ar_step: int = Field(0, ge=0, le=5)
    inference_steps: int = Field(30, ge=10, le=50)
    fps: int = Field(24, ge=16, le=60)
    shift: float = Field(8.0, ge=1.0, le=10.0)
    num_frames: Optional[int] = Field(97, ge=97, le=10000)
    overlap_history: int = Field(17, le=10000)
    addnoise_condition: int = Field(20, ge=0, le=50)
    base_num_frames: Optional[int] = Field(97, ge=97, le=10000)
    causal_block_size: int = Field(1, ge=0, le=50)


@chute.on_startup()
async def initialize(self):
    from skyreels_v2_infer import DiffusionForcingPipeline
    import torch

    """
    Initialize distributed execution of the models.
    """
    self.pipe = DiffusionForcingPipeline(
        T2V_540_PATH,
        dit_path=T2V_540_PATH,
        device=torch.device("cuda"),
        weight_dtype=torch.bfloat16,
        use_usp=False,
        offload=True,
    )


def _infer(
    self,
    image: None,
    end_image: None,
    prompt: str,
    negative_prompt: str,
    resolution: str = "540P",
    **prompt_args,
):
    """
    Inference helper for either model and any task type.
    """
    import torch
    import imageio
    from diffusers.utils import load_image
    from skyreels_v2_infer.pipelines.image2video_pipeline import resizecrop

    height = 544
    width = 960
    if resolution == "540P":
        height = 544
        width = 960
    elif resolution == "720P":
        height = 720
        width = 1280

    local_rank = 0

    if image:
        image = load_image(image)
        image_width, image_height = image.size
        if image_height > image_width:
            height, width = width, height
        image = resizecrop(image, height, width)
        if end_image:
            end_image = load_image(end_image)
            end_image = resizecrop(end_image, height, width)

    image = image.convert("RGB") if image else None
    end_image = end_image.convert("RGB") if end_image else None

    fps = prompt_args.get("fps", 24)

    with torch.cuda.amp.autocast(dtype=self.pipe.transformer.dtype), torch.no_grad():
        video_frames = self.pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            image=image,
            end_image=end_image,
            height=height,
            width=width,
            **prompt_args,
        )[0]
    if local_rank == 0:
        output_dir = f"/tmp"
        file_name = f"{uuid.uuid4()}.mp4"
        output_file = os.path.join(output_dir, file_name)
        imageio.mimwrite(
            output_file,
            video_frames,
            fps=float(fps),
            quality=8,
            output_params=["-loglevel", "error"],
        )

        buffer = BytesIO()
        with open(output_file, "rb") as infile:
            buffer.write(infile.read())
        buffer.seek(0)
        return Response(
            content=buffer.getvalue(),
            media_type="video/mp4",
            headers={
                "Content-Disposition": f'attachment; filename="{uuid.uuid4()}.mp4"'
            },
        )


@chute.cord(
    public_api_path="/image2video",
    public_api_method="POST",
    stream=False,
    output_content_type="video/mp4",
)
async def image_to_video(self, args: VideoGenInput):
    """
    Generate a video from text.
    """
    import torch
    import random
    import base64
    from io import BytesIO
    from PIL import Image

    seed = args.seed
    if args.seed is None:
        random.seed(time.time())
        seed = int(random.randrange(4294967294))

    img_b64_first = None
    if args.img_b64_first:
        img_b64_first = Image.open(BytesIO(base64.b64decode(args.img_b64_first)))

    img_b64_last = None
    if args.img_b64_last:
        img_b64_last = Image.open(BytesIO(base64.b64decode(args.img_b64_last)))

    prompt_args = {
        "num_frames": args.num_frames,
        "num_inference_steps": args.inference_steps,
        "shift": args.shift,
        "guidance_scale": args.guidance_scale,
        "generator": torch.Generator(device="cuda").manual_seed(seed),
        "overlap_history": args.overlap_history,
        "addnoise_condition": args.addnoise_condition,
        "base_num_frames": args.base_num_frames,
        "ar_step": args.ar_step,
        "causal_block_size": args.causal_block_size,
        "fps": args.fps,
    }
    logger.info("Waiting up text-to-video ...")
    return _infer(
        self,
        image=img_b64_first,
        end_image=img_b64_last,
        prompt=args.prompt,
        negative_prompt=args.negative_prompt,
        resolution=args.resolution,
        **prompt_args,
    )


@chute.cord(
    public_api_path="/text2video",
    public_api_method="POST",
    stream=False,
    output_content_type="video/mp4",
)
async def text_to_video(self, args: VideoGenInput):
    """
    Generate a video from text.
    """
    import torch
    import random

    seed = args.seed
    if args.seed is None:
        random.seed(time.time())
        seed = int(random.randrange(4294967294))

    prompt_args = {
        "num_frames": args.num_frames,
        "num_inference_steps": args.inference_steps,
        "shift": args.shift,
        "guidance_scale": args.guidance_scale,
        "generator": torch.Generator(device="cuda").manual_seed(seed),
        "overlap_history": args.overlap_history,
        "addnoise_condition": args.addnoise_condition,
        "base_num_frames": args.base_num_frames,
        "ar_step": args.ar_step,
        "causal_block_size": args.causal_block_size,
        "fps": args.fps,
    }
    logger.info("Waiting up text-to-video ...")
    return _infer(
        self,
        image=None,
        end_image=None,
        prompt=args.prompt,
        negative_prompt=args.negative_prompt,
        resolution=args.resolution,
        **prompt_args,
    )
