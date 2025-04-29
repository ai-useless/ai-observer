import mysql.connector
import warnings
from config import config
import time


class Db:
    def __init__(self):
        self.db_name = 'ai_observer'
        self.table_bans = 'bans'
        self.table_simulators = 'simulators'

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

        if config.clean_database is True:
            self.cursor.execute(f'DROP DATABASE {self.db_name}')
            self.connection.commit()

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

        if self.table_simulators not in tables:
            self.cursor.execute(f'''
                CREATE TABLE IF NOT EXISTS {self.table_simulators} (
                    wechat_openid VARCHAR(32),
                    wechat_username VARCHAR(128),
                    wechat_avatar VARCHAR(1024),
                    audio_file_cid VARCHAR(256) UNIQUE,
                    text VARCHAR(512),
                    simulator VARCHAR(32),
                    simulator_avatar_cid VARCHAR(64) UNIQUE,
                    origin_personality VARCHAR(256),
                    timestamp INT UNSIGNED,
                    state VARCHAR(16),
                    PRIMARY KEY (simulator)
                )
            ''')
            self.connection.commit()

    def new_simulator(self, wechat_openid, wechat_username, wechat_avatar, audio_file_cid, text, simulator, simulator_avatar_cid, personality):
        self.cursor.execute(
            f'''
                INSERT INTO {self.table_simulators}
                VALUE (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) as alias
            ''',
            (wechat_openid,
             wechat_username,
             wechat_avatar,
             audio_file_cid,
             text,
             simulator,
             simulator_avatar_cid,
             personality,
             int(time.time()),
             'CREATED')
        )
        self.connection.commit()

    def update_simulator(self, simulator, state):
        self.cursor.execute(
            f'''
                UPDATE TABLE {self.table_simulators}
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
        query += f' WHERE wechat_openid={wechat_openid}' if wechat_openid is not None else ''
        self.cursor.execute(query)
        return int(self.cursor.fetchone()[0])

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
