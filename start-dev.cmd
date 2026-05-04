@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist "server\.env" (
  echo [Ошибка] Нет server\.env
  echo Скопируйте server\.env.example в server\.env или выполните: node scripts\setup-dev.js
  pause
  exit /b 1
)

echo Запуск API (порт 5000^)...
start "MindTrack API" cmd /k call "%~dp0server\run-api.cmd"

echo Ожидание сервера (5 с^)...
timeout /t 5 /nobreak >nul

echo Запуск веб-клиента (порт 3000^)...
start "MindTrack Web" cmd /k call "%~dp0client\run-web.cmd"

echo.
echo Откройте: http://127.0.0.1:3000
echo.
echo PowerShell блокирует npm? Используйте этот файл или команды: npm.cmd run dev
pause
