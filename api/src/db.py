import mysql.connector
import warnings
from config import config
import time
import json
import threading


class Db:
    def __init__(self):
        self.db_name = 'ai_observer'
        self.table_bans = 'bans'
        self.table_simulators = 'simulators'
        self.table_users = 'users'
        self.table_models = 'models'
        self.table_audios = 'audios'
        self.table_images = 'images'

        self.config = {
            'user': config.mysql_user,
            'password': config.mysql_password,
            'host': config.mysql_host,
            'port': config.mysql_port,
            'raise_on_warnings': False, # TODO: Test with alchemy
        }

        # TODO: use alchemy in feature
        warnings.filterwarnings("ignore", category=UserWarning)

        self.connection = mysql.connector.connect(**self.config)
        cursor = self.connection.cursor()

        cursor.execute('SHOW DATABASES')
        databases = [row[0] for row in cursor.fetchall()]

        if config.clean_database is True:
            if self.db_name in databases:
                cursor.execute(f'DROP DATABASE {self.db_name}')
                self.connection.commit()

        cursor.execute('SHOW DATABASES')
        databases = [row[0] for row in cursor.fetchall()]

        if self.db_name not in databases:
            cursor.execute(f'CREATE DATABASE IF NOT EXISTS {self.db_name}')
            self.connection.commit()

        cursor.close()
        self.connection.close()

        self.config['database'] = self.db_name

        self.connection = mysql.connector.connect(**self.config)
        cursor = self.connection.cursor()

        cursor.execute('SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;')

        cursor.close()
        cursor = self.connection.cursor()

        cursor.execute('SHOW TABLES')
        tables = [row[0] for row in cursor.fetchall()]

        if self.table_bans not in tables:
            cursor.execute(f'''
                CREATE TABLE IF NOT EXISTS {self.table_bans} (
                    wechat_openid VARCHAR(32),
                    ban_by_reason VARCHAR(16),
                    ban_by_id VARCHAR(256),
                    timestamp INT UNSIGNED,
                    resolved TINYINT,
                    PRIMARY KEY (wechat_openid, ban_by_id)
                )
            ''')
            self.connection.commit()

        cursor.close()
        cursor = self.connection.cursor()

        if self.table_simulators not in tables:
            cursor.execute(f'''
                CREATE TABLE IF NOT EXISTS {self.table_simulators} (
                    id INT AUTO_INCREMENT NOT NULL,
                    wechat_openid VARCHAR(32),
                    wechat_username VARCHAR(128),
                    wechat_avatar VARCHAR(1024),
                    audio_id VARCHAR(64) UNIQUE,
                    audio_file_cid VARCHAR(256) UNIQUE,
                    audio_url VARCHAR(1024),
                    text VARCHAR(512),
                    simulator VARCHAR(32) UNIQUE,
                    simulator_avatar_cid VARCHAR(64) UNIQUE,
                    origin_personality VARCHAR(256),
                    archetype VARCHAR(64),
                    title VARCHAR(64),
                    timestamp INT UNSIGNED,
                    state VARCHAR(16),
                    host TINYINT,
                    PRIMARY KEY (id)
                )
            ''')
            self.connection.commit()

        cursor.close()
        cursor = self.connection.cursor()

        if self.table_users not in tables:
            cursor.execute(f'''
                CREATE TABLE IF NOT EXISTS {self.table_users} (
                    wechat_openid VARCHAR(32),
                    wechat_username VARCHAR(128),
                    wechat_avatar VARCHAR(1024),
                    timestamp INT UNSIGNED,
                    PRIMARY KEY (wechat_openid)
                )
            ''')
            self.connection.commit()

        cursor.close()
        cursor = self.connection.cursor()

        if self.table_models not in tables:
            cursor.execute(f'''
                CREATE TABLE IF NOT EXISTS {self.table_models} (
                    id INT AUTO_INCREMENT NOT NULL,
                    name VARCHAR(256),
                    endpoint VARCHAR(1024),
                    vendor VARCHAR(64),
                    author VARCHAR(64),
                    author_logo VARCHAR(256),
                    model_logo VARCHAR(256),
                    vendor_logo VARCHAR(256),
                    host_model TINYINT,
                    timestamp INT UNSIGNED,
                    PRIMARY KEY (id),
                    UNIQUE KEY vendor_model (name, vendor)
                )
            ''')
            self.connection.commit()

        cursor.close()
        cursor = self.connection.cursor()

        if self.table_audios not in tables:
            cursor.execute(f'''
                CREATE TABLE IF NOT EXISTS {self.table_audios} (
                    audio_uid VARCHAR(64),
                    audio_file_cid VARCHAR(256),
                    settled TINYINT,
                    error VARCHAR(256),
                    timestamp INT UNSIGNED,
                    PRIMARY KEY (audio_uid)
                )
            ''')
            self.connection.commit()

        cursor.close()
        cursor = self.connection.cursor()

        cursor.execute(f'''
            UPDATE {self.table_audios} SET settled=1, error="Canceled by restart" where settled=0
        ''')
        self.connection.commit()

        cursor.close()
        cursor = self.connection.cursor()

        if self.table_images not in tables:
            cursor.execute(f'''
                CREATE TABLE IF NOT EXISTS {self.table_images} (
                    image_uid VARCHAR(64),
                    image_file_cid VARCHAR(256),
                    settled TINYINT,
                    error VARCHAR(256),
                    timestamp INT UNSIGNED,
                    PRIMARY KEY (image_uid)
                )
            ''')
            self.connection.commit()

        cursor.close()
        cursor = self.connection.cursor()

        cursor.execute(f'''
            UPDATE {self.table_images} SET settled=1, error="Canceled by restart" where settled=0
        ''')
        self.connection.commit()

        cursor.close()

        threading.Thread(target=self.keep_alive, daemon=True).start()

    def keep_alive(self):
        while True:
            try:
                cursor = self.connection.cursor()
                cursor.execute(f'SELECT 1')
                cursor.fetchall()
            except Exception:
                self.connection.ping(reconnect=True)
            finally:
                cursor.close()
            time.sleep(3600)


    def new_simulator(self, wechat_openid, wechat_username, wechat_avatar, audio_id, audio_file_cid, audio_url, text, simulator, simulator_avatar_cid, personality, archetype, title, host):
        cursor = self.connection.cursor()
        cursor.execute(
            f'''
                INSERT INTO {self.table_simulators}
                (wechat_openid, wechat_username, wechat_avatar, audio_id, audio_file_cid, audio_url, text, simulator, simulator_avatar_cid, origin_personality, timestamp, state, archetype, title, host)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) as alias
                ON DUPLICATE KEY UPDATE
                wechat_avatar=alias.wechat_avatar
            ''',
            (wechat_openid,
             wechat_username,
             wechat_avatar,
             audio_id,
             audio_file_cid,
             # AWS S3 url
             audio_url,
             text,
             simulator,
             simulator_avatar_cid,
             personality,
             int(time.time()),
             'CREATED',
             archetype,
             title,
             host)
        )
        self.connection.commit()
        cursor.close()

    def update_simulator(self, simulator, state):
        cursor = self.connection.cursor()
        cursor.execute(
            f'''
                UPDATE {self.table_simulators}
                SET state="{state}"
                WHERE simulator="{simulator}"
            '''
        )
        self.connection.commit()
        cursor.close()

    def approve_simulator(self, simulator):
        self.update_simulator(simulator, 'APPROVED')

    def reject_simulator(self, simulator):
        self.update_simulator(simulator, 'REJECTED')

    def count_simulators(self, wechat_openid: str | None):
        query = f'SELECT COUNT(*) FROM {self.table_simulators}'
        query += f' WHERE wechat_openid="{wechat_openid}"' if wechat_openid is not None else ''

        cursor = self.connection.cursor()
        cursor.execute(query)
        count = int(cursor.fetchone()[0])
        cursor.close()

        return count

    def get_simulators(self, wechat_openid: str | None, offset: int, limit: int):
        query = f'SELECT * FROM {self.table_simulators}'
        query += f' WHERE wechat_openid="{wechat_openid}"' if wechat_openid is not None else ''
        query += ' ORDER BY timestamp DESC'
        query += f' LIMIT {limit} OFFSET {offset}'

        cursor_dict = self.connection.cursor(dictionary=True)
        cursor_dict.execute(query)

        results = cursor_dict.fetchall()
        cursor_dict.close()

        return results

    def get_simulator_with_audio_id(self, audio_id):
        cursor_dict = self.connection.cursor(dictionary=True)

        cursor_dict.execute(
            f'''
                SELECT * FROM {self.table_simulators}
                WHERE audio_id="{audio_id}"
            '''
        )
        results = cursor_dict.fetchone()
        cursor_dict.close()

        return results

    def ban(self, wechat_openid, ban_by_reason, ban_by_id):
        cursor = self.connection.cursor()
        cursor.execute(
            f'''
                INSERT INTO {self.table_bans}
                VALUES (%s, %s, %s, %s, %s)
            ''',
            (wechat_openid,
             ban_by_reason,
             ban_by_id,
             int(time.time()),
             0)
        )
        self.connection.commit()
        cursor.close()

    def resolve_ban(self, wechat_openid, ban_by_id):
        cursor = self.connection.cursor()
        cursor.execute(
            f'''
                UPDATE {self.table_bans}
                SET resolved=1
                WHERE wechat_openid="{wechat_openid}"
                AND ban_by_id="{ban_by_id}"
            '''
        )
        self.connection.commit()
        cursor.close()

    def new_user(self, wechat_openid, wechat_username, wechat_avatar):
        cursor = self.connection.cursor()
        cursor.execute(
            f'''
                INSERT INTO {self.table_users}
                VALUES (%s, %s, %s, %s) as alias
                ON DUPLICATE KEY UPDATE
                wechat_username=alias.wechat_username,
                wechat_avatar=alias.wechat_avatar
            ''',
            (wechat_openid,
             wechat_username,
             wechat_avatar,
             int(time.time()))
        )
        self.connection.commit()
        cursor.close()

    def get_user(self, wechat_openid):
        cursor_dict = self.connection.cursor(dictionary=True)

        cursor_dict.execute(
            f'''
                SELECT * FROM {self.table_users}
                WHERE wechat_openid="{wechat_openid}"
            '''
        )
        retults = cursor_dict.fetchone()
        cursor_dict.close()

        return results

    def new_model(self, name, endpoint, vendor, author, author_logo, model_logo, vendor_logo, host_model):
        cursor = self.connection.cursor()
        cursor.execute(
            f'''
                INSERT INTO {self.table_models}
                (name, endpoint, vendor, author, author_logo, model_logo, vendor_logo, host_model, timestamp)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) as alias
                ON DUPLICATE KEY UPDATE
                author_logo=alias.author_logo
            ''',
            (name,
             endpoint,
             vendor,
             author,
             author_logo,
             model_logo,
             vendor_logo,
             host_model,
             int(time.time()))
        )
        self.connection.commit()
        cursor.close()

    def get_models(self, offset: int, limit: int):
        cursor_dict = self.connection.cursor(dictionary=True)

        cursor_dict.execute(
            f'''
                SELECT * FROM {self.table_models}
                ORDER BY timestamp DESC
                LIMIT {limit} OFFSET {offset}
            '''
        )
        results = cursor_dict.fetchall()
        cursor_dict.close()

        return results

    def new_audio(self, audio_uid):
        cursor = self.connection.cursor()
        cursor.execute(
            f'''
                INSERT INTO {self.table_audios}
                (audio_uid, settled, timestamp) VALUES (%s, %s, %s)
            ''',
            (audio_uid, 0, int(time.time()))
        )
        self.connection.commit()
        cursor.close()

    def update_audio(self, audio_uid, audio_file_cid, error):
        cursor = self.connection.cursor()
        if audio_file_cid is not None:
            cursor.execute(
                f'''
                    UPDATE {self.table_audios}
                    SET audio_file_cid = %s, settled = %s
                    WHERE audio_uid="{audio_uid}"
                ''',
                (audio_file_cid, 1)
            )
        if error is not None:
            cursor.execute(
                f'''
                    UPDATE {self.table_audios}
                    SET error = %s
                    WHERE audio_uid="{audio_uid}"
                ''',
                (error[0:256], )
            )

        self.connection.commit()
        cursor.close()

    def get_audio(self, audio_uid):
        cursor_dict = self.connection.cursor(dictionary=True)

        cursor_dict.execute(
            f'SELECT * FROM {self.table_audios} WHERE audio_uid="{audio_uid}"'
        )
        result = cursor_dict.fetchone()
        cursor_dict.close()

        return result

    def new_image(self, image_uid):
        cursor = self.connection.cursor()
        cursor.execute(
            f'''
                INSERT INTO {self.table_images}
                (image_uid, settled, timestamp) VALUES (%s, %s, %s)
            ''',
            (image_uid, 0, int(time.time()))
        )
        self.connection.commit()
        cursor.close()

    def update_image(self, image_uid, image_file_cid, error):
        cursor = self.connection.cursor()
        if image_file_cid is not None:
            cursor.execute(
                f'''
                    UPDATE {self.table_images}
                    SET image_file_cid = %s, settled = %s
                    WHERE image_uid="{image_uid}"
                ''',
                (image_file_cid, 1)
            )
        if error is not None:
            cursor.execute(
                f'''
                    UPDATE {self.table_images}
                    SET error = %s
                    WHERE image_uid="{image_uid}"
                ''',
                (error[0:256], )
            )

        self.connection.commit()
        cursor.close()

    def get_image(self, image_uid):
        cursor_dict = self.connection.cursor(dictionary=True)

        cursor_dict.execute(
            f'SELECT * FROM {self.table_images} WHERE image_uid="{image_uid}"'
        )
        result = cursor_dict.fetchone()
        cursor_dict.close()

        return result

db = Db()
