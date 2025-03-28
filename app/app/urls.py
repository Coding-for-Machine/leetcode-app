from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings

from .api import api
# add
from problems.problem_api import api_problem_router
from solution.api import solution_url_api

api.add_router("/", api_problem_router)
api.add_router("solution/", solution_url_api)


urlpatterns = [
    path("", include("problems.urls")),
    # ------------------------
    path("api/", api.urls),
    path('admin/', admin.site.urls),
    path('ckeditor/', include('ckeditor_uploader.urls')),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
if settings.DEBUG:
    urlpatterns+=static(settings.STATIC_URL,document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)