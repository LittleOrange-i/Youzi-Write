<template>
  <div class="editor-panel">
    <!-- 菜单栏 -->
    <EditorMenubar
      v-model="menubarState"
      :editor="editor"
      :book-name="bookName"
      @toggle-search="toggleSearchPanel"
      @save="saveContent"
      @export="handleExport"
      @update-style="handleStyleUpdate"
    />
    <!-- 章节标题 -->
    <div class="chapter-title">
      <el-input
        v-model="chapterTitle"
        placeholder="章节标题"
        maxlength="20"
        class="chapter-title-input"
        @blur="handleTitleBlur"
      />
      <!-- 人物高亮开关 -->
      <el-switch
        v-if="editorStore.file?.type === 'chapter'"
        v-model="characterHighlightEnabled"
        active-text="人物高亮"
        inactive-text="人物高亮"
        inline-prompt
        class="character-highlight-switch"
        @change="handleCharacterHighlightChange"
      />

      <!-- 禁词提示开关 -->
      <el-switch
        v-if="editorStore.file?.type === 'chapter'"
        v-model="bannedWordsHintEnabled"
        active-text="禁词提示"
        inactive-text="禁词提示"
        inline-prompt
        class="banned-words-hint-switch"
        @change="handleBannedWordsHintChange"
      />
      <!-- 段落字数校验按钮 -->
      <el-button
        v-if="editorStore.file?.type === 'chapter'"
        type="soft"
        size="small"
        class="paragraph-check-button"
        @click="checkParagraphLength"
      >
        段落字数校验
      </el-button>
      <!-- 坐牢模式按钮：坐牢模式激活时禁用按钮 -->
      <el-button
        v-if="editorStore.file?.type === 'chapter'"
        type="danger"
        size="small"
        class="jail-mode-button"
        style="margin-left: 10px;"
        :disabled="isJailModeActive"
        @click="openJailModeDialog"
      >
        {{ isJailModeActive ? '坐牢中...' : '坐牢模式' }}
      </el-button>
    </div>
    <!-- 正文内容编辑区 -->
    <EditorContent 
      class="editor-content" 
      :editor="editor" 
      @keydown="updateActivity" 
      @mousemove="updateActivity"
      @click="updateActivity"
    />
    <!-- 编辑器内容配置组件（隐藏，仅提供逻辑） -->
    <ChapterEditorContent
      ref="chapterEditorContentRef"
      :editor-store="editorStore"
      :menubar-state="menubarState"
      :is-composing="isComposing"
      :get-font-family="getFontFamily"
      :auto-save-content="autoSaveContent"
    />
    <NoteEditorContent
      ref="noteEditorContentRef"
      :editor-store="editorStore"
      :menubar-state="menubarState"
      :is-composing="isComposing"
      :get-font-family="getFontFamily"
      :auto-save-content="autoSaveContent"
    />
    <!-- 码字进度 -->
    <EditorProgress
      v-if="editorStore.file?.type === 'chapter'"
      :current-words="contentWordCount"
      :target-words="editorStore.chapterTargetWords"
      :book-name="bookName"
    />
    <!-- 编辑器统计 -->
    <EditorStats
      v-if="editorStore.file?.type === 'chapter'"
      ref="editorStatsRef"
      :book-name="bookName"
      :content-word-count="contentWordCount"
      :file-type="editorStore.file?.type"
    />

    <!-- 搜索面板 -->
    <SearchPanel :visible="searchPanelVisible" :editor="editor" @close="closeSearchPanel" />
    
    <!-- 段落字数校验结果弹窗 -->
    <el-dialog
      v-model="paragraphCheckDialogVisible"
      title="段落字数校验结果"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-if="overLengthParagraphs.length === 0" class="check-result-empty">
        <el-empty description="所有段落字数均符合要求" />
      </div>
      <div v-else class="check-result-list">
        <div class="result-summary">
          共发现 <span class="highlight-number">{{ overLengthParagraphs.length }}</span> 个超标段落
          （阈值：{{ editorStore.paragraphMaxLength }} 字）
        </div>
        <el-scrollbar height="400px">
          <div
            v-for="(item, index) in overLengthParagraphs"
            :key="index"
            class="paragraph-item"
            @click="jumpToParagraph(item)"
          >
            <div class="paragraph-header">
              <span class="paragraph-index">段落 {{ index + 1 }}</span>
              <span class="paragraph-length">{{ item.length }} 字</span>
              <span class="over-length">超出 {{ item.length - editorStore.paragraphMaxLength }} 字</span>
            </div>
            <div class="paragraph-preview">{{ item.preview }}</div>
          </div>
        </el-scrollbar>
      </div>
      <template #footer>
        <el-button type="primary" @click="paragraphCheckDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 坐牢模式设置弹窗 -->
    <el-dialog
      v-model="jailModeDialogVisible"
      title="请谨慎开启本功能"
      width="500px"
      :close-on-click-modal="false"
      class="jail-mode-dialog"
      append-to-body
    >
      <div class="jail-mode-warning" style="margin-bottom: 20px; color: #666; line-height: 1.6;">
        <p style="margin-bottom: 10px;">当开启坐牢模式后，码字界面将会被锁定，<span style="color: #f56c6c; font-weight: bold;">无法退出码字界面，无法打开电脑其他软件</span>。只有完成设定的字数，或达到设定的时间，才会解除锁定。</p>
        <p>当设定的目标完成后，30秒内将会解锁，只有持续正常创作才会计入任务进度，非正常输入、粘贴、闲置等不被计入任务进度。</p>
      </div>

      <div class="jail-mode-form">
        <div class="form-item" style="margin-bottom: 20px; display: flex; align-items: center;">
          <span class="label" style="width: 80px; font-weight: bold;">坐牢模式</span>
          <div class="radio-group">
            <el-button 
              :type="jailModeType === 'word' ? 'primary' : 'default'" 
              @click="jailModeType = 'word'"
            >
              字数模式
            </el-button>
            <el-button 
              :type="jailModeType === 'time' ? 'primary' : 'default'" 
              @click="jailModeType = 'time'"
              style="margin-left: 10px;"
            >
              时长模式
            </el-button>
          </div>
        </div>

        <div class="form-item" style="display: flex; align-items: center;">
          <span class="label" style="width: 80px; font-weight: bold;">坐牢目标</span>
          <el-input 
            v-model="jailTarget" 
            :placeholder="jailModeType === 'word' ? '请输入目标，范围1-20000字' : '请输入目标，范围1-360分钟'"
            type="number"
            style="flex: 1;"
          />
        </div>
      </div>

      <template #footer>
        <div style="text-align: right;">
          <el-button @click="jailModeDialogVisible = false">取消</el-button>
          <el-button type="info" color="#4b4b4b" @click="startJailMode">开始坐牢</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 坐牢模式状态浮窗 -->
    <!-- 浮窗已移至 App.vue 中统一管理 -->
  </div>

</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import { EditorContent } from '@tiptap/vue-3'
import { TextSelection } from 'prosemirror-state'
import { useEditorStore } from '@renderer/stores/editor'
import { useJailStore } from '@renderer/stores/jail'
import SearchPanel from '@renderer/components/Editor/SearchPanel.vue'
import EditorMenubar from '@renderer/components/Editor/EditorMenubar.vue'
import EditorStats from '@renderer/components/Editor/EditorStats.vue'
import EditorProgress from '@renderer/components/Editor/EditorProgress.vue'
import ChapterEditorContent from '@renderer/components/Editor/ChapterEditorContent.vue'
import NoteEditorContent from '@renderer/components/Editor/NoteEditorContent.vue'

