import re
from bs4 import BeautifulSoup
import aiohttp
import asyncio
import hashlib
from pydub import AudioSegment
import io
import random
import base64
import uuid
import time

from include import *
from config import config
from db import db

class AudioGenerate:
    async def generate_audio_with_uid(self, audio_uid: str, text: str, voice: str):
        try:
            logger.info(f'{BOLD}{audio_uid}{RESET} {GREEN}Generating{RESET} ...')
            start_time = time.time()
            audio_file_cid = await self.generate_audio(text, voice, audio_uid)
            db.update_audio(audio_uid, audio_file_cid, None)
            logger.info(f'{BOLD}{audio_uid}{RESET} {GREEN}Generate success{RESET} ... elapsed {BOLD}{time.time() - start_time}{RESET}s')
        except Exception as e:
            db.update_audio(audio_uid, None, repr(e))
            logger.error(f'{BOLD}{audio_uid}{RESET} {RED}Generate fail{RESET} ... elapsed {BOLD}{time.time() - start_time}{RESET}s')

    def on_generate_audio_done(self, audio_uid):
        try:
            task.result()
        except Exception as e:
            logger.error(f'{BOLD}{audio_uid}{RESET} {RED}Generate fail{RESET} ...')

    async def generate_audio_async(self, text: str, voice: str) -> str:
        audio_uid = f'{uuid.uuid4()}'
        db.new_audio(audio_uid)

        task = asyncio.create_task(self.generate_audio_with_uid(audio_uid, text, voice))
        task.add_done_callback(lambda: self.on_generate_audio_done(audio_uid))

        return audio_uid

    async def generate_audio(self, text: str, voice: str, audio_uid: str) -> str:
        simulator = db.get_simulator_with_audio_id(voice)
        if simulator is None:
            raise Exception('Invalid voice')

        audio_path = f'{config.data_dir}/materials/{simulator["audio_file_cid"]}.wav'
        with open(audio_path, 'rb') as f:
            audio_bytes = f.read()

        base64_bytes = base64.b64encode(audio_bytes)
        audio_b64 = base64_bytes.decode('utf-8')

        cleaned_text = purify_text(text)
        chunks = chunk_text(cleaned_text)
        audio_buffers = await self.concurrent_audio_requests(chunks, voice, audio_b64, simulator['text'], audio_uid)

        file_cid = self.merge_audio_buffers(
            audio_buffers=[b for b in audio_buffers if b],
            voice=voice,
            text=text,
        )
        return file_cid

    async def fetch_audio(
        self,
        text: str,
        voice: str,
        session: aiohttp.ClientSession,
        semaphore: asyncio.Semaphore,
        index: int,
        voice_audio_b64: str,
        voice_audio_text: str,
        audio_uid: str,
        min_delay_ms: float = 50,
        max_delay_ms: float = 300
    ) -> bytes:
        url = 'https://kikakkz-cosy-voice-tts.chutes.ai/v1/speak'
        headers = {
            'Authorization': f'Bearer {config.api_token}',
            'Content-Type': 'application/json'
        }
        payload = {
            'text': text,
            'prompt_audio_b64': voice_audio_b64,
            'prompt_audio_text': voice_audio_text,
        }

        _uid = uuid.uuid4()
        start_time = time.time()

        timeout = aiohttp.ClientTimeout(connect=10, total=None)
        async with semaphore:
            logger.info(f'{BOLD}{url} - {audio_uid}{RESET} {BOLD}Requesting{RESET} ... {_uid}')
            try:
                delay_seconds = random.uniform(min_delay_ms, max_delay_ms) / 1000 * (index + 1)
                await asyncio.sleep(delay_seconds)

                async with session.post(url, json=payload, timeout=timeout, headers=headers) as response:
                    response.raise_for_status()
                    audio_bytes = await response.read()
                    logger.info(f'{BOLD}{url} - {audio_uid}{RESET} {GREEN}Request success{RESET} ... {BOLD}{_uid}{RESET} elapsed {BOLD}{time.time() - start_time}{RESET}s')
                    return audio_bytes
            except Exception as e:
                logger.error(f'{BOLD}{url} - {audio_uid}{RESET} {RED}Request exception{RESET} ... {repr(e)} - {BOLD}{_uid}{RESET} elapsed {BOLD}{time.time() - start_time}{RESET}s')
                raise Exception(repr(e))

    async def concurrent_audio_requests(self, chunks: list[str], voice: str, voice_audio_b64: str, voice_audio_text: str, audio_uid: str) -> list[bytes]:
        semaphore = asyncio.Semaphore(config.concurrent_audio_requests)
        async with aiohttp.ClientSession(raise_for_status=True) as session:
            tasks = []
            for idx, text in enumerate(chunks):
                task = asyncio.create_task(self.fetch_audio(text, voice, session, semaphore, idx, voice_audio_b64, voice_audio_text, audio_uid))
                task.index = idx
                tasks.append(task)

            results = await asyncio.gather(*tasks)

            sorted_results = [None] * len(chunks)
            for task in tasks:
                sorted_results[task.index] = results[tasks.index(task)]
            return sorted_results

    def merge_audio_buffers(self, audio_buffers: list[bytes], voice: str, text=str) -> str:
        valid_buffers = [b for b in audio_buffers if b]
        hasher = hashlib.sha256()
        for buffer in valid_buffers:
            hasher.update(buffer)

        file_cid = hasher.hexdigest()
        output_path = f"{config.data_dir}/audios/{file_cid}.wav"

        combined = None
        for i, buffer in enumerate(audio_buffers):
            if not buffer:
                continue

            audio = AudioSegment.from_wav(io.BytesIO(buffer))

            if combined is None:
                combined = audio
                target_frame_rate = combined.frame_rate
                target_channels = combined.channels
            else:
                audio = audio.set_frame_rate(target_frame_rate)
                audio = audio.set_channels(target_channels)
                combined += audio

        if combined:
            combined.export(output_path, format="wav")
        else:
            logger.error(f'{BOLD}{voice}{RESET} - {RED}No valid audio data to merge{RESET} for {BOLD}{text[0:16]}{RESET}...')
            raise Exception('Invalid audio')
        return file_cid
