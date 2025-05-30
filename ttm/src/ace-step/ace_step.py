import uuid
import io
from fastapi.responses import Response
from pydantic import BaseModel
from chutes.image import Image
from chutes.chute import Chute, NodeSelector

image = (
    Image(
        username="kikakkz",
        name="ace-step",
        tag="0.0.1",
        readme="## Text-to-music using ACE-Step/ACE-Step-v1-3.5B",
    )
    .from_base("parachutes/base-python:3.10.17")
    .set_user("root")
    .run_command("apt update")
    .apt_install(["git-lfs", "sox", "libsox-dev"])
    .set_user("chutes")
    .run_command("pip install --upgrade pip")
    .run_command("pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu126")
    .run_command("git lfs install")
    .run_command("git clone https://github.com/ace-step/ACE-Step.git")
    .run_command("cd ACE-Step; git checkout 4db9a5db12c04266be61600702fe37189be0030d")
    .run_command("cd ACE-Step; pip install -e .")
    .run_command("mv -f ACE-Step/* /app/")
    .add("model.py", "/app/model.py")
)

chute = Chute(
    username="kikakkz",
    name="ace-step",
    tagline="Text-to-music with ACE-Step/ACE-Step-v1-3.5B",
    readme="ACE-Step is a frontier TTM model for its size of 3.5 million parameters (text in/audio out).",
    image=image,
    node_selector=NodeSelector(gpu_count=1, min_vram_gpu_per_gpu=48),
)

from enum import Enum
class SchedulerType(Enum):
    EULER = "euler"
    HEUN = "heun"
    PINGPONG = "pingpong"

class CfgType(Enum):
    CFG = "cfg"
    APG = "apg"
    CFG_STAR = "cfg_star"

from typing import List
class V1InputArgs(BaseModel):
    audio_duration: float = -1
    tags: str
    lyrics: str
    infer_step: int = 60
    guidance_scale: float = 15
    guidance_scale_text: float = 0.0
    guidance_scale_lyric: float = 0.0
    manual_seeds: List[int] = []
    scheduler_type: SchedulerType = SchedulerType.EULER
    cfg_type: CfgType = CfgType.APG
    use_erg_tag: bool = True
    use_erg_lyric: bool = True
    use_erg_diffusion: bool = True
    omega_scale: float = 10.0
    guidance_interval: float = 0.5
    guidance_interval_decay: float = 0
    min_guidance_scale: float = 3.0
    oss_steps: List[int] = []

@chute.on_startup()
async def initialize(self):
    from model import ACEStepModel
    self.model = ACEStepModel()

@chute.cord(
    path="/v1/generate",
    passthrough_path="/v1/generate",
    public_api_path="/v1/generate",
    public_api_method="POST",
    stream=False,
    output_content_type="audio/wav",
)
async def generate_v1(self, args: V1InputArgs) -> Response:
    audio_bytes = self.model.generate_audio(
        audio_duration=args.audio_duration,
        prompt=args.tags,
        lyrics=args.lyrics,
        infer_step=args.infer_step,
        guidance_scale=args.guidance_scale,
        scheduler_type=args.scheduler_type.value,
        cfg_type=args.cfg_type.value,
        omega_scale=args.omega_scale,
        actual_seeds=args.manual_seeds,
        guidance_interval=args.guidance_interval,
        guidance_interval_decay=args.guidance_interval_decay,
        min_guidance_scale=args.min_guidance_scale,
        use_erg_tag=args.use_erg_tag,
        use_erg_lyric=args.use_erg_lyric,
        use_erg_diffusion=args.use_erg_diffusion,
        oss_steps=args.oss_steps,
        guidance_scale_text=args.guidance_scale_text,
        guidance_scale_lyric=args.guidance_scale_lyric,
    )
    if audio_bytes:
        buffer = io.BytesIO(audio_bytes)

    buffer.seek(0)
    filename = f"{str(uuid.uuid4())}.wav"
    return Response(
        content=buffer.getvalue(),
        media_type="audio/wav",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
