from ninja import Router
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from django.shortcuts import get_object_or_404
from users.models import MyUser
from users.auth import JWTBaseAuth
from .models import Contest, ContestRegistration

# --------- Schemas ---------
class ContestBase(BaseModel):
    id: int
    title: str
    contest_type: str
    contest_number: int
    start_time: datetime
    duration: int
    problem_count: int
    is_user_register: bool
    is_active: bool

class ContestDetail(ContestBase):
    description: str
    created_at: datetime
    registered_participants: int
    progress_percentage: int  # Ro'yxatdan o'tish progressi (60%, 30% kabi)

class ContestStats(BaseModel):
    total_contests: int
    best_rank: Optional[int]
    average_rank: Optional[float]
    total_points: int
    last_contest: Optional[str]

# --------- API ---------
contest_router = Router(tags=["Contests"])

@contest_router.get("/upcoming/", response=List[ContestDetail], auth=JWTBaseAuth())
def upcoming_contests(request):
    contests = Contest.objects.filter(
        is_active=True,
        start_time__gt=datetime.now()
    ).order_by('start_time')
    
    return [{
        "id": c.id,
        "title": c.title,
        "contest_type": c.contest_type,
        "contest_number": c.contest_number,
        "start_time": c.start_time,
        "duration": c.duration,
        "is_active": c.is_active,
        "problem_count": c.problem_count,
        "description": c.description,
        "created_at": c.created_at,
        "is_user_register": ContestRegistration.objects.filter(user=request.user, contest=c).exists(),
        "registered_participants": c.contest_register.count(),  # registration modeli bo'lishi kerak
        "progress_percentage": min(100, int(c.contest_register.count() / 1000 * 100))  # 1000 - maqsadli ishtirokchilar
    } for c in contests]

@contest_router.get("/past/", response=List[ContestBase])
def past_contests(request, limit: int = 10):
    contests = Contest.objects.filter(
        is_active=True,
        start_time__lt=datetime.now()
    ).order_by('-start_time')[:limit]
    
    return [{
        "id": c.id,
        "title": c.title,
        "contest_type": c.contest_type,
        "contest_number": c.contest_number,
        "start_time": c.start_time,
        "duration": c.duration,
        "is_active": c.is_active,
        "problem_count": c.problem_count,
        "description": c.description,
        "created_at": c.created_at,
        "is_user_register": c.contest_register ,
        "is_user_register": ContestRegistration.objects.filter(user=request.user, contest=c).exists(),
        "registered_participants": c.contest_register.count(),  # registration modeli bo'lishi kerak
        "progress_percentage": min(100, int(c.contest_register.count() / 1000 * 100))  # 1000 - maqsadli ishtirokchilar
    } for c in contests]

@contest_router.get("/stats/", response=ContestStats, auth=JWTBaseAuth())
def user_stats(request):
    print(request.user)
    user_id = request.user.id
    user = get_object_or_404(MyUser, pk=user_id)
    user.update_contest_stats()
    stats = user.contest_stats  # Avtomatik yaratiladi/yangilanadi
    
    return {
        "total_contests": stats.total_contests,
        "best_rank": stats.best_rank,
        "average_rank": stats.average_rank,
        "total_points": stats.total_points,
        "last_contest": stats.last_contest.title if stats.last_contest else None
    }



@contest_router.post("/register/", response=dict, auth=JWTBaseAuth())
def register_for_contest(request, contest_id: int):
    try:
        # Foydalanuvchi va tanlov mavjudligini tekshirish
        user = request.user
        contest = Contest.objects.get(pk=contest_id)
        
        # Ro'yxatdan o'tganligini tekshirish
        if ContestRegistration.objects.filter(user=user, contest=contest).exists():
            return {"success": False, "message": "Siz allaqachon ro'yxatdan o'tgansiz"}
        
        # Yangi ro'yxat
        ContestRegistration.objects.create(user=user, contest=contest)
        return {"success": True, "message": "Muvaffaqiyatli ro'yxatdan o'tdingiz"}
    except Contest.DoesNotExist:
        return {"success": False, "message": "Tanlov topilmadi"}

# @contest_router.get("/register-get/", response=dict, auth=JWTBaseAuth())
# def resgiter_get_contest(request, contest_id:int):
#     contest_get = get_object_or_404(ContestRegistration, user=request.user contest__id=contest_id)
#     return {
#         ""
#     }