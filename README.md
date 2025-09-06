# StreamClipper

A Windows desktop application for streamers to capture short clips from their streams. StreamClipper runs in the background and allows you to save the last X seconds of screen recording with a simple hotkey press.

## Features

- **Background Recording**: Continuous recording with circular buffer (no full session recording)
- **Global Hotkey**: Press `Ctrl+Shift+X` to save the last 30 seconds (configurable)
- **Flexible Duration**: Choose from 15s, 30s, 60s, or 120s clip durations
- **Multiple Sources**: Capture entire monitor or specific windows
- **Audio Support**: System audio and microphone capture (configurable)
- **Modern UI**: Clean, dark-themed interface built with React and TailwindCSS
- **File Management**: View, open, and delete saved clips
- **Windows Optimized**: Built specifically for Windows 10/11

## Quick Start

### Prerequisites

- Windows 10/11
- FFmpeg (included in the app)

### Installation

1. **Download the latest release** from the releases page
2. **Run the installer** or extract the portable version
3. **Launch StreamClipper**

### First Use

1. **Start Recording**: Click "Start Recording" in the app
2. **Save Clips**: Press `Ctrl+Shift+X` to save the last 30 seconds
3. **View Clips**: Switch to the "Clips" tab to see your saved clips
4. **Configure Settings**: Use the "Settings" tab to adjust recording options

## How It Works

### Circular Buffer Recording

- StreamClipper continuously records your screen in 10-second segments
- Maintains a rolling buffer of the last 2+ minutes
- When you press the hotkey, it extracts the last X seconds from the buffer
- Only saves the clips you want - no full session recording

### Recording Process

1. **Start Recording**: Begins continuous background recording
2. **Buffer Management**: Automatically manages disk space by cleaning old segments
3. **Clip Extraction**: When hotkey is pressed, extracts the last X seconds
4. **File Naming**: Saves as `clip-YYYYMMDD-HHMMSS.mp4`

## Configuration

### Recording Settings

- **Capture Source**: Monitor (full screen) or Window (specific window)
- **Clip Duration**: 15s, 30s, 60s, or 120s
- **Audio Sources**: System audio and/or microphone
- **Output Folder**: Choose where clips are saved

### Audio Setup (Windows)

For system audio capture to work:

1. Right-click the speaker icon in the system tray
2. Select "Open Sound settings"
3. Click "Sound Control Panel"
4. Go to the "Recording" tab
5. Right-click and select "Show Disabled Devices"
6. Enable "Stereo Mix" and set it as default

## Usage

### Basic Workflow

1. **Launch** StreamClipper
2. **Configure** your settings (optional)
3. **Start Recording** - the app will run in the background
4. **Stream normally** - recording happens automatically
5. **Press `Ctrl+Shift+X`** when you want to save a clip
6. **View clips** in the "Clips" tab

### Manual Clip Saving

- Use the "Save Clip Now" button in the app
- Works the same as the hotkey but manually triggered

### File Management

- **View Clips**: See all saved clips with file size and creation date
- **Open Files**: Double-click to open clips in your default video player
- **Delete Clips**: Remove unwanted clips to save disk space
- **Open Folder**: Access the clips folder directly

## Technical Details

### Built With

- **Electron**: Cross-platform desktop app framework
- **React**: Modern UI library
- **TypeScript**: Type-safe JavaScript
- **TailwindCSS**: Utility-first CSS framework
- **FFmpeg**: Video/audio processing
- **Node.js**: Backend runtime

### System Requirements

- Windows 10/11 (64-bit)
- 4GB RAM minimum
- 1GB free disk space
- DirectX 11 compatible graphics

### Performance

- **Low CPU Usage**: Optimized FFmpeg settings for minimal impact
- **Efficient Storage**: Only saves clips you want
- **Background Operation**: Runs silently without interfering with your stream

## Troubleshooting

### Common Issues

**FFmpeg Not Found**

- The app includes FFmpeg, but if you see this error, try running as administrator

**Hotkey Not Working**

- Make sure no other application is using `Ctrl+Shift+X`
- Try the "Re-register Hotkey" button in settings
- Some antivirus software may block global hotkeys

**No Audio in Clips**

- Check Windows audio settings
- Enable "Stereo Mix" in recording devices
- Verify audio settings in the app

**Recording Not Starting**

- Run as administrator if needed
- Check if another app is using the screen capture
- Verify FFmpeg is working

### Getting Help

- Check the console output for error messages
- Ensure all prerequisites are met
- Try running as administrator

## Development

### Building from Source

```bash
# Clone the repository
git clone <repository-url>
cd StreamClipper

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Create Windows installer
npm run build:win
```

### Project Structure

```
src/
├── main/           # Electron main process
├── renderer/       # React UI
├── preload/        # IPC bridge
└── resources/      # FFmpeg and assets
```

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Changelog

### v1.0.0

- Initial release
- Basic recording functionality
- Global hotkey support
- Modern UI
- Windows optimization
