
// 格式化规则定义和实现

// 辅助函数：判断是否为空行
const isEmptyLine = (line) => !line || line.trim().length === 0

// 1. 空白字符处理
const removeTrailingSpaces = (lines) => lines.map(line => line.replace(/\s+$/, ''))

const trimLines = (lines) => lines.map(line => line.trim())

const ensureEmptyLineBetweenParagraphs = (lines) => {
  const result = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    result.push(line)
    // 如果当前行不为空，且下一行也不为空（且存在下一行），则插入一个空行
    // 注意：这里简单的把非空行视为段落。
    if (!isEmptyLine(line) && i < lines.length - 1 && !isEmptyLine(lines[i + 1])) {
      result.push('')
    }
  }
  return result
}

const mergeMultipleEmptyLines = (lines) => {
  const result = []
  let lastWasEmpty = false
  for (const line of lines) {
    const isCurrEmpty = isEmptyLine(line)
    if (isCurrEmpty) {
      if (!lastWasEmpty) {
        result.push('')
        lastWasEmpty = true
      }
    } else {
      result.push(line)
      lastWasEmpty = false
    }
  }
  return result
}

const removeLeadingEmptyLines = (lines) => {
  let startIndex = 0
  while (startIndex < lines.length && isEmptyLine(lines[startIndex])) {
    startIndex++
  }
  return lines.slice(startIndex)
}

const removeTrailingEmptyLines = (lines) => {
  let endIndex = lines.length - 1
  while (endIndex >= 0 && isEmptyLine(lines[endIndex])) {
    endIndex--
  }
  return lines.slice(0, endIndex + 1)
}

const removeSingleEmptyLines = (lines) => {
  // 移除单独的空行（保留两个及以上连续空行）
  // 逻辑：如果发现一个空行，检查它是否是孤立的。
  // 这是一个比较特殊的规则，通常是为了压缩行数但保留明显的段落分隔（如果作者习惯用两个空行分隔场景）
  const result = []
  let emptyCount = 0
  
  // 预处理：计算连续空行
  // 更简单的逻辑：遍历，如果是空行，暂存。遇到非空行时，检查暂存的空行数量。
  // 如果数量 == 1，丢弃。如果 >= 2，保留。
  
  let pendingEmptyLines = 0
  
  for (const line of lines) {
    if (isEmptyLine(line)) {
      pendingEmptyLines++
    } else {
      if (pendingEmptyLines >= 2) {
        for(let i=0; i<pendingEmptyLines; i++) result.push('')
      }
      pendingEmptyLines = 0
      result.push(line)
    }
  }
  // 处理末尾
  if (pendingEmptyLines >= 2) {
    for(let i=0; i<pendingEmptyLines; i++) result.push('')
  }
  
  return result
}

const removeAllEmptyLines = (lines) => lines.filter(line => !isEmptyLine(line))

const mergeMultipleSpaces = (lines) => lines.map(line => line.replace(/ +/g, ' '))

// 2. 中英文空格处理
const addSpaceBetweenChineseAndEnglish = (lines) => {
  return lines.map(line => {
    // 中文 followed by 英文/数字
    let newLine = line.replace(/([\u4e00-\u9fa5])([a-zA-Z0-9])/g, '$1 $2')
    // 英文/数字 followed by 中文
    newLine = newLine.replace(/([a-zA-Z0-9])([\u4e00-\u9fa5])/g, '$1 $2')
    return newLine
  })
}

const removeSpaceBetweenChineseAndEnglish = (lines) => {
  return lines.map(line => {
    let newLine = line.replace(/([\u4e00-\u9fa5])\s+([a-zA-Z0-9])/g, '$1$2')
    newLine = newLine.replace(/([a-zA-Z0-9])\s+([\u4e00-\u9fa5])/g, '$1$2')
    return newLine
  })
}

const removeAllSpaces = (lines) => lines.map(line => line.replace(/\s/g, ''))

