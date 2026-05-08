import os
from datetime import datetime
from typing import Dict, Tuple, Optional
from sqlalchemy.orm import Session
from app.models import User
from app.config import config

# Стоимость за 1000 токенов (из конфига)
MODEL_COSTS = config.MODEL_COSTS

# Месячные лимиты по тарифам (из конфига)
MONTHLY_BUDGETS = config.MONTHLY_BUDGETS

def calculate_cost(model_name: str, input_tokens: int = 500, output_tokens: int = 500) -> float:
    """
    Рассчитать стоимость запроса
    Пример: 1000 токенов = $0.0001 для llama-3.1-8b-instant
    """
    cost_per_1k = config.get_model_cost(model_name)
    total_tokens = input_tokens + output_tokens
    cost = (total_tokens / 1000) * cost_per_1k
    return round(cost, 6)

def check_budget(user: User, estimated_cost: float) -> Tuple[bool, float, float]:
    """
    Проверить, не превысит ли запрос бюджет
    Возвращает: (разрешено, остаток бюджета, лимит)
    """
    if user.subscription_plan == "business":
        return True, float('inf'), float('inf')
    
    monthly_limit = config.get_monthly_budget(user.subscription_plan)
    remaining = monthly_limit - user.total_cost_month
    
    # Логирование для отладки
    print(f"[BUDGET] User {user.email}: spent={user.total_cost_month:.6f}, limit={monthly_limit}, remaining={remaining:.6f}, cost={estimated_cost:.6f}")
    
    if remaining < estimated_cost:
        print(f"[BUDGET] BLOCKED: not enough budget")
        return False, remaining, monthly_limit
    
    return True, remaining, monthly_limit

def update_user_cost(user: User, cost: float, db: Session):
    """Обновить затраты пользователя"""
    user.total_cost_month += cost
    
    # Проверяем, не пора ли сбросить месячный счётчик
    now = datetime.utcnow()
    if user.cost_reset_date is None:
        user.cost_reset_date = now
    elif now.month != user.cost_reset_date.month or now.year != user.cost_reset_date.year:
        user.total_cost_month = cost  # начинаем новый месяц с текущим запросом
        user.cost_reset_date = now
        print(f"[BUDGET] Reset monthly budget for user {user.email}, new total: {user.total_cost_month:.6f}")
    
    db.commit()

def get_remaining_budget_percent(user: User) -> float:
    """Получить процент оставшегося бюджета"""
    if user.subscription_plan == "business":
        return 100.0
    
    monthly_limit = config.get_monthly_budget(user.subscription_plan)
    if monthly_limit == 0:
        return 0
    
    percent = (monthly_limit - user.total_cost_month) / monthly_limit * 100
    return max(0, percent)

def get_model_by_budget(subscription_plan: str, remaining_budget: float) -> str:
    """
    Выбрать модель на основе оставшегося бюджета
    Возвращает имя модели
    """
    if subscription_plan == "business":
        return "llama-3.3-70b-versatile"  # Качественная для бизнеса
    
    if remaining_budget > 10:
        return "llama-3.3-70b-versatile"  # Ещё много денег — качественная
    elif remaining_budget > 5:
        return "deepseek/deepseek-chat"   # Средне
    elif remaining_budget > 1:
        return "llama-3.1-8b-instant"    # Экономная
    else:
        return "llama-3.1-8b-instant"    # Только экономная