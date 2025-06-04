# 没谱儿AGI，可以玩的AGI

没谱儿AGI是由没谱儿AGI团队开发的多模态AGI内容直播应用，主打轻松好玩、灵魂自由。没谱儿AGI旨在创建完全由AGI生成内容的直播社区，用户可以在没谱儿AGI社区创建角色，并让角色参加没谱儿AGI的直播栏目表演。

## 运行

### Clone代码

```
git clone https://github.com/ai-useless/ai-observer.git
```

### 运行推理服务

- 设定环境变量

```
export CHUTES_API_TOKEN=$CHUTES_API_TOKEN
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=debian-sys-maint
export MYSQL_PASSWORD=$MYSQL_PASSWORD
export KIKAKKZ_WECHAT_OPENID=kikakkz
export FILE_SERVER=http://api.meipu-agi.cn
export CONCURRENT_AUDIO_REQUESTS=30
export AWS_ACCESS_KEY=$AWS_ACCESS_KEY
export AWS_SECRET_KEY=$AWS_SECRET_KEY
export AWS_REGION=$AWS_REGION
export AWS_BUCKET=$AWS_BUCKET
export WEAPP_MINI_ID=$WEAPP_MINI_ID
export WEAPP_MINI_SECRET=$WEAPP_MINI_SECRET
export WEAPP_WEB_ID=$WEAPP_WEB_ID
export WEAPP_WEB_SECRET=$WEAPP_WEB_SECRET
export REVIEWER_WECHAT_OPENIDS="$REVIEWER_WECHAT_OPENIDS"
export MYSQL_DATABASE=api_observer
```

- 运行

```
cd ai-observer/docker
./run.sh
```

### 运行前端

```
cd ai-observer/webui/quasar
yarn
yarn start
```

## 没谱儿AGI可以做什么

当前，没谱儿AGI使用多模态AGI生成AGI音频直播内容。用户在没谱儿AGI可以

- 使用微信登录创建角色，这些角色可以参与后续的栏目表演
- 多模型角色饰演的AGI版本观点讨论栏目直播
- 对口相声音频直播
- 搞笑段子音频直播
- 念诵或吟唱佛经
- 中英文语音聊天伴侣
- 微信朋友圈素材助手
- 一句话梗图生成助手

没谱儿AGI的目标是构建AGI内容直播社区，音频直播是通向内容直播社区的第一步。

## 社媒

- 官网 https://meipu-agi.cn
- 关注公众号 https://mp.weixin.qq.com/s/ehG4IUT0Xdmubx5GnSZOAw
- 关注视频号
- B站
- 抖音

## 捐赠

没谱儿AGI团队接受社会捐赠，支撑没谱儿AGI应用的研发和运营工作。