const editorStore = useEditorStore()
const route = useRoute()

// 检查是否需要重置编辑会话（仅当从书架进入时，带有 reset=true 参数）
// 在 setup 中执行，确保早于子组件挂载
if (route.query.reset === 'true') {
  editorStore.resetEditingSession()
}

const props = defineProps({
  bookName: String
})

const isMounted = ref(false)

const emit = defineEmits(['refresh-notes', 'refresh-chapters', 'editor-ready', 'jail-mode-change'])

// 默认高亮颜色（当人物没有设置标记颜色时使用）
const defaultHighlightColor = '#e198b8'

// 编辑器实例
const editor = ref(null)

  watch(
    () => props.bookName,
    (name) => {
      if (name) {
        editorStore.currentBookName = name
        // 书籍切换时，加载对应书籍的人物高亮开关状态
        loadCharacterHighlightState(name)
        // 书籍切换时，加载对应书籍的禁词提示开关状态
        loadBannedWordsHintState(name)
      }
    },
    { immediate: true }
  )

// 计算属性
const contentWordCount = computed(() => editorStore.contentWordCount)

// EditorStats 组件引用
const editorStatsRef = ref(null)

const chapterTitle = computed({
  get: () => editorStore.chapterTitle,
  set: (val) => editorStore.setChapterTitle(val)
})

// 字体映射表：为每种字体提供完整的字体族配置（包含回退字体）
const fontFamilyMap = {
  inherit: '',
  SimSun: "'STSong', 'SimSun', 'NSimSun', '宋体', serif",
  SimHei: "'SimHei', '黑体', 'STHeiti', sans-serif",
  KaiTi: "'STKaiti', 'KaiTi', '楷体', serif",
  FangSong: "'FangSong', '仿宋', 'STFangsong', serif",
  SourceHanSans: "'Noto Sans CJK SC', 'Source Han Sans SC', '思源黑体', 'PingFang SC', sans-serif",
  SourceHanSerif: "'Noto Serif CJK SC', 'Source Han Serif SC', '思源宋体', 'SimSun', serif",
  PingFang: "'PingFang SC', '苹方', 'Hiragino Sans GB', 'STHeiti', sans-serif"
}

// 菜单栏状态
const menubarState = ref({
  fontFamily: 'SimHei',
  fontSize: '16px',
  lineHeight: '1.6',
  isBold: false,
  isItalic: false
})

let saveTimer = ref(null)
let styleUpdateTimer = null
let isComposing = false // 是否正在进行输入法输入（composition）
let compositionStartHandler = null
let compositionEndHandler = null
let isTitleSaving = false

// 编辑器内容组件引用
const chapterEditorContentRef = ref(null)
const noteEditorContentRef = ref(null)

// 人物高亮相关状态
const characterHighlightEnabled = ref(false) // 人物高亮开关状态，默认关闭
const characters = ref([]) // 人物数据列表
let characterHighlightTimer = null // 人物高亮定时器

// 段落字数校验相关状态
const paragraphCheckDialogVisible = ref(false) // 校验结果弹窗显示状态
const overLengthParagraphs = ref([]) // 超标段落列表

// 禁词提示相关状态
const bannedWordsHintEnabled = ref(false) // 禁词提示开关状态，默认关闭
const bannedWords = ref([]) // 禁词数据列表
let bannedWordsHintTimer = null // 禁词提示定时器

async function handleTitleBlur() {
  const fileType = editorStore.file?.type
  if (!fileType || (fileType !== 'chapter' && fileType !== 'note')) return
  if (isTitleSaving) return
  try {
    isTitleSaving = true
    await saveFile(false)
  } finally {
    isTitleSaving = false
  }
}

// 搜索面板状态
const searchPanelVisible = ref(false)

// 获取当前编辑器内容组件
function getEditorContentComponent() {
  const isNote = editorStore.file?.type === 'note'
  return isNote ? noteEditorContentRef.value : chapterEditorContentRef.value
}

// 获取完整的字体族配置
function getFontFamily(fontKey) {
  if (fontKey === 'inherit' || !fontKey) {
    return ''
  }
  // 检查是否是自定义字体（以 CustomFont_ 开头）
  if (fontKey.startsWith('CustomFont_')) {
    return `'${fontKey}', sans-serif`
  }
  // 使用预定义的字体映射
  return fontFamilyMap[fontKey] || `'${fontKey}', sans-serif`
}

// 更新编辑器样式
function updateEditorStyle() {
  if (!editor.value) return

  // TipTap的DOM结构：editor.view.dom 就是 .tiptap 元素
  const editorElement = editor.value.view.dom
  if (editorElement) {
    // 使用setProperty with 'important' 确保样式优先级最高
    // 获取完整的字体族配置（包含回退字体）
    const fullFontFamily = getFontFamily(menubarState.value.fontFamily)
    editorElement.style.setProperty('font-family', fullFontFamily, 'important')
    editorElement.style.setProperty('font-size', menubarState.value.fontSize, 'important')
    editorElement.style.setProperty('line-height', menubarState.value.lineHeight, 'important')
    // 根据文件类型设置首行缩进（章节：2em；笔记：0）
    const isChapter = editorStore.file?.type === 'chapter'
    editorElement.style.setProperty('text-indent', isChapter ? '2em' : '0', 'important')
  }
}

// 处理样式更新
function handleStyleUpdate() {
  updateEditorStyle()
  // 防抖保存设置
  if (styleUpdateTimer) clearTimeout(styleUpdateTimer)
  styleUpdateTimer = setTimeout(() => {
    editorStore.saveEditorSettings({
      fontFamily: menubarState.value.fontFamily,
      fontSize: menubarState.value.fontSize,
      lineHeight: menubarState.value.lineHeight,
      globalBoldMode: menubarState.value.isBold,
      globalItalicMode: menubarState.value.isItalic
    })
  }, 500)
}

// 处理导出事件
function handleExport() {
  // 导出功能已在 EditorMenubar 组件中实现，这里只需要处理事件
}

