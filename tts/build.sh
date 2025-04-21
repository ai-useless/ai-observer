#!/bin/bash

# chutes build observer_tts:chute --local
# docker run --gpus all --rm -it -e CHUTES_EXECUTION_CONTEXT=REMOTE -p 8800:8000 observer-tts:0.0.2 chutes run observer_tts:chute --port 8000 --dev

# chutes build observer_tts:chute --public --wait --debug
# chutes deploy observer_tts:chute --public
