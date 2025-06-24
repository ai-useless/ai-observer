from pydantic import BaseModel, Field
from chutes.image import Image
from chutes.chute import Chute, NodeSelector

image = (
    Image(
        username="kikakkz",
        name="deepseek-r1-70b",
        tag="0.0.1",
        readme="## LLM using deepseek-ai/DeepSeek-R1",
    )
    .from_base("parachutes/base-python:3.10.17")
    .set_user("root")
    .run_command("apt update")
    .apt_install(["git-lfs", "sox", "libsox-dev"])
    .run_command("apt-get update")
    .set_user("chutes")
    .run_command("pip install --upgrade pip")
    .run_command("pip install fastapi>=0.95.0 uvicorn>=0.22.0 transformers>=4.35.0 torch>=2.0.0  accelerate==1.7.0")
)

chute = Chute(
    username="kikakkz",
    name="deepseek-r1-70b",
    tagline="LLM with deepseek-ai/DeepSeek-R1",
    readme="deepseek-ai/DeepSeek-R1",
    image=image,
    node_selector=NodeSelector(gpu_count=4, min_vram_gpu_per_gpu=140),
)

class V1InputArgs(BaseModel):
    model: str = "deepseek-ai/DeepSeek-R1"
    messages: list = Field(..., min_length=1)
    temperature: float = Field(0.7, gt=0.0, le=2.0)
    max_new_tokens: int = Field(1024, gt=1, le=10000)
    stream: bool = False

@chute.on_startup()
async def initialize(self):
    import os
    from pathlib import Path
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer

    MODEL_DIR = Path(os.getenv("HF_HOME", "/app")).resolve()
    MODEL_PATH = (Path(MODEL_DIR) / "DeepSeek-R1-Distill-Llama-70B").resolve()

    from huggingface_hub import snapshot_download
    snapshot_download('deepseek-ai/DeepSeek-R1-Distill-Llama-70B', local_dir=str(MODEL_PATH))

    self.tokenizer = AutoTokenizer.from_pretrained(str(MODEL_PATH))
    self.model = AutoModelForCausalLM.from_pretrained(
        str(MODEL_PATH),
        device_map="auto",
        torch_dtype=torch.bfloat16 if torch.cuda.is_available() else "auto"
    )

    self.tokenizer.pad_token = self.tokenizer.eos_token
    self.model.config.pad_token_id = self.tokenizer.eos_token_id

@chute.cord(
    path="/v1/chat/completions",
    passthrough_path="/v1/chat/completions",
    public_api_path="/v1/chat/completions",
    public_api_method="POST"
)
async def generate_v1(self, args: V1InputArgs):
    import time
    from transformers import TextIteratorStreamer
    from threading import Thread
    import uuid
    start_time = time.time()
    conversation = "\n".join(
        [f"{msg['role']}: {msg['content']}" for msg in args.messages]
    )
    inputs = self.tokenizer(
        conversation,
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=4096,
        return_attention_mask=True
    ).to(self.model.device)

    generate_kwargs = {
        "inputs": inputs.input_ids,
        "max_new_tokens": args.max_new_tokens,
        "temperature": args.temperature,
        "do_sample": True,
        "pad_token_id": self.tokenizer.eos_token_id,
        "attention_mask": inputs.attention_mask
    }

    id = str(uuid.uuid4()).replace("-", "")
    if args.stream:
        from fastapi.responses import StreamingResponse
        import json

        def stream_generator():
            streamer = TextIteratorStreamer(self.tokenizer)
            generation_kwargs = {
                **generate_kwargs,
                "streamer": streamer
            }

            thread = Thread(target=self.model.generate, kwargs=generation_kwargs)
            thread.start()

            for token in streamer:
                chunk = {
                    "id": id,
                    "object": "chat.completion.chunk",
                    "created": int(time.time()),
                    "model": args.model,
                    "choices": [{
                        "index": 0,
                        "delta": {
                            "role": None,
                            "content": token,
                            "reasoning_content": None,
                            "tool_calls": None
                        },
                        "logprobs": None,
                        "finish_reason": None,
                        "matched_stop": None
                    }],
                    "usage": None
                }
                yield f"data: {json.dumps(chunk)}\n\n"

            yield "data: [DONE]\n\n"

        return StreamingResponse(
            stream_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        )

    else:
        outputs = self.model.generate(**generate_kwargs)
        generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)

        latency = time.time() - start_time
        prompt_tokens = len(inputs.input_ids[0])
        total_tokens = len(outputs[0])

        return {
            "id": id,
            "object": "chat.completion",
            "created": int(time.time()),
            "model": args.model,
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": generated_text,
                    "reasoning_content": None,
                    "tool_calls": None
                },
                "logprobs": None,
                "finish_reason": "length",
                "matched_stop": None
            }],
            "usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": total_tokens - prompt_tokens,
                "total_tokens": total_tokens,
                "prompt_tokens_details": None
            },
            "latency": f"{latency:.2f}s"
        }
