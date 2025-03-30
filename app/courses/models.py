from django.db import models
from users.models import MyUser
from django.utils.text import slugify


#  base timemixis
class TimeMixsin(models.Model):
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract=True
        # model yaratmaydi abstract=True

class Course(TimeMixsin):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    price = models.PositiveIntegerField()
    description = models.TextField()
    thumbnail = models.URLField()
    lesson_count = models.PositiveIntegerField(blank=True, null=True)
    trailer = models.URLField(blank=True, null=True)
    user = models.ForeignKey(MyUser, on_delete=models.CASCADE)
    
    def __str__(self):
        return self.title
    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Course.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)
        
    class Meta:
        indexes = [
            models.Index(fields=["created_at", "updated_at", "is_active"])
        ]

class Enrollment(TimeMixsin):
    user = models.ForeignKey(MyUser, related_name='enrollments', on_delete=models.CASCADE)
    course = models.ForeignKey(Course, related_name='enrollments', on_delete=models.CASCADE)
    is_paid = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.email} enrolled in {self.course.title}"


class MyModules(TimeMixsin):
    course = models.ForeignKey(Course, related_name='modules', on_delete=models.CASCADE)  # "related_name" qo‘shildi
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True, null=True)
    user = models.ForeignKey(MyUser, on_delete=models.CASCADE)

    
    def __str__(self):
        return f"Module: {self.title} (Course: {self.course.title})"

    def __str__(self):
        return f"Module: {self.title} (Course: {self.course.title})"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)