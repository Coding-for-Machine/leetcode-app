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

class Tags(TimeMixsin):
    name = models.CharField(max_length=50)
    
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
    tags = models.ManyToManyField(Tags)
    language = models.ManyToManyField(Language, related_name='problems_in_language')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='problems_in_category', null=True, blank=True)
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=250, blank=True, unique=True)
    description = RichTextUploadingField()
    constraints = models.TextField(
        help_text="HTML formatida cheklovlar",
        default="""
        <ul>
            <li><code>2 ≤ nums.length ≤ 10<sup>4</sup></code></li>
        </ul>
        """
    )
    
    difficulty_choices = [
        (1, 'Oson'),
        (2, 'O\'rtacha'),
        (3, 'Qiyin'),
        (4, 'Juda qiyin'),
    ]
    difficulty = models.PositiveIntegerField(choices=difficulty_choices, default=1)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    points = models.PositiveIntegerField(blank=True)
    order = models.PositiveIntegerField(default=1)
    
    def __str__(self):
        return f"{self.title} ({self.get_difficulty_display()})"
    
    def get_absolute_url(self):
        return reverse("problem_page", kwargs={"slug": self.slug})
    
    def acceptance(self):
        total_submissions = self.solution.count()
        if total_submissions == 0:
            return "0%"
        accepted_submissions = self.solution.filter(is_accepted=True).count()
        acceptance_rate = (accepted_submissions / total_submissions) * 100
        return f"{round(acceptance_rate, 1)}%"
    
    def solved(self, user):
        if not user.is_authenticated:
            return False
        return self.problem_status.filter(user=user, is_completed=True).exists()

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

class Examples(TimeMixsin):
    problem = models.ForeignKey(Problem, related_name="examples", on_delete=models.CASCADE)
    input_txt = models.TextField(help_text="# Kirish ma'lumotlari (masalan: \"[2,7,11,15]\\n9\")")  # Kirish ma'lumotlari (masalan: "[2,7,11,15]\\n9")
    output_txt = models.TextField(help_text="# Chiqish ma'lumotlari (masalan: \"[0,1]\")")  # Chiqish ma'lumotlari (masalan: "[0,1]")
    explanation = models.TextField(help_text="# Tushuntirish matni")  # Tushuntirish matni
    img = models.ImageField(
        upload_to='problem_examples/',  # Rasmlar saqlanadigan papka
        blank=True,  # Majburiy emas
        null=True   # NULL qiymatga ruxsat beriladi
    )

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
    is_correct = models.BooleanField(default=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"Test for {self.problem.title}"
    
    class Meta:
        indexes = [
            models.Index(fields=['problem']),
        ]
