<template>
  <div class="editor-menubar">
    <div class="toolbar-left">
      <el-select
        v-model="fontFamily"
        class="toolbar-item"
        size="small"
        style="width: 85px"
        title="字体"
        @change="handleFontChange"
      >
        <!-- 自定义字体列表（靠前显示） -->
        <el-option
          v-for="customFont in customFontsList"
          :key="customFont.fontFamily"
          :label="customFont.name"
          :value="customFont.fontFamily"
        >
          <div class="custom-font-option">
            <span class="font-name">{{ customFont.name }}</span>
            <div class="font-actions">
              <el-icon
                class="action-icon"
                title="编辑"
                @click.stop="handleEditCustomFont(customFont)"
              >
                <Edit />
              </el-icon>
              <el-icon
                class="action-icon"
                title="删除"
                @click.stop="handleDeleteCustomFont(customFont)"
              >
                <Delete />
              </el-icon>
            </div>
          </div>
        </el-option>
        <!-- 添加自定义字体选项 -->
        <el-option label="添加字体..." value="__add_custom__" />
        <!-- 系统预设字体 -->
        <el-option label="宋体" value="SimSun" />
        <el-option label="黑体" value="SimHei" />
        <el-option label="楷体" value="KaiTi" />
        <el-option label="仿宋" value="FangSong" />
        <el-option label="思源黑体" value="SourceHanSans" />
        <el-option label="思源宋体" value="SourceHanSerif" />
        <el-option label="苹方" value="PingFang" />
      </el-select>
      <el-select
        v-if="isNoteEditor"
        :model-value="headingLevel"
        class="toolbar-item"
        size="small"
        style="width: 70px"
        title="标题"
        @change="handleHeadingChange"
      >
        <el-option label="正文" value="0" />
        <el-option label="标题 1" value="1" />
        <el-option label="标题 2" value="2" />
        <el-option label="标题 3" value="3" />
        <el-option label="标题 4" value="4" />
      </el-select>
      <el-select
        v-model="fontSize"
        class="toolbar-item"
        size="small"
        style="width: 65px"
        title="字号"
      >
        <el-option label="12px" value="12px" />
        <el-option label="13px" value="13px" />
        <el-option label="14px" value="14px" />
        <el-option label="15px" value="15px" />
        <el-option label="16px" value="16px" />
        <el-option label="18px" value="18px" />
        <el-option label="20px" value="20px" />
        <el-option label="22px" value="22px" />
        <el-option label="24px" value="24px" />
      </el-select>
      <el-select
        v-model="lineHeight"
        class="toolbar-item"
        size="small"
        style="width: 50px"
        title="行高"
      >
        <el-option label="1.4" value="1.4" />
        <el-option label="1.6" value="1.6" />
        <el-option label="1.8" value="1.8" />
        <el-option label="2" value="2" />
        <el-option label="2.2" value="2.2" />
        <el-option label="2.4" value="2.4" />
      </el-select>
      <el-button
        class="toolbar-item"
        size="small"
        :type="isBold ? 'primary' : 'default'"
        title="加粗"
        @click="handleToggleBold"
      >
        <b>B</b>
      </el-button>
      <el-button
        class="toolbar-item"
        :type="isItalic ? 'primary' : 'default'"
        size="small"
        title="倾斜"
        @click="handleToggleItalic"
      >
        <i>I</i>
      </el-button>
      <el-popover
        v-if="isNoteEditor"
        v-model:visible="highlightPopoverVisible"
        placement="bottom"
        :width="230"
        trigger="click"
        popper-style="padding: 6px;"
      >
        <template #reference>
          <el-button
            size="small"
            class="toolbar-item"
            :type="isHighlight ? 'primary' : 'default'"
            title="高亮"
          >
            <SvgIcon name="highlight" :size="12" />
          </el-button>
        </template>
        <div class="highlight-color-picker">
          <div class="highlight-colors">
            <div
              v-for="color in highlightColors"
              :key="color.value"
              class="highlight-color-item"
              :class="{ active: isHighlightColorActive(color.value) }"
              :title="color.label"
              @click="applyHighlight(color.value)"
            >
              <div
                :style="{ backgroundColor: color.value }"
                class="hightlight-color-item-main"
              ></div>
            </div>
            <div class="highlight-color-split"></div>
            <div
              :class="{ active: !isHighlight }"
              class="highlight-color-item highlight-color-none"
              title="无高亮"
            >
              <SvgIcon
                class="hightlight-color-item-main"
                :size="20"
                name="ban"
                @click="removeHighlight"
              />
            </div>
          </div>
        </div>
      </el-popover>
      <el-button
        v-if="!isNoteEditor"
        size="small"
        class="toolbar-item"
        title="一键排版"
        @click="handleFormatContent"
      >
        <el-icon><Tickets /></el-icon>
      </el-button>
      <el-button size="small" class="toolbar-item" title="复制" @click="handleCopyContent">
        <el-icon><DocumentCopy /></el-icon>
      </el-button>
      <el-button size="small" class="toolbar-item" title="搜索" @click="handleToggleSearchPanel">
        <el-icon><Search /></el-icon>
      </el-button>
      <el-button size="small" class="toolbar-item" title="沉浸式阅读" @click="handleToggleFullscreen">
        <el-icon><FullScreen /></el-icon>
      </el-button>
    </div>
    <div class="toolbar-right">
      <el-button size="small" class="toolbar-item" title="保存" @click="handleSave">
        <SvgIcon name="save" :size="12" />
      </el-button>
      <el-button
        v-if="!isNoteEditor"
        size="small"
        class="toolbar-item"
        title="导出"
        @click="handleExport"
      >
        <SvgIcon name="export" :size="12" />
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { DocumentCopy, Search, Tickets, Edit, Delete, FullScreen } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { useEditorStore } from '@renderer/stores/editor'
import { formatText } from '@renderer/utils/textFormatter'

