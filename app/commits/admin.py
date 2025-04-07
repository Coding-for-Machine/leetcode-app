from django.contrib import admin
from .models import Comment, Like, Bookmark

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('author', 'problems', 'content', 'created_at', 'updated_at')
    search_fields = ('author__username', 'problems__title', 'content')
    list_filter = ('created_at', 'updated_at')

@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'problems', 'created_at')
    search_fields = ('user__username', 'problems__title')
    list_filter = ('created_at',)

@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ('user', 'problems', 'created_at')
    search_fields = ('user__username', 'problems__title')
    list_filter = ('created_at',)
