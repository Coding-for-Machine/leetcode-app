from django.shortcuts import get_object_or_404
from ninja import Router
from pydantic import BaseModel
from typing import Dict
from ninja.errors import HttpError
from problems.models import Problem
from users.models import MyUser
from .models import Bookmark

api_request_bookmarks = Router(tags=["Bookmarks"])

class BookmarkSchema(BaseModel):
    problem_id: int

@api_request_bookmarks.get("/bookmark/{problem_id}/", response=Dict[str, int])
def bookmark_list_problems(request, problem_id: int):
    try:
        problem = get_object_or_404(Problem, id=problem_id)
        bookmark_count = Bookmark.objects.filter(problems=problem).count()
        return {"bookmark_count": bookmark_count}
    
    except Exception as e:
        raise HttpError(500, {"error": "Ichki server xatosi!", "code": 5001, "details": str(e)})

@api_request_bookmarks.post("/bookmark/", response={201: Dict[str, str], 400: Dict[str, str], 401: Dict[str, str], 404: Dict[str, str], 500: Dict[str, str]})
def bookmark_problem(request, data: BookmarkSchema):
    try:
        if request.auth is None:
            raise HttpError(401, {"error": "Ro'yxatdan o'ting!", "code": 2001})

        problem = get_object_or_404(Problem, id=data.problem_id)
        user = request.auth

        if Bookmark.objects.filter(problems=problem, user=user).exists():
            raise HttpError(400, {"error": "Siz allaqachon bu muammoga xatcho‘p qo‘yganmisiz!", "code": 4001})

        Bookmark.objects.create(problems=problem, user=user)

        return 201, {"message": "Xatcho‘p qo‘shildi!", "code": 1001}
    
    except Exception as e:
        raise HttpError(500, {"error": "Ichki server xatosi!", "code": 5001, "details": str(e)})

@api_request_bookmarks.delete("/bookmark/", response={200: Dict[str, str], 400: Dict[str, str], 401: Dict[str, str], 404: Dict[str, str], 500: Dict[str, str]})
def remove_bookmark(request, data: BookmarkSchema):
    try:
        if request.auth is None:
            raise HttpError(401, {"error": "Ro'yxatdan o'ting!", "code": 2001})

        problem = get_object_or_404(Problem, id=data.problem_id)
        user = request.auth

        bookmark = Bookmark.objects.filter(problems=problem, user=user).first()
        if not bookmark:
            raise HttpError(400, {"error": "Siz bu muammoga xatcho‘p qo‘ymagansiz!", "code": 4002})

        bookmark.delete()

        return 200, {"message": "Xatcho‘p olib tashlandi!", "code": 1002}
    
    except Exception as e:
        raise HttpError(500, {"error": "Ichki server xatosi!", "code": 5001, "details": str(e)})
