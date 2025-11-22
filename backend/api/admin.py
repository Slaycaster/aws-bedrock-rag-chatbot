from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from backend.database import get_db
from backend.models.config import Config
from backend.models.user import User
from backend.auth_utils import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])

class ConfigUpdate(BaseModel):
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_account_id: Optional[str] = None
    aws_region: Optional[str] = None
    s3_bucket_name: Optional[str] = None
    kb_id: Optional[str] = None
    data_source_id: Optional[str] = None
    bot_name: Optional[str] = None
    greeting_message: Optional[str] = None
    model_arn: Optional[str] = None

class ConfigResponse(BaseModel):
    aws_access_key_id: Optional[str]
    # Do not return secret key
    aws_account_id: Optional[str]
    aws_region: Optional[str]
    s3_bucket_name: Optional[str]
    kb_id: Optional[str]
    data_source_id: Optional[str]
    bot_name: Optional[str]
    greeting_message: Optional[str]
    model_arn: Optional[str]

@router.get("/config", response_model=ConfigResponse)
async def get_config(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    config = db.query(Config).first()
    if not config:
        # Return defaults if no config exists
        return ConfigResponse(
            aws_access_key_id="",
            aws_region="us-east-1",
            s3_bucket_name="",
            kb_id="",
            data_source_id="",
            bot_name="My RAG Chatbot",
            greeting_message="Hello! How can I help you today?"
        )
    return config

@router.post("/config")
async def update_config(config_data: ConfigUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    config = db.query(Config).first()
    if not config:
        config = Config()
        db.add(config)
    
    if config_data.aws_access_key_id is not None:
        config.aws_access_key_id = config_data.aws_access_key_id
    if config_data.aws_secret_access_key is not None:
        config.aws_secret_access_key = config_data.aws_secret_access_key
    if config_data.aws_account_id is not None:
        config.aws_account_id = config_data.aws_account_id
    if config_data.aws_region is not None:
        config.aws_region = config_data.aws_region
    if config_data.s3_bucket_name is not None:
        config.s3_bucket_name = config_data.s3_bucket_name
    if config_data.kb_id is not None:
        config.kb_id = config_data.kb_id
    if config_data.data_source_id is not None:
        config.data_source_id = config_data.data_source_id
    if config_data.bot_name is not None:
        config.bot_name = config_data.bot_name
    if config_data.greeting_message is not None:
        config.greeting_message = config_data.greeting_message
    if config_data.model_arn is not None:
        config.model_arn = config_data.model_arn
        
    db.commit()
    return {"message": "Configuration updated successfully"}

@router.get("/public-config")
async def get_public_config(db: Session = Depends(get_db)):
    # Endpoint for the chat widget to get non-sensitive info
    config = db.query(Config).first()
    if not config:
        return {
            "bot_name": "My RAG Chatbot",
            "greeting_message": "Hello! How can I help you today?"
        }
    return {
        "bot_name": config.bot_name,
        "greeting_message": config.greeting_message
    }

from fastapi import UploadFile, File
from backend.services.s3_service import S3Service

from typing import List

@router.post("/upload")
async def upload_files(
    files: List[UploadFile] = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    config = db.query(Config).first()
    if not config or not config.s3_bucket_name:
        raise HTTPException(status_code=400, detail="S3 Bucket Name not configured")
        
    service = S3Service(db)
    uploaded_files = []
    try:
        for file in files:
            # Upload to S3
            service.upload_file(file.file, file.filename, config.s3_bucket_name)
            uploaded_files.append(file.filename)
            
        return {"message": f"Successfully uploaded {len(uploaded_files)} files", "files": uploaded_files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync")
async def sync_kb(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    service = S3Service(db)
    try:
        job = service.start_ingestion_job()
        return {"message": "Sync started", "job": job}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset")
async def reset_app(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Delete config
    db.query(Config).delete()
    # Delete all users (this will force re-setup)
    db.query(User).delete()
    db.commit()
    return {"message": "Application reset successfully"}
