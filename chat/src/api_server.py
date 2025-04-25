from fastapi import FastAPI, Body, Request
import uvicorn
import argparse
import requests
from pydantic import BaseModel
import os
import sys
from starlette.middleware.base import BaseHTTPMiddleware
import time
import logging

app = FastAPI()
logger = logging.getLogger('uvicorn')
BOLD = '\033[1m'
RESET = '\033[0m'

class ServerKit:
    api_token: str
    data_dir: str

    def __init__(self, api_token: str, data_dir: str):
        self.api_token = api_token
        self.data_dir = data_dir

server_kit = None

class ChatMessage(BaseModel):
    role: str
    content: str

class ModelChatChoice:
    message: ChatMessage

    def __init__(self, api_choice: dict):
        message = api_choice['message']
        self.message = ChatMessage(role=message['role'], content=message['content'])

class ModelChatResponse:
    choices: list[ModelChatChoice]

    def __init__(self, api_response: dict):
        self.choices = [ModelChatChoice(choice) for choice in api_response['choices']]

class ChatResponse(BaseModel):
    content: str | None = None

@app.post('/api/v1/chat', response_model=ChatResponse)
async def chat(
    model: str = Body(...),
    messages: list[ChatMessage] = Body(...),
    prompt: str = Body(...)
):
    url = 'https://llm.chutes.ai/v1/chat/completions'

    payload = {
        'model': model,
        'messages': [
            *messages,
            {
                'role': 'user',
                'content': prompt,
            }
        ]
    }
    headers = {
        'Authorization': f'Bearer {server_kit.api_token}',
        'Content-Type': 'application/json'
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        chat_response = ModelChatResponse(response.json())
        return { 'content': chat_response.choices[0].message.content }
    except Exception as e:
        raise e

class ApiElapseMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_at = time.time()
        response = await call_next(request)
        logger.info(f'Invoke {BOLD}{request.url}{RESET} take {BOLD}{time.time() - start_at}{RESET}s')
        return response

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Chat proxy of AI Observer')

    parser.add_argument('--port', type=int, default=80, help='API port')
    parser.add_argument('--api-token', type=str, default='', help='API token of api.chutes.ai')
    parser.add_argument('--data-dir', type=str, default='./.data', help='Data dir for audio/video/text, default=./.data')

    args = parser.parse_args()

    os.makedirs(args.data_dir, exist_ok=True)
    server_kit = ServerKit(args.api_token, args.data_dir)

    if len(args.api_token) == 0:
        print('You must provide valid api token')
        sys.exit(0)

    app.add_middleware(ApiElapseMiddleware)
    uvicorn.run(app, host='0.0.0.0', port=args.port)
