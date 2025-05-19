import io
from fastapi.responses import Response
from pydantic import BaseModel, Field
from chutes.image import Image
from chutes.chute import Chute, NodeSelector

image = (
    Image(
        username="kikakkz",
        name="hidream-i1-fast",
        tag="0.0.1",
        readme="## Text-to-image using HiDream-ai/HiDream-I1-Fast",
    )
    .from_base("parachutes/base-python:3.10.17")
    .set_user("root")
    .run_command("apt update")
    .apt_install(["git-lfs", "sox", "libsox-dev"])
    .run_command("apt-get update")
    .set_user("chutes")
    .run_command("git clone https://github.com/HiDream-ai/HiDream-I1.git")
    .run_command("cd HiDream-I1; git checkout 072d35b1d3809ba8d0ad5a558092e58daa7627db")
    .run_command("pip install --upgrade pip")
    .run_command("cd HiDream-I1; pip install -r requirements.txt")
    .run_command("mv -f HiDream-I1/* /app/")
    .run_command("pip install fastapi uvicorn[standard] python-multipart")
)

chute = Chute(
    username="kikakkz",
    name="hidream-i1-fast",
    tagline="Text-to-image with HiDream-ai/HiDream-I1-Fast",
    readme="HiDream-I1 is a new open-source image generative foundation model with 17B parameters that achieves state-of-the-art image generation quality within seconds.",
    image=image,
    node_selector=NodeSelector(gpu_count=1, min_vram_gpu_per_gpu=80),
)

class V1InputArgs(BaseModel):
    prompt: str = Field(..., min_length=1)
    scale: float = Field(0.0, gt=0)
    steps: int = Field(16, gt=0, le=100)
    width: int = Field(512, ge=256, le=1024)
    height: int = Field(512, ge=256, le=1024)

@chute.on_startup()
async def initialize(self):
    import os
    from pathlib import Path
    from hi_diffusers import HiDreamImagePipeline
    import torch

    MODEL_DIR = Path(os.getenv("HF_HOME", "/app")).resolve()
    MODEL_PATH = (Path(MODEL_DIR) / "pretrained_models/HiDream-I1-Fast").resolve()

    from huggingface_hub import snapshot_download
    snapshot_download('HiDream-ai/HiDream-I1-Fast', local_dir=str(MODEL_PATH))

    self.pipe = HiDreamImagePipeline.from_pretrained(str(MODEL_PATH), torch_dtype=torch.bfloat16).to("cuda")

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
