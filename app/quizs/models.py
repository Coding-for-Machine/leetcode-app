from django.db import models
# from django.utils.text import slugify
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from users.models import MyUser
from problems.gnerate_slug import generate_slug_with_case
from problems.models import TimeMixsin

from lessons.models import Lesson
from courses.models import MyModules
from django.contrib.contenttypes.fields import GenericRelation


class Quiz(TimeMixsin):
    bob = models.ForeignKey(MyModules, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField()
    time_limit = models.PositiveIntegerField(default=600)
    user = models.ForeignKey(MyUser, on_delete=models.CASCADE)
    passing_score = models.PositiveIntegerField(default=70)
    show_correct_answers = models.BooleanField(default=True)
    attempts_allowed = models.PositiveIntegerField(default=1)
    
    def __str__(self):
        return self.title

class Question(TimeMixsin):
    quiz = models.ForeignKey(Quiz, on_delete=models.SET_NULL, blank=True, null=True)
    lesson = models.ForeignKey(Lesson, on_delete=models.SET_NULL, blank=True, null=True)
    description = models.TextField()
    user = models.ForeignKey(MyUser, on_delete=models.CASCADE)
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Question"
        verbose_name_plural = "Questions"
    def __str__(self):
        return f"Savol-> {self.description[:50]}"


class Answer(TimeMixsin):
    question = models.ForeignKey(Question, related_name='answers', on_delete=models.CASCADE)
    description = models.TextField()
    is_correct = models.BooleanField(default=False)
    class Meta:
        verbose_name = "Savollarga-Javob"
        verbose_name_plural = "Savollarga-Javoblar"

    def __str__(self):
        return f"{self.description}"
    

class QuizAttempt(models.Model):
    user = models.ForeignKey(MyUser, on_delete=models.CASCADE)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    score = models.FloatField()
    passed = models.BooleanField()
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(auto_now=True)
    details = models.JSONField(default=dict)  # {question_id: {'answer_id': 1, 'correct': True}}

    class Meta:
        ordering = ['-completed_at']
        unique_together = ['user', 'quiz', 'started_at']

    def duration(self):
        return (self.completed_at - self.started_at).total_seconds()