// 监听 store 内容变化，回显到编辑器
watch(
  () => editorStore.file,
  async (newFile, oldFile) => {
    // 如果编辑器不存在且新文件存在，初始化编辑器
    if (!editor.value && newFile) {
      try {
        await initEditor()
        await nextTick()
        setupCompositionHandlers()
        // 初始化后，initEditor 已经设置了内容，这里不需要再次设置
        // 如果是章节编辑器，等待内容渲染完成后加载状态并应用高亮/划线
        if (newFile?.type === 'chapter' && props.bookName) {
          await nextTick()
          await nextTick()
          await new Promise((resolve) => setTimeout(resolve, 50))
          await loadCharacterHighlightState(props.bookName)
          await loadBannedWordsHintState(props.bookName)
        }
        return
      } catch (error) {
        console.error('初始化编辑器失败:', error)
        return
      }
    }

    if (!newFile) return

    // 如果文件类型发生变化，需要重新初始化编辑器
    const fileTypeChanged = newFile?.type !== oldFile?.type

    if (fileTypeChanged && editor.value) {
      try {
        // 销毁旧编辑器
        editor.value.destroy()
        editor.value = null
        // 等待一下确保完全销毁
        await nextTick()
        // 重新初始化编辑器（initEditor 内部会设置内容）
        await initEditor()
        // 等待编辑器完全初始化
        await nextTick()
        setupCompositionHandlers()
        // 重新初始化后，initEditor 已经设置了内容，这里不需要再次设置
        // 如果是章节编辑器，等待内容渲染完成后加载状态并应用高亮/划线
        if (newFile?.type === 'chapter' && props.bookName) {
          await nextTick()
          await nextTick()
          await new Promise((resolve) => setTimeout(resolve, 50))
          await loadCharacterHighlightState(props.bookName)
          await loadBannedWordsHintState(props.bookName)
        }
        return
      } catch (error) {
        console.error('重新初始化编辑器失败:', error)
        // 出错时尝试恢复编辑器
        if (oldFile) {
          try {
            await initEditor()
          } catch (retryError) {
            console.error('恢复编辑器失败:', retryError)
          }
        }
        return
      }
    }

    // 只有在文件路径变化且编辑器已存在时才设置内容
    if (editor.value && newFile?.path !== oldFile?.path) {
      // 文件变化时，先开始编辑会话（设置初始化标志），再设置内容
      const newContent = editorStore.content || ''
      const isNote = newFile?.type === 'note'

      // 先开始编辑会话，设置 isInitializing = true，避免加载已有内容时被计入码字速度
      editorStore.startEditingSession(newContent)

      // 根据文件类型使用对应的内容设置方法
      if (isNote) {
        noteEditorContentRef.value.setNoteContent(editor.value, newContent)
      } else {
        chapterEditorContentRef.value.setChapterContent(editor.value, newContent)
      }

      // 书籍总字数由 EditorStats 组件通过 watch fileType 自动加载

      // 更新样式
      updateEditorStyle()

      // 如果开启了人物高亮，重新应用高亮
      if (characterHighlightEnabled.value && !isNote) {
        nextTick(() => {
          loadCharacters().then(() => {
            applyCharacterHighlights()
            // 确保定时器在运行
            if (!characterHighlightTimer) {
              startCharacterHighlightTimer()
            }
          })
        })
      }

      // 如果开启了禁词提示，重新应用划线
      if (bannedWordsHintEnabled.value && !isNote) {
        nextTick(() => {
          loadBannedWords().then(() => {
            applyBannedWordsStrikes()
            // 确保定时器在运行
            if (!bannedWordsHintTimer) {
              startBannedWordsHintTimer()
            }
          })
        })
      }

      // 如果全局格式模式开启，应用到新内容
      nextTick(() => {
        if (!editor.value) return
        const docSize = editor.value.state.doc.content.size
        if (docSize === 0) return

        if (menubarState.value.isBold || menubarState.value.isItalic) {
          setTimeout(() => {
            if (!editor.value) return
            const currentDocSize = editor.value.state.doc.content.size
            if (currentDocSize === 0) return

            let chain = editor.value.chain().focus().selectAll()
            if (menubarState.value.isBold) {
              chain = chain.setBold()
            }
            if (menubarState.value.isItalic) {
              chain = chain.setItalic()
            }
            chain.run()

            // 恢复光标到末尾
            if (currentDocSize > 0) {
              editor.value.chain().focus().setTextSelection(currentDocSize).run()
            }
          }, 100)
        }
      })
    }
  }
)

// 键盘快捷键处理
function handleKeydown(event) {
  // Cmd/Ctrl + F: 打开搜索面板
  if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
    event.preventDefault()
    if (!searchPanelVisible.value) {
      searchPanelVisible.value = true
    }
  }

  // Cmd/Ctrl + S: 保存内容
  if ((event.metaKey || event.ctrlKey) && event.key === 's') {
    event.preventDefault()
    saveContent()
  }
}

// 窗口关闭前保存设置
function handleWindowClose() {
  // 清除定时器
  if (saveTimer.value) clearTimeout(saveTimer.value)
  if (styleUpdateTimer) clearTimeout(styleUpdateTimer)

  // 同步保存编辑器设置（窗口关闭时无法使用 async/await）
  editorStore
    .saveEditorSettings({
      fontFamily: menubarState.value.fontFamily,
      fontSize: menubarState.value.fontSize,
      lineHeight: menubarState.value.lineHeight,
      globalBoldMode: menubarState.value.isBold,
      globalItalicMode: menubarState.value.isItalic
    })
    .catch((error) => {
      console.error('保存编辑器设置失败:', error)
    })

  // 保存最后的内容
  autoSaveContent().catch((error) => {
    console.error('自动保存失败:', error)
  })
}

// 初始化编辑器的函数
async function initEditor() {
  if (editor.value) {
    // 如果编辑器已存在，先销毁
    editor.value.destroy()
    editor.value = null
  }

  // 加载编辑器设置
  await editorStore.loadEditorSettings()

  // 应用加载的设置
  if (editorStore.editorSettings) {
    const settings = editorStore.editorSettings
    // 只在值为 undefined 或 null 时才使用默认值，避免覆盖空字符串等有效值
    menubarState.value = {
      fontFamily:
        settings.fontFamily !== undefined && settings.fontFamily !== null
          ? settings.fontFamily
          : 'SimHei',
      fontSize:
        settings.fontSize !== undefined && settings.fontSize !== null ? settings.fontSize : '16px',
      lineHeight:
        settings.lineHeight !== undefined && settings.lineHeight !== null
          ? settings.lineHeight
          : '1.6',
      isBold: settings.globalBoldMode !== undefined ? settings.globalBoldMode : false,
      isItalic: settings.globalItalicMode !== undefined ? settings.globalItalicMode : false
    }
  }

  // 获取对应的编辑器内容组件
  const editorContentComponent = getEditorContentComponent()
  if (!editorContentComponent) {
    console.error('编辑器内容组件未找到')
    return
  }

  // 使用组件提供的方法创建编辑器
  editor.value = editorContentComponent.createEditor()

  // 设置初始内容
  const initialContent = editorStore.content || ''

  // 如果有初始内容，先开始编辑会话（设置初始化标志），再设置内容
  if (initialContent) {
    editorStore.startEditingSession(initialContent)
  }

  if (editorStore.file?.name) {
    editorStore.setChapterTitle(editorStore.file.name)
  }

  // 根据文件类型使用对应的内容设置方法
  const isNote = editorStore.file?.type === 'note'
  if (isNote) {
    noteEditorContentRef.value.setNoteContent(editor.value, initialContent)
  } else {
    chapterEditorContentRef.value.setChapterContent(editor.value, initialContent)
  }

  // 等待DOM渲染完成后应用样式
  await nextTick()
  updateEditorStyle()

  // 通知父组件编辑器已就绪
  emit('editor-ready', editor.value)

  // 如果加载了加粗或倾斜状态，应用到所有内容
  if (menubarState.value.isBold || menubarState.value.isItalic) {
    if (initialContent) {
      // 等待编辑器完全初始化后再应用格式
      await nextTick()

      // 给编辑器更多时间来渲染内容
      setTimeout(() => {
        if (!editor.value) return

        // 确保有内容再应用格式
        const docSize = editor.value.state.doc.content.size
        if (docSize === 0) return

        // 保存当前选择位置
        const currentFrom = editor.value.state.selection.from
        const currentTo = editor.value.state.selection.to

        // 在同一个命令链中选择所有内容并应用格式
        let chain = editor.value.chain().focus().selectAll()

        if (menubarState.value.isBold) {
          chain = chain.setBold()
        }
        if (menubarState.value.isItalic) {
          chain = chain.setItalic()
        }

        chain.run()

        // 恢复之前的选择位置（如果有的话）
        if (docSize > 0) {
          const newFrom = Math.min(currentFrom, docSize - 1)
          const newTo = Math.min(currentTo, docSize - 1)
          editor.value.chain().focus().setTextSelection({ from: newFrom, to: newTo }).run()
        }
      }, 100)
    }
  }

  // 注意：startEditingSession 已经在上面调用过了，这里不需要重复调用

  // 设置输入法事件监听器
  setupCompositionHandlers()
}

