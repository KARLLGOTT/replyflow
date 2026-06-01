#!/usr/bin/env python3
import httpx
import os
import asyncpg
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, CallbackQueryHandler

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
API_URL = os.getenv("API_URL", "https://replyflow-bot.onrender.com")
DATABASE_URL = os.getenv("DATABASE_URL")

if not TELEGRAM_BOT_TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN not set")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not set")

db_pool = None

async def get_db_pool():
    global db_pool
    if db_pool is None:
        db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)
        async with db_pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS bot_keys (
                    telegram_id BIGINT PRIMARY KEY,
                    api_key VARCHAR(255) NOT NULL,
                    lead_id VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        print("[BOT] Database ready")
    return db_pool

async def get_api_key(telegram_id: int) -> str:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT api_key FROM bot_keys WHERE telegram_id = $1", telegram_id)
        return row["api_key"] if row else None

async def get_lead_id(telegram_id: int) -> str:
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT lead_id FROM bot_keys WHERE telegram_id = $1", telegram_id)
        return row["lead_id"] if row else None

async def save_api_key(telegram_id: int, api_key: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO bot_keys (telegram_id, api_key, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (telegram_id) 
            DO UPDATE SET api_key = $2, updated_at = NOW()
        """, telegram_id, api_key)

async def save_lead_id(telegram_id: int, lead_id: str):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            UPDATE bot_keys SET lead_id = $2, updated_at = NOW()
            WHERE telegram_id = $1
        """, telegram_id, lead_id)

async def start(update: Update, context):
    await update.message.reply_text(
        "🤖 ReplyFlow AI Bot\n\n"
        "👋 Привет! Для начала работы нужно привязать API ключ.\n\n"
        "Отправь команду /setkey ТВОЙ_API_КЛЮЧ\n"
        "Ключ можно получить в профиле на сайте: Интеграции → Generate API Key"
    )

async def setkey(update: Update, context):
    args = context.args
    if not args:
        await update.message.reply_text("❌ Использование: /setkey ТВОЙ_API_КЛЮЧ")
        return
    api_key = args[0]
    telegram_id = update.effective_user.id
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{API_URL}/generate",
                json={"text": "test"},
                headers={"Authorization": f"Bearer {api_key}"}
            )
            if resp.status_code == 401:
                await update.message.reply_text("❌ Неверный API ключ")
                return
            if resp.status_code != 200:
                await update.message.reply_text(f"❌ Ошибка: {resp.status_code}")
                return
            await save_api_key(telegram_id, api_key)
            await update.message.reply_text("✅ API ключ сохранен! Теперь отправляй вопросы клиентов.")
    except Exception as e:
        await update.message.reply_text(f"❌ Ошибка: {str(e)[:200]}")

async def setlead(update: Update, context):
    args = context.args
    if not args:
        await update.message.reply_text("❌ Использование: /setlead ID_ЛИДА")
        return
    lead_id = args[0]
    telegram_id = update.effective_user.id
    if not lead_id.isdigit():
        await update.message.reply_text("❌ ID лида должен быть числом")
        return
    api_key = await get_api_key(telegram_id)
    if not api_key:
        await update.message.reply_text("❌ Сначала привяжи API ключ командой /setkey")
        return
    await save_lead_id(telegram_id, lead_id)
    await update.message.reply_text(f"✅ Lead ID {lead_id} сохранен!")

async def generate_response(update: Update, context):
    question = update.message.text
    telegram_id = update.effective_user.id
    api_key = await get_api_key(telegram_id)
    if not api_key:
        await update.message.reply_text("❌ Аккаунт не привязан! Используй /setkey")
        return
    lead_id = await get_lead_id(telegram_id)
    session_id = lead_id if lead_id else str(telegram_id)
    await update.message.chat.send_action(action="typing")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{API_URL}/generate",
                json={"text": question, "session_id": session_id},
                headers={"Authorization": f"Bearer {api_key}"}
            )
            if resp.status_code == 401:
                await update.message.reply_text("❌ API ключ недействителен! Выполни /setkey заново")
                return
            if resp.status_code != 200:
                await update.message.reply_text(f"❌ Ошибка: {resp.status_code}")
                return
            data = resp.json()
            best = data.get("best_response", "")
            others = data.get("other_responses", [])
            responses = [best] + others[:2]
            responses = [r for r in responses if r]
            if not responses:
                await update.message.reply_text("❌ Не удалось сгенерировать ответ")
                return
            keyboard = []
            for i, answer in enumerate(responses, 1):
                button_text = answer[:60] + "..." if len(answer) > 60 else answer
                keyboard.append([InlineKeyboardButton(f"📋 Вариант {i}", callback_data=f"ans_{i}")])
            context.user_data["responses"] = responses
            lead_info = f"\n\n📎 Отправлено в Bitrix24 лид {lead_id}" if lead_id else ""
            message_text = f"✉️ Вопрос:\n{question}\n\n🤖 Варианты ответов:\n\n"
            for i, ans in enumerate(responses, 1):
                message_text += f"{i}. {ans}\n\n"
            message_text += f"👇 Нажми на кнопку, чтобы скопировать ответ{lead_info}"
            await update.message.reply_text(message_text, reply_markup=InlineKeyboardMarkup(keyboard))
    except Exception as e:
        await update.message.reply_text(f"❌ Ошибка: {str(e)[:200]}")

