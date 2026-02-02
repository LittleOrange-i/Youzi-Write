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
import { useRoute } from 'vue-router'
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
const route = useRoute()

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
  
  initialBookWords: 0,        // 打开书籍时的初始总字数（作为统计基准）
  isPaused: false,            // 是否暂停统计（离开页面或不可见）
  isInitializingBaseline: true // 默认开启基准初始化，确保刚进入时的总字数作为基准而非打字数
})

// 记录已上报的时长，用于增量同步
let lastReportedDuration = 0

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
  const hours = Math.floor(seconds / 3600) // 计算小时数
  const mins = Math.floor((seconds % 3600) / 60) // 计算分钟数
  const secs = seconds % 60 // 计算剩余秒数
  
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}` // 返回补零后的格式化字符串
}

// 更新实时时间
function updateCurrentTime() {
  const now = new Date() // 获取当前日期对象
  const year = now.getFullYear() // 获取年份
  const month = String(now.getMonth() + 1).padStart(2, '0') // 获取月份并补零
  const day = String(now.getDate()).padStart(2, '0') // 获取日期并补零
  const hours = String(now.getHours()).padStart(2, '0') // 获取小时并补零
  const minutes = String(now.getMinutes()).padStart(2, '0') // 获取分钟并补零
  const seconds = String(now.getSeconds()).padStart(2, '0') // 获取秒数并补零
  currentTime.value = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}` // 拼接完整的时间字符串
}

// 计算码字速度 (字/小时)
function calculateSpeed() {
  if (typingStats.value.activeDuration === 0) { // 如果活跃时长为0
    return 0 // 速度为0
  }
  // 速度 = 字数 / 秒数 * 3600
  const speed = Math.floor((typingStats.value.wordsTyped / typingStats.value.activeDuration) * 3600) // 计算每小时平均字数
  // 最大值 20000
  if (speed > 20000) { // 如果速度异常过快
    return 20000 // 限制最大速度
  }
  return speed // 返回计算出的速度
}

// 更新统计数据 (状态机模式)
function updateStats() {
  // 如果未开始统计、已暂停或正在获取数据，则跳过
  if (!typingStats.value.startTime || typingStats.value.isPaused || isFetching.value) return // 状态校验

  const now = Date.now() // 获取当前时间戳
  const IDLE_THRESHOLD = 5000 // 5秒无输入进入空闲阈值

  if (!typingStats.value.isIdle) { // 如果当前处于活跃状态
    // === 当前状态：活跃 ===
    
    // 检查是否超时
    if (now - typingStats.value.lastInputTime > IDLE_THRESHOLD) { // 如果距离上次输入超过阈值
      // -> 切换到空闲状态
      
      // 1. 结算活跃段 (活跃只算到 lastInputTime + 5s)
      const activeSegmentEnd = typingStats.value.lastInputTime + IDLE_THRESHOLD // 活跃段截止时间
      const activeSegmentDuration = activeSegmentEnd - typingStats.value.statusStartTime // 计算本次活跃时长
      
      typingStats.value.accumulatedActive += Math.max(0, activeSegmentDuration) // 累加到总活跃时长
      
      // 2. 切换状态
      typingStats.value.isIdle = true // 标记为空闲
      typingStats.value.statusStartTime = activeSegmentEnd // 记录空闲开始时间
      
      // 3. 更新显示
      const currentIdleDuration = now - typingStats.value.statusStartTime // 计算当前空闲时长
      typingStats.value.idleDuration = Math.floor((typingStats.value.accumulatedIdle + currentIdleDuration) / 1000) // 更新空闲秒数
      typingStats.value.activeDuration = Math.floor(typingStats.value.accumulatedActive / 1000) // 更新活跃秒数
      
    } else {
      // -> 保持活跃状态
      const currentActiveDuration = now - typingStats.value.statusStartTime // 计算当前段活跃时长
      typingStats.value.activeDuration = Math.floor((typingStats.value.accumulatedActive + currentActiveDuration) / 1000) // 更新活跃秒数
      typingStats.value.idleDuration = Math.floor(typingStats.value.accumulatedIdle / 1000) // 更新空闲秒数
    }
  } else {
    // === 当前状态：空闲 ===
    const currentIdleDuration = now - typingStats.value.statusStartTime // 计算当前段空闲时长
    typingStats.value.idleDuration = Math.floor((typingStats.value.accumulatedIdle + currentIdleDuration) / 1000) // 更新空闲秒数
    typingStats.value.activeDuration = Math.floor(typingStats.value.accumulatedActive / 1000) // 更新活跃秒数
  }
  
  // 更新速度
  typingStats.value.speed = calculateSpeed() // 重新计算并更新速度
}

