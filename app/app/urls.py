from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# API uchun routerlar
from .api import api
from problems.problem_api import api_problem_router
from solution.api import solution_url_api

# API routerlarni qo‘shish
api.add_router("/", api_problem_router)
api.add_router("solution/", solution_url_api)

# Home Page uchun view
from .views import HomePage

urlpatterns = [
    # Bosh sahifa
    path("", HomePage, name="home"),  # Agar CBV bo‘lsa, .as_view() qo‘shildi
    path("api/", api.urls),  # API yo‘nalishlari
    path("problems/", include("problems.urls")),  # Problems moduli yo‘nalishi
    path("contest/", include("contest.urls")),  # Problems moduli yo‘nalishi
    path("users/", include("users.my_urls")),  # Users moduli yo‘nalishi
    path("munozara/", include("commits.urls")),  # Users moduli yo‘nalishi
    path("admin/", admin.site.urls),  # Django admin paneli
    path("ckeditor/", include("ckeditor_uploader.urls")),  # CKEditor yuklash yo‘nalishi
]

# Statik va media fayllar uchun yo‘nalishlar
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
