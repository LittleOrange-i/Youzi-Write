<template>
  <div class="editor-stats">
    <div class="editor-stats-left">
      <span class="stat-item">码字: {{ typingStats.wordsTyped }}字</span>
      <span class="stat-divider">|</span>
      <span class="stat-item"> 速度：{{ typingStats.speed }}字/小时</span>
      <span class="stat-divider">|</span>
      <span class="stat-item">时长: {{ formatDuration(typingStats.activeDuration) }}</span>
      <span class="stat-divider">|</span>
      <span class="stat-item">空闲: {{ formatDuration(typingStats.idleDuration) }}</span>
      <span class="stat-divider">|</span>
      <span class="stat-item">字数: {{ cursorPosition }}/{{ contentWordCount }} 字</span>
    </div>
    <div class="editor-stats-right">
      <span class="current-time">{{ currentTime }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useEditorStore } from '@renderer/stores/editor'

const props = defineProps({
  bookName: {
    type: String,
    default: ''
  },
  contentWordCount: {
    type: Number,
    default: 0
  },
  cursorPosition: {
    type: Number,
    default: 0
  },
  fileType: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update-book-words', 'update-chapter-word-count'])

const editorStore = useEditorStore()

const isFetching = ref(false)

// 统计数据
const typingStats = ref({
  wordsTyped: 0,              // 当前码字数量
  speed: 0,                   // 当前码字速度(字/小时)
  
  // 核心时间戳 (毫秒)
  startTime: null,            // 开始码字时间
  lastInputTime: null,        // 最后输入时间
  
  // 状态机
  isIdle: false,              // 当前是否空闲
  statusStartTime: null,      // 当前状态(Active/Idle)的开始时间
  
  // 累积量 (毫秒)
  accumulatedActive: 0,       // 累积活跃时长
  accumulatedIdle: 0,         // 累积空闲时长
  
  // 显示用 (秒)
  activeDuration: 0,
  idleDuration: 0,
  
  initialWordCount: 0         // 初始字数
})

// 记录上次的书籍名和文件路径,用于判断是否真正切换
const lastBookName = ref(null)
const lastFilePath = ref(null)

// 当前实时时间
const currentTime = ref('')

// 定时器
let timeUpdateTimer = null
let idleCheckTimer = null

// 格式化时长 (秒 -> 00:00:00)
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

// 更新实时时间
function updateCurrentTime() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  currentTime.value = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 计算码字速度 (字/小时)
function calculateSpeed() {
  if (typingStats.value.activeDuration === 0) {
    return 0
  }
  // 速度 = 字数 / 秒数 * 3600
  const speed = Math.floor((typingStats.value.wordsTyped / typingStats.value.activeDuration) * 3600)
  // 最大值 20000
  if (speed > 20000) {
    return 20000
  }
  return speed
}

// 更新统计数据 (状态机模式)
function updateStats() {
  if (!typingStats.value.startTime) return

  const now = Date.now()
  const IDLE_THRESHOLD = 5000 // 5秒无输入进入空闲

  if (!typingStats.value.isIdle) {
    // === 当前状态：活跃 ===
    
    // 检查是否超时
    if (now - typingStats.value.lastInputTime > IDLE_THRESHOLD) {
      // -> 切换到空闲状态
      
      // 1. 结算活跃段 (活跃只算到 lastInputTime + 5s)
      // 注意：如果一直输入，statusStartTime 就是上次从空闲切回来的时间，或者初始时间
      const activeSegmentEnd = typingStats.value.lastInputTime + IDLE_THRESHOLD
      const activeSegmentDuration = activeSegmentEnd - typingStats.value.statusStartTime
      
      typingStats.value.accumulatedActive += Math.max(0, activeSegmentDuration)
      
      // 2. 切换状态
      typingStats.value.isIdle = true
      typingStats.value.statusStartTime = activeSegmentEnd // 空闲从超时那一刻开始
      
      // 3. 更新显示 (空闲时间开始增加)
      const currentIdleDuration = now - typingStats.value.statusStartTime
      typingStats.value.idleDuration = Math.floor((typingStats.value.accumulatedIdle + currentIdleDuration) / 1000)
      typingStats.value.activeDuration = Math.floor(typingStats.value.accumulatedActive / 1000)
      
    } else {
      // -> 保持活跃状态
      const currentActiveDuration = now - typingStats.value.statusStartTime
      typingStats.value.activeDuration = Math.floor((typingStats.value.accumulatedActive + currentActiveDuration) / 1000)
      typingStats.value.idleDuration = Math.floor(typingStats.value.accumulatedIdle / 1000)
    }
  } else {
    // === 当前状态：空闲 ===
    
    // 只要没有输入，就一直保持空闲 (输入事件由 handleWordCountChange 处理)
    const currentIdleDuration = now - typingStats.value.statusStartTime
    typingStats.value.idleDuration = Math.floor((typingStats.value.accumulatedIdle + currentIdleDuration) / 1000)
    typingStats.value.activeDuration = Math.floor(typingStats.value.accumulatedActive / 1000)
  }
  
  // 更新速度
  typingStats.value.speed = calculateSpeed()

  // 调试日志 (可选，不需要时可删除)
  // console.log('统计更新:', {
  //   now: new Date().toLocaleTimeString(),
  //   isIdle: typingStats.value.isIdle,
  //   idle: typingStats.value.idleDuration,
  //   active: typingStats.value.activeDuration
  // })
}

// 重置统计
function resetStats() {
  typingStats.value = {
    wordsTyped: 0,
    speed: 0,
    
    startTime: null,
    lastInputTime: null,
    
    isIdle: false,
    statusStartTime: null,
    
    accumulatedActive: 0,
    accumulatedIdle: 0,
    
    activeDuration: 0,
    idleDuration: 0,
    
    initialWordCount: 0
  }
}

// 开始统计 (第一个字输入时)
function startStats(currentWordCount) {
  if (!typingStats.value.startTime) {
    const now = Date.now()
    typingStats.value.startTime = now
    typingStats.value.initialWordCount = currentWordCount
    typingStats.value.lastInputTime = now
    
    // 初始化状态机
    typingStats.value.isIdle = false
    typingStats.value.statusStartTime = now
  }
}

// 处理字数变化
function handleWordCountChange(newWordCount, oldWordCount) {
  // 1. 动态调整基准线：如果当前字数低于初始基准，说明删除了历史存量，下调基准
  // 这样可以避免"填坑"现象（即必须先把删除的字数补回来才能看到码字增长）
  if (typingStats.value.startTime && newWordCount < typingStats.value.initialWordCount) {
    typingStats.value.initialWordCount = newWordCount
  }

  // 2. 如果字数增加,说明有输入
  if (newWordCount > oldWordCount) {
    const now = Date.now()
    
    // 如果是第一次输入,开始统计
    if (!typingStats.value.startTime) {
      startStats(oldWordCount)
    } else {
      // 只有在已开始统计后，才更新 lastInputTime
      typingStats.value.lastInputTime = now
      
      // 如果之前处于空闲状态，切换回活跃状态
      if (typingStats.value.isIdle) {
        // 1. 结算空闲段
        const idleSegmentDuration = now - typingStats.value.statusStartTime
        typingStats.value.accumulatedIdle += Math.max(0, idleSegmentDuration)
        
        // 2. 切换状态
        typingStats.value.isIdle = false
        typingStats.value.statusStartTime = now
      }
    }
  }
  
  // 3. 更新码字数量 (无论增减都更新)
  if (typingStats.value.startTime) {
    // 计算净增字数
    const netWords = newWordCount - typingStats.value.initialWordCount
    // 确保显示的码字数量不为负数
    typingStats.value.wordsTyped = Math.max(0, netWords)
  }
  
  // 注意：移除此处的 updateStats() 调用，避免输入时高频计算导致UI卡顿
  // 统计数据的更新完全依赖定时器 (1秒1次)
}

function sanitizeWordCount(value) {
  if (value === null || value === undefined) return 0
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return 0
  return numberValue < 0 ? 0 : Math.floor(numberValue)
}

async function loadBookTotalWords(force = false) {
  if (!props.bookName || isFetching.value) return
  isFetching.value = true
  try {
    await editorStore.fetchBookTotalWords(props.bookName, { force })
  } finally {
    isFetching.value = false
  }
}

// 监听 bookName 变化
watch(
  () => props.bookName,
  async (name, prevName) => {
    if (!name) return
    
    // 只有当书籍名真正改变时才重置统计
    // 如果 lastBookName 为 null,说明是首次加载,不重置
    // 如果 lastBookName 和新的 name 不同,说明切换了书籍,需要重置
    const isBookChanged = lastBookName.value !== null && lastBookName.value !== name
    
    if (isBookChanged) {
      // 切换书籍时重置统计
      resetStats()
    }
    
    // 更新记录的书籍名
    lastBookName.value = name
    
    const force = name !== prevName
    await loadBookTotalWords(force)
  },
  { immediate: true }
)

// 监听书籍总字数变化
watch(
  () => editorStore.bookTotalWords,
  (total) => {
    if (!editorStore.bookWordsLoaded) {
      emit('update-book-words', sanitizeWordCount(total))
      return
    }
    emit('update-book-words', sanitizeWordCount(total))
  },
  { immediate: true }
)

// 监听章节字数变化
watch(
  () => props.contentWordCount,
  (newVal, oldVal) => {
    if (oldVal === undefined) return
    handleWordCountChange(newVal, oldVal)
    
    // 发出章节字数更新事件，用于同步更新章节树显示
    if (editorStore.file?.type === 'chapter' && editorStore.file?.path) {
      emit('update-chapter-word-count', {
        path: editorStore.file.path,
        wordCount: newVal
      })
    }
  }
)

// 监听文件变化 (切换章节时重置统计)
watch(
  () => editorStore.file,
  (newFile) => {
    // 获取新文件的路径标识
    const newFilePath = newFile ? `${newFile.bookName}_${newFile.type}_${newFile.name || newFile.path}` : null
    
    // 只有当文件路径真正改变时才重置统计
    // 如果 lastFilePath 为 null,说明是首次加载,不重置
    // 如果 lastFilePath 和新的路径不同,说明切换了章节/笔记,需要重置
    const isFileChanged = lastFilePath.value !== null && lastFilePath.value !== newFilePath
    
    if (isFileChanged) {
      // 切换章节/笔记时重置统计
      resetStats()
    }
    
    // 更新记录的文件路径
    lastFilePath.value = newFilePath
  }
)

onMounted(() => {
  // 启动实时时间更新 (每秒更新)
  updateCurrentTime()
  timeUpdateTimer = setInterval(() => {
    updateCurrentTime()
    updateStats() // 同时更新统计数据
  }, 1000)

  // 尝试从 store 恢复会话统计数据
  if (editorStore.sessionStats) {
    try {
      const savedStats = editorStore.sessionStats
      
      // 恢复基础数据
      typingStats.value = { ...savedStats }
      
      // 处理时间暂停：计算组件未挂载期间的时长
      // 这段时间应该完全忽略，既不计入活跃时长，也不计入空闲时长
      if (savedStats.saveTime) {
        const now = Date.now()
        const pauseDuration = now - savedStats.saveTime
        
        if (pauseDuration > 0) {
          // 将所有时间戳往后推，相当于这段时间“冻结”了
          if (typingStats.value.startTime) {
            typingStats.value.startTime += pauseDuration
          }
          if (typingStats.value.lastInputTime) {
            typingStats.value.lastInputTime += pauseDuration
          }
          if (typingStats.value.statusStartTime) {
            typingStats.value.statusStartTime += pauseDuration
          }
        }
      }
      
      // 打印调试信息
      console.log('恢复统计数据(已调整时间戳):', {
        saved: savedStats,
        restored: typingStats.value,
        now: Date.now(),
        pauseDuration: savedStats.saveTime ? Date.now() - savedStats.saveTime : 0
      })
      
      // 恢复后立即更新一次统计
      updateStats()
    } catch (e) {
      console.error('恢复会话统计失败:', e)
      resetStats()
    }
  }
})

onBeforeUnmount(() => {
  // 保存会话统计数据到 store
  // 记录保存时间，以便恢复时计算暂停时长
  if (typingStats.value.startTime) { // 只有在已经开始统计的情况下才保存
    editorStore.saveSessionStats({
      ...typingStats.value,
      saveTime: Date.now()
    })
  }

  // 清除定时器
  if (timeUpdateTimer) {
    clearInterval(timeUpdateTimer)
    timeUpdateTimer = null
  }
  if (idleCheckTimer) {
    clearInterval(idleCheckTimer)
    idleCheckTimer = null
  }
})

// 提供给父组件调用的刷新方法
defineExpose({
  loadBookTotalWords,
  resetStats
})
</script>

<style lang="scss" scoped>
.editor-stats {
  height: auto;
  min-height: 28px;
  width: 100%;
  line-height: 28px;
  padding: 0px 15px;
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-mute);
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  color: var(--text-base);

  &-left {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
    
    .stat-item {
      color: var(--text-base);
      white-space: nowrap;
    }
    
    .stat-divider {
      color: var(--text-base);
      font-weight: 300;
    }
  }
  
  &-right {
    display: flex;
    align-items: center;
    gap: 10px;
    
    .current-time {
      color: var(--text-secondary);
      font-size: 13px;
      white-space: nowrap;
    }
  }
}
</style>

