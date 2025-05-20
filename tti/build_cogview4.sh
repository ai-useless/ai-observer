#!/bin/bash

# CogView4

# chutes build cogview4_tti:chute --local
# docker run --gpus all --rm -it -e CHUTES_EXECUTION_CONTEXT=REMOTE -p 8900:8000 cogview4-tti:0.0.1 chutes run cogview4_tti:chute --port 8000 --dev

# chutes build cogview4_tti:chute --public --wait --debug
# chutes deploy cogview4_tti:chute --public

# chutes build cogview4:chute --local
# docker run --gpus all --rm -it -e CHUTES_EXECUTION_CONTEXT=REMOTE -p 8900:8000 cogview4:0.0.1 chutes run cogview4:chute --port 8000 --dev

# chutes build cogview4:chute --public --wait --debug
# chutes deploy cogview4:chute --public


# HiDream-I1-Fast

# chutes build hidream_i1_fast:chute --local
# docker run --gpus all --rm -it -e CHUTES_EXECUTION_CONTEXT=REMOTE -p 8900:8000 hidream-i1-fast:0.0.1 chutes run hidream_i1_fast:chute --port 8000 --dev

# chutes build hidream_i1_fast:chute --public --wait --debug
# chutes deploy hidream_i1_fast:chute --public


# HiDream-I1-Full

# chutes build hidream_i1_full:chute --local
# docker run --gpus all --rm -it -e CHUTES_EXECUTION_CONTEXT=REMOTE -p 8900:8000 hidream-i1-full:0.0.1 chutes run hidream_i1_full:chute --port 8000 --dev

# chutes build hidream_i1_full:chute --public --wait --debug
# chutes deploy hidream_i1_full:chute --public