const props = defineProps({
  editor: {
    type: Object,
    default: null
  },
  bookName: {
    type: String,
    default: ''
  },
  modelValue: {
    type: Object,
    default: () => ({
      fontFamily: 'KaiTi',
      fontSize: '18px',
      lineHeight: '1.6',
      isBold: false,
      isItalic: false
    })
  }
})

const emit = defineEmits(['update:modelValue', 'toggle-search', 'save', 'export', 'update-style', 'toggle-fullscreen'])

const editorStore = useEditorStore()

// 判断是否为笔记编辑器
const isNoteEditor = computed(() => editorStore.file?.type === 'note')

// 自定义字体列表（从 localStorage 加载）
const customFontsList = ref([])
// 记录上一个有效的字体值
const lastValidFontFamily = ref('KaiTi')
// 是否正在选择字体（防止多次弹窗）
const isSelectingFont = ref(false)

// 从 localStorage 加载自定义字体列表
function loadCustomFonts() {
  try {
    const saved = localStorage.getItem('customFonts')
    if (saved) {
      customFontsList.value = JSON.parse(saved)
      // 重新加载所有已保存的字体到页面
      customFontsList.value.forEach((font) => {
        loadCustomFont(font.path, font.fontFamily)
      })
    }
  } catch (error) {
    console.error('加载自定义字体列表失败:', error)
    customFontsList.value = []
  }
}

// 保存自定义字体列表到 localStorage
function saveCustomFonts() {
  try {
    localStorage.setItem('customFonts', JSON.stringify(customFontsList.value))
  } catch (error) {
    console.error('保存自定义字体列表失败:', error)
  }
}

// 初始化时加载自定义字体
loadCustomFonts()

// 使用 computed 来双向绑定
const fontFamily = computed({
  get: () => props.modelValue.fontFamily,
  set: (val) => {
    // 如果选择的不是 '__add_custom__'，正常更新
    if (val !== '__add_custom__') {
      lastValidFontFamily.value = val
      emit('update:modelValue', { ...props.modelValue, fontFamily: val })
      emit('update-style')
    }
  }
})

const fontSize = computed({
  get: () => props.modelValue.fontSize,
  set: (val) => {
    emit('update:modelValue', { ...props.modelValue, fontSize: val })
    emit('update-style')
  }
})

const lineHeight = computed({
  get: () => props.modelValue.lineHeight,
  set: (val) => {
    emit('update:modelValue', { ...props.modelValue, lineHeight: val })
    emit('update-style')
  }
})

