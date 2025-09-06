import { useState, useEffect } from 'react'
import { RecordingControls } from './components/RecordingControls'
import { SettingsPanel } from './components/SettingsPanel'
import { ClipsList } from './components/ClipsList'

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

export default function App(): React.JSX.Element {
  const [isRecording, setIsRecording] = useState(false)
  const [settings, setSettings] = useState<RecordingSettings>({
    captureSource: 'monitor',
    clipDuration: 30,
    includeSystemAudio: true,
    includeMicrophone: true,
    outputPath: ''
  })
  const [clips, setClips] = useState<ClipInfo[]>([])
  const [activeTab, setActiveTab] = useState<'recording' | 'settings' | 'clips'>('recording')

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsData, clipsData, recordingStatus] = await Promise.all([
          window.api.getSettings(),
          window.api.getClips(),
          window.api.getRecordingStatus()
        ])
        setSettings(settingsData)
        setClips(clipsData)
        setIsRecording(recordingStatus)
      } catch (error) {
        console.error('Failed to load initial data:', error)
      }
    }

    loadData()

    // Listen for hotkey events
    const handleClipSaved = (filename: string) => {
      console.log('Clip saved via hotkey:', filename)
      // Refresh clips list when a clip is saved via hotkey
      handleRefreshClips()
    }

    const handleClipSaveError = (error: string) => {
      console.error('Clip save error:', error)
      // You could show a toast notification here
    }

    // Register event listeners
    window.api.onClipSaved(handleClipSaved)
    window.api.onClipSaveError(handleClipSaveError)

    // Cleanup
    return () => {
      window.api.removeAllListeners('clip-saved')
      window.api.removeAllListeners('clip-save-error')
    }
  }, [])

  const handleSettingsUpdate = async (newSettings: Partial<RecordingSettings>) => {
    try {
      const updatedSettings = await window.api.updateSettings(newSettings)
      setSettings(updatedSettings)
    } catch (error) {
      console.error('Failed to update settings:', error)
    }
  }

  const handleStartRecording = async () => {
    try {
      const success = await window.api.startRecording()
      setIsRecording(success)
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }

  const handleStopRecording = async () => {
    try {
      const success = await window.api.stopRecording()
      setIsRecording(!success)
    } catch (error) {
      console.error('Failed to stop recording:', error)
    }
  }

  const handleSaveClip = async () => {
    try {
      const result = await window.api.saveClip()
      if (result.success) {
        // Refresh clips list
        const clipsData = await window.api.getClips()
        setClips(clipsData)
      } else {
        console.error('Failed to save clip:', result.error)
      }
    } catch (error) {
      console.error('Failed to save clip:', error)
    }
  }

  const handleRefreshClips = async () => {
    try {
      const clipsData = await window.api.getClips()
      setClips(clipsData)
    } catch (error) {
      console.error('Failed to refresh clips:', error)
    }
  }

  const handleDeleteClip = async (filename: string) => {
    try {
      const result = await window.api.deleteClip(filename)
      if (result.success) {
        // Refresh clips list
        const clipsData = await window.api.getClips()
        setClips(clipsData)
      } else {
        console.error('Failed to delete clip:', result.error)
      }
    } catch (error) {
      console.error('Failed to delete clip:', error)
    }
  }

  const handleOpenClipsFolder = async () => {
    try {
      await window.api.openClipsFolder()
    } catch (error) {
      console.error('Failed to open clips folder:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-center">StreamClipper</h1>
          <p className="text-sm text-gray-400 text-center mt-1">
            Press Ctrl+Shift+X to save a clip while recording
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'recording', label: 'Recording' },
            { id: 'settings', label: 'Settings' },
            { id: 'clips', label: 'Clips' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'recording' && (
          <RecordingControls
            isRecording={isRecording}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onSaveClip={handleSaveClip}
            settings={settings}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel settings={settings} onSettingsUpdate={handleSettingsUpdate} />
        )}

        {activeTab === 'clips' && (
          <ClipsList
            clips={clips}
            onRefresh={handleRefreshClips}
            onDeleteClip={handleDeleteClip}
            onOpenFolder={handleOpenClipsFolder}
          />
        )}
      </div>
    </div>
  )
}
