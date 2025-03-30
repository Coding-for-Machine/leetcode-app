from django.urls import path

from .views import quiz_views, quiz_detail

urlpatterns = [
    path("", quiz_views, name="quiz"),
    path("<str:slug>/", quiz_detail, name="quiz-detail"),
]
