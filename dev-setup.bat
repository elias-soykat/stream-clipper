@echo off
echo StreamClipper - Development Setup
echo =================================
echo.

REM Check if pnpm is installed
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo pnpm is not installed. Please install pnpm first.
    echo You can install it with: npm install -g pnpm
    pause
    exit /b 1
)

echo Installing dependencies...
pnpm install

echo.
echo Setting up FFmpeg...
call setup-ffmpeg.bat

echo.
echo Development setup complete!
echo.
echo Available commands:
echo   pnpm dev          - Start development server
echo   pnpm build        - Build the application
echo   pnpm build:win    - Build Windows installer
echo   pnpm start        - Start the built application
echo.
echo Run 'pnpm dev' to start developing!
pause
