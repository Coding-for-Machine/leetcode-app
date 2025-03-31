from django.contrib import admin

# Register your models here.
from .models import Contest, UserContestStats, ContestRegistration

admin.site.register(Contest)
admin.site.register(UserContestStats)
admin.site.register(ContestRegistration)
