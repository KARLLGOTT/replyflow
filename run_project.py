import subprocess
import sys
import time
import webbrowser
import os
import signal
import shutil
import requests

BASE_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
BACKEND_MODULE = "main"
BACKEND_HOST = "127.0.0.1"
BACKEND_PORT = 8000
FRONTEND_URL = "http://localhost:3000"

def wait_for_server(url, timeout=60):
    start_time = time.time()
    while True:
        try:
            r = requests.get(url)
            if r.status_code in [200, 404]:
                break
        except:
            pass
        if time.time() - start_time > timeout:
            break
        time.sleep(1)

def wait_for_frontend(url=FRONTEND_URL, timeout=120):
    start_time = time.time()
    while True:
        try:
            r = requests.get(url)
            if r.status_code == 200:
                break
        except:
            pass
        if time.time() - start_time > timeout:
            break
        time.sleep(1)

# --- Backend ---
backend_venv = os.path.join(BACKEND_DIR, "venv")
if not os.path.exists(backend_venv):
    subprocess.run([sys.executable, "-m", "venv", backend_venv])

pip_exe = os.path.join(backend_venv, "Scripts", "pip.exe")
subprocess.run([pip_exe, "install", "--upgrade", "pip"])
requirements_file = os.path.join(BACKEND_DIR, "requirements.txt")
if os.path.exists(requirements_file):
    subprocess.run([pip_exe, "install", "-r", requirements_file])

python_exe = os.path.join(backend_venv, "Scripts", "python.exe")
backend_process = subprocess.Popen(
    [python_exe, "-m", "uvicorn", f"{BACKEND_MODULE}:app",
     "--host", BACKEND_HOST, "--port", str(BACKEND_PORT)],
    cwd=BACKEND_DIR
)

print("Ожидание backend...")
wait_for_server(f"http://{BACKEND_HOST}:{BACKEND_PORT}")

# --- Frontend ---
npm_exe = shutil.which("npm")
if npm_exe is None:
    print("npm не найден в PATH")
    sys.exit(1)

subprocess.run(f'"{npm_exe}" install', cwd=FRONTEND_DIR, shell=True)

# Запуск фронтенда с отключением автоматического браузера
env = os.environ.copy()
env["BROWSER"] = "none"
frontend_process = subprocess.Popen(f'"{npm_exe}" start', cwd=FRONTEND_DIR, shell=True, env=env)

print("Ожидание frontend...")
wait_for_frontend(FRONTEND_URL)

# Открытие браузера только один раз
webbrowser.open(FRONTEND_URL)

# --- Ожидание и завершение ---
try:
    print("SmartReplay запущен. Ctrl+C для остановки.")
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("Остановка процессов...")
    backend_process.send_signal(signal.SIGTERM)
    frontend_process.send_signal(signal.SIGTERM)
    print("Процессы остановлены.")