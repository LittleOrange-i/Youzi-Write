import { ipcMain } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { is } from '@electron-toolkit/utils'
import { findBookPath } from './chapters.js'

// ========== 统计文件路径常量 ==========
const STATS_FILE = 'word_stats.json'

// ========== 统计辅助函数（导出供其他模块使用） ==========

/**
 * 获取统计文件路径
 * @param {import('electron-store').default} store - electron-store 实例
 * @returns {string} 统计文件完整路径
 */
export function getStatsFilePath(store) {
  const booksDir = store.get('booksDir')
  return join(booksDir, STATS_FILE)
}

/**
 * 读取统计数据
 * @param {import('electron-store').default} store - electron-store 实例
 * @returns {{dailyStats: Object, chapterStats: Object, bookDailyStats: Object}}
 */
export function readStats(store) {
  const statsPath = getStatsFilePath(store)
  if (!fs.existsSync(statsPath)) {
    return { dailyStats: {}, chapterStats: {}, bookDailyStats: {} }
  }
  try {
    return JSON.parse(fs.readFileSync(statsPath, 'utf-8'))
  } catch (error) {
    console.error('读取统计文件失败:', error)
    return { dailyStats: {}, chapterStats: {}, bookDailyStats: {} }
  }
}

/**
 * 保存统计数据
 * @param {import('electron-store').default} store - electron-store 实例
 * @param {Object} stats - 统计数据对象
 * @returns {boolean} 是否保存成功
 */
export function saveStats(store, stats) {
  const statsPath = getStatsFilePath(store)
  try {
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf-8')
    return true
  } catch (error) {
    console.error('保存统计文件失败:', error)
    return false
  }
}

/**
 * 计算章节字数（排除空格、换行符、制表符等格式字符）
 * @param {string} content - 章节文本内容
 * @returns {number} 有效字数
 */
export function countChapterWords(content) {
  if (!content) return 0
  // 移除空格、换行符、制表符等格式字符，只计算实际内容
  return content.replace(/[\s\n\r\t]/g, '').length
}

/**
 * 计算书籍总字数
 * @param {import('electron-store').default} store - electron-store 实例
 * @param {string} bookName - 书籍名称
 * @returns {Promise<number>} 书籍总字数
 */
export async function calculateBookWordCount(store, bookName) {
  const bookPath = findBookPath(store, bookName)
  if (!bookPath) return 0

  const volumePath = join(bookPath, '正文')
  let totalWords = 0

  if (!fs.existsSync(volumePath)) return totalWords

  const volumes = fs.readdirSync(volumePath, { withFileTypes: true })
  for (const volume of volumes) {
    if (volume.isDirectory()) {
      const volumeName = volume.name
      const currentVolumePath = join(bookPath, '正文', volumeName)
      const files = fs.readdirSync(currentVolumePath, { withFileTypes: true })
      for (const file of files) {
        if (file.isFile() && file.name.endsWith('.txt')) {
          const content = fs.readFileSync(join(currentVolumePath, file.name), 'utf-8')
          totalWords += countChapterWords(content)
        }
      }
    }
  }
  return totalWords
}

/**
 * 更新书籍元数据（总字数、更新时间）
 * @param {import('electron-store').default} store - electron-store 实例
 * @param {string} bookName - 书籍名称
 * @returns {Promise<boolean>} 是否更新成功
 */
export async function updateBookMetadata(store, bookName) {
  const bookPath = findBookPath(store, bookName)
  if (!bookPath) return false

  const metaPath = join(bookPath, 'mazi.json')

  if (!fs.existsSync(metaPath)) return false

  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    const totalWords = await calculateBookWordCount(store, bookName)

    meta.totalWords = totalWords
    meta.updatedAt = new Date().toLocaleString()

    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8')
    return true
  } catch (error) {
    console.error('更新书籍元数据失败:', error)
    return false
  }
}

/**
 * 更新章节字数统计
 * @param {import('electron-store').default} store - electron-store 实例
 * @param {string} bookName - 书籍名称
 * @param {string} volumeName - 卷名
 * @param {string} chapterName - 章节名
 * @param {string} oldContent - 旧内容
 * @param {string} newContent - 新内容
 * @returns {number} 新字数
 */
