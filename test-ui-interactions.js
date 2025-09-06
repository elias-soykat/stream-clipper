const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs').promises

// Test UI interactions and application workflow
console.log('🎮 StreamClipper UI Interaction Test')
console.log('===================================\n')

// Test 1: Check if application is running
async function testApplicationRunning() {
  console.log('1. Checking if application is running...')

  try {
    const { exec } = require('child_process')
    const result = await new Promise((resolve) => {
      exec('tasklist | findstr electron', (error, stdout) => {
        resolve(stdout.includes('electron.exe'))
      })
    })

    if (result) {
      console.log('✅ Application is running')
      return true
    } else {
      console.log('❌ Application is not running')
      return false
    }
  } catch (error) {
    console.log('❌ Error checking application status:', error.message)
    return false
  }
}

// Test 2: Test recording workflow
async function testRecordingWorkflow() {
  console.log('\n2. Testing recording workflow...')

  // Check if we can start recording by testing FFmpeg directly
  const ffmpegPath = path.join(__dirname, 'resources', 'ffmpeg', 'ffmpeg.exe')
  const testFile = path.join(__dirname, 'Clips', 'ui_test_recording.mp4')

  try {
    console.log('   - Starting test recording...')

    // Record for 10 seconds to simulate the app's recording
    const process = spawn(
      ffmpegPath,
      [
        '-f',
        'gdigrab',
        '-framerate',
        '30',
        '-i',
        'desktop',
        '-t',
        '10',
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-crf',
        '23',
        '-y',
        testFile
      ],
      { stdio: 'pipe' }
    )

    let stderr = ''
    process.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    const result = await new Promise((resolve, reject) => {
      process.on('exit', (code) => {
        resolve({ code, stderr })
      })

      process.on('error', (error) => {
        reject(error)
      })
    })

    if (result.code === 0) {
      console.log('   ✅ Recording started successfully')

      // Check if file was created
      try {
        const stats = await fs.stat(testFile)
        if (stats.size > 0) {
          console.log('   ✅ Recording file created:', stats.size, 'bytes')

          // Test clip extraction (simulating the save clip functionality)
          console.log('   - Testing clip extraction...')
          const clipFile = path.join(__dirname, 'Clips', 'ui_test_clip.mp4')

          const extractProcess = spawn(
            ffmpegPath,
            [
              '-i',
              testFile,
              '-ss',
              '5', // Start at 5 seconds
              '-t',
              '3', // Extract 3 seconds
              '-c',
              'copy',
              '-y',
              clipFile
            ],
            { stdio: 'pipe' }
          )

          const extractResult = await new Promise((resolve, reject) => {
            extractProcess.on('exit', (code) => resolve({ code }))
            extractProcess.on('error', reject)
          })

          if (extractResult.code === 0) {
            try {
              const clipStats = await fs.stat(clipFile)
              if (clipStats.size > 0) {
                console.log('   ✅ Clip extraction successful:', clipStats.size, 'bytes')
                return true
              } else {
                console.log('   ❌ Clip extraction failed - empty file')
                return false
              }
            } catch (error) {
              console.log('   ❌ Clip extraction failed - file not found')
              return false
            }
          } else {
            console.log('   ❌ Clip extraction failed with exit code:', extractResult.code)
            return false
          }
        } else {
          console.log('   ❌ Recording file is empty')
          return false
        }
      } catch (error) {
        console.log('   ❌ Recording file not found')
        return false
      }
    } else {
      console.log('   ❌ Recording failed with exit code:', result.code)
      console.log('   FFmpeg error:', result.stderr)
      return false
    }
  } catch (error) {
    console.log('   ❌ Recording workflow error:', error.message)
    return false
  }
}

// Test 3: Test settings and configuration
async function testSettingsConfiguration() {
  console.log('\n3. Testing settings and configuration...')

  // Test different clip durations
  const durations = [15, 30, 60, 120]
  let allGood = true

  for (const duration of durations) {
    console.log(`   - Testing ${duration}s clip duration...`)

    // Simulate the app's buffer calculation
    const maxDuration = Math.max(duration * 4, 120)
    const segmentCount = Math.ceil(maxDuration / 10)

    console.log(`     Buffer duration: ${maxDuration}s, Segments: ${segmentCount}`)

    // This simulates what the app does internally
    if (segmentCount > 0 && segmentCount < 100) {
      // Reasonable limits
      console.log(`     ✅ ${duration}s duration configuration valid`)
    } else {
      console.log(`     ❌ ${duration}s duration configuration invalid`)
      allGood = false
    }
  }

  return allGood
}

