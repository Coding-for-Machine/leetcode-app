from ninja import Router
from ninja.errors import HttpError

from pydantic import BaseModel
from datetime import datetime
from .models import Problem


api_problem_router = Router()
# --------------Schemas----------------
from typing import List

class ProblemList(BaseModel):
    id: int
    language: str
    title: str
    slug: str
    description: str
    difficulty: str
    created_at: datetime
    updated_at: datetime

@api_problem_router.get("/", response=List[ProblemList])
def problem_get_api(request):
    return [
            {
            "id": problem.id,
            "language": problem.language,
            "title": problem.title,
            "slug": problem.slug,
            "description": problem.description,
            "difficulty": problem.difficulty,
            "created_at": problem.created_at,
            "updated_at": problem.updated_at,
            }
            for problem in Problem.objects.all()
    ]


@api_problem_router.get("/{slug}/", response=List[ProblemList])
def problem_post_api(request, slug: str):
    try:
        problem = Problem.objects.git(slug=slug)
        return {
            "id": problem.id,
            "language": problem.language,
            "title": problem.title,
            "slug": problem.slug,
            "description": problem.description,
            "difficulty": problem.difficulty,
            "created_at": problem.created_at,
            "updated_at": problem.updated_at,
            }
    except Problem.DoesNotExist as e:
        raise HttpError(404, "topilmadi!")




    
