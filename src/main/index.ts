import { app, shell, BrowserWindow, ipcMain, globalShortcut, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { promises as fs } from 'fs'
import { spawn, ChildProcess } from 'child_process'

// Types
interface RecordingSettings {
  captureSource: 'monitor' | 'window'
  clipDuration: number
  includeSystemAudio: boolean
  includeMicrophone: boolean
  outputPath: string
}

interface ClipInfo {
  filename: string
  path: string
  size: number
  createdAt: Date
}

// Global state
let isRecording = false
let recordingProcess: ChildProcess | null = null
let hotkeyRegistered = false
let settings: RecordingSettings = {
  captureSource: 'monitor',
  clipDuration: 30,
  includeSystemAudio: true,
  includeMicrophone: true,
  outputPath: join(process.cwd(), 'Clips')
}

// Ensure clips directory exists
const ensureClipsDirectory = async (): Promise<void> => {
  try {
    await fs.mkdir(settings.outputPath, { recursive: true })
  } catch (error) {
    console.error('Failed to create clips directory:', error)
  }
}

// Get FFmpeg path with fallbacks
const getFFmpegPath = (): string => {
  if (process.platform === 'win32') {
    // Try multiple possible paths
    const possiblePaths = [
      join(process.resourcesPath, 'ffmpeg', 'ffmpeg.exe'),
      join(process.cwd(), 'resources', 'ffmpeg', 'ffmpeg.exe'),
      join(__dirname, '..', '..', 'resources', 'ffmpeg', 'ffmpeg.exe'),
      'ffmpeg.exe' // System PATH
    ]

    // For development, prefer the local resources folder
    if (is.dev) {
      return join(process.cwd(), 'resources', 'ffmpeg', 'ffmpeg.exe')
    }

    return possiblePaths[0] // For production, use the bundled version
  }
  return 'ffmpeg'
}

// Check if FFmpeg is available
const checkFFmpeg = async (): Promise<boolean> => {
  const ffmpegPath = getFFmpegPath()
  console.log('Checking FFmpeg at:', ffmpegPath)

  try {
    const { spawn } = require('child_process')
    return new Promise((resolve) => {
      const process = spawn(ffmpegPath, ['-version'], { stdio: 'pipe' })

      process.stderr.on('data', (data) => {
        console.log('FFmpeg version check stderr:', data.toString())
      })

      process.stdout.on('data', (data) => {
        console.log('FFmpeg version check stdout:', data.toString())
      })

      process.on('error', (error) => {
        console.error('FFmpeg version check error:', error)
        resolve(false)
      })

      process.on('exit', (code) => {
        console.log('FFmpeg version check exit code:', code)
        resolve(code === 0)
      })
    })
  } catch (error) {
    console.error('FFmpeg check exception:', error)
    return false
  }
}

// Get available windows for capture (Windows only)
const getAvailableWindows = async (): Promise<Array<{ title: string; hwnd: string }>> => {
  if (process.platform !== 'win32') {
    return []
  }

  try {
    // This would require additional native modules or PowerShell integration
    // For now, return a placeholder that can be extended
    return [
      { title: 'Desktop', hwnd: 'desktop' },
      { title: 'Select Window...', hwnd: 'select' }
    ]
  } catch (error) {
    console.error('Error getting windows:', error)
    return []
  }
}

// Start continuous recording with circular buffer
const startRecording = async (): Promise<void> => {
  if (isRecording) return

  // Check if FFmpeg is available
  const ffmpegAvailable = await checkFFmpeg()
  if (!ffmpegAvailable) {
    throw new Error(
      'FFmpeg not found. Please install FFmpeg and place ffmpeg.exe in the resources/ffmpeg/ folder.'
    )
  }

  await ensureClipsDirectory()

  const ffmpegPath = getFFmpegPath()
  console.log('Starting recording with FFmpeg at:', ffmpegPath)

  // Build audio input arguments based on settings
  const audioInputs: string[] = []
  const audioFilters: string[] = []
  // let audioMapIndex = 1 // Will be used when audio is re-enabled

  // For now, let's start with video-only recording to test basic functionality
  // Audio can be added later once video recording is working
  console.log('Starting with video-only recording for testing...')

  // TODO: Re-enable audio once video recording is stable
  // if (settings.includeSystemAudio) {
  //   audioInputs.push('-f', 'dshow', '-i', 'audio="Stereo Mix"')
  //   audioFilters.push(`[${audioMapIndex}]`)
  //   audioMapIndex++
  // }

  // if (settings.includeMicrophone) {
  //   audioInputs.push('-f', 'dshow', '-i', 'audio="Microphone"')
  //   audioFilters.push(`[${audioMapIndex}]`)
  //   audioMapIndex++
  // }

  // Create filter complex for audio mixing if multiple sources
  let filterComplex = ''
  if (audioFilters.length > 1) {
    filterComplex = `[${audioFilters.join('][')}]amix=inputs=${audioFilters.length}[a]`
  } else if (audioFilters.length === 1) {
    filterComplex = `${audioFilters[0]}acopy[a]`
  }

  // Build video input arguments based on capture source
  const videoInput =
    settings.captureSource === 'monitor'
      ? ['-f', 'gdigrab', '-framerate', '30', '-i', 'desktop']
      : ['-f', 'gdigrab', '-framerate', '30', '-i', 'desktop', '-show_region', '1']

  // Use segment muxer for circular buffer - keeps last 2 minutes of video
  const maxDuration = Math.max(settings.clipDuration * 4, 120) // At least 2 minutes buffer
  const args = [
    ...videoInput,
    ...audioInputs,
    ...(filterComplex ? ['-filter_complex', filterComplex] : []),
    '-map',
    '0:v',
    ...(audioFilters.length > 0 ? ['-map', '[a]'] : []),
    '-c:v',
    'libx264',
    '-preset',
    'ultrafast',
    '-crf',
    '23',
    ...(audioFilters.length > 0 ? ['-c:a', 'aac', '-b:a', '128k'] : []),
    '-f',
    'segment',
    '-segment_time',
    '10', // 10 second segments
    '-segment_wrap',
    Math.ceil(maxDuration / 10).toString(), // Wrap after maxDuration seconds
    '-reset_timestamps',
    '1',
    '-strftime',
    '1',
    '-y',
    join(settings.outputPath, 'buffer_%Y%m%d_%H%M%S.mp4')
  ]

  console.log('FFmpeg command:', ffmpegPath, args.join(' '))

  recordingProcess = spawn(ffmpegPath, args, { stdio: 'pipe' })

  // Set recording flag after successful spawn
  isRecording = true

  // Log FFmpeg output for debugging
  recordingProcess.stderr?.on('data', (data) => {
    console.log('FFmpeg stderr:', data.toString())
  })

  recordingProcess.stdout?.on('data', (data) => {
    console.log('FFmpeg stdout:', data.toString())
  })

  recordingProcess.on('error', (error) => {
    console.error('Recording error:', error)
    isRecording = false
    throw new Error(`Failed to start recording: ${error.message}`)
  })

  recordingProcess.on('exit', (code) => {
    console.log('Recording process exited with code:', code)
    isRecording = false
    if (code !== 0) {
      console.error('Recording process failed with exit code:', code)
    }
  })

  // Add a small delay to ensure the process starts
  setTimeout(() => {
    if (recordingProcess && recordingProcess.killed) {
      console.error('Recording process failed to start')
      isRecording = false
    }
  }, 1000)
}

// Stop recording
const stopRecording = (): void => {
  if (recordingProcess) {
    recordingProcess.kill('SIGTERM')
    recordingProcess = null
  }
  isRecording = false
}

// Save clip from circular buffer
const saveClip = async (): Promise<string> => {
  if (!isRecording) {
    throw new Error('Recording is not active. Please start recording first.')
  }

  const timestamp = new Date()
  const filename = `clip-${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, '0')}${String(timestamp.getDate()).padStart(2, '0')}-${String(timestamp.getHours()).padStart(2, '0')}${String(timestamp.getMinutes()).padStart(2, '0')}${String(timestamp.getSeconds()).padStart(2, '0')}.mp4`
  const outputPath = join(settings.outputPath, filename)

  // Find the most recent buffer files
  const bufferFiles = await getBufferFiles()
  if (bufferFiles.length === 0) {
    throw new Error('No recording data available')
  }

  const ffmpegPath = getFFmpegPath()

  return new Promise((resolve, reject) => {
    // Create a concat file for all buffer segments
    const concatFile = join(settings.outputPath, 'temp_concat.txt')
    const concatContent = bufferFiles.map((file) => `file '${file}'`).join('\n')

    fs.writeFile(concatFile, concatContent)
      .then(() => {
        // First, get the total duration of all segments
        const probeProcess = spawn(
          ffmpegPath,
          ['-f', 'concat', '-safe', '0', '-i', concatFile, '-f', 'null', '-'],
          { stdio: 'pipe' }
        )

        let duration = 0
        let stderr = ''

        probeProcess.stderr.on('data', (data) => {
          stderr += data.toString()
        })

        probeProcess.on('exit', () => {
          // Extract duration from stderr output
          const durationMatch = stderr.match(/Duration: (\d+):(\d+):(\d+\.\d+)/)
          if (durationMatch) {
            const hours = parseInt(durationMatch[1])
            const minutes = parseInt(durationMatch[2])
            const seconds = parseFloat(durationMatch[3])
            duration = hours * 3600 + minutes * 60 + seconds
          }

          // Calculate start time for the last X seconds
          const startTime = Math.max(0, duration - settings.clipDuration)

          // Extract the clip
          const extractProcess = spawn(
            ffmpegPath,
            [
              '-f',
              'concat',
              '-safe',
              '0',
              '-i',
              concatFile,
              '-ss',
              startTime.toString(),
              '-t',
              settings.clipDuration.toString(),
              '-c',
              'copy',
              '-avoid_negative_ts',
              'make_zero',
              '-y',
              outputPath
            ],
            { stdio: 'pipe' }
          )

          extractProcess.on('error', (error) => {
            console.error('Clip extraction error:', error)
            reject(error)
          })

          extractProcess.on('exit', (code) => {
            // Clean up concat file
            fs.unlink(concatFile).catch(() => {})

            if (code === 0) {
              console.log('Clip saved:', filename)
              resolve(filename)
            } else {
              reject(new Error(`FFmpeg extraction exited with code ${code}`))
            }
          })
        })

        probeProcess.on('error', (error) => {
          console.error('Duration probe error:', error)
          reject(error)
        })
      })
      .catch(reject)
  })
}

// Get buffer files (most recent segments)
const getBufferFiles = async (): Promise<string[]> => {
  try {
    const files = await fs.readdir(settings.outputPath)
    const bufferFiles = files
      .filter((file) => file.startsWith('buffer_') && file.endsWith('.mp4'))
      .map((file) => join(settings.outputPath, file))
      .sort()

    return bufferFiles
  } catch (error) {
    console.error('Error getting buffer files:', error)
    return []
  }
}

// Get list of saved clips
const getClipsList = async (): Promise<ClipInfo[]> => {
  try {
    const files = await fs.readdir(settings.outputPath)
    const clips: ClipInfo[] = []

    for (const file of files) {
      // Only include actual clips, not buffer files or temp files
      if (file.startsWith('clip-') && file.endsWith('.mp4') && !file.includes('temp_')) {
        const filePath = join(settings.outputPath, file)
        const stats = await fs.stat(filePath)
        clips.push({
          filename: file,
          path: filePath,
          size: stats.size,
          createdAt: stats.birthtime
        })
      }
    }

    return clips.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } catch (error) {
    console.error('Error getting clips list:', error)
    return []
  }
}

// Setup global hotkey
const setupHotkey = (): void => {
  // Only register if not already registered
  if (hotkeyRegistered) {
    console.log('Hotkey already registered, skipping...')
    return
  }

  console.log('Setting up global hotkey...')

  // Unregister any existing shortcuts first
  globalShortcut.unregister('CommandOrControl+Shift+X')
  globalShortcut.unregister('Ctrl+Shift+X')

  // Try multiple hotkey combinations for better Windows compatibility
  const hotkeyCombinations = [
    'CommandOrControl+Shift+X',
    'Ctrl+Shift+X',
    'CommandOrControl+Shift+KeyX'
  ]

  let registered = false
  for (const hotkey of hotkeyCombinations) {
    try {
      const ret = globalShortcut.register(hotkey, async () => {
        console.log('Hotkey pressed - saving clip')
        try {
          const filename = await saveClip()
          console.log('Clip saved successfully:', filename)
          // Notify renderer of successful save
          if (mainWindow) {
            mainWindow.webContents.send('clip-saved', filename)
          }
        } catch (error) {
          console.error('Failed to save clip:', error)
          // Show notification to user if possible
          if (mainWindow) {
            mainWindow.webContents.send(
              'clip-save-error',
              error instanceof Error ? error.message : 'Unknown error'
            )
          }
        }
      })

      if (ret) {
        console.log(`Global hotkey ${hotkey} registered successfully`)
        hotkeyRegistered = true
        registered = true
        break
      }
    } catch (error) {
      console.log(`Failed to register hotkey ${hotkey}:`, error)
    }
  }

  if (!registered) {
    console.log('All hotkey registrations failed - hotkey may already be in use')
    console.log('You can still use the manual "Save Clip Now" button in the app')
  }
}

let mainWindow: BrowserWindow

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Note: Hotkey registration is handled once during app startup

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// IPC Handlers
const setupIpcHandlers = (): void => {
  // Get current settings
  ipcMain.handle('get-settings', () => settings)

  // Update settings
  ipcMain.handle('update-settings', (_, newSettings: Partial<RecordingSettings>) => {
    settings = { ...settings, ...newSettings }
    return settings
  })

  // Start/stop recording
  ipcMain.handle('start-recording', async () => {
    await startRecording()
    return isRecording
  })

  ipcMain.handle('stop-recording', () => {
    stopRecording()
    return !isRecording
  })

  // Get recording status
  ipcMain.handle('get-recording-status', () => isRecording)

  // Save clip manually
  ipcMain.handle('save-clip', async () => {
    try {
      const filename = await saveClip()
      return { success: true, filename }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Get clips list
  ipcMain.handle('get-clips', async () => {
    return await getClipsList()
  })

  // Open clips folder
  ipcMain.handle('open-clips-folder', async () => {
    await shell.openPath(settings.outputPath)
  })

  // Delete clip
  ipcMain.handle('delete-clip', async (_, filename: string) => {
    try {
      const filePath = join(settings.outputPath, filename)
      await fs.unlink(filePath)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Check FFmpeg availability
  ipcMain.handle('check-ffmpeg', async () => {
    return await checkFFmpeg()
  })

  // Select output folder
  ipcMain.handle('select-output-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Clips Output Folder',
      defaultPath: settings.outputPath
    })

    if (!result.canceled && result.filePaths.length > 0) {
      const newPath = result.filePaths[0]
      settings.outputPath = newPath
      await ensureClipsDirectory()
      return newPath
    }

    return null
  })

  // Get available windows for capture
  ipcMain.handle('get-available-windows', async () => {
    return await getAvailableWindows()
  })

  // Re-register hotkey
  ipcMain.handle('reregister-hotkey', () => {
    hotkeyRegistered = false
    setupHotkey()
    return hotkeyRegistered
  })

  // Get hotkey status
  ipcMain.handle('get-hotkey-status', () => {
    return hotkeyRegistered
  })

  // Open file in default application
  ipcMain.handle('open-file', async (_, filePath: string) => {
    try {
      await shell.openPath(filePath)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.streamclipper.app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Setup IPC handlers
  setupIpcHandlers()

  // Ensure clips directory exists
  await ensureClipsDirectory()

  createWindow()

  // Setup global hotkey after window is created
  // Delay hotkey setup to ensure window is fully ready
  setTimeout(() => {
    setupHotkey()
  }, 1000)

  // Setup periodic cleanup of buffer files
  setInterval(() => {
    cleanupBufferFiles().catch(console.error)
  }, 30000) // Clean up every 30 seconds

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Cleanup old buffer files
const cleanupBufferFiles = async (): Promise<void> => {
  try {
    const files = await fs.readdir(settings.outputPath)
    const bufferFiles = files.filter((file) => file.startsWith('buffer_') && file.endsWith('.mp4'))

    // Keep only the most recent buffer files (last 2 minutes worth)
    const maxBufferFiles = Math.ceil(120 / 10) // 2 minutes / 10 seconds per file
    if (bufferFiles.length > maxBufferFiles) {
      const filesToDelete = bufferFiles.sort().slice(0, bufferFiles.length - maxBufferFiles)

      for (const file of filesToDelete) {
        try {
          await fs.unlink(join(settings.outputPath, file))
          console.log('Cleaned up old buffer file:', file)
        } catch (error) {
          console.error('Failed to delete buffer file:', file, error)
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up buffer files:', error)
  }
}

// Cleanup on app quit
app.on('before-quit', () => {
  stopRecording()
  globalShortcut.unregisterAll()
  hotkeyRegistered = false
  // Clean up buffer files
  cleanupBufferFiles().catch(console.error)
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
