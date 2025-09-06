/**
 * Test script to verify the redundant clip recording fix
 * This script tests the scenario where multiple clips are saved and ensures
 * each clip contains unique content (not redundant with previous clips)
 */

const { spawn } = require('child_process')
const fs = require('fs').promises
const path = require('path')

// Test configuration
const TEST_CONFIG = {
  testDuration: 60000, // 1 minute test
  clipInterval: 10000, // Save clip every 10 seconds
  expectedClips: 6, // Should get 6 clips in 1 minute
  clipsDirectory: path.join(process.cwd(), 'Clips'),
  testResults: {
    totalClips: 0,
    uniqueClips: 0,
    redundantClips: 0,
    errors: []
  }
}

// Helper function to wait for a specified time
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper function to check if a file exists
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

// Helper function to get file size
const getFileSize = async (filePath) => {
  try {
    const stats = await fs.stat(filePath)
    return stats.size
  } catch {
    return 0
  }
}

// Helper function to get file modification time
const getFileModTime = async (filePath) => {
  try {
    const stats = await fs.stat(filePath)
    return stats.mtime
  } catch {
    return null
  }
}

// Function to simulate hotkey press (Ctrl+Shift+X)
const simulateHotkey = () => {
  return new Promise((resolve, reject) => {
    // This would need to be implemented based on the platform
    // For now, we'll use the manual save clip method
    console.log('Simulating hotkey press (Ctrl+Shift+X)')
    resolve()
  })
}

// Function to check for redundant clips
const checkForRedundantClips = async () => {
  console.log('\n🔍 Checking for redundant clips...')

  try {
    const files = await fs.readdir(TEST_CONFIG.clipsDirectory)
    const clipFiles = files
      .filter((file) => file.startsWith('clip-') && file.endsWith('.mp4'))
      .sort()

    console.log(`Found ${clipFiles.length} clip files`)

    if (clipFiles.length < 2) {
      console.log('❌ Not enough clips to check for redundancy')
      return false
    }

    // Check file sizes and modification times
    const clipInfo = []
    for (const file of clipFiles) {
      const filePath = path.join(TEST_CONFIG.clipsDirectory, file)
      const size = await getFileSize(filePath)
      const modTime = await getFileModTime(filePath)

      clipInfo.push({
        filename: file,
        size,
        modTime,
        path: filePath
      })
    }

    // Sort by modification time
    clipInfo.sort((a, b) => a.modTime - b.modTime)

    // Check for identical file sizes (potential redundancy)
    const sizeGroups = {}
    clipInfo.forEach((clip) => {
      if (!sizeGroups[clip.size]) {
        sizeGroups[clip.size] = []
      }
      sizeGroups[clip.size].push(clip)
    })

    let redundantFound = false
    Object.entries(sizeGroups).forEach(([size, clips]) => {
      if (clips.length > 1) {
        console.log(`⚠️  Found ${clips.length} clips with identical size (${size} bytes):`)
        clips.forEach((clip) => {
          console.log(`   - ${clip.filename} (${clip.modTime.toISOString()})`)
        })
        redundantFound = true
      }
    })

    if (!redundantFound) {
      console.log('✅ No redundant clips found - all clips have unique sizes')
    }

    // Check time intervals between clips
    console.log('\n📊 Clip timing analysis:')
    for (let i = 1; i < clipInfo.length; i++) {
      const prevClip = clipInfo[i - 1]
      const currClip = clipInfo[i]
      const timeDiff = currClip.modTime - prevClip.modTime

      console.log(`   ${prevClip.filename} → ${currClip.filename}: ${Math.round(timeDiff / 1000)}s`)

      if (timeDiff < 5000) {
        // Less than 5 seconds between clips
        console.log(`   ⚠️  Very short interval between clips - possible redundancy`)
        redundantFound = true
      }
    }

    return !redundantFound
  } catch (error) {
    console.error('❌ Error checking for redundant clips:', error)
    return false
  }
}

