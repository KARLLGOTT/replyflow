FROM python:3.11-slim

WORKDIR /app

# Устанавливаем нужные библиотеки в контейнере
RUN apt-get update && apt-get install -y libpq-dev gcc

RUN pip install --no-cache-dir --force-reinstall psycopg2-binary==2.9.9

# Копируем список зависимостей
COPY backend/requirements.txt .

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь код бэкенда
COPY backend/ .

# Запускаем приложение
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
