from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float
from sqlalchemy.sql import func
from backend.database import Base

class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(Text, nullable=False)
    question_image_url = Column(String, nullable=True)
    option_a = Column(String, nullable=False)
    option_b = Column(String, nullable=False)
    option_c = Column(String, nullable=True)
    option_d = Column(String, nullable=True)
    correct_answer = Column(String, nullable=False)
    explanation = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class ExamResult(Base):
    __tablename__ = "exam_results"

    id = Column(Integer, primary_key=True, index=True)
    external_user_id = Column(String, nullable=True)
    external_user_name = Column(String, nullable=True)
    session_id = Column(String, nullable=False, index=True)
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False)
    score_percentage = Column(Float, nullable=False)
    passed = Column(Boolean, nullable=False)
    webhook_url = Column(String, nullable=True)
    webhook_sent = Column(Boolean, default=False)
    completed_at = Column(DateTime, server_default=func.now())


class ExamConfig(Base):
    __tablename__ = "exam_config"

    id = Column(Integer, primary_key=True, index=True)
    passing_score = Column(Float, default=70.0)
    exam_title = Column(String, default="Knowledge Assessment")
    exam_description = Column(Text, nullable=True)
    show_correct_answers = Column(Boolean, default=True)
    shuffle_questions = Column(Boolean, default=False)

