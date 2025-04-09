from ninja import Router
from ninja.errors import HttpError
from pydantic import BaseModel
from datetime import datetime
from .models import Problem, Language, ExecutionTestCase, TestCase, Function, Category
from typing import List, Optional
import random

api_problem_router = Router(tags=["Problems"])

# -------------- Schemas --------------
class LanguageSchema(BaseModel):
    id: int
    name: str
    slug: str

class CategorySchema(BaseModel):
    id: int
    name: str
    slug: str

class ExecutionTestCaseSchema(BaseModel):
    id: int
    language: str
    code: str

class TestCaseSchema(BaseModel):
    id: int
    input_txt: str
    output_txt: str

class FunctionSchema(BaseModel):
    id: int
    language: str
    function: str

class ProblemDetailSchema(BaseModel):
    id: int
    languages: List[LanguageSchema]
    category: List[CategorySchema]
    title: str
    slug: str
    description: str
    difficulty: str
    points: int
    created_at: datetime
    updated_at: datetime
    execution_test_cases: Optional[List[ExecutionTestCaseSchema]] = []
    test_cases: List[TestCaseSchema]
    functions: List[FunctionSchema]

class ProblemListSchema(BaseModel):
    id: int
    title: str
    slug: str
    difficulty: str
    points: int
    acceptance: str
    solved: Optional[bool] = False
    category: List[str]
    created_at: datetime
    updated_at: datetime

# -------------- Endpointlar --------------
@api_problem_router.get("/", response=List[ProblemListSchema])
def get_problems(request, category: str = None):
    """Barcha faol masalalarni ro'yxatini qaytaradi"""
    problems = Problem.objects.filter(is_active=True).prefetch_related('category')
    
    if category:
        problems = problems.filter(category__slug=category)
    
    return [
        {
            "id": problem.id,
            "title": problem.title,
            "slug": problem.slug,
            "difficulty": problem.get_difficulty_display(),
            "points": problem.points,
            "category": [cat.name for cat in problem.category.all()],
            "acceptance": problem.acceptance(),
            "solved": problem.solved(request.user),
            "created_at": problem.created_at,
            "updated_at": problem.updated_at,
        }
        for problem in problems
    ]

@api_problem_router.get("/{slug}/", response=ProblemDetailSchema)
def get_problem_detail(request, slug: str):
    """Berilgan slug bo'yicha masala to'liq ma'lumotini qaytaradi"""
    try:
        problem = Problem.objects.prefetch_related(
            "language",
            "category",
            "execution_problem",
            "execution_problem__language",
            "test_problem",
            "functions",
            "functions__language"
        ).get(slug=slug, is_active=True)

        return {
            "id": problem.id,
            "languages": [
                {"id": lang.id, "name": lang.name, "slug": lang.slug} 
                for lang in problem.language.all()
            ],
            "category": [
                {"id": cat.id, "name": cat.name, "slug": cat.slug}
                for cat in problem.category.all()
            ],
            "title": problem.title,
            "slug": problem.slug,
            "description": problem.description,
            "difficulty": problem.get_difficulty_display(),
            "points": problem.points,
            "created_at": problem.created_at,
            "updated_at": problem.updated_at,
            "execution_test_cases": [
                {"id": ex.id, "language": ex.language.name, "code": ex.code} 
                for ex in problem.execution_problem.all()
            ],
            "test_cases": [
                {"id": test.id, "input_txt": test.input_txt, "output_txt": test.output_txt}
                for test in problem.test_problem.all()[:3]  # Faqat 3 ta test holati
            ],
            "functions": [
                {"id": func.id, "language": func.language.name, "function": func.function} 
                for func in problem.functions.all()
            ],
        }
    except Problem.DoesNotExist:
        raise HttpError(404, "Masala topilmadi!")

@api_problem_router.get("/random/", response=ProblemListSchema)
def get_random_problem(request):
    """Tasodifiy bir masalani qaytaradi"""
    problem = Problem.objects.filter(is_active=True).order_by("?").first()
    if not problem:
        raise HttpError(404, "Aktiv masalalar topilmadi")
    
    return {
        "id": problem.id,
        "title": problem.title,
        "slug": problem.slug,
        "difficulty": problem.get_difficulty_display(),
        "points": problem.points,
        "category": [cat.name for cat in problem.category.all()],
        "acceptance": problem.acceptance(),
        "solved": problem.solved(request.user),
        "created_at": problem.created_at,
        "updated_at": problem.updated_at,
    }