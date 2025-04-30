import uuid
import io
from fastapi.responses import Response
from pydantic import BaseModel
from chutes.image import Image
from chutes.chute import Chute, NodeSelector

image = (
    Image(
        username="kikakkz",
        name="cosy-voice-tts",
        tag="0.0.3",
        readme="## Text-to-speech using FunAudioLLM/CosyVoice",
    )
    .from_base("parachutes/base-python:3.10.17")
    .set_user("root")
    .run_command("apt update")
    .apt_install(["git-lfs", "sox", "libsox-dev"])
    .run_command("apt-get update && apt-get install -y  build-essential  libtool  autoconf  zlib1g-dev  libcairo2-dev  libpango1.0-dev  libgdk-pixbuf2.0-dev  && rm -rf /var/lib/apt/lists/*")
    .set_user("chutes")
    .run_command("pip install --upgrade pip")
    .run_command("pip install setuptools==75.8.0")
    # .add("local_whl/*", "/app/")
    # .run_command("pip install --user /app/Cython-3.0.12-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl")
    # .run_command("pip install --user /app/pynini-2.1.5-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl")
    .run_command("pip install Cython==3.0.12")
    .run_command("pip install pynini==2.1.5")
    .run_command(
        "pip install --extra-index-url https://download.pytorch.org/whl/cu121 "
        "--extra-index-url https://aiinfra.pkgs.visualstudio.com/PublicPackages/_packaging/onnxruntime-cuda-12/pypi/simple/ "
        "onnx==1.16.0 "
        "\"onnxruntime-gpu==1.18.0; sys_platform == 'linux'\" "
        "\"onnxruntime==1.18.0; sys_platform == 'darwin' or sys_platform == 'win32'\""
    ).run_command(
        "pip install --extra-index-url https://download.pytorch.org/whl/cu121 "
        "--extra-index-url https://aiinfra.pkgs.visualstudio.com/PublicPackages/_packaging/onnxruntime-cuda-12/pypi/simple/ "
        "conformer==0.3.2 gdown==5.1.0 pyarrow==18.1.0 protobuf==4.25 "
        "HyperPyYAML==1.2.2 omegaconf==2.3.0 hydra-core==1.3.2 networkx==3.1 "
        "matplotlib==3.7.5 rich==13.7.1 wget==3.2 inflect==7.3.1 pydantic==2.7.0 "
        "openai-whisper==20231117"
    ).run_command(
        "pip install --extra-index-url https://download.pytorch.org/whl/cu121 "
        "--extra-index-url https://aiinfra.pkgs.visualstudio.com/PublicPackages/_packaging/onnxruntime-cuda-12/pypi/simple/ "
        "librosa==0.10.2 soundfile==0.12.1 pyworld==0.3.4 lightning==2.2.4"
    ).run_command(
        "pip install --extra-index-url https://download.pytorch.org/whl/cu121 "
        "--extra-index-url https://aiinfra.pkgs.visualstudio.com/PublicPackages/_packaging/onnxruntime-cuda-12/pypi/simple/ "
        "transformers==4.40.1 diffusers==0.29.0 modelscope==1.20.0"
    )
    .run_command(
        "pip install --extra-index-url https://download.pytorch.org/whl/cu121 "
        "--extra-index-url https://aiinfra.pkgs.visualstudio.com/PublicPackages/_packaging/onnxruntime-cuda-12/pypi/simple/ "
        "WeTextProcessing==1.0.3"
    )
    .run_command(
        "pip install --extra-index-url https://download.pytorch.org/whl/cu121 "
        "--extra-index-url https://aiinfra.pkgs.visualstudio.com/PublicPackages/_packaging/onnxruntime-cuda-12/pypi/simple/ "
        "gradio==5.4.0 fastapi==0.115.6 uvicorn==0.30.0 fastapi-cli==0.0.4 "
        "tensorboard==2.14.0"
    )
    .run_command(
        "pip install --extra-index-url https://download.pytorch.org/whl/cu121 "
        "--extra-index-url https://aiinfra.pkgs.visualstudio.com/PublicPackages/_packaging/onnxruntime-cuda-12/pypi/simple/ "
        "grpcio==1.57.0"
    ).run_command(
        "pip install --extra-index-url https://download.pytorch.org/whl/cu121 "
        "--extra-index-url https://aiinfra.pkgs.visualstudio.com/PublicPackages/_packaging/onnxruntime-cuda-12/pypi/simple/ "
        "grpcio-tools==1.57.0"
    )
    .run_command(
        "pip install --extra-index-url https://download.pytorch.org/whl/cu121 "
        "--extra-index-url https://aiinfra.pkgs.visualstudio.com/PublicPackages/_packaging/onnxruntime-cuda-12/pypi/simple/ "
        "torch==2.3.1 torchaudio==2.3.1 "
        "\"deepspeed==0.14.2; sys_platform == 'linux'\" "
        "\"tensorrt-cu12==10.0.1; sys_platform == 'linux'\" "
        "\"tensorrt-cu12-bindings==10.0.1; sys_platform == 'linux'\" "
        "\"tensorrt-cu12-libs==10.0.1; sys_platform == 'linux'\""
    )
    .run_command(
        "pip install --extra-index-url https://download.pytorch.org/whl/cu121 "
        "--extra-index-url https://aiinfra.pkgs.visualstudio.com/PublicPackages/_packaging/onnxruntime-cuda-12/pypi/simple/ "
        "grpcio==1.57.0"
    ).run_command(
        "pip install --extra-index-url https://download.pytorch.org/whl/cu121 "
        "--extra-index-url https://aiinfra.pkgs.visualstudio.com/PublicPackages/_packaging/onnxruntime-cuda-12/pypi/simple/ "
        "grpcio-tools==1.57.0"
    )
    .run_command("git lfs install")
    .run_command("git clone https://github.com/FunAudioLLM/CosyVoice.git")
    .run_command("cd CosyVoice; git checkout 587604b2b433bc350c344b4b181b47249b54faf2")
    .run_command("cd CosyVoice; git submodule update --init --recursive")
    .run_command("mv -f CosyVoice/* /app/")
    .add("purify_text.py", "/app/")
    .add("cosy_voice_generator.py", "/app/")
    .add("frontend.py", "/app/cosyvoice/cli/frontend.py")
)

