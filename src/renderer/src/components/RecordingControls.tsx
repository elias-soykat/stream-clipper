import { useEffect, useState } from 'react'

interface RecordingSettings {
  captureSource: 'monitor' | 'window'
  clipDuration: number
  includeSystemAudio: boolean
  includeMicrophone: boolean
  outputPath: string
}

interface RecordingControlsProps {
  isRecording: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  onSaveClip: () => void
  settings: RecordingSettings
}

export const RecordingControls = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  onSaveClip,
  settings
}: RecordingControlsProps): React.JSX.Element => {
  const [isSaving, setIsSaving] = useState(false)
  const [ffmpegAvailable, setFFmpegAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check FFmpeg availability on mount
  useEffect(() => {
    const checkFFmpeg = async () => {
      try {
        const available = await window.api.checkFFmpeg()
        setFFmpegAvailable(available)
        if (!available) {
          setError(
            'FFmpeg not found. Please install FFmpeg and place ffmpeg.exe in the resources/ffmpeg/ folder.'
          )
        }
      } catch (err) {
        setFFmpegAvailable(false)
        setError('Failed to check FFmpeg availability.')
      }
    }
    checkFFmpeg()
  }, [])

  const handleStartRecording = async () => {
    setError(null)
    try {
      await onStartRecording()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording')
    }
  }

  const handleSaveClip = async () => {
    setIsSaving(true)
    setError(null)
    try {
      await onSaveClip()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save clip')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* FFmpeg Status */}
      {ffmpegAvailable === false && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-red-400 font-semibold">FFmpeg Not Found</h3>
              <p className="text-red-300 text-sm mt-1">
                Please install FFmpeg and place ffmpeg.exe in the resources/ffmpeg/ folder.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-red-400 font-semibold">Error</h3>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recording Status */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div
              className={`w-4 h-4 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}
            />
            <div>
              <h2 className="text-xl font-semibold">
                {isRecording ? 'Recording Active' : 'Recording Stopped'}
              </h2>
              <p className="text-gray-400 text-sm">
                {isRecording
                  ? 'Press Ctrl+Shift+X to save a clip'
                  : 'Start recording to begin capturing clips'}
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                disabled={ffmpegAvailable === false}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                Start Recording
              </button>
            ) : (
              <button
                onClick={onStopRecording}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
              >
                Stop Recording
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Manual Save Clip */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Manual Clip Save</h3>
          <p className="text-gray-400 text-sm mb-4">
            Save the last {settings.clipDuration} seconds as a clip
          </p>
          <button
            onClick={handleSaveClip}
            disabled={!isRecording || isSaving || ffmpegAvailable === false}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Clip Now'}
          </button>
        </div>

        {/* Current Settings Summary */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Current Settings</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Source:</span>
              <span className="capitalize">{settings.captureSource}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Duration:</span>
              <span>{settings.clipDuration}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">System Audio:</span>
              <span className={settings.includeSystemAudio ? 'text-green-400' : 'text-red-400'}>
                {settings.includeSystemAudio ? 'On' : 'Off'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Microphone:</span>
              <span className={settings.includeMicrophone ? 'text-green-400' : 'text-red-400'}>
                {settings.includeMicrophone ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-blue-400">How to Use</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <p>
            1. <strong>Start Recording:</strong> Click "Start Recording" to begin continuous
            background recording
          </p>
          <p>
            2. <strong>Save Clips:</strong> Press{' '}
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Ctrl+Shift+X</kbd> to save the
            last {settings.clipDuration} seconds
          </p>
          <p>
            3. <strong>Manual Save:</strong> Use the "Save Clip Now" button for manual clip saving
          </p>
          <p>
            4. <strong>View Clips:</strong> Switch to the "Clips" tab to see all saved clips
          </p>
          <p>
            5. <strong>Configure:</strong> Use the "Settings" tab to adjust recording options
          </p>
        </div>
      </div>
    </div>
  )
}
