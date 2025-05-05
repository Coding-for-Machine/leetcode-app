from django.contrib import admin
from django import forms
from django.contrib.contenttypes.models import ContentType
from lessons.models import Lesson
from .models import Quiz, Question, Answer, QuizAttempt


admin.site.register(QuizAttempt)


class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 1 
    min_num = 1
    fields = ('description', 'is_correct')

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'time_limit', 'is_active', 'created_at')
    list_filter = ('title', 'is_active')
    prepopulated_fields = {'slug': ('title',)} 
    search_fields = ('title', 'description')
    ordering = ('-created_at',)

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('description', 'created_at')
    search_fields = ('description',)
    ordering = ('-created_at',)
    inlines = [AnswerInline]

@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('description', 'question', 'is_correct')
    list_filter = ('is_correct',)
    search_fields = ('description',)
