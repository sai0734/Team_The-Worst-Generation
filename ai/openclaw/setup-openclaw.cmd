@echo off
setlocal EnableExtensions
chcp 65001 > nul

set "NODE_VERSION=24.15.0"
set "OPENCLAW_VERSION=2026.7.1-2"
set "SETUP_REVISION=5"
set "MODEL_NAME=parenting-qwen:8b"
set "TOOLS_ROOT=%LOCALAPPDATA%\BabyCare\openclaw"
set "NODE_ARCHIVE=node-v%NODE_VERSION%-win-x64"
set "NODE_HOME=%TOOLS_ROOT%\%NODE_ARCHIVE%"
set "NODE_ZIP=%TEMP%\%NODE_ARCHIVE%.zip"
set "NODE_URL=https://nodejs.org/dist/v%NODE_VERSION%/%NODE_ARCHIVE%.zip"
REM Keep the OpenClaw installation separate from npm's own dependencies.
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
    echo [error] Unsupported command: %~1
    goto help_error
)

REM Prepare a project-local portable Node installation.
REM Do not modify the system Node installation or the user PATH.
if not exist "%NODE_HOME%\node.exe" (
    echo [setup] Downloading the OpenClaw Node.js %NODE_VERSION% runtime...

    if not exist "%TOOLS_ROOT%" (
        mkdir "%TOOLS_ROOT%"
        if errorlevel 1 (
            echo [error] Failed to create the tools directory.
            exit /b 1
        )
    )

    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
        "$ErrorActionPreference='Stop';" ^
        "$ProgressPreference='SilentlyContinue';" ^
        "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12;" ^
        "Invoke-WebRequest -UseBasicParsing -Uri '%NODE_URL%' -OutFile '%NODE_ZIP%'"
    if errorlevel 1 (
        echo [error] Failed to download Node.js.
        exit /b 1
    )

    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
        "$ErrorActionPreference='Stop';" ^
        "Expand-Archive -LiteralPath '%NODE_ZIP%' -DestinationPath '%TOOLS_ROOT%' -Force"
    if errorlevel 1 (
        echo [error] Failed to extract Node.js.
        exit /b 1
    )

    del /q "%NODE_ZIP%" > nul 2>&1
)

set "PATH=%NODE_HOME%;%OPENCLAW_BIN%;%PATH%"

REM Find a newly installed Ollama without requiring a reboot.
if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" set "PATH=%LOCALAPPDATA%\Programs\Ollama;%PATH%"

call :load_env

for /f "delims=" %%V in ('node --version') do set "ACTIVE_NODE_VERSION=%%V"
echo [check] OpenClaw Node.js: %ACTIVE_NODE_VERSION%

set "OLLAMA_EXE="
if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" set "OLLAMA_EXE=%LOCALAPPDATA%\Programs\Ollama\ollama.exe"
if not defined OLLAMA_EXE for /f "delims=" %%O in ('where.exe ollama.exe 2^>nul') do if not defined OLLAMA_EXE set "OLLAMA_EXE=%%O"
if not defined OLLAMA_EXE (
    echo [error] Ollama is not installed.
    echo         Run ai\ollama\setup-ollama.cmd first.
    exit /b 1
)

REM Install OpenClaw into the project-local tools directory.
if not exist "%OPENCLAW_BIN%\openclaw.cmd" (
    echo [setup] Installing OpenClaw %OPENCLAW_VERSION%...
    call npm install --prefix "%OPENCLAW_CLI_DIR%" "openclaw@%OPENCLAW_VERSION%"
    if errorlevel 1 (
        echo [error] Failed to install OpenClaw.
        exit /b 1
    )
)

if /i "%~1"=="status" goto status
if /i "%~1"=="doctor" goto doctor
if /i "%~1"=="start-service" goto start_service
if /i "%~1"=="stop-service" goto stop_service
if /i "%~1"=="restart-service" goto restart_service

REM Repair incomplete configuration before launch or service installation.
if /i "%~1"=="launch" (
    call :is_configured
    if not errorlevel 1 goto launch
    echo [setup] Repairing missing or incomplete OpenClaw configuration.
)
if /i "%~1"=="install-service" (
    call :is_configured
    if not errorlevel 1 goto install_service
    echo [setup] Repairing OpenClaw configuration before service installation.
)

call "%OLLAMA_EXE%" show "%MODEL_NAME%" > nul 2>&1
if errorlevel 1 (
    echo [error] Ollama model is missing: %MODEL_NAME%
    echo         Run ai\ollama\setup-ollama.cmd first.
    exit /b 1
)

