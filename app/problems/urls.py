from django.urls import path
from .views import problem_page, problems_list, search



urlpatterns = [
    path("", problems_list, name="problems"),
    path("problem/<slug:slug>/", problem_page, name="problem_page"),
    path("search/", search, name="search"),
]