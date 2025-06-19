from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns

# API uchun routerlar
from .api import api


from .views import HomePage

urlpatterns = [
    # Bosh sahifa
    path("", HomePage, name="home"),  # Agar CBV bo‘lsa, .as_view() qo‘shildi
    path("api/", api.urls),  # API yo‘nalishlari
    path("problems/", include("problems.urls")),  # Problems moduli yo‘nalishi
    path("contest/", include("contest.urls")),  # Problems moduli yo‘nalishi
    path("test/", include("quizs.urls")),
    path("u/", include("users.my_urls")),  # Users moduli yo‘nalishi
    path("munozara/", include("commits.urls")),  # Users moduli yo‘nalishi
    path("courses/", include("courses.urls")),
    path("ckeditor/", include("ckeditor_uploader.urls")),  # CKEditor yuklash yo‘nalishi
    path('i18n/', include('django.conf.urls.i18n')),
    
]

urlpatterns += i18n_patterns(
    path('admin/', admin.site.urls),
)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


from django.utils.translation import gettext_lazy as _


admin.site.site_title = _("Boshqaruv paneli")
admin.site.site_header = _("Admin boshqaruvi")
admin.site.index_title = _("Boshqaruv")