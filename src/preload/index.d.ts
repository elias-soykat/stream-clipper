import { ElectronAPI } from '@electron-toolkit/preload'

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

interface StreamClipperAPI {
  // Settings
  getSettings: () => Promise<RecordingSettings>
  updateSettings: (settings: Partial<RecordingSettings>) => Promise<RecordingSettings>

  // Recording
  startRecording: () => Promise<boolean>
  stopRecording: () => Promise<boolean>
  getRecordingStatus: () => Promise<boolean>
  saveClip: () => Promise<{ success: boolean; filename?: string; error?: string }>

  // Clips
  getClips: () => Promise<ClipInfo[]>
  openClipsFolder: () => Promise<void>
  deleteClip: (filename: string) => Promise<{ success: boolean; error?: string }>

  // FFmpeg
  checkFFmpeg: () => Promise<boolean>

  // Folder selection
  selectOutputFolder: () => Promise<string | null>

  // Window capture
  getAvailableWindows: () => Promise<Array<{ title: string; hwnd: string }>>

  // Hotkey management
  reregisterHotkey: () => Promise<boolean>
  getHotkeyStatus: () => Promise<boolean>

  // File operations
  openFile: (filePath: string) => Promise<{ success: boolean; error?: string }>

  // Event listeners
  onClipSaved: (callback: (filename: string) => void) => void
  onClipSaveError: (callback: (error: string) => void) => void
  removeAllListeners: (channel: string) => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: StreamClipperAPI
  }
}
