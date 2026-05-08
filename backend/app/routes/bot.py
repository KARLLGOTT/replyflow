from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models import User, TelegramUser

router = APIRouter(prefix="/api/bot", tags=["Bot"])


class LinkTelegramRequest(BaseModel):
    telegram_id: int
    api_key: str


class TelegramLinkResponse(BaseModel):
    status: str
    user_id: int
    email: str
    message: str


@router.post("/link-telegram", response_model=TelegramLinkResponse)
def link_telegram(
    data: LinkTelegramRequest,
    db: Session = Depends(get_db)
):
    """Привязать Telegram ID к пользователю по API ключу"""
    
    user = db.query(User).filter(User.api_key == data.api_key).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    existing = db.query(TelegramUser).filter(TelegramUser.telegram_id == data.telegram_id).first()
    if existing:
        if existing.user_id == user.id:
            return {
                "status": "already_linked",
                "user_id": user.id,
                "email": user.email,
                "message": "Telegram account already linked to this user"
            }
        else:
            existing.user_id = user.id
            existing.updated_at = datetime.utcnow()
            db.commit()
            return {
                "status": "updated",
                "user_id": user.id,
                "email": user.email,
                "message": "Telegram account re-linked to new user"
            }
    
    tg_user = TelegramUser(
        telegram_id=data.telegram_id,
        user_id=user.id
    )
    db.add(tg_user)
    db.commit()
    
    return {
        "status": "linked",
        "user_id": user.id,
        "email": user.email,
        "message": "Telegram account linked successfully"
    }


@router.get("/me")
def get_bot_user(
    telegram_id: int,
    db: Session = Depends(get_db)
):
    """Получить пользователя по Telegram ID"""
    tg_user = db.query(TelegramUser).filter(TelegramUser.telegram_id == telegram_id).first()
    if not tg_user:
        raise HTTPException(status_code=404, detail="Telegram ID not linked")
    
    user = tg_user.user
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "subscription_plan": user.subscription_plan,
        "api_key": user.api_key
    }