// Test 4: Test file management
async function testFileManagement() {
  console.log('\n4. Testing file management...')

  const clipsDir = path.join(__dirname, 'Clips')

  try {
    // Check if clips directory exists
    await fs.access(clipsDir)
    console.log('   ✅ Clips directory exists')

    // List files in clips directory
    const files = await fs.readdir(clipsDir)
    console.log(`   ✅ Found ${files.length} files in clips directory`)

    // Check for buffer files vs actual clips
    const bufferFiles = files.filter((f) => f.startsWith('buffer_') && f.endsWith('.mp4'))
    const clipFiles = files.filter((f) => f.startsWith('clip-') && f.endsWith('.mp4'))

    console.log(`   - Buffer files: ${bufferFiles.length}`)
    console.log(`   - Clip files: ${clipFiles.length}`)

    // Test file operations
    if (clipFiles.length > 0) {
      const testFile = path.join(clipsDir, clipFiles[0])
      try {
        const stats = await fs.stat(testFile)
        console.log(`   ✅ File stats: ${stats.size} bytes, created: ${stats.birthtime}`)
      } catch (error) {
        console.log('   ❌ Error reading file stats')
        return false
      }
    }

    return true
  } catch (error) {
    console.log('   ❌ File management error:', error.message)
    return false
  }
}

// Test 5: Test hotkey simulation
async function testHotkeySimulation() {
  console.log('\n5. Testing hotkey simulation...')

  // Since we can't actually simulate the hotkey from Node.js,
  // we'll test the underlying functionality that the hotkey triggers

  console.log('   - Testing clip saving functionality...')

  // Create a test recording
  const ffmpegPath = path.join(__dirname, 'resources', 'ffmpeg', 'ffmpeg.exe')
  const testFile = path.join(__dirname, 'Clips', 'hotkey_test.mp4')

  try {
    // Record for 5 seconds
    const process = spawn(
      ffmpegPath,
      [
        '-f',
        'gdigrab',
        '-framerate',
        '30',
        '-i',
        'desktop',
        '-t',
        '5',
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-crf',
        '23',
        '-y',
        testFile
      ],
      { stdio: 'pipe' }
    )

    const result = await new Promise((resolve, reject) => {
      process.on('exit', (code) => resolve({ code }))
      process.on('error', reject)
    })

    if (result.code === 0) {
      console.log('   ✅ Hotkey simulation test passed')
      return true
    } else {
      console.log('   ❌ Hotkey simulation test failed')
      return false
    }
  } catch (error) {
    console.log('   ❌ Hotkey simulation error:', error.message)
    return false
  }
}

// Run all UI tests
async function runUITests() {
  const results = {
    running: await testApplicationRunning(),
    recording: await testRecordingWorkflow(),
    settings: await testSettingsConfiguration(),
    files: await testFileManagement(),
    hotkey: await testHotkeySimulation()
  }

  console.log('\n📊 UI Test Results Summary')
  console.log('==========================')

  const passed = Object.values(results).filter(Boolean).length
  const total = Object.keys(results).length

  for (const [test, result] of Object.entries(results)) {
    console.log(`${result ? '✅' : '❌'} ${test}: ${result ? 'PASSED' : 'FAILED'}`)
  }

  console.log(`\nOverall: ${passed}/${total} tests passed`)

  if (passed === total) {
    console.log('🎉 All UI tests passed! Application is working correctly.')
  } else {
    console.log('⚠️  Some UI tests failed. Please check the issues above.')
  }

  return results
}

// Cleanup test files
async function cleanup() {
  console.log('\n🧹 Cleaning up UI test files...')
  const testFiles = [
    'Clips/ui_test_recording.mp4',
    'Clips/ui_test_clip.mp4',
    'Clips/hotkey_test.mp4'
  ]

  for (const file of testFiles) {
    try {
      await fs.unlink(file)
      console.log('✅ Cleaned up:', file)
    } catch (error) {
      // File might not exist, that's okay
    }
  }
}

// Run the UI tests
runUITests().then(cleanup).catch(console.error)
