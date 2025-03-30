from django.shortcuts import render

# Create your views here.

def courses_views(request):
    return render(request, "courses/courses.html")
def courses_slug_views(request):
    return render(request, "courses/course.html")