chute = Chute(
    username="kikakkz",
    name="cosy-voice-tts",
    tagline="Text-to-speech with FunAudioLLM/CosyVoice",
    readme="CosyVoice is a frontier TTS model for its size of 82 million parameters (text in/audio out).",
    image=image,
    node_selector=NodeSelector(gpu_count=1, min_vram_gpu_per_gpu=8),
)

import os
import sys
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append('{}/third_party/Matcha-TTS'.format(ROOT_DIR))

class InputArgs(BaseModel):
    text: str
    speed: float = 1.0
    prompt_audio_b64: str
    prompt_audio_text: str

@chute.on_startup()
async def initialize(self):
    import os
    from pathlib import Path
    from cosy_voice_generator import CosyVoiceGenerator

    MODEL_DIR = Path(os.getenv("HF_HOME", "/app")).resolve()
    MODEL_PATH = (Path(MODEL_DIR) / "pretrained_models/CosyVoice2-0.5B").resolve()

    from modelscope import snapshot_download
    snapshot_download('iic/CosyVoice2-0.5B', local_dir=str(MODEL_PATH))

    self.generator = CosyVoiceGenerator(model_path=str(MODEL_PATH))

@chute.cord(
    path="/v1/speak",
    passthrough_path="/v1/speak",
    public_api_path="/v1/speak",
    public_api_method="POST",
    stream=False,
    output_content_type="audio/wav",
)
async def speak(self, args: InputArgs) -> Response:
    from purify_text import purify_text
    """
    Generate SSE audio chunks from input text.
    """
    text = purify_text(args.text)
    audio_bytes = self.generator.generate_speech(
        target_text=text,
        prompt_audio_b64=args.prompt_audio_b64,
        prompt_audio_text=args.prompt_audio_text
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
