from datetime import timedelta
from django.conf import settings
from datetime import datetime, timedelta
from django.conf import settings

def set_jwt_cookies(response, access_token, refresh_token):
    # Access token cookie
    response.set_cookie(
        key='access_token',
        value=access_token,
        httponly=True,
        secure=True,  # Faqat HTTPS
        samesite='Lax',
        max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
        path='/',
    )
    
    # Refresh token cookie
    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite='Lax',
        max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(),
        path='/user/refresh',
    )
    
    return response

def delete_jwt_cookies(response):
    response.delete_cookie('access_token')
    response.delete_cookie('refresh_token')
    return response
    
    return response