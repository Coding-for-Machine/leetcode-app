from pydantic import BaseModel, EmailStr, StringConstraints, constr
from typing import Optional, Annotated
from datetime import datetime

class UserRegisterSchema(BaseModel):
    email: EmailStr
    username: Annotated[str, StringConstraints(min_length=2, max_length=30)]
    password: Annotated[str, StringConstraints(min_length=6, max_length=128)]

# Login uchun schema
class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str

# Foydalanuvchi ma'lumotlari
class UserSchema(BaseModel):
    id: int
    email: EmailStr
    username: str
    image: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

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