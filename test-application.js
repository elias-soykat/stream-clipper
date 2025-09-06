const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs').promises

// Test script for StreamClipper application
console.log('🧪 StreamClipper Application Test Suite')
console.log('=====================================\n')

// Test 1: Check if FFmpeg is working
async function testFFmpeg() {
  console.log('1. Testing FFmpeg availability...')
  const ffmpegPath = path.join(__dirname, 'resources', 'ffmpeg', 'ffmpeg.exe')

  try {
    const result = await new Promise((resolve, reject) => {
      const process = spawn(ffmpegPath, ['-version'], { stdio: 'pipe' })
      let output = ''

      process.stdout.on('data', (data) => {
        output += data.toString()
      })

      process.stderr.on('data', (data) => {
        output += data.toString()
      })

      process.on('exit', (code) => {
        resolve({ code, output })
      })

      process.on('error', (error) => {
        reject(error)
      })
    })

    if (result.code === 0) {
      console.log('✅ FFmpeg is working correctly')
      return true
    } else {
      console.log('❌ FFmpeg test failed with exit code:', result.code)
      return false
    }
  } catch (error) {
    console.log('❌ FFmpeg test error:', error.message)
    return false
  }
}

// Test 2: Test basic screen recording
async function testScreenRecording() {
  console.log('\n2. Testing basic screen recording...')
  const ffmpegPath = path.join(__dirname, 'resources', 'ffmpeg', 'ffmpeg.exe')
  const outputFile = path.join(__dirname, 'Clips', 'test_recording.mp4')

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
        outputFile
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
      // Check if file was created and has content
      try {
        const stats = await fs.stat(outputFile)
        if (stats.size > 0) {
          console.log('✅ Screen recording test passed - file created:', stats.size, 'bytes')
          return true
        } else {
          console.log('❌ Screen recording test failed - file is empty')
          return false
        }
      } catch (error) {
        console.log('❌ Screen recording test failed - file not found')
        return false
      }
    } else {
      console.log('❌ Screen recording test failed with exit code:', result.code)
      console.log('FFmpeg error:', result.stderr)
      return false
    }
  } catch (error) {
    console.log('❌ Screen recording test error:', error.message)
    return false
  }
}

// Test 3: Test clip extraction
async function testClipExtraction() {
  console.log('\n3. Testing clip extraction...')
  const ffmpegPath = path.join(__dirname, 'resources', 'ffmpeg', 'ffmpeg.exe')
  const inputFile = path.join(__dirname, 'Clips', 'test_recording.mp4')
  const outputFile = path.join(__dirname, 'Clips', 'test_clip.mp4')

  try {
    // First, get duration
    const probeProcess = spawn(ffmpegPath, ['-i', inputFile, '-f', 'null', '-'], { stdio: 'pipe' })
    let stderr = ''

    probeProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    await new Promise((resolve) => {
      probeProcess.on('exit', resolve)
    })

    // Extract last 2 seconds
    const extractProcess = spawn(
      ffmpegPath,
      [
        '-i',
        inputFile,
        '-ss',
        '3', // Start at 3 seconds (since we recorded 5 seconds)
        '-t',
        '2', // Extract 2 seconds
        '-c',
        'copy',
        '-y',
        outputFile
      ],
      { stdio: 'pipe' }
    )

    const result = await new Promise((resolve, reject) => {
      extractProcess.on('exit', (code) => resolve({ code }))
      extractProcess.on('error', reject)
    })

    if (result.code === 0) {
      try {
        const stats = await fs.stat(outputFile)
        if (stats.size > 0) {
          console.log('✅ Clip extraction test passed - clip created:', stats.size, 'bytes')
          return true
        } else {
          console.log('❌ Clip extraction test failed - clip is empty')
          return false
        }
      } catch (error) {
        console.log('❌ Clip extraction test failed - clip not found')
        return false
      }
    } else {
      console.log('❌ Clip extraction test failed with exit code:', result.code)
      return false
    }
  } catch (error) {
    console.log('❌ Clip extraction test error:', error.message)
    return false
  }
}

// Test 4: Test directory structure
async function testDirectoryStructure() {
  console.log('\n4. Testing directory structure...')

  const requiredDirs = ['Clips', 'resources', 'resources/ffmpeg']
  const requiredFiles = ['resources/ffmpeg/ffmpeg.exe', 'package.json']

  let allGood = true

  for (const dir of requiredDirs) {
    try {
      await fs.access(dir)
      console.log('✅ Directory exists:', dir)
    } catch (error) {
      console.log('❌ Directory missing:', dir)
      allGood = false
    }
  }

  for (const file of requiredFiles) {
    try {
      await fs.access(file)
      console.log('✅ File exists:', file)
    } catch (error) {
      console.log('❌ File missing:', file)
      allGood = false
    }
  }

  return allGood
}

// Test 5: Test application build
async function testApplicationBuild() {
  console.log('\n5. Testing application build...')

  const buildFiles = [
    'dist/win-unpacked/StreamClipper.exe',
    'out/main/index.js',
    'out/renderer/index.html'
  ]

  let allGood = true

  for (const file of buildFiles) {
    try {
      await fs.access(file)
      console.log('✅ Build file exists:', file)
    } catch (error) {
      console.log('❌ Build file missing:', file)
      allGood = false
    }
  }

  return allGood
}

// Run all tests
async function runAllTests() {
  const results = {
    ffmpeg: await testFFmpeg(),
    recording: await testScreenRecording(),
    extraction: await testClipExtraction(),
    directories: await testDirectoryStructure(),
    build: await testApplicationBuild()
  }

  console.log('\n📊 Test Results Summary')
  console.log('======================')

  const passed = Object.values(results).filter(Boolean).length
  const total = Object.keys(results).length

  for (const [test, result] of Object.entries(results)) {
    console.log(`${result ? '✅' : '❌'} ${test}: ${result ? 'PASSED' : 'FAILED'}`)
  }

  console.log(`\nOverall: ${passed}/${total} tests passed`)

  if (passed === total) {
    console.log('🎉 All tests passed! Application is ready to use.')
  } else {
    console.log('⚠️  Some tests failed. Please check the issues above.')
  }

  return results
}

// Cleanup test files
async function cleanup() {
  console.log('\n🧹 Cleaning up test files...')
  const testFiles = ['Clips/test_recording.mp4', 'Clips/test_clip.mp4']

  for (const file of testFiles) {
    try {
      await fs.unlink(file)
      console.log('✅ Cleaned up:', file)
    } catch (error) {
      // File might not exist, that's okay
    }
  }
}

// Run the tests
runAllTests().then(cleanup).catch(console.error)
