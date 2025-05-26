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
from typing import Optional

from audio import generator as audio_generator
from image import generator as image_generator
from include import *
from chat import chat_non_stream as _chat, ChatMessage
from config import config
from cook_simulator import cook_simulator as _cook_simulator, count_simulators as _count_simulators, get_simulators as _get_simulators, get_user as _get_user, cook_user as _cook_user, audio_2_text, review_simulator as _review_simulator, report_simulator as _report_simulator
from db import db

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

class SpeakAsyncResponse(BaseModel):
    audio_uid: str | None = None
    error: str | None = None

class GenerateImageAsyncResponse(BaseModel):
    image_uid: str | None = None
    error: str | None = None

class QueryAudioResponse(BaseModel):
    settled: bool = False
    audio_url: str | None = None
    error: str | None = None

class QueryImageResponse(BaseModel):
    settled: bool = False
    image_url: str | None = None
    error: str | None = None

class CookSimulatorResponse(BaseModel):
    audio_url: str | None = None
    error: str | None = None

class SpeechToTextResponse(BaseModel):
    text: str | None = None
    error: str | None = None

@app.get('/api/v1/models')
async def get_models(offset: int = 0, limit: int = 100):
    models = db.get_models(offset, limit)
    return [{
        **model,
        'author_logo_url': f'{config.file_server}/avatars/model/{model["author_logo"]}',
        'model_logo_url': f'{config.file_server}/avatars/model/{model["model_logo"]}',
        'vendor_logo_url': f'{config.file_server}/avatars/model/{model["vendor_logo"]}',
    } for model in models]

@app.post('/api/v1/cook_user')
async def cook_user(code: str = Body(...), username: str | None = Body(default=None), avatar: str | None = Body(default=None)):
    user = await _cook_user(code, username, avatar)
    return { **user, 'wechat_avatar_url': f'{config.file_server}/avatars/wechat/{user["wechat_avatar"]}' } if user is not None else None

@app.get('/api/v1/user')
async def get_user(code: str | None = None, token: str | None = None):
    user = await _get_user(code, token)
    return { **user, 'wechat_avatar_url': f'{config.file_server}/avatars/wechat/{user["wechat_avatar"]}' } if user is not None else None

@app.post('/api/v1/cook_simulator', response_model=CookSimulatorResponse)
async def cook_simulator(
    code: str | None = Body(default=None),
    token: str | None = Body(default=None),
    username: str = Body(...),
    avatar: str = Body(...),
    audio_b64: str = Body(...),
    simulator: str = Body(...),
    simulator_avatar: str = Body(...),
    personality: str | None = Body(...),
    simulator_archetype: str = Body(...),
    simulator_title: str = Body(...),
):
    try:
        audio_name = await _cook_simulator(code, token, username, avatar, audio_b64, simulator, simulator_avatar, personality, simulator_archetype, simulator_title)
        return {'audio_url': f'{config.file_server}/materials/{audio_name}'}
    except Exception as e:
        raise e

@app.get('/api/v1/count_simulators')
async def count_simulators(code: Optional[str] = None, token: Optional[str] = None):
    return await _count_simulators(code, token)

@app.get('/api/v1/simulators')
async def get_simulators(code: Optional[str] = None, token: Optional[str] = None, offset: int = 0, limit: int = 100):
    simulators = await _get_simulators(code, token, offset, limit)
    return [{
        **simulator,
        'audio_url': f'{config.file_server}/materials/{simulator["audio_file_cid"]}.wav',
        'simulator_avatar_url': f'{config.file_server}/avatars/simulator/{simulator["simulator_avatar_cid"]}',
        'wechat_avatar_url': f'{config.file_server}/avatars/wechat/{simulator["wechat_avatar"]}'
    } for simulator in simulators]

@app.post('/api/v1/review_simulator')
async def review_simulator(simulator: str = Body(...), code: str = Body(default=None), token: str=Body(default=None), state: str = Body(...)):
    return await _review_simulator(simulator, code, token, state)

@app.post('/api/v1/report_simulator')
async def report_simulator(simulator: str = Body(...), code: str = Body(default=None), token: str=Body(default=None)):
    return await _report_simulator(simulator, code, token)

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
    audio_file_cid = await audio_generator.generate_audio(text, voice)

    return {'audio_url': f'{config.file_server}/audios/{audio_file_cid}.wav'}

