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
        self.cursor = self.connection.cursor()

        self.cursor.execute('SHOW DATABASES')
        databases = [row[0] for row in self.cursor.fetchall()]

        if config.clean_database is True:
            if self.db_name in databases:
                self.cursor.execute(f'DROP DATABASE {self.db_name}')
                self.connection.commit()

        self.cursor.execute('SHOW DATABASES')
        databases = [row[0] for row in self.cursor.fetchall()]

        if self.db_name not in databases:
            self.cursor.execute(f'CREATE DATABASE IF NOT EXISTS {self.db_name}')
            self.connection.commit()

        self.cursor.close()
        self.connection.close()

        self.config['database'] = self.db_name

        self.connection = mysql.connector.connect(**self.config)
        self.cursor = self.connection.cursor()
        self.cursor_dict = self.connection.cursor(dictionary=True)

        self.cursor.execute('SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;')

        self.cursor.execute('SHOW TABLES')
        tables = [row[0] for row in self.cursor.fetchall()]

        if self.table_bans not in tables:
            self.cursor.execute(f'''
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

        if self.table_simulators not in tables:
            self.cursor.execute(f'''
                CREATE TABLE IF NOT EXISTS {self.table_simulators} (
                    id INT AUTO_INCREMENT NOT NULL,
                    wechat_openid VARCHAR(32),
                    wechat_username VARCHAR(128),
                    wechat_avatar VARCHAR(1024),
                    audio_id VARCHAR(64),
                    audio_file_cid VARCHAR(256) UNIQUE,
<<<<<<< HEAD
=======
                    audio_url VARCHAR(1024),
>>>>>>> 1bfe8209e3e31ec69acb42c0fddfc13eca4bb5ca
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

        if self.table_users not in tables:
            self.cursor.execute(f'''
                CREATE TABLE IF NOT EXISTS {self.table_users} (
                    wechat_openid VARCHAR(32),
                    wechat_username VARCHAR(128),
                    wechat_avatar VARCHAR(1024),
                    timestamp INT UNSIGNED,
                    PRIMARY KEY (wechat_openid)
                )
            ''')
            self.connection.commit()

        if self.table_models not in tables:
            self.cursor.execute(f'''
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

        if self.table_audios not in tables:
            self.cursor.execute(f'''
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

        self.cursor.execute(f'''
            UPDATE {self.table_audios} SET settled=1, error="Canceled by restart" where settled=0
        ''')
        self.connection.commit()

        threading.Thread(target=self.keep_alive, daemon=True).start()

    def keep_alive(self):
        while True:
            try:
                self.cursor.execute(f'SELECT 1')
                self.cursor.fetchall()
            except Exception:
                self.connection.ping(reconnect=True)
            time.sleep(3600)


<<<<<<< HEAD
    def new_simulator(self, wechat_openid, wechat_username, wechat_avatar, audio_id, audio_file_cid, text, simulator, simulator_avatar_cid, personality, archetype, title, host):
        self.cursor.execute(
            f'''
                INSERT INTO {self.table_simulators}
                (wechat_openid, wechat_username, wechat_avatar, audio_id, audio_file_cid, text, simulator, simulator_avatar_cid, origin_personality, timestamp, state, archetype, title, host)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) as alias
=======
    def new_simulator(self, wechat_openid, wechat_username, wechat_avatar, audio_id, audio_file_cid, audio_url, text, simulator, simulator_avatar_cid, personality, archetype, title, host):
        self.cursor.execute(
            f'''
                INSERT INTO {self.table_simulators}
                (wechat_openid, wechat_username, wechat_avatar, audio_id, audio_file_cid, audio_url, text, simulator, simulator_avatar_cid, origin_personality, timestamp, state, archetype, title, host)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) as alias
>>>>>>> 1bfe8209e3e31ec69acb42c0fddfc13eca4bb5ca
                ON DUPLICATE KEY UPDATE
                wechat_avatar=alias.wechat_avatar
            ''',
            (wechat_openid,
             wechat_username,
             wechat_avatar,
             audio_id,
             audio_file_cid,
<<<<<<< HEAD
=======
             # AWS S3 url
             audio_url,
>>>>>>> 1bfe8209e3e31ec69acb42c0fddfc13eca4bb5ca
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

    def update_simulator(self, simulator, state):
        self.cursor.execute(
            f'''
                UPDATE {self.table_simulators}
                SET state="{state}"
                WHERE simulator="{simulator}"
            '''
        )
        self.connection.commit()

    def approve_simulator(self, simulator):
        self.update_simulator(simulator, 'APPROVED')

    def reject_simulator(self, simulator):
        self.update_simulator(simulator, 'REJECTED')

    def count_simulators(self, wechat_openid: str | None):
        query = f'SELECT COUNT(*) FROM {self.table_simulators}'
        query += f' WHERE wechat_openid="{wechat_openid}"' if wechat_openid is not None else ''
        self.cursor.execute(query)
        return int(self.cursor.fetchone()[0])

    def get_simulators(self, wechat_openid: str | None, offset: int, limit: int):
        query = f'SELECT * FROM {self.table_simulators}'
        query += f' WHERE wechat_openid="{wechat_openid}"' if wechat_openid is not None else ''
        query += ' ORDER BY timestamp DESC'
        query += f' LIMIT {limit} OFFSET {offset}'
        self.cursor_dict.execute(query)
        return self.cursor_dict.fetchall()

    def get_simulator_with_audio_id(self, audio_id):
        self.cursor_dict.execute(
            f'''
                SELECT * FROM {self.table_simulators}
                WHERE audio_id="{audio_id}"
            '''
        )
        return self.cursor_dict.fetchone()

    def ban(self, wechat_openid, ban_by_reason, ban_by_id):
        self.cursor.execute(
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

    def resolve_ban(self, wechat_openid, ban_by_id):
        self.cursor.execute(
            f'''
                UPDATE {self.table_bans}
                SET resolved=1
                WHERE wechat_openid="{wechat_openid}"
                AND ban_by_id="{ban_by_id}"
            '''
        )
        self.connection.commit()

    def new_user(self, wechat_openid, wechat_username, wechat_avatar):
        self.cursor.execute(
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

    def get_user(self, wechat_openid):
        self.cursor_dict.execute(
            f'''
                SELECT * FROM {self.table_users}
                WHERE wechat_openid="{wechat_openid}"
            '''
        )
        return self.cursor_dict.fetchone()

    def new_model(self, name, endpoint, vendor, author, author_logo, model_logo, vendor_logo, host_model):
        self.cursor.execute(
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

    def get_models(self, offset: int, limit: int):
        self.cursor_dict.execute(
            f'''
                SELECT * FROM {self.table_models}
                ORDER BY timestamp DESC
                LIMIT {limit} OFFSET {offset}
            '''
        )
        return self.cursor_dict.fetchall()

    def new_audio(self, audio_uid):
        self.cursor.execute(
            f'''
                INSERT INTO {self.table_audios}
                (audio_uid, settled, timestamp) VALUES (%s, %s, %s)
            ''',
            (audio_uid, 0, int(time.time()))
        )
        self.connection.commit()

    def update_audio(self, audio_uid, audio_file_cid, error):
        if audio_file_cid is not None:
            self.cursor.execute(
                f'''
                    UPDATE {self.table_audios}
                    SET audio_file_cid = %s, settled = %s
                    WHERE audio_uid="{audio_uid}"
                ''',
                (audio_file_cid, 1)
            )
        if error is not None:
            self.cursor.execute(
                f'''
                    UPDATE {self.table_audios}
                    SET error = %s
                    WHERE audio_uid="{audio_uid}"
                ''',
                (error[0:256], )
            )

        self.connection.commit()

    def get_audio(self, audio_uid):
        self.cursor_dict.execute(
            f'SELECT * FROM {self.table_audios} WHERE audio_uid="{audio_uid}"'
        )
        return self.cursor_dict.fetchone()

db = Db()
