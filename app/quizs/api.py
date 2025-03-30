from ninja import Router
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
from typing import Dict, List

from app.api import api

from .models import Quiz, Question, Answer, QuizAttempt
from .schemas import QuizAttemptCreate, QuizAttemptOut, QuizDetailOut, QuizList
from users.models import MyUser

router = Router()

@router.get("quizzes/", response=List[QuizList])
def quize_api(request):
    return [
        {
            "id": q.id,
            "title": q.title,
            "slug": q.slug,
            "description": q.description,
            "time_limit": q.time_limit,
            "passing_score": q.passing_score,
            "show_correct_answers": q.show_correct_answers,
            "attempts_allowed": q.attempts_allowed,
            "created_at": q.created_at,
            "updated_at": q.updated_at
        }
        for q in Quiz.objects.filter(is_active=True)
    ]

@router.get("/quizzes/{quiz_id}/", response=QuizDetailOut)
def get_quiz_details(request, quiz_id: str):
    # Quizni olish va prefetch qilish
    quiz = get_object_or_404(
        Quiz.objects.prefetch_related(
            'questions__answers',
            'quizattempt_set'
        ),
        slug=quiz_id
    )
    
    # ContentType modelini stringga o'tkazish
    for question in quiz.questions.all():
        question.content_type_model = question.content_type.model
    
    # Attempts uchun duration hisoblash
    attempts_data = []
    for attempt in quiz.quizattempt_set.all():
        attempt.duration = str(attempt.duration())
        attempts_data.append(attempt)
    
    quiz.attempts = attempts_data
    
    return quiz
from datetime import datetime
from django.utils.timezone import now

@router.post("/quizzes/{quiz_id}/attempts/", response=QuizAttemptOut)
def create_quiz_attempt(request, quiz_id: int, payload: QuizAttemptCreate):
    # Get quiz and user
    quiz = get_object_or_404(Quiz, id=quiz_id)
    user = MyUser.objects.get(id=1)
    
    # Check if user can take the quiz
    # if quiz.attempts_allowed > 0:
    #     attempts = QuizAttempt.objects.filter(quiz=quiz, user=user).count()
    #     if attempts >= quiz.attempts_allowed:
    #         return api.create_response(
    #             request,
    #             {"error": "You have exceeded the maximum number of attempts"},
    #             status=403
    #         )
    
    # Calculate results
    results = check_answers(quiz, payload.answers)
    
    # Create the attempt
    attempt = QuizAttempt.objects.create(
        user=user,
        quiz=quiz,
        score=results['score_percentage'],
        passed=results['passed'],
        started_at=payload.start_time,
        completed_at=now(),
        details={
            'answers': payload.answers,
            'correct_answers': results['correct_answers'],
            'details': results['details']
        }
    )
    
    # Prepare response
    return {
        "id": attempt.id,
        "user_id": user.id,
        "quiz_id": quiz.id,
        "score": attempt.score,
        "passed": attempt.passed,
        "started_at": attempt.started_at,
        "completed_at": attempt.completed_at,
        "duration": str(attempt.duration()),
        "details": attempt.details
    }

def check_answers(quiz: Quiz, user_answers: Dict[int, int]) -> Dict:
    questions = quiz.questions.all()
    total_questions = questions.count()
    correct_answers = 0
    details = {}
    correct_answers_map = {}
    
    for question in questions:
        user_answer = user_answers.get(question.id)
        is_correct = False
        correct_answer_ids = list(question.answers.filter(is_correct=True).values_list('id', flat=True))
        correct_answers_map[question.id] = correct_answer_ids
        
        if user_answer:
            is_correct = question.answers.filter(
                id=user_answer, 
                is_correct=True
            ).exists()
            
            if is_correct:
                correct_answers += 1
        
        details[question.id] = {
            'answered': user_answer,
            'correct': is_correct,
            'correct_answers': correct_answer_ids
        }
    
    score_percentage = (correct_answers / total_questions) * 100 if total_questions else 0
    
    return {
        "total_questions": total_questions,
        "correct_answers": correct_answers,
        "score_percentage": round(score_percentage, 2),
        "passed": score_percentage >= quiz.passing_score,
        "details": details,
        "correct_answers": correct_answers_map
    }