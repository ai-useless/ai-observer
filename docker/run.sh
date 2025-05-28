#!/bin/bash

####
## /etc/docker/daemon.json
## {
##   "registry-mirrors": ["https://docker.m.daocloud.io"]
## }
####

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
OUTPUT_DIR=$SCRIPT_DIR/.docker.output

mkdir -p $OUTPUT_DIR

API_DIR=$OUTPUT_DIR/api
WEBUI_DIR=$OUTPUT_DIR/webui
FILE_SERVER_DIR=$OUTPUT_DIR/file-server

mkdir -p $API_DIR
mkdir -p $WEBUI_DIR
mkdir -p $FILE_SERVER_DIR

cd $API_DIR

cp -v -rf $SCRIPT_DIR/../api .
cp -v -rf $SCRIPT_DIR/../common .
cp -v -rf $SCRIPT_DIR/Dockerfile.api ./Dockerfile
cp -v -rf $SCRIPT_DIR/entrypoint.sh .

docker stop meipu-agi-proxy
docker rm meipu-agi-proxy
docker rmi meipu-agi-proxy:latest
docker build . -t meipu-agi-proxy

VOLUME_NAME=meipu_agi_data

volume=$(docker volume ls -q -f name=^${VOLUME_NAME}$)
if [ "x$volume" == "x" ]; then
  docker volume create $VOLUME_NAME
fi

# docker run -d -v $VOLUME_NAME:/data \
#   -e CHUTES_API_TOKEN="$CHUTES_API_TOKEN" \
#   -e MYSQL_HOST="$MYSQL_HOST" \
#   -e MYSQL_PORT=$MYSQL_PORT \
#   -e MYSQL_USER=$MYSQL_USER \
#   -e MYSQL_PASSWORD=$MYSQL_PASSWORD \
#   -e KIKAKKZ_WECHAT_OPENID=$KIKAKKZ_WECHAT_OPENID \
#   -e FILE_SERVER=$FILE_SERVER \
#   -e CONCURRENT_AUDIO_REQUESTS=$CONCURRENT_AUDIO_REQUESTS \
#   -e AWS_ACCESS_KEY=$AWS_ACCESS_KEY \
#   -e AWS_SECRET_KEY=$AWS_SECRET_KEY \
#   -e AWS_REGION=$AWS_REGION \
#   -e AWS_BUCKET=$AWS_BUCKET \
#   -e WEAPP_MINI_ID=$WEAPP_MINI_ID \
#   -e WEAPP_MINI_SECRET=$WEAPP_MINI_SECRET \
#   -e WEAPP_WEB_ID=$WEAPP_WEB_ID \
#   -e WEAPP_WEB_SECRET=$WEAPP_WEB_SECRET \
#   -e REVIEWER_WECHAT_OPENIDS="$REVIEWER_WECHAT_OPENIDS" \
#   --name=meipu-agi-proxy \
#   -p 8099:8091 \
#   --restart always \
#   meipu-agi-proxy

cd $WEBUI_DIR

cp -v -rf $SCRIPT_DIR/../webui/quasar/* .
cp -v -rf $SCRIPT_DIR/Dockerfile.webui ./Dockerfile

apt install nodejs -y

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

nvm install 20.15.1
nvm use 20.15.1
npm install -g yarn

export NODE_OPTIONS=--max-old-space-size=8192

rm yarn.lock -rf
yarn add global @quasar/cli@latest
PATH=./node_modules/@quasar/app-vite/bin:$PATH yarn install
PATH=./node_modules/@quasar/app-vite/bin:$PATH quasar build

docker stop meipu-agi-webui
docker rm meipu-agi-webui
docker rmi meipu-agi-webui:latest
docker build . -t meipu-agi-webui

cd $FILE_SERVER_DIR
cp -v -rf $SCRIPT_DIR/Dockerfile.file-server ./Dockerfile
cp -v -rf $SCRIPT_DIR/../configuration/observer.nginx.conf .

docker stop file-server
docker rm file-server
docker rmi file-server:latest
docker build . -t file-server
