from config import config
import aiohttp
from db import db
import hashlib
import base64
from include import *
import json

async def audio_2_text(audio_b64: str) -> str:
    url = 'http://210.209.69.40:8900/api/v1/transcribe'

    payload = {
        'audio_b64': audio_b64,
    }
    headers = {
        'Authorization': f'Bearer {config.api_token}',
        'Content-Type': 'application/json'
    }

    timeout = aiohttp.ClientTimeout(connect=10, total=30)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(url, json=payload, timeout=timeout, headers=headers) as response:
            response.raise_for_status()
            return (await response.json())['text']

async def cook_simulator(code: str, username: str, avatar: str, audio_b64: str, simulator: str, simulator_avatar: str, personality: str | None = None):
    url = f'https://api.weixin.qq.com/sns/jscode2session?appid={config.weapp_id}&secret={config.weapp_secret}&js_code={code}&grant_type=authorization_code'

    timeout = aiohttp.ClientTimeout(connect=10, total=30)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.get(url) as response:
            response.raise_for_status()

            try:
                response = json.loads(await response.text())
                openid = response['openid']
            except Exception as e:
                logger.error(f'{BOLD}WeChat request{RESET} {RED}{e}{RESET} ... {await response.text()}')
                raise e


            try:
                text = await audio_2_text(audio_b64)
            except Exception as e:
                logger.error(f'{BOLD}Audio2Text{RESET} {RED}{e}{RESET}')
                raise e

            file_cid = hashlib.sha256(audio_b64.encode("utf-8")).hexdigest()
            file_name = f'{file_cid}.wav'
            file_path = f'{config.data_dir}/materials/{file_name}'

            audio_bytes = base64.b64decode(audio_b64)
            with open(file_path, 'wb') as f:
                f.write(audio_bytes)


            simulator_avatar_cid = hashlib.sha256(simulator_avatar.encode("utf-8")).hexdigest()
            simulator_avatar_path = f'{config.data_dir}/avatars/{simulator_avatar_cid}'
            with open(simulator_avatar_path, 'w') as f:
                f.write(simulator_avatar_cid)

            # TODO: get origin personality
            personality = '普普通通路人甲' if personality is None else personality
            db.new_audio(openid, username, avatar, file_cid, text, simulator, simulator_avatar_cid, personality)

            # TODO: automatically review audio by another AI

            return simulator
