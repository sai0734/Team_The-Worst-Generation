@echo off
setlocal EnableExtensions
chcp 65001 > nul

set "NODE_VERSION=24.15.0"
set "OPENCLAW_VERSION=2026.7.1-2"
set "SETUP_REVISION=3"
set "MODEL_NAME=parenting-qwen:8b"
set "TOOLS_ROOT=%LOCALAPPDATA%\BabyCare\openclaw"
set "NODE_ARCHIVE=node-v%NODE_VERSION%-win-x64"
set "NODE_HOME=%TOOLS_ROOT%\%NODE_ARCHIVE%"
set "NODE_ZIP=%TEMP%\%NODE_ARCHIVE%.zip"
set "NODE_URL=https://nodejs.org/dist/v%NODE_VERSION%/%NODE_ARCHIVE%.zip"
REM npm 자체 의존성과 OpenClaw 의존성이 충돌하지 않도록 설치 위치를 분리합니다.
set "OPENCLAW_CLI_DIR=%TOOLS_ROOT%\cli"
set "OPENCLAW_BIN=%OPENCLAW_CLI_DIR%\node_modules\.bin"
set "PLUGIN_DIR=%~dp0plugins\android-sms"
set "WORKSPACE_SOURCE=%~dp0workspace-message-dispatcher"
set "WORKSPACE_TARGET=%USERPROFILE%\.openclaw\workspace-message-dispatcher"
set "CONFIG_FILE=%USERPROFILE%\.openclaw\openclaw.json"
set "SETUP_MARKER=%TOOLS_ROOT%\configured-%OPENCLAW_VERSION%-r%SETUP_REVISION%.ok"
set "ROOT_ENV=%~dp0..\..\.env"
set "REQUESTED_COMMAND=%~1"

