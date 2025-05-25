#!/bin/bash

####
## /etc/docker/daemon.json
## {
##   "registry-mirrors": ["https://docker.m.daocloud.io"]
## }
####

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
OUTPUT_DIR=$SCRIPT_DIR/.meme.output

mkdir -p $OUTPUT_DIR
cd $OUTPUT_DIR
git clone https://github.com/MemeCrafters/meme-generator-rs.git
cd meme-generator-rs

docker build . -t meme-generator-rs

VOLUME_NAME=meme-images

volume=$(docker volume ls -q -f name=^${VOLUME_NAME}$)

docker run -d --name=meme-generate-rs -p 2233:2233 --restart always meme-generator-rs
