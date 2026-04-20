import { ipcMain } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { is } from '@electron-toolkit/utils'

// ========== 书籍路径辅助函数 ==========

/**
 * 获取书籍的完整路径
 * @param {import('electron-store').default} store - electron-store 实例
 * @param {string} bookName - 书籍名称
 * @returns {string} 书籍完整路径
 */
export function getBookPath(store, bookName) {
  const booksDir = store.get('booksDir')
  return join(booksDir, bookName)
}

/**
 * 根据书名查找书籍路径
 * @param {import('electron-store').default} store - electron-store 实例
 * @param {string} bookName - 书籍名称
 * @returns {string|null} 书籍路径，如果不存在返回null
 */
export function findBookPath(store, bookName) {
  const booksDir = store.get('booksDir')

  // 检查根目录
  const mainPath = join(booksDir, bookName)
  if (fs.existsSync(mainPath)) {
    return mainPath
  }

  return null
}

// ========== 章节名称工具函数 ==========

const chineseDigitMap = {
  零: 0,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9
}

const chineseDigitsArray = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']

const chineseUnitsMap = {
  十: 10,
  百: 100,
  千: 1000,
  万: 10000
}

/**
 * 将阿拉伯数字转换为中文数字
 * @param {number} num - 数字
 * @returns {string} 中文数字字符串
 */
function convertNumberToChinese(num) {
  const numeric = Number(num)
  if (!Number.isFinite(numeric) || numeric <= 0) return String(num)
  if (numeric >= 10000) {
    const high = Math.floor(numeric / 10000)
    const rest = numeric % 10000
    let result = `${convertNumberToChinese(high)}万`
    if (rest > 0) {
      let restChinese = convertNumberToChinese(rest)
      if (rest < 100 && restChinese.startsWith('十')) {
        restChinese = `一${restChinese}`
      }
      result += rest < 1000 ? `零${restChinese}` : restChinese
    }
    return result
  }
  const str = String(Math.floor(numeric))
  const units = ['', '十', '百', '千']
  let result = ''
  let zeroFlag = false

  for (let i = 0; i < str.length; i++) {
    const digit = Number(str[i])
    const position = str.length - i - 1

    if (digit === 0) {
      zeroFlag = result.length > 0
      continue
    }

    if (zeroFlag) {
      result += '零'
      zeroFlag = false
    }

    result += chineseDigitsArray[digit] + (units[position] || '')
  }

  result = result.replace(/^一十/, '十')
  return result || '零'
}

/**
 * 将中文数字字符串解析为阿拉伯数字
 * @param {string} str - 中文数字字符串
 * @returns {number} 阿拉伯数字
 */
function parseChineseNumber(str) {
  if (!str) return NaN
  let total = 0
  let section = 0
  let number = 0

  for (const char of str) {
    if (char === '零') {
      if (number !== 0) number = 0
      continue
    }

    if (chineseDigitMap[char] !== undefined) {
      number = chineseDigitMap[char]
    } else if (chineseUnitsMap[char]) {
      const unitValue = chineseUnitsMap[char]
      if (unitValue === 10000) {
        section = (section + number) * unitValue
        total += section
        section = 0
      } else {
        const multiplier = number === 0 && char === '十' ? 1 : number
        section += multiplier * unitValue
      }
      number = 0
    } else {
      return NaN
    }
  }

  return total + section + number
}

/**
 * 解析章节名称，提取章节编号和描述
 * @param {string} name - 章节名称
 * @returns {{number: number, suffix: string, description: string}|null}
 */
export function parseChapterName(name) {
  const match = name.match(/^第(.+?)([章回集节部卷])\s*(.*)$/)
  if (!match) return null
  const [, rawNumber, suffix, description] = match
  let number
  if (/^\d+$/.test(rawNumber)) {
    number = parseInt(rawNumber, 10)
  } else {
    number = parseChineseNumber(rawNumber)
  }

  if (!Number.isFinite(number) || number <= 0) return null

  return {
    number,
    suffix,
    description: description || ''
  }
}

