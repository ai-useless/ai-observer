import time
import aiohttp
import uuid
import asyncio
import hashlib

from config import config
from include import *
from db import db

class Singer:
    async def sing_with_uid_v1(self, lrc_text: str, ref_prompt: str, sing_uid: str):
        url = 'https://kikakkz-diffrhythm-v1-2.chutes.ai/v1/generate'

        payload = {
            'lrc_text': lrc_text,
            'ref_prompt': ref_prompt
        }
        headers = {
            'Authorization': f'Bearer {config.api_token}',
            'Content-Type': 'application/json'
        }

        start_time = time.time()

        logger.info(f'{BOLD}Sing - {sing_uid}{RESET} {BOLD}Requesting{RESET} ...')

        timeout = aiohttp.ClientTimeout(connect=10, total=120)
        try:
            async with aiohttp.ClientSession(timeout=timeout, raise_for_status=True) as session:
                async with session.post(url, json=payload, timeout=timeout, headers=headers) as response:
                    audio_bytes = await response.read()
                    audio_file_cid = hashlib.sha256(audio_bytes).hexdigest()

                    output_path = f'{config.data_dir}/audios/{audio_file_cid}.wav'
                    with open(output_path, 'wb') as f:
                        f.write(audio_bytes)

                    logger.info(f'{BOLD}{url}{RESET} {GREEN}Request SUCCESS{RESET} ... {BOLD}{sing_uid}{RESET} elapsed {BOLD}{time.time() - start_time}{RESET}s')
                    db.update_audio(sing_uid, audio_file_cid, None)
        except Exception as e:
            logger.error(f'{BOLD}Sing - {sing_uid}{RESET} {GREEN}Request FAIL{RESET} ... {RED}{repr(e)}{RESET} elapsed {BOLD}{time.time() - start_time}{RESET}s')
            db.update_audio(sing_uid, None, repr(e))
            raise e

    def sing_async_v1(self, lrc_text: str, ref_prompt: str):
        sing_uid = f'{uuid.uuid4()}'
        db.new_audio(sing_uid)

        asyncio.create_task(self.sing_with_uid_v1(lrc_text, ref_prompt, sing_uid))

        return sing_uid

    async def sing_with_uid_v2(self, lrc_text: str, ref_prompt: str, sing_uid: str):
        url = 'https://kikakkz-ace-step.chutes.ai/v1/generate'

        payload = {
            'lyrics': lrc_text,
            'tags': ref_prompt,
            'audio_duration': -1
        }
        headers = {
            'Authorization': f'Bearer {config.api_token}',
            'Content-Type': 'application/json'
        }

        start_time = time.time()

        logger.info(f'{BOLD}Sing - {sing_uid}{RESET} {BOLD}Requesting{RESET} ...')

        timeout = aiohttp.ClientTimeout(connect=10, total=120)
        try:
            async with aiohttp.ClientSession(timeout=timeout, raise_for_status=True) as session:
                async with session.post(url, json=payload, timeout=timeout, headers=headers) as response:
                    audio_bytes = await response.read()
                    audio_file_cid = hashlib.sha256(audio_bytes).hexdigest()

                    output_path = f'{config.data_dir}/audios/{audio_file_cid}.wav'
                    with open(output_path, 'wb') as f:
                        f.write(audio_bytes)

                    logger.info(f'{BOLD}{url}{RESET} {GREEN}Request SUCCESS{RESET} ... {BOLD}{sing_uid}{RESET} elapsed {BOLD}{time.time() - start_time}{RESET}s')
                    db.update_audio(sing_uid, audio_file_cid, None)
        except Exception as e:
            logger.error(f'{BOLD}Sing - {sing_uid}{RESET} {GREEN}Request FAIL{RESET} ... {RED}{repr(e)}{RESET} elapsed {BOLD}{time.time() - start_time}{RESET}s')
            db.update_audio(sing_uid, None, repr(e))
            raise e

    def sing_async_v2(self, lrc_text: str, ref_prompt: str):
        sing_uid = f'{uuid.uuid4()}'
        db.new_audio(sing_uid)

        asyncio.create_task(self.sing_with_uid_v2(lrc_text, ref_prompt, sing_uid))

        return sing_uid

singer = Singer()
