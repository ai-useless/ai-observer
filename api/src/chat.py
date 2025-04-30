from pydantic import BaseModel
import aiohttp
import json

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

    logger.info(f'{BOLD}{model}{RESET} {BOLD}Requesting{RESET} ...')

    timeout = aiohttp.ClientTimeout(connect=10, total=30)
    content = ''

    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(url, json=payload, timeout=timeout, headers=headers) as response:
            async for chunk in response.content.iter_any():
                text = chunk.decode('utf-8').strip()
                if text.startswith('data:'):
                    json_str = text[len('data:'):].strip()
                    if json_str == '[DONE]':
                        logger.info(f'{BOLD}{model}{RESET} {BOLD}Response {content[0:32]}{RESET} ...')
                        return content

                    obj = json.loads(json_str)
                    chat_response = ModelChatResponse(obj)

                    choice = chat_response.choices[0]
                    if choice.message is None or choice.message.content is None:
                        continue
                    content += chat_response.choices[0].message.content
