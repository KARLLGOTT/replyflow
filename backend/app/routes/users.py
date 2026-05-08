from fastapi import APIRouter, Depends, HTTPException, status, Form, Response, Request
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserRead, Token, UserUpdate, PasswordChange
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    get_current_user,
    set_refresh_token_cookie,
    clear_refresh_token_cookie,
    get_refresh_token_from_cookie
)
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(prefix="/api/users", tags=["Users"])

# ===== REGISTER =====
@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_in.email,
        username=user_in.username,
        full_name=user_in.full_name or user_in.username,
        hashed_password=hash_password(user_in.password),
        is_active=True,
        is_admin=False,
        is_verified=False,
        subscription_plan="free",
        created_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# ===== LOGIN =====
@router.post("/login", response_model=Token)
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})
    
    set_refresh_token_cookie(response, refresh_token)
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

# ===== REFRESH TOKEN =====
@router.post("/refresh", response_model=Token)
def refresh_token(
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    refresh_token = get_refresh_token_from_cookie(request)
    
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token not found")
    
    payload = decode_refresh_token(refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    user_id = int(payload["sub"])
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_access_token = create_access_token({"sub": user.id})
    new_refresh_token = create_refresh_token({"sub": user.id})
    
    set_refresh_token_cookie(response, new_refresh_token)
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }

# ===== GET CURRENT USER =====
@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user

# ===== UPDATE PROFILE =====
@router.put("/update-profile", response_model=UserRead)
def update_profile(
    profile_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if profile_data.username:
        existing = db.query(User).filter(User.username == profile_data.username).first()
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = profile_data.username
    
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name
    
    db.commit()
    db.refresh(current_user)
    return current_user

# ===== CHANGE PASSWORD =====
@router.put("/change-password")
def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    if len(password_data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    current_user.hashed_password = hash_password(password_data.new_password)
    db.commit()
    
    return {"status": "ok", "message": "Password changed successfully"}

# ===== CANCEL SUBSCRIPTION =====
@router.post("/cancel-subscription")
def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.subscription_plan = "free"
    db.commit()
    return {"status": "ok", "message": "Subscription cancelled"}

# ===== LOGOUT =====
@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    response: Response,
    current_user: User = Depends(get_current_user)
):
    clear_refresh_token_cookie(response)
    return {"status": "ok", "message": f"User {current_user.email} logged out successfully"}
    
@router.get("/subscription-status")
def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    is_active = True
    days_left = None
    
    if current_user.subscription_plan != "free" and current_user.subscription_end_date:
        if current_user.subscription_end_date > now:
            days_left = (current_user.subscription_end_date - now).days
        else:
            is_active = False
            days_left = 0
    
    limits = {
        "free": 10,
        "starter": 50,
        "professional": 150,
        "business": None
    }
    
    return {
        "plan": current_user.subscription_plan,
        "is_active": is_active,
        "days_left": days_left,
        "end_date": current_user.subscription_end_date.isoformat() if current_user.subscription_end_date else None,
        "auto_renew": current_user.subscription_auto_renew,
        "daily_limit": limits.get(current_user.subscription_plan, 10),
        "generations_today": current_user.generations_today,
        "remaining_today": max(0, limits.get(current_user.subscription_plan, 10) - current_user.generations_today) if current_user.subscription_plan != "business" else "unlimited"
    }