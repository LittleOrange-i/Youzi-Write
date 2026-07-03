<script setup>
import { ref } from 'vue'
import MarkdownIt from 'markdown-it'
import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Document from '@tiptap/extension-document'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { Extension } from '@tiptap/core'
import { NoteOutlineParagraph } from '@renderer/extensions/NoteOutline'
import { Plugin, PluginKey, NodeSelection } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import { Fragment, DOMParser as PMDOMParser } from 'prosemirror-model'
import { Extension as PMExtension } from '@tiptap/core'

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

// Tab 键处理已由 NoteOutlineParagraph 扩展提供（增加/减少缩进级别）

const markdown = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true
})

const MARKDOWN_SYNTAX_RE =
  /(^|\n)(#{1,6}\s+|>\s+|```|~~~|[-+*]\s+|\d+\.\s+|---+$|___+$|\*\*\*+$)|(\[[^\]]+\]\([^)]+\))|(`[^`]+`)|(\*\*[^*]+\*\*)|(~~[^~]+~~)|(^|\s)!\[[^\]]*\]\([^)]+\)/

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeMarkdownText(text) {
  return text.replace(/\\/g, '\\\\').replace(/([*_`~[\]<>])/g, '\\$1')
}

function htmlToPlainText(content) {
  if (!content) return ''
  if (isHtmlContent(content)) {
    const div = document.createElement('div')
    div.innerHTML = content
    return div.textContent || div.innerText || ''
  }
  const html = looksLikeMarkdown(content)
    ? normalizeMarkdownToNoteHtml(content)
    : plainTextToNoteHtml(content)
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

function looksLikeMarkdown(content) {
  return MARKDOWN_SYNTAX_RE.test(content)
}

// 检查内容是否是 HTML 格式
function isHtmlContent(content) {
  if (!content) return false
  return /<[a-z][\s\S]*>/i.test(content)
}

function createOutlineParagraphHtml(content, level = 0, collapsed = false) {
  const collapsedAttr = collapsed ? ' data-collapsed="true"' : ''
  return `<p data-note-outline="true" data-level="${Math.max(0, Math.min(level, 10))}"${collapsedAttr}>${content}</p>`
}

function plainTextToNoteHtml(content) {
  const lines = String(content || '').replace(/\r\n/g, '\n').split('\n')
  const html = lines
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return createOutlineParagraphHtml('', 0)
      const indentMatch = line.match(/^(\t| {2})*/)
      const rawIndent = indentMatch ? indentMatch[0] : ''
      const level = Math.floor(rawIndent.replace(/\t/g, '  ').length / 2)
      return createOutlineParagraphHtml(escapeHtml(trimmed), level)
    })
    .join('')

  return html || createOutlineParagraphHtml('', 0)
}

function getListItemInlineHtml(listItem) {
  const clone = listItem.cloneNode(true)
  clone.querySelectorAll(':scope > ul, :scope > ol').forEach((childList) => childList.remove())
  const paragraphChildren = Array.from(clone.children).filter((child) => child.tagName === 'P')
  if (paragraphChildren.length) {
    return paragraphChildren.map((child) => child.innerHTML).join('<br>')
  }
  return clone.innerHTML.trim()
}

function convertListToOutlineHtml(listElement, level = 0) {
  const blocks = []
  Array.from(listElement.children).forEach((child) => {
    if (child.tagName !== 'LI') return
    const inlineHtml = getListItemInlineHtml(child)
    blocks.push(createOutlineParagraphHtml(inlineHtml, level))
    Array.from(child.children).forEach((nestedList) => {
      if (nestedList.tagName === 'UL' || nestedList.tagName === 'OL') {
        blocks.push(convertListToOutlineHtml(nestedList, level + 1))
      }
    })
  })
  return blocks.join('')
}

function normalizeRenderedNoteHtml(html) {
  const container = document.createElement('div')
  container.innerHTML = html || ''
  const normalizedBlocks = []

  Array.from(container.childNodes).forEach((node) => {
    if (node.nodeType === globalThis.Node.TEXT_NODE) {
      const text = node.textContent?.trim()
      if (text) {
        normalizedBlocks.push(createOutlineParagraphHtml(escapeHtml(text), 0))
      }
      return
    }

    if (!(node instanceof HTMLElement)) return

    if (node.tagName === 'P') {
      const level = Number(node.getAttribute('data-level') || 0)
      const collapsed = node.hasAttribute('data-collapsed')
      normalizedBlocks.push(createOutlineParagraphHtml(node.innerHTML, level, collapsed))
      return
    }

    if (node.tagName === 'UL' || node.tagName === 'OL') {
      normalizedBlocks.push(convertListToOutlineHtml(node, 0))
      return
    }

    // 处理标题 H1-H6：提取内容为大纲段落
    if (/^H[1-6]$/.test(node.tagName)) {
      normalizedBlocks.push(createOutlineParagraphHtml(node.innerHTML, 0))
      return
    }

    // 处理引用块 BLOCKQUOTE：递归提取内部内容
    if (node.tagName === 'BLOCKQUOTE') {
      // 将 blockquote 内部 HTML 重新走一遍 normalize，正确转换内部元素
      const rendered = normalizeRenderedNoteHtml(node.innerHTML)
      if (rendered) {
        normalizedBlocks.push(rendered)
      }
      return
    }

    // 处理代码块 PRE：提取纯文本，逐行生成大纲段落
    if (node.tagName === 'PRE') {
      const text = node.textContent || ''
      const lines = text.split('\n')
      lines.forEach((line) => {
        normalizedBlocks.push(createOutlineParagraphHtml(escapeHtml(line), 0))
      })
      return
    }

    // 处理水平线 HR：跳过
    if (node.tagName === 'HR') {
      return
    }

    // 处理表格 TABLE 及其他未知元素：提取纯文本内容
    const textContent = node.textContent || ''
    const textLines = textContent.split('\n').filter((l) => l.trim())
    textLines.forEach((line) => {
      normalizedBlocks.push(createOutlineParagraphHtml(escapeHtml(line.trim()), 0))
    })
  })

  return normalizedBlocks.join('') || createOutlineParagraphHtml('', 0)
}

function normalizeMarkdownToNoteHtml(content) {
  const renderedHtml = markdown.render(String(content || '').replace(/\r\n/g, '\n'))
  return normalizeRenderedNoteHtml(renderedHtml)
}

function normalizeLegacyHtmlToNoteHtml(content) {
  return normalizeRenderedNoteHtml(content)
}

function wrapMarkedText(text, marks = []) {
  const sortedMarks = [...marks].sort((a, b) => {
    const order = ['link', 'bold', 'italic', 'strike', 'code']
    return order.indexOf(a.type.name) - order.indexOf(b.type.name)
  })

  let result = escapeMarkdownText(text)
  for (const mark of sortedMarks) {
    if (mark.type.name === 'link' && mark.attrs?.href) {
      result = `[${result}](${mark.attrs.href})`
    } else if (mark.type.name === 'bold') {
      result = `**${result}**`
    } else if (mark.type.name === 'italic') {
      result = `*${result}*`
    } else if (mark.type.name === 'strike') {
      result = `~~${result}~~`
    } else if (mark.type.name === 'code') {
      result = `\`${text.replace(/`/g, '\\`')}\``
    }
  }
  return result
}

