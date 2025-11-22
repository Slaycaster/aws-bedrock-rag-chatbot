import boto3
from botocore.exceptions import ClientError
from sqlalchemy.orm import Session
from backend.models.config import Config

class BedrockService:
    def __init__(self, db: Session):
        self.db = db
        self.config = db.query(Config).first()
        self._client = None
        self._account_id = None

    def _get_client(self):
        if self._client:
            return self._client
        
        if not self.config or not self.config.aws_access_key_id:
            raise Exception("AWS credentials not configured")

        self._client = boto3.client(
            service_name="bedrock-agent-runtime",
            region_name=self.config.aws_region,
            aws_access_key_id=self.config.aws_access_key_id,
            aws_secret_access_key=self.config.aws_secret_access_key,
        )
        return self._client

    def _get_account_id(self):
        """Get AWS account ID from config or using STS"""
        if self._account_id:
            return self._account_id
        
        # First check if account ID is stored in config
        if self.config and self.config.aws_account_id:
            self._account_id = self.config.aws_account_id
            return self._account_id
            
        # Otherwise fetch from STS
        if not self.config or not self.config.aws_access_key_id:
            raise Exception("AWS credentials not configured")
            
        sts_client = boto3.client(
            service_name="sts",
            region_name=self.config.aws_region,
            aws_access_key_id=self.config.aws_access_key_id,
            aws_secret_access_key=self.config.aws_secret_access_key,
        )
        
        identity = sts_client.get_caller_identity()
        self._account_id = identity['Account']
        return self._account_id

    def chat(self, message: str, session_id: str = None):
        client = self._get_client()
        
        if not self.config.kb_id:
            raise Exception("Knowledge Base ID not configured")

        # Get account ID for constructing inference profile ARN
        account_id = self._get_account_id()
        
        # Construct model ARN with account ID
        if self.config.model_arn:
            # If model_arn is stored without account ID, add it
            if '::inference-profile/' in self.config.model_arn:
                # Old format without account ID, replace :: with :account_id:
                model_arn = self.config.model_arn.replace('::inference-profile/', f':{account_id}:inference-profile/')
            else:
                # Already has account ID or is in correct format
                model_arn = self.config.model_arn
        else:
            # Default model
            model_arn = f'arn:aws:bedrock:{self.config.aws_region}:{account_id}:inference-profile/global.anthropic.claude-haiku-4-5-20251001-v1:0'

        # Using RetrieveAndGenerate API for RAG
        try:
            request_params = {
                'input': {
                    'text': message
                },
                'retrieveAndGenerateConfiguration': {
                    'type': 'KNOWLEDGE_BASE',
                    'knowledgeBaseConfiguration': {
                        'knowledgeBaseId': self.config.kb_id,
                        'modelArn': model_arn,
                    }
                }
            }
            
            # Only include sessionId if it's provided and not empty
            if session_id:
                request_params['sessionId'] = session_id
            
            response = client.retrieve_and_generate(**request_params)
            
            return {
                "response": response['output']['text'],
                "sessionId": response['sessionId'],
                "citations": response.get('citations', [])
            }
        except ClientError as e:
            print(f"Error invoking Bedrock: {e}")
            raise e