REM Invalid allow/alsoAllow combinations prevent all OpenClaw config commands.
REM Repair the message-dispatcher policy before invoking the CLI.
call :configure_message_dispatcher_tools optional
if errorlevel 1 exit /b 1

echo [setup] Connecting the OpenClaw Gateway to Ollama...
call openclaw onboard --auth-choice ollama --skip-health --skip-channels --non-interactive --accept-risk
if errorlevel 1 exit /b 1

call openclaw models set "ollama/%MODEL_NAME%"
if errorlevel 1 exit /b 1

call openclaw config set gateway.http.endpoints.chatCompletions.enabled true --strict-json
if errorlevel 1 exit /b 1

REM Use the project .env as the single source for Gateway authentication.
call :ensure_gateway_token
if errorlevel 1 exit /b 1
call openclaw config set gateway.auth.mode token
if errorlevel 1 exit /b 1
call openclaw config set gateway.auth.token "%OPENCLAW_GATEWAY_TOKEN%"
if errorlevel 1 exit /b 1
call openclaw config set gateway.bind loopback
if errorlevel 1 exit /b 1

if not exist "%PLUGIN_DIR%\package.json" (
    echo [error] Android SMS plugin not found.
    echo        %PLUGIN_DIR%
    exit /b 1
)

echo [setup] Building and validating the Android SMS plugin...
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

echo [setup] Configuring the message-only agent and loop detection...
if not exist "%WORKSPACE_SOURCE%\AGENTS.md" (
    echo [error] message-dispatcher workspace source not found.
    echo        %WORKSPACE_SOURCE%
    exit /b 1
)
if not exist "%WORKSPACE_TARGET%" (
    mkdir "%WORKSPACE_TARGET%"
)
xcopy "%WORKSPACE_SOURCE%\*" "%WORKSPACE_TARGET%\" /E /I /Y > nul
if errorlevel 1 (
    echo [error] Failed to copy the message-dispatcher workspace.
    exit /b 1
)
call openclaw agents add message-dispatcher --workspace "%WORKSPACE_TARGET%" --model "ollama/%MODEL_NAME%" --non-interactive
if errorlevel 1 (
    echo [check] Updating the existing message-dispatcher agent if present.
)
call openclaw config set gateway.mode local
if errorlevel 1 exit /b 1
call :configure_message_dispatcher_tools required
if errorlevel 1 exit /b 1
call openclaw config validate
if errorlevel 1 exit /b 1

> "%SETUP_MARKER%" echo OpenClaw %OPENCLAW_VERSION% setup revision %SETUP_REVISION%

echo [done] OpenClaw and Android SMS plugin setup completed.
echo [launch] openclaw\setup-openclaw.cmd launch
echo [status] openclaw\setup-openclaw.cmd status
echo [service] openclaw\setup-openclaw.cmd install-service
if /i "%REQUESTED_COMMAND%"=="launch" goto launch
if /i "%REQUESTED_COMMAND%"=="install-service" goto install_service
exit /b 0

:plugin_error
popd
echo [error] Android SMS plugin setup failed.
exit /b 1

:launch
call :ensure_gateway_token
if errorlevel 1 exit /b 1
call openclaw config set gateway.auth.mode token > nul
if errorlevel 1 exit /b 1
call openclaw config set gateway.auth.token "%OPENCLAW_GATEWAY_TOKEN%" > nul
if errorlevel 1 exit /b 1
if defined ANDROID_SMS_BRIDGE_URL (
    echo [check] SMS bridge: %ANDROID_SMS_BRIDGE_URL%
) else (
    echo [warning] ANDROID_SMS_BRIDGE_URL is missing; live SMS is unavailable.
)
echo [launch] OpenClaw Gateway: http://127.0.0.1:18789
call openclaw gateway run --port 18789 --bind loopback --auth token
exit /b %errorlevel%

:status
call openclaw gateway status --deep
exit /b %errorlevel%