function serializeInlineNode(node) {
  if (node.type.name === 'text') {
    return wrapMarkedText(node.text || '', node.marks)
  }
  if (node.type.name === 'hardBreak') {
    return '  \n'
  }
  return ''
}

function serializeInlineContent(node) {
  return node.content.content.map((child) => serializeInlineNode(child)).join('')
}

function serializeListNode(node, level = 0) {
  const lines = []
  node.content.content.forEach((child, index) => {
    if (child.type.name !== 'listItem') return
    const marker = node.type.name === 'orderedList' ? `${index + 1}. ` : '- '
    let firstLineUsed = false

    child.content.content.forEach((grandChild) => {
      if (grandChild.type.name === 'paragraph') {
        const line = `${'  '.repeat(level)}${firstLineUsed ? '  ' : marker}${serializeInlineContent(grandChild)}`.trimEnd()
        lines.push(line || `${'  '.repeat(level)}${firstLineUsed ? '  ' : marker}`)
        firstLineUsed = true
      } else if (grandChild.type.name === 'bulletList' || grandChild.type.name === 'orderedList') {
        lines.push(serializeListNode(grandChild, level + 1))
      } else {
        const block = serializeBlockNode(grandChild, level + 1)
        if (block) lines.push(block)
      }
    })
  })
  return lines.join('\n')
}

function serializeBlockquote(node) {
  const content = node.content.content
    .map((child) => serializeBlockNode(child))
    .filter(Boolean)
    .join('\n\n')
  return content
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n')
}