// 设置输入法事件监听器的函数
function setupCompositionHandlers() {
  if (!editor.value || !editor.value.view || !editor.value.view.dom) return

  const editorElement = editor.value.view.dom

  // 先移除旧的监听器（如果存在）
  if (compositionStartHandler) {
    editorElement.removeEventListener('compositionstart', compositionStartHandler)
  }
  if (compositionEndHandler) {
    editorElement.removeEventListener('compositionend', compositionEndHandler)
  }

  // compositionstart: 开始输入法输入
  compositionStartHandler = () => {
    isComposing = true
  }
  editorElement.addEventListener('compositionstart', compositionStartHandler)

  // compositionend: 输入法确认（回车或选择）
  compositionEndHandler = () => {
    isComposing = false
    // 输入法确认后，立即更新字数统计
    if (editor.value) {
      const content = editor.value.getText()
      editorStore.setContent(content)
    }
  }
  editorElement.addEventListener('compositionend', compositionEndHandler)
}

onMounted(async () => {
  isMounted.value = true
  
  // 书籍总字数由 EditorStats 组件通过 watch fileType 自动加载

  editorStore.registerExternalSaveHandler(saveFile)

  // 延迟初始化编辑器，等待文件加载完成
  // 如果 file 已经存在，立即初始化；否则等待 file 变化后再初始化
  if (editorStore.file) {
    await initEditor()
    await nextTick()
    setupCompositionHandlers()

    // 等待编辑器内容完全渲染后再加载状态并应用高亮/划线
    // 确保内容已经设置完成，特别是对于章节编辑器
    if (editorStore.file?.type === 'chapter') {
      // 多等待几个 tick，确保内容已经渲染到 DOM
      await nextTick()
      await nextTick()
      // 额外等待一小段时间，确保 TipTap 编辑器内容已经完全渲染
      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    // 在编辑器初始化完成后，加载当前书籍的人物高亮、段落字数校验和禁词提示开关状态
    // 这样各个 load 函数中的自动应用逻辑才能正常工作
    if (props.bookName && editor.value && editorStore.file?.type === 'chapter') {
      await loadCharacterHighlightState(props.bookName)
      await loadBannedWordsHintState(props.bookName)
    }
  }
  // 如果 file 不存在，watch 会在文件加载后触发初始化

  // 添加键盘事件监听器
  document.addEventListener('keydown', handleKeydown)

  // 监听窗口关闭事件，确保设置被保存
  window.addEventListener('beforeunload', handleWindowClose)
})

onBeforeUnmount(async () => {
  editorStore.registerExternalSaveHandler(null)
  // 移除窗口关闭监听器
  window.removeEventListener('beforeunload', handleWindowClose)

  // 坐牢模式清理
  // if (isJailModeActive.value) {
  //   await window.electron.disableJailMode()
  // }
  // if (jailTimer) clearInterval(jailTimer)

  // 移除输入法事件监听器
  if (editor.value && editor.value.view && editor.value.view.dom) {
    const editorElement = editor.value.view.dom
    if (compositionStartHandler) {
      editorElement.removeEventListener('compositionstart', compositionStartHandler)
    }
    if (compositionEndHandler) {
      editorElement.removeEventListener('compositionend', compositionEndHandler)
    }
  }

  // 停止人物高亮定时器
  stopCharacterHighlightTimer()

  // 停止禁词提示定时器
  stopBannedWordsHintTimer()

  if (saveTimer.value) clearTimeout(saveTimer.value)
  if (styleUpdateTimer) clearTimeout(styleUpdateTimer)

  // 保存编辑器设置
  await editorStore.saveEditorSettings({
    fontFamily: menubarState.value.fontFamily,
    fontSize: menubarState.value.fontSize,
    lineHeight: menubarState.value.lineHeight,
    globalBoldMode: menubarState.value.isBold,
    globalItalicMode: menubarState.value.isItalic
  })

  // 保存最后的内容
  await autoSaveContent()

  // 移除键盘事件监听器
  document.removeEventListener('keydown', handleKeydown)

  // 销毁编辑器
  editor.value && editor.value.destroy()
})

// 保存内容的通用函数
async function saveFile(showMessage = false) {
  const file = editorStore.file
  if (!file) {
    if (showMessage) ElMessage.warning('未选择章节或笔记')
    return false
  }

  // 根据文件类型使用对应的内容获取方法
  const isNote = file.type === 'note'
  let contentToSave = editorStore.content

  if (editor.value) {
    const editorContentComponent = getEditorContentComponent()
    if (editorContentComponent) {
      contentToSave = editorContentComponent.getSaveContent(editor.value)
      // 更新 store 中的纯文本内容用于字数统计
      if (isNote) {
        const textContent = noteEditorContentRef.value.htmlToPlainText(contentToSave)
        editorStore.setContent(textContent)
      } else {
        editorStore.setContent(contentToSave)
      }
    }
  }

  const saveParams = {
    bookName: props.bookName,
    newName: editorStore.chapterTitle,
    content: contentToSave
  }

  let result
  if (file.type === 'note') {
    result = await window.electron.editNote({
      ...saveParams,
      notebookName: file.notebook,
      noteName: file.name
    })
    if (showMessage && result.success) emit('refresh-notes')
  } else if (file.type === 'chapter') {
    result = await window.electron.saveChapter({
      ...saveParams,
      volumeName: file.volume,
      chapterName: file.name
    })
    if (showMessage && result.success) {
      emit('refresh-chapters')
      // 保存成功后，重新加载书籍总字数（确保与服务器同步）
      if (editorStatsRef.value) {
        await editorStatsRef.value.loadBookTotalWords(true)
      }
    }
  }

  if (result?.success) {
    if (result.name && result.name !== file.name) {
      editorStore.setFile({ ...file, name: result.name })
      if (file.type === 'note') {
        emit('refresh-notes')
      } else if (file.type === 'chapter') {
        emit('refresh-chapters')
      }
    }
    if (showMessage) ElMessage.success('保存成功')
    return true
  } else {
    if (showMessage) ElMessage.error(result?.message || '保存失败')
    else ElMessage.error(result?.message || '自动保存失败')
    return false
  }
}

// 手动保存内容
async function saveContent() {
  await saveFile(true)
}

// 搜索面板控制
function toggleSearchPanel() {
  searchPanelVisible.value = !searchPanelVisible.value
}

function closeSearchPanel() {
  searchPanelVisible.value = false
}

// 自动保存内容
async function autoSaveContent() {
  await saveFile(false)
}

// 加载人物数据
async function loadCharacters() {
  if (!props.bookName) return
  try {
    const data = await window.electron.readCharacters(props.bookName)
    characters.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('加载人物数据失败:', error)
    characters.value = []
  }
}

// 清除所有人物高亮（不改变光标位置）
function clearCharacterHighlights() {
  if (!editor.value) return

  const { state, view } = editor.value
  const { tr } = state

  // 保存当前选择位置（使用数字位置，而不是选择对象）
  const selectionFrom = state.selection.from
  const selectionTo = state.selection.to

  // 获取 highlight mark 类型
  const highlightType = state.schema.marks.highlight

  // 遍历文档，移除所有人物高亮标记（保留段落校验高亮）
  let removedCount = 0
  let preservedCount = 0
  state.doc.descendants((node, pos) => {
    if (node.marks) {
      node.marks.forEach((mark) => {
        if (mark.type.name === 'highlight') {
          // 只清除人物高亮（character-highlight），保留段落校验高亮（paragraph-check-highlight）
          const markClass = mark.attrs?.class || ''
          // console.log('🔍 [清除检查] mark属性:', { 
          //   class: markClass, 
          //   allAttrs: mark.attrs,
          //   位置: pos
          // })
          if (markClass !== 'paragraph-check-highlight') {
            const from = pos
            const to = pos + node.nodeSize
            tr.removeMark(from, to, highlightType)
            removedCount++
          } else {
            preservedCount++
          }
        }
      })
    }
  })
  
  // console.log('🗑️ [清除人物高亮]:', { 
  //   清除数量: removedCount, 
  //   保留段落高亮: preservedCount,
  //   时间: new Date().toLocaleTimeString()
  // })

  // 恢复选择位置（使用 TextSelection.create 创建新的选择对象）
  if (tr.steps.length > 0) {
    const newSelection = TextSelection.create(tr.doc, selectionFrom, selectionTo)
    tr.setSelection(newSelection)
    view.dispatch(tr)
  }
}

// 应用人物高亮（不改变光标位置）
function applyCharacterHighlights() {
  if (!editor.value || !characterHighlightEnabled.value || characters.value.length === 0) {
    return
  }

  const { state, view } = editor.value
  const { doc, tr, schema } = state

  // 保存当前选择位置（使用数字位置）
  const selectionFrom = state.selection.from
  const selectionTo = state.selection.to

  // 先清除之前的人物高亮（在同一事务中），但保留段落校验高亮
  const highlightType = schema.marks.highlight
  let removedCharacterCount = 0
  let preservedParagraphCount = 0
  doc.descendants((node, pos) => {
    if (node.marks) {
      node.marks.forEach((mark) => {
        if (mark.type.name === 'highlight') {
          // 只清除人物高亮（character-highlight），保留段落校验高亮（paragraph-check-highlight）
          const markClass = mark.attrs?.class || ''
          if (markClass !== 'paragraph-check-highlight') {
            const from = pos
            const to = pos + node.nodeSize
            tr.removeMark(from, to, highlightType)
            removedCharacterCount++
          } else {
            preservedParagraphCount++
          }
        }
      })
    }
  })
  // if (removedCharacterCount > 0 || preservedParagraphCount > 0) {
  //   console.log('🧹 [人物高亮] 清除旧高亮:', { 
  //     清除人物高亮数: removedCharacterCount, 
  //     保留段落高亮数: preservedParagraphCount,
  //     时间: new Date().toLocaleTimeString()
  //   })
  // }

  // 为每个人物名创建匹配项
  const matches = []

  // 转义正则表达式特殊字符的工具函数
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  // 遍历文档中的所有文本节点，查找人物名匹配
  characters.value.forEach((character) => {
    if (!character.name || !character.name.trim()) return

    const characterName = character.name.trim()
    // 转义特殊字符，用于正则表达式
    const escapedName = escapeRegExp(characterName)
    // 创建正则表达式，匹配完整的人物名（不区分大小写）
    const regex = new RegExp(escapedName, 'gi')

    // 遍历文档中的所有文本节点（使用当前事务的文档）
    tr.doc.descendants((node, pos) => {
      if (node.isText) {
        const text = node.text
        let match

        // 重置正则表达式的 lastIndex
        regex.lastIndex = 0

        while ((match = regex.exec(text)) !== null) {
          matches.push({
            from: pos + match.index,
            to: pos + match.index + match[0].length,
            text: match[0],
            color: character.markerColor || defaultHighlightColor
          })
        }
      }
    })
  })

  // 按位置排序，从后往前应用高亮（避免位置偏移）
  matches.sort((a, b) => b.from - a.from)

  // 批量应用高亮
  matches.forEach((match) => {
    const highlightMark = highlightType.create({ 
      color: match.color,
      class: 'character-highlight' // 添加自定义类名用于样式区分
    })
    tr.addMark(match.from, match.to, highlightMark)
  })
  
  // if (matches.length > 0) {
  //   // console.log('👥 [人物高亮] 应用新高亮:', { 
  //   //   人物高亮数: matches.length,
  //   //   时间: new Date().toLocaleTimeString()
  //   // })
  // }

  // 恢复选择位置（使用 TextSelection.create 创建新的选择对象）
  const newSelection = TextSelection.create(tr.doc, selectionFrom, selectionTo)
  tr.setSelection(newSelection)

  // 应用事务，但不改变焦点
  if (tr.steps.length > 0) {
    view.dispatch(tr)
  }
}

// 加载人物高亮开关状态（按书籍）
async function loadCharacterHighlightState(bookName) {
  if (!bookName) {
    characterHighlightEnabled.value = false
    // 清除高亮并停止定时器
    clearCharacterHighlights()
    stopCharacterHighlightTimer()
    return
  }

  try {
    const key = `characterHighlight_${bookName}`
    const savedState = await window.electronStore.get(key)
    // 如果该书籍有保存的状态，使用保存的状态；否则默认关闭
    const newState = savedState === true
    characterHighlightEnabled.value = newState

    // 如果状态是开启的，加载人物数据并应用高亮
    if (newState) {
      await loadCharacters()
      // 等待编辑器初始化完成后再应用高亮
      await nextTick()
      // 确保编辑器内容已经设置完成（检查文档是否有内容）
      if (editor.value && editorStore.file?.type === 'chapter') {
        // 等待内容渲染完成
        await nextTick()
        // 检查文档是否有内容，如果有内容则应用高亮
        const docSize = editor.value.state.doc.content.size
        if (docSize > 0) {
          applyCharacterHighlights()
          startCharacterHighlightTimer()
        }
      }
    } else {
      // 如果状态是关闭的，确保清除高亮并停止定时器
      clearCharacterHighlights()
      stopCharacterHighlightTimer()
    }
  } catch (error) {
    console.error('加载人物高亮状态失败:', error)
    characterHighlightEnabled.value = false
    clearCharacterHighlights()
    stopCharacterHighlightTimer()
  }
}

// 保存人物高亮开关状态（按书籍）
async function saveCharacterHighlightState(bookName, enabled) {
  if (!bookName) return

  try {
    const key = `characterHighlight_${bookName}`
    await window.electronStore.set(key, enabled)
  } catch (error) {
    console.error('保存人物高亮状态失败:', error)
  }
}

// 处理人物高亮开关变化
async function handleCharacterHighlightChange(enabled) {
  // 保存开关状态到当前书籍的设置中
  if (props.bookName) {
    await saveCharacterHighlightState(props.bookName, enabled)
  }

  if (enabled) {
    // 开启高亮：加载人物数据并应用高亮
    await loadCharacters()
    applyCharacterHighlights()
    // 启动定时器，定时检查并更新高亮
    startCharacterHighlightTimer()
  } else {
    // 关闭高亮：清除高亮并停止定时器
    clearCharacterHighlights()
    stopCharacterHighlightTimer()
  }
}

// 启动人物高亮定时器
function startCharacterHighlightTimer() {
  stopCharacterHighlightTimer() // 先清除旧的定时器

  // 每 2 秒检查一次并更新高亮
  characterHighlightTimer = setInterval(() => {
    if (characterHighlightEnabled.value && editor.value) {
      applyCharacterHighlights()
    }
  }, 2000)
}

// 停止人物高亮定时器
function stopCharacterHighlightTimer() {
  if (characterHighlightTimer) {
    clearInterval(characterHighlightTimer)
    characterHighlightTimer = null
  }
}

// ==================== 段落字数校验相关函数 ====================

// ==================== 段落字数校验相关函数 ====================

// 执行段落字数校验（一键校验）
function checkParagraphLength() {
  if (!editor.value) {
    ElMessage.warning('编辑器未初始化')
    return
  }

  const { state } = editor.value
  const { doc } = state
  
  // 清空之前的结果
  overLengthParagraphs.value = []
  
  // 遍历所有段落节点，检查字数
  doc.descendants((node, pos) => {
    // 只处理段落节点
    if (node.type.name === 'paragraph') {
      const text = node.textContent
      // 排除空格和换行符，只计算实际字符
      const textLength = text.replace(/[\s\n\r\t]/g, '').length
      
      // 如果段落字数超过阈值，记录该段落
      if (textLength > editorStore.paragraphMaxLength) {
        // 获取段落预览文本（前50个字符）
        const preview = text.length > 50 ? text.substring(0, 50) + '...' : text
        
        overLengthParagraphs.value.push({
          from: pos + 1, // +1 跳过段落节点本身
          to: pos + node.nodeSize - 1, // -1 跳过结束标记
          length: textLength,
          preview: preview
        })
      }
    }
  })
  
  // 显示结果弹窗
  paragraphCheckDialogVisible.value = true
  
  // 提示消息
  if (overLengthParagraphs.value.length === 0) {
    ElMessage.success('所有段落字数均符合要求')
  } 
}

// 跳转到指定段落（锚点跳转并高亮）
// 使用和人物高亮相同的原理：通过 ProseMirror 的 highlight mark 标记来实现临时高亮效果
function jumpToParagraph(item) {
  if (!editor.value) return
  
  const { from, to } = item
  // console.log('🎯 [段落高亮] 开始跳转:', { from, to, 内容长度: to - from })
  
  // 先关闭弹窗，使用 nextTick 确保弹窗关闭后再应用高亮
  paragraphCheckDialogVisible.value = false
  
  nextTick(() => {
    if (!editor.value) return
    
    const { state, view } = editor.value
    const { schema } = state
    
    // 设置光标位置并聚焦
    editor.value.chain().focus().setTextSelection(from).run()
    // console.log('📍 [段落高亮] 光标已设置到位置:', from)
    
    // 滚动到视图中
    const domAtPos = view.domAtPos(from)
    if (domAtPos && domAtPos.node) {
      // 找到段落元素
      let element = domAtPos.node
      if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentElement
      }
      
      // 滚动到该元素
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // console.log('📜 [段落高亮] 页面已滚动到目标位置')
    }
    
    // 使用 nextTick 再次确保 DOM 更新完成后再应用高亮
    nextTick(() => {
      if (!editor.value) return
      
      const currentState = editor.value.state
      const currentSchema = currentState.schema
      const tr = currentState.tr
      const highlightType = currentSchema.marks.highlight
      
      // 为该段落添加高亮标记（使用橙红色表示段落过长警告）
      const highlightMark = highlightType.create({ 
        color: '#ff6b6b', // 橙红色，表示警告
        class: 'paragraph-check-highlight' // 添加自定义类名用于样式区分
      })
      // console.log('🔍 [段落高亮] 创建mark:', {
      //   输入属性: { color: '#ff6b6b', class: 'paragraph-check-highlight' },
      //   实际mark属性: highlightMark.attrs
      // })
      tr.addMark(from, to, highlightMark)
      
      // 应用事务
      editor.value.view.dispatch(tr)
      const applyTime = Date.now()
      // console.log('✨ [段落高亮] 高亮已应用 (橙红色)', { 
      //   时间: new Date().toLocaleTimeString(),
      //   时间戳: applyTime,
      //   范围: `${from}-${to}`,
      //   class: 'paragraph-check-highlight'
      // })
      
      // 5秒后移除高亮
      setTimeout(() => {
        if (!editor.value) return
        
        const finalState = editor.value.state
        const finalTr = finalState.tr
        const finalHighlightType = finalState.schema.marks.highlight
        
        // 移除该范围的高亮标记
        finalTr.removeMark(from, to, finalHighlightType)
        
        // 应用事务
        editor.value.view.dispatch(finalTr)
        const removeTime = Date.now()
        const duration = removeTime - applyTime
        // console.log('🔚 [段落高亮] 高亮已移除', {
        //   时间: new Date().toLocaleTimeString(),
        //   时间戳: removeTime,
        //   持续时间: `${duration}ms (${(duration/1000).toFixed(1)}秒)`,
        //   范围: `${from}-${to}`
        // })
      }, 5000)
    })
    
    // ElMessage.success('已跳转到该段落')
  })
}