// Main test function
const runRedundantClipTest = async () => {
  console.log('🚀 Starting Redundant Clip Test')
  console.log('================================')
  console.log(`Test Duration: ${TEST_CONFIG.testDuration / 1000} seconds`)
  console.log(`Clip Interval: ${TEST_CONFIG.clipInterval / 1000} seconds`)
  console.log(`Expected Clips: ${TEST_CONFIG.expectedClips}`)
  console.log(`Clips Directory: ${TEST_CONFIG.clipsDirectory}`)
  console.log('')

  // Check if clips directory exists
  const clipsDirExists = await fileExists(TEST_CONFIG.clipsDirectory)
  if (!clipsDirExists) {
    console.log(
      '❌ Clips directory does not exist. Please start the app and begin recording first.'
    )
    return
  }

  // Get initial clip count
  const initialFiles = await fs.readdir(TEST_CONFIG.clipsDirectory)
  const initialClipCount = initialFiles.filter(
    (file) => file.startsWith('clip-') && file.endsWith('.mp4')
  ).length

  console.log(`📁 Initial clip count: ${initialClipCount}`)

  // Instructions for manual testing
  console.log('\n📋 Manual Test Instructions:')
  console.log('1. Make sure the StreamClipper app is running')
  console.log('2. Start recording in the app')
  console.log('3. Wait for the test to complete')
  console.log('4. The test will check for redundant clips automatically')
  console.log('')

  // Simulate the test scenario
  console.log('⏱️  Starting test simulation...')

  const startTime = Date.now()
  let clipCount = 0

  // Simulate saving clips at intervals
  const testInterval = setInterval(async () => {
    const elapsed = Date.now() - startTime

    if (elapsed >= TEST_CONFIG.testDuration) {
      clearInterval(testInterval)
      console.log('\n✅ Test duration completed')

      // Check for redundant clips
      const noRedundant = await checkForRedundantClips()

      if (noRedundant) {
        console.log('\n🎉 SUCCESS: No redundant clips detected!')
        console.log('The fix is working correctly.')
      } else {
        console.log('\n❌ FAILURE: Redundant clips detected!')
        console.log('The fix needs further investigation.')
      }

      return
    }

    // Simulate saving a clip
    console.log(`💾 Simulating clip save #${clipCount + 1} at ${Math.round(elapsed / 1000)}s`)

    // In a real test, this would trigger the actual save clip functionality
    // For now, we'll just log the action
    clipCount++
  }, TEST_CONFIG.clipInterval)

  // Also provide instructions for manual testing
  console.log('\n🔧 Manual Testing Steps:')
  console.log('1. Click "Save Clip Now" button every 10 seconds')
  console.log('2. Or press Ctrl+Shift+X every 10 seconds')
  console.log('3. Wait for the test to complete')
  console.log('4. Check the results below')
}

// Function to run automated test (if we can access the app's IPC)
const runAutomatedTest = async () => {
  console.log('🤖 Running Automated Test...')

  try {
    // This would require access to the app's IPC system
    // For now, we'll provide a framework for manual testing
    console.log('Note: Automated testing requires IPC access to the running app')
    console.log('Please run the manual test instead.')
  } catch (error) {
    console.error('❌ Automated test failed:', error)
  }
}

// Function to clean up test files
const cleanupTestFiles = async () => {
  console.log('\n🧹 Cleaning up test files...')

  try {
    const files = await fs.readdir(TEST_CONFIG.clipsDirectory)
    const testFiles = files.filter((file) => file.startsWith('clip-') && file.endsWith('.mp4'))

    console.log(`Found ${testFiles.length} clip files to clean up`)

    // Ask user if they want to clean up
    console.log('Note: Cleanup is not performed automatically to preserve your clips')
    console.log('You can manually delete test clips if needed')
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  }
}

// Main execution
const main = async () => {
  console.log('StreamClipper - Redundant Clip Test Suite')
  console.log('==========================================')

  const args = process.argv.slice(2)

  if (args.includes('--cleanup')) {
    await cleanupTestFiles()
  } else if (args.includes('--automated')) {
    await runAutomatedTest()
  } else {
    await runRedundantClipTest()
  }
}

// Run the test
main().catch(console.error)
