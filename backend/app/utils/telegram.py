import os
import requests
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_ADMIN_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

def send_telegram_message_sync(message: str):
    """Синхронная отправка через requests"""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("[TELEGRAM] Token or chat_id not configured")
        return
    
    import ssl
    # Отключаем проверку SSL
    requests.packages.urllib3.disable_warnings()
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    data = {"chat_id": TELEGRAM_CHAT_ID, "text": message, "parse_mode": "HTML"}
    
    try:
        response = requests.post(url, json=data, verify=False)
        print(f"[TELEGRAM] Response: {response.status_code} - {response.text}")
        if response.status_code != 200:
            print(f"[TELEGRAM] Failed: {response.text}")
    except Exception as e:
        print(f"[TELEGRAM] Error: {e}")