function serializeBlockNode(node) {
  if (!node) return ''

  if (node.type.name === 'noteOutlineParagraph') {
    const level = node.attrs.level || 0
    const content = serializeInlineContent(node)
    return `${'  '.repeat(level)}- ${content}`.trimEnd()
  }

  if (node.type.name === 'paragraph') {
    return serializeInlineContent(node)
  }

  if (node.type.name === 'heading') {
    return `${'#'.repeat(node.attrs.level || 1)} ${serializeInlineContent(node)}`.trimEnd()
  }

  if (node.type.name === 'codeBlock') {
    const language = node.attrs.language || ''
    return `\`\`\`${language}\n${node.textContent}\n\`\`\``
  }

  if (node.type.name === 'horizontalRule') {
    return '---'
  }

  if (node.type.name === 'blockquote') {
    return serializeBlockquote(node)
  }

  if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
    return serializeListNode(node)
  }

  return ''
}

function editorDocToMarkdown(doc) {
  const blocks = []
  let previousWasOutline = false

  doc.content.content.forEach((node) => {
    const block = serializeBlockNode(node)
    if (!block && node.type.name !== 'noteOutlineParagraph') return
    const currentIsOutline = node.type.name === 'noteOutlineParagraph'

    if (blocks.length && !previousWasOutline && !currentIsOutline && blocks[blocks.length - 1] !== '') {
      blocks.push('')
    } else if (blocks.length && previousWasOutline !== currentIsOutline && blocks[blocks.length - 1] !== '') {
      blocks.push('')
    }

    blocks.push(block)
    previousWasOutline = currentIsOutline
  })

  return blocks.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

// 获取笔记编辑器的扩展配置
function getNoteExtensions() {
  // 笔记模式：手动配置，禁用依赖 paragraph 的扩展
  // 扩展顺序很重要：NoteOutlineParagraph 必须在 StarterKit 之前，这样 trailingNode 才能找到它
  return [
    Document.configure({
      content: 'block+' // 支持多种块节点（仅 noteOutlineParagraph 和 paragraph）
    }),
    NoteOutlineParagraph, // 必须在 StarterKit 之前定义，这样 trailingNode 才能找到它
    StarterKit.configure({
      paragraph: true,
      document: false, // 禁用默认的 Document，使用上面自定义的
      heading: true,
      blockquote: true,
      codeBlock: true,
      horizontalRule: true,
      hardBreak: true,
      dropcursor: true,
      gapcursor: true,
      history: true,
      bulletList: true,
      orderedList: true,
      listItem: true,
      listKeymap: true,
      trailingNode: {
        node: 'paragraph',
        notAfter: ['noteOutlineParagraph', 'paragraph']
      }
    }),
    TextAlign.configure({ types: ['heading', 'noteOutlineParagraph', 'paragraph'] }),
    Highlight.configure({
      multicolor: true,
      HTMLAttributes: {
        class: 'search-highlight'
      }
    })
  ]
}

// 处理回车换行与段落拆分的修复：避免产生多余空段、确保连续回车可用
const NoteEnterFix = PMExtension.create({
  name: 'noteEnterFix',
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const editor = this.editor
        const { state } = editor
        const paragraphType = state.schema.nodes.noteOutlineParagraph
        const $from = state.selection.$from
        if (!$from || $from.parent.type !== paragraphType) return false

        // 执行默认的块拆分
        const did = editor.commands.splitBlock()
        if (!did) return true

        // 轻量归一化：删除“当前位置附近多余的顶层空段”
        editor
          .chain()
          .focus()
          .command(({ tr }) => {
            const isEmptyNote = (n) =>
              n &&
              n.type === paragraphType &&
              (n.content.size === 0 ||
                (typeof n.textContent === 'string' && n.textContent.trim() === ''))

            const sel = tr.selection
            const $pos = tr.doc.resolve(sel.from)
            // 前后各检查一段
            const prev = $pos.nodeBefore
            const next = $pos.nodeAfter

            if (isEmptyNote(next)) {
              tr.delete(sel.from, sel.from + next.nodeSize)
            } else if (isEmptyNote(prev)) {
              tr.delete(sel.from - prev.nodeSize, sel.from)
            }
            return true
          })
          .run()

        return true
      }
    }
  }
})

