from boto3.session import Session

from config import config

class AwsS3Uploader:
    def __init__():
        session = Session(
            aws_access_key_id=config.aws_access_key,
            aws_secret_access_key=config.aws_secret_key,
            region_name=config.aws_region,
        )
        self.s3 = session.client('s3')

    def upload(self, prefix, data, key):
        self.s3.put_object(Bucket=config.aws_bucket, Key=f'{prefix}/{key}', Body=data)
        # Return S3 url
