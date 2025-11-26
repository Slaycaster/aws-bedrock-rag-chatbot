from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import random
import httpx
import uuid
import base64
import os
from backend.database import get_db
from backend.models.exam import ExamQuestion, ExamResult, ExamConfig
from backend.models.user import User
from backend.auth_utils import get_current_user

router = APIRouter(prefix="/exam", tags=["exam"])


class ExamQuestionCreate(BaseModel):
    question_text: str
    question_image_url: Optional[str] = None
    option_a: str
    option_b: str
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: str
    explanation: Optional[str] = None
    order_index: Optional[int] = 0
    is_active: Optional[bool] = True


class ExamQuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    question_image_url: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    order_index: Optional[int] = None
    is_active: Optional[bool] = None


class ExamQuestionResponse(BaseModel):
    id: int
    question_text: str
    question_image_url: Optional[str] = None
    option_a: str
    option_b: str
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: str
    explanation: Optional[str] = None
    order_index: int
    is_active: bool


class ExamQuestionPublic(BaseModel):
    id: int
    question_text: str
    question_image_url: Optional[str] = None
    option_a: str
    option_b: str
    option_c: Optional[str] = None
    option_d: Optional[str] = None


class ExamConfigUpdate(BaseModel):
    passing_score: Optional[float] = None
    exam_title: Optional[str] = None
    exam_description: Optional[str] = None
    show_correct_answers: Optional[bool] = None
    shuffle_questions: Optional[bool] = None


class ExamConfigResponse(BaseModel):
    passing_score: float
    exam_title: str
    exam_description: Optional[str] = None
    show_correct_answers: bool
    shuffle_questions: bool


class AnswerSubmission(BaseModel):
    question_id: int
    selected_answer: str


class AnswerResult(BaseModel):
    is_correct: bool
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None


class ExamSubmission(BaseModel):
    session_id: str
    external_user_id: Optional[str] = None
    external_user_name: Optional[str] = None
    webhook_url: Optional[str] = None
    custom_data: Optional[dict] = None
    answers: List[AnswerSubmission]


class ExamResultResponse(BaseModel):
    total_questions: int
    correct_answers: int
    score_percentage: float
    passed: bool
    results: List[dict]


@router.get("/questions", response_model=List[ExamQuestionResponse])
async def list_questions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    questions = db.query(ExamQuestion).order_by(ExamQuestion.order_index).all()
    return [ExamQuestionResponse(
        id=q.id,
        question_text=q.question_text,
        question_image_url=q.question_image_url,
        option_a=q.option_a,
        option_b=q.option_b,
        option_c=q.option_c,
        option_d=q.option_d,
        correct_answer=q.correct_answer,
        explanation=q.explanation,
        order_index=q.order_index,
        is_active=q.is_active
    ) for q in questions]


