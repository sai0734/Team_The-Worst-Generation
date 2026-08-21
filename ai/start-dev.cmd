@echo off
setlocal
chcp 65001 > nul
cd /d "%~dp0"
python run-dev.py %*
exit /b %errorlevel%