/**
 * 根据章节序号和设置生成章节名称前缀
 * @param {number} number - 章节序号
 * @param {{chapterFormat?: string, suffixType?: string, suffix?: string}} settings - 章节格式设置
 * @returns {string} 章节名称前缀
 */
export function generateChapterName(number, settings) {
  const format = settings?.chapterFormat === 'hanzi' ? 'hanzi' : 'number'
  const suffix = settings?.suffixType || settings?.suffix || '章'
  const numberPart = format === 'hanzi' ? convertNumberToChinese(number) : String(number)
  return `第${numberPart}${suffix}`
}

/**
 * 检查章节编号是否连续
 * @param {Array<{name?: string, parsed?: {number: number}}>} chapters - 章节列表
 * @returns {{isSequential: boolean, missingNumbers: number[], maxNumber: number, totalChapters: number}}
 */
function checkChapterNumbering(chapters) {
  if (!chapters || chapters.length === 0) {
    return { isSequential: true, missingNumbers: [], maxNumber: 0, totalChapters: 0 }
  }

  const chapterNumbers = chapters
    .map((chapter) => {
      if (chapter.parsed?.number) return chapter.parsed.number
      const parsed = parseChapterName(chapter.name || '')
      return parsed?.number || 0
    })
    .filter((num) => num > 0)
    .sort((a, b) => a - b)

  if (chapterNumbers.length === 0) {
    return { isSequential: true, missingNumbers: [], maxNumber: 0, totalChapters: chapters.length }
  }

  const maxNumber = Math.max(...chapterNumbers)
  const totalChapters = chapters.length
  const missingNumbers = []

  // 检查缺失的编号
  for (let i = 1; i <= maxNumber; i++) {
    if (!chapterNumbers.includes(i)) {
      missingNumbers.push(i)
    }
  }

  const isSequential = missingNumbers.length === 0 && maxNumber === totalChapters

  return {
    isSequential,
    missingNumbers,
    maxNumber,
    totalChapters,
    chapterNumbers
  }
}

// ========== IPC 处理器注册 ==========

/**
 * 注册卷/章节/节点相关的 IPC 处理器
 * @param {import('electron-store').default} store - electron-store 实例
 * @param {Function} readStats - 读取统计数据的函数（来自 stats 模块）
 */
