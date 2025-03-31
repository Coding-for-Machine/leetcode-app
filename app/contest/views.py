from django.shortcuts import render

# Create your views here.

def contest_page_view(request):
    return render(request, "contest/test.html", {})