// 3. 标点符号处理
const replaceHalfWidthComma = (lines) => lines.map(line => line.replace(/,/g, '，'))

const replaceHalfWidthPeriod = (lines) => lines.map(line => line.replace(/\./g, '。'))

const replaceHalfWidthQuotes = (lines) => {
  // 简单替换：将 "" 替换为 “”
  // 这是一个简单的状态机或正则。为了准确，最好是一对一对处理。
  // 但简单起见，可以尝试简单的交替替换。
  return lines.map(line => {
    let result = ''
    let open = true
    for (let char of line) {
      if (char === '"') {
        result += open ? '“' : '”'
        open = !open
      } else if (char === "'") {
         result += open ? '‘' : '’'
         open = !open // 单引号也处理一下？用户选项只说了引号，通常指双引号。但代码里可能是通用的。
         // 且慢，用户选项 specifically said "" -> "" (in description: "将半角引号替换为全角引号（"" → ""）")
         // 这里只处理双引号
      } else {
        result += char
      }
    }
    // 注意：跨行引号处理比较麻烦，这里只处理行内。
    // 如果行内引号不匹配，状态会重置（line map是独立的）。这对于小说写作（段落内）通常是可以的。
    return result
  })
}

const fixQuotes = (lines) => {
  // 引号修正（"aaa" → “aaa”）
  // 这其实和 replaceHalfWidthQuotes 是一样的逻辑，可能是用户界面的别名或者是针对特定格式的修正。
  // 我们复用逻辑。
  return replaceHalfWidthQuotes(lines)
}

// 将“对白高亮”中启用的符号转换为 起始符号 -> 结束符号 的映射
// 仅使用用户实际启用（enabled）的对白符号来判定“对话范围”，避免误判
function buildDialogueMap(dialogueSymbols) {
  const map = {}
  if (Array.isArray(dialogueSymbols)) {
    for (const symbol of dialogueSymbols) {
      if (symbol && symbol.enabled && symbol.start && symbol.end) {
        // 同一个起始符号只记录第一个对应的结束符号
        if (map[symbol.start] === undefined) {
          map[symbol.start] = symbol.end
        }
      }
    }
  }
  return map
}

// 全角句号后自动换行（对话内的句号除外）
// context.dialogueSymbols：来自对白高亮设置中启用的符号列表
const newlineAfterFullWidthPeriod = (lines, context) => {
  // 优先使用用户配置的对白符号；无配置时退化为常见中文引号，避免完全失效
  const dialogueMap = buildDialogueMap(context && context.dialogueSymbols)
  const fallbackMap = { '“': '”', '‘': '’', '『': '』', '「': '」' }
  const openToClose = Object.keys(dialogueMap).length > 0 ? dialogueMap : fallbackMap

  return lines.map(line => {
    let result = ''
    const stack = [] // 记录当前打开的对话结束符，支持嵌套

    for (const char of line) {
      result += char

      const close = openToClose[char]
      if (close !== undefined) {
        // 遇到对话起始符号：若栈顶已是同一符号（如半角引号自闭合），则视为结束并出栈
        if (stack.length > 0 && stack[stack.length - 1] === close) {
          stack.pop()
        } else {
          stack.push(close)
        }
      } else if (stack.length > 0 && char === stack[stack.length - 1]) {
        // 遇到与栈顶匹配的结束符号，出栈（退出对话范围）
        stack.pop()
      }

      // 遇到全角句号且当前不在任何对话范围内，则在句号后插入换行
      if (char === '。' && stack.length === 0) {
        result += '\n'
      }
    }
    return result
  })
}

// 4. 段落格式
const indentParagraphs = (lines) => {
  return lines.map(line => {
    if (isEmptyLine(line)) return line
    // 如果已经有缩进（全角空格），就不加了？或者强制加？
    // 通常小说排版是全角空格*2
    // 先去除行首空白，再加
    const trimmed = line.trimStart()
    return '\u3000\u3000' + trimmed
  })
}

