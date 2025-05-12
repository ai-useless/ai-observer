#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
OUTPUT_DIR=$SCRIPT_DIR/.chutes.output

mkdir -p $OUTPUT_DIR

rm -rf $OUTPUT_DIR/cosy-voice
cp -rfv $SCRIPT_DIR/src/cosy-voice $OUTPUT_DIR/cosy-voice
cp -rfv $SCRIPT_DIR/../common/purify_text.py $OUTPUT_DIR/cosy-voice

images=`docker images | grep 'cosy\|none' | awk '{print $3}'`
[ "x$images" != "x" ] && docker rmi $images

cd $OUTPUT_DIR/cosy-voice

# CosyVoice
chutes build cosy_voice_tts:chute --local

mkdir $OUTPUT_DIR/cache -p
chown 1000:1000 $OUTPUT_DIR/cache -R

mkdir $OUTPUT_DIR/pretrained_models -p
chown 1000:1000 $OUTPUT_DIR/pretrained_models -R

<<<<<<< HEAD
# docker run --gpus all --rm -it -v $OUTPUT_DIR/cache:/home/chutes/.cache -v $OUTPUT_DIR/pretrained_models:/app/pretrained_models --user 1000:1000 -e CHUTES_EXECUTION_CONTEXT=REMOTE -p 8800:8000 cosy-voice-tts:0.0.3 chutes run cosy_voice_tts:chute --port 8000 --dev

chutes build cosy_voice_tts:chute --public --wait --debug
=======
echo docker run --gpus all --rm -it -v $OUTPUT_DIR/cache:/home/chutes/.cache -v $OUTPUT_DIR/pretrained_models:/app/pretrained_models --user 1000:1000 -e CHUTES_EXECUTION_CONTEXT=REMOTE -p 8800:8000 cosy-voice-tts:0.0.6 chutes run cosy_voice_tts:chute --port 8000 --dev

# chutes build cosy_voice_tts:chute --public --wait --debug
>>>>>>> 1bfe8209e3e31ec69acb42c0fddfc13eca4bb5ca
# chutes deploy cosy_voice_tts:chute --public
