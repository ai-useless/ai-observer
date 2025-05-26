#!/bin/bash

####
## /etc/docker/daemon.json
## {
##   "registry-mirrors": ["https://docker.m.daocloud.io"]
## }
####

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
OUTPUT_DIR=$SCRIPT_DIR/.api.output

mkdir -p $OUTPUT_DIR
cd $OUTPUT_DIR

cp -v $SCRIPT_DIR/../api/* .
cp -v $SCRIPT_DIR/Dockerfile .
cp -v $SCRIPT_DIR/entrypoint.sh .

docker build . -t meipu-proxy

VOLUME_NAME=meipu-data

volume=$(docker volume ls -q -f name=^${VOLUME_NAME}$)
if [ "x$volume" == "x" ]; then
  docker volume create $VOLUME_NAME
fi

docker run -d -v $VOLUME_NAME:/data --name=meipu-proxy -p 8091:8091 --restart always meipu-proxy
