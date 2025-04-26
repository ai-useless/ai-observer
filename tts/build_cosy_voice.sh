#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
OUTPUT_DIR=$SCRIPT_DIR/.chutes.output

mkdir -p $OUTPUT_DIR

rm -rf $OUTPUT_DIR/cosy-voice
cp -rfv $SCRIPT_DIR/src/cosy-voice $OUTPUT_DIR/cosy-voice
cp -rfv $SCRIPT_DIR/src/utils/utils.py $OUTPUT_DIR/cosy-voice

images=`docker images | grep 'cosy\|none' | awk '{print $3}'`
[ "x$images" != "x" ] && docker rmi $images

cd $OUTPUT_DIR/cosy-voice

# CosyVoice
chutes build cosy_voice_tts:chute --local
# docker run --gpus all --rm -it -e CHUTES_EXECUTION_CONTEXT=REMOTE -p 8800:8000 cosy-voice-tts:0.0.2 chutes run cosy_voice_tts:chute --port 8000 --dev

# chutes build cosy_voice_tts:chute --public --wait --debug
# chutes deploy cosy_voice_tts:chute --public
