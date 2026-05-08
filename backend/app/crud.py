from sqlalchemy.orm import Session
from .models import User
from .schemas import UserCreate
from app.utils.security import hash_password
from email_validator import validate_email, EmailNotValidError

def create_user(db: Session, user_data: UserCreate) -> User:
    email = str(user_data.email)  # 👈 ВАЖНО

    if db.query(User).filter(User.email == email).first():
        raise ValueError("Email already registered")

    if db.query(User).filter(User.username == user_data.username).first():
        raise ValueError("Username already taken")

    try:
        validate_email(email)  # 👈 используем строку
    except EmailNotValidError:
        raise ValueError("Invalid email address")

    user = User(
        email=email,  # 👈 строка
        username=user_data.username,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        is_verified=False
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_user_by_email(db: Session, email: str) -> User:
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: int) -> User:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_username(db: Session, username: str) -> User:
    return db.query(User).filter(User.username == username).first()