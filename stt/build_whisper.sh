#!/bin/bash

# Whisper

# chutes build whisper_stt:chute --local
# docker run --gpus all --rm -it -e CHUTES_EXECUTION_CONTEXT=REMOTE -p 8900:8000 whisper-stt:0.0.1 chutes run whisper_stt:chute --port 8000 --dev

# chutes build whisper_stt:chute --public --wait --debug
# chutes deploy whisper_stt:chute --public