// 段落拖拽锚点扩展：为每个 noteOutlineParagraph 添加可拖拽锚点
const NoteDragHandle = Extension.create({
  name: 'noteDragHandle',
  addProseMirrorPlugins() {
    const key = new PluginKey('note-drag-handle')
    // 运行时拖拽起点（段落起始位置）
    let draggingPos = null
    // 计算并执行在屏幕坐标处的顶层段落重排（包括所有子段落）
    function moveParagraphAtPoint(view, clientX, clientY) {
      const { state } = view
      const rect = view.dom.getBoundingClientRect()
      const clampedX = Math.max(rect.left + 1, Math.min(clientX, rect.right - 1))
      const clampedY = Math.max(rect.top + 1, Math.min(clientY, rect.bottom - 1))
      const posInfo = view.posAtCoords({ left: clampedX, top: clampedY })
      if (!posInfo) return false
      const $from = state.doc.resolve(draggingPos)
      const sourceIndex = $from.index(0)
      const sourceNode = state.doc.child(sourceIndex)

      // 检查源节点是否是 noteOutlineParagraph
      if (sourceNode.type.name !== 'noteOutlineParagraph') return false

      const sourceLevel = sourceNode.attrs.level || 0

      const $pos = state.doc.resolve(posInfo.pos)
      let targetIndex = $pos.index(0)

      const domAt = view.nodeDOM($pos.before(1))
      let insertAfter = false
      if (domAt) {
        const tRect = domAt.getBoundingClientRect()
        const midY = tRect.top + tRect.height / 2
        insertAfter = clampedY >= midY
      }

      // 找到源段落及其所有子段落（缩进级别大于源段落的连续段落）
      let moveCount = 1 // 至少移动源段落本身
      let nextIndex = sourceIndex + 1

      // 从源段落的下一个段落开始，查找所有子段落
      while (nextIndex < state.doc.childCount) {
        const nextNode = state.doc.child(nextIndex)
        if (nextNode.type.name === 'noteOutlineParagraph') {
          const nextLevel = nextNode.attrs.level || 0
          // 如果下一段落的层级大于源段落，说明是子段落，需要一起移动
          if (nextLevel > sourceLevel) {
            moveCount++
            nextIndex++
          } else {
            // 遇到同级或更高级的段落，停止查找
            break
          }
        } else {
          // 遇到非 noteOutlineParagraph 节点，停止查找
          break
        }
      }

      // 检查目标位置是否在要移动的段落范围内
      if (!insertAfter && targetIndex >= sourceIndex && targetIndex < sourceIndex + moveCount) {
        return true // 目标位置在移动范围内，不需要移动
      }
      if (insertAfter && targetIndex >= sourceIndex && targetIndex < sourceIndex + moveCount - 1) {
        return true // 目标位置在移动范围内，不需要移动
      }

      const children = []
      state.doc.forEach((child) => {
        children.push(child)
      })

      // 移除源段落及其所有子段落
      const movedParagraphs = children.splice(sourceIndex, moveCount)

      // 计算目标插入位置
      let destIndex = targetIndex
      if (sourceIndex < targetIndex) {
        // 如果源位置在目标位置之前，需要减去已移除的段落数
        destIndex -= moveCount
      }

      // 确保目标位置不在要移动的段落范围内
      if (destIndex >= sourceIndex && destIndex < sourceIndex + moveCount) {
        destIndex = sourceIndex // 如果目标位置在移动范围内，保持原位置
      }

      // 在目标位置插入所有段落（包括子段落）
      if (insertAfter) {
        children.splice(destIndex + 1, 0, ...movedParagraphs)
      } else {
        children.splice(destIndex, 0, ...movedParagraphs)
      }

      const newDoc = state.doc.type.create(state.doc.attrs, Fragment.from(children))
      const tr = state.tr.replaceWith(0, state.doc.content.size, newDoc.content)
      view.dispatch(tr.scrollIntoView())
      return true
    }
    return [
      new Plugin({
        key,
        state: {
          init: (_, { doc, schema }) => {
            return buildDecorations(doc, schema)
          },
          apply: (tr, old) => {
            // 当文档变化时，重新构建装饰
            if (tr.docChanged) {
              return buildDecorations(tr.doc, tr.doc.type.schema)
            }
            return old.map(tr.mapping, tr.doc)
          }
        },
        view(editorView) {
          // 捕获全局拖拽结束/放置，覆盖左侧功能栏等非编辑区位置
          let lastPoint = null
          const onDocDrop = (e) => {
            if (draggingPos == null) return
            e.preventDefault()
            moveParagraphAtPoint(editorView, e.clientX, e.clientY)
            draggingPos = null
          }
          const onDocDragOver = (e) => {
            if (draggingPos == null) return
            // 确保会触发 drop 事件
            e.preventDefault()
            lastPoint = { x: e.clientX, y: e.clientY }
          }
          const onDocDragEnd = () => {
            if (draggingPos != null && lastPoint) {
              // 如果没有触发 drop，也在 dragend 时根据最后位置执行一次移动
              moveParagraphAtPoint(editorView, lastPoint.x, lastPoint.y)
            }
            draggingPos = null
            lastPoint = null
          }
          document.addEventListener('drop', onDocDrop)
          document.addEventListener('dragover', onDocDragOver)
          document.addEventListener('dragend', onDocDragEnd)
          return {
            destroy() {
              document.removeEventListener('drop', onDocDrop)
              document.removeEventListener('dragover', onDocDragOver)
              document.removeEventListener('dragend', onDocDragEnd)
            }
          }
        },
        props: {
          decorations(state) {
            return buildDecorations(state.doc, state.schema)
          },
          handleDOMEvents: {
            mousedown: (view, event) => {
              const target = event.target
              if (!(target instanceof HTMLElement)) return false
              if (!target.classList.contains('note-outline-drag-handle')) return false
              const pos = Number(target.dataset.pos || -1)
              if (pos < 0) return false
              const { state } = view
              // 选中整个段落节点，后续由 ProseMirror 内置的拖拽/放置完成移动
              // 找到段落节点起始位置
              const node = state.doc.nodeAt(pos)
              if (!node) return false
              const tr = state.tr.setSelection(NodeSelection.create(state.doc, pos))
              view.dispatch(tr)
              // 让锚点可拖拽，显示为“抓取”手势
              target.setAttribute('draggable', 'true')
              // 记录拖拽起点
              draggingPos = pos
              return true
            },
            dragstart: (view, event) => {
              const target = event.target
              if (!(event instanceof DragEvent)) return false
              if (!(target instanceof HTMLElement)) return false
              if (!target.classList.contains('note-outline-drag-handle')) return false
              const pos = Number(target.dataset.pos || -1)
              if (pos < 0) return false
              // 确保拖拽开始时已记录 draggingPos
              if (draggingPos == null) draggingPos = pos
              // 创建一个小的透明拖拽预览图，避免显示巨大的图标
              try {
                if (event.dataTransfer) {
                  event.dataTransfer.effectAllowed = 'move'
                  // 设置任意数据以启用 Firefox 的 drop
                  event.dataTransfer.setData('text/plain', 'move-note-paragraph')
                  
                  // 创建一个小的透明图像作为拖拽预览
                  const img = document.createElement('div')
                  img.style.position = 'fixed'
                  img.style.top = '-10000px'
                  img.style.left = '-10000px'
                  img.style.width = '1px'
                  img.style.height = '1px'
                  img.style.opacity = '0'
                  document.body.appendChild(img)
                  
                  // 使用透明的小图像作为拖拽预览
                  event.dataTransfer.setDragImage(img, 0, 0)
                  
                  // 下一帧移除临时元素
                  requestAnimationFrame(() => {
                    if (img.parentNode) {
                      img.parentNode.removeChild(img)
                    }
                  })
                }
              } catch {
                // 安全兜底：忽略 drag image 设置失败
              }
              return true
            },
            dragover: (view, event) => {
              // 允许放置
              if (draggingPos != null) {
                event.preventDefault()
                if (event.dataTransfer) {
                  event.dataTransfer.dropEffect = 'move'
                }
                return true
              }
              return false
            },
            drop: (view, event) => {
              if (draggingPos == null) return false
              event.preventDefault()
              moveParagraphAtPoint(view, event.clientX, event.clientY)
              draggingPos = null
              return true
            },
            dragend: () => {
              draggingPos = null
              return false
            }
          }
        }
      })
    ]
  }
})

