@echo off
echo StreamClipper Setup
echo ==================

echo.
echo Checking prerequisites...

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if pnpm is installed
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing pnpm...
    npm install -g pnpm
)

echo.
echo Installing dependencies...
pnpm install

echo.
echo Building application...
pnpm run build

echo.
echo Setup complete!
echo.
echo You can now run the application with:
echo   pnpm run dev     (for development)
echo   pnpm start       (for production)
echo.
echo Or run the built executable from:
echo   dist\win-unpacked\StreamClipper.exe
echo.
pause
