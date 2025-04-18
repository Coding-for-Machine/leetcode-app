import os
from pathlib import Path
from urllib.parse import urlparse
from decouple import config
from django.core.management.utils import get_random_secret_key
# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config("DJANGO_SECRET_KEY", cast=str, default=get_random_secret_key())
# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config("DJANGO_DEBUG", cast=bool, default=True)

ALLOWED_HOSTS = [
    ".railway.app"
]
CSRF_TRUSTED_ORIGINS = [
    "https://*.railway.app",
    "http://0.0.0.0:8000",
]

if DEBUG:
    ALLOWED_HOSTS = ["*"]

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    # "whitenoise.runserver_nostatic",
    'django.contrib.staticfiles',
    # installed package
    "corsheaders",
    'ckeditor',
    'ninja',
    'ninja_extra',
    'ninja_jwt',

    # myapp
    'problems.apps.ProblemsConfig',
    'users',
    'solution.apps.SolutionConfig',
    'userstatus.apps.UserstatusConfig',
    'contest.apps.ContestConfig',
    'commits.apps.CommitsConfig',
    'courses',
    'quizs.apps.QuizsConfig',
    'lessons',
]
AUTH_USER_MODEL = "users.MyUser"
# JWT Settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    
    # Cookie sozlamalari
    'AUTH_COOKIE': 'access_token',
    'AUTH_COOKIE_REFRESH': 'refresh_token',
    'AUTH_COOKIE_HTTP_ONLY': True,
    'AUTH_COOKIE_SECURE': True,
    'AUTH_COOKIE_SAMESITE': 'Lax',
    'AUTH_COOKIE_PATH': '/',
    'AUTH_COOKIE_DOMAIN': None,
}

# HTTPS ni majburiy qilish
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Cookie xavfsizligi
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

if DEBUG:
    INSTALLED_APPS.append("whitenoise.runserver_nostatic")
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # 'users.middleware.CookieJWTAuth',  # Sizning maxsus middleware
]
# Hammaga ruxsat berish (faqat ishlab chiqish uchun)
CORS_ALLOW_ALL_ORIGINS = True

# Yoki aniq manbalarga ruxsat berish (production uchun yaxshiroq)
# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:3000",
#     "http://127.0.0.1:3000",
#     "https://sizning-saytingiz.com",
# ]

# Qo'shimcha CORS sozlamalari (ixtiyoriy)
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Cookie va credentials uchun (agar kerak bo'lsa)
CORS_ALLOW_CREDENTIALS = True

ROOT_URLCONF = 'app.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / "templates"],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'users.context_processors.auth_profile',
            ],
        },
    },
]

WSGI_APPLICATION = 'app.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Database configuration - Corrected version
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql',
#         'NAME': config('DB_NAME', 'leetcode'),
#         'USER': config('DB_USER', 'leetcode_owner'),
#         'PASSWORD': config('DB_PASSWORD', 'npg_Wzf0CyF2KSmb'),
#         'HOST': config('DB_HOST', 'ep-restless-hat-a5vszuj5-pooler.us-east-2.aws.neon.tech'),
#         'PORT': config('DB_PORT', '5432'),
#         'OPTIONS': {
#             'sslmode': 'require',
#             'connect_timeout': 5,  # 5 sekunddan keyin timeout
#         }
#     }
# }

# ------------ time
# DATABASES = {
#     "default": {
        
#         "ENGINE": "django.db.backends.postgresql",
#         "NAME": config("TIMESCALE_DB_NAME", default="tsdb"),
#         "USER": config("TIMESCALE_DB_USER", default="tsdbadmin"),
#         "PASSWORD": config("TIMESCALE_DB_PASSWORD", default="Asadbek20020107"),
#         "HOST": config("TIMESCALE_DB_HOST", default="obku7pi8tr.p202ne1nfm.tsdb.cloud.timescale.com"),
#         "PORT": config("TIMESCALE_DB_PORT", default="35474"),
#     }
# }

# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]
# admin user
ADMIN_USER_NAME=config("DJANGO_ADMIN_USERNAME", default="Admin user")
ADMIN_USER_EMAIL=config("DJANGO_ADMIN_EMAIL", default=None)

MANAGERS=[]
ADMINS=[]
if all([ADMIN_USER_NAME, ADMIN_USER_EMAIL]):
    ADMINS +=[
        (f'{ADMIN_USER_NAME}', f'{ADMIN_USER_EMAIL}')
    ]
    MANAGERS=ADMINS
# default backend
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config("EMAIL_HOST", cast=str, default=None)
EMAIL_PORT = config("EMAIL_PORT", cast=str, default='587') # Recommended
EMAIL_HOST_USER = config("EMAIL_HOST_USER", cast=str, default=None)
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", cast=str, default=None)
EMAIL_USE_TLS = config("EMAIL_USE_TLS", cast=bool, default=True)  # Use EMAIL_PORT 587 for TLS
EMAIL_USE_SSL = config("EMAIL_USE_SSL", cast=bool, default=False)  # EUse MAIL_PORT 465 for SSL


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/


STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfile')
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static')
]
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

CKEDITOR_UPLOAD_PATH = 'uploads/'
CKEDITOR_IMAGE_BACKEND = "pillow"
CKEDITOR_JQUERY_URL = '//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js' 
CKEDITOR_CONFIGS = {
    'default':
        {
            'toolbar': 'full',
            'width': 'auto',
            'extraPlugins': ','.join([
                'codesnippet',
            ]),
        },
}

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
        "OPTIONS": {
            "location": BASE_DIR / "media",  # media fayllar saqlanadigan papka
            "base_url": "/media/",          # media fayllarga URL
        },
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}
# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