// 按钮状态：笔记编辑器根据选中文本格式，章节编辑器使用全局状态
const isBold = computed(() => {
  const isNoteEditor = editorStore.file?.type === 'note'
  if (isNoteEditor && props.editor) {
    // 笔记编辑器：根据当前选中文本的格式
    return props.editor.isActive('bold')
  }
  // 章节编辑器：使用全局状态
  return props.modelValue.isBold
})

const isItalic = computed(() => {
  const isNoteEditor = editorStore.file?.type === 'note'
  if (isNoteEditor && props.editor) {
    // 笔记编辑器：根据当前选中文本的格式
    return props.editor.isActive('italic')
  }
  // 章节编辑器：使用全局状态
  return props.modelValue.isItalic
})

// 高亮状态（仅笔记编辑器）
const isHighlight = computed(() => {
  if (!props.editor) return false
  const isNoteEditor = editorStore.file?.type === 'note'
  if (isNoteEditor) {
    // 笔记编辑器：根据当前选中文本的格式
    return props.editor.isActive('highlight')
  }
  return false
})

// 当前选中的标题级别
const headingLevel = computed(() => {
  if (!props.editor) return '0'
  // 检查当前是否在 heading 节点中
  if (props.editor.isActive('heading')) {
    const level = props.editor.getAttributes('heading').level
    return String(level || 1)
  }
  return '0' // 正文/段落
})

// 全局格式模式，与 menubarState 同步
const globalBoldMode = computed({
  get: () => props.modelValue.isBold,
  set: (val) => {
    emit('update:modelValue', { ...props.modelValue, isBold: val })
  }
})

const globalItalicMode = computed({
  get: () => props.modelValue.isItalic,
  set: (val) => {
    emit('update:modelValue', { ...props.modelValue, isItalic: val })
  }
})

// 应用格式到整个编辑器内容
function applyFormatToAll(markType, enable) {
  if (!props.editor) return

  const { from, to } = props.editor.state.selection
  const docSize = props.editor.state.doc.content.size

  try {
    // 在同一个命令链中选择所有内容并应用格式
    if (markType === 'bold') {
      if (enable) {
        props.editor.chain().focus().selectAll().setBold().run()
        globalBoldMode.value = true
      } else {
        props.editor.chain().focus().selectAll().unsetBold().run()
        globalBoldMode.value = false
      }
    } else if (markType === 'italic') {
      if (enable) {
        props.editor.chain().focus().selectAll().setItalic().run()
        globalItalicMode.value = true
      } else {
        props.editor.chain().focus().selectAll().unsetItalic().run()
        globalItalicMode.value = false
      }
    }

    // 恢复之前的选择位置
    if (docSize > 0) {
      props.editor
        .chain()
        .focus()
        .setTextSelection({ from: Math.min(from, docSize - 1), to: Math.min(to, docSize - 1) })
        .run()
    } else {
      props.editor.chain().focus().setTextSelection(0).run()
    }
  } catch (error) {
    console.error(`应用${markType}格式失败:`, error)
  }
}

// 切换格式的通用函数
function toggleFormat(markType) {
  if (!props.editor) return

  props.editor.commands.focus()

  // 判断是笔记编辑器还是章节编辑器
  const isNoteEditor = editorStore.file?.type === 'note'

  if (isNoteEditor) {
    // 笔记编辑器：只对选中文本应用格式
    if (markType === 'bold') {
      props.editor.commands.toggleBold()
    } else if (markType === 'italic') {
      props.editor.commands.toggleItalic()
    }
  } else {
    // 章节编辑器：对整个文档应用格式
    if (markType === 'bold') {
      const newState = !globalBoldMode.value
      applyFormatToAll('bold', newState)
      emit('update:modelValue', { ...props.modelValue, isBold: newState })
      // 立即保存设置
      editorStore.saveEditorSettings({
        fontFamily: fontFamily.value,
        fontSize: fontSize.value,
        lineHeight: lineHeight.value,
        globalBoldMode: newState,
        globalItalicMode: globalItalicMode.value
      })
    } else if (markType === 'italic') {
      const newState = !globalItalicMode.value
      applyFormatToAll('italic', newState)
      emit('update:modelValue', { ...props.modelValue, isItalic: newState })
      // 立即保存设置
      editorStore.saveEditorSettings({
        fontFamily: fontFamily.value,
        fontSize: fontSize.value,
        lineHeight: lineHeight.value,
        globalBoldMode: globalBoldMode.value,
        globalItalicMode: newState
      })
    }
  }
}