async def button_callback(update: Update, context):
    query = update.callback_query
    await query.answer()
    responses = context.user_data.get("responses", [])
    if query.data.startswith("ans_"):
        idx = int(query.data.split("_")[1]) - 1
        if idx < len(responses):
            answer = responses[idx]
            await query.edit_message_text(f"✅ Скопируй ответ:\n\n{answer}")
            await query.message.reply_text(f"📋 Ответ:\n\n{answer}")
        else:
            await query.edit_message_text("❌ Ответ не найден")

async def help_command(update: Update, context):
    await update.message.reply_text(
        "📖 Команды:\n"
        "/setkey API_КЛЮЧ - привязать аккаунт\n"
        "/setlead ID_ЛИДА - привязать Bitrix24 лид\n"
        "/mylead - показать текущий лид\n"
        "/start - приветствие\n"
        "/help - эта справка"
    )

async def mylead(update: Update, context):
    telegram_id = update.effective_user.id
    lead_id = await get_lead_id(telegram_id)
    if lead_id:
        await update.message.reply_text(f"📋 Текущий Lead ID: {lead_id}")
    else:
        await update.message.reply_text("❌ Lead ID не привязан. Используй /setlead ID_ЛИДА")

async def myplan(update: Update, context):
    telegram_id = update.effective_user.id
    api_key = await get_api_key(telegram_id)
    if api_key:
        await update.message.reply_text("✅ API ключ действителен")
    else:
        await update.message.reply_text("❌ API ключ не привязан. Используй /setkey")

# ===== Глобальный объект приложения для Webhook =====
_bot_app = None

async def get_bot_app():
    global _bot_app
    if _bot_app is None:
        # Создаем приложение без встроенного Updater (для совместимости с Python 3.14)
        _bot_app = Application.builder().token(TELEGRAM_BOT_TOKEN).updater(None).build()
        _bot_app.add_handler(CommandHandler("start", start))
        _bot_app.add_handler(CommandHandler("help", help_command))
        _bot_app.add_handler(CommandHandler("setkey", setkey))
        _bot_app.add_handler(CommandHandler("setlead", setlead))
        _bot_app.add_handler(CommandHandler("mylead", mylead))
        _bot_app.add_handler(CommandHandler("myplan", myplan))
        _bot_app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, generate_response))
        _bot_app.add_handler(CallbackQueryHandler(button_callback))
        await _bot_app.initialize()
        
        # Устанавливаем webhook
        render_url = os.getenv("RENDER_EXTERNAL_URL")
        if render_url:
            webhook_url = f"{render_url}/webhook"
        else:
            base_url = os.getenv("API_URL", "https://replyflow-bot.onrender.com")
            webhook_url = f"{base_url}/webhook"
        
        await _bot_app.bot.set_webhook(webhook_url)
        print(f"[BOT] Webhook set to {webhook_url}")
        
    return _bot_app
