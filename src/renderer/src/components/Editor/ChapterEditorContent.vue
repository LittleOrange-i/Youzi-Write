<script setup>
import { ref } from 'vue'
import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { Extension } from '@tiptap/core'
import { Collapsible } from '@renderer/extensions/Collapsible'
import { useJailStore } from '@renderer/stores/jail'

const jailStore = useJailStore()

const props = defineProps({
  editorStore: {
    type: Object,
    required: true
  },
  menubarState: {
    type: Object,
    required: true
  },
  isComposing: {
    type: Boolean,
    default: false
  },
  getFontFamily: {
    type: Function,
    required: true
  },
  autoSaveContent: {
    type: Function,
    required: true
  }
})

// 本地定时器，避免直接修改 prop
const saveTimer = ref(null)

const emit = defineEmits(['editor-created', 'content-updated'])

// 支持Tab键插入制表符
const TabInsert = Extension.create({
  name: 'tabInsert',
  addKeyboardShortcuts() {
    return {
      Tab: () => {
        this.editor.commands.insertContent('\t')
        return true
      }
    }
  }
})

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

// 获取章节编辑器的扩展配置
function getChapterExtensions() {
  // 扩展 Highlight 支持 class 属性（用于区分不同类型的高亮）
  const CustomHighlight = Highlight.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        class: {
          default: null,
          parseHTML: (element) => element.getAttribute('data-highlight-class'),
          renderHTML: (attributes) => {
            if (!attributes.class) {
              return {}
            }
            return {
              'data-highlight-class': attributes.class
            }
          }
        },
        color: {
          default: null,
          parseHTML: (element) => element.style.backgroundColor,
          renderHTML: (attributes) => {
            if (!attributes.color) {
              return {}
            }
            // 默认使用背景色高亮
            return {
              style: `background-color: ${attributes.color}`
            }
          }
        }
      }
    }
  })
  
  return [
    StarterKit,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    CustomHighlight.configure({
      multicolor: true,
      HTMLAttributes: {
        class: 'search-highlight'
      }
    }),
    TabInsert,
    Collapsible // Collapsible 扩展只在章节模式下使用
  ]
}

// 创建章节编辑器实例
function createEditor() {
  const editor = new Editor({
    extensions: getChapterExtensions(),
    // 不在创建时设置内容，由 initEditor 统一控制内容设置时机，避免重复设置
    content: '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
        style: () => {
          const fullFontFamily = props.getFontFamily(props.menubarState.fontFamily)
          const fontFamilyStyle = `font-family: ${fullFontFamily} !important;`
          return `white-space: pre-wrap; ${fontFamilyStyle} font-size: ${props.menubarState.fontSize} !important; line-height: ${props.menubarState.lineHeight} !important;`
        }
      },
      // 监听粘贴事件，通知专注模式 store
      handlePaste: () => {
        // 标记粘贴操作开始
        jailStore.markPasteStart()
        // 粘贴操作完成后标记结束（在 DOM 更新后）
        setTimeout(() => {
          jailStore.markPasteEnd()
        }, 10)
        // 返回 false 表示继续默认的粘贴处理
        return false
      }
    },
    onUpdate: ({ editor }) => {
      // 章节模式：保存纯文本格式
      const content = editor.getText()

      // 如果正在进行输入法输入（composition），不更新字数统计
      if (!props.isComposing) {
        props.editorStore.setContent(content)
      }

      // 防抖保存
      if (saveTimer.value) clearTimeout(saveTimer.value)
      saveTimer.value = setTimeout(() => {
        props.autoSaveContent()
      }, 1000)

      emit('content-updated', content)
    },
    onSelectionUpdate: () => {
      // 按钮状态由 EditorMenubar 组件管理
    }
  })

  return editor
}

// 设置章节编辑器内容
/**
 * 设置章节内容（带有光标保持逻辑）
 * @param {Object} editor - Tiptap 编辑器实例
 * @param {String} content - 新的内容文本
 */
function setChapterContent(editor, content) {
  if (!editor) return // 如果编辑器实例不存在则返回
  
  const htmlContent = content ? plainTextToHtml(content) : '' // 将纯文本转换为 HTML 格式
  
  // 性能优化：如果新内容与当前内容完全一致，则跳过更新
  // 这样可以避免不必要的 DOM 重绘，并彻底解决内容一致时的光标抖动问题
  if (editor.getHTML() === htmlContent) return // 结束判断
  
  // 记录当前的光标位置和选区状态
  const { from, to } = editor.state.selection // 获取当前的选区范围
  
  // 执行内容更新，第二个参数 false 表示不触发某些内部副作用（如果 Tiptap 版本支持）
  editor.commands.setContent(htmlContent) // 更新编辑器内容
  
  // 尝试恢复光标位置
  // 注意：如果文档结构发生了巨大变化，恢复可能会失效，但对于普通的文字输入同步，这能有效防止光标跳到末尾
  try {
    const docSize = editor.state.doc.content.size // 获取新文档的总长度
    const safeFrom = Math.min(from, docSize) // 确保光标起始位置不越界
    const safeTo = Math.min(to, docSize) // 确保光标结束位置不越界
    editor.commands.setTextSelection({ from: safeFrom, to: safeTo }) // 恢复选区
  } catch (e) {
    console.warn('[章节编辑器] 恢复光标位置失败:', e) // 记录警告信息
  } // 结束尝试恢复
}

// 获取章节编辑器保存内容
function getSaveContent(editor) {
  if (!editor) return ''
  return editor.getText()
}

// 暴露方法给父组件
defineExpose({
  createEditor,
  setChapterContent,
  getSaveContent,
  plainTextToHtml
})
</script>

<template>
  <span style="display: none"></span>
</template>

<style scoped>
/* 章节模式：段落首行缩进，确保进入编辑器首次加载也生效 */
:deep(.tiptap-editor p) {
  text-indent: 2em;
  margin: 0; /* 避免浏览器默认 margin 影响视觉缩进 */
}
</style>
