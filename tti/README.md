# env python3.10.16

# Download resources
pip install kokoro ordered-set cn2an pypinyin_dict fastapi loguru uvicorn jieba soundfile bs4

# Download model
export HF_ENDPOINT=https://hf-mirror.com
huggingface-cli download --resume-download THUDM/CogView4-6B --local-dir ./pretrained_models/CogView4-6B

# run
python api_server.py
