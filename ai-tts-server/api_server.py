import torch
import soundfile as sf
from kokoro import KPipeline, KModel
import time
import re
import base64
import tempfile
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from loguru import logger
from fastapi.middleware.cors import CORSMiddleware
from bs4 import BeautifulSoup

# 清理html字符和空格
def clean_html_bs(text):
    # 解析 HTML 并提取纯文本
    soup = BeautifulSoup(text, 'html.parser')
    # 使用 get_text() 自动合并空白为单个空格
    cleaned = soup.get_text(separator=' ')
    # 去除首尾空格（可选）
    return re.sub(r'\s+', '', cleaned)

start_time = time.time()  # 记录开始时间

# 加载音色
zh_voice = torch.load('ckpts/kokoro-v1.1-zh/voices/zf_001.pt')
en_voice = torch.load('ckpts/kokoro-v1.1-zh/voices/af_maple.pt')

load_voice_time = time.time()  # 记录加载音色时间
print("加载音色时间：{:.6f} 秒".format(load_voice_time-start_time))

# 初始化模型，默认使用CPU
model = KModel(repo_id='hexgrad/Kokoro-82M-v1.1-zh').to('cpu').eval()

local_model_time = time.time()  # 记录加载模型时间
print("加载模型时间：{:.6f} 秒".format(local_model_time-load_voice_time))

# 定义中英文回调函数
def en_callable(text):
    # 调用 KPipeline 并提取 phonemes
    pipeline_result = next(KPipeline(
        lang_code='a', 
        repo_id='hexgrad/Kokoro-82M-v1.1-zh', 
        model=model
    )(text, voice=en_voice))
    return pipeline_result.phonemes

# 初始化中文流水线（绑定英文回调）
zh_pipeline = KPipeline(
    lang_code='z', 
    repo_id='hexgrad/Kokoro-82M-v1.1-zh', 
    model=model, 
    en_callable=en_callable  # 绑定英文回调
)

# 在不超过限制长度的情况下按照标点符号拆分文本
def split_text_into_chunks(text, chunk_size=100):
    """
    将文本按照标点符号分割成多个段落，每个段落的长度尽量不超过 chunk_size。

    :param text: 要分割的原始文本
    :param chunk_size: 每个段落的最大字符数
    :return: 分割后的段落列表
    """
    # 定义用于分割句子的标点符号，可以根据需要扩展
    punctuation_pattern = r'(?<=[。！？])'

    # 使用正则表达式分割句子
    sentences = re.split(punctuation_pattern, text)

    # 去除可能的空白句子
    sentences = [s.strip() for s in sentences if s.strip()]

    chunks = []
    current_chunk = ""

    for sentence in sentences:
        # 如果当前段落为空，直接添加句子
        if not current_chunk:
            current_chunk = sentence
        else:
            # 检查添加新句子后是否超过 chunk_size
            if len(current_chunk) + len(sentence) + 1 <= chunk_size:
                current_chunk += ' ' + sentence
            else:
                # 超过限制，将当前段落加入结果，并开始新的段落
                chunks.append(current_chunk.strip())
                current_chunk = sentence

    # 添加最后一个段落
    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks

def generate_audio_for_long_text(text, voice, speed=1.0, chunk_size=128):
    """
    分段处理长文本并拼接音频
    """
    segments = []
    print(f"text len: {len(text)}, chunk_size: {chunk_size}")
    chunks = split_text_into_chunks(text, chunk_size)
    for i, chunk in enumerate(chunks, 1):
        chunk_start_time = time.time() # 分段开始时间
        print(f"Processing the {i} chunk: {chunk}")  # 调试用，打印当前分段
        generator = zh_pipeline(chunk, voice=voice, speed=speed)
        try:
            audio_segment = next(generator).audio
            segments.append(audio_segment)
            chunk_end_time = time.time() # 分段结束时间
            print("分段音频生成执行时间：{:.6f} 秒".format(chunk_end_time-chunk_start_time))
        except StopIteration:
            break

    # 拼接音频片段
    if segments:
        final_audio = torch.cat(segments, dim=0)
        return final_audio
    else:
        return None

# 初始化FastAPI（网页8）
app = FastAPI(title="CoquiTTS-API", version="1.0.0")

# 开发环境允许所有源，生产环境需指定域名
allowed_origins = [
    "http://localhost:*",
    "https://your-domain.com",
    "https://*.your-domain.com"
]

# 生产环境
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=allowed_origins,  # 网页8建议生产环境限制域名
#     allow_credentials=True,          # 支持cookie/token认证场景
#     allow_methods=["*"],            # 允许所有HTTP方法
#     allow_headers=["*"],            # 允许所有请求头
#     expose_headers=["Content-Disposition"]  # 网页7建议暴露特殊头
# )

# 开发环境，允许所有来源和请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

class TTSParams(BaseModel):
    text: str
    speaker_id: str = "zm_053"
    speed: float = 1.0

# 全局音色模型缓存
voice_model_cache = {}

@app.post("/generate")
async def generate_audio(params: TTSParams):
    try:
        print("params: ", params)
        # 动态加载模型（网页1环境配置思路）
        model_key = f"{params.speaker_id}"
        if model_key not in voice_model_cache:
            logger.info(f"Loading model: {model_key}")
            cur_voice_path = "ckpts/kokoro-v1.1-zh/voices/" + model_key + ".pt"
            cur_voice = torch.load(cur_voice_path)
            voice_model_cache[model_key] = cur_voice

        cur_voice = voice_model_cache[model_key]
        cur_start_time = time.time()
        # 将html标签和换行符，空格等去除
        gen_text = clean_html_bs(params.text)
        # gen_text = params.text
        print(f"清理无效字符后的文本: {gen_text}")
        final_audio = generate_audio_for_long_text(gen_text, voice=cur_voice, speed=params.speed, chunk_size=150)
        
         # 检查音频长度
        if final_audio is not None:
            print(f"Audio length: {len(final_audio)} samples")
            print(f"Expected duration: {len(final_audio) / 24000:.2f} seconds")

            # 生成临时文件（网页1文件操作）
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as tmp_file:
                # 保存音频
                sf.write(tmp_file.name, final_audio, 24000)
                
                # Base64编码（网页1数据处理）
                with open(tmp_file.name, "rb") as f:
                    audio_data = base64.b64encode(f.read()).decode("utf-8")
                cur_end_time = time.time()
                print("--当前音色音频生成执行时间：{:.6f} 秒".format(cur_end_time-cur_start_time))
                return {
                    "type": "audio/wav",
                    "data": f"data:audio/wav;base64,{audio_data}",
                    "metadata": {
                        "text_length": len(params.text),
                        "speaker_id": params.speaker_id
                    }
                }
        else:
            print("Failed to generate audio.")

    except Exception as e:
        logger.error(f"Generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print('localhost:8000')
    uvicorn.run(app, host="0.0.0.0", port=8000)
