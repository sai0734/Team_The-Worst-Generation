@echo off
chcp 65001 > nul

REM <- 주석표시 입니다.

where ollama > nul 2>&1
if errorlevel 1 (
    echo [오류] Ollama가 설치되어 있지 않습니다.
    exit /b 1
)

REM 기본 Qwen3 8B 모델 다운로드
ollama pull qwen3:8b
if errorlevel 1 exit /b 1

REM Modelfile을 적용한 프로젝트용 커스텀 모델 생성 또는 갱신
REM 설정이 갱신 될때마다 아래 명령어를 cmd에 실행하면 됩니다.
ollama create parenting-qwen:8b -f "%~dp0Modelfile"
if errorlevel 1 exit /b 1

