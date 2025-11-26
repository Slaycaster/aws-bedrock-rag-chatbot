from sqlalchemy import Column, Integer, String, Boolean
from backend.database import Base

class Config(Base):
    __tablename__ = "configs"

    id = Column(Integer, primary_key=True, index=True)
    aws_access_key_id = Column(String, nullable=True)
    aws_secret_access_key = Column(String, nullable=True)
    aws_account_id = Column(String, nullable=True)
    aws_region = Column(String, default="us-east-1")
    s3_bucket_name = Column(String, nullable=True)
    kb_id = Column(String, nullable=True)
    data_source_id = Column(String, nullable=True)
    bot_name = Column(String, default="My RAG Chatbot")
    greeting_message = Column(String, default="Hello! How can I help you today?")
    model_arn = Column(String, default="arn:aws:bedrock:us-east-1::inference-profile/global.anthropic.claude-haiku-4-5-20251001-v1:0")
    enable_exam_mode = Column(Boolean, default=False)
    
    primary_color = Column(String, default="#18181b")
    primary_foreground = Column(String, default="#fafafa")
    chat_bubble_user = Column(String, default="#18181b")
    chat_bubble_user_foreground = Column(String, default="#fafafa")
    chat_bubble_bot = Column(String, default="#f4f4f5")
    chat_bubble_bot_foreground = Column(String, default="#18181b")
    webhook_url = Column(String, nullable=True)