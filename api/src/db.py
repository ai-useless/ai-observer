import mysql.connector
import warnings
from config import config
import time


class Db:
    def __init__(self):
        self.db_name = 'ai_observer'
        self.table_bans = 'bans'
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

        if self.db_name not in databases:
            self.cursor.execute(f'CREATE DATABASE IF NOT EXISTS {self.db_name}')

        self.cursor.close()
        self.connection.close()

        self.config['database'] = self.db_name

        self.connection = mysql.connector.connect(**self.config)
        self.cursor = self.connection.cursor()

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

        if self.table_audios not in tables:
            self.cursor.execute(f'''
                CREATE TABLE IF NOT EXISTS {self.table_audios} (
                    wechat_openid VARCHAR(32),
                    wechat_username VARCHAR(128),
                    wechat_avatar VARCHAR(1024),
                    audio_file_cid VARCHAR(256),
                    timestamp INT UNSIGNED,
                    state VARCHAR(16),
                    PRIMARY KEY (audio_file_cid)
                )
            ''')
            self.connection.commit()

    def new_audio(self, wechat_openid, wechat_username, wechat_avatar, audio_file_cid):
        self.cursor.execute(
            f'''
                INSERT INTO {self.table_audios}
                VALUE (%s, %s, %s, %s, %s, %s) as alias
            ''',
            (wechat_openid,
             wechat_username,
             wechat_avatar,
             audio_file_cid,
             int(time.time()),
             'CREATED')
        )
        self.connection.commit()

    def update_audio(self, audio_file_cid, state):
        self.cursor.execute(
            f'''
                UPDATE TABLE {self.table_audios}
                SET state="{state}"
                WHERE audio_file_cid="{audio_file_cid}"
            '''
        )
        self.connection.commit()

    def approve_audio(self, audio_file_cid):
        self.update_audio(audio_file_cid, 'APPROVED')

    def reject_audio(self, audio_file_cid):
        self.update_audio(audio_file_cid, 'REJECTED')

    def ban(self, wechat_openid, ban_by_reason, ban_by_id):
        self.cursor.execute(
            f'''
                INSERT INTO {self.table_bans}
                VALUE (%s, %s, %s, %s, %s) as alias
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
                UPDATE TABLE {self.table_bans}
                SET resolved=1
                WHERE wechat_openid="{wechat_openid}"
                AND ban_by_id="{ban_by_id}"
            '''
        )

db = Db()
