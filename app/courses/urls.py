from django.urls import path
from .views import courses_slug_views, courses_views

urlpatterns = [
    path("", courses_views, name="courses"),
    path("slug/", courses_slug_views, name="course"),

]