function buildDecorations(doc, schema) {
  const decorations = []
  const paragraphType = schema.nodes.noteOutlineParagraph
  if (!paragraphType) return DecorationSet.empty

  doc.descendants((node, nodePos) => {
    if (node.type === paragraphType) {
      // 给段落增加相对定位类，便于绝对定位锚点
      const nodeDeco = Decoration.node(nodePos, nodePos + node.nodeSize, {
        class: 'has-note-drag-handle'
      })
      decorations.push(nodeDeco)
      // 在段首插入一个锚点控件
      const handle = document.createElement('span')
      handle.className = 'note-outline-drag-handle'
      handle.dataset.pos = String(nodePos)
      handle.setAttribute('draggable', 'true')
      handle.title = '拖动以移动该段落'
      // 使用 SVG 图标，上下箭头，提示可拖拽移动该段落
      handle.innerHTML = `
        <svg data-v-58697b5c="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="currentColor" d="M384 96a32 32 0 0 1 64 0v786.752a32 32 0 0 1-54.592 22.656L95.936 608a32 32 0 0 1 0-45.312h.128a32 32 0 0 1 45.184 0L384 805.632zm192 45.248a32 32 0 0 1 54.592-22.592L928.064 416a32 32 0 0 1 0 45.312h-.128a32 32 0 0 1-45.184 0L640 218.496V928a32 32 0 1 1-64 0z"></path></svg>
      `
      // 将锚点作为小部件挂载在段首（side: -1 更贴近段落开始）
      const widget = Decoration.widget(nodePos + 1, handle, { side: -1 })
      decorations.push(widget)
    }
    return true
  })
  return DecorationSet.create(doc, decorations)
}

