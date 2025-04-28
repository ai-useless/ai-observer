from config import config
import aiohttp
from db import db
import hashlib
import base64
from include import *
import json

async def audio_2_text(audio_b64: str) -> str:
    url = 'http://210.209.69.40:8900/api/v1/transcribe'
    return url

async def cook_audio(code: str, username: str, avatar: str, audio_b64: str):
    url = f'https://api.weixin.qq.com/sns/jscode2session?appid={config.weapp_id}&secret={config.weapp_secret}&js_code={code}&grant_type=authorization_code'

    timeout = aiohttp.ClientTimeout(connect=10, total=30)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.get(url) as response:
            response.raise_for_status()

            try:
                response = json.loads(await response.text())
                openid = response['openid']
            except Exception as e:
                logger.error(f'{BOLD}WeChat request{RESET} {RED}{await response.text()}{RESET} ... {e}')
                raise e


            # TODO: convert audio to text
            text = audio_2_text(audio_b64)

            file_cid = hashlib.sha256(audio_b64.encode("utf-8")).hexdigest()
            file_name = f'{file_cid}.wav'
            file_path = f'{config.data_dir}/materials/{file_name}'

            audio_bytes = base64.b64decode(audio_b64)
            with open(file_path, 'wb') as f:
                f.write(audio_bytes)

            # TODO: store create infomation of audio/user to database
            db.new_audio(openid, username, avatar, file_cid)

            # TODO: automatically review audio by another AI

            return file_name
