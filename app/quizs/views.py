from django.shortcuts import render
from django.http import HttpResponse
# Create your views here.


def quiz_views(request):
    return render(request, "quiz/q.html")

def quiz_detail(request, slug):
    print(slug)
    return render(request, "quiz/question.html", {})