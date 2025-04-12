from ninja import Query, Router
from ninja.errors import HttpError
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from django.db.models import Q
from .models import Problem, Language, Category, Examples, Function, TestCase
from ninja.pagination import paginate, PageNumberPagination

api_problem_router = Router(tags=["Problems"])

# --------------------------
# SCHEMAS
# --------------------------

class languagechema(BaseModel):
    id: int
    name: str
    slug: str


class ExampleSchema(BaseModel):
    id: int
    input_text: str
    output_text: str
    explanation: str
    image_url: Optional[str] = None

class FunctionSchema(BaseModel):
    id: int
    language: str
    code: str

class TestCaseSchema(BaseModel):
    id: int
    input_text: str
    output_text: str

class ProblemListSchema(BaseModel):
    id: int
    title: str
    slug: str
    difficulty: str
    points: int
    acceptance: str
    is_solved: bool
    category: str
    created_at: datetime
    updated_at: datetime

class ProblemDetailSchema(ProblemListSchema):
    description: str
    constraints: str
    examples: Optional[List[ExampleSchema]] = None
    language: Optional[List[languagechema]] = None
    functions: Optional[List[FunctionSchema]] = None
    test_cases: Optional[List[TestCaseSchema]] = None

class ProblemCreateSchema(BaseModel):
    title: str
    description: str
    difficulty: int
    category_id: int
    language_ids: List[int]
    tags: Optional[List[str]] = None

# --------------------------
# FILTERS
# --------------------------

class ProblemFilter(BaseModel):
    title: Optional[str] = None
    difficulty: Optional[int] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    created_year: Optional[int] = None
    created_month: Optional[int] = None
    created_day: Optional[int] = None
    is_solved: Optional[bool] = None

# --------------------------
# UTILS
# --------------------------

def build_problem_query(filters: ProblemFilter) -> Q:
    query = Q(is_active=True)
    
    if filters.title:
        query &= Q(title__icontains=filters.title)
    if filters.difficulty:
        query &= Q(difficulty=filters.difficulty)
    if filters.tags:
        query &= Q(tags__name__in=filters.tags)
    if filters.category:
        query &= Q(category__name=filters.category)
    if filters.created_year:
        query &= Q(created_at__year=filters.created_year)
    if filters.created_month:
        query &= Q(created_at__month=filters.created_month)
    if filters.created_day:
        query &= Q(created_at__day=filters.created_day)
    
    return query

# --------------------------
# ENDPOINTS
# --------------------------
class CustomPagination(PageNumberPagination):
    page_size = 20      # Odatiy qiymat
    max_page_size = 100 # Eng ko'pi bilan 100 ta

@api_problem_router.get("/", response=List[ProblemListSchema])
@paginate(CustomPagination)
def list_problems(request, filters: ProblemFilter = Query(...)):
    query = build_problem_query(filters)
    
    problems = Problem.objects.filter(query)\
        .select_related('category')\
        .prefetch_related('tags', 'language', 'category')
    
    return [
        {
            "id": p.id,
            "title": p.title,
            "slug": p.slug,
            "difficulty": p.get_difficulty_display(),
            "points": p.points,
            "acceptance": p.acceptance(),
            "is_solved": p.solved(request.user) if request.user.is_authenticated else False,
            "category": p.category.name,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
        }
        for p in problems
    ]

@api_problem_router.get("/{slug}/", response=ProblemDetailSchema)
def problem_detail(request, slug: str):
    try:
        problem = Problem.objects\
            .select_related('category')\
            .prefetch_related(
                'tags',
                'language',
                'examples',
                'functions__language',
                'test_problem'
            )\
            .get(slug=slug, is_active=True)
        
        return {
            "id": problem.id,
            "title": problem.title,
            "slug": problem.slug,
            "difficulty": problem.get_difficulty_display(),
            "points": problem.points,
            "acceptance": problem.acceptance(),
            "is_solved": problem.solved(request.user) if request.user.is_authenticated else False,
            "category": problem.category.name,
            "created_at": problem.created_at,
            "updated_at": problem.updated_at,
            "description": problem.description,
            "constraints": problem.constraints,
            "examples": [
                {
                    "id": e.id,
                    "input_text": e.input_txt,
                    "output_text": e.output_txt,
                    "explanation": e.explanation,
                    "image_url": e.img.url if e.img else None
                }
                for e in problem.examples.all()
            ],
            "language": [
                {"id": l.id, "name": l.name, "slug": l.slug}
                for l in problem.language.all()
            ],
            "functions": [
                {
                    "id": f.id,
                    "language": f.language.name,
                    "code": f.function
                }
                for f in problem.functions.all()
            ],
            "test_cases": [
                {
                    "id": t.id,
                    "input_text": t.input_txt,
                    "output_text": t.output_txt,
                }
                for t in problem.test_problem.filter(is_active=True)[:3]
            ]
        }
    except Problem.DoesNotExist:
        raise HttpError(404, "Problem not found")

@api_problem_router.get("/random/", response=ProblemListSchema)
def random_problem(request):
    problem = Problem.objects\
        .filter(is_active=True)\
        .order_by('?')\
        .select_related('category')\
        .first()
    
    if not problem:
        raise HttpError(404, "No active problems found")
    
    return ProblemListSchema.from_orm(problem)

@api_problem_router.post("/", response=ProblemDetailSchema)
def create_problem(request, payload: ProblemCreateSchema):
    # Validation and creation logic here
    pass

@api_problem_router.put("/{slug}/", response=ProblemDetailSchema)
def update_problem(request, slug: str, payload: ProblemCreateSchema):
    # Update logic here
    pass