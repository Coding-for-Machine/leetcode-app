from django.contrib import admin
from django import forms
from django.contrib.contenttypes.models import ContentType
from lessons.models import Lesson
from .models import Quiz, Question, Answer, QuizAttempt


admin.site.register(QuizAttempt)

class QuestionForm(forms.ModelForm):
    class Meta:
        model = Question
        fields = '__all__'

    content_type = forms.ModelChoiceField(
        queryset=ContentType.objects.filter(model__in=['quiz', 'lesson']),
        required=True,
        label="Content Type"
    )

    object_id = forms.ChoiceField(required=True, label="Related Object")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        if 'content_type' in self.data:
            try:
                content_type_id = int(self.data.get('content_type'))
                content_type = ContentType.objects.get(id=content_type_id)
                if content_type.model == 'quiz':
                    self.fields['object_id'].choices = [(quiz.id, quiz.title) for quiz in Quiz.objects.all()]
                elif content_type.model == 'lesson':
                    self.fields['object_id'].choices = [(lesson.id, lesson.title) for lesson in Lesson.objects.all()]
            except (ValueError, TypeError, ContentType.DoesNotExist):
                self.fields['object_id'].choices = []


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
    form = QuestionForm
    list_display = ('description', 'content_type', 'object_id', 'created_at')
    list_filter = ('content_type',)
    search_fields = ('description',)
    ordering = ('-created_at',)
    inlines = [AnswerInline]

@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('description', 'question', 'is_correct')
    list_filter = ('is_correct',)
    search_fields = ('description',)
