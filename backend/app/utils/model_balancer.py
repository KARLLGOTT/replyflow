import random
import time
from typing import Dict, Any, Optional, Tuple
from collections import defaultdict
from app.utils.cost_manager import MODEL_COSTS

# Статистика по моделям
model_stats = defaultdict(lambda: {
    "success_count": 0,
    "fail_count": 0,
    "avg_response_time": 0,
    "last_fail_time": 0
})

def get_model_priority(subscription_plan: str) -> str:
    """Определить стратегию балансировки в зависимости от тарифа"""
    strategies = {
        "free": "cost",        # Самые дешёвые
        "starter": "speed",    # Самые быстрые
        "professional": "quality",  # Качественные
        "business": "quality"  # Качественные
    }
    return strategies.get(subscription_plan, "speed")

def select_model(models: list, subscription_plan: str, language: str) -> Optional[Dict]:
    """
    Выбрать модель на основе тарифа и статистики
    """
    if not models:
        return None
    
    strategy = get_model_priority(subscription_plan)
    
    # Сортируем модели по стратегии
    if strategy == "cost":
        # Дешёвые модели: groq (бесплатно), huggingface (бесплатно), openrouter (платно)
        def cost_score(m):
            if m["type"] == "groq":
                return 1  # Самый дешёвый
            elif m["type"] == "huggingface":
                return 2
            else:
                return 3  # Платные
    
    elif strategy == "speed":
        # Быстрые модели: groq (быстро), openrouter (средне), huggingface (медленно)
        def speed_score(m):
            if m["type"] == "groq":
                return 1
            elif m["type"] == "openrouter":
                return 2
            else:
                return 3
    
    else:  # quality
        # Качественные: openrouter (deepseek), groq (llama-3.3-70b)
        def quality_score(m):
            if "70b" in m.get("name", ""):
                return 1  # Самая качественная
            elif "deepseek" in m.get("name", ""):
                return 2
            elif "llama" in m.get("name", ""):
                return 3
            else:
                return 4
    
    # Исключаем модели, которые недавно падали
    current_time = time.time()
    available_models = []
    for model in models:
        stats = model_stats[model["name"]]
        # Если модель падала в последние 10 секунд, пропускаем
        if current_time - stats["last_fail_time"] < 10:
            continue
        available_models.append(model)
    
    if not available_models:
        available_models = models  # Если все упали, берём любые
    
    # Сортируем и выбираем лучшую
    if strategy == "cost":
        available_models.sort(key=cost_score)
    elif strategy == "speed":
        available_models.sort(key=speed_score)
    else:
        available_models.sort(key=quality_score)
    
    # Иногда берём вторую модель для разнообразия (10% случаев)
    if len(available_models) > 1 and random.random() < 0.1:
        return available_models[1]
    
    return available_models[0]

def record_model_result(model_name: str, success: bool, response_time: float):
    """Записать результат работы модели для статистики"""
    stats = model_stats[model_name]
    if success:
        stats["success_count"] += 1
    else:
        stats["fail_count"] += 1
        stats["last_fail_time"] = time.time()
    
    # Обновляем среднее время ответа
    total_calls = stats["success_count"] + stats["fail_count"]
    stats["avg_response_time"] = (stats["avg_response_time"] * (total_calls - 1) + response_time) / total_calls

def get_model_stats() -> Dict:
    """Получить статистику по всем моделям (для админки)"""
    return dict(model_stats)
    

def select_model_by_budget(models: list, subscription_plan: str, remaining_budget: float) -> Optional[Dict]:
    """Выбрать модель, вписывающуюся в бюджет"""
    
    if subscription_plan == "business":
        # Business — любые модели, выбираем качественную
        for m in models:
            if "70b" in m.get("name", ""):
                return m
        return models[0] if models else None
    
    # Для остальных — считаем стоимость
    affordable_models = []
    for model in models:
        cost_per_1k = MODEL_COSTS.get(model["name"], 0.0005)
        # Если бюджет позволяет хотя бы 50 запросов
        if remaining_budget / cost_per_1k > 50:
            affordable_models.append(model)
    
    if not affordable_models:
        # Если бюджет маленький — только groq (самые дешёвые)
        affordable_models = [m for m in models if m["type"] == "groq"]
    
    if not affordable_models:
        affordable_models = models
    
    return select_model(affordable_models, subscription_plan, "uk")