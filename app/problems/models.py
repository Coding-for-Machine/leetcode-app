from django.conf import settings
from django.db import models
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from ckeditor_uploader.fields import RichTextUploadingField
from django.utils.text import slugify
from .gnerate_slug import generate_slug_with_case

User = settings.AUTH_USER_MODEL

#  base timemixis
class TimeMixsin(models.Model):
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract=True
        # model yaratmaydi abstract=True

class Categorys(models.Model):
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
    language = models.ManyToManyField(Language, related_name='problems_in_language')
    category = models.ManyToManyField(Categorys, related_name='problems_in_category')
    title = models.CharField(max_length=200, blank=True, null=True)
    slug = models.SlugField(max_length=250, blank=True, null=True)
    description = RichTextUploadingField()
    difficulty_choices = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    difficulty = models.CharField(choices=difficulty_choices, max_length=6)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        if self.title:
            return self.title
        return self.difficulty
    @property
    def get_url(self):
        return reverse("problem_page", kwargs={"slug": self.slug})
    
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


class TestCase(TimeMixsin):
    problem = models.ForeignKey(Problem, related_name="test_problem", on_delete=models.CASCADE)
    language = models.ForeignKey(Language, related_name="test_language", on_delete=models.CASCADE)
    input_txt = models.CharField(max_length=250, help_text="Test Input")
    output_txt = models.CharField(max_length=250, help_text="Chiqish Output")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    def __str__(self):
        return f"Test for {self.problem.title}"
    
    class Meta:
        unique_together = ("problem", "language", "input_txt")

    def __str__(self):
        return f"Test for {self.problem.title} [{self.language.name}]"

    def is_valid_test_case(self):
        """Test holati to‘g‘ri formatda ekanligini tekshiradi"""
        return bool(self.input_txt and self.output_txt)

    def get_summary(self):
        """Test ma'lumotlarini qisqacha formatda chiqarish"""
        return f"Test [{self.language.name}] - Input: {self.input_txt[:30]}..."