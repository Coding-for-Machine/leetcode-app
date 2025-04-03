from django.shortcuts import render, get_object_or_404
from django.http import Http404, HttpResponse
from .models import Problem
# Create your views here.

def problems_list(request):
    return render(request, "problems/problems_list.html", {})

def problem_page(request, slug: str):
    return render(request, "problems/problem.html")

def search(request):
    return HttpResponse("hilo")