export function registerChaptersHandlers(store, readStats) {
  // 创建卷
  ipcMain.handle('create-volume', async (event, bookName) => {
    const booksDir = store.get('booksDir')
    const bookPath = join(booksDir, bookName)
    const volumePath = join(bookPath, '正文')
    if (!fs.existsSync(volumePath)) {
      fs.mkdirSync(volumePath, { recursive: true })
    }
    let volumeName = '新加卷'
    let index = 1
    while (fs.existsSync(join(volumePath, volumeName))) {
      volumeName = `新加卷${index}`
      index++
    }
    fs.mkdirSync(join(volumePath, volumeName))
    return { success: true }
  })

  // 创建章节
  ipcMain.handle('create-chapter', async (event, { bookName, volumeId }) => {
    const booksDir = store.get('booksDir')
    const bookPath = join(booksDir, bookName)
    const volumePath = join(bookPath, '正文', volumeId)
    if (!fs.existsSync(volumePath)) {
      fs.mkdirSync(volumePath, { recursive: true })
    }

    // 获取当前卷下的所有章节文件
    const files = fs.readdirSync(volumePath, { withFileTypes: true })
    const chapters = files.filter((file) => file.isFile() && file.name.endsWith('.txt'))

    // 智能计算新的章节序号
    let nextChapterNumber = 1

    if (chapters.length > 0) {
      const chapterNumbers = chapters
        .map((file) => {
          if (file.isFile() && file.name.endsWith('.txt')) {
            const parsed = parseChapterName(file.name.replace('.txt', ''))
            return parsed?.number || 0
          }
          return 0
        })
        .filter((num) => num > 0)

      if (chapterNumbers.length > 0) {
        nextChapterNumber = Math.max(...chapterNumbers) + 1
      } else {
        nextChapterNumber = chapters.length + 1
      }
    }

    // 获取章节设置
    const chapterSettings = store.get(`chapterSettings:${bookName}`) || {
      chapterFormat: 'number',
      suffixType: '章',
      targetWords: 2000
    }

    // 根据设置生成章节名称
    const chapterName = `${generateChapterName(nextChapterNumber, chapterSettings)} `
    const filePath = join(volumePath, `${chapterName}.txt`)

    fs.writeFileSync(filePath, '')

    // 强制同步文件系统，确保文件立即可见（Windows兼容）
    try {
      const fd = fs.openSync(filePath, 'r')
      fs.fsyncSync(fd)
      fs.closeSync(fd)
    } catch (error) {
      // 如果同步失败，记录错误但不影响主流程
      console.warn('文件同步失败:', error.message)
    }

    // 保存章节创建时间到元数据
    const metaPath = join(volumePath, '.chapter_meta.json')
    let metaData = {}
    if (fs.existsSync(metaPath)) {
      try {
        metaData = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
      } catch (error) {
        console.error('读取章节元数据失败:', error)
      }
    }

    // 保存创建时间
    metaData[chapterName] = {
      createdAt: new Date().toISOString()
    }

    fs.writeFileSync(metaPath, JSON.stringify(metaData, null, 2), 'utf-8')

    return { success: true, chapterName, filePath }
  })

  // 加载章节数据
  ipcMain.handle('load-chapters', async (event, bookName) => {
    const bookPath = findBookPath(store, bookName)
    if (!bookPath) {
      return []
    }

    const volumePath = join(bookPath, '正文')

    if (!fs.existsSync(volumePath)) {
      return []
    }

    const volumes = fs.readdirSync(volumePath, { withFileTypes: true })
    // 读取统计数据，若 booksDir 未设置则返回空统计，避免新书首次进入时报错
    let stats = { dailyStats: {}, chapterStats: {}, bookDailyStats: {} }
    try {
      stats = readStats(store)
    } catch (error) {
      console.warn('读取统计数据失败，使用空统计:', error.message)
    }

    const chapters = []
    for (const volume of volumes) {
      if (volume.isDirectory()) {
        const volumeName = volume.name
        const currentVolumePath = join(bookPath, '正文', volumeName)

        const files = fs.readdirSync(currentVolumePath, { withFileTypes: true })

        // 读取章节元数据（创建时间）
        const metaPath = join(currentVolumePath, '.chapter_meta.json')
        let metaData = {}
        if (fs.existsSync(metaPath)) {
          try {
            metaData = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
          } catch (error) {
            console.error('读取章节元数据失败:', error)
          }
        }

        const volumeChapters = files
          .filter((file) => file.isFile() && file.name.endsWith('.txt'))
          .map((file) => {
            const name = file.name.replace('.txt', '')
            const parsed = parseChapterName(name)
            const chapterKey = `${bookName}/${volumeName}/${name}`
            const chapterStat = stats.chapterStats[chapterKey]

            // 获取创建时间，如果元数据中没有，则使用文件的创建时间作为后备
            const filePath = join(currentVolumePath, file.name)
            let createdAt = metaData[name]?.createdAt
            if (!createdAt) {
              try {
                const fileStats = fs.statSync(filePath)
                createdAt = fileStats.birthtime.toISOString()
                // 补充元数据
                if (!metaData[name]) {
                  metaData[name] = { createdAt }
                }
              } catch (error) {
                createdAt = new Date().toISOString()
              }
            }

            return {
              id: file.name,
              name,
              type: 'chapter',
              path: join(bookPath, '正文', volumeName, file.name),
              orderValue: parsed?.number || 0,
              hasOrderValue: Boolean(parsed?.number),
              wordCount: chapterStat ? chapterStat.totalWords : 0,
              createdAt // 添加创建时间字段
            }
          })
          .sort((a, b) => {
            if (a.hasOrderValue && b.hasOrderValue) {
              return a.orderValue - b.orderValue
            }
            if (a.hasOrderValue) return -1
            if (b.hasOrderValue) return 1
            return a.name.localeCompare(b.name)
          })

        // 如果有新添加的元数据，保存回文件
        if (Object.keys(metaData).length > 0) {
          try {
            fs.writeFileSync(metaPath, JSON.stringify(metaData, null, 2), 'utf-8')
          } catch (error) {
            console.error('保存章节元数据失败:', error)
          }
        }

        for (const chapter of volumeChapters) {
          delete chapter.orderValue
          delete chapter.hasOrderValue
        }

        chapters.push({
          id: volumeName,
          name: volumeName,
          type: 'volume',
          path: join(bookPath, '正文', volumeName),
          children: volumeChapters
        })
      }
    }

    return chapters
  })

  // 重新格式化章节编号
  ipcMain.handle('reformat-chapter-numbers', async (event, { bookName, volumeName, settings }) => {
    try {
      const booksDir = store.get('booksDir')
      const bookPath = join(booksDir, bookName)
      const volumePath = join(bookPath, '正文', volumeName)

      if (!fs.existsSync(volumePath)) {
        return { success: false, message: '卷目录不存在' }
      }

      // 获取当前卷下的所有章节文件
      const files = fs.readdirSync(volumePath, { withFileTypes: true })
      const chapters = files.filter((file) => file.isFile() && file.name.endsWith('.txt'))

      if (chapters.length === 0) {
        return { success: false, message: '没有找到章节文件' }
      }

      // 检查章节编号连续性
      const chapterInfos = chapters.map((file) => {
        const oldName = file.name.replace('.txt', '')
        const parsed = parseChapterName(oldName)
        return {
          oldName,
          oldPath: join(volumePath, file.name),
          file,
          parsed
        }
      })

      const numberingCheck = checkChapterNumbering(
        chapterInfos.map((info) => ({ name: info.oldName, parsed: info.parsed }))
      )

      if (numberingCheck.isSequential) {
        return { success: true, message: '章节编号已经连续，无需重新格式化' }
      }

      // 按章节编号排序
      chapterInfos.sort((a, b) => {
        const aNum = a.parsed?.number || 0
        const bNum = b.parsed?.number || 0
        if (aNum && bNum) return aNum - bNum
        return a.oldName.localeCompare(b.oldName)
      })

      // 重新格式化章节编号，保留主题名
      let totalRenamed = 0
      for (let i = 0; i < chapterInfos.length; i++) {
        const info = chapterInfos[i]
        const newNumber = i + 1

        // 提取原有的主题名/描述内容
        const description = info.parsed?.description || ''
        const newPrefix = generateChapterName(newNumber, settings)
        const newName = description ? `${newPrefix} ${description}` : newPrefix

        if (newName !== info.oldName) {
          const newPath = join(volumePath, `${newName}.txt`)

          try {
            fs.renameSync(info.oldPath, newPath)
            totalRenamed++
          } catch (error) {
            return { success: false, message: `重命名失败: ${error.message}` }
          }
        }
      }

      return {
        success: true,
        message: `成功重新格式化 ${totalRenamed} 个章节`,
        totalRenamed
      }
    } catch (error) {
      return { success: false, message: `操作失败: ${error.message}` }
    }
  })

  // 编辑节点（卷或章节重命名）
  ipcMain.handle('edit-node', async (event, { bookName, type, volume, chapter, newName }) => {
    try {
      const booksDir = store.get('booksDir')
      if (type === 'volume') {
        // 卷重命名
        const volumePath = join(booksDir, bookName, '正文', volume)
        const newVolumePath = join(booksDir, bookName, '正文', newName)

        // 检查原路径是否存在
        if (!fs.existsSync(volumePath)) {
          return { success: false, message: '原卷不存在' }
        }

        // 检查新名称是否已存在
        if (fs.existsSync(newVolumePath)) {
          return { success: false, message: '新卷名已存在' }
        }

        // 检查名称是否相同
        if (volume === newName) {
          return { success: true, message: '名称未变化' }
        }

        // 在 Windows 上，如果文件夹被占用，renameSync 可能会失败
        try {
          fs.renameSync(volumePath, newVolumePath)
          return { success: true }
        } catch (renameError) {
          // 如果是 Windows 上的权限或锁定错误，提供更友好的错误信息
          if (process.platform === 'win32') {
            const errorMessage = renameError.message || String(renameError)
            if (
              errorMessage.includes('EACCES') ||
              errorMessage.includes('EPERM') ||
              errorMessage.includes('EBUSY')
            ) {
              return {
                success: false,
                message: '文件夹被占用，请关闭可能正在使用该文件夹的程序（如资源管理器）后重试'
              }
            }
          }
          throw renameError
        }
      } else if (type === 'chapter') {
        // 章节重命名
        const chapterPath = join(booksDir, bookName, '正文', volume, `${chapter}.txt`)
        const newChapterPath = join(booksDir, bookName, '正文', volume, `${newName}.txt`)

        // 检查原路径是否存在
        if (!fs.existsSync(chapterPath)) {
          return { success: false, message: '原章节不存在' }
        }

        // 检查新名称是否已存在
        if (fs.existsSync(newChapterPath)) {
          return { success: false, message: '新章节名已存在' }
        }

        // 检查名称是否相同
        if (chapter === newName) {
          return { success: true, message: '名称未变化' }
        }

        try {
          fs.renameSync(chapterPath, newChapterPath)
          return { success: true }
        } catch (renameError) {
          if (process.platform === 'win32') {
            const errorMessage = renameError.message || String(renameError)
            if (
              errorMessage.includes('EACCES') ||
              errorMessage.includes('EPERM') ||
              errorMessage.includes('EBUSY')
            ) {
              return {
                success: false,
                message: '文件被占用，请关闭可能正在使用该文件的程序后重试'
              }
            }
          }
          throw renameError
        }
      }
      return { success: false, message: '类型错误' }
    } catch (error) {
      console.error('编辑节点失败:', error)
      return { success: false, message: error.message }
    }
  })

  // 删除节点（卷或章节）
  ipcMain.handle('delete-node', async (event, { bookName, type, volume, chapter }) => {
    const booksDir = store.get('booksDir')
    if (type === 'volume') {
      const volumePath = join(booksDir, bookName, '正文', volume)
      // 删除整个卷文件夹
      if (!fs.existsSync(volumePath)) return { success: false, message: '卷不存在' }
      fs.rmSync(volumePath, { recursive: true, force: true })
      return { success: true }
    } else if (type === 'chapter') {
      const chapterPath = join(booksDir, bookName, '正文', volume, `${chapter}.txt`)
      if (!fs.existsSync(chapterPath)) return { success: false, message: '章节不存在' }
      fs.rmSync(chapterPath)
      return { success: true }
    }
    return { success: false, message: '类型错误' }
  })

  // 获取卷排序方式
  ipcMain.handle('get-sort-order', (event, bookName) => {
    return store.get(`sortOrder:${bookName}`) || 'asc'
  })

  // 设置卷排序方式
  ipcMain.handle('set-sort-order', (event, { bookName, order }) => {
    store.set(`sortOrder:${bookName}`, order)
    return true
  })

  // 获取章节时间排序
  ipcMain.handle('get-chapter-sort-order', (event, bookName) => {
    return store.get(`chapterSortOrder:${bookName}`) || 'desc' // 默认降序
  })

  // 设置章节时间排序
  ipcMain.handle('set-chapter-sort-order', (event, { bookName, order }) => {
    store.set(`chapterSortOrder:${bookName}`, order)
    return true
  })

  // 获取章节设置
  ipcMain.handle('get-chapter-settings', (event, bookName) => {
    const settings = store.get(`chapterSettings:${bookName}`) || {
      suffixType: '章',
      targetWords: 2000
    }

    return {
      suffixType: settings.suffixType || '章',
      targetWords: Number.isFinite(Number(settings.targetWords))
        ? Number(settings.targetWords)
        : 2000
    }
  })

  // 设置章节目标字数
  ipcMain.handle('set-chapter-target-words', (event, { bookName, targetWords }) => {
    if (!bookName) {
      return { success: false, message: '书籍名称不能为空' }
    }
    const numeric = Number(targetWords)
    const sanitized = Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : 2000
    const existing = store.get(`chapterSettings:${bookName}`) || {
      suffixType: '章',
      targetWords: 2000
    }
    const updated = {
      ...existing,
      targetWords: sanitized
    }
    try {
      store.set(`chapterSettings:${bookName}`, updated)
      return { success: true, settings: updated }
    } catch (error) {
      console.error('更新章节目标字数失败:', error)
      return { success: false, message: error.message || '更新失败' }
    }
  })

  // 更新章节格式（重命名所有章节文件以应用新的格式）
  ipcMain.handle('update-chapter-format', async (event, { bookName, settings: rawSettings }) => {
    try {
      const booksDir = store.get('booksDir')
      const bookPath = join(booksDir, bookName)
      const volumePath = join(bookPath, '正文')

      if (!fs.existsSync(volumePath)) {
        return { success: false, message: '正文目录不存在' }
      }

      // 保存设置（补齐默认值）
      const cleanSettings = {
        chapterFormat: rawSettings?.chapterFormat === 'hanzi' ? 'hanzi' : 'number',
        suffixType: rawSettings?.suffixType || '章',
        targetWords: Number.isFinite(Number(rawSettings?.targetWords))
          ? Number(rawSettings.targetWords)
          : 2000
      }
      store.set(`chapterSettings:${bookName}`, cleanSettings)
      const appliedSettings = cleanSettings

      // 获取所有卷和章节
      const volumes = fs.readdirSync(volumePath, { withFileTypes: true })
      let totalRenamed = 0

      for (const volume of volumes) {
        if (volume.isDirectory()) {
          const volumeName = volume.name
          const currentVolumePath = join(bookPath, '正文', volumeName)
          const files = fs.readdirSync(currentVolumePath, { withFileTypes: true })

          for (const file of files) {
            if (file.isFile() && file.name.endsWith('.txt')) {
              const oldName = file.name.replace('.txt', '')
              const parsed = parseChapterName(oldName)

              if (parsed) {
                const { number: chapterNumber, description } = parsed
                const newPrefix = generateChapterName(chapterNumber, appliedSettings)
                const suffixText = description ? ` ${description}` : ''
                const newName = `${newPrefix}${suffixText}`

                if (newName !== oldName) {
                  const oldPath = join(currentVolumePath, file.name)
                  const newPath = join(currentVolumePath, `${newName}.txt`)

                  fs.renameSync(oldPath, newPath)
                  totalRenamed++
                }
              }
            }
          }
        }
      }

      return {
        success: true,
        message: `成功重命名 ${totalRenamed} 个章节文件`,
        totalRenamed
      }
    } catch (error) {
      const errorMessage = error.message || '未知错误'
      return { success: false, message: errorMessage }
    }
  })

  if (is.dev) {
    console.log('[chapters] 章节相关 IPC 处理器注册完成')
  }
}
