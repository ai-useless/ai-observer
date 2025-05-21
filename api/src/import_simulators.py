import json
import requests
import hashlib
import base64
import asyncio

from audio import generator
from config import config
from db import db
from include import *
from aws_uploader import uploader

def fetch_avatar_then_save(avatar_url: str, target: str):
    print(f'    Downloading {BOLD}{avatar_url}{RESET}')
    resp = requests.get(avatar_url)

    avatar_bytes = resp.content

    avatar_cid = hashlib.sha256(avatar_bytes).hexdigest()
    avatar_path = f'{config.data_dir}/avatars/{target}/{avatar_cid}'
    print(f'    Writting {BOLD}{avatar_path}{RESET}')
    with open(avatar_path, 'wb') as f:
        f.write(avatar_bytes)

    return avatar_cid

def audio_2_text(audio_b64: str):
    url = 'https://kikakkz-whisper-stt.chutes.ai/v1/transcribe'

    payload = {
        'audio_b64': audio_b64,
    }
    headers = {
        'Authorization': f'Bearer {config.api_token}',
        'Content-Type': 'application/json'
    }

    print(f'    Converting {BOLD}{audio_b64[0:32]}{RESET}...')
    resp = requests.post(url=url, json=payload, headers=headers, timeout=(10, 300))
    resp.raise_for_status()
    print(f'    Converted {BOLD}{resp.text[0:32]}{RESET}...')
    return resp.text

def fetch_audio_then_save(audio_url: str):
    print(f'    Downloading {BOLD}{audio_url}{RESET}')
    resp = requests.get(audio_url)
    resp.raise_for_status()

    audio_bytes = resp.content

    audio_cid = hashlib.sha256(audio_bytes).hexdigest()
    audio_path = f'{config.data_dir}/materials/{audio_cid}.wav'
    print(f'    Writting {BOLD}{audio_path}{RESET}')
    with open(audio_path, 'wb') as f:
        f.write(audio_bytes)

    audio_url = uploader.upload('materials', audio_bytes, f'{audio_cid}.wav')

    audio_b64_bytes = base64.b64encode(audio_bytes)
    audio_b64 = audio_b64_bytes.decode('utf-8')

    return (audio_cid, audio_b64, audio_url)

def fetch_kikakkz_avatar():
    url = 'https://avatars.githubusercontent.com/u/13128505?v=4&size=40'
    return fetch_avatar_then_save(url, 'wechat')

async def main():
    with open(config.simulators_file, 'r', encoding='utf-8') as f:
        simulators = json.load(f)

    kikakkz_avatar_cid = fetch_kikakkz_avatar()

    for simulator in simulators:
        print(f'\n\nImporting {BOLD}{simulator["name"]}{RESET} ...')

        avatar_cid = fetch_avatar_then_save(simulator['avatar'], 'simulator')
        (audio_cid, audio_b64, audio_url) = fetch_audio_then_save(simulator['audio'])
        audio_text = audio_2_text(audio_b64)

        try:
            await generator.audio_request_one('我是尊贵的测试文本！', audio_cid, audio_url, audio_text)
        except Exception as e:
            raise e


        db.new_simulator(
            config.kikakkz_wechat_openid,
            'kikakkz',
            kikakkz_avatar_cid,
            simulator['audio_id'],
            audio_cid,
            audio_url,
            audio_text,
            simulator['name'],
            avatar_cid,
            simulator['personality'],
            simulator['archetype'],
            simulator['title'],
            True if simulator['host'] is True else False)

if __name__ == '__main__':
    asyncio.run(main())
