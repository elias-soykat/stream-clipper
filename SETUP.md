# StreamClipper - Quick Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup FFmpeg

Run the setup script:

```bash
# Windows
setup-ffmpeg.bat

# Or manually:
# 1. Download FFmpeg from https://ffmpeg.org/download.html
# 2. Extract and copy ffmpeg.exe to resources/ffmpeg/ffmpeg.exe
```

### 3. Start Development

```bash
pnpm dev
```

## 📦 Building for Production

### Windows Installer

```bash
pnpm build:win
```

### Portable Version

```bash
pnpm build:win-portable
```

## 🎯 Features Implemented

✅ **Core Functionality**

- Background recording with circular buffer
- Global hotkey (Ctrl+Shift+X) for clip saving
- Multiple clip durations (15s, 30s, 60s, 120s)
- Both monitor and window capture support

✅ **Audio Capture**

- System audio capture (Stereo Mix)
- Microphone capture
- Audio mixing for multiple sources

✅ **User Interface**

- Clean, modern React UI with TailwindCSS
- Settings panel for configuration
- Clips management with file operations
- Real-time recording status

✅ **Technical Features**

- TypeScript for type safety
- Electron with proper security (context isolation)
- FFmpeg integration for video/audio processing
- Windows-specific optimizations

## 🔧 Configuration

### Audio Setup (Windows)

1. Right-click speaker icon → "Open Sound settings"
2. Click "Sound Control Panel" → "Recording" tab
3. Right-click empty space → "Show Disabled Devices"
4. Enable "Stereo Mix" and set as default

### Hotkey Troubleshooting

- If hotkey doesn't work, try running as administrator
- Check if another app is using Ctrl+Shift+X
- Use the manual "Save Clip Now" button as backup

## 📁 Project Structure

```
StreamClipper/
├── src/
│   ├── main/           # Electron main process
│   ├── preload/        # Secure IPC bridge
│   └── renderer/       # React frontend
├── resources/
│   └── ffmpeg/         # FFmpeg binary (add manually)
├── Clips/              # Default output folder
└── dist/               # Build output
```

## 🐛 Troubleshooting

### FFmpeg Issues

- Ensure ffmpeg.exe is in resources/ffmpeg/
- Or install globally and add to PATH
- Run `ffmpeg -version` to test

### Audio Not Recording

- Enable Stereo Mix in Windows audio settings
- Check microphone permissions
- Try alternative audio capture methods

### Performance Issues

- Lower recording framerate
- Close unnecessary applications
- Ensure sufficient disk space

## 🚀 Next Steps

The application is now ready for use! Key features:

1. **Start Recording**: Click the green button
2. **Save Clips**: Press Ctrl+Shift+X while recording
3. **Configure**: Use the Settings tab
4. **Manage Clips**: Use the Clips tab

For development, run `pnpm dev` and start coding!

## 📝 Notes

- The app is optimized for Windows 10/11
- FFmpeg is required for video processing
- Global hotkeys work system-wide
- Clips are saved in MP4 format with timestamps

Happy streaming! 🎮
