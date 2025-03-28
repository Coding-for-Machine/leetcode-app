from django.urls import path
from .views import problem_page, problems_list



urlpatterns = [
    path("", problems_list, name="problems"),
    path("problems/", problem_page, name="problem_page"),

]