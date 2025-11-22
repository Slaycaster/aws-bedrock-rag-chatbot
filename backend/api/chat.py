from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from backend.database import get_db
from backend.services.bedrock_service import BedrockService

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
    try:
        result = service.chat(request.message, request.session_id)
        return ChatResponse(
            response=result["response"],
            session_id=result["sessionId"],
            citations=result["citations"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
