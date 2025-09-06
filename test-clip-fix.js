/**
 * Simple test to verify the redundant clip fix
 * Run this after starting the StreamClipper app and beginning recording
 */

const fs = require('fs').promises
const path = require('path')

const CLIPS_DIR = path.join(process.cwd(), 'Clips')

async function testRedundantClips() {
  console.log('🔍 Testing for redundant clips...')
  console.log('================================')

  try {
    // Check if clips directory exists
    try {
      await fs.access(CLIPS_DIR)
    } catch {
      console.log('❌ Clips directory not found. Please start recording first.')
      return
    }

    // Get all clip files
    const files = await fs.readdir(CLIPS_DIR)
    const clipFiles = files
      .filter((file) => file.startsWith('clip-') && file.endsWith('.mp4'))
      .sort()

    console.log(`📁 Found ${clipFiles.length} clip files`)

    if (clipFiles.length < 2) {
      console.log('⚠️  Need at least 2 clips to test for redundancy')
      console.log('💡 Please save a few clips first using "Save Clip Now" or Ctrl+Shift+X')
      return
    }

    // Check file sizes and modification times
    const clipInfo = []
    for (const file of clipFiles) {
      const filePath = path.join(CLIPS_DIR, file)
      const stats = await fs.stat(filePath)

      clipInfo.push({
        filename: file,
        size: stats.size,
        modTime: stats.mtime,
        path: filePath
      })
    }

    // Sort by modification time
    clipInfo.sort((a, b) => a.modTime - b.modTime)

    console.log('\n📊 Clip Analysis:')
    console.log('================')

    // Display clip information
    clipInfo.forEach((clip, index) => {
      const timeStr = clip.modTime.toLocaleTimeString()
      const sizeKB = Math.round(clip.size / 1024)
      console.log(`${index + 1}. ${clip.filename}`)
      console.log(`   Time: ${timeStr}`)
      console.log(`   Size: ${sizeKB} KB`)
      console.log('')
    })

    // Check for identical file sizes (potential redundancy)
    const sizeGroups = {}
    clipInfo.forEach((clip) => {
      if (!sizeGroups[clip.size]) {
        sizeGroups[clip.size] = []
      }
      sizeGroups[clip.size].push(clip)
    })

    let redundantFound = false
    console.log('🔍 Redundancy Check:')
    console.log('===================')

    Object.entries(sizeGroups).forEach(([size, clips]) => {
      if (clips.length > 1) {
        console.log(
          `❌ REDUNDANT: Found ${clips.length} clips with identical size (${Math.round(size / 1024)} KB):`
        )
        clips.forEach((clip) => {
          console.log(`   - ${clip.filename} (${clip.modTime.toLocaleTimeString()})`)
        })
        redundantFound = true
      }
    })

    if (!redundantFound) {
      console.log('✅ No redundant clips found - all clips have unique sizes')
    }

    // Check time intervals between clips
    console.log('\n⏱️  Timing Analysis:')
    console.log('==================')

    for (let i = 1; i < clipInfo.length; i++) {
      const prevClip = clipInfo[i - 1]
      const currClip = clipInfo[i]
      const timeDiff = currClip.modTime - prevClip.modTime
      const timeDiffSeconds = Math.round(timeDiff / 1000)

      console.log(`${prevClip.filename} → ${currClip.filename}: ${timeDiffSeconds}s`)

      if (timeDiffSeconds < 5) {
        console.log(`   ⚠️  Very short interval - possible redundancy`)
        redundantFound = true
      }
    }

    // Final result
    console.log('\n🎯 Test Result:')
    console.log('==============')

    if (redundantFound) {
      console.log('❌ FAILURE: Redundant clips detected!')
      console.log('The fix may not be working correctly.')
      console.log('Please check the implementation and try again.')
    } else {
      console.log('✅ SUCCESS: No redundant clips detected!')
      console.log('The fix is working correctly.')
      console.log('Each clip contains unique content from different time periods.')
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Run the test
testRedundantClips()
