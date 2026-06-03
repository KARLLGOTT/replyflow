import redis
import json
import os
from typing import List, Dict, Any, Optional
from app.config import config

# === Redis (если работает) ===
try:
    redis_client = redis.Redis.from_url(config.REDIS_URL, decode_responses=True)
    redis_client.ping()
    print("[INFO] Redis client initialized")
except Exception as e:
    print(f"[WARNING] Redis connection failed: {e}")
    redis_client = None

SESSION_TTL = getattr(config, 'REDIS_SESSION_TTL', 3600)
MAX_HISTORY_LENGTH = 50
CACHE_TTL = getattr(config, 'REDIS_CACHE_TTL', 300)

# === Файловое хранилище (всегда работает) ===
def _get_file_path(session_id: str) -> str:
    return f"/tmp/context_{session_id}.json"

def add_to_memory(session_id: str, user: str, assistant: str) -> None:
    """Сохранить в Redis (если есть) и в файл"""
    # 1. Файл (всегда)
    file_path = _get_file_path(session_id)
    history = []
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r') as f:
                history = json.load(f)
        except:
            pass
    history.append({"user": user, "assistant": assistant})
    if len(history) > MAX_HISTORY_LENGTH:
        history = history[-MAX_HISTORY_LENGTH:]
    with open(file_path, 'w') as f:
        json.dump(history, f)
    print(f"[FILE] Saved {len(history)} messages for {session_id}")
    
    # 2. Redis (если есть)
    if redis_client:
        key = f"session:{session_id}"
        redis_client.setex(key, SESSION_TTL, json.dumps(history))

def reset_memory(session_id: str) -> None:
    """Очистить память"""
    file_path = _get_file_path(session_id)
    if os.path.exists(file_path):
        os.remove(file_path)
        print(f"[FILE] Reset context for {session_id}")
    if redis_client:
        key = f"session:{session_id}"
        redis_client.delete(key)

def build_history_text(session_id: str, language: str = "uk", max_messages: int = 10) -> str:
    """Сформировать текст истории из файла"""
    file_path = _get_file_path(session_id)
    if not os.path.exists(file_path):
        return "Немає історії діалогу." if language == "uk" else "No conversation history."
    
    try:
        with open(file_path, 'r') as f:
            history = json.load(f)
    except:
        return "Немає історії діалогу." if language == "uk" else "No conversation history."
    
    if not history:
        return "Немає історії діалогу." if language == "uk" else "No conversation history."
    
    history = history[-max_messages:]
    print(f"[FILE] Loaded {len(history)} messages for {session_id}")
    
    if language == "uk":
        return "\n".join([f"Клієнт: {h['user']}\nМенеджер: {h['assistant']}" for h in history])
    else:
        return "\n".join([f"Customer: {h['user']}\nManager: {h['assistant']}" for h in history])

def get_session_stats(session_id: str) -> Dict[str, Any]:
    file_path = _get_file_path(session_id)
    history = []
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r') as f:
                history = json.load(f)
        except:
            pass
    return {
        "session_id": session_id,
        "message_count": len(history),
        "ttl": redis_client.ttl(f"session:{session_id}") if redis_client else None
    }

# === Кэширование (оставляем как было) ===
def get_cache_key(text: str, plan: str, language: str) -> str:
    import hashlib
    normalized = ' '.join(text.lower().strip().split())
    content = f"{normalized}:{plan}:{language}"
    hash_key = hashlib.md5(content.encode()).hexdigest()
    return f"cache:response:{hash_key}"

def get_cached_response(text: str, plan: str, language: str) -> Optional[List[str]]:
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
    if not redis_client:
        return
    key = get_cache_key(text, plan, language)
    redis_client.setex(key, CACHE_TTL, json.dumps(responses))

def clear_cache_for_text(text: str) -> None:
    if not redis_client:
        return
    for plan in ["free", "starter", "professional", "business"]:
        for lang in ["uk", "en"]:
            key = get_cache_key(text, plan, lang)
            redis_client.delete(key)
