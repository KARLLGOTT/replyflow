from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from .database import get_db
from .models import User
from app.utils.security import decode_access_token
from typing import Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login", auto_error=False)
security = HTTPBearer(auto_error=False)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Получить текущего пользователя из токена (обязательно)"""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

def get_current_user_optional(
    db: Session = Depends(get_db),
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[User]:
    """Получить текущего пользователя из токена (опционально)"""
    if not creds:
        return None
    token = creds.credentials
    try:
        payload = decode_access_token(token)
        if not payload or "sub" not in payload:
            return None
        user_id = int(payload["sub"])
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except Exception:
        return None

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Получить текущего администратора"""
    print(f"[ADMIN DEBUG] User: {current_user.email}, is_admin: {current_user.is_admin}")
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user