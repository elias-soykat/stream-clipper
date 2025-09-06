import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

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

// Custom APIs for renderer
const api = {
  // Settings
  getSettings: (): Promise<RecordingSettings> => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings: Partial<RecordingSettings>): Promise<RecordingSettings> =>
    ipcRenderer.invoke('update-settings', settings),

  // Recording
  startRecording: (): Promise<boolean> => ipcRenderer.invoke('start-recording'),
  stopRecording: (): Promise<boolean> => ipcRenderer.invoke('stop-recording'),
  getRecordingStatus: (): Promise<boolean> => ipcRenderer.invoke('get-recording-status'),
  saveClip: (): Promise<{ success: boolean; filename?: string; error?: string }> =>
    ipcRenderer.invoke('save-clip'),

  // Clips
  getClips: (): Promise<ClipInfo[]> => ipcRenderer.invoke('get-clips'),
  openClipsFolder: (): Promise<void> => ipcRenderer.invoke('open-clips-folder'),
  deleteClip: (filename: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('delete-clip', filename),

  // FFmpeg
  checkFFmpeg: (): Promise<boolean> => ipcRenderer.invoke('check-ffmpeg'),

  // Folder selection
  selectOutputFolder: (): Promise<string | null> => ipcRenderer.invoke('select-output-folder'),

  // Window capture
  getAvailableWindows: (): Promise<Array<{ title: string; hwnd: string }>> =>
    ipcRenderer.invoke('get-available-windows'),

  // Hotkey management
  reregisterHotkey: (): Promise<boolean> => ipcRenderer.invoke('reregister-hotkey'),
  getHotkeyStatus: (): Promise<boolean> => ipcRenderer.invoke('get-hotkey-status'),

  // File operations
  openFile: (filePath: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('open-file', filePath),

  // Event listeners
  onClipSaved: (callback: (filename: string) => void) => {
    ipcRenderer.on('clip-saved', (_, filename) => callback(filename))
  },
  onClipSaveError: (callback: (error: string) => void) => {
    ipcRenderer.on('clip-save-error', (_, error) => callback(error))
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
