# middleware.py
from ninja_jwt.authentication import JWTAuth
from ninja_jwt.exceptions import InvalidToken, AuthenticationFailed

class CookieJWTAuth(JWTAuth):
    # def authenticate(self, request, token=None):
    #     # Cookie'dan tokenni olish
    #     token = request.COOKIES.get('access_token')
    #     if not token:
    #         raise AuthenticationFailed('No token found in cookies')
        
    #     return super().authenticate(request, token)
    pass