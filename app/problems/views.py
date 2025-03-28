from django.shortcuts import render

# Create your views here.

def problem_page(request):
    return render(request, "base.html", {})
def problems_list(request):
    return render(request, "problems.html", {})