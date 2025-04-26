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
        tag="0.0.1",
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
    .add("local_whl/*", "/app/")
    .run_command("pip install --user /app/Cython-3.0.12-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl")
    .run_command("pip install --user /app/pynini-2.1.5-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl")
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
    .run_command("git clone https://github.com/jakys/test-voice.git")
    .run_command("mkdir -p /app/preset_voices/")
    .run_command("mv -f test-voice/* /app/preset_voices/")
    .add("../utils.py", "/app/")
    .add("download.py", "/app/")
    .add("frontend.py", "/app/cosyvoice/cli/frontend.py")
    .run_command("python download.py")
)

chute = Chute(
    username="kikakkz",
    name="cosy-voice-tts",
    tagline="Text-to-speech with FunAudioLLM/CosyVoice",
    readme="CosyVoice is a frontier TTS model for its size of 82 million parameters (text in/audio out).",
    image=image,
    node_selector=NodeSelector(gpu_count=1, min_vram_gpu_per_gpu=8),
)


VOICE_LIBRARY = {
    "huyihu": {
        "audio_path": "preset_voices/huyihu.mp3",
        "prompt_text": "你好，我是胡一虎！春回大地，春意盎然，今天，我想带您去拜访春天，走进一座山清水秀的城市。"
    },
    "jay": {
        "audio_path": "preset_voices/jay.mp3",
        "prompt_text": "其实我觉得，嗯..我不太适合谈恋爱，因为我觉得自己是一个，比较，额，怎么讲呢，比较只有专注在音乐上面，然后篮球啊什么的，朋友啊，我觉得我对朋友反而会过于爱情。"
    },
    "liyunlong": {
        "audio_path": "preset_voices/liyunlong.mp3",
        "prompt_text": "我李云龙只有一个原则，你们，只许占便宜，不许吃亏，赔本的买卖咱不干，只要枪声一响，你们都得给老子捞点东西回来，我这人不择食，什么都要，吃的，穿的，枪炮，弹药，弄多了我不嫌多，弄少了我不高兴，谁要是弄不着，那我就要骂娘了，不，咱也不是啥都要，要是给我弄回来个日本娘们我可不要。"
    },
    "laohu": {
        "audio_path": "preset_voices/laohu.mp3",
        "prompt_text": "我呢也接受过西方媒体的采访，我记得有一次去这个BBC，我们一个代表团去BBC，因为他知道我在中国有点影响力可能是，就专门把我给这个请出来，然后到他们那个报道室里面，专门一个BBC的一个特别有名的一个记者。"
    },
    "dongqing": {
        "audio_path": "preset_voices/dongqing.mp3",
        "prompt_text": "很高兴能够作为时尚发布嘉宾，出席今晚的时尚盛典，今天晚上有一个很大的感受，是这个行业涌现出了很多新人，我一方面在质疑自己，是不是已经不够时尚的同时，也很庆幸能够有这样一个机会，因为认识新鲜的面孔，就是在认识这个世界。"
    },
    "miqi": {
        "audio_path": "preset_voices/miqi.mp3",
        "prompt_text": "嗨，大家好，是我，米老鼠，对了，要不要进我的妙妙屋，噢！太好了，噢！我差点忘了，要让妙妙屋出现，我们必须要念奇妙的咒语，米斯噶，木斯噶，米老鼠！"
    },
    "juzuo": {
        "audio_path": "preset_voices/juzuo.mp3",
        "prompt_text": "大家好，我是局座张召忠，哎呀，这个，很多小伙伴说经常看我，电视上的妆化得不错，有很多的化妆师，他说我自己的妆化得还可以，其实这一年我做电视二十六七年了，一直都是我自己化妆。"
    },
    "xiaoge": {
        "audio_path": "preset_voices/xiaoge.mp3",
        "prompt_text": "情人节到了，现在都过情人节了，本来我们都过，7月7号，就是七夕牛郎织女香，现在这个西方人也等着他们的节日啊，大家互相感染一下，只要快乐就OK。"
    },
    "laozhu": {
        "audio_path": "preset_voices/laozhu.mp3",
        "prompt_text": "皇朝是咱首创的，封子为王有何不可啊，哎，整个皇朝，都是天子的家园呐，那些藩王又是咱的皇儿，所以说呀，封子为王这件事，没什么可以商议的。"
    }
}


import os
import sys
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append('{}/third_party/Matcha-TTS'.format(ROOT_DIR))

class CosyVoiceGenerator:
    def __init__(self, model_path="pretrained_models/CosyVoice2-0.5B"):
        from cosyvoice.cli.cosyvoice import CosyVoice2
        self.cosyvoice = CosyVoice2(model_path)
    
    def _merge_audio_segments(self, waveforms):
        import torch
        if any(wave.dim() != 2 for wave in waveforms):
            raise ValueError("Invalid audio dimension, expected 2D tensor")
        
        return torch.cat(waveforms, dim=1)

    def _waveform_to_bytes(self, waveform):
        import torchaudio
        buffer = io.BytesIO()
        torchaudio.save(
            buffer,
            waveform,
            self.cosyvoice.sample_rate,
            format="wav",
            encoding="PCM_S",
            bits_per_sample=16
        )
        buffer.seek(0)
        byte_data = buffer.read()
        buffer.close()
        return byte_data
        
    def generate_speech(self, voice_name, target_text):
        from cosyvoice.utils.file_utils import load_wav

        """
        Generate voice in fast replication mode
        :param voice_name
        :param target_text
        """
        voice_info = VOICE_LIBRARY.get(voice_name)
        if not voice_info:
            raise ValueError(f"Voice configuration not found: {voice_name}")
        
        if not os.path.exists(voice_info["audio_path"]):
            raise FileNotFoundError(f"The audio file does not exist: {voice_info['audio_path']}")
            
        prompt_speech = load_wav(voice_info["audio_path"], 16000)
        
        results = self.cosyvoice.inference_zero_shot(
            tts_text=target_text,
            prompt_text=voice_info["prompt_text"],
            prompt_speech_16k=prompt_speech,
            stream=False
        )

        merged_waveform = self._merge_audio_segments(
            [result["tts_speech"] for result in results]
        )

        return self._waveform_to_bytes(merged_waveform)

class InputArgs(BaseModel):
    text: str
    voice: str = "miqi"

@chute.on_startup()
async def initialize(self):
    """
    Load the model and all voice packs.
    """

    self.generator = CosyVoiceGenerator()

@chute.cord(
    public_api_path="/speak",
    public_api_method="POST",
    stream=False,
    output_content_type="audio/wav",
)
async def speak(self, args: InputArgs) -> Response:
    from utils import clean_html_bs
    """
    Generate SSE audio chunks from input text.
    """
    cleaned_text = clean_html_bs(args.text)
    audio_bytes = self.generator.generate_speech(
        voice_name=args.voice,
        target_text=cleaned_text
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


@chute.cord(
    public_api_path="/echo",
    public_api_method="POST",
    stream=False,
    output_content_type="text/html",
)
async def echo(self, args: InputArgs) -> Response:
    import random
    random_number = random.random()
    print(f"args.text={args.text}")
    response_text = str(random_number) + args.text + str(random_number) + args.voice
    return Response(
        content=response_text,
        media_type="text/html",
        headers={"Content-Type": "text/html"},
    )
