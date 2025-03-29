from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from django.urls import reverse

User = get_user_model()

class Topic(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Oson'),
        ('medium', 'Oʻrtacha'),
        ('hard', 'Qiyin'),
    ]
    
    title = models.CharField(max_length=200, verbose_name="Mavzu nomi")
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField(verbose_name="Tavsif")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='topics')
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    views = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Mavzu"
        verbose_name_plural = "Mavzular"
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)
    
    def get_absolute_url(self):
        return reverse('topic_detail', kwargs={'slug': self.slug})
    
    def get_difficulty_class(self):
        return {
            'easy': 'qiyinlik-oson',
            'medium': 'qiyinlik-o\'rta',
            'hard': 'qiyinlik-qiyin'
        }.get(self.difficulty, '')


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)
    
    class Meta:
        verbose_name = "Teg"
        verbose_name_plural = "Teglar"
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class TopicTag(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='topic_tags')
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('topic', 'tag')
        verbose_name = "Mavzu Tegi"
        verbose_name_plural = "Mavzu Teglari"
    
    def __str__(self):
        return f"{self.topic.title} - {self.tag.name}"

