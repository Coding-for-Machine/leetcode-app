from datetime import timedelta, date
from django.utils import timezone
from django.db.models import Sum
from ninja import Router, Schema
from typing import List, Optional
from .models import UserActivityDaily
from pydantic import BaseModel
from django.contrib.auth.models import User

activity_router = Router()

# ========== SCHEMAS ==========
class UserActivitySchema(Schema):
    date: date
    activity_count: int
    total_duration: int
    score: int

class UserActivityResponseSchema(BaseModel):
    user_id: int
    total_activities: int
    weekly_activities: List[int]
    top_active_day: Optional[date] = None  # 🟢 `None` bo‘lsa, xatolik bermaydi


# ========== API ==========
@activity_router.get("/user/{user_id}/activity", response=UserActivityResponseSchema)
def get_user_activity(request, user_id: int):
    user = User.objects.get(id=user_id)
    today = timezone.now().date()
    start_date = today - timedelta(days=6)

    activities = UserActivityDaily.objects.filter(user=user, date__range=[start_date, today])
    
    weekly_data = {start_date + timedelta(days=i): 0 for i in range(7)}
    for activity in activities:
        weekly_data[activity.date] = activity.activity_count
    
    weekly_list = [weekly_data[day] for day in weekly_data]
    
    total_activities = sum(weekly_list)
    top_active_day = activities.order_by('-activity_count').first()
    top_active_day = top_active_day.date if top_active_day else None
    
    return {
        "user_id": user.id,
        "total_activities": total_activities,
        "weekly_activities": weekly_list,
        "top_active_day": top_active_day
    }

@activity_router.post("/user/{user_id}/log")
def log_activity(request, user_id: int, activity_count: int = 1, duration: int = 0, score: int = 0):
    user = User.objects.get(id=user_id)
    activity = UserActivityDaily.log_activity(user, activity_count, duration, score)
    return {"message": "Activity logged", "activity_id": activity.id}