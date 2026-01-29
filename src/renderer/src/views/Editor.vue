<template>
  <div class="editor-container" :class="{ 'fullscreen-mode': isFullscreenMode }">
    <!-- 顶部工具栏 - 全屏模式下隐藏 -->
    <EditorToolbar v-if="!isFullscreenMode" class="top-toolbar" />
    
    <div class="editor-content">
      <!-- 正常模式 -->
      <el-splitter v-if="!isFullscreenMode" style="height: 100%;">
        <el-splitter-panel :size="NoteChapterSize">
          <!-- 笔记章节面板 -->
          <NoteChapter ref="noteChapterRef" :book-name="bookName" />
        </el-splitter-panel>
        
        <el-splitter-panel>
          <el-splitter style="height: 100%;">
            <el-splitter-panel>
              <!-- 中间编辑区 -->
              <EditorPanel
                ref="editorPanelRef"
                :book-name="bookName"
                :is-fullscreen-mode="false"
                @editor-ready="handleEditorReady"
                @refresh-notes="refreshNotes"
                @refresh-chapters="refreshChapters"
                @jail-mode-change="handleJailModeChange"
                @chapter-word-count-updated="handleChapterWordCountUpdate"
                @toggle-fullscreen="toggleFullscreen"
              />
            </el-splitter-panel>
            <el-splitter-panel :size="aiSidebarSize">
              <!-- 右侧 AI 操作面板 -->
              <AISidebar ref="aiSidebarRef" />
            </el-splitter-panel>
          </el-splitter>
        </el-splitter-panel>
      </el-splitter>
      
      <!-- 全屏模式 - 纯内容显示 -->
      <div v-else class="fullscreen-content-wrapper"> <!-- 全屏内容包装容器 -->
        <div class="fullscreen-editor-content"> <!-- 全屏编辑器内容容器 -->
          <EditorPanel  
            ref="editorPanelRef"  
            :book-name="bookName"   
            :is-fullscreen-mode="true"  
            @editor-ready="handleEditorReady"   
            @refresh-notes="refreshNotes" 
            @refresh-chapters="refreshChapters"   
            @jail-mode-change="handleJailModeChange"  
            @chapter-word-count-updated="handleChapterWordCountUpdate"  
            @toggle-fullscreen="toggleFullscreen"   
          /> <!-- 结束编辑器面板 -->
          <!-- 右下角时间显示 - 已移至编辑器容器内部 -->
          <div class="fullscreen-clock">{{ currentTime }}</div> <!-- 显示当前时间 -->
        </div> <!-- 结束全屏编辑器内容容器 -->
      </div> <!-- 结束全屏内容包装容器 -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, provide } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from '@renderer/stores/theme'
import { useJailStore } from '@renderer/stores/jail'
import NoteChapter from '@renderer/components/Editor/NoteChapter.vue'
import EditorPanel from '@renderer/components/Editor/EditorPanel.vue'
import EditorToolbar from '@renderer/components/Editor/EditorToolbar.vue'
import AISidebar from '@renderer/components/Editor/AISidebar.vue'

const route = useRoute()
const themeStore = useThemeStore()
const jailStore = useJailStore()

// 解析新窗口参数
let bookName = null
if (window.process && window.process.argv) {
  // Electron 传递的 additionalArguments
  for (const arg of window.process.argv) {
    if (arg.startsWith('bookName=')) bookName = decodeURIComponent(arg.replace('bookName=', ''))
  }
}
if (!bookName) {
  // 回退到 hash/query
  bookName = route.query.name
}

const isMaximized = ref(false)

// 全屏模式状态
const isFullscreenMode = ref(false)
// 当前时间（用于全屏模式显示）
const currentTime = ref('')
let timeUpdateInterval = null

// 更新时间显示
function updateTime() {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  currentTime.value = `${hours}:${minutes}`
}

