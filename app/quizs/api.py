from ninja import Router
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
from typing import Dict, List
from datetime import datetime
from django.utils.timezone import now
from django.db.models import Count

from app.api import api
from .models import Quiz, Question, Answer, QuizAttempt
from .schemas import QuizAttemptCreate, QuizAttemptOut, QuizDetailOut, QuizList, QuizResults, ErrorResponse
from users.models import MyUser
from users.auth import JWTBaseAuth

router = Router(tags=["quiz"])

@router.get("quizzes/", response=List[QuizList], auth=JWTBaseAuth())
def quiz_list(request):
    """Get list of all active quizzes"""
    quizzes = Quiz.objects.filter(is_active=True).annotate(
        questions_count=Count('questions'),
    ).prefetch_related('quizattempt_set')
    
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
            "updated_at": q.updated_at,
            "questions_count": q.questions_count,
            "user_attempts_count": q.quizattempt_set.filter(user=request.user).count(),
        }
        for q in quizzes
    ]

@router.get("/quizzes/{quiz_id}/", response=QuizDetailOut, auth=JWTBaseAuth())
def get_quiz_details(request, quiz_id: str):
    """Get detailed information about a specific quiz"""
    quiz = get_object_or_404(
        Quiz.objects.prefetch_related(
            'questions__answers',
            'quizattempt_set'
        ),
        slug=quiz_id
    )
    
    # Prepare questions data
    questions = []
    for question in quiz.questions.all():
        questions.append({
            "id": question.id,
            "description": question.description,
            "answers": [
                {
                    "id": answer.id,
                    "description": answer.description,
                    "is_correct": answer.is_correct
                }
                for answer in question.answers.all()
            ]
        })
    
    # Prepare attempts data
    attempts = []
    for attempt in quiz.quizattempt_set.filter(user=request.user):
        attempts.append({
            "id": attempt.id,
            "score": attempt.score,
            "passed": attempt.passed,
            "started_at": attempt.started_at,
            "completed_at": attempt.completed_at,
            "duration": attempt.duration().total_seconds() if attempt.completed_at else None
        })
    
    return {
        "id": quiz.id,
        "title": quiz.title,
        "slug": quiz.slug,
        "description": quiz.description,
        "time_limit": quiz.time_limit,
        "passing_score": quiz.passing_score,
        "show_correct_answers": quiz.show_correct_answers,
        "attempts_allowed": quiz.attempts_allowed,
        "created_at": quiz.created_at,
        "updated_at": quiz.updated_at,
        "questions": questions,
        "attempts": attempts,
        "questions_count": len(questions),
        "user_attempts_count": len(attempts),
    }

def check_answers(quiz: Quiz, user_answers: Dict[str, int]) -> Dict:
    """Check user answers against correct answers and calculate score"""
    questions = quiz.questions.prefetch_related('answers')
    total_questions = questions.count()
    correct_answers = 0
    details = {}
    correct_answers_map = {}
    
    for question in questions:
        user_answer = user_answers.get(str(question.id))
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
            'question_id': question.id,
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

@router.post("/quizzes/{quiz_id}/attempt/", response={200: QuizAttemptOut, 403: ErrorResponse}, auth=JWTBaseAuth())
def create_quiz_attempt(request, quiz_id: str, payload: QuizAttemptCreate):
    """Create a new quiz attempt"""
    quiz = get_object_or_404(Quiz, slug=quiz_id)
    user = request.user
    
    # Check if user can take the quiz
    user_attempts_count = QuizAttempt.objects.filter(user=user, quiz=quiz).count()
    if quiz.attempts_allowed > 0 and user_attempts_count >= quiz.attempts_allowed:
        return 403, {"error": "You have exceeded the maximum number of attempts"}
    
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
            'user_answers': payload.answers,
            'correct_answers': results['correct_answers'],
            'question_details': results['details']
        }
    )
    
    # Prepare response
    return 200, {
        "id": attempt.id,
        "user_id": user.id,
        "quiz_id": quiz.id,
        "score": attempt.score,
        "passed": attempt.passed,
        "started_at": attempt.started_at,
        "completed_at": attempt.completed_at,
        "duration": (attempt.completed_at - attempt.started_at).total_seconds(),
        "details": attempt.details
    }

@router.get("/attempts/{attempt_id}/", response=QuizAttemptOut, auth=JWTBaseAuth())
def get_attempt_result(request, attempt_id: int):
    """Get detailed results of a specific attempt"""
    attempt = get_object_or_404(QuizAttempt, id=attempt_id, user=request.user)
    return {
        "id": attempt.id,
        "user_id": attempt.user.id,
        "quiz_id": attempt.quiz.id,
        "score": attempt.score,
        "passed": attempt.passed,
        "started_at": attempt.started_at,
        "completed_at": attempt.completed_at,
        "duration": (attempt.completed_at - attempt.started_at).total_seconds() if attempt.completed_at else None,
        "details": attempt.details
    }