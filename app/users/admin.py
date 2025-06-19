from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.contrib.admin.models import LogEntry

from unfold.admin import ModelAdmin
from unfold.decorators import action  # optional for future bulk actions

from .models import MyUser, Profile


@admin.register(LogEntry)
class LogEntryAdmin(ModelAdmin):
    list_display = (
        'action_time',
        'user',
        'content_type',
        'object_repr',
        'action_flag',
        'change_message'
    )
    list_filter = ('action_time', 'user', 'action_flag')
    readonly_fields = ('action_time', 'user', 'content_type', 'object_repr', 'change_message')


# ✅ MyUser Admin — Unfold + fieldsets + filters
@admin.register(MyUser)
class MyUserAdmin(BaseUserAdmin):
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name'),
        }),
    )
    list_display = ('email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')
    filter_horizontal = ('groups', 'user_permissions')
    readonly_fields = ('last_login',)


# ✅ ProfileAdmin — Avatar preview bilan, ikon qo‘shilgan
@admin.register(Profile)
class ProfileAdmin(ModelAdmin):
    list_display = ('user', 'first_name', 'last_name', 'avatar_icon')
    readonly_fields = ('avatar_preview',)
    search_fields = ('user__email', 'first_name', 'last_name')

    def avatar_icon(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="border-radius: 50%; width: 30px; height: 30px; object-fit: cover;" />',
                obj.image.url
            )
        return format_html('<span style="color: gray;">No Image</span>')
    avatar_icon.short_description = "Avatar"

    def avatar_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="border-radius: 8px; width: 150px; height: 150px; object-fit: cover;" />',
                obj.image.url
            )
        return "No Image"
    avatar_preview.short_description = "Large Preview"