// 切换全屏模式
async function toggleFullscreen(forceState) {
  // 如果提供了 forceState，则使用该值；否则切换当前状态
  const newState = typeof forceState === 'boolean' ? forceState : !isFullscreenMode.value
  
  // 如果状态没有变化，则不做任何操作（防止重复触发）
  if (isFullscreenMode.value === newState) return
  
  // 在切换模式前，尝试保存当前编辑器的内容到 store 中，确保状态同步
  if (editorPanelRef.value && editorPanelRef.value.saveContent) {
    try {
      await editorPanelRef.value.saveContent()
      console.log('[编辑器] 切换模式前已保存内容')
    } catch (error) {
      console.error('[编辑器] 切换模式前保存内容失败:', error)
    }
  }
  
  isFullscreenMode.value = newState
  
  // 同步 Electron 窗口的全屏状态
  if (window.electron) {
    if (newState) {
      // 进入全屏模式：如果当前不是全屏，则设置为全屏
      const isCurrentlyFullScreen = await window.electron.isFullScreen()
      if (!isCurrentlyFullScreen) {
        await window.electron.setFullScreen(true)
      }
    } else {
      // 退出全屏模式：如果当前是全屏，则退出全屏
      const isCurrentlyFullScreen = await window.electron.isFullScreen()
      if (isCurrentlyFullScreen) {
        await window.electron.setFullScreen(false)
      }
    }
  }
  
  if (isFullscreenMode.value) {
    // 进入全屏模式，启动时间更新
    updateTime()
    timeUpdateInterval = setInterval(updateTime, 1000)
  } else {
    // 退出全屏模式，停止时间更新
    if (timeUpdateInterval) {
      clearInterval(timeUpdateInterval)
      timeUpdateInterval = null
    }
  }
}

// 更新侧边栏宽度的统一逻辑
const updateSidebarSizes = () => {
  if (jailStore.isJailModeActive || isMaximized.value) {
    aiSidebarSize.value = 275
    NoteChapterSize.value = 275
  } else {
    aiSidebarSize.value = 260
    NoteChapterSize.value = 230
  }
}

// 动态更新窗口标题
onMounted(async () => {
  if (bookName) {
    document.title = `${bookName} - 柚子写作`
  }
  // 初始化主题
  await themeStore.initTheme()
  
  // 初始化窗口最大化状态
  if (window.electron?.isMaximized) {
    isMaximized.value = await window.electron.isMaximized()
  }

  // 监听窗口最大化事件
  if (window.electron?.onMaximize) {
    window.electron.onMaximize(() => {
      isMaximized.value = true
      updateSidebarSizes()
    })
  }
  
  if (window.electron?.onUnmaximize) {
    window.electron.onUnmaximize(() => {
      isMaximized.value = false
      updateSidebarSizes()
    })
  }

  // 初始化侧边栏宽度
  updateSidebarSizes()
  
  // 监听快捷键触发事件
  if (window.electron?.onShortcutTriggered) {
    window.electron.onShortcutTriggered(handleShortcut)
  }

  // 注册全局键盘监听，用于 Esc 退出全屏
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  // 清理全局键盘监听
  window.removeEventListener('keydown', handleGlobalKeydown)
  
  // 清理快捷键监听器
  // 注意：preload中的实现是直接on，没有提供off方法
  // 如果需要清理，需要在preload中添加对应的removeListener
  
  // 清理时间更新定时器
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval)
    timeUpdateInterval = null
  }
})

const noteChapterRef = ref(null)
const editorPanelRef = ref(null)
const aiSidebarRef = ref(null)
const aiSidebarSize = ref(260)
const NoteChapterSize = ref(230)

// 提供编辑器实例给子组件（通过 EditorPanel 的 ref 访问）
const editorInstance = ref(null)
provide('editorInstance', editorInstance)

// 处理编辑器就绪事件
const handleEditorReady = (editor) => {
  editorInstance.value = editor
  console.log('编辑器已就绪:', editor)
}