// 重置统计
function resetStats() {
  typingStats.value = {
    wordsTyped: 0, // 码字数归零
    speed: 0, // 速度归零
    
    startTime: null, // 开始时间清空
    lastInputTime: null, // 最后输入时间清空
    
    isIdle: false, // 状态设为活跃
    statusStartTime: null, // 状态开始时间清空
    
    accumulatedActive: 0, // 累计活跃时长清空
    accumulatedIdle: 0, // 累计空闲时长清空
    
    activeDuration: 0, // 活跃秒数清空
    idleDuration: 0, // 空闲秒数清空
    
    initialBookWords: 0, // 初始书籍字数清空
    isPaused: false, // 暂停状态设为否
    isInitializingBaseline: true // 重置时重新开启基准初始化
  }
}

// 开始统计 (第一个字输入时)
function startStats(currentBookWords) {
  if (!typingStats.value.startTime) { // 如果尚未开始统计
    const now = Date.now() // 获取当前时间戳
    typingStats.value.startTime = now // 记录总开始时间
    typingStats.value.initialBookWords = currentBookWords // 记录书籍初始字数基准
    typingStats.value.lastInputTime = now // 记录最后输入时间
    
    // 初始化状态机
    typingStats.value.isIdle = false // 设为活跃状态
    typingStats.value.statusStartTime = now // 记录活跃段开始时间
    
    // 重置上报基准
    lastReportedDuration = 0
  }
}

// 上报增量时长到后端
async function reportDurationIncrement() {
  if (!props.bookName || typingStats.value.activeDuration <= lastReportedDuration) return
  
  const increment = typingStats.value.activeDuration - lastReportedDuration
  try {
    await window.electron.updateTypingDuration(props.bookName, increment)
    lastReportedDuration = typingStats.value.activeDuration
    console.log(`[时长统计] 增量上报成功: ${increment}s, 当前总计: ${lastReportedDuration}s`)
  } catch (error) {
    console.error('[时长统计] 上报失败:', error)
  }
}

// 处理字数变化 (基于书籍总字数)
function handleWordCountChange(newTotalWords, oldTotalWords) {
  // 如果书籍字数尚未加载完成，不进行统计
  if (!editorStore.bookWordsLoaded) return // 校验书籍数据加载状态

  // 1. 初始化基准：如果处于初始化状态，将当前字数设为基准，不计入码字
  if (typingStats.value.isInitializingBaseline) { // 检查是否需要初始化基准
    typingStats.value.initialBookWords = newTotalWords // 设置初始基准为当前总字数
    typingStats.value.isInitializingBaseline = false // 完成初始化
    typingStats.value.wordsTyped = 0 // 强制码字数为0
    return // 结束处理，不触发后续输入逻辑
  }

  // 2. 动态调整基准线：如果当前书籍总字数低于初始基准，说明删除了历史存量，下调基准
  // 这样可以避免"填坑"现象
  if (typingStats.value.startTime && newTotalWords < typingStats.value.initialBookWords) { // 检查是否删减了字数
    typingStats.value.initialBookWords = newTotalWords // 调低基准以抵消删减
  }

  // 3. 如果字数增加, 说明有输入
  // 只有在明确知道字数增加（oldTotalWords 存在且小于 newTotalWords）时才更新输入时间
  if (oldTotalWords !== undefined && newTotalWords > oldTotalWords) { // 检查是否有实际新增
    const now = Date.now() // 获取当前时间戳
    
    // 如果是第一次输入, 开始统计
    if (!typingStats.value.startTime) { // 检查是否是首次输入
      startStats(oldTotalWords) // 初始化统计基准
    } else {
      // 只有在已开始统计后，才更新 lastInputTime
      typingStats.value.lastInputTime = now // 更新最后输入时间
      
      // 如果之前处于空闲状态，切换回活跃状态
      if (typingStats.value.isIdle) { // 检查是否从空闲恢复
        // 1. 结算空闲段
        const idleSegmentDuration = now - typingStats.value.statusStartTime // 计算本次空闲时长
        typingStats.value.accumulatedIdle += Math.max(0, idleSegmentDuration) // 累加到总空闲时长
        
        // 2. 切换状态
        typingStats.value.isIdle = false // 标记为活跃
        typingStats.value.statusStartTime = now // 记录新活跃段开始时间
      }
    }
  }
  
  // 4. 更新码字数量 (基于书籍总字数的增量)
  if (typingStats.value.startTime) { // 如果已经开始统计
    // 计算净增字数 (当前书籍总字数 - 初始书籍总字数)
    const netWords = newTotalWords - typingStats.value.initialBookWords // 计算差值
    // 确保显示的码字数量不为负数
    typingStats.value.wordsTyped = Math.max(0, netWords) // 更新显示的码字数
  }
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
  (newTotal, oldTotal) => {
    // 处理书籍总字数的业务逻辑 (同步到父组件)
    emit('update-book-words', sanitizeWordCount(newTotal))
    
    // 处理码字统计逻辑 (增量计算)
    handleWordCountChange(newTotal, oldTotal)
  },
  { immediate: true }
)

