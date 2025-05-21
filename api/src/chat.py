from pydantic import BaseModel
import aiohttp
import json
import time
import uuid

from config import config
from include import *
from db import db

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
        if 'choices' not in api_response:
            self.choices = []
            return
        self.choices = [ModelChatChoice(choice) for choice in api_response['choices']]

async def chat(
    model: str,
    messages: list[ChatMessage],
    prompt: str
):
    _model = db.get_model_with_name(model)
    if _model is None:
        raise Exception('Invalid model')

    url = 'https://llm.chutes.ai/v1/chat/completions'
    # url = 'http://47.238.224.37:8091/v1/chat/completions'

    max_tokens = _model['max_tokens'] if 'max_tokens' in _model else 32768

    max_tokens = max_tokens - sum(len(message.content) for message in messages) - len(prompt)
    if max_tokens <= 512:
        raise Exception('Too many tokens')

    payload = {
        'model': model,
        'messages': [
            *[{ 'role': message.role, 'content': message.content } for message in messages],
            {'role': 'user', 'content': prompt}
        ],
        'stream': True,
        'max_tokens': max_tokens,
        'temperature': 0.8
    }
    headers = {
        'Authorization': f'Bearer {config.api_token}',
        'Content-Type': 'application/json'
    }

    start_time = time.time()
    chat_uid = f'{uuid.uuid4()}'

    logger.info(f'{BOLD}{model} - {chat_uid}{RESET} {BOLD}Requesting{RESET} ...')

    timeout = aiohttp.ClientTimeout(connect=10, total=59)
    content = ''
    raw_chunk = b''
    raw_chunks = b''

    async with aiohttp.ClientSession(timeout=timeout, raise_for_status=True) as session:
        async with session.post(url, json=payload, timeout=timeout, headers=headers) as response:
            async for chunk in response.content.iter_any():
                raw_chunks += chunk
                try:
                    text = chunk.decode('utf-8').strip()
                except Exception as e:
                    # logger.warn(f'{BOLD}{model} - {chat_uid}{RESET} {RED}{chunk}{RESET} ... {e}')
                    raw_chunk += chunk
                    continue

                if len(raw_chunk) > 0:
                    raw_text = ''
                    try:
                        raw_text = chunk.decode('utf-8').strip() + '\n'
                    except:
                        logger.warn(f'{BOLD}{model} - {chat_uid}{RESET} {RED}Discard chunk{RESET}: {raw_chunk}')

                    text = raw_text + text
                    raw_chunk = b''

                for line in text.splitlines():
                    line = line.strip()

                    if len(line) == 0:
                        continue

                    if line.startswith('data:'):
                        json_str = line[len('data:'):].strip()
                        if 'DONE' in json_str:
                            logger.info(f'{BOLD}{model} - {chat_uid}{RESET} {BOLD}Response {content[0:16]}{RESET} ...')
                            return content

                        try:
                            obj = json.loads(json_str)
                        except Exception as e:
                            # logger.warn(f'{BOLD}{model} - {chat_uid}{RESET} {RED}{json_str}{RESET} ... {e}')
                            raw_chunk += chunk
                            continue

                        # We may have error in object here
                        if 'error' in obj and 'object' in obj['error'] and obj['error']['object'] == 'error':
                            if 'message' in obj['error']['object']:
                                logger.error(f'{BOLD}{model} - {chat_uid}{RESET} {RED}{obj["error"]["message"]}{RESET}')
                                raise Exception(f'Response error: {obj["error"]["message"]}')
                            logger.error(f'{BOLD}{model} - {chat_uid}{RESET} {RED}{obj["error"]}{RESET}')
                            raise Exception(f'Response error: {obj["error"]}')

                        chat_response = ModelChatResponse(obj)

                        if chat_response.choices is None or len(chat_response.choices) == 0:
                            logger.warn(f'{BOLD}{model} - {chat_uid}{RESET} {RED}{json_str}{RESET} ... choices is missing')
                            continue

                        choice = chat_response.choices[0]
                        if choice.message is None or choice.message.content is None:
                            continue
                        content += chat_response.choices[0].message.content
                    else:
                        try:
                            obj = json.loads(line)
                        except Exception as e:
                            raw_chunk += chunk
                            continue

                        if 'object' in obj and obj['object'] == 'error':
                            logger.error(f'{BOLD}{model} - {chat_uid}{RESET} {RED}{obj["message"]}{RESET}')
                            raise Exception(f'Response error: {obj["message"]}')
                        if 'error' in obj and 'object' in obj['error'] and obj['error']['object'] == 'error':
                            if 'message' in obj['error']['object']:
                                logger.error(f'{BOLD}{model} - {chat_uid}{RESET} {RED}{obj["error"]["message"]}{RESET}')
                                raise Exception(f'Response error: {obj["error"]["message"]}')
                            logger.error(f'{BOLD}{model} - {chat_uid}{RESET} {RED}{obj["error"]}{RESET}')
                            raise Exception(f'Response error: {obj["error"]}')
                        if 'status' in obj and obj['status'] == 500:
                            logger.error(f'{BOLD}{model} - {chat_uid}{RESET} {RED}{line}{RESET}')
                            raise Exception(f'Response error: {line}')

                        logger.warn(f'Object without {BOLD}data{RESET} or {BOLD}error{RESET}: {line}')

    logger.error(f'{BOLD}{model} - {chat_uid}{RESET} {RED}You should not be here{RESET} ... {content}{BOLD}{time.time() - start_time}{RESET}s')
    logger.error(f'{BOLD}{model} - {chat_uid}{RESET} {BOLD}Raw{RESET}: {raw_chunks} ...')
    raise Exception(f'Invalid response: {content}')
