from typing import List, Dict, Optional
from datetime import datetime
from ninja import Schema
from pydantic import Field

class AnswerOut(Schema):
    id: int
    description: str
    is_correct: bool

class QuestionOut(Schema):
    id: int
    description: str
    answers: List[AnswerOut] = []

class AttemptOut(Schema):
    id: int
    score: float
    passed: bool
    started_at: datetime
    completed_at: datetime
    duration: float

class QuizList(Schema):
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
    questions_count: int
    user_attempts_count: int

class QuizDetailOut(QuizList):
    
    questions: List[QuestionOut] = []
    attempts: List[AttemptOut] = []

class QuizAttemptCreate(Schema):
    answers: Dict[str, int]  # question_id: answer_id
    start_time: datetime

class QuizAttemptOut(Schema):
    id: int
    user_id: int
    quiz_id: int
    score: float
    passed: bool
    started_at: datetime
    completed_at: datetime
    duration: float
    details: Dict

class QuestionAnswerPair(Schema):
    question_id: int
    answer_id: int

class QuizResults(Schema):
    total_questions: int
    correct_answers: int
    score_percentage: float
    passed: bool
    details: Dict
    correct_answers_map: Dict[int, List[int]] = Field(..., alias="correct_answers")

class ErrorResponse(Schema):
    error: str