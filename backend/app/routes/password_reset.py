from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
import smtplib
from email.mime.text import MIMEText
from email.header import Header
from pydantic import BaseModel, EmailStr

from app.config import config
from app.database import get_db
from app.models import User
from app.utils.security import hash_password

router = APIRouter(prefix="/api/password", tags=["Password Reset"])


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


def send_reset_email(to_email: str, token: str, frontend_url: str = "http://localhost:3000"):
    """Отправить email со ссылкой для сброса пароля"""
    from app.config import config
    
    reset_link = f"{frontend_url}/reset-password?token={token}"
    
    msg = MIMEText(
        f"Для сброса пароля перейдите по ссылке: {reset_link}\n\n"
        f"Ссылка действительна 1 час.\n\n"
        f"Если вы не запрашивали сброс пароля, проигнорируйте это письмо.",
        "plain", "utf-8"
    )
    msg["Subject"] = Header("Reset your password", "utf-8")
    msg["From"] = config.EMAIL_ADDRESS
    msg["To"] = to_email
    
    try:
        if config.EMAIL_SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(config.EMAIL_SMTP_HOST, config.EMAIL_SMTP_PORT)
        else:
            server = smtplib.SMTP(config.EMAIL_SMTP_HOST, config.EMAIL_SMTP_PORT)
            server.starttls()
        
        server.login(config.EMAIL_ADDRESS, config.EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"[PASSWORD] Reset email sent to {to_email}")
        return True
    except Exception as e:
        print(f"[PASSWORD] Email error: {e}")
        return False


@router.post("/forgot")
def forgot_password(
    req: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Запрос на сброс пароля"""
    user = db.query(User).filter(User.email == req.email).first()
    
    # Не сообщаем, найден email или нет (безопасность)
    if not user:
        return {"message": "Если email существует, мы отправили ссылку для сброса"}
    
    if not user.is_active:
        return {"message": "Если email существует, мы отправили ссылку для сброса"}
    
    # Генерируем токен
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()
    
    # Отправляем email в фоне
    background_tasks.add_task(send_reset_email, user.email, token)
    
    return {"message": "Если email существует, мы отправили ссылку для сброса"}


@router.post("/reset")
def reset_password(
    req: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """Сброс пароля по токену"""
    user = db.query(User).filter(
        User.reset_token == req.token,
        User.reset_token_expires > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недействительная или просроченная ссылка"
        )
    
    if len(req.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пароль должен быть не менее 8 символов"
        )
    
    user.hashed_password = hash_password(req.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    return {"message": "Пароль успешно изменён"}