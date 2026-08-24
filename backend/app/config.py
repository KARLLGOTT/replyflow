import os
from dotenv import load_dotenv
from typing import Dict, Optional
from datetime import timedelta

# Загружаем .env файл
load_dotenv()

class Config:
    """Центральный конфигурационный файл проекта"""
    
    # ===== БАЗА ДАННЫХ =====
    DATABASE_URL = os.environ.get("DATABASE_URL")
    if not DATABASE_URL:
        DATABASE_URL = "postgresql://user:pass@localhost/dbname"
    DATABASE_POOL_SIZE: int = int(os.getenv("DATABASE_POOL_SIZE", "20"))
    DATABASE_MAX_OVERFLOW: int = int(os.getenv("DATABASE_MAX_OVERFLOW", "10"))
    
    # ===== REDIS =====
    REDIS_URL: str = os.getenv("REDIS_URL")
    REDIS_SESSION_TTL: int = int(os.getenv("REDIS_SESSION_TTL", "3600"))  # 1 час
    REDIS_CACHE_TTL: int = int(os.getenv("REDIS_CACHE_TTL", "300"))  # 5 минут
    
    # ===== БЕЗОПАСНОСТЬ =====
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your_super_secret_key_here")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
    
    # ===== CORS =====
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,https://replyflow-jmaj4f8mq-karllgott-s-projects.vercel.app").split(",")
    
    # ===== EMAIL =====
    EMAIL_ADDRESS: str = os.getenv("EMAIL_ADDRESS", "")
    EMAIL_PASSWORD: str = os.getenv("EMAIL_PASSWORD", "")
    EMAIL_SMTP_HOST: str = os.getenv("EMAIL_SMTP_HOST", "smtp.ukr.net")
    EMAIL_SMTP_PORT: int = int(os.getenv("EMAIL_SMTP_PORT", "465"))
    
    # ===== AI МОДЕЛИ =====
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY")
    GROQ_MODELS: list = ["openai/gpt-oss-20b", "llama-3.3-70b-versatile"]
    
    OPENROUTER_API_KEY: Optional[str] = os.getenv("OPENROUTER_API_KEY")
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODELS: list = ["deepseek/deepseek-chat"]
    
    HF_TOKEN: Optional[str] = os.getenv("HF_TOKEN")
    HF_URL: str = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3"
    
    # ===== ПОИСК =====
    TAVILY_API_KEY: Optional[str] = os.getenv("TAVILY_API_KEY")
    TAVILY_SEARCH_DEPTH: str = "advanced"
    TAVILY_MAX_RESULTS: int = 5
    
    # ===== ЛИМИТЫ =====
    DAILY_LIMITS: Dict[str, int] = {
        "free": 10,
        "starter": 50,
        "professional": 150,
        "business": float('inf')
    }
    
    MONTHLY_BUDGETS: Dict[str, float] = {
        "free": 0.50,
        "starter": 5.00,
        "professional": 30.00,
        "business": float('inf')
    }
    
    # Цены для пользователя (в центах)
    PRICES: Dict[str, int] = {
        "free": 0,
        "starter": 900,        # $9
        "professional": 2900,  # $29
        "business": 7900,      # $79
    }
    
    MODEL_COSTS: Dict[str, float] = {
        "llama-3.1-8b-instant": 0.0001,
        "llama-3.3-70b-versatile": 0.0008,
        "deepseek/deepseek-chat": 0.0005,
        "mistralai/Mistral-7B-Instruct-v0.3": 0.0002,
    }
    
    # ===== ДЕМО =====
    DEMO_LIMIT: int = int(os.getenv("DEMO_LIMIT", "3"))
    
    # ===== ПОДПИСКИ =====
    DEFAULT_SUBSCRIPTION_DAYS: int = int(os.getenv("DEFAULT_SUBSCRIPTION_DAYS", "30"))
    
    # ===== СЕРВЕР =====
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =====
    @classmethod
    def get_daily_limit(cls, subscription_plan: str) -> int:
        return cls.DAILY_LIMITS.get(subscription_plan, 10)
    
    @classmethod
    def get_monthly_budget(cls, subscription_plan: str) -> float:
        return cls.MONTHLY_BUDGETS.get(subscription_plan, 0.50)
    
    @classmethod
    def get_price(cls, subscription_plan: str) -> int:
        return cls.PRICES.get(subscription_plan, 0)
    
    @classmethod
    def get_model_cost(cls, model_name: str) -> float:
        return cls.MODEL_COSTS.get(model_name, 0.0005)
        
    # ===== БИЗНЕС ОГРАНИЧЕНИЯ (мягкие лимиты) =====
    BUSINESS_DAILY_LIMIT = 2000  # мягкий лимит на день
    BUSINESS_MONTHLY_LIMIT = 50000  # мягкий лимит на месяц (генераций)
    BUSINESS_MONTHLY_BUDGET_WARNING = 150.0  # предупреждение при расходе $150


# Создаём глобальный объект конфигурации
config = Config()
