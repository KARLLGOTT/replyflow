from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    subscription_plan = Column(String, default="free")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    total_generations = Column(Integer, default=0)
    generations_today = Column(Integer, default=0)
    last_generation_date = Column(DateTime, default=None)
    
    # ===== ДЛЯ СБРОСА ПАРОЛЯ =====
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    
    # ===== ДЛЯ ИНТЕГРАЦИЙ (только Business) =====
    crm_type = Column(String, nullable=True)
    crm_api_key = Column(String, nullable=True)
    crm_webhook = Column(String, nullable=True)
    crm_data = Column(JSON, nullable=True)  # <-- ДОБАВЛЕНО
    webhook_url = Column(String, nullable=True)
    api_key = Column(String, nullable=True, unique=True)
    
    # ===== ДЛЯ КОНТРОЛЯ СТОИМОСТИ =====
    monthly_budget = Column(Float, default=0.50)
    total_cost_month = Column(Float, default=0.0)
    cost_reset_date = Column(DateTime, default=datetime.utcnow)
    
    # ===== ДЛЯ ПОДПИСКИ =====
    subscription_end_date = Column(DateTime, nullable=True)
    subscription_auto_renew = Column(Boolean, default=True)
    
    # ===== СВЯЗИ =====
    scripts = relationship("SalesScript", back_populates="user", cascade="all, delete-orphan")
    knowledge_items = relationship("KnowledgeBase", back_populates="user", cascade="all, delete-orphan")
    telegram_accounts = relationship("TelegramUser", back_populates="user", cascade="all, delete-orphan")
    analytics = relationship("Analytics", back_populates="user", cascade="all, delete-orphan")
    
    # Флаги для уведомлений (не сохраняются в БД, только в памяти)
    _daily_warning_sent = False
    _monthly_warning_sent = False
    _budget_warning_sent = False


class SalesScript(Base):
    __tablename__ = "sales_scripts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    template = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    language = Column(String, default="uk")

    user = relationship("User", back_populates="scripts")


class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    file_type = Column(String, default="text")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="knowledge_items")


class TelegramUser(Base):
    __tablename__ = "telegram_users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(Integer, unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="telegram_accounts")


class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_email = Column(String, nullable=True)
    subscription_plan = Column(String, nullable=True)
    question = Column(Text, nullable=True)
    answer = Column(Text, nullable=True)
    model_used = Column(String, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    tokens_used = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="analytics", foreign_keys=[user_id])