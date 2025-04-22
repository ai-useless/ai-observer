import uuid
from io import BytesIO
from enum import Enum
from fastapi.responses import Response
from pydantic import BaseModel, Field
from chutes.image import Image
from chutes.chute import Chute, NodeSelector

image = (
    Image(
        username="kikakkz",
        name="observer-tts",
        tag="0.0.4",
        readme="## Text-to-speech using hexgrade/Kokoro-82M",
    )
    .from_base("parachutes/base-python:3.12.7")
    .set_user("root")
    .run_command("apt update")
    .apt_install(["git-lfs"])
    .set_user("chutes")
    .run_command("pip install --upgrade pip")
    .run_command("pip install phonemizer-fork")
    .run_command("pip install scipy munch torch transformers kokoro misaki==0.9.4 espeakng_loader==0.2.4")
    .run_command("pip install ordered_set pypinyin cn2an bs4 jieba pypinyin_dict soundfile")
    .run_command("pip install --no-cache-dir spacy && python -m spacy download en_core_web_sm")
    .run_command("git lfs install")
    .run_command("git clone https://huggingface.co/hexgrad/Kokoro-82M-v1.1-zh")
    .run_command("cd Kokoro-82M-v1.1-zh; git checkout 01e7505bd6a7a2ac4975463114c3a7650a9f7218")
    .run_command("mv -f Kokoro-82M-v1.1-zh/* /app/")
    .add("utils.py", "/app/")
)

chute = Chute(
    username="kikakkz",
    name="observer-tts",
    tagline="Text-to-speech with hexgrad/Kokoro-82M",
    readme="Kokoro is a frontier TTS model for its size of 82 million parameters (text in/audio out).",
    image=image,
    node_selector=NodeSelector(gpu_count=1, min_vram_gpu_per_gpu=48),
)


class VoicePack(str, Enum):
    DEFAULT = "zf_001"
    MAPLE = "af_maple"
    SOL = "af_sol"
    VALE = "bf_vale"
    ZF001 = "zf_001"
    ZF002 = "zf_002"
    ZF003 = "zf_003"
    ZF004 = "zf_004"
    ZF005 = "zf_005"
    ZF006 = "zf_006"
    ZF007 = "zf_007"
    ZF008 = "zf_008"
    ZF017 = "zf_017"
    ZF018 = "zf_018"
    ZF019 = "zf_019"
    ZF021 = "zf_021"
    ZF022 = "zf_022"
    ZF023 = "zf_023"
    ZF024 = "zf_024"
    ZF026 = "zf_026"
    ZF027 = "zf_027"
    ZF028 = "zf_028"
    ZF032 = "zf_032"
    ZF036 = "zf_036"
    ZF038 = "zf_038"
    ZF039 = "zf_039"
    ZF040 = "zf_040"
    ZF042 = "zf_042"
    ZF043 = "zf_043"
    ZF044 = "zf_044"
    ZF046 = "zf_046"
    ZF047 = "zf_047"
    ZF048 = "zf_048"
    ZF049 = "zf_049"
    ZF051 = "zf_051"
    ZF059 = "zf_059"
    ZF060 = "zf_060"
    ZF067 = "zf_067"
    ZF070 = "zf_070"
    ZF071 = "zf_071"
    ZF072 = "zf_072"
    ZF073 = "zf_073"
    ZF074 = "zf_074"
    ZF075 = "zf_075"
    ZF076 = "zf_076"
    ZF077 = "zf_077"
    ZF078 = "zf_078"
    ZF079 = "zf_079"
    ZF083 = "zf_083"
    ZF084 = "zf_084"
    ZF085 = "zf_085"
    ZF086 = "zf_086"
    ZF087 = "zf_087"
    ZF088 = "zf_088"
    ZF090 = "zf_090"
    ZF092 = "zf_092"
    ZF093 = "zf_093"
    ZF094 = "zf_094"
    ZF099 = "zf_099"
    ZM009 = "zm_009"
    ZM010 = "zm_010"
    ZM011 = "zm_011"
    ZM012 = "zm_012"
    ZM013 = "zm_013"
    ZM014 = "zm_014"
    ZM015 = "zm_015"
    ZM016 = "zm_016"
    ZM020 = "zm_020"
    ZM025 = "zm_025"
    ZM029 = "zm_029"
    ZM030 = "zm_030"
    ZM031 = "zm_031"
    ZM033 = "zm_033"
    ZM034 = "zm_034"
    ZM035 = "zm_035"
    ZM037 = "zm_037"
    ZM041 = "zm_041"
    ZM045 = "zm_045"
    ZM050 = "zm_050"
    ZM052 = "zm_052"
    ZM053 = "zm_053"
    ZM054 = "zm_054"
    ZM055 = "zm_055"
    ZM056 = "zm_056"
    ZM057 = "zm_057"
    ZM058 = "zm_058"
    ZM061 = "zm_061"
    ZM062 = "zm_062"
    ZM063 = "zm_063"
    ZM064 = "zm_064"
    ZM065 = "zm_065"
    ZM066 = "zm_066"
    ZM068 = "zm_068"
    ZM069 = "zm_069"
    ZM080 = "zm_080"
    ZM081 = "zm_081"
    ZM082 = "zm_082"
    ZM089 = "zm_089"
    ZM091 = "zm_091"
    ZM095 = "zm_095"
    ZM096 = "zm_096"
    ZM097 = "zm_097"
    ZM098 = "zm_098"
    ZM100 = "zm_100"


