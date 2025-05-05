from django.shortcuts import render
from django.http import HttpResponse
# Create your views here.


def quiz_views(request):
    return render(request, "quiz/quizzes.html")

def quiz_detail(request, slug):
    print(slug)
    return render(request, "quiz/quiz_detail.html", {})

def quiz_attempt_start(request, slug):
    print(slug)
    return render(request, "quiz/quiz_attempt.html", {})