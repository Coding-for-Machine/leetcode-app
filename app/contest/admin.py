from django.contrib import admin
from unfold.admin import ModelAdmin
# Register your models here.
from .models import Contest, UserContestStats, ContestRegistration


@admin.register(Contest)
class ContestAdmin(ModelAdmin):
    pass

@admin.register(ContestRegistration)
class ContestReagister(ModelAdmin):
    pass




@admin.register(UserContestStats)
class UserContestStatsAdmin(ModelAdmin):
    list_display = ('user', 'total_contests', 'best_rank', 'average_rank', 'total_points')
    search_fields = ('user__username',)
    readonly_fields = ('user',)
    
    def has_add_permission(self, request):
        return False  # Faqat avtomatik yaratish mumkin