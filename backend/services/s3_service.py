import boto3
import os
from sqlalchemy.orm import Session
from backend.models.config import Config

class S3Service:
    def __init__(self, db: Session):
        self.db = db
        self.config = db.query(Config).first()
        self._s3_client = None
        self._bedrock_agent_client = None

    def _get_s3_client(self):
        if self._s3_client:
            return self._s3_client
        
        if not self.config or not self.config.aws_access_key_id:
            raise Exception("AWS credentials not configured")

        self._s3_client = boto3.client(
            "s3",
            region_name=self.config.aws_region,
            aws_access_key_id=self.config.aws_access_key_id,
            aws_secret_access_key=self.config.aws_secret_access_key,
        )
        return self._s3_client

    def _get_bedrock_agent_client(self):
        if self._bedrock_agent_client:
            return self._bedrock_agent_client
            
        if not self.config or not self.config.aws_access_key_id:
            raise Exception("AWS credentials not configured")

        self._bedrock_agent_client = boto3.client(
            "bedrock-agent",
            region_name=self.config.aws_region,
            aws_access_key_id=self.config.aws_access_key_id,
            aws_secret_access_key=self.config.aws_secret_access_key,
        )
        return self._bedrock_agent_client

    def upload_file(self, file_obj, filename: str, bucket_name: str):
        s3 = self._get_s3_client()
        try:
            s3.upload_fileobj(file_obj, bucket_name, filename)
            return True
        except Exception as e:
            print(f"Error uploading to S3: {e}")
            raise e

    def start_ingestion_job(self):
        client = self._get_bedrock_agent_client()
        if not self.config.kb_id or not self.config.data_source_id:
            raise Exception("KB ID or Data Source ID not configured")
            
        try:
            response = client.start_ingestion_job(
                knowledgeBaseId=self.config.kb_id,
                dataSourceId=self.config.data_source_id
            )
            return response['ingestionJob']
        except Exception as e:
            print(f"Error starting ingestion job: {e}")
            raise e
