import logging
import os
from datetime import datetime
from logging.handlers import RotatingFileHandler

# Создаём папку для логов относительно корня проекта
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
log_dir = os.path.join(BASE_DIR, "logs")

if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# Настройка форматирования
log_format = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Файл для всех логов
file_handler = RotatingFileHandler(
    f"{log_dir}/app.log",
    maxBytes=10_485_760,  # 10 MB
    backupCount=5,
    encoding='utf-8'
)
file_handler.setFormatter(log_format)
file_handler.setLevel(logging.INFO)

# Файл только для ошибок
error_handler = RotatingFileHandler(
    f"{log_dir}/errors.log",
    maxBytes=10_485_760,  # 10 MB
    backupCount=5,
    encoding='utf-8'
)
error_handler.setFormatter(log_format)
error_handler.setLevel(logging.ERROR)

# Настройка корневого логгера
logger = logging.getLogger("replyflow")
logger.setLevel(logging.DEBUG)
logger.addHandler(file_handler)
logger.addHandler(error_handler)

# Логгер для ошибок в консоль
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_format)
console_handler.setLevel(logging.INFO)
logger.addHandler(console_handler)

def log_error(error_msg: str, context: dict = None):
    """Записать ошибку в лог"""
    if context:
        logger.error(f"{error_msg} | Context: {context}")
    else:
        logger.error(error_msg)

def log_info(info_msg: str):
    """Записать информационное сообщение"""
    logger.info(info_msg)

def log_warning(warning_msg: str):
    """Записать предупреждение"""
    logger.warning(warning_msg)