# env python3.10.16

# Download resources
pip install kokoro ordered-set cn2an pypinyin_dict fastapi loguru uvicorn jieba soundfile bs4

# Download model
export HF_ENDPOINT=https://hf-mirror.com
huggingface-cli download --resume-download hexgrad/Kokoro-82M-v1.1-zh --local-dir ./ckpts/kokoro-v1.1-zh

# run
python api_server.py
