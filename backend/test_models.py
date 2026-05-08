import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

# ===== Отримуємо API ключі =====
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GPT35_API_KEY = os.getenv("GPT35_API_KEY")
GPT4_API_KEY = os.getenv("GPT4_API_KEY")
HF_TOKEN = os.getenv("HF_TOKEN")

# ===== Імпортуємо клієнтів =====
from openai import OpenAI
import requests
import json

# Ініціалізація клієнтів OpenRouter
client_openrouter = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=OPENROUTER_API_KEY) if OPENROUTER_API_KEY else None
client_gpt35 = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=GPT35_API_KEY) if GPT35_API_KEY else None
client_gpt4 = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=GPT4_API_KEY) if GPT4_API_KEY else None

# Groq клієнт
try:
    from groq import AsyncGroq
    groq_client = AsyncGroq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
except ImportError:
    groq_client = None
    print("[WARNING] groq module not installed")

# HuggingFace URL
#HF_URL = "https://api-inference.huggingface.co/models/google/flan-t5-large"
#HF_HEADERS = {"Authorization": f"Bearer {HF_TOKEN}", "Content-Type": "application/json"} if HF_TOKEN else None

# ===== СПИСОК МОДЕЛЕЙ (той самий що в main.py) =====
MODELS = []

if GROQ_API_KEY and groq_client:
    MODELS.append({"type": "groq", "name": "llama-3.1-8b-instant", "client": groq_client})
    MODELS.append({"type": "groq", "name": "llama-3.3-70b-versatile", "client": groq_client})

if OPENROUTER_API_KEY and client_openrouter:
    MODELS.append({"type": "openrouter", "name": "deepseek/deepseek-chat", "client": client_openrouter})

if GPT35_API_KEY and client_gpt35:
    MODELS.append({"type": "openrouter", "name": "openai/gpt-3.5-turbo", "client": client_gpt35})

if GPT4_API_KEY and client_gpt4:
    MODELS.append({"type": "openrouter", "name": "openai/gpt-4", "client": client_gpt4})

#if HF_TOKEN and HF_HEADERS:
    #MODELS.append({"type": "huggingface", "name": "flan-t5-large"})

# ===== Функція генерації для конкретної моделі =====
async def generate_with_specific_model(model, prompt, max_tokens=200, temperature=0.5):
    """Тестує конкретну модель"""
    try:
        print(f"[TEST] Тестуємо: {model['name']} ({model['type']})")
        
        if model["type"] == "groq":
            response = await model["client"].chat.completions.create(
                model=model["name"],
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=temperature
            )
            text = response.choices[0].message.content
            if text and len(text) > 20:
                print(f"[TEST] ✅ {model['name']} ВІДПОВІВ: {text[:80]}...")
                return True, text
            else:
                print(f"[TEST] ❌ {model['name']} відповів пусто")
                return False, None
                
        elif model["type"] == "openrouter":
            response = await asyncio.to_thread(
                model["client"].chat.completions.create,
                model=model["name"],
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=temperature
            )
            text = response.choices[0].message.content
            if text and len(text) > 20:
                print(f"[TEST] ✅ {model['name']} ВІДПОВІВ: {text[:80]}...")
                return True, text
            else:
                print(f"[TEST] ❌ {model['name']} відповів пусто")
                return False, None
                
        elif model["type"] == "huggingface":
            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": max_tokens,
                    "temperature": temperature,
                    "return_full_text": False
                }
            }
            r = await asyncio.to_thread(
                requests.post,
                HF_URL,
                headers=HF_HEADERS,
                json=payload
            )
            
            if r.status_code == 200:
                data = r.json()
                if isinstance(data, list) and len(data) > 0:
                    text = data[0].get("generated_text", "")
                elif isinstance(data, dict):
                    text = data.get("generated_text", "")
                else:
                    text = ""
                
                if text and len(text) > 20:
                    print(f"[TEST] ✅ {model['name']} ВІДПОВІВ: {text[:80]}...")
                    return True, text
                else:
                    print(f"[TEST] ❌ {model['name']} відповів пусто")
                    return False, None
            else:
                print(f"[TEST] ❌ {model['name']} помилка HTTP {r.status_code}")
                return False, None
                
    except Exception as e:
        print(f"[TEST] ❌ {model['name']} ПОМИЛКА: {type(e).__name__}: {e}")
        return False, None

