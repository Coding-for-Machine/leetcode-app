from django.conf import settings
from django.http import HttpResponse, JsonResponse
from ninja import Router
from ninja_jwt.authentication import JWTAuth
from django.contrib.auth.hashers import make_password, check_password
from ninja_jwt.tokens import RefreshToken
from ninja.errors import HttpError
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from typing import Dict, Optional
from django.contrib.auth import authenticate

from .schemas import UserRegisterSchema, UserSchema, UserLoginSchema
from .models import MyUser
# Router yaratamiz

user_router = Router(tags=["Users"])



@user_router.post("/register", response={201: UserSchema, 400: Dict[str, str]})
def register(request, data: UserRegisterSchema):
    # Majburiy maydonlarni tekshirish
    if not data.email or not data.username or not data.password:
        raise HttpError(400, "Barcha maydonlarni to'ldirish shart")

    # Email va username bandligini tekshirish
    if MyUser.objects.filter(email=data.email).exists():
        raise HttpError(400, "Bu email allaqachon ro'yxatdan o'tgan")
    if MyUser.objects.filter(username=data.username).exists():
        raise HttpError(400, "Bu username allaqachon band qilingan")

    try:
        user = MyUser.objects.create(
            email=data.email,
            username=data.username,
            password=make_password(data.password)
        )
        return 201, user
    except Exception as e:
        raise HttpError(500, "Server xatosi")



@user_router.post("/login", response={200: dict, 401: dict})
def login(request, data: UserLoginSchema):
    try:
        # Foydalanuvchini topish
        user = MyUser.objects.filter(email=data.email).first() or \
               MyUser.objects.filter(username=data.email).first()
        
        if not user:
            raise HttpError(401, {"error": "Email/username not found"})
        
        if not check_password(data.password, user.password):
            raise HttpError(401, {"error": "Incorrect password"})
        
        # Tokenlarni yaratish
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # User ma'lumotlari
        avatar_url = None
        if hasattr(user, 'profile') and user.profile.avatar_url:
            domain = request.get_host()
            protocol = 'https' if request.is_secure() else 'http'
            avatar_url = f"{protocol}://{domain}{user.profile.avatar_url}"

        user_data = {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "role": user.role or 'student',
            "avatar": avatar_url,
            "isPremium": getattr(user.profile, 'is_premium', False),
            "createdAt": user.created_at.strftime('%Y-%m-%d'),
        }
        tokens = {
            "access": access_token,
            "refresh": refresh_token,
        }
        
        # Response tayyorlash (faqat JsonResponse ishlating)
        response = JsonResponse({
            "message": "Login successful",
            "tokens": tokens,
            "user": user_data
        }, status=200)
        
        # Cookie'larni o'rnatish
        return response
        
    except Exception as e:
        raise HttpError(500, {"error": str(e)})


@user_router.get("/me", response={200: UserSchema, 401: Dict[str, str]}, auth=JWTAuth())
def get_profile(request):
    user = request.auth
    return 200, user


@user_router.post("/profile/change-password", response={200: Dict[str, str], 401: Dict[str, str]}, auth=JWTAuth())
def change_password(request, old_password: str, new_password: str):
    user = request.auth
    if not check_password(old_password, user.password):
        return 401, {"error": "Old password is incorrect"}
    user.password = make_password(new_password)
    user.save()
    return 200, {"message": "Password changed successfully"}

# @user_router.get('/')
