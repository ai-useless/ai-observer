import io
from fastapi.responses import Response
from pydantic import BaseModel, Field
from chutes.image import Image
from chutes.chute import Chute, NodeSelector

image = (
    Image(
        username="kikakkz",
        name="cogview4-tti",
        tag="0.0.1",
        readme="## Text-to-image using ZhipuAI/CogView4-6B",
    )
    .from_base("parachutes/base-python:3.10.17")
    .set_user("root")
    .run_command("apt update")
    .apt_install(["git-lfs", "sox", "libsox-dev"])
    .run_command("apt-get update")
    .set_user("chutes")
    .run_command("git clone https://github.com/THUDM/CogView4.git")
    .run_command("cd CogView4; git checkout 1f21551ad1a00fec276c01e8bbf98b38d9590108")
    .run_command("pip install --upgrade pip")
    .run_command("pip install -r inference/requirements.txt")
    .run_command("pip install modelscope==1.20.0")
    .run_command("git lfs install")
)

chute = Chute(
    username="kikakkz",
    name="cogview4-tti",
    tagline="Text-to-image with ZhipuAI/CogView4-6B",
    readme="CogView4 is a text-to-image model with 6 billion parameters.",
    image=image,
    node_selector=NodeSelector(gpu_count=1, min_vram_gpu_per_gpu=32),
)

class V1InputArgs(BaseModel):
    prompt: str = Field(..., min_length=1)
    scale: float = Field(3.5, gt=0)
    steps: int = Field(20, gt=0, le=100)
    width: int = Field(512, ge=256, le=1024)
    height: int = Field(512, ge=256, le=1024)

@chute.on_startup()
async def initialize(self):
    import os
    from pathlib import Path
    from diffusers import CogView4Pipeline
    import torch

    MODEL_DIR = Path(os.getenv("HF_HOME", "/app")).resolve()
    MODEL_PATH = (Path(MODEL_DIR) / "pretrained_models/CogView4-6B").resolve()

    from modelscope import snapshot_download
    snapshot_download('ZhipuAI/CogView4-6B', local_dir=str(MODEL_PATH))

    self.pipe = CogView4Pipeline.from_pretrained("pretrained_models/CogView4-6B", torch_dtype=torch.bfloat16).to("cuda")
    self.pipe.enable_model_cpu_offload()
    self.pipe.vae.enable_slicing()
    self.pipe.vae.enable_tiling()

@chute.cord(
    path="/v1/generate",
    passthrough_path="/v1/generate",
    public_api_path="/v1/generate",
    public_api_method="POST",
    stream=False,
    output_content_type="image/png",
)
async def generate_v1(self, args: V1InputArgs) -> Response:
    prompt = args.prompt
    image = self.pipe(
        prompt=prompt,
        guidance_scale=args.scale,
        num_images_per_prompt=1,
        num_inference_steps=args.steps,
        width=args.width,
        height=args.height,
    ).images[0]

    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    buffer.seek(0)
    image_data = buffer.getvalue()
    buffer.close()

    return Response(
        content=image_data,
        media_type="image/png",
        headers={"Content-Disposition": f"attachment;"},
    )
