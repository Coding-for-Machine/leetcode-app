from django.contrib import admin
from .models import Solution


@admin.register(Solution)
class SolutionAdmin(admin.ModelAdmin):
    list_display = ('user', 'problem', 'language', 'is_accepted', 'score', 'execution_time', 'memory_usage', 'created_at')
    search_fields = ('user__email', 'problem__title', 'language__name')
    list_filter = ('is_accepted', 'language')
    readonly_fields = ('created_at', 'updated_at', 'score')

    def get_queryset(self, request):
        return super().get_queryset(request).order_by('-created_at')

