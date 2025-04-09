# models.py
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


    
class UserAvatar(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='avatar')
    image = models.ImageField(upload_to='avatars/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

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

    def __str__(self):
        return f"{self.user.email} - {self.date}: {self.activity_count} actions"

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
    DIFFICULTY_SCORES = {
        'easy': 1,
        'medium': 3,
        'hard': 5
    }
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='problem_status_user')
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name='problem_status')
    is_completed = models.BooleanField(default=False)  
    score = models.PositiveIntegerField(default=0)  
    solved_at = models.DateTimeField(null=True, blank=True)
    time_taken = models.PositiveIntegerField(default=0, null=True, blank=True)  # seconds
    memory_used = models.PositiveIntegerField(default=0, null=True, blank=True)  # KB

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'problem'], name='unique_user_problem')
        ]

    def __str__(self):
        return f"{self.user.email} - {self.problem.title}"

    @classmethod
    def mark_completed(cls, user, problem, difficulty, time_taken=None, memory_used=None):
        status, created = cls.objects.get_or_create(
            user=user, 
            problem=problem,
            defaults={
                'is_completed': True,
                'score': cls.DIFFICULTY_SCORES.get(difficulty, 1),
                'solved_at': timezone.now(),
                'time_taken': time_taken,
                'memory_used': memory_used
            }
        )
        
        if not status.is_completed:
            status.is_completed = True
            status.score = cls.DIFFICULTY_SCORES.get(difficulty, 1)
            status.solved_at = timezone.now()
            status.time_taken = time_taken
            status.memory_used = memory_used
            status.save()
        
        # Log activity
        UserActivityDaily.log_activity(
            user=user,
            activity_type='problem_solved',
            score=status.score
        )
        
        return status

class UserStats(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='stats')
    total_solved = models.PositiveIntegerField(default=0)
    easy_solved = models.PositiveIntegerField(default=0)
    medium_solved = models.PositiveIntegerField(default=0)
    hard_solved = models.PositiveIntegerField(default=0)
    total_score = models.PositiveIntegerField(default=0)
    current_streak = models.PositiveIntegerField(default=0)
    max_streak = models.PositiveIntegerField(default=0)
    last_activity = models.DateTimeField(null=True, blank=True)

    def update_stats(self):
        # Update solved problems counts
        self.total_solved = self.user.problem_statuses.filter(is_completed=True).count()
        self.easy_solved = self.user.problem_statuses.filter(
            is_completed=True, 
            problem__difficulty='easy'
        ).count()
        self.medium_solved = self.user.problem_statuses.filter(
            is_completed=True, 
            problem__difficulty='medium'
        ).count()
        self.hard_solved = self.user.problem_statuses.filter(
            is_completed=True, 
            problem__difficulty='hard'
        ).count()
        
        self.total_score = self.user.problem_statuses.filter(
            is_completed=True
        ).aggregate(Sum('score'))['score__sum'] or 0
        
        self.update_streaks()
        self.save()

    def update_streaks(self):
        # Streak calculation logic
        pass

    def __str__(self):
        return f"{self.user.email} stats"
