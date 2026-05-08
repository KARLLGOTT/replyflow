from pydantic import BaseModel, EmailStr, Field, constr
from datetime import datetime
from typing import Optional, List

# ===== USER SCHEMAS =====
class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: constr(min_length=8, max_length=72)
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRead(BaseModel):
    id: int
    email: EmailStr
    username: str
    full_name: Optional[str]
    is_active: bool
    is_admin: bool
    is_verified: bool
    subscription_plan: str
    created_at: datetime
    total_generations: Optional[int] = 0
    generations_today: Optional[int] = 0
    last_generation_date: Optional[datetime] = None
    
    # Поля для интеграций
    crm_type: Optional[str] = None
    webhook_url: Optional[str] = None
    has_api_key: Optional[bool] = False
    
    # Поля для контроля стоимости
    total_cost_month: Optional[float] = 0.0
    monthly_budget: Optional[float] = 0.50
    
    # Поля для подписки
    subscription_end_date: Optional[datetime] = None
    subscription_auto_renew: Optional[bool] = True

    model_config = {
        "from_attributes": True
    }

# ===== USER UPDATE =====
class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = None
    subscription_plan: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    subscription_end_date: Optional[datetime] = None
    subscription_auto_renew: Optional[bool] = None

# ===== PASSWORD CHANGE =====
class PasswordChange(BaseModel):
    current_password: str
    new_password: constr(min_length=8, max_length=72)

# ===== TOKEN SCHEMAS =====
class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"

class TokenRefresh(BaseModel):
    refresh_token: str

# ===== MESSAGE SCHEMAS =====
class MessageResponse(BaseModel):
    status: str
    message: str

# ===== GENERATION SCHEMAS =====
class GenerationInput(BaseModel):
    prompt: str
    max_tokens: int = 50

# ===== DEPENDENCY SCHEMAS =====
class DependencyAction(BaseModel):
    name: str
    value: str

# ===== INTEGRATION SCHEMAS =====
class CRMConnectRequest(BaseModel):
    crm_type: str
    api_key: str

class WebhookRegisterRequest(BaseModel):
    url: str
    events: List[str] = ["generation.created", "limit.reached"]