@router.post("/questions", response_model=ExamQuestionResponse)
async def create_question(
    question_data: ExamQuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    question = ExamQuestion(
        question_text=question_data.question_text,
        question_image_url=question_data.question_image_url,
        option_a=question_data.option_a,
        option_b=question_data.option_b,
        option_c=question_data.option_c,
        option_d=question_data.option_d,
        correct_answer=question_data.correct_answer,
        explanation=question_data.explanation,
        order_index=question_data.order_index or 0,
        is_active=question_data.is_active if question_data.is_active is not None else True
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    
    return ExamQuestionResponse(
        id=question.id,
        question_text=question.question_text,
        question_image_url=question.question_image_url,
        option_a=question.option_a,
        option_b=question.option_b,
        option_c=question.option_c,
        option_d=question.option_d,
        correct_answer=question.correct_answer,
        explanation=question.explanation,
        order_index=question.order_index,
        is_active=question.is_active
    )


@router.put("/questions/{question_id}", response_model=ExamQuestionResponse)
async def update_question(
    question_id: int,
    question_data: ExamQuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    question = db.query(ExamQuestion).filter(ExamQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    if question_data.question_text is not None:
        question.question_text = question_data.question_text
    if question_data.question_image_url is not None:
        question.question_image_url = question_data.question_image_url
    if question_data.option_a is not None:
        question.option_a = question_data.option_a
    if question_data.option_b is not None:
        question.option_b = question_data.option_b
    if question_data.option_c is not None:
        question.option_c = question_data.option_c
    if question_data.option_d is not None:
        question.option_d = question_data.option_d
    if question_data.correct_answer is not None:
        question.correct_answer = question_data.correct_answer
    if question_data.explanation is not None:
        question.explanation = question_data.explanation
    if question_data.order_index is not None:
        question.order_index = question_data.order_index
    if question_data.is_active is not None:
        question.is_active = question_data.is_active
    
    db.commit()
    db.refresh(question)
    
    return ExamQuestionResponse(
        id=question.id,
        question_text=question.question_text,
        question_image_url=question.question_image_url,
        option_a=question.option_a,
        option_b=question.option_b,
        option_c=question.option_c,
        option_d=question.option_d,
        correct_answer=question.correct_answer,
        explanation=question.explanation,
        order_index=question.order_index,
        is_active=question.is_active
    )


@router.delete("/questions/{question_id}")
async def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    question = db.query(ExamQuestion).filter(ExamQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    db.delete(question)
    db.commit()
    return {"message": "Question deleted successfully"}


@router.post("/questions/{question_id}/upload-image")
async def upload_question_image(
    question_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    question = db.query(ExamQuestion).filter(ExamQuestion.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    os.makedirs("/app/data/exam_images", exist_ok=True)
    
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    filename = f"{question_id}_{uuid.uuid4().hex[:8]}.{file_ext}"
    file_path = f"/app/data/exam_images/{filename}"
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    question.question_image_url = f"/api/exam/images/{filename}"
    db.commit()
    
    return {"image_url": question.question_image_url}


@router.get("/images/{filename}")
async def get_question_image(filename: str):
    from fastapi.responses import FileResponse
    file_path = f"/app/data/exam_images/{filename}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path)


@router.get("/config", response_model=ExamConfigResponse)
async def get_exam_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    config = db.query(ExamConfig).first()
    if not config:
        config = ExamConfig()
        db.add(config)
        db.commit()
        db.refresh(config)
    
    return ExamConfigResponse(
        passing_score=config.passing_score,
        exam_title=config.exam_title,
        exam_description=config.exam_description,
        show_correct_answers=config.show_correct_answers,
        shuffle_questions=config.shuffle_questions
    )


@router.post("/config", response_model=ExamConfigResponse)
async def update_exam_config(
    config_data: ExamConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    config = db.query(ExamConfig).first()
    if not config:
        config = ExamConfig()
        db.add(config)
    
    if config_data.passing_score is not None:
        config.passing_score = config_data.passing_score
    if config_data.exam_title is not None:
        config.exam_title = config_data.exam_title
    if config_data.exam_description is not None:
        config.exam_description = config_data.exam_description
    if config_data.show_correct_answers is not None:
        config.show_correct_answers = config_data.show_correct_answers
    if config_data.shuffle_questions is not None:
        config.shuffle_questions = config_data.shuffle_questions
    
    db.commit()
    db.refresh(config)
    
    return ExamConfigResponse(
        passing_score=config.passing_score,
        exam_title=config.exam_title,
        exam_description=config.exam_description,
        show_correct_answers=config.show_correct_answers,
        shuffle_questions=config.shuffle_questions
    )


@router.get("/public/config")
async def get_public_exam_config(db: Session = Depends(get_db)):
    config = db.query(ExamConfig).first()
    if not config:
        return {
            "exam_title": "Knowledge Assessment",
            "exam_description": None
        }
    return {
        "exam_title": config.exam_title,
        "exam_description": config.exam_description
    }


@router.get("/public/questions", response_model=List[ExamQuestionPublic])
async def get_public_questions(db: Session = Depends(get_db)):
    config = db.query(ExamConfig).first()
    questions = db.query(ExamQuestion).filter(
        ExamQuestion.is_active == True
    ).order_by(ExamQuestion.order_index).all()
    
    result = [ExamQuestionPublic(
        id=q.id,
        question_text=q.question_text,
        question_image_url=q.question_image_url,
        option_a=q.option_a,
        option_b=q.option_b,
        option_c=q.option_c,
        option_d=q.option_d
    ) for q in questions]
    
    if config and config.shuffle_questions:
        random.shuffle(result)
    
    return result


@router.post("/public/check-answer", response_model=AnswerResult)
async def check_answer(
    submission: AnswerSubmission,
    db: Session = Depends(get_db)
):
    question = db.query(ExamQuestion).filter(ExamQuestion.id == submission.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    config = db.query(ExamConfig).first()
    is_correct = question.correct_answer.upper() == submission.selected_answer.upper()
    
    return AnswerResult(
        is_correct=is_correct,
        correct_answer=question.correct_answer if (config and config.show_correct_answers) else None,
        explanation=question.explanation if (config and config.show_correct_answers) else None
    )


@router.post("/public/submit", response_model=ExamResultResponse)
async def submit_exam(
    submission: ExamSubmission,
    db: Session = Depends(get_db)
):
    config = db.query(ExamConfig).first()
    if not config:
        config = ExamConfig()
        db.add(config)
        db.commit()
        db.refresh(config)
    
    results = []
    correct_count = 0
    
    for answer in submission.answers:
        question = db.query(ExamQuestion).filter(ExamQuestion.id == answer.question_id).first()
        if question:
            is_correct = question.correct_answer.upper() == answer.selected_answer.upper()
            if is_correct:
                correct_count += 1
            results.append({
                "question_id": answer.question_id,
                "selected_answer": answer.selected_answer,
                "is_correct": is_correct,
                "correct_answer": question.correct_answer if config.show_correct_answers else None,
                "explanation": question.explanation if config.show_correct_answers else None
            })
    
    total_questions = len(submission.answers)
    score_percentage = (correct_count / total_questions * 100) if total_questions > 0 else 0
    passed = score_percentage >= config.passing_score
    
    exam_result = ExamResult(
        external_user_id=submission.external_user_id,
        external_user_name=submission.external_user_name,
        session_id=submission.session_id,
        total_questions=total_questions,
        correct_answers=correct_count,
        score_percentage=score_percentage,
        passed=passed,
        webhook_url=submission.webhook_url
    )
    db.add(exam_result)
    db.commit()
    
    if submission.webhook_url:
        try:
            webhook_payload = {
                "event": "exam_completed",
                "external_user_id": submission.external_user_id,
                "external_user_name": submission.external_user_name,
                "session_id": submission.session_id,
                "total_questions": total_questions,
                "correct_answers": correct_count,
                "score_percentage": score_percentage,
                "passed": passed,
                "passing_score": config.passing_score,
                "custom_data": submission.custom_data
            }
            async with httpx.AsyncClient() as client:
                await client.post(submission.webhook_url, json=webhook_payload, timeout=10)
            exam_result.webhook_sent = True
            db.commit()
        except Exception as e:
            print(f"Failed to send webhook: {e}")
    
    return ExamResultResponse(
        total_questions=total_questions,
        correct_answers=correct_count,
        score_percentage=score_percentage,
        passed=passed,
        results=results
    )


@router.get("/results")
async def get_exam_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = db.query(ExamResult).order_by(ExamResult.completed_at.desc()).limit(100).all()
    return [{
        "id": r.id,
        "external_user_id": r.external_user_id,
        "external_user_name": r.external_user_name,
        "session_id": r.session_id,
        "total_questions": r.total_questions,
        "correct_answers": r.correct_answers,
        "score_percentage": r.score_percentage,
        "passed": r.passed,
        "webhook_sent": r.webhook_sent,
        "completed_at": r.completed_at.isoformat() if r.completed_at else None
    } for r in results]

