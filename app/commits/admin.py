from django.contrib import admin
from django.utils.html import format_html
from django.template.defaultfilters import truncatechars
from unfold.admin import ModelAdmin
from .models import Comment, Like, Bookmark

@admin.register(Comment)
class CommentAdmin(ModelAdmin):
    list_display = ('author_display', 'problem_display', 'short_content', 'created_at', 'updated_at')
    search_fields = ('author__username', 'problems__title', 'content')
    list_filter = ('created_at', 'updated_at')
    ordering = ('-created_at',)

    def short_content(self, obj):
        return truncatechars(obj.content, 50)
    short_content.short_description = '💬 Comment'

    def author_display(self, obj):
        return format_html(f'<strong>{obj.author.username}</strong>')
    author_display.short_description = "👤 Author"

    def problem_display(self, obj):
        return format_html(f'<span style="color: #555;">{obj.problems.title}</span>')
    problem_display.short_description = "🧠 Problem"

@admin.register(Like)
class LikeAdmin(ModelAdmin):
    list_display = ('user_display', 'problem_display', 'created_at')
    search_fields = ('user__username', 'problems__title')
    list_filter = ('created_at',)
    ordering = ('-created_at',)

    def user_display(self, obj):
        return format_html(f'<strong>{obj.user.username}</strong>')
    user_display.short_description = "👍 User"

    def problem_display(self, obj):
        return format_html(f'<span style="color: #666;">{obj.problems.title}</span>')
    problem_display.short_description = "🧠 Problem"

@admin.register(Bookmark)
class BookmarkAdmin(ModelAdmin):
    list_display = ('user_display', 'problem_display', 'created_at')
    search_fields = ('user__username', 'problems__title')
    list_filter = ('created_at',)
    ordering = ('-created_at',)

    def user_display(self, obj):
        return format_html(f'<strong>{obj.user.username}</strong>')
    user_display.short_description = "📌 User"

    def problem_display(self, obj):
        return format_html(f'<span style="color: #888;">{obj.problems.title}</span>')
    problem_display.short_description = "🧠 Problem"
