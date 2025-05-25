import aiohttp
import hashlib
import base64
import json
import requests
import jwt

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

async def get_user_info(access_token: str, openid: str):
    url = f'https://api.weixin.qq.com/sns/userinfo?access_token={access_token}&openid={openid}&lang=zh_CN'
    timeout = aiohttp.ClientTimeout(connect=10, total=30)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.get(url) as response:
            response.raise_for_status()

            try:
                _response = json.loads(await response.text())
                return _response
            except Exception as e:
                logger.error(f'{BOLD}WeChat request{RESET} {RED}{e}{RESET} ... {await response.read()}')
                raise Exception(repr(e))

async def jscode_2_session(code: str, app_id: str, secret: str):
    url = f'https://api.weixin.qq.com/sns/jscode2session?appid={app_id}&secret={secret}&js_code={code}&grant_type=authorization_code'
    timeout = aiohttp.ClientTimeout(connect=10, total=30)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.get(url) as response:
            response.raise_for_status()

            try:
                _response = json.loads(await response.text())
                if 'errcode' in _response:
                    raise Exception(_response['errmsg'])
                return _response
            except Exception as e:
                logger.error(f'{BOLD}WeChat request{RESET} {RED}{e}{RESET} ... {await response.read()}')
                raise Exception(repr(e))

async def get_authorization_code(code: str, app_id: str, secret: str):
    url = f'https://api.weixin.qq.com/sns/oauth2/access_token?appid={app_id}&secret={secret}&code={code}&grant_type=authorization_code'
    timeout = aiohttp.ClientTimeout(connect=10, total=30)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.get(url) as response:
            response.raise_for_status()

            try:
                _response = json.loads(await response.text())
                if 'errcode' in _response:
                    raise Exception(_response['errmsg'])
                return _response
            except Exception as e:
                logger.error(f'{BOLD}WeChat request{RESET} {RED}{e}{RESET} ... {await response.read()}')
                raise Exception(repr(e))

async def get_openid(code: str):
    return (await jscode_2_session(code, config.weapp_mini_id, config.weapp_mini_secret))['openid']

async def get_openid_with_code_or_token(code: str | None, jwt_token: str | None):
    if code is None and jwt_token is None:
        raise Exception('Invalid input')

    if code is not None:
        return await get_openid(code)
    elif jwt_token is not None:
        try:
            payload = jwt.decode(jwt=jwt_token, key=config.jwt_secret, algorithms=['HS256'])
            return payload['openid']
            # TODO: validate expire time
        except Exception as e:
            raise Exception(repr(e))

async def cook_simulator(code: str | None, jwt_token: str | None, username: str, avatar: str, audio_b64: str, simulator: str, simulator_avatar: str, personality: str | None = None, simulator_archetype: str | None = None, simulator_title: str | None = None):
    openid = await get_openid_with_code_or_token(code, jwt_token)

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

    # Convert simulator audio
    try:
        await generator.audio_request_one(text, file_cid, audio_s3_url, text)
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

async def count_simulators(code: str | None, jwt_token: str | None):
    try:
        openid = await get_openid_with_code_or_token(code, jwt_token) if code is not None or jwt_token is not None else None
    except:
        pass
    return db.count_simulators(openid)

async def get_simulators(code: str | None, jwt_token: str | None, offset: int, limit: int):
    try:
        openid = await get_openid_with_code_or_token(code, jwt_token) if code is not None or jwt_token is not None else None
    except:
        pass

    limit = 100 if limit == 0 or limit > 100 else limit
    return db.get_simulators(openid, offset, limit)

def openid_2_token(openid: str, userinfo: dict | None):
    userinfo = db.get_user(openid) if userinfo is None else userinfo

    payload = {
        'openid': openid,
        'as_reviewer': True if 'as_reviewer' in userinfo and userinfo['as_reviewer'] == 1 else False,
    }
    return jwt.encode(payload=payload, key=config.jwt_secret, algorithm='HS256')

async def get_user(code: str | None, jwt_token: str | None):
    openid = await get_openid_with_code_or_token(code, jwt_token)

    userinfo = db.get_user(openid)

    if jwt_token is None:
        jwt_token = openid_2_token(openid, userinfo)

    print(4)
    return {
        'token': jwt_token,
        'wechat_username': userinfo['wechat_username'],
        'wechat_avatar': userinfo['wechat_avatar'],
        'as_reviewer': True if 'as_reviewer' in userinfo and userinfo['as_reviewer'] == 1 else False,
    }

async def cook_user(code: str, username: str | None, avatar: str | None):
    app_id = config.weapp_mini_id if username is not None else config.weapp_web_id
    secret = config.weapp_mini_secret if username is not None else config.weapp_web_secret

    if username is None or avatar is None:
        # From website
        authorization_code = await get_authorization_code(code, app_id, secret)
        openid = authorization_code['openid']

        # TODO: check user exists

        userinfo = await get_user_info(authorization_code['access_token'], openid)
        username = userinfo['nickname']
        avatar_url = userinfo['headimgurl']

        resp = requests.get(avatar_url)
        resp.raise_for_status()

        avatar_bytes = resp.content
        avatar = base64.b64encode(avatar_bytes).decode('utf-8')
    else:
        # From mini program
        authorization_code = await jscode_2_session(code, app_id, secret)
        openid = authorization_code['openid']

        # TODO: check user exists

    wechat_avatar_b64_bytes = avatar.encode("utf-8")
    wechat_avatar_cid = hashlib.sha256(wechat_avatar_b64_bytes).hexdigest()
    wechat_avatar_bytes = base64.b64decode(wechat_avatar_b64_bytes)
    wechat_avatar_path = f'{config.data_dir}/avatars/wechat/{wechat_avatar_cid}'
    with open(wechat_avatar_path, 'wb') as f:
        f.write(wechat_avatar_bytes)

    db.new_user(openid, username, wechat_avatar_cid)

    userinfo = db.get_user(openid)
    jwt_token = openid_2_token(openid, userinfo)

    return {
        'token': jwt_token,
        'wechat_username': userinfo['wechat_username'],
        'wechat_avatar': userinfo['wechat_avatar'],
        'as_reviewer': True if 'as_reviewer' in userinfo and userinfo['as_reviewer'] == 1 else False,
    }

async def review_simulator(simulator: str, code: str | None, jwt_token: str | None, state: str):
    openid = await get_openid_with_code_or_token(code, jwt_token)

    if state != 'REJECT' and state != 'APPROVED':
        raise Exception('Invalid state')

    simulator = db.get_simulator_with_simulator(simulator)
    if simulator is None:
        raise Exception('Invalid simulator')
    if simulator['state'] != 'CREATED':
        raise Exception('Permission denied')

    userinfo = db.get_user(openid)
    if 'as_reviewer' not in userinfo or userinfo['as_reviewer'] != 1:
        raise Exception('Permission denied')

    db.update_simulator(simulator, state)

async def report_simulator(simulator: str, code: str | None, jwt_token: str | None):
    openid = await get_openid_with_code_or_token(code, jwt_token)

    simulator = db.get_simulator_with_simulator(simulator)
    if simulator is None:
        raise Exception('Invalid simulator')

    userinfo = db.get_user(openid)
    if userinfo is None:
        raise Exception('Permission denied')

    db.report_simulator(simulator)

