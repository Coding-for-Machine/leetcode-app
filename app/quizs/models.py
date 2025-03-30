from django.db import models
# from django.utils.text import slugify
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from users.models import MyUser
from problems.gnerate_slug import generate_slug_with_case
from problems.models import TimeMixsin

from courses.models import MyModules


from django.contrib.contenttypes.fields import GenericRelation


class Quiz(TimeMixsin):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField()
    time_limit = models.PositiveIntegerField(default=600)
    user = models.ForeignKey(MyUser, on_delete=models.CASCADE)
    passing_score = models.PositiveIntegerField(default=70)
    show_correct_answers = models.BooleanField(default=True)
    attempts_allowed = models.PositiveIntegerField(default=1)
    
    # GenericRelation qo'shamiz
    questions = GenericRelation(
        'Question',
        content_type_field='content_type',
        object_id_field='object_id',
        related_query_name='quiz_questions'
    )


class Question(TimeMixsin):
    content_type = models.ForeignKey(
        ContentType, 
        on_delete=models.CASCADE,
        limit_choices_to={'model__in': ['quiz', 'problem', 'lesson']} 
    )
    object_id = models.PositiveIntegerField()  # Bog‘langan model ID si
    content_object = GenericForeignKey('content_type', 'object_id')  # GenericForeignKey
    description = models.TextField()
    user = models.ForeignKey(MyUser, on_delete=models.CASCADE)
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Question"
        verbose_name_plural = "Questions"

    def save(self, *args, **kwargs):
        if self.content_object:
            self.content_type = ContentType.objects.get_for_model(self.content_object.__class__)
            self.object_id = self.content_object.id
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.get_related_object()} - {self.description[:50]}"

    def get_related_object(self):
        return self.content_object

    def get_quiz_or_topic_name(self):
        related_object = self.get_related_object()
        return related_object.description if hasattr(related_object, 'title') else related_object.description

    def get_model_type(self):
        return self.content_type.model
    
    



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
        """Test topshirish uchun sarflangan vaqt"""
        return self.completed_at - self.started_at