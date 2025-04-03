from django.conf import settings
from django.db import models
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from ckeditor_uploader.fields import RichTextUploadingField
from django.utils.text import slugify

from lessons.models import Lesson
from .gnerate_slug import generate_slug_with_case
from contest.models import Contest

User = settings.AUTH_USER_MODEL

#  base timemixis
class TimeMixsin(models.Model):
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract=True
        # model yaratmaydi abstract=True

class Category(models.Model):
    name = models.CharField(max_length=250)
    slug = models.SlugField(max_length=500)

    def __str__(self):
        return self.name
    
class Language(TimeMixsin):
    name = models.CharField(max_length=250)
    slug = models.SlugField(blank=True, null=True)

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_slug_with_case(30)  # 10 uzunlikda tasodifiy slug yaratish

        super().save(*args, **kwargs)


    def __str__(self):
        return self.name
    

class Problem(TimeMixsin):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, null=True, blank=True)
    contest = models.ForeignKey(Contest, on_delete=models.CASCADE, null=True, blank=True)
    language = models.ManyToManyField(Language, related_name='problems_in_language')
    category = models.ManyToManyField(Category, related_name='problems_in_category')
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=250, blank=True, unique=True)
    description = RichTextUploadingField()
    
    difficulty_choices = [
        (1, '1 - Oson'),
        (2, '2 - O\'rtacha'),
        (3, '3 - Qiyin'),
        (4, '4 - Juda qiyin'),
    ]
    difficulty = models.PositiveIntegerField(choices=difficulty_choices, default=1)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    points = models.PositiveIntegerField(blank=True)
    order = models.PositiveIntegerField(default=1)
    
    def __str__(self):
        return f"{self.title} ({self.get_difficulty_display()})"
    
    def get_absolute_url(self):
        return reverse("problem_page", kwargs={"slug": self.slug})
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        
        if not self.points:
            self.points = {
                1: 100,
                2: 250,
                3: 450,
                4: 700
            }.get(self.difficulty, 100)
            
        super().save(*args, **kwargs)
    
    class Meta:
        ordering = ['order']
        verbose_name = "Masala"
        verbose_name_plural = "Masalalar"
        
class Function(TimeMixsin):
    language = models.ForeignKey(Language, on_delete=models.CASCADE)
    problem = models.ForeignKey(Problem, related_name="functions", on_delete=models.CASCADE)
    function = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    def __str__(self):
        return self.function[:30]
    
    class Meta:
        unique_together = ("problem", "language")


class ExecutionTestCase(TimeMixsin):
    problem = models.ForeignKey(Problem, related_name="execution_problem", on_delete=models.CASCADE)
    language = models.ForeignKey(Language, related_name="execution_language", on_delete=models.CASCADE)
    code = models.TextField()
    class Meta:
        unique_together = ("problem", "language")


# TestCase modelida faqat bitta __str__ metodini qoldirdim
class TestCase(TimeMixsin):
    problem = models.ForeignKey(Problem, related_name="test_problem", on_delete=models.CASCADE)
    input_txt = models.CharField(max_length=250, help_text="Test Input")
    output_txt = models.CharField(max_length=250, help_text="Chiqish Output")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    def __str__(self):
        return f"Test for {self.problem.title}"

    def is_valid_test_case(self):
        return bool(self.input_txt and self.output_txt)

    def get_summary(self):
        return f"Test - Input: {self.input_txt[:30]}..."