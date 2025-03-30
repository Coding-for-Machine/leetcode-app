from django.db import models
from courses.models import MyModules
from courses.models import TimeMixsin
from users.models import MyUser
from problems.gnerate_slug import generate_slug_with_case

    
class Lesson(TimeMixsin):
    module = models.ForeignKey(MyModules, related_name="lesson", on_delete=models.CASCADE)  # Modulga bog'lanadi
    title = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(unique=True, db_index=True)
    lesson_type = models.CharField(
        max_length=50, 
        choices=[('darslik', 'darslik'), ('probelm', 'probelm')]  
    )
    preview = models.BooleanField(default=False)
    user = models.ForeignKey(MyUser, on_delete=models.CASCADE)
    
    def __str__(self):
        return f"Lesson: (Module: {self.module.title})"  
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_slug_with_case(30)
        super().save(*args, **kwargs)