// ==================== 禁词提示相关函数 ====================


// 加载禁词数据
async function loadBannedWords() {
  if (!props.bookName) return
  try {
    const result = await window.electron.getBannedWords(props.bookName)
    if (result.success) {
      bannedWords.value = result.data || []
    } else {
      bannedWords.value = []
    }
  } catch (error) {
    console.error('加载禁词数据失败:', error)
    bannedWords.value = []
  }
}

// 清除所有禁词划线（不改变光标位置）
function clearBannedWordsStrikes() {
  if (!editor.value) return

  const { state, view } = editor.value
  const { tr } = state

  // 保存当前选择位置（使用数字位置）
  const selectionFrom = state.selection.from
  const selectionTo = state.selection.to

  // 获取 strike mark 类型
  const strikeType = state.schema.marks.strike

  // 遍历文档，移除所有划线标记
  state.doc.descendants((node, pos) => {
    if (node.marks) {
      node.marks.forEach((mark) => {
        if (mark.type.name === 'strike') {
          // 移除划线标记，但不改变选择
          const from = pos
          const to = pos + node.nodeSize
          tr.removeMark(from, to, strikeType)
        }
      })
    }
  })

  // 恢复选择位置
  if (tr.steps.length > 0) {
    const newSelection = TextSelection.create(tr.doc, selectionFrom, selectionTo)
    tr.setSelection(newSelection)
    view.dispatch(tr)
  }
}

