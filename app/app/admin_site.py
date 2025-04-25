def get_jazzmin_settings():
    return {
        # =============================================
        # Asosiy sozlamalar
        # =============================================
        "site_title": "Admin Paneli",
        "site_header": "Ma'muriy Boshqaruv",
        "site_brand": "MyProject",
        "site_logo": "admin/img/logo.png",
        "site_logo_classes": "img-circle",
        "site_icon": "admin/img/favicon.ico",
        "welcome_sign": "Admin paneliga xush kelibsiz!",
        "copyright": "MyCompany Ltd",
        "site_title": "Boshqaruv paneli",
        "site_header": "Boshqaruv paneli",
        "site_brand": "Boshqaruv paneli",
        "index_title": "Asosiy menyu",
        
        # =============================================
        # Tema va dizayn sozlamalari
        # =============================================
        "theme": "dark",  # dark/light
        "dark_mode_theme": "darkly",
        "light_mode_theme": "flatly",
        "use_google_fonts_cdn": True,
        "show_ui_builder": True,
        
        # =============================================
        # Menyu sozlamalari
        # =============================================
        "navigation_expanded": True,
        "hide_apps": [],
        "hide_models": [],
        "order_with_respect_to": ["auth", "books", "shop"],
        "related_modal_active": True,
        "custom_links": {
            "books": [{
                "name": "Hisobotlar", 
                "url": "make_messages", 
                "icon": "fas fa-chart-bar",
                "permissions": ["books.view_book"]
            }]
        },
        
        # =============================================
        # Ikonkalar sozlamalari
        # =============================================
        "icons": {
            "auth": "fas fa-users-cog",
            "auth.user": "fas fa-user",
            "auth.Group": "fas fa-users",
            "shop.Product": "fas fa-box",
            "shop.Category": "fas fa-tags",
            "orders.Order": "fas fa-shopping-cart",
        },
        "default_icon_parents": "fas fa-chevron-circle-right",
        "default_icon_children": "fas fa-circle",
        
        # =============================================
        # Forma ko'rinishlari
        # =============================================
        "changeform_format": "horizontal_tabs",
        "changeform_format_overrides": {
            "auth.user": "collapsible",
            "auth.group": "vertical_tabs",
            "shop.Product": "carousel",
        },
        
        # =============================================
        # Til va lokalizatsiya
        # =============================================
        "language_chooser": True,
        "languages": {
            "uz": {"name": "O'zbek", "flag": "uz"},
            "ru": {"name": "Русский", "flag": "ru"},
            "en": {"name": "English", "flag": "gb"},
        },
        
        # =============================================
        # Top menyu sozlamalari
        # =============================================
        "topmenu_links": [
            {"name": "Bosh sahifa", "url": "admin:index", "permissions": ["auth.view_user"]},
            {"name": "Saytga o'tish", "url": "/", "new_window": True},
            {"model": "auth.User"},
            {"app": "shop"},
            {
            "name": "Language",
            "children": [
                {"name": "Oʻzbekcha", "url": "/i18n/setlang/?language=uz"},
                {"name": "Русский", "url": "/i18n/setlang/?language=ru"},
                {"name": "English", "url": "/i18n/setlang/?language=en"},
            ]
        },
        ],
        
        # =============================================
        # Foydalanuvchi menyusi
        # =============================================
        "usermenu_links": [
            {"name": "Yordam", "url": "https://example.com/help", "new_window": True},
            {"model": "auth.user"}
        ],
        
        # =============================================
        # Maxsus CSS/JS
        # =============================================
        "custom_css": "css/admin_custom.css",
        "custom_js": "js/admin_custom.js",
        
        # =============================================
        # Qo'shimcha funksiyalar
        # =============================================
        "show_sidebar": True,
        "user_avatar": "avatar",
        "search_model": ["auth.User", "shop.Product"],
    }

# settings.py ga qo'shish
