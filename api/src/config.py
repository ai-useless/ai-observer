import argparse
import sys
import os

parser = argparse.ArgumentParser(description='Chat proxy of AI Observer')

parser.add_argument('--port', type=int, default=80, help='API port')
parser.add_argument('--api-token', type=str, default='', help='API token of api.chutes.ai')
parser.add_argument('--data-dir', type=str, default='./.data', help='Data dir for audio/video/text, default=./.data')
parser.add_argument('--file-server', type=str, default='http://api.meipu-ai.cn', help='Host of audio file service')
parser.add_argument('--weapp-id', type=str, default='', help='WeChat mini program id')
parser.add_argument('--weapp-secret', type=str, default='', help='WeChat mini program secret')
parser.add_argument('--mysql-host', type=str, default='127.0.0.1', help='Mysql host')
parser.add_argument('--mysql-port', type=str, default='3306', help='Mysql port')
parser.add_argument('--mysql-user', type=str, default='debian-sys-maint', help='Mysql user')
parser.add_argument('--mysql-password', type=str, default='oWAtnx0wdypj4gSI', help='Mysql user')
parser.add_argument('--reviewers', type=str, default='', help='WeChat ids of reviewers')
parser.add_argument('--models-file', type=str, default='./models.json', help='Models in json format')
parser.add_argument('--simulators-file', type=str, default='./simulators.json', help='Simulators in json format')
parser.add_argument('--clean-database', action='store_true', help='Clean database')
parser.add_argument('--ignore-api-token', action='store_true', help='Ignore api token')
parser.add_argument('--kikakkz-wechat-openid', type=str, default='', help='WeChat openid of kikakkz')
parser.add_argument('--concurrent-audio-requests', type=int, default=5, help='Concurrent audio requests')

config = parser.parse_args()

os.makedirs(f'{config.data_dir}/audios', exist_ok=True)
os.makedirs(f'{config.data_dir}/materials', exist_ok=True)
os.makedirs(f'{config.data_dir}/avatars/wechat', exist_ok=True)
os.makedirs(f'{config.data_dir}/avatars/simulator', exist_ok=True)
os.makedirs(f'{config.data_dir}/avatars/model', exist_ok=True)

if len(config.api_token) == 0 and config.ignore_api_token is False:
    print('You must provide valid api token')
    sys.exit(0)
