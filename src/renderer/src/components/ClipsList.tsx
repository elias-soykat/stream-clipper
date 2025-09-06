import { useState } from 'react'

interface ClipInfo {
  filename: string
  path: string
  size: number
  createdAt: Date
}

interface ClipsListProps {
  clips: ClipInfo[]
  onRefresh: () => void
  onDeleteClip: (filename: string) => void
  onOpenFolder: () => void
}

export const ClipsList = ({
  clips,
  onRefresh,
  onDeleteClip,
  onOpenFolder
}: ClipsListProps): React.JSX.Element => {
  const [deletingClip, setDeletingClip] = useState<string | null>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  const handleDeleteClip = async (filename: string) => {
    if (window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      setDeletingClip(filename)
      try {
        await onDeleteClip(filename)
      } finally {
        setDeletingClip(null)
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Saved Clips</h2>
          <p className="text-gray-400 text-sm mt-1">
            {clips.length} clip{clips.length !== 1 ? 's' : ''} saved
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={onOpenFolder}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Open Folder
          </button>
        </div>
      </div>

      {/* Clips List */}
      {clips.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No clips saved yet</h3>
          <p className="text-gray-400 text-sm">
            Start recording and press Ctrl+Shift+X to save your first clip
          </p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {clips.map((clip) => (
                  <tr key={clip.filename} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-gray-400 mr-3">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{clip.filename}</div>
                          <div className="text-sm text-gray-400">{clip.path}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatFileSize(clip.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(clip.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={async () => {
                            // Open file in default application
                            try {
                              await window.api.openFile(clip.path)
                            } catch (error) {
                              console.error('Failed to open file:', error)
                            }
                          }}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="Open file"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClip(clip.filename)}
                          disabled={deletingClip === clip.filename}
                          className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Delete file"
                        >
                          {deletingClip === clip.filename ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