// 应用禁词划线（不改变光标位置）
function applyBannedWordsStrikes() {
  if (!editor.value || !bannedWordsHintEnabled.value || bannedWords.value.length === 0) {
    return
  }

  const { state, view } = editor.value
  const { doc, tr, schema } = state

  // 保存当前选择位置（使用数字位置）
  const selectionFrom = state.selection.from
  const selectionTo = state.selection.to

  // 先清除之前的禁词划线（在同一事务中）
  const strikeType = schema.marks.strike
  doc.descendants((node, pos) => {
    if (node.marks) {
      node.marks.forEach((mark) => {
        if (mark.type.name === 'strike') {
          const from = pos
          const to = pos + node.nodeSize
          tr.removeMark(from, to, strikeType)
        }
      })
    }
  })

  // 为每个禁词创建匹配项
  const matches = []

  // 转义正则表达式特殊字符的工具函数
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  // 遍历文档中的所有文本节点，查找禁词匹配
  bannedWords.value.forEach((bannedWord) => {
    if (!bannedWord || !bannedWord.trim()) return

    const word = bannedWord.trim()
    // 转义特殊字符，用于正则表达式
    const escapedWord = escapeRegExp(word)
    // 创建正则表达式，匹配完整的禁词（不区分大小写）
    const regex = new RegExp(escapedWord, 'gi')

    // 遍历文档中的所有文本节点（使用当前事务的文档）
    tr.doc.descendants((node, pos) => {
      if (node.isText) {
        const text = node.text
        let match

        // 重置正则表达式的 lastIndex
        regex.lastIndex = 0

        while ((match = regex.exec(text)) !== null) {
          matches.push({
            from: pos + match.index,
            to: pos + match.index + match[0].length,
            text: match[0]
          })
        }
      }
    })
  })

  // 按位置排序，从后往前应用划线（避免位置偏移）
  matches.sort((a, b) => b.from - a.from)

  // 批量应用划线
  matches.forEach((match) => {
    tr.addMark(match.from, match.to, strikeType.create())
  })

  // 恢复选择位置（使用 TextSelection.create 创建新的选择对象）
  const newSelection = TextSelection.create(tr.doc, selectionFrom, selectionTo)
  tr.setSelection(newSelection)

  // 应用事务，但不改变焦点
  if (tr.steps.length > 0) {
    view.dispatch(tr)
  }
}

