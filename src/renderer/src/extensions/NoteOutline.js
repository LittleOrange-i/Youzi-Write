import { Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

function getOutlineInfo(node) {
  if (!node) return null
  if (node.type.name === 'heading') {
    return {
      level: Math.max(0, (node.attrs.level || 1) - 1),
      kind: 'heading'
    }
  }
  if (node.type.name === 'noteOutlineParagraph') {
    return {
      // 让 Markdown 标题天然处于更高层级，后续缩进段落归属到最近标题之下
      level: 100 + (node.attrs.level || 0),
      kind: 'note'
    }
  }
  return null
}

function getTopLevelBlocks(doc) {
  const blocks = []
  let pos = 0
  doc.forEach((node) => {
    blocks.push({
      node,
      pos,
      outline: getOutlineInfo(node)
    })
    pos += node.nodeSize
  })
  return blocks
}

// 笔记大纲段落节点，支持折叠、缩进和拖拽
export const NoteOutlineParagraph = Node.create({
  name: 'noteOutlineParagraph',
  group: 'block',
  content: 'inline*',
  defining: true,
  draggable: true,

  addAttributes() {
    return {
      level: {
        default: 0,
        parseHTML: (element) => {
          const level = parseInt(element.getAttribute('data-level') || '0', 10)
          return Math.max(0, Math.min(level, 10)) // 限制层级在 0-10
        },
        renderHTML: (attributes) => {
          if (!attributes.level) return {}
          return { 'data-level': attributes.level }
        }
      },
      collapsed: {
        default: false,
        parseHTML: (element) => element.hasAttribute('data-collapsed'),
        renderHTML: (attributes) => {
          if (!attributes.collapsed) return {}
          return { 'data-collapsed': 'true' }
        }
      },
      hasChildren: {
        default: false,
        parseHTML: () => false, // 这个属性在运行时动态计算
        renderHTML: () => ({})
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'p[data-note-outline]',
        getAttrs: (node) => {
          const level = parseInt(node.getAttribute('data-level') || '0', 10)
          const collapsed = node.hasAttribute('data-collapsed')
          return { level, collapsed }
        }
      }
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const level = node.attrs.level || 0
    return [
      'p',
      mergeAttributes(HTMLAttributes, {
        'data-note-outline': 'true',
        'data-level': level,
        style: `padding-left: ${level * 24}px; position: relative;`
      }),
      0
    ]
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        // 在笔记模式下，回车创建新段落，保持当前缩进级别
        const { state } = editor
        const { selection } = state
        const { $from } = selection

        // 检查当前节点是否是 noteOutlineParagraph
        if ($from.parent.type.name === 'noteOutlineParagraph') {
          const currentLevel = $from.parent.attrs.level || 0

          // 使用 Tiptap 的 insertContent 命令插入新段落
          // 这会自动处理光标位置
          editor.commands.insertContent({
            type: 'noteOutlineParagraph',
            attrs: { level: currentLevel },
            content: []
          })

          return true
        }
        return false
      },
      Tab: ({ editor }) => {
        // Tab 键增加缩进
        const { state } = editor
        const { selection } = state
        const { $from } = selection

        if ($from.parent.type.name === 'noteOutlineParagraph') {
          const currentLevel = $from.parent.attrs.level || 0
          if (currentLevel < 10) {
            editor.commands.updateAttributes('noteOutlineParagraph', {
              level: currentLevel + 1
            })
          }
          return true
        }
        return false
      },
      'Shift-Tab': ({ editor }) => {
        // Shift+Tab 减少缩进
        const { state } = editor
        const { selection } = state
        const { $from } = selection

        if ($from.parent.type.name === 'noteOutlineParagraph') {
          const currentLevel = $from.parent.attrs.level || 0
          if (currentLevel > 0) {
            editor.commands.updateAttributes('noteOutlineParagraph', {
              level: currentLevel - 1
            })
          }
          return true
        }
        return false
      },
      Backspace: ({ editor }) => {
        // Backspace 键：如果光标在段落开头且有缩进，减少缩进级别
        const { state } = editor
        const { selection } = state
        const { $from } = selection

        // 检查当前节点是否是 noteOutlineParagraph
        if ($from.parent.type.name === 'noteOutlineParagraph') {
          // 检查光标是否在段落开头（parentOffset === 0 表示在段落开始位置）
          const isAtStart = $from.parentOffset === 0

          if (isAtStart) {
            const currentLevel = $from.parent.attrs.level || 0
            if (currentLevel > 0) {
              // 如果有缩进，减少缩进级别
              editor.commands.updateAttributes('noteOutlineParagraph', {
                level: currentLevel - 1
              })
              return true // 阻止默认的 backspace 行为
            }
            // 如果 level === 0，执行默认的 backspace 行为（返回 false）
          }
        }
        return false // 让其他处理器处理
      }
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('noteOutline'),
        props: {
          decorations: (state) => {
            const decorations = []
            const { doc } = state
            const topLevelBlocks = getTopLevelBlocks(doc)

            for (let index = 0; index < topLevelBlocks.length; index++) {
              const block = topLevelBlocks[index]
              if (!block.outline) continue

              const { node, pos, outline } = block
              const collapsed = node.attrs.collapsed || false
              let boundaryIndex = topLevelBlocks.length
              let hasChildren = false

              for (let nextIndex = index + 1; nextIndex < topLevelBlocks.length; nextIndex++) {
                const nextBlock = topLevelBlocks[nextIndex]
                if (nextBlock.outline && nextBlock.outline.level <= outline.level) {
                  boundaryIndex = nextIndex
                  break
                }
                hasChildren = true
              }

              const nodeDecoration = Decoration.node(pos, pos + node.nodeSize, {
                class: 'note-outline-paragraph',
                'data-note-outline-level': outline.level,
                'data-note-outline-kind': outline.kind,
                'data-note-outline-has-children': hasChildren ? 'true' : 'false',
                'data-note-outline-collapsed': collapsed ? 'true' : 'false',
                'data-note-outline-pos': pos
              })
              decorations.push(nodeDecoration)

              if (hasChildren) {
                const toggleBtn = document.createElement('button')
                toggleBtn.className = `note-outline-toggle ProseMirror-widget ${collapsed ? 'collapsed' : 'expanded'}`
                toggleBtn.setAttribute('data-pos', String(pos))
                toggleBtn.setAttribute('data-collapsed', String(collapsed))
                toggleBtn.setAttribute('contenteditable', 'false')
                toggleBtn.setAttribute('title', collapsed ? '展开子段落' : '折叠子段落')
                toggleBtn.innerHTML = ''
                const toggleWidget = Decoration.widget(pos + 1, toggleBtn, { side: -1 })
                decorations.push(toggleWidget)
              }

              if (collapsed && hasChildren) {
                for (let nextIndex = index + 1; nextIndex < boundaryIndex; nextIndex++) {
                  const hiddenBlock = topLevelBlocks[nextIndex]
                  decorations.push(
                    Decoration.node(hiddenBlock.pos, hiddenBlock.pos + hiddenBlock.node.nodeSize, {
                      style: 'display: none;'
                    })
                  )
                }
              }
            }

            return DecorationSet.create(doc, decorations)
          },
          view: () => {
            // 折叠按钮现在通过 Decoration.widget 添加，不需要手动管理 DOM
            return {
              update: () => {
                // 装饰器会自动更新，不需要手动操作
              },
              destroy: () => {
                // 清理
              }
            }
          },
          handleDOMEvents: {
            click: (view, event) => {
              const target = event.target
              if (target && target.classList.contains('note-outline-toggle')) {
                event.stopPropagation()
                event.preventDefault()
                const pos = parseInt(target.getAttribute('data-pos'), 10)
                if (!isNaN(pos)) {
                  const { state, dispatch } = view
                  const node = state.doc.nodeAt(pos)
                  if (getOutlineInfo(node)) {
                    const tr = state.tr
                    tr.setNodeMarkup(pos, null, {
                      ...node.attrs,
                      collapsed: !node.attrs.collapsed
                    })
                    dispatch(tr)
                    return true
                  }
                }
              }
              return false
            }
          }
        }
      })
    ]
  }
})
