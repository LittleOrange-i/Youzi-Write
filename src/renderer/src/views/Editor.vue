<template>
  <div class="editor-container">
    <!-- 顶部工具栏 -->
    <EditorToolbar class="top-toolbar" />
    
    <div class="editor-content">
      <el-splitter style="height: 100%;">
        <el-splitter-panel :size="200">
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
              />
            </el-splitter-panel>
            <el-splitter-panel :size="260">
              <!-- 右侧 AI 操作面板 -->
              <AISidebar />
            </el-splitter-panel>
          </el-splitter>
        </el-splitter-panel>
      </el-splitter>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, provide } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from '@renderer/stores/theme'
import NoteChapter from '@renderer/components/Editor/NoteChapter.vue'
import EditorPanel from '@renderer/components/Editor/EditorPanel.vue'
import EditorToolbar from '@renderer/components/Editor/EditorToolbar.vue'
import AISidebar from '@renderer/components/Editor/AISidebar.vue'

const route = useRoute()
const themeStore = useThemeStore()

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

// 动态更新窗口标题
onMounted(async () => {
  if (bookName) {
    document.title = `${bookName} - 柚子写作`
  }
  // 初始化主题
  await themeStore.initTheme()
})

const noteChapterRef = ref(null)
const editorPanelRef = ref(null)

// 提供编辑器实例给子组件（通过 EditorPanel 的 ref 访问）
const editorInstance = ref(null)
provide('editorInstance', editorInstance)

// 处理编辑器就绪事件
const handleEditorReady = (editor) => {
  editorInstance.value = editor
  console.log('编辑器已就绪:', editor)
}

function refreshNotes() {
  noteChapterRef.value && noteChapterRef.value.reloadNotes && noteChapterRef.value.reloadNotes()
}

function refreshChapters() {
  noteChapterRef.value &&
    noteChapterRef.value.reloadChapters &&
    noteChapterRef.value.reloadChapters()
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
