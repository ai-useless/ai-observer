import aiohttp
import hashlib
import base64
import json

from audio import generator
from config import config
from db import db
from include import *
from aws_uploader import uploader

async def audio_2_text(audio_b64: str) -> str:
    url = 'https://kikakkz-whisper-stt.chutes.ai/v1/transcribe'

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
            return await response.text()

async def get_openid(code: str):
    url = f'https://api.weixin.qq.com/sns/jscode2session?appid={config.weapp_id}&secret={config.weapp_secret}&js_code={code}&grant_type=authorization_code'
    timeout = aiohttp.ClientTimeout(connect=10, total=30)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.get(url) as response:
            response.raise_for_status()

            try:
                _response = json.loads(await response.text())
                return _response['openid']
            except Exception as e:
                logger.error(f'{BOLD}WeChat request{RESET} {RED}{e}{RESET} ... {await response.read()}')
                raise Exception(repr(e))

async def cook_simulator(code: str, username: str, avatar: str, audio_b64: str, simulator: str, simulator_avatar: str, personality: str | None = None, simulator_archetype: str | None = None, simulator_title: str | None = None):
    openid = await get_openid(code)

    try:
        text = await audio_2_text(audio_b64)
    except Exception as e:
        logger.error(f'{BOLD}Audio2Text{RESET} {RED}{e}{RESET}')
        raise Exception(repr(e))

    audio_bytes = base64.b64decode(audio_b64)
    file_cid = hashlib.sha256(audio_bytes).hexdigest()
    file_name = f'{file_cid}.wav'
    file_path = f'{config.data_dir}/materials/{file_name}'

    with open(file_path, 'wb') as f:
        f.write(audio_bytes)

    audio_s3_url = uploader.upload('materials', audio_bytes, f'{file_name}')

    try:
        await generator.audio_request_one(text, file_cid, audio_s3_url, simulator['text'])
    except Exception as e:
        raise Exception(repr(e))

    simulator_avatar_b64_bytes = simulator_avatar.encode("utf-8")
    simulator_avatar_cid = hashlib.sha256(simulator_avatar_b64_bytes).hexdigest()
    simulator_avatar_bytes = base64.b64decode(simulator_avatar_b64_bytes)
    simulator_avatar_path = f'{config.data_dir}/avatars/simulator/{simulator_avatar_cid}'
    with open(simulator_avatar_path, 'wb') as f:
        f.write(simulator_avatar_bytes)

    wechat_avatar_b64_bytes = avatar.encode("utf-8")
    wechat_avatar_cid = hashlib.sha256(wechat_avatar_b64_bytes).hexdigest()
    wechat_avatar_bytes = base64.b64decode(wechat_avatar_b64_bytes)
    wechat_avatar_path = f'{config.data_dir}/avatars/wechat/{wechat_avatar_cid}'
    with open(wechat_avatar_path, 'wb') as f:
        f.write(wechat_avatar_bytes)

    personality = '普普通通路人甲' if personality is None else personality
    simulator_archetype = '有来有去' if simulator_archetype is None else simulator_archetype
    simulator_title = '巡山的小妖怪' if simulator_title is None else simulator_title

    db.new_simulator(openid, username, wechat_avatar_cid, simulator, file_cid, audio_s3_url, text, simulator, simulator_avatar_cid, personality, simulator_archetype, simulator_title, False)
    db.new_user(openid, username, wechat_avatar_cid)

    # TODO: automatically review audio by another AI

    return simulator

async def count_simulators(code: str | None):
    openid = (await get_openid(code)) if code is not None else None
    return db.count_simulators(openid)

async def get_simulators(code: str | None, offset: int, limit: int):
    openid = (await get_openid(code)) if code is not None else None
    limit = 100 if limit == 0 or limit > 100 else limit
    return db.get_simulators(openid, offset, limit)

async def get_user(code: str):
    openid = await get_openid(code)
    return db.get_user(openid)

async def cook_user(code: str, username: str, avatar: str):
    openid = await get_openid(code)

    wechat_avatar_b64_bytes = avatar.encode("utf-8")
    wechat_avatar_cid = hashlib.sha256(wechat_avatar_b64_bytes).hexdigest()
    wechat_avatar_bytes = base64.b64decode(wechat_avatar_b64_bytes)
    wechat_avatar_path = f'{config.data_dir}/avatars/wechat/{wechat_avatar_cid}'
    with open(wechat_avatar_path, 'wb') as f:
        f.write(wechat_avatar_bytes)

    db.new_user(openid, username, wechat_avatar_cid)
