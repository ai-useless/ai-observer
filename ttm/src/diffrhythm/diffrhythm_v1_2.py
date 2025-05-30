import uuid
import io
from fastapi.responses import Response
from pydantic import BaseModel
from chutes.image import Image
from chutes.chute import Chute, NodeSelector

image = (
    Image(
        username="kikakkz",
        name="diffrhythm-v1-2",
        tag="0.0.2",
        readme="## Text-to-music using ASLP-lab/DiffRhythm",
    )
    .from_base("parachutes/base-python:3.10.17")
    .set_user("root")
    .run_command("apt update")
    .apt_install(["git-lfs", "sox", "libsox-dev"])
    .run_command("apt-get update && apt-get install -y espeak-ng")
    .set_user("chutes")
    .run_command("pip install --upgrade pip")
    .run_command("git lfs install")
    .run_command("git clone https://github.com/ASLP-lab/DiffRhythm.git")
    .run_command("cd DiffRhythm; git checkout 6969baa4446baf49b3eaa5422e4f76a14b9e90ee")
    .run_command("cd DiffRhythm; pip install -r requirements.txt")
    .run_command("mv -f DiffRhythm/* /app/")
    .add("model_handler.py", "/app/model_handler.py")
)

chute = Chute(
    username="kikakkz",
    name="diffrhythm-v1-2",
    tagline="Text-to-music with ASLP-lab/DiffRhythm",
    readme="Diffrhythm is a frontier TTM model for its size of 1 million parameters (text in/audio out).",
    image=image,
    node_selector=NodeSelector(gpu_count=1, min_vram_gpu_per_gpu=48),
)

from typing import Optional

class V1InputArgs(BaseModel):
    lrc_text: str
    ref_prompt: Optional[str] = None
    ref_audio_path: Optional[str] = None
    audio_length: int = 95
    batch_infer_num: int = 1
    edit: bool = False
    ref_song: Optional[str] = None
    edit_segments: Optional[str] = None

class V2InputArgs(BaseModel):
    lrc_text: str
    ref_prompt: Optional[str] = None
    seed: Optional[int] = None
    ref_audio_path: Optional[str] = None
    audio_length: int = 95
    batch_infer_num: int = 1
    edit: bool = False
    ref_song: Optional[str] = None
    edit_segments: Optional[str] = None

@chute.on_startup()
async def initialize(self):
    from model_handler import DiffRhythmModel
    self.model = DiffRhythmModel()

@chute.cord(
    path="/v1/generate",
    passthrough_path="/v1/generate",
    public_api_path="/v1/generate",
    public_api_method="POST",
    stream=False,
    output_content_type="audio/wav",
)
async def generate_v1(self, args: V1InputArgs) -> Response:
    import torchaudio
    audio_tensor = self.model.generate_audio(
        lrc_text=args.lrc_text,
        ref_prompt=args.ref_prompt,
        ref_audio_path=args.ref_audio_path,
        seed = None,
        audio_length=args.audio_length,
        batch_infer_num=args.batch_infer_num,
        edit=args.edit,
        ref_song=args.ref_song,
        edit_segments=args.edit_segments
    )

    buffer = io.BytesIO()
    torchaudio.save(buffer, audio_tensor, format="wav", sample_rate=44100)
    buffer.seek(0)
    filename = f"{str(uuid.uuid4())}.wav"
    return Response(
        content=buffer.getvalue(),
        media_type="audio/wav",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

@chute.cord(
    path="/v2/generate",
    passthrough_path="/v2/generate",
    public_api_path="/v2/generate",
    public_api_method="POST",
    stream=False,
    output_content_type="audio/wav",
)
async def generate_v2(self, args: V2InputArgs) -> Response:
    import torchaudio
    audio_tensor = self.model.generate_audio(
        lrc_text=args.lrc_text,
        ref_prompt=args.ref_prompt,
        ref_audio_path=args.ref_audio_path,
        seed = args.seed,
        audio_length=args.audio_length,
        batch_infer_num=args.batch_infer_num,
        edit=args.edit,
        ref_song=args.ref_song,
        edit_segments=args.edit_segments
    )

    buffer = io.BytesIO()
    torchaudio.save(buffer, audio_tensor, format="wav", sample_rate=44100)
    buffer.seek(0)
    filename = f"{str(uuid.uuid4())}.wav"
    return Response(
        content=buffer.getvalue(),
        media_type="audio/wav",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
