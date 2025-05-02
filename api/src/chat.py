from pydantic import BaseModel
import aiohttp
import json
import time

from config import config
from include import *

class ChatMessage(BaseModel):
    role: str
    content: str

class ModelChatChoice:
    message: ChatMessage

    def __init__(self, api_choice: dict):
        message = api_choice['delta']
        if message['content'] is None:
            self.message = None
            return
        self.message = ChatMessage(role=message['role'] if 'role' in message and message['role'] is not None else 'assistant', content=message['content'])

class ModelChatResponse:
    choices: list[ModelChatChoice]

    def __init__(self, api_response: dict):
        self.choices = [ModelChatChoice(choice) for choice in api_response['choices']]

async def chat(
    model: str,
    messages: list[ChatMessage],
    prompt: str
):
    url = 'https://llm.chutes.ai/v1/chat/completions'
    # url = 'http://47.238.224.37:8091/v1/chat/completions'

    payload = {
        'model': model,
        'messages': [
            *[{ 'role': message.role, 'content': message.content } for message in messages],
            {'role': 'user', 'content': prompt}
        ],
        'stream': True,
        'max_tokens': 1024,
    }
    headers = {
        'Authorization': f'Bearer {config.api_token}',
        'Content-Type': 'application/json'
    }

    start_time = time.time()
    logger.info(f'{BOLD}{model}{RESET} {BOLD}Requesting{RESET} ...')

    timeout = aiohttp.ClientTimeout(connect=10, total=59)
    content = ''

    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(url, json=payload, timeout=timeout, headers=headers) as response:
            async for chunk in response.content.iter_any():
                text = chunk.decode('utf-8').strip()
                for line in text.splitlines():
                    if line.startswith('data:'):
                        json_str = line[len('data:'):].strip()
                        if json_str == '[DONE]':
                            logger.info(f'{BOLD}{model}{RESET} {BOLD}Response {content[0:16]}{RESET} ...')
                            return content

                        try:
                            obj = json.loads(json_str)
                        except Exception as e:
                            logger.error(f'{BOLD}{model}{RESET} {RED}{json_str}{RESET} ... {e}')
                            continue

                        chat_response = ModelChatResponse(obj)

                        if chat_response.choices is None or len(chat_response.choices) == 0:
                            logger.error(f'{BOLD}{model}{RESET} {RED}{json_str}{RESET} ... Invalid message')
                            continue

                        choice = chat_response.choices[0]
                        if choice.message is None or choice.message.content is None:
                            continue
                        content += chat_response.choices[0].message.content

    logger.error(f'{BOLD}{model}{RESET} {RED}You should not be here{RESET} ... {BOLD}{time.time() - start_time}{RESET}s')