if /i "%~1"=="help" goto help
if not "%~1"=="" if /i not "%~1"=="launch" if /i not "%~1"=="status" if /i not "%~1"=="doctor" if /i not "%~1"=="install-service" if /i not "%~1"=="start-service" if /i not "%~1"=="stop-service" if /i not "%~1"=="restart-service" (
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

REM Ollama 설치 직후 PATH가 현재 CMD에 반영되지 않은 경우도 재부팅 없이 찾습니다.
if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" set "PATH=%LOCALAPPDATA%\Programs\Ollama;%PATH%"

call :load_env

for /f "delims=" %%V in ('node --version') do set "ACTIVE_NODE_VERSION=%%V"
echo [확인] OpenClaw 전용 Node.js: %ACTIVE_NODE_VERSION%

set "OLLAMA_EXE="
if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" set "OLLAMA_EXE=%LOCALAPPDATA%\Programs\Ollama\ollama.exe"
if not defined OLLAMA_EXE for /f "delims=" %%O in ('where.exe ollama.exe 2^>nul') do if not defined OLLAMA_EXE set "OLLAMA_EXE=%%O"
if not defined OLLAMA_EXE (
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

if /i "%~1"=="status" goto status
if /i "%~1"=="doctor" goto doctor
if /i "%~1"=="start-service" goto start_service
if /i "%~1"=="stop-service" goto stop_service
if /i "%~1"=="restart-service" goto restart_service

REM 새 PC에서 launch/install-service를 바로 실행해도 불완전한 Gateway를 켜지 않습니다.
if /i "%~1"=="launch" (
    call :is_configured
    if not errorlevel 1 goto launch
    echo [설정] OpenClaw 초기 설정이 없거나 불완전하여 자동 복구합니다.
)
if /i "%~1"=="install-service" (
    call :is_configured
    if not errorlevel 1 goto install_service
    echo [설정] 서비스 설치 전에 OpenClaw 초기 설정을 자동 복구합니다.
)

call "%OLLAMA_EXE%" show "%MODEL_NAME%" > nul 2>&1
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

call openclaw config set gateway.http.endpoints.chatCompletions.enabled true --strict-json
if errorlevel 1 exit /b 1

REM 프로젝트 .env를 Gateway 인증의 단일 기준으로 사용합니다.
call :ensure_gateway_token
if errorlevel 1 exit /b 1
call openclaw config set gateway.auth.mode token
if errorlevel 1 exit /b 1
call openclaw config set gateway.auth.token "%OPENCLAW_GATEWAY_TOKEN%"
if errorlevel 1 exit /b 1
call openclaw config set gateway.bind loopback
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

echo [설정] 문자 전용 에이전트와 반복 호출 차단 설정 중...
if not exist "%WORKSPACE_SOURCE%\AGENTS.md" (
    echo [오류] message-dispatcher 워크스페이스 원본을 찾을 수 없습니다.
    echo        %WORKSPACE_SOURCE%
    exit /b 1
)
if not exist "%WORKSPACE_TARGET%" (
    mkdir "%WORKSPACE_TARGET%"
)
xcopy "%WORKSPACE_SOURCE%\*" "%WORKSPACE_TARGET%\" /E /I /Y > nul
if errorlevel 1 (
    echo [오류] message-dispatcher 워크스페이스 복사에 실패했습니다.
    exit /b 1
)
call openclaw agents add message-dispatcher --workspace "%WORKSPACE_TARGET%" --model "ollama/%MODEL_NAME%" --non-interactive
if errorlevel 1 (
    echo [확인] message-dispatcher 에이전트가 이미 있으면 기존 설정을 갱신합니다.
)
call openclaw config set gateway.mode local
if errorlevel 1 exit /b 1
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ErrorActionPreference='Stop';" ^
    "$path = Join-Path $env:USERPROFILE '.openclaw\openclaw.json';" ^
    "$config = Get-Content -LiteralPath $path -Raw | ConvertFrom-Json;" ^
    "$agent = $config.agents.list | Where-Object { $_.id -eq 'message-dispatcher' } | Select-Object -First 1;" ^
    "if (-not $agent) { throw 'message-dispatcher agent not found' };" ^
    "if (-not $agent.tools) { $agent | Add-Member -NotePropertyName tools -NotePropertyValue ([pscustomobject]@{}) };" ^
    "$agent.tools | Add-Member -NotePropertyName allow -NotePropertyValue @('android_sms_send') -Force;" ^
    "$agent.tools | Add-Member -NotePropertyName loopDetection -NotePropertyValue ([pscustomobject]@{ enabled = $true }) -Force;" ^
    "$config | ConvertTo-Json -Depth 32 | Set-Content -LiteralPath $path -Encoding UTF8"
if errorlevel 1 exit /b 1
call openclaw config validate
if errorlevel 1 exit /b 1

> "%SETUP_MARKER%" echo OpenClaw %OPENCLAW_VERSION% setup revision %SETUP_REVISION%

echo [완료] OpenClaw와 Android SMS 플러그인 설정이 완료되었습니다.
echo [실행] openclaw\setup-openclaw.cmd launch
echo [상태] openclaw\setup-openclaw.cmd status
echo [서비스] openclaw\setup-openclaw.cmd install-service
if /i "%REQUESTED_COMMAND%"=="launch" goto launch
if /i "%REQUESTED_COMMAND%"=="install-service" goto install_service
exit /b 0

:plugin_error
popd
echo [오류] Android SMS 플러그인 설정에 실패했습니다.
exit /b 1

:launch
call :ensure_gateway_token
if errorlevel 1 exit /b 1
call openclaw config set gateway.auth.mode token > nul
if errorlevel 1 exit /b 1
call openclaw config set gateway.auth.token "%OPENCLAW_GATEWAY_TOKEN%" > nul
if errorlevel 1 exit /b 1
if defined ANDROID_SMS_BRIDGE_URL (
    echo [확인] SMS 브리지: %ANDROID_SMS_BRIDGE_URL%
) else (
    echo [경고] ANDROID_SMS_BRIDGE_URL 이 없어 실제 문자를 발송할 수 없습니다.
)
echo [실행] OpenClaw Gateway: http://127.0.0.1:18789
call openclaw gateway run --port 18789 --bind loopback --auth token
exit /b %errorlevel%

:status
call openclaw gateway status --deep
exit /b %errorlevel%

:doctor
echo [진단] OpenClaw 설정과 실행 환경을 확인합니다.
call :ensure_gateway_token
if errorlevel 1 exit /b 1
call "%OLLAMA_EXE%" show "%MODEL_NAME%" > nul 2>&1
if errorlevel 1 (
    echo [오류] Ollama 모델이 없습니다: %MODEL_NAME%
    exit /b 1
)
call openclaw config validate
if errorlevel 1 exit /b 1
call :is_configured
if errorlevel 1 (
    echo [오류] message-dispatcher 또는 플러그인 설정이 불완전합니다.
    echo        setup-openclaw.cmd 를 실행해 복구하세요.
    exit /b 1
)
call openclaw plugins list
if errorlevel 1 exit /b 1
call openclaw gateway status --deep
exit /b %errorlevel%

:install_service
call :ensure_gateway_token
if errorlevel 1 exit /b 1
call openclaw config set gateway.auth.mode token > nul
if errorlevel 1 exit /b 1
call openclaw config set gateway.auth.token "%OPENCLAW_GATEWAY_TOKEN%" > nul
if errorlevel 1 exit /b 1
echo [서비스] Windows 예약 작업에 OpenClaw Gateway를 설치합니다.
call openclaw gateway install --force --port 18789 --wrapper "%~dp0gateway-service.cmd"
if errorlevel 1 exit /b 1
call openclaw gateway restart --force
if errorlevel 1 exit /b 1
call openclaw gateway status --deep
exit /b %errorlevel%

:start_service
call openclaw gateway start
exit /b %errorlevel%

:stop_service
call openclaw gateway stop
exit /b %errorlevel%

:restart_service
call openclaw gateway restart --force
exit /b %errorlevel%

:load_env
if not exist "%ROOT_ENV%" exit /b 0
for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%ROOT_ENV%") do (
    if /i "%%A"=="OPENCLAW_GATEWAY_TOKEN" set "OPENCLAW_GATEWAY_TOKEN=%%B"
    if /i "%%A"=="ANDROID_SMS_BRIDGE_URL" set "ANDROID_SMS_BRIDGE_URL=%%B"
    if /i "%%A"=="ANDROID_SMS_BRIDGE_KEY" set "ANDROID_SMS_BRIDGE_KEY=%%B"
)
exit /b 0

:ensure_gateway_token
call :load_env
if defined OPENCLAW_GATEWAY_TOKEN (
    powershell -NoProfile -Command "if ('%OPENCLAW_GATEWAY_TOKEN%' -match '^[0-9a-fA-F]{64}$' -and '%OPENCLAW_GATEWAY_TOKEN%' -notmatch '^0+$') { exit 0 } else { exit 1 }"
    if not errorlevel 1 exit /b 0
    echo [경고] 기존 Gateway 토큰이 올바른 64자리 난수가 아니어서 교체합니다.
    set "OPENCLAW_GATEWAY_TOKEN="
)
echo [설정] .env에 사용할 64자리 OpenClaw Gateway 토큰을 생성합니다.
for /f "delims=" %%T in ('powershell -NoProfile -Command "$ErrorActionPreference='Stop'; $bytes = New-Object byte[] 32; $rng=[Security.Cryptography.RandomNumberGenerator]::Create(); try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }; -join ($bytes | ForEach-Object { $_.ToString('x2') })"') do set "OPENCLAW_GATEWAY_TOKEN=%%T"
if not defined OPENCLAW_GATEWAY_TOKEN (
    echo [오류] Gateway 토큰 생성에 실패했습니다.
    exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ErrorActionPreference='Stop';" ^
    "$path='%ROOT_ENV%'; $key='OPENCLAW_GATEWAY_TOKEN'; $value='%OPENCLAW_GATEWAY_TOKEN%';" ^
    "$lines = if (Test-Path -LiteralPath $path) { @(Get-Content -LiteralPath $path) } else { @() };" ^
    "$found=$false; $next=@($lines | ForEach-Object { if ($_ -match '^\s*OPENCLAW_GATEWAY_TOKEN\s*=') { $found=$true; $key + '=' + $value } else { $_ } });" ^
    "if (-not $found) { $next += $key + '=' + $value };" ^
    "$next | Set-Content -LiteralPath $path -Encoding UTF8"
if errorlevel 1 (
    echo [오류] .env에 Gateway 토큰을 저장하지 못했습니다.
    exit /b 1
)
echo [확인] Gateway 토큰을 .env에 저장했습니다. 토큰 값은 출력하지 않습니다.
exit /b 0

:is_configured
if not exist "%SETUP_MARKER%" exit /b 1
if not exist "%CONFIG_FILE%" exit /b 1
if not exist "%WORKSPACE_TARGET%\AGENTS.md" exit /b 1
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ErrorActionPreference='Stop';" ^
    "$config=Get-Content -LiteralPath '%CONFIG_FILE%' -Raw | ConvertFrom-Json;" ^
    "$agent=$config.agents.list | Where-Object { $_.id -eq 'message-dispatcher' } | Select-Object -First 1;" ^
    "if ($config.gateway.auth.mode -ne 'token' -or $config.gateway.auth.token -ne '%OPENCLAW_GATEWAY_TOKEN%') { exit 1 };" ^
    "if (-not $agent) { exit 1 };" ^
    "if (-not ($agent.tools.allow -contains 'android_sms_send')) { exit 1 };" ^
    "if (-not $agent.tools.loopDetection.enabled) { exit 1 }"
exit /b %errorlevel%

:help
echo 사용법:
echo   setup-openclaw.cmd          최초 설치 및 플러그인 설정
echo   setup-openclaw.cmd launch   OpenClaw 실행
echo   setup-openclaw.cmd status   Gateway 상태 확인
echo   setup-openclaw.cmd doctor   설정, 모델, 플러그인 종합 진단
echo   setup-openclaw.cmd install-service Windows 예약 작업 설치 및 시작
echo   setup-openclaw.cmd start-service   Gateway 서비스 시작
echo   setup-openclaw.cmd stop-service    Gateway 서비스 중지
echo   setup-openclaw.cmd restart-service Gateway 서비스 재시작
exit /b 0

:help_error
call :help
exit /b 1
