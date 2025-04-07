from ninja import Router
from ninja_jwt.authentication import JWTAuth
from django.contrib.auth.hashers import make_password, check_password
from ninja_jwt.tokens import RefreshToken
from ninja.errors import HttpError
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from typing import Dict, Optional

from .schemas import UserRegisterSchema, UserSchema, UserLoginSchema
from .models import MyUser
# Router yaratamiz

user_router = Router(tags=["Users"])




def validate_password(password):
    if len(password) < 8:
        return False, "Parol kamida 8 ta belgidan iborat bo‘lishi kerak"
    elif not any(char.isdigit() for char in password):
        return False, "Parolda kamida bitta raqam bo‘lishi kerak"
    elif not any(char.islower() for char in password):
        return False, "Parolda kamida bitta kichik harf bo‘lishi kerak"
    elif not any(char.isupper() for char in password):
        return False, "Parolda kamida bitta katta harf bo‘lishi kerak"
    elif not password.char.isalnum():
        return False, "Parolda kamida bitta maxsus belgi bo‘lishi kerak"
    
    return True, "Parol to‘g‘ri"

def validate_user_data(email: str, username: str, password: str) -> Optional[Dict[str, str]]:
    # Emailni tekshirish
    try:
        validate_email(email)
    except ValidationError:
        return {"error": "Noto‘g‘ri email formati"}
    
    # Usernameni tekshirish
    if len(username) < 4:
        return {"error": "Username kamida 4 belgidan iborat bo‘lishi kerak"}
    if not username.isalnum():
        return {"error": "Username faqat harflar va raqamlardan iborat bo‘lishi kerak"}
    
    # Parolni tekshirish
    is_valid, password_error = validate_password(password)
    if not is_valid:
        return {"error": password_error}
    
    return None  # Agar hamma narsa to‘g‘ri bo‘lsa, xatolik qaytarmaymiz

@user_router.post("/register", response={201: UserSchema, 400: Dict[str, str], 422: Dict[str, str]})
def register(request, data: UserRegisterSchema):
    if not data.email or not data.username or not data.password:
        return 400, {"error": "Barcha maydonlarni to'ldirish shart"}
    
    validation_error = validate_user_data(data.email, data.username, data.password)
    if validation_error:
        return 400, validation_error
    
    if MyUser.objects.filter(email=data.email).exists():
        return 400, {"error": "Bu email allaqachon ro'yxatdan o'tgan"}
    if MyUser.objects.filter(username=data.username).exists():
        return 400, {"error": "Bu username allaqachon band qilingan"}
    
    try:
        user = MyUser.objects.create(
            email=data.email,
            username=data.username,
            password=make_password(data.password)
        )
        return 201, user
    except Exception as e:
        return 422, {"error": "Foydalanuvchi yaratishda xatolik", "details": str(e)}
    
@user_router.post("/login", response={200: dict, 401: dict})
def login(request, data: UserLoginSchema):
    try:
        # Email yoki username orqali qidirish
        user = MyUser.objects.filter(email=data.email).first()
        if not user:
            user = MyUser.objects.filter(username=data.email).first()
        
        if not user:
            raise HttpError(401, {"error": "Email/username not found"})
        
        if not check_password(data.password, user.password):
            raise HttpError(401, {"error": "Incorrect password"})
        
        refresh = RefreshToken.for_user(user)
        
        # Domen nomini olish uchun requestdan foydalanish
        domain = request.get_host()
        protocol = 'https' if request.is_secure() else 'http'
        base_url = f"{protocol}://{domain}"
        
        # Avatarning to'liq URL manzilini tayyorlash
        avatar_url = None
        if hasattr(user, 'profile') and user.profile.avatar_url:
            avatar_url = f"{base_url}{user.profile.avatar_url}"

        # Frontend User interfeysiga mos response
        return {
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            "user": {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "role": user.role or 'student',
                "avatar": avatar_url,
                "isPremium": user.profile.is_premium if hasattr(user, 'profile') else False,
                "createdAt": user.created_at.strftime('%Y-%m-%d'),
            }
        }
        
    except Exception as e:
        raise HttpError(500, {"error": str(e)})

# Profilni olish (faqat login qilgan foydalanuvchilar)
@user_router.get("/me", response={200: UserSchema, 401: Dict[str, str]}, auth=JWTAuth())
def get_profile(request):
    user = request.auth
    return 200, user


# @user_router.patch("/profile/update", response=UserProfileSchema)
# def update_profile(request, payload: UpdateProfileSchema):
#     profile = request.user.profile
#     for attr, value in payload.dict(exclude_unset=True).items():
#         setattr(profile, attr, value)
#     profile.save()
#     return profile

# Parolni yangilash
@user_router.post("/profile/change-password", response={200: Dict[str, str], 401: Dict[str, str]}, auth=JWTAuth())
def change_password(request, old_password: str, new_password: str):
    user = request.auth
    if not check_password(old_password, user.password):
        return 401, {"error": "Old password is incorrect"}
    
    is_valid, password_error = validate_password(new_password)
    if not is_valid:
        return 401, {"error": password_error}
    
    user.password = make_password(new_password)
    user.save()
    return 200, {"message": "Password changed successfully"}

# @user_router.get('/')
