#!/bin/bash

# DiffRhythm

# chutes build diffrhythm_v1_2:chute --local
# docker run --gpus all --rm -it -e CHUTES_EXECUTION_CONTEXT=REMOTE -p 8900:8000 diffrhythm-v1-2:0.0.1 chutes run diffrhythm_v1_2:chute --port 8000 --dev

# chutes build diffrhythm_v1_2:chute --public --wait --debug
# chutes deploy diffrhythm_v1_2:chute --public

# ACE-STEP

# chutes build ace_step:chute --local
# docker run --gpus all --rm -it -e CHUTES_EXECUTION_CONTEXT=REMOTE -p 8900:8000 ace-step:0.0.1 chutes run ace_step:chute --port 8000 --dev

# chutes build ace_step:chute --public --wait --debug
# chutes deploy ace_step:chute --public