function handleToggleBold() {
  toggleFormat('bold')
}

function handleToggleItalic() {
  toggleFormat('italic')
}

// 高亮颜色选择器显示状态
const highlightPopoverVisible = ref(false)

// 高亮颜色选项（5个浅色、亮色）
const highlightColors = [
  { value: '#ffeb3b', label: '黄色' },
  { value: '#a8e6cf', label: '绿色' },
  { value: '#a8c8ec', label: '蓝色' },
  { value: '#ffb3ba', label: '粉色' },
  { value: '#dda0dd', label: '紫色' }
]

// 检查当前高亮是否使用指定颜色
function isHighlightColorActive(color) {
  if (!props.editor || !isHighlight.value) return false
  const attrs = props.editor.getAttributes('highlight')
  // 如果没有 color 属性，默认是黄色
  const currentColor = attrs.color || '#ffeb3b'
  return currentColor === color
}

// 应用高亮颜色
function applyHighlight(color) {
  if (!props.editor) return
  const isNoteEditor = editorStore.file?.type === 'note'
  if (isNoteEditor) {
    // 使用 setHighlight 确保应用正确的颜色
    props.editor.chain().focus().setHighlight({ color }).run()
    highlightPopoverVisible.value = false
  }
}

// 移除高亮
function removeHighlight() {
  if (!props.editor) return
  const isNoteEditor = editorStore.file?.type === 'note'
  if (isNoteEditor) {
    props.editor.chain().focus().unsetHighlight().run()
    highlightPopoverVisible.value = false
  }
}

function handleHeadingChange(level) {
  if (!props.editor) return
  const levelNum = parseInt(level, 10)

  if (levelNum === 0) {
    // 切换回段落
    if (isNoteEditor.value) {
      // 笔记编辑器：使用 noteOutlineParagraph（没有 paragraph 节点类型）
      // setNode 会自动处理当前节点类型，无需手动查找
      props.editor.chain().focus().setNode('noteOutlineParagraph', { level: 0 }).run()
    } else {
      // 章节编辑器：使用 paragraph
      props.editor.commands.setParagraph()
    }
  } else {
    // 设置为对应的标题级别
    if (isNoteEditor.value) {
      // 笔记编辑器：使用 setHeading 而不是 toggleHeading
      // toggleHeading 内部会调用 toggleNode(this.name, 'paragraph')，导致报错
      // setHeading 只是简单地调用 setNode，更安全
      props.editor.commands.setHeading({ level: levelNum })
    } else {
      // 章节编辑器：使用 toggleHeading（可以正常切换 heading 和 paragraph）
      props.editor.commands.toggleHeading({ level: levelNum })
    }
  }
}

// 一键排版功能（仅章节编辑器）
function handleFormatContent() {
  if (!props.editor) return

  try {
    // 获取当前文本内容
    const text = props.editor.getText()

    // 执行排版处理
    // 使用 store 中的规则配置
    const rules = editorStore.editorSettings.formattingRules
    const formattedText = formatText(text, rules)

    // 将排版后的文本设置回编辑器
    // 章节编辑器使用纯文本格式，需要通过 HTML 转换
    const formattedHtml = plainTextToHtml(formattedText)

    // 保存当前光标位置
    const { from } = props.editor.state.selection

    // 设置新内容
    props.editor.commands.setContent(formattedHtml)

    // 恢复光标位置（如果可能）
    const newDocSize = props.editor.state.doc.content.size
    if (newDocSize > 0) {
      const newPosition = Math.min(from, newDocSize - 1)
      props.editor.commands.setTextSelection(newPosition)
    }

    ElMessage.success('排版完成')
  } catch (error) {
    console.error('排版失败:', error)
    ElMessage.error('排版失败：' + (error.message || '未知错误'))
  }
}

// 文本排版处理函数已移至 utils/textFormatter.js

