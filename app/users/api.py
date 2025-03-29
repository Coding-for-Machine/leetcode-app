from ninja import Router
from ninja_jwt.authentication import JWTAuth
from django.contrib.auth.hashers import make_password, check_password
from django.shortcuts import get_object_or_404
from ninja_jwt.tokens import RefreshToken
from typing import Dict

from .models import MyUser
from .schemas import UserRegisterSchema, UserSchema, UserLoginSchema, ProfileUpdateSchema

# Router yaratamiz
user_router = Router()

import re

def validate_password(password: str) -> bool:
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    return True

@user_router.post("/register", response={201: UserSchema, 400: Dict[str, str]})
def register(request, data: UserRegisterSchema):
    if not validate_password(data.password):
        return 400, {"error": "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number"}
    
    if MyUser.objects.filter(email=data.email).exists():
        return 400, {"error": "Email already exists"}
    
    user = MyUser.objects.create(
        email=data.email,
        first_name=data.first_name,
        last_name=data.last_name,
        password=make_password(data.password)
    )

    return 201, user

# Login qilish
@user_router.post("/login", response={200: Dict[str, str], 401: Dict[str, str]})
def login(request, data: UserLoginSchema):
    user = MyUser.objects.filter(email=data.email).first()
    
    if not user:
        return 401, {"error": "Email not found"}
    
    if not check_password(data.password, user.password):
        return 401, {"error": "Incorrect password"}
    
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token)
    }

# Profilni olish (faqat login qilgan foydalanuvchilar)
@user_router.get("/profile", response={200: UserSchema, 401: Dict[str, str]}, auth=JWTAuth())
def get_profile(request):
    # JWT orqali foydalanuvchi aniqlanadi
    user = request.auth
    return 200, user

# Profilni yangilash
@user_router.put("/profile", response={200: UserSchema, 401: Dict[str, str]}, auth=JWTAuth())
def update_profile(request, data: ProfileUpdateSchema):
    user = request.auth
    user.first_name = data.first_name
    user.last_name = data.last_name
    user.save()
    return 200, user

# Parolni yangilash
@user_router.post("/profile/change-password", response={200: Dict[str, str], 401: Dict[str, str]}, auth=JWTAuth())
def change_password(request, old_password: str, new_password: str):
    user = request.auth
    if not check_password(old_password, user.password):
        return 401, {"error": "Old password is incorrect"}
    
    user.password = make_password(new_password)
    user.save()
    return 200, {"message": "Password changed successfully"}