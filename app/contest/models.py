from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Contest(models.Model):
    CONTEST_TYPE_CHOICES = [
        ('weekly', 'Haftalik Tanlov'),
        ('biweekly', '2-Haftalik Tanlov'),
    ]
    
    title = models.CharField(max_length=100)
    contest_type = models.CharField(max_length=20, choices=CONTEST_TYPE_CHOICES)
    contest_number = models.PositiveIntegerField(help_text="M: Bu hafta 345-chi haftalik tanlov")
    start_time = models.DateTimeField()
    duration = models.PositiveIntegerField(help_text="Daqiqalarda m: 90 daqiqa")  # 90 daqiqa
    problem_count = models.PositiveIntegerField(default=4)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-start_time']
    
    def __str__(self):
        return f"{self.get_contest_type_display()} #{self.contest_number}"


class ContestRegistration(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    contest = models.ForeignKey(Contest, on_delete=models.CASCADE)
    registered_at = models.DateTimeField(auto_now_add=True)
    is_participated = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('user', 'contest')
    
    def __str__(self):
        return f"{self.user.username} - {self.contest.title}"



class UserContestStats(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    total_contests = models.PositiveIntegerField(default=0)
    best_rank = models.PositiveIntegerField(null=True, blank=True)
    average_rank = models.FloatField(null=True, blank=True)
    total_points = models.PositiveIntegerField(default=0)
    last_contest = models.ForeignKey(Contest, null=True, blank=True, on_delete=models.SET_NULL)
    
    def __str__(self):
        return f"{self.user.username} stats"