// 处理专注模式状态变化：同步更新侧边栏宽度
const handleJailModeChange = (isActive) => {
  if (isActive || isMaximized.value) {
    aiSidebarSize.value = 275;
    NoteChapterSize.value = 275
  } else {
    aiSidebarSize.value = 260;
    NoteChapterSize.value = 230
  }
}

function refreshNotes() {
  noteChapterRef.value && noteChapterRef.value.reloadNotes && noteChapterRef.value.reloadNotes()
}

function refreshChapters() {
  noteChapterRef.value &&
    noteChapterRef.value.reloadChapters &&
    noteChapterRef.value.reloadChapters()
}

function handleChapterWordCountUpdate({ path, wordCount }) {
  noteChapterRef.value &&
    noteChapterRef.value.updateChapterWordCount &&
    noteChapterRef.value.updateChapterWordCount(path, wordCount)
}

// 处理快捷键触发
const handleShortcut = (actionId) => {
  console.log('[编辑器] 收到快捷键:', actionId)
  
  switch (actionId) {
    case 'ai-result':
      // 切换AI生成结果浮窗
      if (aiSidebarRef.value?.toggleFloatingResult) {
        aiSidebarRef.value.toggleFloatingResult()
      }
      break
    // 可以在这里添加其他快捷键处理
    default:
      console.log('[编辑器] 未处理的快捷键:', actionId)
  }
}

// 处理全局按键事件
const handleGlobalKeydown = (event) => {
  // 如果按下 Esc 键且当前处于全屏阅读模式，则退出全屏
  if (event.key === 'Escape' && isFullscreenMode.value) {
    console.log('[编辑器] 检测到 Esc 键，退出全屏阅读模式')
    toggleFullscreen(false) // 明确指定退出全屏
  }
}

// function handleSelectFile(file) {
//   // 预留：可做高亮、聚焦等
// }

</script>

<style lang="scss" scoped>
.editor-container {
  height: 100vh;
  background-color: var(--bg-primary);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .top-toolbar {
    flex-shrink: 0;
  }

  .editor-content {
    flex: 1; // 占据剩余空间
    overflow: hidden; // 隐藏溢出内容
  }
  
  // 全屏模式样式
  &.fullscreen-mode {
    .editor-content {
      background-color: var(--bg-primary); /* 全屏模式背景色设为编辑器主背景色，移除关灯效果 */
      display: flex; /* 使用弹性布局 */
      justify-content: center; /* 水平居中内容 */
      align-items: stretch; /* 垂直方向拉伸填充 */
    }
    
    .fullscreen-content-wrapper {
      width: 100%; /* 占据全部宽度 */
      height: 100%; /* 占据全部高度 */
      display: flex; /* 使用弹性布局 */
      justify-content: center; /* 水平居中编辑器 */
      align-items: stretch; /* 垂直方向拉伸填充 */
      position: relative; /* 相对定位，用于内部绝对定位元素 */
    }
    
    .fullscreen-editor-content { /* 全屏编辑器内容样式 */
      width: 100%; /* 设置编辑器宽度占满整个屏幕宽度 */
      height: 100%; /* 占据全部高度 */
      background-color: var(--bg-primary); /* 使用编辑器主题背景色 */
      display: flex; /* 使用弹性布局 */
      flex-direction: column; /* 垂直排列子元素 */
      box-shadow: none; /* 移除阴影 */
      position: relative; /* 设置相对定位，用于内部元素定位 */
    } /* 结束全屏编辑器内容样式 */
    
    .fullscreen-clock { /* 全屏模式下的时间显示样式 */
      position: absolute; /* 使用绝对定位 */
      right: 20px; /* 距离编辑器右边 20px */
      bottom: 20px; /* 距离编辑器底部 20px */
      font-size: 18px; /* 调整字体大小 */
      font-weight: 300; /* 设置字体粗细 */
      color: var(--text-secondary); /* 使用主题次要文字颜色 */
      opacity: 0.5;   
      font-family: 'Arial', sans-serif;   
      user-select: none;  
      pointer-events: none;   
      z-index: 10;  
    }   
  }
}
</style>
