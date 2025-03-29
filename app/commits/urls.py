from django.urls import path
from .views import commits_page

urlpatterns = [
    path("", commits_page, name="comments")
]
