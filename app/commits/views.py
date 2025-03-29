from django.shortcuts import render

# Create your views here.

def commits_page(request):
    return render(request, "munozara/munozara.html", {})