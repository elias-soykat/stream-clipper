# FFmpeg for StreamClipper

This folder should contain the FFmpeg binary for Windows.

## Setup Instructions

1. Download FFmpeg for Windows from: https://www.gyan.dev/ffmpeg/builds/#release-builds
2. Download `ffmpeg-release-full.7z` this file
3. Extract the downloaded archive
4. Copy `ffmpeg.exe` from the `bin` folder to this directory
5. The final structure should be:
   ```
   resources/
   └── ffmpeg/
       └── ffmpeg.exe
   ```

## Alternative: System PATH

If you prefer to use FFmpeg from your system PATH:

1. Install FFmpeg globally on your system
2. Make sure `ffmpeg.exe` is accessible from the command line
3. The application will automatically detect it

## Verification

To verify FFmpeg is working:

1. Open Command Prompt
2. Navigate to this folder
3. Run: `ffmpeg.exe -version`
4. You should see version information

## Notes

- FFmpeg is required for video/audio capture and processing
- The application will show an error if FFmpeg is not found
- For development, you can place the binary here
- For production builds, FFmpeg will be bundled automatically
