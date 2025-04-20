from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from loguru import logger
from fastapi.middleware.cors import CORSMiddleware
import requests
import base64
from scipy.io import wavfile
import io

# API_URL="https://kikakkz-observer-tts.chutes.ai/speak"
API_URL="http://127.0.0.1:8800/speak"
CHUTES_API_TOKEN="cpk_69adda47d49b4d51b3c6ae01f5449cdd.b167f56b3e8d5ffa88bf5cc6513bb6f4.1VTnR4OGz56pv1GlHG5OVDMdTrvSpLI5"

# 初始化FastAPI
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
    speakerVoice: str = "zm_053"
    speed: float = 1.0

def get_audio_data(text, voice):
    headers = {
		"Authorization": "Bearer " + CHUTES_API_TOKEN,
        "Content-Type": "application/json"
	}
    body = {
      "text": text,
      "voice": voice
    }
    response = requests.post(API_URL, headers=headers, json=body, stream=True)
    if response.status_code == 200:
        return response.content  # 直接获取二进制内容
    else:
        raise Exception(f"API请求失败，状态码：{response.status_code}")
    
@app.post("/speak")
async def generate_audio(params: TTSParams):
    try:
        print("params: ", params)
        audio_bytes = get_audio_data(params.text, "af")
        buffer = io.BytesIO(audio_bytes)
        sample_rate, audio_data = wavfile.read(buffer)
        duration = round(len(audio_data) / sample_rate, 3)  # 精确到毫秒
        
        # 3. Base64编码
        base64_str = base64.b64encode(audio_bytes).decode('utf-8')
        return {
            "type": "audio/wav",
            "data": f"data:audio/wav;base64,{base64_str}",
            "duration": duration,
            "metadata": {
                "text_length": len(params.text),
                "speakerVoice": params.speakerVoice
            }
        }
    except Exception as e:
        logger.error(f"Generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print('localhost:8000')
    uvicorn.run(app, host="0.0.0.0", port=8000)
