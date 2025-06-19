from django.utils.translation import gettext_lazy as _
from django.templatetags.static import static
from django.urls import reverse_lazy
from django.utils.translation import get_language_info
# https://unfoldadmin.com/
def get_unfoldadmin_settings():
    return {
        # Asosiy sahifa parametrlari
        "SITE_TITLE": "Coding-for-Machine | Admin",
        "SITE_HEADER": "Coding-for-Machine",
        "SITE_SUBHEADER": "Dasturlash masalalarini hal qilish platformasi",
        
        # Site URL va logotiplar
        "SITE_URL": "/",
        "SITE_ICON": lambda request: static("favicon.ico"),
        "SITE_LOGO": lambda request: static("admin/images/leetcode-logo.svg"),
        
        # Favicon konfiguratsiyasi (ixtiyoriy)
        # "SITE_FAVICONS": [
        #     {
        #         "rel": "icon",
        #         "sizes": "32x32",
        #         "type": "image/svg+xml",
        #         "href": lambda request: static("admin/favicon.ico"),
        #     },
        # ],
        
        # Dropdown menyusi
        "SITE_DROPDOWN": [
            {
                "icon": "home",
                "title": _("Saytga o'tish"),
                "link": "/",
            },
            {
                "icon": "code",
                "title": _("LeetCode Problems"),
                "link": "/problems/",
            },
            {
                "icon": "leaderboard",
                "title": _("Leaderboard"),
                "link": "/leaderboard/",
            },
            {
                "icon": "analytics",
                "title": _("Statistika"),
                "link": "/stats/",
            },
        ],
        
        # Interfeys sozlamalari
        "SHOW_HISTORY": True,
        "SHOW_VIEW_ON_SITE": True,
        "SHOW_BACK_BUTTON": True,
        "THEME": None,  # Foydalanuvchi o'zi tanlashi uchun
        
        # Login sahifasi
        "LOGIN": {
            "image": lambda request: static("admin/login-bg.jpg"),
        },
        
        # Tillar
        "SHOW_LANGUAGES": True,
        "LANGUAGES": {
            "navigation": [
                {
                    'bidi': False,
                    'code': 'en',
                    'name': 'English',
                    'name_local': get_language_info('en')['name_local'],
                    'name_translated': _('English')
                },
                {
                    'bidi': False,
                    'code': 'uz',
                    'name': 'Uzbek',
                    'name_local': get_language_info('uz')['name_local'],
                    'name_translated': _('Uzbek')
                },
                {
                    'bidi': False,
                    'code': 'ru',
                    'name': 'Russian',
                    'name_local': get_language_info('ru')['name_local'],
                    'name_translated': _('Russian')
                },
            ]
        },
        
        # Qo'shimcha CSS va JS fayllar (ixtiyoriy)
        # "STYLES": [
        #     lambda request: static("admin/css/custom-admin.css"),
        # ],
        # "SCRIPTS": [
        #     lambda request: static("admin/js/custom-admin.js"),
        # ],
        
        # Border radius
        "BORDER_RADIUS": "8px",
        
        # Ranglar konfiguratsiyasi (soddalashtirilgan)
        "COLORS": {
            "primary": {
                "50": "239, 246, 255",
                "100": "219, 234, 254",
                "200": "191, 219, 254",
                "300": "147, 197, 253",
                "400": "96, 165, 250",
                "500": "59, 130, 246",  # LeetCode asosiy rangi
                "600": "37, 99, 235",
                "700": "29, 78, 216",
                "800": "30, 64, 175",
                "900": "30, 58, 138",
                "950": "23, 37, 84",
            },
        },
        
        # Sidebar konfiguratsiyasi (soddalashtirilgan)
        "SIDEBAR": {
            "show_search": True,
            "show_all_applications": True,
            "navigation_expanded": True,
        },
        
        # Dashboard callback (ixtiyoriy)
        # "DASHBOARD_CALLBACK": "get_dashboard_data",
        
        # Environment (ixtiyoriy)
        # "ENVIRONMENT": "get_environment_info",
        # "ENVIRONMENT_TITLE_PREFIX": "get_environment_prefix",
        
        # Extensions (ixtiyoriy)
        # "EXTENSIONS": {
        #     "modeltranslation": {
        #         "flags": {
        #             "uz": "🇺🇿",
        #             "en": "🇺🇸",
        #             "ru": "🇷🇺",
        #         },
        #     },
        # },
        
        # Tabs konfiguratsiyasi (ixtiyoriy)
        # "TABS": [
        #     {
        #         "models": [
        #             "auth.user",
        #             "auth.group",
        #         ],
        #         "items": [
        #             {
        #                 "title": _("Foydalanuvchilar"),
        #                 "link": reverse_lazy("admin:auth_user_changelist"),
        #             },
        #             {
        #                 "title": _("Guruhlar"),
        #                 "link": reverse_lazy("admin:auth_group_changelist"),
        #             },
        #         ],
        #     },
        # ],
    }


# Helper funksiyalar
def get_dashboard_data(request, context):
    """Dashboard uchun maxsus ma'lumotlarni tayyorlash"""
    context.update({
        "total_users": get_users_count(request),
        "total_problems": get_problems_count(request),
        "total_solutions": get_solutions_count(request),
        "recent_activity": get_recent_activity(),
    })
    return context


def get_environment_info(request):
    """Environment ma'lumotlari"""
    import os
    env = os.environ.get('DJANGO_ENV', 'development')
    
    if env == 'production':
        return ["Production", "danger"]
    elif env == 'staging':
        return ["Staging", "warning"]
    else:
        return ["Development", "info"]


def get_environment_prefix(request):
    """Title prefiksi"""
    import os
    env = os.environ.get('DJANGO_ENV', 'dev')
    return f"[{env.upper()}] "


def get_users_count(request):
    """Foydalanuvchilar soni"""
    from django.contrib.auth.models import User
    return User.objects.count()


def get_problems_count(request):
    """Masalalar soni - o'z modelingizga o'zgartiring"""
    # from your_app.models import Problem
    # return Problem.objects.count()
    return 150  # Namuna


def get_solutions_count(request):
    """Yechimlar soni - o'z modelingizga o'zgartiring"""
    # from your_app.models import Solution
    # return Solution.objects.count()
    return 1250  # Namuna


def get_system_info_count(request):
    """Tizim ma'lumotlari soni"""
    return 5  # Namuna


def get_recent_activity():
    """So'nggi faoliyat ma'lumotlari"""
    return [
        {"user": "admin", "action": "Yangi masala qo'shildi", "time": "2 soat oldin"},
        {"user": "user1", "action": "Yechim yuborildi", "time": "1 soat oldin"},
        {"user": "user2", "action": "Profil yangilandi", "time": "30 daqiqa oldin"},
    ]