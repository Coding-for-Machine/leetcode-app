from ninja import Router
from ninja.errors import HttpError
from pydantic import BaseModel
from datetime import datetime
from .models import Problem, Language, ExecutionTestCase, TestCase, Function
from typing import List
from typing import Optional

api_problem_router = Router()

# --------------Schemas----------------
class LanguageSchema(BaseModel):
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


class ProblemList(BaseModel):
    id: int
    languages: List[LanguageSchema]
    title: str
    slug: str
    description: str
    difficulty: str
    created_at: datetime
    updated_at: datetime
    execution_test_cases: Optional[List[ExecutionTestCaseSchema]] = []  # ✅ Majburiy emas
    test_cases: List[TestCaseSchema]
    functions: List[FunctionSchema]


class ProblemsAPiList(BaseModel):
    id: int
    title: str
    slug: str
    difficulty: str
    created_at: datetime
    updated_at: datetime

@api_problem_router.get("/", response=List[ProblemsAPiList])
def problem_get_api(request):
    problems = Problem.objects.all()
    return [
        {
            "id": problem.id,
            "title": problem.title,
            "slug": problem.slug,
            "difficulty": problem.difficulty,
            "created_at": problem.created_at,
            "updated_at": problem.updated_at,
        }
        for problem in problems
    ]

@api_problem_router.get("/{slug}/", response=ProblemList)
def problem_detail_api(request, slug: str):
    try:
        problem = Problem.objects.prefetch_related(
                                                    "test_problem",       # oldingi xato: "test_cases"
                                                    "functions"
                                                ).get(slug=slug)

        return {
            "id": problem.id,
            "languages": [
                {"id": lang.id, "name": lang.name, "slug": lang.slug} for lang in problem.language.all()
            ],
            "title": problem.title,
            "slug": problem.slug,
            "description": problem.description,
            "difficulty": problem.difficulty,
            "created_at": problem.created_at,
            "updated_at": problem.updated_at,
            "execution_test_cases": [{"id": ex.id, "language": ex.language.name, "code": ex.code} for ex in problem.execution_problem.all()],
            "test_cases": [
                {"id": test.id, "input_txt": test.input_txt, "output_txt": test.output_txt}
                for test in problem.test_problem.all()[:3]
            ],
            "functions": [
                {"id": func.id, "language": func.language.name, "function": func.function} for func in problem.functions.all()
            ],
        }
    except Problem.DoesNotExist:
        raise HttpError(404, "Topilmadi!")