// 监听章节字数变化
watch(
  () => props.contentWordCount,
  (newVal, oldVal) => {
    if (oldVal === undefined) return
    // 此处仅负责同步章节树的字数显示，码字逻辑已移至 bookTotalWords 监听中
    if (editorStore.file?.type === 'chapter' && editorStore.file?.path) {
      emit('update-chapter-word-count', {
        path: editorStore.file.path,
        wordCount: newVal
      })
    }
  }
)

// 监听文件变化 (不重置统计，支持跨章节累加)
watch(
  () => editorStore.file,
  (newFile) => {
    // 获取新文件的路径标识
    const newFilePath = newFile ? `${newFile.bookName}_${newFile.type}_${newFile.name || newFile.path}` : null
    
    // 更新记录的文件路径，但不重置统计
    lastFilePath.value = newFilePath
  }
)

// 处理页面可见性变化
function handleVisibilityChange() {
  const isHidden = document.visibilityState === 'hidden'
  typingStats.value.isPaused = isHidden
  
  if (isHidden) {
    // 隐藏时，如果处于活跃状态，结算当前活跃段并转为空闲，避免活跃时间在后台继续累加
    if (typingStats.value.startTime && !typingStats.value.isIdle) {
      const now = Date.now()
      const activeSegmentDuration = now - typingStats.value.statusStartTime
      typingStats.value.accumulatedActive += Math.max(0, activeSegmentDuration)
      
      // 切换到空闲状态，状态开始时间设为现在
      typingStats.value.isIdle = true
      typingStats.value.statusStartTime = now
    }
  } else {
    // 恢复可见时，重新同步状态开始时间
    if (typingStats.value.startTime) {
      typingStats.value.statusStartTime = Date.now()
    }
  }
}

onMounted(() => {
  // 启动实时时间更新 (每秒更新)
  updateCurrentTime()
  let reportCounter = 0
  timeUpdateTimer = setInterval(() => {
    updateCurrentTime()
    updateStats() // 同时更新统计数据
    
    // 每 10 秒尝试上报一次增量时长
    reportCounter++
    if (reportCounter >= 10) {
      reportDurationIncrement()
      reportCounter = 0
    }
  }, 1000)

  // 监听可见性变化
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // 检查是否是从书架进入（带 reset 参数），如果是则重置统计
  const shouldReset = route.query.reset === 'true' // 获取路由中的重置标记
  
  if (shouldReset) { // 如果需要重置
    console.log('从书架进入，重置码字统计') // 打印重置日志
    resetStats() // 执行统计数据重置（resetStats内部已包含 isInitializingBaseline = true）
    // 同时也清除 store 中的旧会话，防止干扰
    editorStore.saveSessionStats(null) // 清除全局存储的旧统计数据
  } else if (editorStore.sessionStats) { // 如果不是重置且存在已保存的会话数据
    // 尝试从 store 恢复会话统计数据
    try { // 开始尝试恢复流程
      const savedStats = editorStore.sessionStats // 获取保存的统计数据
      
      // 恢复基础数据
      typingStats.value = { ...savedStats, isInitializingBaseline: false } // 恢复数据并确保关闭初始化状态
      
      // 处理时间暂停：计算组件未挂载期间的时长
      // 这段时间应该完全忽略，既不计入活跃时长，也不计入空闲时长
      if (savedStats.saveTime) { // 如果有记录保存时间
        const now = Date.now() // 获取当前时间戳
        const pauseDuration = now - savedStats.saveTime // 计算暂停持续时长
        
        if (pauseDuration > 0) { // 如果暂停时长大于0
          // 将所有时间戳往后推，相当于这段时间“冻结”了
          if (typingStats.value.startTime) { // 如果已经开始统计
            typingStats.value.startTime += pauseDuration // 调整开始时间
          }
          if (typingStats.value.lastInputTime) { // 如果有最后输入记录
            typingStats.value.lastInputTime += pauseDuration // 调整最后输入时间
          }
          if (typingStats.value.statusStartTime) { // 如果有状态开始记录
            typingStats.value.statusStartTime += pauseDuration // 调整状态切换时间
          }
        }
      }
      
      // 打印调试信息
      console.log('恢复统计数据(已调整时间戳):', { // 打印恢复成功的调试日志
        saved: savedStats,
        restored: typingStats.value,
        now: Date.now(),
        pauseDuration: savedStats.saveTime ? Date.now() - savedStats.saveTime : 0
      })
      
      // 恢复后立即更新一次统计
      updateStats() // 立即触发一次统计计算以同步状态
    } catch (e) { // 捕获恢复过程中的异常
      console.error('恢复会话统计失败:', e) // 打印错误信息
      resetStats() // 恢复失败时降级执行重置
    }
  }
})

onBeforeUnmount(async () => {
  // 移除可见性变化监听
  document.removeEventListener('visibilitychange', handleVisibilityChange)

  // 结算并上报最后的时长
  await reportDurationIncrement()

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

