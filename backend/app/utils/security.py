# backend/app/utils/security.py
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, Response, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
import os
from dotenv import load_dotenv

load_dotenv()

# ===== Настройки =====
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is not set!")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 дней (10080 минут)
REFRESH_TOKEN_EXPIRE_DAYS = 30     # 30 дней для refresh token (remember me)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")

# ===== Password =====
def hash_password(password: str) -> str:
    return pwd_context.hash(str(password)[:72])

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(str(plain_password), hashed_password)

# ===== Access / Refresh Tokens =====
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if "sub" in payload:
            payload["sub"] = str(payload["sub"])
        return payload
    except JWTError:
        return None

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    expire = datetime.utcnow() + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_refresh_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if "sub" in payload:
            payload["sub"] = str(payload["sub"])
        return payload
    except JWTError:
        return None

def set_refresh_token_cookie(response: Response, refresh_token: str):
    """Устанавливает refresh token в httpOnly cookie"""
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        #secure=False,              # Для http
        #samesite="none",           # ← меняем с "lax" на "none"
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )

def clear_refresh_token_cookie(response: Response):
    """Удаляет refresh token cookie"""
    response.delete_cookie(
        key="refresh_token",
        path="/",
    )

def get_refresh_token_from_cookie(request: Request) -> Optional[str]:
    """Получает refresh token из cookie"""
    return request.cookies.get("refresh_token")

# ===== Current User =====
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        payload = decode_access_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Payload is empty")
        if "sub" not in payload:
            raise HTTPException(status_code=401, detail="'sub' not in token payload")
        user_id = int(payload["sub"])
    except JWTError as e:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