// 创建笔记编辑器实例
function createEditor() {
  const editor = new Editor({
    extensions: [...getNoteExtensions(), NoteEnterFix, NoteDragHandle],
    // 不在创建时设置内容，由 initEditor 统一控制内容设置时机，避免重复设置
    content: '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor note-editor',
        style: () => {
          const fullFontFamily = props.getFontFamily(props.menubarState.fontFamily)
          const fontFamilyStyle = `font-family: ${fullFontFamily} !important;`
          
          const fontSize = parseInt(props.menubarState.fontSize) // 获取字号数值
          const lineHeight = parseFloat(props.menubarState.lineHeight) // 获取行高倍数
          const actualLineHeight = fontSize * lineHeight // 计算实际行高像素值
          
          let gridStyles = '' // 初始化网格样式字符串
          const gridSettings = props.editorStore.editorSettings.gridLines || {} // 从 store 获取网格配置
          
          if (gridSettings.enabled) { // 如果启用了网格
            const color = gridSettings.lineColor || '#e0e0e0' // 获取线条颜色
            const thickness = gridSettings.boldSize ? '2px' : '1px' // 获取线条粗细
            // 计算底部贴合偏移量
            const stickOffset = gridSettings.stickToBottom ? (actualLineHeight - fontSize) / 2 : 0
            
            let backgroundImage = '' // 初始化背景图
            let backgroundSize = `100% ${actualLineHeight}px` // 初始化背景尺寸
            let backgroundPosition = `0 ${-stickOffset}px` // 初始化背景位置
            
            const encodedColor = encodeURIComponent(color) // 编码颜色用于 SVG
            const thicknessInt = parseInt(thickness) // 解析粗细数值
            
            if (gridSettings.lineType === 'single-solid') { // 单实线
              // 生成单实线 SVG 背景
              backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='${actualLineHeight}'%3E%3Crect x='0' y='0' width='1' height='${thicknessInt}' fill='${encodedColor}'/%3E%3C/svg%3E")`
              backgroundSize = `100% ${actualLineHeight}px` // 设置背景尺寸
              backgroundPosition = `0 ${actualLineHeight - stickOffset - thicknessInt}px` // 设置背景位置
            } else if (gridSettings.lineType === 'double-solid') { // 双实线
              // 生成双实线 SVG 背景
              backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='${actualLineHeight}'%3E%3Crect x='0' y='0' width='1' height='${thicknessInt}' fill='${encodedColor}'/%3E%3Crect x='0' y='3' width='1' height='${thicknessInt}' fill='${encodedColor}'/%3E%3C/svg%3E")`
              backgroundSize = `100% ${actualLineHeight}px` // 设置背景尺寸
              backgroundPosition = `0 ${actualLineHeight - stickOffset - thicknessInt}px` // 设置背景位置
            } else if (gridSettings.lineType === 'sparse-dashed' || gridSettings.lineType === 'dense-dashed') { // 虚线
              const dashLen = gridSettings.lineType === 'sparse-dashed' ? 8 : 4 // 确定虚线长度
              // 生成虚线 SVG 背景
              backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${dashLen * 2}' height='${actualLineHeight}'%3E%3Crect x='0' y='0' width='${dashLen}' height='${thicknessInt}' fill='${encodedColor}'/%3E%3C/svg%3E")`
              backgroundSize = `${dashLen * 2}px ${actualLineHeight}px` // 设置背景尺寸
              backgroundPosition = `0 ${actualLineHeight - stickOffset - thicknessInt}px` // 设置背景位置
            }
            
            if (backgroundImage) { // 如果生成了背景图
              // 拼接网格样式字符串
              gridStyles = `background-image: ${backgroundImage} !important; background-size: ${backgroundSize} !important; background-position: ${backgroundPosition} !important; background-repeat: repeat !important; background-attachment: local !important;`
            }
          }

          // 将行高转换为像素值，确保与网格背景精确匹配，避免因浏览器舍入误差导致的累积偏移
          const lineHeightPx = `${actualLineHeight}px`
          return `white-space: pre-wrap; ${fontFamilyStyle} font-size: ${props.menubarState.fontSize} !important; line-height: ${lineHeightPx} !important; ${gridStyles}`
        }
      },
      // 粘贴时自动解析 markdown 语法（如 # 标题、> 引用、- 列表、**粗体** 等）
      handlePaste: (view, event) => {
        const text = event.clipboardData.getData('text/plain')
        if (!text || !looksLikeMarkdown(text)) {
          return false
        }
        try {
          const html = normalizeMarkdownToNoteHtml(text)
          // 使用临时容器，parseSlice 会解析容器的子元素，避免外层 <div> 被误解析
          const wrapper = document.createElement('div')
          wrapper.innerHTML = html
          const slice = PMDOMParser.fromSchema(view.state.schema).parseSlice(wrapper)
          if (slice.content.size === 0) {
            return false
          }
          view.dispatch(view.state.tr.replaceSelection(slice))
          return true
        } catch {
          return false
        }
      }
    },
  onUpdate: ({ editor }) => {
      const content = getSaveContent(editor)

      // 如果正在进行输入法输入（composition），不更新字数统计
      if (!props.isComposing) {
        const textContent = editor.getText({ blockSeparator: '\n' })
        props.editorStore.setContent(textContent)
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

/**
 * 设置笔记编辑器内容（带有光标保持逻辑）
 * @param {Object} editor - Tiptap 编辑器实例
 * @param {String} content - 新的内容文本（HTML 或纯文本）
 */
function setNoteContent(editor, content) {
  if (!editor) return // 如果编辑器实例不存在则返回
  
  let htmlContent = '' // 初始化待设置的 HTML 内容
  
  // 即使内容为空，也要清空编辑器，确保显示空内容而不是保留之前的内容
  if (!content) { // 如果内容为空
    htmlContent = '<p data-note-outline data-level="0"></p>' // 设置默认的笔记大纲段落
  } else if (isHtmlContent(content)) { // 如果输入的是 HTML 格式
    htmlContent = normalizeLegacyHtmlToNoteHtml(content)
  } else { // 如果输入的是纯文本格式
    htmlContent = looksLikeMarkdown(content)
      ? normalizeMarkdownToNoteHtml(content)
      : plainTextToNoteHtml(content)
  }

  // 性能优化：如果新生成的 HTML 与当前编辑器内容一致，则跳过更新
  // 这样可以避免不必要的 DOM 重绘，并防止光标位置被意外重置
  if (editor.getHTML() === htmlContent) return // 结束优化判断
  
  // 记录当前的光标位置和选区状态
  const { from, to } = editor.state.selection // 获取当前的选区范围
  
  // 执行内容更新
  editor.commands.setContent(htmlContent) // 调用 Tiptap 指令设置内容
  
  // 尝试恢复光标位置
  try {
    const docSize = editor.state.doc.content.size // 获取新文档的总长度
    const safeFrom = Math.min(from, docSize) // 确保光标起始位置不越界
    const safeTo = Math.min(to, docSize) // 确保光标结束位置不越界
    editor.commands.setTextSelection({ from: safeFrom, to: safeTo }) // 恢复选区位置
  } catch (e) {
    console.warn('[笔记编辑器] 恢复光标位置失败:', e) // 记录警告日志
  } // 结束光标恢复逻辑
}

// 获取笔记编辑器保存内容
function getSaveContent(editor) {
  if (!editor) return ''
  return editorDocToMarkdown(editor.state.doc)
}

// 暴露方法给父组件
defineExpose({
  createEditor,
  setNoteContent,
  getSaveContent,
  htmlToPlainText,
  isHtmlContent
})
</script>

<template>
  <span style="display: none"></span>
</template>

<style>
/* 笔记编辑器中的段落基础样式，确保与网格对齐 */
.tiptap.note-editor p {
  margin: 0 !important; /* 必须消除段落外边距，否则会破坏网格对齐 */
  padding-top: 0 !important; /* 消除内边距 */
  padding-bottom: 0 !important; /* 消除内边距 */
  min-height: 1em; /* 保证空行也有高度 */
}

/* 段落拖拽锚点样式（仅笔记模式生效） */
/* 为笔记编辑区预留统一左侧功能栏宽度，便于放置多个功能图标 */
.tiptap.note-editor {
  --note-gutter-width: 36px; /* 图标区宽度，可按需调整 */
  padding-left: var(--note-gutter-width);
}

.tiptap.note-editor p[data-note-outline] {
  position: relative;
  /* 段落内仍保留少量缩进，避免特殊样式覆盖容器内边距时产生重叠 */
  padding-left: 4px;
}

/* 扩展段落的悬停热区到左侧功能栏，避免从文本移动到图标途中消失 */
.tiptap.note-editor p[data-note-outline]::before {
  content: '';
  position: absolute;
  left: calc(-1 * var(--note-gutter-width));
  top: 0;
  width: var(--note-gutter-width);
  height: 100%;
  /* 透明覆盖层，仅用于保持 :hover，不影响视觉 */
  background: transparent;
  pointer-events: auto; /* 让该区域参与 :hover 命中 */
  z-index: 1; /* 位于文本下、图标下 */
}

/* 折叠按钮样式（和拖拽锚点使用相同的定位方式） */
.tiptap.note-editor .note-outline-toggle {
  position: absolute;
  left: calc(-1 * var(--note-gutter-width, 36px)); /* 在左侧功能栏最左侧 */
  top: 0;
  width: 16px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  user-select: none;
  z-index: 3; /* 确保位于文本之上 */
  line-height: 1;
  /* 默认隐藏（展开状态） */
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease-in-out;
}

/* 使用 CSS 绘制箭头图标（类似 > 的形状） */
.tiptap.note-editor .note-outline-toggle::before {
  content: '';
  display: block;
  width: 6px;
  height: 6px;
  border-right: 1.5px solid var(--text-mute, #999);
  border-bottom: 1.5px solid var(--text-mute, #999);
  transition:
    transform 0.15s ease-in-out,
    border-color 0.15s ease-in-out;
}

/* 展开状态：向下箭头（类似 v） */
.tiptap.note-editor .note-outline-toggle.expanded::before {
  transform: rotate(45deg) translateY(-1px);
}

/* 折叠状态：向右箭头（类似 >） */
.tiptap.note-editor .note-outline-toggle.collapsed::before {
  transform: rotate(-45deg) translateX(1px);
}

/* 悬停时显示（展开状态） */
.tiptap.note-editor p[data-note-outline]:hover .note-outline-toggle.expanded,
.tiptap.note-editor .note-outline-toggle.expanded:hover {
  opacity: 1;
  pointer-events: auto;
}

.tiptap.note-editor p[data-note-outline]:hover .note-outline-toggle.expanded::before,
.tiptap.note-editor .note-outline-toggle.expanded:hover::before {
  border-right-color: var(--text-base, #333);
  border-bottom-color: var(--text-base, #333);
}

/* 折叠状态始终显示 */
.tiptap.note-editor .note-outline-toggle.collapsed {
  opacity: 1;
  pointer-events: auto;
}

.tiptap.note-editor .note-outline-toggle.collapsed:hover::before {
  border-right-color: var(--text-base, #333);
  border-bottom-color: var(--text-base, #333);
}

.tiptap.note-editor .note-outline-drag-handle {
  position: absolute;
  left: calc(-1 * var(--note-gutter-width, 36px) + 16px); /* 折叠按钮右侧 */
  top: 0;
  width: 16px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  color: var(--text-mute, #333);
  opacity: 0; /* 默认隐藏 */
  user-select: none;
  pointer-events: none; /* 隐藏时不拦截事件 */
  transition: opacity 0.15s ease-in-out;
  display: none; /* 强制默认不展示，防止被其他样式覆盖 */
  z-index: 2; /* 确保位于文本之上，但不影响布局 */
}

/* 悬停段落显示锚点 */
.tiptap.note-editor p[data-note-outline]:hover .note-outline-drag-handle,
.tiptap.note-editor .has-note-drag-handle:hover .note-outline-drag-handle,
.tiptap.note-editor .note-outline-drag-handle:hover {
  opacity: 1;
  pointer-events: auto; /* 显示时可交互 */
  cursor: move; /* 悬停锚点显示为可移动图标 */
  display: flex; /* 悬停时再显示 */
  color: var(--text-base, #333); /* 悬停时使用更深的颜色 */
}
.tiptap.note-editor .note-outline-drag-handle:active {
  cursor: move;
  color: var(--text-base, #333);
}

/* 标题字体粗细设置 */
.tiptap.note-editor h1,
.tiptap.note-editor h2 {
  font-weight: 700;
}

.tiptap.note-editor h3,
.tiptap.note-editor h4 {
  font-weight: 600;
}
</style>
