import re
from bs4 import BeautifulSoup
import aiohttp
import asyncio
import hashlib
from pydub import AudioSegment
import io

def purify_text(text):
    soup = BeautifulSoup(text, 'html.parser')
    cleand_html = soup.get_text(separator=' ')
    cleaned_tag = re.sub(r'\[.*?\]', '', cleand_html)
    cleaned_space = re.sub(r'(?<=[\u4e00-\u9fa5])\s+(?=[\u4e00-\u9fa5])', '', cleaned_tag)
    cleaned_space = re.sub(r'(?<=[\u4e00-\u9fa5])\s+(?=，|。|！|？)', '', cleaned_space)
    cleaned_space = re.sub(r'(?<=，|。|！|？)\s+(?=[\u4e00-\u9fa5])', '', cleaned_space)
    return cleaned_space

def chunk_text(text, chunk_size=100):
    punctuation_pattern = r'(?<=[。！？])'

    sentences = re.split(punctuation_pattern, text)
    sentences = [s.strip() for s in sentences if s.strip()]

    chunks = []
    current_chunk = ""

    for sentence in sentences:
        if not current_chunk:
            current_chunk = sentence
            continue

        if len(current_chunk) + len(sentence) + 1 <= chunk_size:
            current_chunk += ' ' + sentence
            continue

        chunks.append(current_chunk.strip())
        current_chunk = sentence

    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks

async def fetch_audio(text: str, voice: str, api_token: str, session: aiohttp.ClientSession, semaphore: asyncio.Semaphore) -> bytes:
    url = 'https://kikakkz-cosy-voice-tts.chutes.ai/speak'
    headers = {
        'Authorization': f'Bearer {api_token}',
        'Content-Type': 'application/json'
    }
    payload = {
        'text': text,
        'voice': voice
    }
    print(f"--payload: {payload} post {url}")
    timeout = aiohttp.ClientTimeout(connect=10, total=59)
    async with semaphore:
        try:
            async with session.post(url, json=payload, timeout=timeout, headers=headers) as response:
                response.raise_for_status()
                audio_bytes = await response.read()
                print(f"len(audio_bytes): {len(audio_bytes)}")
                return audio_bytes
        except Exception as e:
            print(f"Request exception：{url}，error：{str(e)}")
            return b''

async def concurrent_audio_requests(chunks: list[str], voice: str, api_token: str, max_concurrency: int) -> list[bytes]:
    semaphore = asyncio.Semaphore(max_concurrency)
    async with aiohttp.ClientSession() as session:
        tasks = []
        for idx, text in enumerate(chunks):
            task = asyncio.create_task(fetch_audio(text, voice, api_token, session, semaphore))
            task.index = idx
            tasks.append(task)

        results = await asyncio.gather(*tasks)

        sorted_results = [None] * len(chunks)
        for task in tasks:
            sorted_results[task.index] = results[tasks.index(task)]
        return sorted_results

def merge_audio_buffers(audio_buffers: list[bytes], output_path: str) -> str:
    print(f"--create fid")
    valid_buffers = [b for b in audio_buffers if b]
    hasher = hashlib.sha256()
    for buffer in valid_buffers:
        hasher.update(buffer)

    file_name = hasher.hexdigest() + ".wav"
    output_path = f"{output_path}/{file_name}"

    print(f"--merge audio: {output_path}")
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
        print(f"Merge audio to ：{output_path}")
    else:
        print("No valid audio data to merge")
    return file_name