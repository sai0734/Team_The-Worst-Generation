@echo off
chcp 65001 > nul

REM Node.js 24.15 이상이 필요합니다 (nvm-windows 등으로 미리 설치해두세요).
where node > nul 2>&1
if errorlevel 1 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    exit /b 1
)

REM Ollama에 parenting-qwen:8b가 이미 준비되어 있어야 합니다.
REM ai\ollama\setup-ollama.cmd 를 먼저 실행하세요.
where ollama > nul 2>&1
if errorlevel 1 (
    echo [오류] Ollama가 설치되어 있지 않습니다. ai\ollama\setup-ollama.cmd 를 먼저 실행하세요.
    exit /b 1
)

REM OpenClaw CLI 설치 (이미 설치되어 있으면 최신 버전으로 갱신)
call npm install -g openclaw@latest
if errorlevel 1 exit /b 1

REM 인증(모델 연결)은 스킵하고 Gateway/워크스페이스만 먼저 준비
REM 실제 인증은 아래 openclaw models set 에서 ollama로 연결합니다.
call openclaw onboard --auth-choice ollama --skip-health --skip-channels --non-interactive --accept-risk
if errorlevel 1 exit /b 1

REM 기본 모델을 프로젝트 커스텀 모델로 고정
call openclaw models set ollama/parenting-qwen:8b
if errorlevel 1 exit /b 1
