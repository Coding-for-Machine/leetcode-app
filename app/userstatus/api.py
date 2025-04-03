from ninja import Router
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
import calendar
from typing import List, Optional
from .models import UserActivityDaily, UserBadge, UserProblemStatus, UserStats
from .schemas import (
    ActivitySchema, BadgeSchema, UserProblemStatusSchema, 
    UserStatsSchema, ContributionCalendarSchema
)

activity_router = Router(tags=["user-status"])



@activity_router.get("/activities", response=List[ActivitySchema])
def get_user_activities(request):
    activate = UserActivityDaily.objects.filter(user=request.user).order_by('-date')
    return [
        {
            "id": a.id,
            "date": a.date,
            "activity_count":a.activity_count,
            "total_duration": a.total_duration,
            "score": a.score,
            "problem_solved": a.problem_solved,
        }
        for a in activate
    ]

@activity_router.get("/badges", response=List[BadgeSchema])
def get_user_badges(request):
    badges = UserBadge.objects.filter(user=request.user).select_related('badge').order_by('-date_earned')
    return [
        {
            "id": b.id,
            "badge": {
                "name":b.badge.name,
                "description": b.badge.description,
                "icon": b.badge.icon,
                "badge_type": b.badge.badge_type,
                "threshold": b.badge.threshold,
                "color": b.badge.color,
            },
            "date_earned": b.date_earned,
            "progress": b.progress,
        }
        for b in badges
    ]

@activity_router.get("/problems", response=List[UserProblemStatusSchema])
def get_user_problems(request):
    return [
        {
            "problem_id": s.problem.id,
            "problem_title": s.problem.title,
            "is_completed": s.is_completed,
            "score": s.score,
            "solved_at": s.solved_at,
            "time_taken": s.time_taken,
            "memory_used": s.memory_used,
        }
        for s in UserProblemStatus.objects.filter(user=request.user, is_completed=True)
    ]

@activity_router.get("/stats", response=UserStatsSchema)
def get_user_stats(request):
    stats, _ = UserStats.objects.get_or_create(user=request.user)
    stats.update_stats()
    return {
        "total_solved": stats.total_solved,
        "easy_solved": stats.easy_solved,
        "medium_solved": stats.medium_solved,
        "hard_solved": stats.hard_solved,
        "total_score": stats.total_score,
        "current_streak": stats.current_streak,
        "max_streak": stats.max_streak,
        "last_activity": stats.last_activity,
    }

@activity_router.get("/contributions", response=ContributionCalendarSchema)
def get_contribution_calendar(request, year: Optional[int] = None):
    if not year:
        year = timezone.now().year

    activities = UserActivityDaily.objects.filter(user=request.user, date__year=year)
    activity_dict = {str(act.date): {'count': act.problem_solved or act.activity_count, 'date': act.date} for act in activities}

    calendar_data = []
    for month in range(1, 13):
        num_days = calendar.monthrange(year, month)[1]
        month_data = {'month': calendar.month_abbr[month], 'days': []}
        
        for day in range(1, num_days + 1):
            date = f"{year}-{month:02d}-{day:02d}"
            day_data = activity_dict.get(date, {'count': 0, 'date': date})
            month_data['days'].append(day_data)
        
        calendar_data.append(month_data)
    
    return {'year': year, 'total': sum(act.problem_solved or act.activity_count for act in activities), 'calendar': calendar_data}

