import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

export const useJailStore = defineStore('jail', () => {
  const isJailModeActive = ref(false)
  const jailModeType = ref('time') // 'word' | 'time'
  const jailTargetValue = ref(0)
  const jailStartWordCount = ref(0)
  const jailCurrentWordCount = ref(0)
  const jailTotalTime = ref(0) // ms
  const jailUnlockCountdown = ref(0)
  let jailTimer = null
  let lastActivityTime = 0
  let isPasting = false // 标记是否正在执行粘贴操作
  let lastUpdateTime = 0 // 上次字数更新的时间戳

  function setJailMode(active) {
    isJailModeActive.value = active
  }

  function updateActivity() {
    if (isJailModeActive.value) {
      lastActivityTime = Date.now()
    }
  }

  // 标记粘贴操作开始（供编辑器调用）
  function markPasteStart() {
    isPasting = true
  }

  // 标记粘贴操作结束（供编辑器调用，延迟一小段时间后重置）
  function markPasteEnd() {
    // 延迟100ms重置，确保粘贴带来的字数变化被捕获
    setTimeout(() => {
      isPasting = false
    }, 100)
  }

  function checkJailStatus() {
    if (!isJailModeActive.value) return
    
    // Check if unlocking
    if (jailUnlockCountdown.value > 0) {
      jailUnlockCountdown.value--
      if (jailUnlockCountdown.value <= 0) {
        finishJailMode()
      }
      return
    }

    // Update progress
    if (jailModeType.value === 'time') {
      const now = Date.now()
      // If active within last 30 seconds, count this second
      if (now - lastActivityTime < 30000) {
        jailTotalTime.value += 1000
      }
      
      if (jailTotalTime.value >= jailTargetValue.value) {
        startUnlockCountdown()
      }
    } else {
      // Word count check
      if (jailCurrentWordCount.value >= jailTargetValue.value) {
        startUnlockCountdown()
      }
    }
  }

  function startUnlockCountdown() {
    if (jailUnlockCountdown.value > 0) return // Already counting
    jailUnlockCountdown.value = 30 // 30 seconds countdown
    ElMessage.success('目标达成！30秒后解锁...')
  }

  async function startJailMode(target, type, startWordCount) {
    jailModeType.value = type
    
    if (type === 'word') {
       jailTargetValue.value = target
       jailStartWordCount.value = startWordCount
       jailCurrentWordCount.value = 0
    } else {
       jailTargetValue.value = target * 60 * 1000
       jailTotalTime.value = 0
    }

    try {
      await window.electron.enableJailMode({
        target: jailTargetValue.value,
        type: jailModeType.value
      })
      isJailModeActive.value = true
      lastActivityTime = Date.now()
      jailUnlockCountdown.value = 0
      
      // Start timer
      if (jailTimer) clearInterval(jailTimer)
      jailTimer = setInterval(checkJailStatus, 1000)
      
      ElMessage.success('专注模式已开启，加油！')
      return true
    } catch (e) {
      ElMessage.error('开启专注模式失败: ' + e.message)
      return false
    }
  }

  async function finishJailMode() {
    if (jailTimer) clearInterval(jailTimer)
    try {
      await window.electron.disableJailMode()
      isJailModeActive.value = false
      ElMessage.success('专注模式已解除！')
    } catch (e) {
      ElMessage.error('解除失败: ' + e.message)
    }
  }
  
  // 更新字数（供外部调用）
  function updateWordCount(newVal, oldVal) {
      if (!isJailModeActive.value || jailModeType.value !== 'word' || jailUnlockCountdown.value > 0) return
      
      const diff = newVal - oldVal
      if (diff > 0) {
        const now = Date.now()
        const timeSinceLastUpdate = now - lastUpdateTime
        lastUpdateTime = now
        
        // 检测是否为粘贴或异常输入：
        // 1. 如果正在执行粘贴操作，直接忽略
        // 2. 如果一次性输入超过50字，忽略（可能是粘贴）
        // 3. 如果在极短时间内（<50ms）输入大量字符（>10字），忽略（异常输入）
        const isSuspiciousPaste = diff > 50 || (timeSinceLastUpdate < 50 && diff > 10)
        
        if (!isPasting && !isSuspiciousPaste) {
          // 只有正常输入才计入专注模式进度
          jailCurrentWordCount.value += diff
        }
      }
  }

  return {
    isJailModeActive,
    jailModeType,
    jailTargetValue,
    jailCurrentWordCount,
    jailTotalTime,
    jailUnlockCountdown,
    setJailMode,
    startJailMode,
    finishJailMode,
    updateActivity,
    updateWordCount,
    markPasteStart,
    markPasteEnd
  }
})