@app.post('/api/v1/speak_async', response_model=SpeakAsyncResponse)
async def speak_async_v1(
    text: str = Body(...),
    voice: str = Body(...),
):
    audio_uid = await audio_generator.generate_audio_async(text, voice)

    return {'audio_uid': audio_uid}

@app.post('/api/v2/speak_async', response_model=SpeakAsyncResponse)
async def speak_async_v2(
    text: str = Body(...),
    voice: str = Body(...),
):
    audio_uid = await audio_generator.generate_audio_async_v2(text, voice)

    return {'audio_uid': audio_uid}

@app.post('/api/v3/speak_async', response_model=SpeakAsyncResponse)
async def speak_async_v3(
    text: str = Body(...),
    voice: str = Body(...),
    instruct: str = Body(...),
):
    audio_uid = await audio_generator.generate_audio_async_v3(text, voice, instruct)

    return {'audio_uid': audio_uid}

@app.get('/api/v1/audios/{audio_uid}', response_model=QueryAudioResponse)
async def query_audio(audio_uid: str):
    audio = db.get_audio(audio_uid)
    return {
        'audio_url': f'{config.file_server}/audios/{audio["audio_file_cid"]}.wav' if audio['audio_file_cid'] is not None and len(audio['audio_file_cid']) > 0 else None,
        'settled': audio['settled'],
        'error': audio['error']
    }

@app.post('/api/v1/generate_image_async', response_model=GenerateImageAsyncResponse)
async def generate_image_async(
    prompt: str = Body(..., embed=True),
    high_resolution: bool = Body(...),
    ratio: str = Body(...),
):
    image_uid = await image_generator.generate_image_async(prompt, high_resolution, ratio)

    return {'image_uid': image_uid}

@app.get('/api/v1/images/{image_uid}', response_model=QueryImageResponse)
async def query_image(image_uid: str):
    image = db.get_image(image_uid)
    return {
        'image_url': f'{config.file_server}/images/{image["image_file_cid"]}.png' if image['image_file_cid'] is not None and len(image['image_file_cid']) > 0 else None,
        'settled': image['settled'],
        'error': image['error']
    }

@app.post('/api/v1/speech_to_text', response_model=SpeechToTextResponse)
async def speech_to_text(audio_b64: str = Body(..., embed=True)):
    text = await audio_2_text(audio_b64)
    return { 'text': text }

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
    return JSONResponse({'error': f'{repr(e)}'}, status_code=502)

@app.exception_handler(aiohttp.client_exceptions.ClientConnectorError)
async def connector_error_handler(request: Request, e: aiohttp.client_exceptions.ClientConnectorError):
    global errors
    host = get_client_host(request)
    with mutex:
        errors += 1
    logger.error(f'{host} - {BOLD}{request.url.path}{RESET} {RED}Connection error: {repr(e)}{RESET} ... {errors}')
    return JSONResponse({'error': f'{repr(e)}'}, status_code=502)

@app.exception_handler(aiohttp.client_exceptions.ClientResponseError)
async def connector_error_handler(request: Request, e: aiohttp.client_exceptions.ClientResponseError):
    global errors
    host = get_client_host(request)
    with mutex:
        errors += 1
    logger.error(f'{host} - {BOLD}{request.url.path}{RESET} {RED}Response error: {repr(e)}{RESET} ... {errors}')
    return JSONResponse({'error': f'{repr(e)}'}, status_code=502)

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
            return JSONResponse({'error': f'{repr(e)}'}, status_code=502)

def ignore_ssl_close_notify(loop):
    orig_handler = loop.get_exception_handler()

    def handler(loop, context):
        exc = context.get("exception")
        if (
            isinstance(exc, ssl.SSLError) and
            exc.reason == "APPLICATION_DATA_AFTER_CLOSE_NOTIFY"
        ):
            if loop.get_debug():
                logger.info("Ignoring SSL APPLICATION_DATA_AFTER_CLOSE_NOTIFY error")
                return
        if orig_handler is not None:
            orig_handler(loop, context)
        else:
            loop.default_exception_handler(context)

    loop.set_exception_handler(handler)

if __name__ == '__main__':
    app.add_middleware(ApiElapseMiddleware)
    app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'], max_age=3600)

    ignore_ssl_close_notify(asyncio.get_event_loop())

    uvicorn.run(app, host='0.0.0.0', port=config.port)