class InputArgs(BaseModel):
    text: str
    voice: VoicePack = Field(
        default=VoicePack.DEFAULT, description="Voice pack selection for text-to-speech"
    )


@chute.on_startup()
async def initialize(self):
    """
    Load the model and all voice packs.
    """
    import torch
    from kokoro import KPipeline, KModel

    self.zh_voice = torch.load('voices/zf_001.pt')
    self.en_voice = torch.load('voices/af_maple.pt')

    self.model = KModel(
        repo_id='hexgrad/Kokoro-82M-v1.1-zh',
        model='kokoro-v1_1-zh.pth',
        config='config.json',
    ).to('cuda').eval()

    def en_callable(text):
        pipeline_result = next(KPipeline(
            lang_code='a', 
            repo_id='hexgrad/Kokoro-82M-v1.1-zh', 
            model=self.model
        )(text, voice=self.en_voice))
        return pipeline_result.phonemes

    self.zh_pipeline = KPipeline(
        lang_code='z', 
        repo_id='hexgrad/Kokoro-82M-v1.1-zh', 
        model=self.model, 
        en_callable=en_callable
    )
    self.voice_packs = {}
    for voice_id in VoicePack:
        voice_path = "voices/" + voice_id.value + ".pt"
        self.voice_packs[voice_id.value] = torch.load(voice_path)
        _ = self.zh_pipeline("warming up", voice=self.voice_packs[voice_id.value], speed=1.1)


@chute.cord(
    public_api_path="/speak",
    public_api_method="POST",
    stream=False,
    output_content_type="audio/wav",
)
async def speak(self, args: InputArgs) -> Response:
    import soundfile as sf
    import torch
    from utils import clean_html_bs, split_text_into_chunks
    """
    Generate SSE audio chunks from input text.
    """
    cleaned_text = clean_html_bs(args.text)
    segments = []
    text_chunks = split_text_into_chunks(cleaned_text, 128)
    for i, chunk in enumerate(text_chunks, 1):
        generator = self.zh_pipeline(chunk, voice=self.voice_packs[args.voice.value], speed=1.1)
        try:
            audio_segment = next(generator).audio
            segments.append(audio_segment)
        except StopIteration:
            break

    buffer = BytesIO()
    if segments:
        final_audio = torch.cat(segments, dim=0)
        sf.write(buffer, final_audio, 24000, format='WAV', subtype='PCM_16')

    buffer.seek(0)
    filename = f"{str(uuid.uuid4())}.wav"
    return Response(
        content=buffer.getvalue(),
        media_type="audio/wav",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