:doctor
echo [doctor] Checking OpenClaw configuration and runtime dependencies.
call :ensure_gateway_token
if errorlevel 1 exit /b 1
call "%OLLAMA_EXE%" show "%MODEL_NAME%" > nul 2>&1
if errorlevel 1 (
    echo [error] Ollama model is missing: %MODEL_NAME%
    exit /b 1
)
call openclaw config validate
if errorlevel 1 exit /b 1
call :is_configured
if errorlevel 1 (
    echo [error] message-dispatcher or plugin configuration is incomplete.
    echo         Run setup-openclaw.cmd to repair it.
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
echo [service] Installing the OpenClaw Gateway Windows scheduled task.
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

:configure_message_dispatcher_tools
if not exist "%CONFIG_FILE%" (
    if /i "%~1"=="required" exit /b 1
    exit /b 0
)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ErrorActionPreference='Stop';" ^
    "$required = '%~1' -eq 'required';" ^
    "$path = '%CONFIG_FILE%';" ^
    "$config = Get-Content -LiteralPath $path -Raw | ConvertFrom-Json;" ^
    "$agent = $config.agents.list | Where-Object { $_.id -eq 'message-dispatcher' } | Select-Object -First 1;" ^
    "if (-not $agent) { if ($required) { throw 'message-dispatcher agent not found' } else { exit 0 } };" ^
    "if (-not $config.plugins) { $config | Add-Member -NotePropertyName plugins -NotePropertyValue ([pscustomobject]@{}) };" ^
    "$trustedPlugins = @(@($config.plugins.allow) + 'android-sms' | Select-Object -Unique);" ^
    "$config.plugins | Add-Member -NotePropertyName allow -NotePropertyValue $trustedPlugins -Force;" ^
    "if (-not $agent.tools) { $agent | Add-Member -NotePropertyName tools -NotePropertyValue ([pscustomobject]@{}) };" ^
    "if ($agent.tools.PSObject.Properties['allow']) { $agent.tools.PSObject.Properties.Remove('allow') };" ^
    "$agent.tools | Add-Member -NotePropertyName profile -NotePropertyValue 'minimal' -Force;" ^
    "$agent.tools | Add-Member -NotePropertyName alsoAllow -NotePropertyValue @('android_sms_send') -Force;" ^
    "$agent.tools | Add-Member -NotePropertyName deny -NotePropertyValue @('session_status') -Force;" ^
    "$agent.tools | Add-Member -NotePropertyName loopDetection -NotePropertyValue ([pscustomobject]@{ enabled = $true }) -Force;" ^
    "$config | ConvertTo-Json -Depth 32 | Set-Content -LiteralPath $path -Encoding UTF8"
exit /b %errorlevel%

:ensure_gateway_token
call :load_env
if defined OPENCLAW_GATEWAY_TOKEN (
    powershell -NoProfile -Command "if ('%OPENCLAW_GATEWAY_TOKEN%' -match '^[0-9a-fA-F]{64}$' -and '%OPENCLAW_GATEWAY_TOKEN%' -notmatch '^0+$') { exit 0 } else { exit 1 }"
    if not errorlevel 1 exit /b 0
    echo [warning] Replacing an invalid Gateway token.
    set "OPENCLAW_GATEWAY_TOKEN="
)
echo [setup] Generating a 64-character OpenClaw Gateway token for .env.
for /f "delims=" %%T in ('powershell -NoProfile -Command "$ErrorActionPreference='Stop'; $bytes = New-Object byte[] 32; $rng=[Security.Cryptography.RandomNumberGenerator]::Create(); try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }; -join ($bytes | ForEach-Object { $_.ToString('x2') })"') do set "OPENCLAW_GATEWAY_TOKEN=%%T"
if not defined OPENCLAW_GATEWAY_TOKEN (
    echo [error] Failed to generate the Gateway token.
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
    echo [error] Failed to save the Gateway token to .env.
    exit /b 1
)
echo [check] Saved the Gateway token to .env without printing it.
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
    "if ($agent.tools.PSObject.Properties['allow']) { exit 1 };" ^
    "if ($agent.tools.profile -ne 'minimal') { exit 1 };" ^
    "if (@($agent.tools.alsoAllow).Count -ne 1 -or -not ($agent.tools.alsoAllow -contains 'android_sms_send')) { exit 1 };" ^
    "if (@($agent.tools.deny).Count -ne 1 -or -not ($agent.tools.deny -contains 'session_status')) { exit 1 };" ^
    "if (-not $agent.tools.loopDetection.enabled) { exit 1 };" ^
    "if (-not (@($config.plugins.allow) -contains 'android-sms')) { exit 1 }"
exit /b %errorlevel%

:help
echo Usage:
echo   setup-openclaw.cmd          Initial setup and plugin configuration
echo   setup-openclaw.cmd launch   Run the OpenClaw Gateway
echo   setup-openclaw.cmd status   Check Gateway status
echo   setup-openclaw.cmd doctor   Diagnose config, model, and plugin state
echo   setup-openclaw.cmd install-service Install and start the Windows task
echo   setup-openclaw.cmd start-service   Start the Gateway service
echo   setup-openclaw.cmd stop-service    Stop the Gateway service
echo   setup-openclaw.cmd restart-service Restart the Gateway service
exit /b 0

:help_error
call :help
exit /b 1
