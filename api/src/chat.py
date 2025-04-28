from pydantic import BaseModel
import aiohttp

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
        ]
    }
    headers = {
        'Authorization': f'Bearer {server_kit.api_token}',
        'Content-Type': 'application/json'
    }

    timeout = aiohttp.ClientTimeout(connect=10, total=30)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(url, json=payload, timeout=timeout, headers=headers) as response:
            response.raise_for_status()
            chat_response = ModelChatResponse(await response.json())
            return chat_response.choices[0].message.content