# ===== Тестування всіх моделей по черзі =====
async def test_all_models():
    prompt = "Привіт! Напиши короткий професійний текст-привітання клієнту від менеджера у 2-3 реченнях."
    
    print("\n" + "="*80)
    print(f"🔍 ТЕСТУВАННЯ ВСІХ МОДЕЛЕЙ (всього: {len(MODELS)})")
    print("="*80)
    
    for i, model in enumerate(MODELS, 1):
        print(f"\n--- {i}/{len(MODELS)} ---")
        success, response = await generate_with_specific_model(model, prompt)
        
        if success:
            print(f"✅ Модель {i}. {model['name']} - ПРАЦЮЄ")
        else:
            print(f"❌ Модель {i}. {model['name']} - НЕ ПРАЦЮЄ")
        
        await asyncio.sleep(1)  # Пауза між запитами
    
    print("\n" + "="*80)
    print("📊 ТЕСТ ЗАВЕРШЕНО")
    print("="*80)

# ===== Тестування fallback послідовності =====
async def test_fallback_sequence():
    """Тестує, що при відмові першої моделі, спрацьовує наступна"""
    prompt = "Напиши коротке ділове привітання для клієнта (1-2 речення)."
    
    print("\n" + "="*80)
    print("🔄 ТЕСТУВАННЯ FALLBACK ПОСЛІДОВНОСТІ")
    print("="*80)
    
    print(f"\n📋 Доступно моделей: {len(MODELS)}")
    for i, model in enumerate(MODELS, 1):
        print(f"  {i}. {model['name']}")
    
    # Функція яка імітує generate_with_fallback з main.py
    async def simulate_fallback(blocked_names):
        for model in MODELS:
            if model["name"] in blocked_names:
                print(f"  ⏭️ Пропускаємо заблоковану: {model['name']}")
                continue
            
            print(f"  🎯 Спробуємо: {model['name']}")
            success, response = await generate_with_specific_model(model, prompt, max_tokens=150)
            if success:
                print(f"  ✅ Отримано відповідь від: {model['name']}")
                return response
        
        print(f"  ❌ Жодна модель не відповіла")
        return None
    
    # Тест 1: Всі моделі доступні
    print("\n=== ТЕСТ 1: Всі моделі доступні ===")
    await simulate_fallback(set())
    
    # Тест 2: Блокуємо першу модель
    if len(MODELS) >= 2:
        print(f"\n=== ТЕСТ 2: Перша модель ({MODELS[0]['name']}) заблокована ===")
        await simulate_fallback({MODELS[0]["name"]})
    
    # Тест 3: Блокуємо перші дві моделі
    if len(MODELS) >= 3:
        print(f"\n=== ТЕСТ 3: Перші дві моделі заблоковані ===")
        await simulate_fallback({MODELS[0]["name"], MODELS[1]["name"]})
    
    # Тест 4: Блокуємо перші три моделі
    if len(MODELS) >= 4:
        print(f"\n=== ТЕСТ 4: Перші три моделі заблоковані ===")
        await simulate_fallback({MODELS[0]["name"], MODELS[1]["name"], MODELS[2]["name"]})
    
    # Тест 5: Блокуємо перші чотири моделі
    if len(MODELS) >= 5:
        print(f"\n=== ТЕСТ 5: Перші чотири моделі заблоковані ===")
        await simulate_fallback({MODELS[0]["name"], MODELS[1]["name"], MODELS[2]["name"], MODELS[3]["name"]})
    
    # Тест 6: Блокуємо перші п'ять моделей
    if len(MODELS) >= 6:
        print(f"\n=== ТЕСТ 6: Перші п'ять моделей заблоковані ===")
        await simulate_fallback({MODELS[0]["name"], MODELS[1]["name"], MODELS[2]["name"], MODELS[3]["name"], MODELS[4]["name"]})

# ===== Головна функція =====
async def main():
    print("\n" + "🚀"*40)
    print("ТЕСТУВАННЯ ВСІХ МОДЕЛЕЙ")
    print("🚀"*40)
    
    # Спочатку тестуємо всі моделі окремо
    await test_all_models()
    
    # Потім тестуємо fallback послідовність
    await test_fallback_sequence()
    
    print("\n" + "="*80)
    print("✅ ВСІ ТЕСТИ ЗАВЕРШЕНО")
    print("="*80)

if __name__ == "__main__":
    asyncio.run(main())