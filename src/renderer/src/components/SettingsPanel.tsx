import { useState, useEffect } from 'react'

interface RecordingSettings {
  captureSource: 'monitor' | 'window'
  clipDuration: number
  includeSystemAudio: boolean
  includeMicrophone: boolean
  outputPath: string
}

interface SettingsPanelProps {
  settings: RecordingSettings
  onSettingsUpdate: (settings: Partial<RecordingSettings>) => void
}

export const SettingsPanel = ({
  settings,
  onSettingsUpdate
}: SettingsPanelProps): React.JSX.Element => {
  const [localSettings, setLocalSettings] = useState<RecordingSettings>(settings)
  const [availableWindows, setAvailableWindows] = useState<Array<{ title: string; hwnd: string }>>(
    []
  )

  const handleSettingChange = (key: keyof RecordingSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value }
    setLocalSettings(newSettings)
    onSettingsUpdate({ [key]: value })
  }

  const handleOutputPathChange = async () => {
    try {
      const newPath = await window.api.selectOutputFolder()
      if (newPath) {
        handleSettingChange('outputPath', newPath)
      }
    } catch (error) {
      console.error('Failed to select output folder:', error)
    }
  }

  // Load available windows on mount
  useEffect(() => {
    const loadWindows = async () => {
      try {
        const windows = await window.api.getAvailableWindows()
        setAvailableWindows(windows)
      } catch (error) {
        console.error('Failed to load available windows:', error)
      }
    }
    loadWindows()
  }, [])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-6">Recording Settings</h2>

        <div className="space-y-6">
          {/* Capture Source */}
          <div>
            <label className="block text-sm font-medium mb-3">Capture Source</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="captureSource"
                  value="monitor"
                  checked={localSettings.captureSource === 'monitor'}
                  onChange={(e) => handleSettingChange('captureSource', e.target.value)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium">Monitor</div>
                  <div className="text-sm text-gray-400">Capture entire screen</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="captureSource"
                  value="window"
                  checked={localSettings.captureSource === 'window'}
                  onChange={(e) => handleSettingChange('captureSource', e.target.value)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium">Window</div>
                  <div className="text-sm text-gray-400">Capture specific window</div>
                </div>
              </label>
            </div>

            {/* Window Selection (when window capture is selected) */}
            {localSettings.captureSource === 'window' && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Select Window</label>
                <select
                  value="desktop"
                  onChange={(e) => {
                    // For now, just show available windows
                    console.log('Selected window:', e.target.value)
                  }}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {availableWindows.map((window) => (
                    <option key={window.hwnd} value={window.hwnd}>
                      {window.title}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Note: Window capture requires manual selection during recording
                </p>
              </div>
            )}
          </div>

          {/* Clip Duration */}
          <div>
            <label className="block text-sm font-medium mb-3">Clip Duration (seconds)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[15, 30, 60, 120].map((duration) => (
                <button
                  key={duration}
                  onClick={() => handleSettingChange('clipDuration', duration)}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                    localSettings.clipDuration === duration
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {duration}s
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-2">
              How many seconds to capture when saving a clip
            </p>
          </div>

          {/* Audio Settings */}
          <div>
            <label className="block text-sm font-medium mb-3">Audio Sources</label>
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.includeSystemAudio}
                  onChange={(e) => handleSettingChange('includeSystemAudio', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium">System Audio</div>
                  <div className="text-sm text-gray-400">Capture audio from your computer</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.includeMicrophone}
                  onChange={(e) => handleSettingChange('includeMicrophone', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium">Microphone</div>
                  <div className="text-sm text-gray-400">Capture audio from your microphone</div>
                </div>
              </label>
            </div>
          </div>

          {/* Output Path */}
          <div>
            <label className="block text-sm font-medium mb-3">Output Folder</label>
            <div className="flex space-x-3">
              <input
                type="text"
                value={localSettings.outputPath}
                readOnly
                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-sm"
              />
              <button
                onClick={handleOutputPathChange}
                className="px-4 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium transition-colors"
              >
                Browse
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-2">Where your clips will be saved</p>
          </div>
        </div>
      </div>

      {/* Audio Device Info */}
      <div className="mt-6 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-yellow-400">Audio Setup Note</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <p>For system audio capture to work on Windows, you may need to:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Enable "Stereo Mix" in Windows Sound settings</li>
            <li>Set "Stereo Mix" as the default recording device</li>
            <li>Ensure your audio drivers support loopback recording</li>
          </ul>
          <p className="mt-3">
            <strong>Tip:</strong> If system audio doesn't work, try using OBS Virtual Camera or
            similar tools.
          </p>
        </div>
      </div>
    </div>
  )
}