// 将纯文本转换为 HTML（用于章节模式）
function plainTextToHtml(text) {
  if (!text) return ''
  // 1. 按行分割
  const lines = text.split('\n')
  // 2. 每行处理缩进和空格
  const htmlLines = lines.map((line) => {
    // 替换Tab为8个&nbsp;
    let html = line.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;')
    // 替换连续空格为 &nbsp;
    html = html.replace(/ {2,}/g, (match) => '&nbsp;'.repeat(match.length))
    // 包裹为<p>
    return html ? `<p>${html}</p>` : ''
  })
  // 3. 拼接
  return htmlLines.join('')
}

function handleCopyContent() {
  if (!props.editor) return
  const html = props.editor.getHTML()
  navigator.clipboard.writeText(html)
  ElMessage.success('已复制内容')
}

function handleToggleSearchPanel() {
  emit('toggle-search')
}

// 全屏模式切换 - 通知父组件处理
async function handleToggleFullscreen() {
  emit('toggle-fullscreen')
}

function handleSave() {
  emit('save')
}

// 导出书籍全部内容
async function handleExport() {
  try {
    // 显示确认对话框
    await ElMessageBox.confirm('本操作会将正文下所有章节导出到一个文件，是否继续？', '导出确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 生成时间戳：YYMMDDHHmm（例如：2511041729 表示 2025年11月04日17点29分）
    const timestamp = dayjs().format('YYMMDDHHmm')

    // 用户确认后，显示保存文件对话框
    const saveResult = await window.electron.showSaveDialog({
      title: '导出章节',
      defaultPath: `${props.bookName}_${timestamp}.txt`,
      filters: [{ name: '文本文件', extensions: ['txt'] }],
      buttonLabel: '保存'
    })

    if (!saveResult || !saveResult.filePath) {
      // 用户取消了保存
      return
    }

    // 显示加载提示
    const loadingMessage = ElMessage({
      message: '正在导出章节，请稍候...',
      type: 'info',
      duration: 0,
      showClose: false
    })

    try {
      // 加载所有章节数据
      const chapters = await window.electron.loadChapters(props.bookName)

      if (!chapters || chapters.length === 0) {
        loadingMessage.close()
        ElMessage.warning('没有找到任何章节')
        return
      }

      // 收集所有章节内容
      const allContent = []
      let totalChapters = 0

      // 遍历所有卷和章节
      for (const volume of chapters) {
        if (volume.type === 'volume' && volume.children && volume.children.length > 0) {
          // 添加卷标题
          allContent.push(`\n${'='.repeat(50)}`)
          allContent.push(`【${volume.name}】`)
          allContent.push(`${'='.repeat(50)}\n`)

          // 遍历该卷下的所有章节
          for (const chapter of volume.children) {
            if (chapter.type === 'chapter') {
              try {
                // 读取章节内容
                const result = await window.electron.readChapter(
                  props.bookName,
                  volume.name,
                  chapter.name
                )

                if (result.success && result.content) {
                  // 添加章节标题
                  allContent.push(`\n${'-'.repeat(40)}`)
                  allContent.push(`${chapter.name}`)
                  allContent.push(`${'-'.repeat(40)}\n`)
                  // 添加章节内容
                  allContent.push(result.content)
                  allContent.push('\n')
                  totalChapters++
                }
              } catch (error) {
                console.error(`读取章节 ${chapter.name} 失败:`, error)
                // 继续处理其他章节
              }
            }
          }
        }
      }

      if (totalChapters === 0) {
        loadingMessage.close()
        ElMessage.warning('没有找到任何可导出的章节内容')
        return
      }

      // 合并所有内容
      const finalContent = allContent.join('\n')

      // 写入文件（通过 IPC 调用主进程写入）
      const writeResult = await window.electron.writeExportFile({
        filePath: saveResult.filePath,
        content: finalContent
      })

      if (!writeResult || !writeResult.success) {
        loadingMessage.close()
        ElMessage.error(writeResult?.message || '写入文件失败')
        return
      }

      loadingMessage.close()
      ElMessage.success(`导出成功！共导出 ${totalChapters} 个章节`)
      emit('export', { success: true, totalChapters })
    } catch (error) {
      loadingMessage.close()
      console.error('导出失败:', error)
      ElMessage.error('导出失败：' + (error.message || '未知错误'))
      emit('export', { success: false, error })
    }
  } catch (error) {
    // 用户取消了确认对话框
    if (error !== 'cancel') {
      console.error('导出操作失败:', error)
      ElMessage.error('导出操作失败：' + (error.message || '未知错误'))
      emit('export', { success: false, error })
    }
  }
}

// 处理字体选择变化
async function handleFontChange(value) {
  if (value === '__add_custom__') {
    // 恢复到上一个有效的字体
    fontFamily.value = lastValidFontFamily.value
    // 打开添加自定义字体对话框
    await showAddCustomFontDialog()
  }
}

// 显示添加自定义字体对话框
async function showAddCustomFontDialog() {
  // 防止多次弹窗
  if (isSelectingFont.value) {
    return
  }

  isSelectingFont.value = true

  try {
    // 第一步：选择字体文件
    const result = await window.electron.showOpenDialog({
      title: '选择字体文件',
      filters: [{ name: '字体文件', extensions: ['ttf', 'otf', 'woff', 'woff2'] }],
      properties: ['openFile']
    })

    if (!result || result.canceled || !result.filePaths || result.filePaths.length === 0) {
      // 用户取消了选择
      isSelectingFont.value = false
      return
    }

    const fontPath = result.filePaths[0]
    const fileName = fontPath.split(/[\\/]/).pop()
    const defaultName = fileName.replace(/\.(ttf|otf|woff|woff2)$/i, '')

    // 第二步：校验字体格式
    const isValid = await validateFontFile(fontPath)
    if (!isValid) {
      ElMessage.error('字体文件格式不正确或无法加载')
      isSelectingFont.value = false
      return
    }

    // 第三步：弹出对话框让用户输入字体名称
    const fontName = await ElMessageBox.prompt('请为这个字体设置一个名称：', '添加自定义字体', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: defaultName,
      inputPattern: /\S+/,
      inputErrorMessage: '字体名称不能为空'
    })

    if (!fontName || fontName.action !== 'confirm' || !fontName.value) {
      // 用户取消了输入
      isSelectingFont.value = false
      return
    }

    const customName = fontName.value.trim()

    // 检查是否已存在同名字体
    if (customFontsList.value.some((f) => f.name === customName)) {
      ElMessage.warning('已存在同名字体，请使用其他名称')
      isSelectingFont.value = false
      return
    }

    // 生成唯一的字体族名称
    const uniqueFontFamily = `CustomFont_${Date.now()}`

    // 加载字体文件并注册到页面
    const success = await loadCustomFont(fontPath, uniqueFontFamily)

    if (success) {
      // 添加到自定义字体列表
      customFontsList.value.unshift({
        name: customName,
        fontFamily: uniqueFontFamily,
        path: fontPath
      })

      // 保存到 localStorage
      saveCustomFonts()

      // 应用新添加的字体
      lastValidFontFamily.value = uniqueFontFamily
      emit('update:modelValue', { ...props.modelValue, fontFamily: uniqueFontFamily })
      emit('update-style')

      ElMessage.success(`已添加自定义字体：${customName}`)
    } else {
      ElMessage.error('加载字体文件失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('添加自定义字体失败:', error)
      ElMessage.error('添加字体失败：' + (error.message || '未知错误'))
    }
  } finally {
    isSelectingFont.value = false
  }
}

// 校验字体文件格式
async function validateFontFile(fontPath) {
  try {
    // 读取字体文件
    const fontData = await window.electron.readFontFile(fontPath)
    if (!fontData) {
      return false
    }

    // 尝试创建 FontFace 对象来验证
    const testFontFamily = `TestFont_${Date.now()}`
    const fontFace = new FontFace(testFontFamily, `url(data:font/truetype;base64,${fontData})`)
    await fontFace.load()

    return true
  } catch (error) {
    console.error('字体文件校验失败:', error)
    return false
  }
}

// 编辑自定义字体名称
async function handleEditCustomFont(font) {
  try {
    const result = await ElMessageBox.prompt('请输入新的字体名称：', '编辑字体', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: font.name,
      inputPattern: /\S+/,
      inputErrorMessage: '字体名称不能为空'
    })

    if (!result || result.action !== 'confirm' || !result.value) {
      return
    }

    const newName = result.value.trim()

    // 检查是否已存在同名字体（排除当前字体）
    if (customFontsList.value.some((f) => f.fontFamily !== font.fontFamily && f.name === newName)) {
      ElMessage.warning('已存在同名字体，请使用其他名称')
      return
    }

    // 更新字体名称
    const fontIndex = customFontsList.value.findIndex((f) => f.fontFamily === font.fontFamily)
    if (fontIndex !== -1) {
      customFontsList.value[fontIndex].name = newName
      saveCustomFonts()
      ElMessage.success('字体名称已更新')
    }
  } catch (error) {
    // 用户取消了操作
    if (error !== 'cancel') {
      console.error('编辑字体名称失败:', error)
    }
  }
}

