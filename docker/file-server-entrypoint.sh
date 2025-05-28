#!/bin/bash

mkdir -p /data/downloads

curl -L -o /data/downloads/qiaomuyu.mp3 https://github.com/hong-t/voices/raw/refs/heads/master/qiaomuyu.mp3
curl -L -o /data/downloads/qing.mp3 https://github.com/hong-t/voices/raw/refs/heads/master/qing.mp3
curl -L -o /data/downloads/laugh.mp3 https://github.com/hong-t/voices/raw/refs/heads/master/laugh.mp3
curl -L -o /data/downloads/qiaomuyu.gif https://github.com/hong-t/avatars/raw/refs/heads/master/qiaomuyu.gif
curl -L -o /data/downloads/xiangshengwutai.png https://github.com/hong-t/avatars/raw/refs/heads/master/xiangshengwutai.png
curl -L -o /data/downloads/yuanzhuotaolun.png https://github.com/hong-t/avatars/raw/refs/heads/master/yuanzhuotaolun.png

nginx -g daemon off;
