import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 编辑器相关全局状态管理
export const useEditorStore = defineStore('editor', () => {
  const content = ref('')
  const file = ref(null)
  const chapterTitle = ref('')
  const currentBookName = ref('')
  const bannedWords = ref([]) // 禁词列表
  const splitMode = ref('none') // 视图切分模式：none (无), horizontal (水平), vertical (垂直)
  const editor2File = ref(null) // 第二个编辑器的文件信息
  const editor2ChapterValue = ref([]) // 第二个编辑器的级联选择器值

  // 初始化标记
  const isInitializing = ref(false) // 是否正在初始化（加载已有内容）

  // 书籍总字数相关
  const bookTotalWords = ref(0)
  const bookWordsLoaded = ref(false)
  const chapterWordBaseline = ref(0) // 当前章节初始字数（用于增量计算）
  const lastSyncedChapterWords = ref(0) // 上一次同步到书籍总字数的章节字数
  const pendingBookWordDelta = ref(0)
  const chapterTargetWords = ref(2000)
  const paragraphMaxLength = ref(35) // 段落最大字数阈值
  let externalSaveHandler = null

  // 临时存储的会话统计数据（用于在页面切换时保持状态）
  const sessionStats = ref(null)

  // 新增：计算实际内容字数（排除空格、换行符等格式字符）
  const contentWordCount = computed(() => {
    if (!content.value) return 0
    // 移除空格、换行符、制表符等格式字符，只计算实际内容
    return content.value.replace(/[\s\n\r\t]/g, '').length
  })

  // 辅助函数：计算内容字数（排除空格、换行符、制表符）
  function getContentWordCount(text) {
    if (!text) return 0
    // 移除空格、换行符、制表符等格式字符，只计算实际内容
    return text.replace(/[\s\n\r\t]/g, '').length
  }

  // 开始编辑会话（章节维度，不影响全局统计）
  function startEditingSession(initialContent) {
    const initialLength = getContentWordCount(initialContent)
    // 初始化章节字数基线
    chapterWordBaseline.value = initialLength
    lastSyncedChapterWords.value = initialLength
    isInitializing.value = true // 标记为初始化状态
  }

  // 记录字数变化
  function recordWordChange(oldContent, newContent, options = {}) {
    const { isInitialLoad = false } = options
    const oldLength = getContentWordCount(oldContent)
    const newLength = getContentWordCount(newContent)
    const delta = newLength - oldLength

    const previousChapterWords = lastSyncedChapterWords.value
    // 无论是否计入书籍字数，都需要更新当前章节字数
    lastSyncedChapterWords.value = newLength

    // 如果是初始加载（显式标记），直接更新状态并退出
    if (isInitialLoad) {
      if (isInitializing.value) {
        isInitializing.value = false
      }
      return
    }

    // 处理初始化状态的自动切换
    if (isInitializing.value) {
      // 如果字数没有变化（比如加载了一个空章节），我们仍然认为初始化已完成
      if (delta === 0) {
        isInitializing.value = false
        return
      }

      // 判断是否是加载已有内容（从空内容或较小内容加载到较大内容，且处于初始化状态）
      // 这里的逻辑改为：如果增量大于 2 个字符，且不是用户正常输入的节奏，则视为加载已有内容
      const isLoadingExistingContent = delta > 2
      
      if (isLoadingExistingContent) {
        // 保持 isInitializing 为 true，直到加载完成（即 delta 不再大幅波动）
        // 但为了防止卡死，如果是单次大增量，本次处理完后就应该关闭初始化
        isInitializing.value = false
        return // 初始加载不计入书籍总字数变动
      } else {
        // 如果增量很小（<=2），说明可能是用户在初始化完成后立即开始输入
        isInitializing.value = false
      }
    }

    // 更新书籍总字数：仅在章节类型、已加载书籍统计且不是初始化状态时同步
    if (
      file.value?.type === 'chapter' &&
      !isInitializing.value &&
      previousChapterWords !== newLength
    ) {
      const bookDelta = newLength - previousChapterWords
      if (bookDelta !== 0) {
        if (bookWordsLoaded.value) {
          const sanitizedTotal = Number.isFinite(bookTotalWords.value) ? bookTotalWords.value : 0
          const nextTotal = sanitizedTotal + bookDelta
          bookTotalWords.value = nextTotal > 0 ? nextTotal : 0
        } else {
          pendingBookWordDelta.value += bookDelta
        }
      }
    }

    // 更新当前字数
  }

  // 重置编辑会话（章节维度）
  function resetEditingSession() {
    isInitializing.value = false
    chapterWordBaseline.value = 0
    lastSyncedChapterWords.value = 0
    // 清除临时保存的统计数据
    sessionStats.value = null
    // 重置切分模式
    splitMode.value = 'none'
    editor2File.value = null
    editor2ChapterValue.value = []
  }

  function saveSessionStats(stats) {
    sessionStats.value = stats
  }

  function setContent(newContent, options = {}) {
    const oldContent = content.value
    content.value = newContent

    // 记录字数变化
    recordWordChange(oldContent, newContent, options)
  }

  function setFile(newFile) {
    file.value = newFile
    if (newFile?.type === 'chapter') {
      isInitializing.value = true
    } else if (!newFile) {
      isInitializing.value = false
    }
    if (!newFile || newFile.type !== 'chapter') {
      chapterWordBaseline.value = 0
      lastSyncedChapterWords.value = 0
    }
  }

  // function normalizeTitleSpacing(title) {
  //   if (!title) return ''
  //   const match = title.match(/^(第[^\\s]+[章回集节部卷]?)(.*)$/)
  //   if (!match) return title
  //   const prefix = match[1].trim()
  //   const rest = match[2] ? match[2].trimStart() : ''
  //   return rest ? `${prefix} ${rest}` : `${prefix} `
  // }

  function setChapterTitle(title) {
    chapterTitle.value = title
  }

  // 编辑器设置相关
  const editorSettings = ref({
    fontFamily: 'KaiTi',
    fontSize: '18px',
    lineHeight: '1.6',
    globalBoldMode: false,
    globalItalicMode: false,
    dialogueHighlight: {
      defaultColor: '#e198b8', // 默认高亮颜色设置为 #e198b8
      allowNewLine: true, // 允许换行
      allowNoEnd: false, // 不允许无结束符
      symbols: [
        { id: 1, label: '“”', start: '“', end: '”', enabled: true, color: '#e198b8', useCustomColor: false }, // 双引号
        { id: 2, label: '‘’', start: '‘', end: '’', enabled: true, color: '#e198b8', useCustomColor: false }, // 单引号
        { id: 3, label: '『』', start: '『', end: '』', enabled: true, color: '#e198b8', useCustomColor: false }, // 括号
        { id: 4, label: '「」', start: '「', end: '」', enabled: true, color: '#e198b8', useCustomColor: false }, // 方括号
        { id: 5, label: '（）', start: '（', end: '）', enabled: true, color: '#e198b8', useCustomColor: false }, // 圆括号
        { id: 6, label: '〈〉', start: '〈', end: '〉', enabled: true, color: '#e198b8', useCustomColor: false }, // 尖括号
        { id: 7, label: '《》', start: '《', end: '》', enabled: true, color: '#e198b8', useCustomColor: false }, // 书名号
        { id: 8, label: '()', start: '(', end: ')', enabled: true, color: '#e198b8', useCustomColor: false }, // 英文圆括号
        { id: 9, label: '[]', start: '[', end: ']', enabled: true, color: '#e198b8', useCustomColor: false }, // 英文方括号
        { id: 10, label: '{}', start: '{', end: '}', enabled: true, color: '#e198b8', useCustomColor: false }, // 英文花括号
        { id: 11, label: '【】', start: '【', end: '】', enabled: true, color: '#e198b8', useCustomColor: false }, // 粗括号
        { id: 12, label: '〔〕', start: '〔', end: '〕', enabled: true, color: '#e198b8', useCustomColor: false }, // 龟甲号
        { id: 13, label: '""', start: '"', end: '"', enabled: true, color: '#e198b8', useCustomColor: false }, // 英文双引号
        { id: 14, label: "''", start: "'", end: "'", enabled: true, color: '#e198b8', useCustomColor: false } // 英文单引号
      ]
    }
  })

  // 加载编辑器设置
  async function loadEditorSettings() {
    try {
      const settings = await window.electronStore.get('editorSettings')
      if (settings) {
        editorSettings.value = { ...editorSettings.value, ...settings }
      }
    } catch (error) {
      console.error('加载编辑器设置失败:', error)
    }
  }

  // 保存编辑器设置
  async function saveEditorSettings(settings) {
    try {
      editorSettings.value = { ...editorSettings.value, ...settings }
      // 转换为纯对象，避免响应式代理导致的序列化问题
      const plainSettings = {
        fontFamily: editorSettings.value.fontFamily,
        fontSize: editorSettings.value.fontSize,
        lineHeight: editorSettings.value.lineHeight,
        globalBoldMode: editorSettings.value.globalBoldMode,
        globalItalicMode: editorSettings.value.globalItalicMode,
        formattingRules: editorSettings.value.formattingRules,
        dialogueHighlight: editorSettings.value.dialogueHighlight
      }
      // 使用 JSON.parse(JSON.stringify()) 彻底移除 Vue 的 Proxy 代理
      // 解决 "An object could not be cloned" 错误
      await window.electronStore.set('editorSettings', JSON.parse(JSON.stringify(plainSettings)))
    } catch (error) {
      console.error('保存编辑器设置失败:', error)
    }
  }

  function setBookTotalWords(total) {
    const numeric = Number(total)
    const sanitized = Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0
    const adjusted = sanitized + pendingBookWordDelta.value
    bookTotalWords.value = adjusted > 0 ? adjusted : 0
    pendingBookWordDelta.value = 0
    bookWordsLoaded.value = true
  }

  function resetBookWordStats() {
    bookTotalWords.value = 0
    chapterWordBaseline.value = 0
    lastSyncedChapterWords.value = 0
    bookWordsLoaded.value = false
    currentBookName.value = ''
    pendingBookWordDelta.value = 0
  }

  function setChapterTargetWords(value) {
    const numeric = Number(value)
    chapterTargetWords.value = Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : 2000
  }

  function setParagraphMaxLength(value) {
    const numeric = Number(value)
    paragraphMaxLength.value = Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : 35
  }

  function registerExternalSaveHandler(handler) {
    externalSaveHandler = typeof handler === 'function' ? handler : null
  }

  async function saveCurrentFileThroughHandler(showMessage = false) {
    if (typeof externalSaveHandler === 'function') {
      return externalSaveHandler(showMessage)
    }
    return false
  }

  async function fetchBookTotalWords(bookName, { force = false } = {}) {
    const normalizedName = bookName ? String(bookName) : ''
    if (!normalizedName) return bookTotalWords.value

    if (!force && bookWordsLoaded.value && currentBookName.value === normalizedName) {
      return bookTotalWords.value
    }

    try {
      let totalWords
      if (window?.electron?.getBookWordCount) {
        totalWords = await window.electron.getBookWordCount(normalizedName)
      }

      if (totalWords === undefined && window?.electron?.readBooksDir) {
        const books = await window.electron.readBooksDir()
        if (Array.isArray(books)) {
          const target = books.find((item) => item.name === normalizedName)
          if (target && target.totalWords !== undefined) {
            totalWords = target.totalWords
          }
        }
      }

      setBookTotalWords(totalWords ?? 0)
      currentBookName.value = normalizedName
    } catch (error) {
      console.error('获取书籍总字数失败:', error)
      resetBookWordStats()
      throw error
    }

    return bookTotalWords.value
  }

  // 加载禁词列表
  async function fetchBannedWords(bookName) {
    if (!bookName) return // 如果没有书名则直接返回
    try {
      const result = await window.electron.getBannedWords(bookName) // 从后端获取禁词列表
      if (result.success) {
        bannedWords.value = result.data || [] // 更新 store 中的禁词列表数据
      }
    } catch (error) {
      console.error('加载禁词失败:', error) // 打印错误日志
    }
  }

  // 添加禁词
  async function addBannedWord(bookName, word) {
    if (!bookName || !word) return { success: false } // 校验参数合法性
    try {
      const result = await window.electron.addBannedWord(bookName, word) // 调用后端接口添加禁词
      if (result.success) {
        if (!bannedWords.value.includes(word)) {
          bannedWords.value.unshift(word) // 添加成功后同步更新 store 列表
        }
      }
      return result // 返回操作结果
    } catch (error) {
      console.error('添加禁词失败:', error) // 打印错误日志
      return { success: false, message: error.message } // 返回错误信息
    }
  }

  // 删除禁词
  async function removeBannedWord(bookName, word) {
    if (!bookName || !word) return { success: false } // 校验参数合法性
    try {
      const result = await window.electron.removeBannedWord(bookName, word) // 从后端删除禁词
      if (result.success) {
        const index = bannedWords.value.indexOf(word) // 查找该词在列表中的索引
        if (index > -1) {
          bannedWords.value.splice(index, 1) // 从 store 列表中移除该词
        }
      }
      return result // 返回操作结果
    } catch (error) {
      console.error('删除禁词失败:', error) // 打印错误日志
      return { success: false, message: error.message } // 返回错误信息
    }
  }

  return {
    content,
    file,
    chapterTitle,
    contentWordCount, // 内容字数（排除格式字符）
    editorSettings,
    isInitializing, // 暴露 isInitializing，供外部判断
    currentBookName,
    bookTotalWords,
    bookWordsLoaded,
    bannedWords,
    splitMode,
    editor2File,
    editor2ChapterValue,
    setContent,
    setFile,
    setChapterTitle,
    startEditingSession,
    resetEditingSession,
    loadEditorSettings,
    saveEditorSettings,
    setBookTotalWords,
    resetBookWordStats,
    fetchBookTotalWords,
    fetchBannedWords,
    addBannedWord,
    removeBannedWord,
    chapterTargetWords,
    setChapterTargetWords,
    paragraphMaxLength,
    setParagraphMaxLength,
    registerExternalSaveHandler,
    saveCurrentFileThroughHandler,
    sessionStats,
    saveSessionStats
  }
})
