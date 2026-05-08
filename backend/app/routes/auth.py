from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import UserCreate, UserRead, Token, TokenRefresh, MessageResponse
from app.models import User
from app.crud import create_user, get_user_by_email, get_user_by_id
from app.dependencies import get_current_user
from app.utils.security import verify_password, create_access_token, create_refresh_token, decode_refresh_token

from passlib.context import CryptContext

router = APIRouter(prefix="/api/auth", tags=["Auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ===== REGISTER =====
@router.post("/register", response_model=UserRead, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = get_user_by_email(db, str(user_data.email))
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )

    try:
        user = User(
            email=str(user_data.email),  # 👈 ВАЖНО
            username=user_data.username,
            full_name=user_data.full_name,
            hashed_password=pwd_context.hash(str(user_data.password)[:72]),
            is_active=True,
            is_admin=False,
            is_verified=False,
            subscription_plan="free"
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    except Exception as e:
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail="Registration error")

# ===== LOGIN =====
@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_user_by_email(db, form_data.username)

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is inactive")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

# ===== REFRESH TOKEN =====
@router.post("/refresh", response_model=Token)
def refresh(token_data: TokenRefresh, db: Session = Depends(get_db)):
    payload = decode_refresh_token(token_data.refresh_token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = int(payload.get("sub"))
    user = get_user_by_id(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    access_token = create_access_token({"sub": str(user.id)})
    new_refresh_token = create_refresh_token({"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

# ===== GET CURRENT USER =====
@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ===== LOGOUT =====
@router.post("/logout", response_model=MessageResponse)
def logout():
    return {"status": "success", "message": "Successfully logged out"}