from fastapi.responses import Response
from pydantic import BaseModel
from chutes.image import Image
from chutes.chute import Chute, NodeSelector

image = (
    Image(
        username="whisper",
        name="whisper-stt",
        tag="0.0.1",
        readme="## speech-to-Text using openai/whisper",
    )
    .from_base("parachutes/base-python:3.10.17")
    .set_user("root")
    .run_command("apt update")
    .apt_install(["git-lfs"])
    .set_user("chutes")
    .run_command("pip install --upgrade pip")
    .run_command("pip install setuptools==75.8.0")
    .run_command("pip install torch torchaudio --extra-index-url https://download.pytorch.org/whl/cu121")
    .run_command("pip install fastapi uvicorn python-multipart soundfile librosa")
    .run_command("pip install -U openai-whisper==20240930")
    .run_command("git lfs install")
)

chute = Chute(
    username="kikakkz",
    name="whisper-stt",
    tagline="speech-to-Text using openai/whisper",
    readme="Whisper is a general-purpose speech recognition model.",
    image=image,
    node_selector=NodeSelector(gpu_count=1, min_vram_gpu_per_gpu=8),
)

class InputArgs(BaseModel):
    audio_b64: str

class WhisperGenerator:
    def __init__(self, model_path="/app/whisper"):
        import whisper
        import torch
        MODEL_NAME = "large-v3"  # Supported: tiny/small/medium/large
        self.model = whisper.load_model(
            MODEL_NAME,
            download_root=model_path,
            device='cuda' if torch.cuda.is_available() else 'cpu'
        )

    def process_base64_audio_to_text(self, base64_str: str) -> str:
        from tempfile import NamedTemporaryFile
        decoded_data = self.validate_and_decode(base64_str)

        format_type = self.detect_audio_format(decoded_data)

        with NamedTemporaryFile(suffix=f".{format_type}", delete=True) as temp_audio:
            temp_audio.write(decoded_data)
            temp_audio.flush()

            return self.model.transcribe(str(temp_audio.name))

    def validate_and_decode(self, base64_str: str) -> bytes:
        import base64
        import re
        import binascii

        """Verify and decode Base64 strings, including those with MIME headers[3,6,8](@ref)"""
        header_pattern = r"^data:audio/(wav|mp3);base64,"
        if re.match(header_pattern, base64_str, re.IGNORECASE):
            payload = base64_str.split(",", 1)[1]
        else:
            payload = base64_str

        payload += '=' * (4 - len(payload) % 4) if len(payload) % 4 != 0 else ''

        try:
            return base64.b64decode(payload, validate=True)
        except (binascii.Error, TypeError) as e:
            raise ValueError(f"Invalid Base64 format: {str(e)}")

    def detect_audio_format(self, data: bytes) -> str:
        """Detect audio format by file header[3,4](@ref)"""
        if len(data) < 12:
            raise ValueError("Audio data is too short")

        if data[:4] == b'RIFF' and data[8:12] == b'WAVE':
            return 'wav'

        if data[:3] == b'ID3' or (data[0] == 0xFF and (data[1] & 0xE0) == 0xE0):
            return 'mp3'

        raise ValueError("Only supports WAV/MP3 format")

@chute.on_startup()
async def initialize(self):
    import os
    from pathlib import Path

    MODEL_DIR = (Path(os.getenv("HF_HOME", "/app")) / "whisper").resolve()
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    self.generator = WhisperGenerator(model_path=MODEL_DIR)


@chute.cord(
    path="/v1/transcribe",
    passthrough_path="/v1/transcribe",
    public_api_path="/v1/transcribe",
    public_api_method="POST",
    stream=False,
    output_content_type="text/html",
)
async def transcribe(self, args: InputArgs) -> Response:
    result = self.generator.process_base64_audio_to_text(args.audio_b64)

    return Response(
        content=result["text"],
        media_type="text/html",
        headers={"Content-Type": "text/html"},
    )
