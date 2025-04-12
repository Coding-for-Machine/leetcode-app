# models.py
from datetime import timedelta
from django.db import models
from django.utils import timezone
from django.conf import settings
from problems.models import Problem
from django.db.models import Sum, Count
from typing import TYPE_CHECKING
from problems.models import TimeMixsin

if TYPE_CHECKING:
    from solution.models import Solution

User = settings.AUTH_USER_MODEL


class UserActivityDaily(TimeMixsin):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_activities')
    date = models.DateField(default=timezone.now)
    activity_count = models.PositiveIntegerField(default=0)
    total_duration = models.PositiveIntegerField(default=0)  # daqiqalarda
    score = models.PositiveIntegerField(default=0) 
    problem_solved = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'date'], name='unique_user_date')
        ]
        ordering = ['-date']
        verbose_name = "User Daily Activity"
        verbose_name_plural = "User Daily Activities"

    @classmethod
    def log_activity(cls, user, activity_type='problem_solved', duration=0, score=0):
        today = timezone.now().date()
        activity, created = cls.objects.get_or_create(user=user, date=today)
        
        if activity_type == 'problem_solved':
            activity.problem_solved += 1
        activity.activity_count += 1
        activity.total_duration += duration
        activity.score += score
        activity.save()
        return activity


class Badge(TimeMixsin):
    BADGE_TYPES = [
        ('streak', 'Streak'),
        ('solved', 'Problems Solved'),
        ('contest', 'Contest Performance'),
        ('skill', 'Skill Mastery'),
    ]
    
    name = models.CharField(max_length=255)
    description = models.TextField()
    icon = models.CharField(max_length=100)  # Font awesome icon class
    badge_type = models.CharField(max_length=20, choices=BADGE_TYPES)
    threshold = models.IntegerField()  # Minimum requirement to earn
    color = models.CharField(max_length=20, default='#6366f1')  # Badge color

    def __str__(self):
        return self.name

class UserBadge(TimeMixsin):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    date_earned = models.DateTimeField(auto_now_add=True)
    progress = models.FloatField(default=100)  # 100% if fully earned

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'badge'], name='unique_user_badge')
        ]

    def __str__(self):
        return f"{self.user.email} - {self.badge.name}"

class UserProblemStatus(TimeMixsin):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='problem_status_user')
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name='problem_status')
    is_completed = models.BooleanField(default=False)  
    score = models.PositiveIntegerField(default=0)  

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'problem'], name='unique_user_problem')
        ]

    def __str__(self):
        return f"{self.user.email} - {self.problem.title}"

    @classmethod
    def mark_completed(cls, user, problem):
        points = {
                1: 100,
                2: 250,
                3: 450,
                4: 700
            }.get(problem.points, 100)
        update, create = cls.objects.get_or_create(
            user = user,
            problem=problem,
            is_completed=True,
            score = points
        )
        
        return update

class UserStats(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='stats')
    total_solved = models.PositiveIntegerField(default=0)
    easy_solved = models.PositiveIntegerField(default=0)
    medium_solved = models.PositiveIntegerField(default=0)
    hard_solved = models.PositiveIntegerField(default=0)
    very_hard_solved = models.PositiveIntegerField(default=0)
    total_score = models.PositiveIntegerField(default=0)
    current_streak = models.PositiveIntegerField(default=0)
    max_streak = models.PositiveIntegerField(default=0)
    last_activity = models.DateTimeField(null=True, blank=True)

    @classmethod
    def update_stats(cls, user):
        """
        Foydalanuvchining barcha yechgan masalalarini olish
        va statistikalarni yangilash
        """
        solved_status = user.problem_status_user.filter(is_completed=True)
        
        cls.total_solved = solved_status.count()
        cls.easy_solved = solved_status.filter(problem__difficulty=1).count()
        cls.medium_solved = solved_status.filter(problem__difficulty=2).count()
        cls.hard_solved = solved_status.filter(problem__difficulty=3).count()
        cls.very_hard_solved = solved_status.filter(problem__difficulty=4).count()
        
        cls.total_score = solved_status.aggregate(Sum('score'))['score__sum'] or 0
        
        # Streakni yangilash
        cls.update_streaks(user)

        # Foydalanuvchining oxirgi faoliyatini yangilash
        cls.last_activity = solved_status.latest('date_completed').date_completed if solved_status.exists() else None
        
        cls.save()

    @classmethod
    def update_streaks(cls, user):
        """
        Foydalanuvchining masalalar ketma-ketligini tekshirib, 
        strekni yangilash
        """
        streak_count = 0
        max_streak = 0
        for status in user.problem_status_user.filter(is_completed=True).order_by('date_completed'):
            if status.created_at.date() == (status.created_at - timedelta(days=1)).date():
                streak_count += 1
            else:
                streak_count = 1
            max_streak = max(max_streak, streak_count)
        cls.current_streak = streak_count
        cls.max_streak = max_streak
        cls.save()
