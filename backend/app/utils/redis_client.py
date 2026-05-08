import redis
import json
import os
from typing import List, Dict, Any, Optional
from app.config import config

try:
    redis_client = redis.Redis.from_url(config.REDIS_URL, decode_responses=True)
    redis_client.ping()
    print("[INFO] Redis client initialized")
except Exception as e:
    print(f"[WARNING] Redis connection failed: {e}")
    redis_client = None

SESSION_TTL = config.REDIS_SESSION_TTL
MAX_HISTORY_LENGTH = 50
CACHE_TTL = config.REDIS_CACHE_TTL

def get_session(session_id: str) -> List[Dict[str, str]]:
    """Получить историю сессии из Redis"""
    if not redis_client:
        return []
    
    key = f"session:{session_id}"
    data = redis_client.get(key)
    
    if data:
        return json.loads(data)
    return []

def save_session(session_id: str, history: List[Dict[str, str]]) -> bool:
    """Сохранить историю сессии в Redis"""
    if not redis_client:
        return False
    
    key = f"session:{session_id}"
    redis_client.setex(key, SESSION_TTL, json.dumps(history))
    return True

def add_to_memory(session_id: str, user: str, assistant: str) -> None:
    """Добавить сообщение в историю сессии"""
    history = get_session(session_id)
    history.append({"user": user, "assistant": assistant})
    
    # Ограничиваем длину истории
    if len(history) > MAX_HISTORY_LENGTH:
        history = history[-MAX_HISTORY_LENGTH:]
    
    save_session(session_id, history)

def reset_memory(session_id: str) -> None:
    """Очистить историю сессии"""
    if redis_client:
        key = f"session:{session_id}"
        redis_client.delete(key)

def build_history_text(session_id: str, language: str = "uk", max_messages: int = 10) -> str:
    """Сформировать текст истории для промпта"""
    history = get_session(session_id)
    
    if not history:
        return "Немає історії діалогу." if language == "uk" else "No conversation history."
    
    # Берём последние N сообщений
    history = history[-max_messages:]
    
    if language == "uk":
        return "\n".join([f"Клієнт: {h['user']}\nМенеджер: {h['assistant']}" for h in history])
    else:
        return "\n".join([f"Customer: {h['user']}\nManager: {h['assistant']}" for h in history])

def get_session_stats(session_id: str) -> Dict[str, Any]:
    """Получить статистику сессии (для админки)"""
    history = get_session(session_id)
    return {
        "session_id": session_id,
        "message_count": len(history),
        "ttl": redis_client.ttl(f"session:{session_id}") if redis_client else None
    }

# ===== Кэширование ответов =====
CACHE_TTL = 300  # 5 минут

def get_cache_key(text: str, plan: str, language: str) -> str:
    """Создать ключ для кэша на основе текста, тарифа и языка"""
    import hashlib
    # Приводим текст к нижнему регистру и удаляем лишние пробелы
    normalized = ' '.join(text.lower().strip().split())
    content = f"{normalized}:{plan}:{language}"
    hash_key = hashlib.md5(content.encode()).hexdigest()
    return f"cache:response:{hash_key}"

def get_cached_response(text: str, plan: str, language: str) -> Optional[List[str]]:
    """Получить закэшированный ответ"""
    if not redis_client:
        return None
    
    key = get_cache_key(text, plan, language)
    cached = redis_client.get(key)
    
    if cached:
        try:
            return json.loads(cached)
        except:
            return None
    return None

def set_cached_response(text: str, plan: str, language: str, responses: List[str]) -> None:
    """Сохранить ответ в кэш"""
    if not redis_client:
        return
    
    key = get_cache_key(text, plan, language)
    redis_client.setex(key, CACHE_TTL, json.dumps(responses))

def clear_cache_for_text(text: str) -> None:
    """Очистить кэш для конкретного текста (если нужно принудительно)"""
    if not redis_client:
        return
    
    # Очищаем для всех тарифов и языков
    for plan in ["free", "starter", "professional", "business"]:
        for lang in ["uk", "en"]:
            key = get_cache_key(text, plan, lang)
            redis_client.delete(key)