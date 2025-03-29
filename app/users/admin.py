from django.contrib import admin
from django.utils.html import format_html
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import MyUser, Profile

from django.contrib.admin.models import LogEntry

@admin.register(LogEntry)
class LogEntryAdmin(admin.ModelAdmin):
    list_display = ('action_time', 'user', 'content_type', 'object_repr', 'action_flag', 'change_message')
    list_filter = ('action_time', 'user', 'action_flag')

    
@admin.register(MyUser)
class MyUserAdmin(BaseUserAdmin):
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name'),
        }),
    )
    list_display = ('email', 'first_name', 'last_name', 'is_staff')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')
    filter_horizontal = ('groups', 'user_permissions')

class ProfileAdmin(admin.ModelAdmin):
    list_display=['created_at',"updated_at",'bio', 'profile_icon']
    # icon 
    def profile_icon(self, obj):
        return format_html('<i class="fa-regular fa-address-card"></i>')
    profile_icon.short_description = 'Profile-Icon'
admin.site.register(Profile, ProfileAdmin)