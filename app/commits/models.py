from django.db import models
from django.contrib.auth import get_user_model
from contest.models import Topic
User = get_user_model()

class Comment(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
        verbose_name = "Izoh"
        verbose_name_plural = "Izohlar"
    
    def __str__(self):
        return f"Comment by {self.author.username} on {self.topic.title}"


class Like(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('topic', 'user')
        verbose_name = "Yoqtirish"
        verbose_name_plural = "Yoqtirishlar"
    
    def __str__(self):
        return f"{self.user.username} likes {self.topic.title}"


class Bookmark(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='bookmarks')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('topic', 'user')
        verbose_name = "Xatchoʻp"
        verbose_name_plural = "Xatchoʻplar"
    
    def __str__(self):
        return f"{self.user.username} bookmarked {self.topic.title}"