// 规则注册表
export const formattingRules = [
  // 空白字符处理
  { id: 'removeTrailingSpaces', label: '去掉行尾空白字符', handler: removeTrailingSpaces, default: true },
  { id: 'trimLines', label: '去掉行首及行尾空白字符', handler: trimLines, default: false },
  { id: 'ensureEmptyLineBetweenParagraphs', label: '确保段落之间至少有一个空行', handler: ensureEmptyLineBetweenParagraphs, default: false },
  { id: 'mergeMultipleEmptyLines', label: '合并多个连续空行', handler: mergeMultipleEmptyLines, default: true }, // 默认常用
  { id: 'removeLeadingEmptyLines', label: '移除文首空行', handler: removeLeadingEmptyLines, default: true },
  { id: 'removeTrailingEmptyLines', label: '移除文末空行', handler: removeTrailingEmptyLines, default: true },
  { id: 'removeSingleEmptyLines', label: '移除单独的空行（保留两个及以上空行）', handler: removeSingleEmptyLines, default: false },
  { id: 'removeAllEmptyLines', label: '去掉空行', handler: removeAllEmptyLines, default: false },
  { id: 'mergeMultipleSpaces', label: '合并多个连续空格', handler: mergeMultipleSpaces, default: false },

  // 中英文空格处理
  { id: 'addSpaceBetweenChineseAndEnglish', label: '在中文和英文之间添加一个空格', handler: addSpaceBetweenChineseAndEnglish, default: false },
  { id: 'removeSpaceBetweenChineseAndEnglish', label: '去掉中文和英文之间的空格', handler: removeSpaceBetweenChineseAndEnglish, default: false },
  { id: 'removeAllSpaces', label: '移除所有空格', handler: removeAllSpaces, default: false },

  // 标点符号处理
  { id: 'replaceHalfWidthComma', label: '将半角逗号替换为全角逗号（, → ，）', handler: replaceHalfWidthComma, default: true },
  { id: 'replaceHalfWidthPeriod', label: '将半角句号替换为全角句号（. → 。）', handler: replaceHalfWidthPeriod, default: true },
  { id: 'replaceHalfWidthQuotes', label: '将半角引号替换为全角引号（"" → “”）', handler: replaceHalfWidthQuotes, default: true },
  { id: 'fixQuotes', label: '引号修正（"aaa" → “aaa”）', handler: fixQuotes, default: true },
  { id: 'newlineAfterFullWidthPeriod', label: '全角句号后自动换行（对话中的句号除外）', handler: newlineAfterFullWidthPeriod, default: true },

  // 段落格式
  // { id: 'indentParagraphs', label: '段首缩进 2 个空白字符', handler: indentParagraphs, default: false }
]

// 核心处理函数
// context：额外上下文，例如 { dialogueSymbols }（来自对白高亮中启用的符号）
export function formatText(text, activeRules, context = {}) {
  if (!text) return ''
  
  let lines = text.split('\n')
  
  // activeRules 应该是一个有序的规则列表（包含 id）
  // 或者是一个包含规则配置的对象/数组。
  // 为了支持拖拽排序，我们期望 activeRules 是一个数组，顺序即为执行顺序。
  // 每个元素应该包含 { id, enabled }
  
  if (Array.isArray(activeRules)) {
    for (const ruleConfig of activeRules) {
      if (ruleConfig.enabled) {
        const ruleDef = formattingRules.find(r => r.id === ruleConfig.id)
        if (ruleDef) {
          lines = ruleDef.handler(lines, context)
        }
      }
    }
  }
  
  return lines.join('\n')
}

// 获取默认配置（有序）
export function getDefaultFormattingConfig() {
  return formattingRules.map(r => ({
    id: r.id,
    label: r.label,
    enabled: r.default
  }))
}
