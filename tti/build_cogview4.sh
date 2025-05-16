#!/bin/bash

# CogView4

# chutes build cogview4_tti:chute --local
# docker run --gpus all --rm -it -e CHUTES_EXECUTION_CONTEXT=REMOTE -p 8900:8000 cogview4-tti:0.0.1 chutes run cogview4_tti:chute --port 8000 --dev

# chutes build cogview4_tti:chute --public --wait --debug
# chutes deploy cogview4_tti:chute --public