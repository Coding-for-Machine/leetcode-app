from django.shortcuts import get_object_or_404
from ninja import Router
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from ninja.errors import HttpError
from problems.models import Problem
from users.models import MyUser
from .models import Comment, Like

api_comments_router_like = Router(tags=["Comments"])


# ---------------->commits---Schemas<-------------------

class AuthorSchema(BaseModel):
    username: str
    email: str
    image: Optional[str] = None

class CommentSchema(BaseModel):
    author: AuthorSchema
    content: str
    created_at: datetime
    updated_at: datetime

class CommentCreateSchema(BaseModel):
    problem_id: int
    content: str
# ----------------like-schemas---------------

class LikeSchema(BaseModel):
    problem_id: int


@api_comments_router_like.get("/{problem_id}", response=List[CommentSchema])
def comments_list_api(request, problem_id: int):
    """Muammoga tegishli barcha kommentlarni chiqaradi."""
    try:
        problem = get_object_or_404(Problem, id=problem_id)

        return [
            {
                "author": {
                    "username": c.author.username,
                    "email": c.author.email,
                    "image": c.author.profile.image.url,
                },
                "content": c.content,
                "created_at": c.created_at,
                "updated_at": c.updated_at,
            }
            for c in problem.comments.all()
        ]
    except Exception as e:
        raise HttpError(500, {"error": "Ichki xatolik yuz berdi!", "code": 5001, "details": str(e)})


@api_comments_router_like.post("/create", response={201: CommentSchema, 400: dict, 401: dict, 404: dict, 500: dict})
def comments_post_api(request, data: CommentCreateSchema):
    """Yangi comment yaratish API'si"""
    try:
        if request.auth is None:
            raise HttpError(401, {"error": "Ro'yxatdan o'ting!", "code": 2001})

        problem = get_object_or_404(Problem, id=data.problem_id)

        user = request.auth

        comment = Comment.objects.create(
            problem=problem,
            author=user,
            content=data.content,
        )
        image_url = None

        if getattr(comment.author, 'profile', None):
            image_field = getattr(comment.author.profile, 'image', None)
            if image_field:
                image_url = image_field.url  # .url bilan rasm manzilini olish
        return 201, {
            "author": {
                "username": comment.author.username,
                "email": comment.author.email,
                "image": image_url,
            },
            "content": comment.content,
            "created_at": comment.created_at,
            "updated_at": comment.updated_at,
        }
    
    except Problem.DoesNotExist:
        raise HttpError(404, {"error": "Muammo topilmadi!", "code": 2002})
    
    except Exception as e:
        raise HttpError(500, {"error": "Ichki server xatosi!", "code": 5001, "details": str(e)})
# -------------Like----------------------

# problems orqali like larni olish

@api_comments_router_like.get("/like/{id}", response=dict)
def like_list_problems(request, id: int):
    try:
        problem = Problem.objects.get(id=id)
        like_count = Like.objects.filter(problems=problem).count()
        return 200, {"like_count": like_count}
    
    except problem.DoesNotExist as err:
        raise HttpError(404, {"error": "Muammo topilmadi!", "code": "2002"})
    
    except Exception as e:
        raise HttpError(500, {"error": "Ichki server xatosi!", "code": 5001, "details": str(e)})
    

@api_comments_router_like.post("/like/", response={201: dict, 400: dict, 401: dict, 404: dict, 500: dict})
def like_problem(request, data: LikeSchema):
    try:
        if request.auth is None:
            raise HttpError(401, {"error": "Ro'yxatdan o'ting!", "code": 2001})

        problem = get_object_or_404(Problem, id=data.problem_id)
        user = request.auth

        if Like.objects.filter(problem=problem, user=user).exists():
            raise HttpError(400, {"error": "Siz allaqachon like qo'yganmisiz!", "code": 3001})

        Like.objects.create(problem=problem, user=user)

        return 201, {"message": "Like qo'shildi!", "code": 1001}
    
    except Problem.DoesNotExist as err:
        raise HttpError(404, {"error": "Muammo topilmadi!", "code": "2002"})
    
    except Exception as e:
        raise HttpError(500, {"error": "Ichki server xatosi!", "code": 5001, "details": str(e)})


@api_comments_router_like.delete("/unlike/", response={200: dict, 400: dict, 401: dict, 404: dict, 500: dict})
def unlike_problem(request, data: LikeSchema):
    try:
        if request.auth is None:
            raise HttpError(401, {"error": "Ro'yxatdan o'ting!", "code": 2001})

        problem = get_object_or_404(Problem, id=data.problem_id)
        user = request.auth

        like = Like.objects.filter(problem=problem, user=user).first()
        if not like:
            raise HttpError(400, {"error": "Siz bu muammoga like qo‘ymagansiz!", "code": 3002})
        like.delete()
        return 200, {"message": "Like olib tashlandi!", "code": 1002}
    
    except Problem.DoesNotExist as err:
        raise HttpError(404, {"error": "Muammo topilmadi!", "code": "2002"})
    
    except Exception as e:
        raise HttpError(500, {"error": "Ichki server xatosi!", "code": 5001, "details": str(e)})