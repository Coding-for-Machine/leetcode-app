from pydantic import BaseModel, ConfigDict, EmailStr, StringConstraints, constr
from typing import Optional, Annotated
from datetime import datetime
from ninja import ModelSchema

from .models import MyUser

class UserRegisterSchema(ModelSchema):
    email: str
    username: str
    password: str

    class Config:
        model = MyUser
        model_fields = ['email', 'username', 'password']

# Login uchun schema
class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str

# Foydalanuvchi ma'lumotlari
class UserSchema(BaseModel):
    id: int
    email: str
    username: str
    role: str
    avatar: Optional[str] = None
    isPremium: Optional[bool] = None
    model_config = ConfigDict(from_attributes=True)


# Profil ma'lumotlari
class ProfileSchema(BaseModel):
    id: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    image: Optional[str]
    bio: Optional[str]
    age: int

    class Config:
        from_attributes = True

class ProfileUpdateSchema(BaseModel):
    first_name: Optional[str]
    last_name: Optional[str]
    image: Optional[str]
    bio: Optional[str]
    age: Optional[int]
    class Config:
        from_attributes = True
