from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import json
from backend.database import get_db
from backend.models.config import Config
from backend.models.exam import ExamQuestion, ExamResult, ExamConfig
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
    enable_exam_mode: Optional[bool] = None
    primary_color: Optional[str] = None
    primary_foreground: Optional[str] = None
    chat_bubble_user: Optional[str] = None
    chat_bubble_user_foreground: Optional[str] = None
    chat_bubble_bot: Optional[str] = None
    chat_bubble_bot_foreground: Optional[str] = None
    webhook_url: Optional[str] = None


class ConfigResponse(BaseModel):
    aws_access_key_id: Optional[str]
    aws_account_id: Optional[str]
    aws_region: Optional[str]
    s3_bucket_name: Optional[str]
    kb_id: Optional[str]
    data_source_id: Optional[str]
    bot_name: Optional[str]
    greeting_message: Optional[str]
    model_arn: Optional[str]
    enable_exam_mode: Optional[bool]
    primary_color: Optional[str]
    primary_foreground: Optional[str]
    chat_bubble_user: Optional[str]
    chat_bubble_user_foreground: Optional[str]
    chat_bubble_bot: Optional[str]
    chat_bubble_bot_foreground: Optional[str]
    webhook_url: Optional[str]


@router.get("/config", response_model=ConfigResponse)
async def get_config(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    config = db.query(Config).first()
    if not config:
        return ConfigResponse(
            aws_access_key_id="",
            aws_region="us-east-1",
            s3_bucket_name="",
            kb_id="",
            data_source_id="",
            bot_name="My RAG Chatbot",
            greeting_message="Hello! How can I help you today?",
            enable_exam_mode=False,
            primary_color="#18181b",
            primary_foreground="#fafafa",
            chat_bubble_user="#18181b",
            chat_bubble_user_foreground="#fafafa",
            chat_bubble_bot="#f4f4f5",
            chat_bubble_bot_foreground="#18181b",
            webhook_url=None
        )
    
    return ConfigResponse(
        aws_access_key_id=config.aws_access_key_id,
        aws_account_id=config.aws_account_id,
        aws_region=config.aws_region,
        s3_bucket_name=config.s3_bucket_name,
        kb_id=config.kb_id,
        data_source_id=config.data_source_id,
        bot_name=config.bot_name,
        greeting_message=config.greeting_message,
        model_arn=config.model_arn,
        enable_exam_mode=config.enable_exam_mode if config.enable_exam_mode is not None else False,
        primary_color=config.primary_color or "#18181b",
        primary_foreground=config.primary_foreground or "#fafafa",
        chat_bubble_user=config.chat_bubble_user or "#18181b",
        chat_bubble_user_foreground=config.chat_bubble_user_foreground or "#fafafa",
        chat_bubble_bot=config.chat_bubble_bot or "#f4f4f5",
        chat_bubble_bot_foreground=config.chat_bubble_bot_foreground or "#18181b",
        webhook_url=config.webhook_url
    )


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
    if config_data.enable_exam_mode is not None:
        config.enable_exam_mode = config_data.enable_exam_mode
    if config_data.primary_color is not None:
        config.primary_color = config_data.primary_color
    if config_data.primary_foreground is not None:
        config.primary_foreground = config_data.primary_foreground
    if config_data.chat_bubble_user is not None:
        config.chat_bubble_user = config_data.chat_bubble_user
    if config_data.chat_bubble_user_foreground is not None:
        config.chat_bubble_user_foreground = config_data.chat_bubble_user_foreground
    if config_data.chat_bubble_bot is not None:
        config.chat_bubble_bot = config_data.chat_bubble_bot
    if config_data.chat_bubble_bot_foreground is not None:
        config.chat_bubble_bot_foreground = config_data.chat_bubble_bot_foreground
    if config_data.webhook_url is not None:
        config.webhook_url = config_data.webhook_url if config_data.webhook_url else None
        
    db.commit()
    return {"message": "Configuration updated successfully"}


@router.get("/public-config")
async def get_public_config(db: Session = Depends(get_db)):
    config = db.query(Config).first()
    if not config:
        return {
            "bot_name": "My RAG Chatbot",
            "greeting_message": "Hello! How can I help you today?",
            "enable_exam_mode": False,
            "primary_color": "#18181b",
            "primary_foreground": "#fafafa",
            "chat_bubble_user": "#18181b",
            "chat_bubble_user_foreground": "#fafafa",
            "chat_bubble_bot": "#f4f4f5",
            "chat_bubble_bot_foreground": "#18181b",
            "webhook_url": None
        }
    
    return {
        "bot_name": config.bot_name,
        "greeting_message": config.greeting_message,
        "enable_exam_mode": config.enable_exam_mode if config.enable_exam_mode is not None else False,
        "primary_color": config.primary_color or "#18181b",
        "primary_foreground": config.primary_foreground or "#fafafa",
        "chat_bubble_user": config.chat_bubble_user or "#18181b",
        "chat_bubble_user_foreground": config.chat_bubble_user_foreground or "#fafafa",
        "chat_bubble_bot": config.chat_bubble_bot or "#f4f4f5",
        "chat_bubble_bot_foreground": config.chat_bubble_bot_foreground or "#18181b",
        "webhook_url": config.webhook_url
    }


from fastapi import UploadFile, File
from backend.services.s3_service import S3Service


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
            service.upload_file(file.file, file.filename, config.s3_bucket_name)
            uploaded_files.append(file.filename)
            
        return {"message": f"Successfully uploaded {len(uploaded_files)} files", "files": uploaded_files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/files")
async def list_files(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    config = db.query(Config).first()
    if not config or not config.s3_bucket_name:
        raise HTTPException(status_code=400, detail="S3 Bucket Name not configured")
    
    service = S3Service(db)
    try:
        files = service.list_files(config.s3_bucket_name)
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/files/{file_key:path}")
async def delete_file(file_key: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    config = db.query(Config).first()
    if not config or not config.s3_bucket_name:
        raise HTTPException(status_code=400, detail="S3 Bucket Name not configured")
    
    service = S3Service(db)
    try:
        service.delete_file(config.s3_bucket_name, file_key)
        return {"message": f"File {file_key} deleted successfully"}
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
    db.query(Config).delete()
    db.query(ExamQuestion).delete()
    db.query(ExamResult).delete()
    db.query(ExamConfig).delete()
    db.query(User).delete()
    db.commit()
    return {"message": "Application reset successfully"}