// 删除自定义字体
async function handleDeleteCustomFont(font) {
  try {
    await ElMessageBox.confirm(`确定要删除字体 "${font.name}" 吗？`, '删除字体', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 从列表中移除
    const fontIndex = customFontsList.value.findIndex((f) => f.fontFamily === font.fontFamily)
    if (fontIndex !== -1) {
      customFontsList.value.splice(fontIndex, 1)
      saveCustomFonts()

      // 如果当前正在使用被删除的字体，切换到默认字体
      if (props.modelValue.fontFamily === font.fontFamily) {
        const defaultFont = 'KaiTi'
        lastValidFontFamily.value = defaultFont
        emit('update:modelValue', { ...props.modelValue, fontFamily: defaultFont })
        emit('update-style')
      }

      ElMessage.success('字体已删除')
    }
  } catch (error) {
    // 用户取消了操作
    if (error !== 'cancel') {
      console.error('删除字体失败:', error)
    }
  }
}

// 加载自定义字体文件并注册到页面
async function loadCustomFont(fontPath, fontFamily) {
  try {
    // 读取字体文件内容（通过 Electron IPC）
    const fontData = await window.electron.readFontFile(fontPath)

    if (!fontData) {
      throw new Error('无法读取字体文件')
    }

    // 创建 FontFace 对象并加载字体
    const fontFace = new FontFace(fontFamily, `url(data:font/truetype;base64,${fontData})`)
    await fontFace.load()

    // 将字体添加到 document.fonts
    document.fonts.add(fontFace)

    return true
  } catch (error) {
    console.error('加载自定义字体失败:', error)
    return false
  }
}

// 暴露方法供父组件调用
defineExpose({
  globalBoldMode,
  globalItalicMode,
  handleFormatContent
})
</script>

<style lang="scss" scoped>
.editor-menubar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 15px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-soft);
  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}
