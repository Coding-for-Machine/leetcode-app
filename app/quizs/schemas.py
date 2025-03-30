from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from ninja import Schema

from .models import QuizAttempt

class QuizList(BaseModel):
    id: int
    title: str
    slug: str
    description: str
    time_limit: int
    passing_score: int
    show_correct_answers: bool
    attempts_allowed: int
    created_at: datetime
    updated_at: datetime

class AnswerOut(Schema):
    id: int
    description: str
    is_correct: bool
    created_at: datetime
    updated_at: datetime

class QuestionOut(Schema):
    id: int
    description: str
    created_at: datetime
    updated_at: datetime
    content_type: str = Field(..., alias="content_type_model")
    object_id: int
    answers: List[AnswerOut] = []

class QuizAttemptOut(Schema):
    id: int
    score: float
    passed: bool
    started_at: datetime
    completed_at: datetime
    duration: str

class QuizDetailOut(Schema):
    id: int
    title: str
    slug: str
    description: str
    time_limit: int
    passing_score: int
    show_correct_answers: bool
    attempts_allowed: int
    created_at: datetime
    updated_at: datetime
    questions: List[QuestionOut] = []
    attempts: List[QuizAttemptOut] = []
    questions_count: int = 0
    user_attempts_count: int = 0
    can_take_quiz: bool = True

    @staticmethod
    def resolve_questions_count(obj):
        return obj.questions.count()

    @staticmethod
    def resolve_user_attempts_count(obj, context):
        request = context["request"]
        return QuizAttempt.objects.filter(quiz=obj, user=request.auth).count()

    @staticmethod
    def resolve_can_take_quiz(obj, context):
        request = context["request"]
        if obj.attempts_allowed == 0:
            return True
        attempts = QuizAttempt.objects.filter(quiz=obj, user=request.auth).count()
        return attempts < obj.attempts_allowed
    

class QuizAttemptCreate(Schema):
    answers: Dict[int, int]  # {question_id: answer_id}
    start_time: datetime  # When the quiz was started

class QuizAttemptOut(Schema):
    id: int
    user_id: int
    quiz_id: int
    score: float
    passed: bool
    started_at: datetime
    completed_at: datetime
    duration: str
    details: Dict[str, dict] = {}