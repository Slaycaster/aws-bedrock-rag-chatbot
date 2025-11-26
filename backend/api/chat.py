from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import uuid
from backend.database import get_db
from backend.services.bedrock_service import BedrockService
from backend.models.config import Config

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class Citation(BaseModel):
    generatedResponsePart: dict
    retrievedReferences: List[dict]


class ChatResponse(BaseModel):
    response: str
    session_id: str
    citations: Optional[List[dict]] = None


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    service = BedrockService(db)
    session_id = request.session_id or str(uuid.uuid4())
    
    try:
        result = service.chat(request.message, request.session_id)
        
        return ChatResponse(
            response=result["response"],
            session_id=result["sessionId"],
            citations=result["citations"]
        )
    except Exception as e:
        print(f"[CHAT] Error in chat endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


class GreetingResponse(BaseModel):
    message: str
    template: str


@router.get("/greeting", response_model=GreetingResponse)
async def get_greeting(db: Session = Depends(get_db)):
    config = db.query(Config).first()
    default_message = "Hello! How can I help you today?"
    
    if not config:
        return GreetingResponse(
            message=default_message,
            template=default_message
        )
    
    greeting_message = config.greeting_message or default_message
    
    return GreetingResponse(message=greeting_message, template=greeting_message)
