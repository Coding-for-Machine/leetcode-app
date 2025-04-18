from django.urls import path
from .views import profile_view, login_page_view, register_page_view, logout_view

urlpatterns = [
    path('register/', register_page_view, name='register'),
    path('login/', login_page_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('profil/', profile_view, name='profile'),
]
