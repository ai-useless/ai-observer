import argparse
import sys
import os

parser = argparse.ArgumentParser(description='Chat proxy of AI Observer')

parser.add_argument('--port', type=int, default=80, help='API port')
parser.add_argument('--api-token', type=str, default='', help='API token of api.chutes.ai')
parser.add_argument('--data-dir', type=str, default='./.data', help='Data dir for audio/video/text, default=./.data')
parser.add_argument('--audio-host', type=str, default='http://api.meipu-ai.cn', help='Host of audio file service')
parser.add_argument('--weapp-id', type=str, default='', help='WeChat mini program id')
parser.add_argument('--weapp-secret', type=str, default='', help='WeChat mini program secret')

config = parser.parse_args()

os.makedirs(config.data_dir, exist_ok=True)

if len(config.api_token) == 0:
    print('You must provide valid api token')
    sys.exit(0)
