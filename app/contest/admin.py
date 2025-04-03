from django.contrib import admin

# Register your models here.
from .models import Contest, UserContestStats, ContestRegistration

admin.site.register(Contest)
admin.site.register(ContestRegistration)



@admin.register(UserContestStats)
class UserContestStatsAdmin(admin.ModelAdmin):
    list_display = ('user', 'total_contests', 'best_rank', 'average_rank', 'total_points')
    search_fields = ('user__username',)
    readonly_fields = ('user',)
    
    def has_add_permission(self, request):
        return False  # Faqat avtomatik yaratish mumkin