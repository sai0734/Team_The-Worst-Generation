@echo off
setlocal EnableExtensions
chcp 65001 > nul

set "NODE_VERSION=24.15.0"
set "TOOLS_ROOT=%LOCALAPPDATA%\BabyCare\openclaw"
set "NODE_HOME=%TOOLS_ROOT%\node-v%NODE_VERSION%-win-x64"
set "OPENCLAW_CLI_DIR=%TOOLS_ROOT%\cli"
set "OPENCLAW_BIN=%OPENCLAW_CLI_DIR%\node_modules\.bin"
set "ROOT_ENV=%~dp0..\..\.env"

if not exist "%NODE_HOME%\node.exe" exit /b 1
if not exist "%OPENCLAW_BIN%\openclaw.cmd" exit /b 1

set "PATH=%NODE_HOME%;%OPENCLAW_BIN%;%PATH%"

if exist "%ROOT_ENV%" (
    for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%ROOT_ENV%") do (
        if /i "%%A"=="OPENCLAW_GATEWAY_TOKEN" set "OPENCLAW_GATEWAY_TOKEN=%%B"
        if /i "%%A"=="ANDROID_SMS_BRIDGE_URL" set "ANDROID_SMS_BRIDGE_URL=%%B"
        if /i "%%A"=="ANDROID_SMS_BRIDGE_KEY" set "ANDROID_SMS_BRIDGE_KEY=%%B"
    )
)

if not defined OPENCLAW_GATEWAY_TOKEN exit /b 1

REM Run the Gateway arguments passed by the OpenClaw Windows scheduled task.
call openclaw %*
exit /b %errorlevel%
