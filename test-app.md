# StreamClipper Testing Guide

## Current Status

✅ FFmpeg is properly set up and working
✅ TypeScript compilation successful
✅ Application builds successfully
✅ Improved circular buffer implementation with segment-based recording
✅ Enhanced hotkey functionality with better error handling
✅ Event-driven UI updates for hotkey-triggered clips

## Testing Steps

### 1. Basic Functionality Test

1. Open the application
2. Go to the "Recording" tab
3. Click "Start Recording" - should show recording status
4. Wait a few seconds for buffer to build up
5. Click "Save Clip Now" - should create a clip file
6. Go to "Clips" tab to see the saved clip

### 2. Hotkey Test

1. Start recording
2. Press `Ctrl+Shift+X` - should save a clip automatically
3. Check the "Clips" tab to see the new clip
4. Verify the clip contains the last 30 seconds of recording

### 3. Settings Test

1. Go to "Settings" tab
2. Change clip duration to 15s, 60s, or 120s
3. Test recording and saving clips with different durations
4. Change output folder location
5. Test audio settings (currently disabled for testing)

### 4. Error Handling Test

1. Try to save a clip without recording - should show error
2. Test with invalid settings
3. Verify error messages are displayed properly

## Expected Behavior

### Recording

- Continuous background recording using FFmpeg segments
- 10-second segments with circular buffer (2+ minutes total)
- Automatic cleanup of old buffer files
- Video-only recording (audio can be enabled later)

### Clip Saving

- Saves last X seconds based on settings
- Creates files with format: `clip-YYYYMMDD-HHMMSS.mp4`
- Saves to configured output folder
- Works both via hotkey and manual button

### UI Features

- Real-time recording status
- Settings configuration
- Clips list with file management
- Error handling and user feedback

## Known Limitations

- Audio recording is currently disabled for testing
- Window capture requires manual selection
- Some Windows-specific audio setup may be needed

## Next Steps

1. Test the application thoroughly
2. Enable audio recording once video is stable
3. Add more advanced window capture features
4. Create Windows installer
