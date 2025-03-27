from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from problems.models import Lesson, Problem
from django.db.models import Sum
from typing import TYPE_CHECKING
from problems.models import TimeMixsin

if TYPE_CHECKING:
    from solution.models import Solution, UserQuizResult




class UserActivityDaily(TimeMixsin):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_activities')
    date = models.DateField(default=timezone.now)  # Foydalanuvchi harakat qilgan sana
    activity_count = models.PositiveIntegerField(default=0)  # Nechta faoliyat bajargani
    total_duration = models.PositiveIntegerField(default=0)  # Umumiy shug‘ullanish vaqti (daqiqalarda)
    score = models.PositiveIntegerField(default=0) 

    class Meta:
        unique_together = ('user', 'date')  # Har kuni faqat bitta yozuv bo'lishi kerak
        ordering = ['-date']
        verbose_name = "User Daily Activity"
        verbose_name_plural = "User Daily Activities"

    def __str__(self):
        return f"{self.user.email} - {self.date}: {self.activity_count} actions, {self.score} points"

    @classmethod
    def log_activity(cls, user, activity_count=1, duration=0, score=0):
        """Foydalanuvchi harakatini qo‘shish yoki yangilash"""
        today = timezone.now().date()
        activity, created = cls.objects.get_or_create(user=user, date=today)
        activity.activity_count += activity_count  # Kiritilgan harakatlar sonini qo‘shish
        activity.total_duration += duration  # Vaqtni qo‘shish
        activity.score += score  # Ballni qo‘shish
        activity.save()
        return activity
    
class Badge(TimeMixsin):
    name = models.CharField(max_length=255)
    description = models.TextField()
    icon = models.ImageField(upload_to="badges/")  # Nishon rasmi

    def __str__(self):
        return self.name


class UserBadge(TimeMixsin):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    date_earned = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.badge.name}"

class UserActivitySummary(TimeMixsin):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    period_type = models.CharField(
        max_length=10,
        choices=[('weekly', 'Weekly'), ('monthly', 'Monthly')]
    )
    period_start = models.DateField()  # Boshlanish sanasi
    period_end = models.DateField()  # Tugash sanasi
    total_score = models.PositiveIntegerField(default=0)  # Umumiy ball
    total_activity = models.PositiveIntegerField(default=0)  # Faoliyatlar soni

    class Meta:
        unique_together = ('user', 'period_type', 'period_start')

    def __str__(self):
        return f"{self.user.email} - {self.period_type}: {self.total_score} points"

class UserLeaderboard(TimeMixsin):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    total_score = models.PositiveIntegerField(default=0)  # Jami ball
    last_updated = models.DateTimeField(auto_now=True)

    @classmethod
    def update_leaderboard(cls, user):
        quiz_score = UserQuizResult.objects.filter(user=user).aggregate(Sum('score'))['score__sum'] or 0
        activity_score = UserActivityDaily.objects.filter(user=user).aggregate(Sum('score'))['score__sum'] or 0
        problem_score = UserProblemStatus.objects.filter(user=user).aggregate(Sum('score'))['score__sum'] or 0
        solution_score = Solution.objects.filter(user=user).aggregate(Sum('score'))['score__sum'] or 0  # ✅ Solution ballari qo'shildi

        total_score = quiz_score + activity_score + problem_score + solution_score
        leaderboard, created = cls.objects.get_or_create(user=user)
        leaderboard.total_score = total_score
        leaderboard.save()




class UserProblemStatus(TimeMixsin):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)  
    score = models.PositiveIntegerField(default=0)  

    def __str__(self):
        return f"User: {self.user.email}, Problem: {self.problem.title}, Completed: {self.is_completed}"
    
    class Meta:
        unique_together = ('user', 'problem')

    @classmethod
    def mark_completed(cls, user, problem, difficulty):
        status, created = cls.objects.get_or_create(user=user, problem=problem)

        if not status.is_completed:  # Faqat bir marta o'zgarishi kerak
            status.is_completed = True
            if difficulty=="easy":
             status.score = 1
            elif difficulty=="medium":
                status.score = 2
            elif difficulty=="hard":
                status.score==2
            status.save()



