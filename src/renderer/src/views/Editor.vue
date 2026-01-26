<template>
  <div class="editor-container">
    <!-- 顶部工具栏 -->
    <EditorToolbar class="top-toolbar" />
    
    <div class="editor-content">
      <el-splitter style="height: 100%;">
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
                @editor-ready="handleEditorReady"
                @refresh-notes="refreshNotes"
                @refresh-chapters="refreshChapters"
                @jail-mode-change="handleJailModeChange"
                @chapter-word-count-updated="handleChapterWordCountUpdate"
              />
            </el-splitter-panel>
            <el-splitter-panel :size="aiSidebarSize">
              <!-- 右侧 AI 操作面板 -->
              <AISidebar ref="aiSidebarRef" />
            </el-splitter-panel>
          </el-splitter>
        </el-splitter-panel>
      </el-splitter>
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
})

onUnmounted(() => {
  // 清理快捷键监听器
  // 注意：preload中的实现是直接on，没有提供off方法
  // 如果需要清理，需要在preload中添加对应的removeListener
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
    flex: 1;
    overflow: hidden;
  }
}
</style>
