#!/bin/bash

## Kokoro

# chutes build kokoro_tts:chute --local
# docker run --gpus all --rm -it -e CHUTES_EXECUTION_CONTEXT=REMOTE -p 8800:8000 kokoro-tts:0.0.2 chutes run kokoro_tts:chute --port 8000 --dev

# chutes build kokoro_tts:chute --public --wait --debug
# chutes deploy kokoro_tts:chute --public

# CosyVoice

# chutes build cosy_voice_tts:chute --local
# docker run --gpus all --rm -it -e CHUTES_EXECUTION_CONTEXT=REMOTE -p 8800:8000 cosy-voice-tts:0.0.2 chutes run cosy_voice_tts:chute --port 8000 --dev

# chutes build cosy_voice_tts:chute --public --wait --debug
