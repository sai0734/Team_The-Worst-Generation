@echo off
setlocal EnableExtensions
chcp 65001 > nul

set "NODE_VERSION=24.15.0"
set "OPENCLAW_VERSION=2026.7.1-2"
set "MODEL_NAME=parenting-qwen:8b"
set "TOOLS_ROOT=%LOCALAPPDATA%\BabyCare\openclaw"
set "NODE_ARCHIVE=node-v%NODE_VERSION%-win-x64"
set "NODE_HOME=%TOOLS_ROOT%\%NODE_ARCHIVE%"
set "NODE_ZIP=%TEMP%\%NODE_ARCHIVE%.zip"
set "NODE_URL=https://nodejs.org/dist/v%NODE_VERSION%/%NODE_ARCHIVE%.zip"
set "OPENCLAW_CLI_DIR=%NODE_HOME%"
set "OPENCLAW_BIN=%OPENCLAW_CLI_DIR%\node_modules\.bin"
set "PLUGIN_DIR=%~dp0plugins\android-sms"

if /i "%~1"=="help" goto help
if not "%~1"=="" if /i not "%~1"=="launch" if /i not "%~1"=="status" (
    echo [오류] 지원하지 않는 명령입니다: %~1
    goto help_error
)

REM 프로젝트 전용 portable Node를 준비합니다.
REM 시스템 Node와 사용자 PATH는 변경하지 않습니다.
if not exist "%NODE_HOME%\node.exe" (
    echo [설치] OpenClaw 전용 Node.js %NODE_VERSION% 다운로드 중...

    if not exist "%TOOLS_ROOT%" (
        mkdir "%TOOLS_ROOT%"
        if errorlevel 1 (
            echo [오류] 도구 디렉터리를 만들지 못했습니다.
            exit /b 1
        )
    )

    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
        "$ErrorActionPreference='Stop';" ^
        "$ProgressPreference='SilentlyContinue';" ^
        "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12;" ^
        "Invoke-WebRequest -UseBasicParsing -Uri '%NODE_URL%' -OutFile '%NODE_ZIP%'"
    if errorlevel 1 (
        echo [오류] Node.js 다운로드에 실패했습니다.
        exit /b 1
    )

    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
        "$ErrorActionPreference='Stop';" ^
        "Expand-Archive -LiteralPath '%NODE_ZIP%' -DestinationPath '%TOOLS_ROOT%' -Force"
    if errorlevel 1 (
        echo [오류] Node.js 압축 해제에 실패했습니다.
        exit /b 1
    )

    del /q "%NODE_ZIP%" > nul 2>&1
)

set "PATH=%NODE_HOME%;%OPENCLAW_BIN%;%PATH%"

for /f "delims=" %%V in ('node --version') do set "ACTIVE_NODE_VERSION=%%V"
echo [확인] OpenClaw 전용 Node.js: %ACTIVE_NODE_VERSION%

where ollama > nul 2>&1
if errorlevel 1 (
    echo [오류] Ollama가 설치되어 있지 않습니다.
    echo        ai\ollama\setup-ollama.cmd 를 먼저 실행하세요.
    exit /b 1
)

REM OpenClaw도 프로젝트 전용 디렉터리에 설치합니다.
if not exist "%OPENCLAW_BIN%\openclaw.cmd" (
    echo [설치] OpenClaw %OPENCLAW_VERSION% 설치 중...
    call npm install --prefix "%OPENCLAW_CLI_DIR%" "openclaw@%OPENCLAW_VERSION%"
    if errorlevel 1 (
        echo [오류] OpenClaw 설치에 실패했습니다.
        exit /b 1
    )
)

if /i "%~1"=="launch" goto launch
if /i "%~1"=="status" goto status

call ollama show "%MODEL_NAME%" > nul 2>&1
if errorlevel 1 (
    echo [오류] Ollama에 %MODEL_NAME% 모델이 없습니다.
    echo        ai\ollama\setup-ollama.cmd 를 먼저 실행하세요.
    exit /b 1
)

echo [설정] OpenClaw Gateway와 Ollama 모델 연결 중...
call openclaw onboard --auth-choice ollama --skip-health --skip-channels --non-interactive --accept-risk
if errorlevel 1 exit /b 1

call openclaw models set "ollama/%MODEL_NAME%"
if errorlevel 1 exit /b 1

if not exist "%PLUGIN_DIR%\package.json" (
    echo [오류] Android SMS 플러그인을 찾을 수 없습니다.
    echo        %PLUGIN_DIR%
    exit /b 1
)

echo [설정] Android SMS 플러그인 빌드 및 검증 중...
pushd "%PLUGIN_DIR%"
call npm ci
if errorlevel 1 goto plugin_error

call npm run plugin:build
if errorlevel 1 goto plugin_error

call npm run plugin:validate
if errorlevel 1 goto plugin_error

call npm test
if errorlevel 1 goto plugin_error

call openclaw plugins install "%PLUGIN_DIR%" --force
if errorlevel 1 goto plugin_error
popd

echo [완료] OpenClaw와 Android SMS 플러그인 설정이 완료되었습니다.
echo [실행] openclaw\setup-openclaw.cmd launch
echo [상태] openclaw\setup-openclaw.cmd status
exit /b 0

:plugin_error
popd
echo [오류] Android SMS 플러그인 설정에 실패했습니다.
exit /b 1

:launch
call ollama launch openclaw --model "%MODEL_NAME%"
exit /b %errorlevel%

:status
call openclaw gateway status
exit /b %errorlevel%

:help
echo 사용법:
echo   setup-openclaw.cmd          최초 설치 및 플러그인 설정
echo   setup-openclaw.cmd launch   OpenClaw 실행
echo   setup-openclaw.cmd status   Gateway 상태 확인
exit /b 0

:help_error
call :help
exit /b 1
