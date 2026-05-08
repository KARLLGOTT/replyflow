import asyncio
import time
import json
import uuid
from celery import Celery
from app.utils.redis_client import redis_client
from app.utils.model_balancer import select_model, record_model_result

# Настройка Celery с Redis как брокером
celery_app = Celery(
    'replyflow_tasks',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=120,  # 2 минуты максимум
    task_soft_time_limit=110,
)

def get_result_key(task_id: str) -> str:
    return f"task_result:{task_id}"

def save_task_result(task_id: str, result: dict, ttl: int = 3600):
    """Сохранить результат задачи в Redis"""
    if redis_client:
        redis_client.setex(get_result_key(task_id), ttl, json.dumps(result))

def get_task_result(task_id: str) -> dict:
    """Получить результат задачи из Redis"""
    if redis_client:
        data = redis_client.get(get_result_key(task_id))
        if data:
            return json.loads(data)
    return None

@celery_app.task(bind=True, name="generate_response")
def generate_response_task(self, prompt: str, subscription_plan: str, language: str, max_tokens: int, temperature: float):
    """Задача на генерацию ответа AI"""
    task_id = self.request.id
    
    # Обновляем статус
    self.update_state(state='PROCESSING', meta={'progress': 0})
    save_task_result(task_id, {'status': 'processing', 'progress': 0})
    
    try:
        # Здесь нужно импортировать функции из main.py
        # Так как Celery не может напрямую импортировать из main.py,
        # мы будем использовать симуляцию или перенести логику сюда
        
        self.update_state(state='PROCESSING', meta={'progress': 50})
        save_task_result(task_id, {'status': 'processing', 'progress': 50})
        
        # Симуляция генерации (заглушка)
        # В реальности нужно перенести логику generate_with_fallback сюда
        import time
        time.sleep(2)  # Симулируем работу AI
        
        result = f"Сгенерированный ответ для: {prompt[:50]}..."
        
        self.update_state(state='SUCCESS', meta={'progress': 100})
        save_task_result(task_id, {
            'status': 'completed',
            'result': result,
            'progress': 100
        })
        
        return result
        
    except Exception as e:
        self.update_state(state='FAILURE', meta={'error': str(e)})
        save_task_result(task_id, {
            'status': 'failed',
            'error': str(e)
        })
        raise e