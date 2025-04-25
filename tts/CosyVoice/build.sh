#!/bin/bash

# chutes build cosy_tts:chute --local
# docker run --gpus all --rm -it -e CHUTES_EXECUTION_CONTEXT=REMOTE -p 8901:8000 cosy-tts:0.0.1 chutes run cosy_tts:chute --port 8000 --dev

# chutes build cosy_tts:chute --public --wait --debug
# chutes deploy cosy_tts:chute --public
