@echo off
setlocal
chcp 65001 > nul
cd /d "%~dp0"
python -u run-dev.py --stop
exit /b %errorlevel%
