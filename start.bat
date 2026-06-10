@echo off
chcp 65001 >nul
title 凯撒密码教学系统

echo.
echo ╔══════════════════════════════════════╗
echo ║      🔐 凯撒密码教学系统 v1.0         ║
echo ╚══════════════════════════════════════╝
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [错误] 未找到 Node.js，请先安装：https://nodejs.org
    pause
    exit /b 1
)

:: Check if built
if not exist "dist\" (
    echo [提示] 首次运行，正在构建前端...
    call npm run build
    if %ERRORLEVEL% neq 0 (
        echo [错误] 构建失败
        pause
        exit /b 1
    )
)

:: Check node_modules
if not exist "node_modules\" (
    echo [提示] 正在安装依赖...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [错误] 安装失败
        pause
        exit /b 1
    )
)

echo.
echo ╔══════════════════════════════════════╗
echo ║  选择启动模式：                       ║
echo ║  [1] 学生端                          ║
echo ║  [2] 教师端                          ║
echo ║  [3] 管理端                          ║
echo ║  [4] 全部（从学生端进入）              ║
echo ╚══════════════════════════════════════╝
echo.
set /p choice="请输入选项 (1-4): "

if "%choice%"=="1" set ARG=student & goto start
if "%choice%"=="2" set ARG=teacher & goto start
if "%choice%"=="3" set ARG=admin & goto start
if "%choice%"=="4" set ARG=student & goto start
set ARG=student

:start
echo.
echo 正在启动服务器...
echo.
echo ┌──────────────────────────────────────┐
echo │  📱 学生端:  http://localhost:3001/#/student  │
echo │  👨‍🏫 教师端:  http://localhost:3001/#/teacher  │
echo │  ⚙️  管理端:  http://localhost:3001/#/admin   │
echo └──────────────────────────────────────┘
echo.
echo 浏览器将自动打开。按 Ctrl+C 停止服务器。
echo ──────────────────────────────────────
echo.

call npx tsx server/index.ts
pause