function updateChapterStats(store, bookName, volumeName, chapterName, oldContent, newContent) {
  const stats = readStats(store)
  const today = new Date().toISOString().split('T')[0]
  const chapterKey = `${bookName}/${volumeName}/${chapterName}`

  // 使用统一的字数统计函数，排除空格、换行符、制表符
  const oldLength = countChapterWords(oldContent)
  const newLength = countChapterWords(newContent)
  const wordChange = newLength - oldLength

  // 章节上次统计信息
  const prev = stats.chapterStats[chapterKey]
  const lastUpdate = prev ? prev.lastUpdate : today

  // 1. 先把旧字数从旧日期扣除
  if (prev && stats.dailyStats[lastUpdate]) {
    stats.dailyStats[lastUpdate] -= prev.totalWords
    if (stats.dailyStats[lastUpdate] < 0) stats.dailyStats[lastUpdate] = 0
  }

  // 2. 再把新字数加到今天
  if (!stats.dailyStats[today]) stats.dailyStats[today] = 0
  stats.dailyStats[today] += newLength

  // 3. 更新章节统计
  stats.chapterStats[chapterKey] = {
    totalWords: newLength,
    lastUpdate: today,
    wordChange: wordChange, // 记录本次字数变化
    lastContentLength: oldLength // 记录上次内容长度
  }

  // 4. 更新书籍每日净增字数统计
  if (!stats.bookDailyStats) stats.bookDailyStats = {}
  if (!stats.bookDailyStats[bookName]) stats.bookDailyStats[bookName] = {}
  if (!stats.bookDailyStats[bookName][today]) {
    stats.bookDailyStats[bookName][today] = {
      netWords: 0,
      addWords: 0,
      deleteWords: 0,
      totalWords: 0
    }
  }

  // 计算净增字数
  if (wordChange > 0) {
    stats.bookDailyStats[bookName][today].addWords += wordChange
  } else if (wordChange < 0) {
    stats.bookDailyStats[bookName][today].deleteWords += Math.abs(wordChange)
  }

  stats.bookDailyStats[bookName][today].netWords =
    stats.bookDailyStats[bookName][today].addWords -
    stats.bookDailyStats[bookName][today].deleteWords

  stats.bookDailyStats[bookName][today].totalWords = newLength

  saveStats(store, stats)
  return newLength
}

// ========== IPC 处理器注册 ==========

/**
 * 注册章节读写、字数统计相关的 IPC 处理器
 * @param {import('electron-store').default} store - electron-store 实例
 */
