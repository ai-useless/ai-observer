from fastapi import FastAPI, Body, Request
from fastapi.responses import JSONResponse
import uvicorn
from pydantic import BaseModel
import os
import sys
from starlette.middleware.base import BaseHTTPMiddleware
import time
import threading
import aiohttp
import asyncio
from fastapi.middleware.cors import CORSMiddleware

from audio import AudioGenerate
from include import *
from chat import chat as _chat, ChatMessage
from config import config
from cook_audio import cook_audio as _cook_audio

app = FastAPI()

mutex = threading.Lock()
_requests = 0
responses = 0
errors = 0

class ChatResponse(BaseModel):
    content: str | None = None
    error: str | None = None

class SpeakResponse(BaseModel):
    audio_url: str | None = None
    error: str | None = None

class CookAudioResponse(BaseModel):
    audio_url: str | None = None
    error: str | None = None

@app.post('/api/v1/cook_audio', response_model=CookAudioResponse)
async def cook_audio(
    code: str = Body(...),
    username: str = Body(...),
    avatar: str = Body(...),
    audio_b64: str = Body(...)
):
    try:
        audio_name = await _cook_audio(code, username, avatar, audio_b64)
        return {'audio_url': f'{config.audio_host}/materials/{audio_name}'}
    except Exception as e:
        raise e

@app.post('/api/v1/chat', response_model=ChatResponse)
async def chat(
    model: str = Body(...),
    messages: list[ChatMessage] = Body(..., embed=True) ,
    prompt: str = Body(...)
):
    try:
        content = await _chat(model, messages, prompt)
        return { 'content': content }
    except Exception as e:
        raise e

@app.post('/api/v1/speak', response_model=SpeakResponse)
async def speak(
    text: str = Body(...),
    voice: str = Body(...),
):
    generator = AudioGenerate()
    audio_name = await generator.generate_audio(text, voice, max_concurrency=5)

    return {'audio_url': f'{config.audio_host}/audios/{audio_name}'}


def get_client_host(request: Request) -> str:
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        host = x_forwarded_for.split(",")[0].strip()
    else:
        host = request.client.host if request.client else "unknown"
    return host

@app.exception_handler(asyncio.TimeoutError)
async def timeout_exception_handler(request: Request, e: asyncio.TimeoutError):
    global errors
    host = get_client_host(request)
    with mutex:
        errors += 1
    logger.error(f'{host} - {BOLD}{request.url.path}{RESET} {RED}Read or connect timeout{RESET} ... {errors}')
    return JSONResponse({'error': f'{e}'}, status_code=502)

@app.exception_handler(aiohttp.client_exceptions.ClientConnectorError)
async def connector_error_handler(request: Request, e: aiohttp.client_exceptions.ClientConnectorError):
    global errors
    host = get_client_host(request)
    with mutex:
        errors += 1
    logger.error(f'{host} - {BOLD}{request.url.path}{RESET} {RED}Connection error{RESET} ... {errors}')
    return JSONResponse({'error': f'{e}'}, status_code=502)

@app.exception_handler(aiohttp.client_exceptions.ClientResponseError)
async def connector_error_handler(request: Request, e: aiohttp.client_exceptions.ClientResponseError):
    global errors
    host = get_client_host(request)
    with mutex:
        errors += 1
    logger.error(f'{host} - {BOLD}{request.url.path}{RESET} {RED}Response error{RESET} ... {errors}')
    return JSONResponse({'error': f'{e}'}, status_code=502)

class ApiElapseMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        global _requests
        global responses
        global errors

        with mutex:
            _requests += 1

        host = get_client_host(request)
        logger.info(f'{host} - {BOLD}{request.url.path}{RESET} ... {_requests}')
        start_at = time.time()
        try:
            response = await call_next(request)
            if response.status_code != 200:
                with mutex:
                    errors += 1
                logger.info(f'{host} - {BOLD}{request.url.path}{RESET} take {BOLD}{time.time() - start_at}{RESET}s {RED}FAIL{RESET} ... {errors}')
                return response

            with mutex:
                responses += 1
            logger.info(f'{host} - {BOLD}{request.url.path}{RESET} take {BOLD}{time.time() - start_at}{RESET}s {GREEN}SUCCESS{RESET} ... {responses}')
            return response
        except Exception as e:
            with mutex:
                errors += 1
            logger.info(f'{host} - {BOLD}{request.url.path}{RESET} take {BOLD}{time.time() - start_at}{RESET}s {RED}FAIL{RESET} ... {errors}')
            return JSONResponse({'error': f'{e}'}, status_code=502)

if __name__ == '__main__':
    app.add_middleware(ApiElapseMiddleware)
    app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'], max_age=3600)

    uvicorn.run(app, host='0.0.0.0', port=config.port)