// 加载禁词提示开关状态（按书籍）
async function loadBannedWordsHintState(bookName) {
  if (!bookName) {
    bannedWordsHintEnabled.value = false
    // 清除划线并停止定时器
    clearBannedWordsStrikes()
    stopBannedWordsHintTimer()
    return
  }

  try {
    const key = `bannedWordsHint_${bookName}`
    const savedState = await window.electronStore.get(key)
    // 如果该书籍有保存的状态，使用保存的状态；否则默认关闭
    const newState = savedState === true
    bannedWordsHintEnabled.value = newState

    // 如果状态是开启的，加载禁词数据并应用划线
    if (newState) {
      await loadBannedWords()
      // 等待编辑器初始化完成后再应用划线
      await nextTick()
      // 确保编辑器内容已经设置完成（检查文档是否有内容）
      if (editor.value && editorStore.file?.type === 'chapter') {
        // 等待内容渲染完成
        await nextTick()
        // 检查文档是否有内容，如果有内容则应用划线
        const docSize = editor.value.state.doc.content.size
        if (docSize > 0) {
          applyBannedWordsStrikes()
          startBannedWordsHintTimer()
        }
      }
    } else {
      // 如果状态是关闭的，确保清除划线并停止定时器
      clearBannedWordsStrikes()
      stopBannedWordsHintTimer()
    }
  } catch (error) {
    console.error('加载禁词提示状态失败:', error)
    bannedWordsHintEnabled.value = false
    clearBannedWordsStrikes()
    stopBannedWordsHintTimer()
  }
}

// 保存禁词提示开关状态（按书籍）
async function saveBannedWordsHintState(bookName, enabled) {
  if (!bookName) return

  try {
    const key = `bannedWordsHint_${bookName}`
    await window.electronStore.set(key, enabled)
  } catch (error) {
    console.error('保存禁词提示状态失败:', error)
  }
}

// 处理禁词提示开关变化
async function handleBannedWordsHintChange(enabled) {
  // 保存开关状态到当前书籍的设置中
  if (props.bookName) {
    await saveBannedWordsHintState(props.bookName, enabled)
  }

  if (enabled) {
    // 开启提示：加载禁词数据并应用划线
    await loadBannedWords()
    applyBannedWordsStrikes()
    // 启动定时器，定时检查并更新划线
    startBannedWordsHintTimer()
  } else {
    // 关闭提示：清除划线并停止定时器
    clearBannedWordsStrikes()
    stopBannedWordsHintTimer()
  }
}

// 启动禁词提示定时器
function startBannedWordsHintTimer() {
  stopBannedWordsHintTimer() // 先清除旧的定时器

  // 每 2 秒检查一次并更新划线
  bannedWordsHintTimer = setInterval(() => {
    if (bannedWordsHintEnabled.value && editor.value) {
      applyBannedWordsStrikes()
    }
  }, 2000)
}

// 停止禁词提示定时器
function stopBannedWordsHintTimer() {
  if (bannedWordsHintTimer) {
    clearInterval(bannedWordsHintTimer)
    bannedWordsHintTimer = null
  }
}

// 监听当前文件类型，动态设置首行缩进和编辑器模式
watch(
  () => editorStore.file,
  async (file) => {
    if (editor.value) {
      const isChapter = file?.type === 'chapter'
      const style = document.querySelector('.tiptap')
      if (style) {
        style.style.textIndent = isChapter ? '2em' : '0'
      }

      // 如果切换到笔记模式，需要重新初始化编辑器以加载 NoteOutlineParagraph 扩展
      // 但这里我们已经在 onMounted 中根据文件类型加载了扩展
      // 所以只需要确保内容正确加载即可
    }
  },
  { immediate: true }
)
// ==================== 坐牢模式相关 ====================
const jailStore = useJailStore()
const jailModeDialogVisible = ref(false)
const jailModeType = ref('time') // 'word' | 'time'
const jailTarget = ref('')
const isJailModeActive = computed(() => jailStore.isJailModeActive)

function openJailModeDialog() {
  jailModeDialogVisible.value = true
  jailModeType.value = 'word'
  jailTarget.value = ''
}

function updateActivity() {
  jailStore.updateActivity()
}

async function startJailMode() {
  const target = parseInt(jailTarget.value)
  if (isNaN(target) || target <= 0) {
    ElMessage.warning('请输入有效的目标')
    return
  }
  
  if (jailModeType.value === 'word') {
    if (target < 1 || target > 20000) {
      ElMessage.warning('字数范围 1-20000')
      return
    }
  } else {
    if (target < 1 || target > 360) {
      ElMessage.warning('时长范围 1-360 分钟')
      return
    }
  }

  const success = await jailStore.startJailMode(
    target, 
    jailModeType.value, 
    editorStore.contentWordCount
  )
  
  if (success) {
    jailModeDialogVisible.value = false
  }
}

// Watch word count for jail mode
watch(() => editorStore.contentWordCount, (newVal, oldVal) => {
  jailStore.updateWordCount(newVal, oldVal)
})

// Watch jail mode state and emit event
watch(isJailModeActive, (newVal) => {
  emit('jail-mode-change', newVal)
})

</script>

<style lang="scss" scoped>
.editor-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg-primary);
  color: var(--text-base);
  min-height: 0;
  overflow: hidden;
}
.chapter-title {
  padding: 8px 15px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-soft);
  display: flex;
  align-items: center;
  gap: 12px;
}
.chapter-title-input {
  font-size: 20px;
  font-weight: bold;
  flex: 1;
}
.character-highlight-switch,
.paragraph-length-check-switch,
.banned-words-hint-switch {
  flex-shrink: 0;
}
.editor-content {
  flex: 1;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;
  background: var(--bg-primary);
  white-space: pre-wrap; // 保证Tab缩进和换行显示
  font-family: inherit, monospace;
}