.toolbar-item {
  margin: 0;
}

.highlight-colors {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.highlight-color-item {
  padding: 5px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;

  .hightlight-color-item-main {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid transparent;
  }

  &:hover {
    transform: scale(1.15);
    background: #e3e3e3;
    .hightlight-color-item-main {
      border-color: var(--el-color-primary);
    }
  }

  &.active {
    background: #e3e3e3;
    .hightlight-color-item-main {
      border-color: var(--el-color-primary);
    }
  }

  &.highlight-color-none {
    .hightlight-color-item-main {
      border-color: transparent;
      &:hover,
      &.active {
        border-color: transparent;
      }
    }
  }
}

.highlight-color-split {
  width: 1px;
  height: 15px;
  background: #999;
}
</style>

<!-- 非 scoped 样式用于下拉菜单（Teleport 到 body） -->
<style lang="scss">
/* 自定义字体选项样式 - 覆盖 ElementPlus 的默认 padding */
.el-select-dropdown__item {
  &:has(.custom-font-option) {
    padding: 0 !important;
  }
}

.custom-font-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 20px 0 20px;
  min-height: 34px;

  .font-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-right: 16px;
  }

  .font-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.2s;
    flex-shrink: 0;

    .action-icon {
      cursor: pointer;
      font-size: 14px;
      color: #606266;
      transition: color 0.2s;

      &:hover {
        color: var(--el-color-primary);
      }
    }
  }

  &:hover .font-actions {
    opacity: 1;
  }
}
</style>

