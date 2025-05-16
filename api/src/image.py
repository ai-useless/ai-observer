import uuid
import aiohttp
import asyncio
import hashlib
import uuid
import time
import os

from include import *
from config import config
from db import db

class ImageGenerator:
    def on_generate_image_done(self, task, image_uid):
        try:
            task.result()
        except Exception as e:
            logger.error(f'{BOLD}{image_uid}{RESET} {RED}Generate image FAIL{RESET} ... {e}')

    async def generate_image_async(self, prompt: str) -> str:
        image_uid = f'{uuid.uuid4()}'
        db.new_image(image_uid)

        task = asyncio.create_task(self.generate_image_and_save(image_uid, prompt))
        task.add_done_callback(lambda t: self.on_generate_image_done(t, image_uid))

        return image_uid

    async def generate_image_and_save(self, image_uid: str, prompt: str):
        start_time = time.time()
        try:
            logger.info(f'{BOLD}{image_uid}{RESET} {GREEN}Generating image{RESET} ...')

            image_bytes = await self.generate_image(prompt)

            file_cid = hashlib.sha256(image_bytes).hexdigest()
            output_dir = f'{config.data_dir}/images'
            output_path = f'{output_dir}/{file_cid}.wav'

            os.makedirs(output_dir, exist_ok=True)

            with open(output_path, 'wb') as f:
                f.write(image_bytes)

            db.update_image(image_uid, file_cid, None)
            logger.info(f'{BOLD}{image_uid}{RESET} {GREEN}Generate image SUCCESS{RESET} ... elapsed {BOLD}{time.time() - start_time}{RESET}s')
        except Exception as e:
            db.update_image(image_uid, None, repr(e))
            logger.error(f'{BOLD}{image_uid}{RESET} {RED}Generate image FAIL {e}{RESET} ... elapsed {BOLD}{time.time() - start_time}{RESET}s')

    async def generate_image(self, prompt: str):
        payload = {
            'prompt': prompt,
            'scales': 3.5,
            'steps': 20,
            'width': 512,
            'height': 512,
        }

        url = 'https://kikakkz-cogview4.chutes.ai/v1/generate'
        headers = {
            'Authorization': f'Bearer {config.api_token}',
            'Content-Type': 'application/json'
        }

        timeout = aiohttp.ClientTimeout(connect=10, total=None)
        async with aiohttp.ClientSession(timeout=timeout, raise_for_status=True) as session:
            async with session.post(url, json=payload, timeout=timeout, headers=headers) as response:
                return await response.read()

generator = ImageGenerator()
