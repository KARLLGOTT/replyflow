@echo off
chcp 65001 > nul
title SmartReplay — запуск одним кликом

:: Запуск Python скрипта, который поднимает backend, frontend и браузер
python run_project.py

pause