#!/bin/bash

python3.12 ./src/api_server.py --api-token $CHUTES_API_TOKEN --data-dir /data --mysql-host $MYSQL_HOST --mysql-port $MYSQL_PORT --mysql-user $MYSQL_USER --mysql-password $MYSQL_PASSWORD --kikakkz-wechat-openid $KIKAKKZ_WECHAT_OPENID --file-server $FILE_SERVER --concurrent-audio-requests $CONCURRENT_AUDIO_REQUESTS --aws-access-key $AWS_ACCESS_KEY --aws-secret-key $AWS_SECRET_KEY --aws-region $AWS_REGION --aws-bucket $AWS_BUCKET --weapp-mini-id $WEAPP_MINI_ID --weapp-mini-secret $WEAPP_MINI_SECRET --weapp-web-id $WEAPP_WEB_ID --weapp-web-secret $WEAPP_WEB_SECRET --reviewer-wechat-openids $REVIEWER_WECHAT_OPENIDS --port 8091