::v-deep(.tiptap) {
  height: max-content;
  min-height: 100%;
  white-space: pre-wrap; // 保证Tab缩进和换行显示
  // 字体、字号、行高通过动态样式设置，不在这里固定设置

  &:focus {
    outline: none;
  }

  // 加粗样式 - 确保在所有情况下都生效
  strong,
  b,
  [data-type='bold'] {
    font-weight: 700;
    font-style: normal;
  }

  // 倾斜样式 - 确保在所有情况下都生效
  em,
  i,
  [data-type='italic'] {
    font-style: italic;
    font-weight: inherit;
  }

  // 同时加粗和倾斜
  strong em,
  strong i,
  b em,
  b i,
  em strong,
  i strong,
  em b,
  i b {
    font-weight: 700;
    font-style: italic;
  }

  // 删除线样式 - 用于禁词提示
  s,
  strike,
  del,
  [data-type='strike'] {
    text-decoration: line-through;
    color: red;
  }

  // 人物高亮样式 - 蓝色加粗（不用黄色背景）
  mark.character-highlight {
    background-color: transparent !important;
    color: #409eff !important;
    font-weight: 700 !important;
  }

  // 段落字数高亮样式 - 浅红色背景 + 虚线下划线
mark.paragraph-length-highlight {
  /* background-color: rgba(245, 108, 108, 0.15) !important; */
  border-bottom: 1px dashed #b30707 !important;
  color: inherit !important;
}

  // 搜索高亮样式 - 使用选择高亮
  ::selection {
    background-color: #409eff;
    color: white;
  }

  // // 搜索匹配文本的高亮样式（仅用于搜索功能，不使用 data-color）
  // .search-highlight:not([data-color]) {
  //   background-color: #ffeb3b !important;
  //   color: #000 !important;
  //   padding: 1px 2px;
  //   border-radius: 2px;
  //   border: 1px solid #f4d03f;
  // }

  // .search-highlight-current {
  //   background-color: #409eff !important;
  //   color: white !important;
  //   padding: 1px 2px;
  //   border-radius: 2px;
  //   box-shadow: 0 0 4px rgba(64, 158, 255, 0.5);
  // }

  // Tiptap highlight扩展的样式（支持多颜色）
  // 确保有 data-color 属性的 mark 元素使用 TipTap 扩展设置的颜色
  // TipTap 扩展会通过内联 style 设置 background-color，优先级高于类选择器
  // mark.search-highlight[data-color] {
  //   // padding: 1px 2px;
  //   // border-radius: 2px;
  //   // 移除强制背景色，让内联样式生效
  //   // background-color: unset !important;
  //   // 颜色由 TipTap 扩展通过 style 属性设置
  // }

  // 笔记大纲样式
  p[data-note-outline] {
    position: relative;
    margin: 6px 0;
    // 缩进通过 renderHTML 中的 style 属性控制（padding-left: level * 24px）
    // 但需要为控制按钮留出空间
    min-height: 24px;
    line-height: 1.6;
    display: block;
    width: 100%;

    &:hover {
      .note-outline-controls {
        opacity: 1 !important;
        pointer-events: auto !important;
      }
    }
  }

  // 控制按钮容器（使用全局样式，因为是通过装饰器添加的）
  :global(.note-outline-controls) {
    position: absolute;
    left: -50px;
    top: 50%;
    transform: translateY(-50%);
    height: 20px;
    display: flex;
    align-items: center;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
    z-index: 10;

    .note-outline-toggle {
      width: 16px;
      height: 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 10px;
      color: var(--text-base, #333);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border-radius: 2px;
      transition: background-color 0.2s;
      flex-shrink: 0;

      &:hover {
        background-color: var(--bg-mute, rgba(0, 0, 0, 0.05));
      }
    }

    .note-outline-spacer {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .note-outline-drag-handle {
      width: 12px;
      height: 12px;
      cursor: grab !important;
      font-size: 10px;
      color: var(--text-mute, #999);
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      user-select: none;
      flex-shrink: 0;
      pointer-events: auto !important;

      &:hover {
        cursor: grab !important;
        color: var(--text-base, #333);
      }

      &:active {
        cursor: grabbing !important;
      }
    }
  }

  // 当段落悬停时显示控制按钮
  p[data-note-outline]:hover ~ :global(.note-outline-controls),
  p[data-note-outline]:hover :global(.note-outline-controls) {
    opacity: 1 !important;
    pointer-events: auto !important;
  }

  // 确保段落悬停时，控制按钮可以交互
  p[data-note-outline]:hover {
    :global(.note-outline-controls) {
      opacity: 1 !important;
      pointer-events: auto !important;

      .note-outline-drag-handle {
        pointer-events: auto !important;
        cursor: grab !important;
      }
    }
  }
}

/* 段落字数校验按钮样式 */
.paragraph-check-button {
  margin-left: 10px;
}

/* 段落跳转后的呼吸闪烁动画 */
:deep(.paragraph-highlight-flash) {
  animation: paragraph-breath 1.5s ease-in-out 2;
  position: relative;
}

@keyframes paragraph-breath {
  0%, 100% {
    background-color: transparent;
    box-shadow: none;
  }
  50% {
    background-color: rgba(255, 193, 7, 0.2);
    box-shadow: 0 0 0 4px rgba(255, 193, 7, 0.3), 
                0 0 0 8px rgba(255, 193, 7, 0.1);
  }
}

/* 光标呼吸闪烁动画 - 更醒目的样式 */
:deep(.paragraph-highlight-flash) {
  .ProseMirror-focused & {
    caret-color: #ff9800;
  }
}

/* 自定义光标闪烁效果 */
:deep(.ProseMirror-focused .paragraph-highlight-flash::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(to bottom, #ff9800, #ffc107, #ff9800);
  animation: cursor-pulse 1s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(255, 152, 0, 0.8),
              0 0 20px rgba(255, 152, 0, 0.4);
}

@keyframes cursor-pulse {
  0%, 100% {
    opacity: 1;
    transform: scaleY(1);
  }
  50% {
    opacity: 0.4;
    transform: scaleY(1.2);
  }
}

/* 段落字数校验结果弹窗样式 */
.check-result-empty {
  padding: 40px 0;
  text-align: center;
}

.check-result-list {
  .result-summary {
    padding: 10px 0;
    font-size: 14px;
    color: var(--text-base, #333);
    border-bottom: 1px solid var(--border, #e0e0e0);
    margin-bottom: 10px;
    
    .highlight-number {
      color: #f56c6c;
      font-weight: bold;
      font-size: 16px;
    }
  }
  
  .paragraph-item {
    padding: 12px;
    margin-bottom: 8px;
    border: 1px solid var(--border, #e0e0e0);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background-color: var(--bg-mute, #f5f5f5);
      border-color: var(--primary, #409eff);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .paragraph-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      font-size: 13px;
      
      .paragraph-index {
        font-weight: bold;
        color: var(--text-base, #333);
      }
      
      .paragraph-length {
        color: var(--text-secondary, #666);
      }
      
      .over-length {
        color: #f56c6c;
        font-weight: bold;
        margin-left: auto;
      }
    }
    
    .paragraph-preview {
      font-size: 12px;
      color: var(--text-secondary, #666);
      line-height: 1.5;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
