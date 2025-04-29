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
parser.add_argument('--mysql-host', type=str, default='172.16.31.44', help='Mysql host')
parser.add_argument('--mysql-port', type=str, default='3306', help='Mysql port')
parser.add_argument('--mysql-user', type=str, default='debian-sys-maint', help='Mysql user')
parser.add_argument('--mysql-password', type=str, default='4waB4C6hbPv7cm5U', help='Mysql user')
parser.add_argument('--reviewers', type=str, default='', help='WeChat ids of reviewers')
parser.add_argument('--clean-database', action='store_true', help='Clean database') 

config = parser.parse_args()

os.makedirs(f'{config.data_dir}/audios', exist_ok=True)
os.makedirs(f'{config.data_dir}/materials', exist_ok=True)
os.makedirs(f'{config.data_dir}/avatars', exist_ok=True)

if len(config.api_token) == 0:
    print('You must provide valid api token')
    sys.exit(0)
