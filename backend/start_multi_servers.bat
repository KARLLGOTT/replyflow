@echo off
echo Starting backend instances...

start "Backend 8001" cmd /c "uvicorn main:app --port 8001 --reload"
start "Backend 8002" cmd /c "uvicorn main:app --port 8002 --reload"
start "Backend 8003" cmd /c "uvicorn main:app --port 8003 --reload"

echo All backends started on ports 8001, 8002, 8003