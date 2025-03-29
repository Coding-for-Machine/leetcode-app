from django.shortcuts import get_object_or_404, render
from django.contrib.auth import get_user_model
from django.http import HttpResponse
# Create your views here.

# profile
def profile_view(request, username):
    User = get_user_model()
    user = get_object_or_404(User, username=username)
    context = {
        'profile_user': user,
    }
    return render(request, "users/profile.html", context)

def register_page_view(request):
    return render(request, "users/register.html", {})

def login_page_view(request):
    return render(request, "users/login.html", {})

def logout_view(request):
    HttpResponse("dis yaxshi")