export function registerStatsHandlers(store) {
  // 读取章节内容
  ipcMain.handle('read-chapter', async (event, { bookName, volumeName, chapterName }) => {
    const bookPath = findBookPath(store, bookName)
    if (!bookPath) {
      return { success: false, message: '书籍不存在' }
    }

    const chapterPath = join(bookPath, '正文', volumeName, `${chapterName}.txt`)
    if (!fs.existsSync(chapterPath)) {
      return { success: false, message: '章节不存在' }
    }
    const content = fs.readFileSync(chapterPath, 'utf-8')
    return { success: true, content }
  })

  // 更新码字时长统计
  ipcMain.handle('update-typing-duration', async (event, { bookName, duration }) => {
    const stats = readStats(store)
    const today = new Date().toISOString().split('T')[0]

    if (!stats.bookDailyStats) stats.bookDailyStats = {}
    if (!stats.bookDailyStats[bookName]) stats.bookDailyStats[bookName] = {}
    if (!stats.bookDailyStats[bookName][today]) {
      stats.bookDailyStats[bookName][today] = {
        netWords: 0,
        addWords: 0,
        deleteWords: 0,
        totalWords: 0,
        duration: 0
      }
    }

    if (typeof stats.bookDailyStats[bookName][today].duration !== 'number') {
      stats.bookDailyStats[bookName][today].duration = 0
    }

    stats.bookDailyStats[bookName][today].duration += duration

    saveStats(store, stats)
    return { success: true }
  })

  // 保存章节内容（支持重命名）
  ipcMain.handle(
    'save-chapter',
    async (event, { bookName, volumeName, chapterName, newName, content }) => {
      const bookPath = findBookPath(store, bookName)
      if (!bookPath) {
        return { success: false, message: '书籍不存在' }
      }

      const volumePath = join(bookPath, '正文', volumeName)
      const oldPath = join(volumePath, `${chapterName}.txt`)
      const newPath = join(volumePath, `${newName || chapterName}.txt`)

      if (!fs.existsSync(oldPath)) {
        return { success: false, message: '章节不存在' }
      }

      // 读取旧内容用于统计
      const oldContent = fs.readFileSync(oldPath, 'utf-8')

      // 1. 先写内容到原文件
      fs.writeFileSync(oldPath, content, 'utf-8')

      // 2. 判断是否需要重命名
      if (newName && newName !== chapterName) {
        if (fs.existsSync(newPath)) {
          return { success: false, message: '章节名已存在', name: chapterName }
        }
        fs.renameSync(oldPath, newPath)
      }

      // 3. 更新统计
      const wordCount = updateChapterStats(
        store,
        bookName,
        volumeName,
        chapterName,
        oldContent,
        content
      )

      // 4. 更新书籍元数据
      await updateBookMetadata(store, bookName)

      return { success: true, name: newName || chapterName, wordCount }
    }
  )

  // 获取书籍总字数（新书无章节时返回 0）
  ipcMain.handle('get-book-word-count', async (event, bookName) => {
    try {
      if (!bookName) return 0
      return await calculateBookWordCount(store, bookName)
    } catch (error) {
      console.error('获取书籍总字数失败:', error)
      return 0
    }
  })

  // 获取每日码字数统计
  ipcMain.handle('get-daily-word-count', async () => {
    try {
      const stats = readStats(store)
      return { success: true, data: stats.dailyStats }
    } catch (error) {
      console.error('获取每日码字统计失败:', error)
      return { success: false, message: '获取统计失败' }
    }
  })

  // 获取书籍每日净增字数统计
  ipcMain.handle('get-book-daily-stats', async (event, bookName) => {
    try {
      const stats = readStats(store)
      if (!stats.bookDailyStats || !stats.bookDailyStats[bookName]) {
        return { success: true, data: {} }
      }
      return { success: true, data: stats.bookDailyStats[bookName] }
    } catch (error) {
      console.error('获取书籍每日统计失败:', error)
      return { success: false, message: '获取统计失败' }
    }
  })

  // 获取所有书籍的每日净增字数统计
  ipcMain.handle('get-all-books-daily-stats', async () => {
    try {
      const stats = readStats(store)
      if (!stats.bookDailyStats) {
        return { success: true, data: {} }
      }
      return { success: true, data: stats.bookDailyStats }
    } catch (error) {
      console.error('获取所有书籍每日统计失败:', error)
      return { success: false, message: '获取统计失败' }
    }
  })

  // 获取章节统计
  ipcMain.handle('get-chapter-stats', async (event, { bookName, volumeName, chapterName }) => {
    try {
      const stats = readStats(store)
      const chapterKey = `${bookName}/${volumeName}/${chapterName}`
      return { success: true, data: stats.chapterStats[chapterKey] || null }
    } catch (error) {
      console.error('获取章节统计失败:', error)
      return { success: false, message: '获取统计失败' }
    }
  })

  // 刷新书籍所有章节的字数统计
  ipcMain.handle('refresh-all-chapter-word-counts', async (event, bookName) => {
    try {
      const bookPath = findBookPath(store, bookName)
      if (!bookPath) return { success: false, message: '书籍目录未找到' }

      const volumePath = join(bookPath, '正文')
      if (!fs.existsSync(volumePath)) return { success: true }

      const stats = readStats(store)
      const today = new Date().toISOString().split('T')[0]
      let hasChanged = false

      const volumes = fs.readdirSync(volumePath, { withFileTypes: true })
      for (const volume of volumes) {
        if (volume.isDirectory()) {
          const volumeName = volume.name
          const currentVolumePath = join(bookPath, '正文', volumeName)
          const files = fs.readdirSync(currentVolumePath, { withFileTypes: true })
          for (const file of files) {
            if (file.isFile() && file.name.endsWith('.txt')) {
              const name = file.name.replace('.txt', '')
              const filePath = join(currentVolumePath, file.name)
              const content = fs.readFileSync(filePath, 'utf-8')
              const wordCount = countChapterWords(content)
              const chapterKey = `${bookName}/${volumeName}/${name}`

              if (
                !stats.chapterStats[chapterKey] ||
                stats.chapterStats[chapterKey].totalWords !== wordCount
              ) {
                stats.chapterStats[chapterKey] = {
                  totalWords: wordCount,
                  lastUpdate: today,
                  wordChange: 0,
                  lastContentLength: wordCount
                }
                hasChanged = true
              }
            }
          }
        }
      }

      if (hasChanged) {
        saveStats(store, stats)
        await updateBookMetadata(store, bookName)
      }

      return { success: true }
    } catch (error) {
      console.error('刷新章节字数失败:', error)
      return { success: false, message: error.message }
    }
  })

  if (is.dev) {
    console.log('[stats] 章节读写/字数统计相关 IPC 处理器注册完成')
  }
}
