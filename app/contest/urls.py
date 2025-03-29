from django.urls import path
from .views import contest_page_view

urlpatterns = [
    path("", contest_page_view, name="contest"),
]
