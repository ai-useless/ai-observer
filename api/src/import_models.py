import json
import requests
import hashlib

from config import config
from db import db
from include import *

def fetch_logo_then_save(logo_url: str):
    print(f'    Downloading {BOLD}{logo_url}{RESET}')
    resp = requests.get(logo_url)

    logo_bytes = resp.content

    logo_cid = hashlib.sha256(logo_bytes).hexdigest()
    logo_path = f'{config.data_dir}/avatars/model/{logo_cid}'
    print(f'    Writting {BOLD}{logo_path}{RESET}')
    with open(logo_path, 'wb') as f:
        f.write(logo_bytes)

    return logo_cid

def main():
    with open(config.models_file, 'r', encoding='utf-8') as f:
        models = json.load(f)

    for model in models:
        print(f'\n\nImporting {BOLD}{model["name"]}{RESET} ...')

        author_logo_cid = fetch_logo_then_save(model['authorLogo'])
        model_logo_cid = fetch_logo_then_save(model['modelLogo'])
        vendor_logo_cid = fetch_logo_then_save(model['vendorLogo'])

        db.new_model(
            model['name'],
            model['endpoint'],
            model['vendor'],
            model['author'],
            author_logo_cid,
            model_logo_cid,
            vendor_logo_cid,
            model['host_model'])

if __name__ == '__main__':
    main()
