@echo off
echo StreamClipper - FFmpeg Setup
echo ============================
echo.

REM Check if resources/ffmpeg directory exists
if not exist "resources\ffmpeg" (
    echo Creating resources\ffmpeg directory...
    mkdir "resources\ffmpeg"
)

REM Check if ffmpeg.exe exists
if exist "resources\ffmpeg\ffmpeg.exe" (
    echo FFmpeg is already installed!
    echo Testing FFmpeg...
    "resources\ffmpeg\ffmpeg.exe" -version
    echo.
    echo Setup complete! You can now run the application.
    pause
    exit /b 0
)

echo FFmpeg not found in resources\ffmpeg\ffmpeg.exe
echo.
echo Please follow these steps:
echo.
echo 1. Download FFmpeg for Windows from: https://ffmpeg.org/download.html
echo 2. Extract the downloaded archive
echo 3. Copy ffmpeg.exe from the bin folder to resources\ffmpeg\ffmpeg.exe
echo 4. Run this script again to verify installation
echo.
echo Alternative: Install FFmpeg globally on your system and add it to PATH
echo.

REM Check if ffmpeg is available in PATH
ffmpeg -version >nul 2>&1
if %errorlevel% == 0 (
    echo FFmpeg found in system PATH! This should work.
    echo You can now run the application.
    pause
    exit /b 0
)

echo FFmpeg not found in system PATH either.
echo Please install FFmpeg and try again.
echo.
pause
