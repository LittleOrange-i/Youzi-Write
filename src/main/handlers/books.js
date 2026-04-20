import { ipcMain, dialog } from 'electron'
import { join } from 'path'
import path from 'path'
import fs from 'fs'
import { is } from '@electron-toolkit/utils'
import dayjs from 'dayjs'
import crypto from 'crypto'

// ========== 工具函数 ==========

/**
 * 写入书籍文件列表到目标路径（问题6：提取重复代码为通用函数）
 * @param {string} targetPath - 目标书籍目录路径
 * @param {Array} files - 文件列表，每项包含 path、content、encoding、isDirectory
 */
export function writeBookFiles(targetPath, files) {
  for (const file of files) {
    const filePath = join(targetPath, file.path)

    // 如果是目录标记，创建空目录
    if (file.isDirectory) {
      fs.mkdirSync(filePath, { recursive: true })
      continue
    }

    const fileDir = path.dirname(filePath)
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true })
    }

    // 根据文件编码类型写入
    if (file.encoding === 'base64') {
      // 二进制文件：从 base64 还原
      const buffer = Buffer.from(file.content, 'base64')
      fs.writeFileSync(filePath, buffer)
    } else {
      // 文本文件：使用 UTF-8 编码
      fs.writeFileSync(filePath, file.content, 'utf-8')
    }
  }
}

// ========== 书架密码加密处理 ==========

// 加密算法：使用 AES-256-CBC
const ENCRYPTION_KEY = 'youziwrite-shelf-password-key-2024' // 32字符密钥
const IV_LENGTH = 16

// 加密函数
function encryptPassword(password) {
  try {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)

    let encrypted = cipher.update(password, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // 返回 iv:encrypted 格式
    return iv.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('加密密码失败:', error)
    return null
  }
}

// 解密函数
function decryptPassword(encryptedData) {
  try {
    const parts = encryptedData.split(':')
    if (parts.length !== 2) {
      throw new Error('加密数据格式错误')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('解密密码失败:', error)
    return null
  }
}

// ========== 书架导出加密处理 ==========

const BACKUP_ENCRYPTION_KEY = 'youziwrite-backup-encryption-key-2026-v1'

function encryptBackupData(data) {
  try {
    const key = crypto.scryptSync(BACKUP_ENCRYPTION_KEY, 'backup-salt', 32)
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)

    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    return iv.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('加密备份数据失败:', error)
    throw error
  }
}

function decryptBackupData(encryptedData) {
  try {
    const parts = encryptedData.split(':')
    if (parts.length !== 2) {
      throw new Error('备份数据格式错误')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]
    const key = crypto.scryptSync(BACKUP_ENCRYPTION_KEY, 'backup-salt', 32)
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('解密备份数据失败:', error)
    throw error
  }
}

/**
 * 递归读取目录下的所有文件和空文件夹（包括二进制文件）
 */
function readDirectoryRecursive(dirPath, basePath) {
  const files = []

  if (!fs.existsSync(dirPath)) {
    return files
  }

  const items = fs.readdirSync(dirPath, { withFileTypes: true })

  for (const item of items) {
    const fullPath = join(dirPath, item.name)
    const relativePath = path.relative(basePath, fullPath)

    if (item.isDirectory()) {
      const subItems = readDirectoryRecursive(fullPath, basePath)
      files.push(...subItems)

      if (subItems.length === 0) {
        files.push({
          path: relativePath.replace(/\\/g, '/'),
          isDirectory: true
        })
      }
    } else {
      try {
        const ext = path.extname(fullPath).toLowerCase()
        const textExtensions = [
          '.txt', '.md', '.json', '.js', '.ts', '.vue', '.jsx', '.tsx',
          '.css', '.scss', '.sass', '.less', '.html', '.xml', '.yml',
          '.yaml', '.ini', '.conf', '.log', '.csv', '.svg'
        ]

        const isTextFile = textExtensions.includes(ext)

        if (isTextFile) {
          const content = fs.readFileSync(fullPath, 'utf-8')
          files.push({
            path: relativePath.replace(/\\/g, '/'),
            content: content,
            encoding: 'utf-8',
            isDirectory: false
          })
        } else {
          const buffer = fs.readFileSync(fullPath)
          const base64Content = buffer.toString('base64')
          files.push({
            path: relativePath.replace(/\\/g, '/'),
            content: base64Content,
            encoding: 'base64',
            isDirectory: false
          })
        }
      } catch (error) {
        console.error(`读取文件失败: ${fullPath}`, error)
      }
    }
  }

  return files
}

/**
 * 下载网络图片并转换为base64
 */
async function downloadImageToBase64(url) {
  try {
    const https = await import('https')
    const http = await import('http')

    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http

      protocol.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`))
          return
        }

        const chunks = []
        response.on('data', (chunk) => chunks.push(chunk))
        response.on('end', () => {
          const buffer = Buffer.concat(chunks)
          const contentType = response.headers['content-type'] || 'image/jpeg'
          const base64 = buffer.toString('base64')
          resolve(`data:${contentType};base64,${base64}`)
        })
      }).on('error', reject)
    })
  } catch (error) {
    console.error('下载图片失败:', error)
    return null
  }
}

/**
 * 缓存图片到本地（处理在线链接和base64）
 */
async function cacheImageToBase64(imageData) {
  if (!imageData) {
    return null
  }

  if (imageData.startsWith('data:image/')) {
    return imageData
  }

  if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
    return await downloadImageToBase64(imageData)
  }

  if (fs.existsSync(imageData)) {
    try {
      const buffer = fs.readFileSync(imageData)
      const ext = path.extname(imageData).toLowerCase()
      let mimeType = 'image/jpeg'

      if (ext === '.png') mimeType = 'image/png'
      else if (ext === '.gif') mimeType = 'image/gif'
      else if (ext === '.webp') mimeType = 'image/webp'

      const base64 = buffer.toString('base64')
      return `data:${mimeType};base64,${base64}`
    } catch (error) {
      console.error('读取本地图片失败:', error)
      return null
    }
  }

  return null
}

// ========== 注册所有书籍相关 IPC 处理器 ==========

export function registerBooksHandlers(store) {
  // 获取书架密码配置文件路径
  function getShelfPasswordConfigPath() {
    const booksDir = store.get('booksDir')
    if (!booksDir) return null
    return join(booksDir, '.shelf_config.json')
  }

  // 设置书架密码（加密存储）
  ipcMain.handle('set-shelf-password', async (_, { password, hint }) => {
    try {
      const configPath = getShelfPasswordConfigPath()
      if (!configPath) {
        return { success: false, message: '未设置书籍目录' }
      }

      let config = {}

      if (password) {
        const encryptedPassword = encryptPassword(password)
        if (!encryptedPassword) {
          return { success: false, message: '密码加密失败' }
        }

        config = {
          encryptedPassword,
          hint: hint || null,
          updatedAt: new Date().toISOString()
        }
      } else {
        config = {
          encryptedPassword: null,
          hint: null,
          updatedAt: new Date().toISOString()
        }
      }

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
      store.set('shelfPasswordHint', hint || null)

      return { success: true }
    } catch (error) {
      console.error('设置书架密码失败:', error)
      return { success: false, message: error.message }
    }
  })

  // 获取书架密码信息（不返回密码本身）
  ipcMain.handle('get-shelf-password', async () => {
    try {
      const configPath = getShelfPasswordConfigPath()
      if (!configPath || !fs.existsSync(configPath)) {
        return { success: true, hasPassword: false, hint: null }
      }

      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))

      return {
        success: true,
        hasPassword: !!config.encryptedPassword,
        hint: config.hint || null
      }
    } catch (error) {
      console.error('获取书架密码信息失败:', error)
      return { success: false, message: error.message }
    }
  })

  // 验证书架密码
  ipcMain.handle('verify-shelf-password', async (_, password) => {
    try {
      const configPath = getShelfPasswordConfigPath()
      if (!configPath || !fs.existsSync(configPath)) {
        return { success: true, valid: true }
      }

      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))

      if (!config.encryptedPassword) {
        return { success: true, valid: true }
      }

      const decryptedPassword = decryptPassword(config.encryptedPassword)
      if (!decryptedPassword) {
        return { success: false, message: '密码解密失败' }
      }

      const valid = password === decryptedPassword

      return { success: true, valid }
    } catch (error) {
      console.error('验证书架密码失败:', error)
      return { success: false, message: error.message }
    }
  })

  // 选择书籍目录
  ipcMain.handle('select-books-dir', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return result
  })

  // 选择图片文件
  ipcMain.handle('select-image', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    })

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0]
      try {
        const imageBuffer = fs.readFileSync(filePath)
        const base64Image = imageBuffer.toString('base64')
        const ext = path.extname(filePath).toLowerCase()
        const mimeTypes = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.bmp': 'image/bmp',
          '.webp': 'image/webp'
        }
        const mimeType = mimeTypes[ext] || 'image/jpeg'
        const dataUrl = `data:${mimeType};base64,${base64Image}`

        return {
          filePath: filePath,
          dataUrl: dataUrl
        }
      } catch (error) {
        console.error('读取图片文件失败:', error)
        return { filePath: filePath }
      }
    }

    return null
  })

  // 读取本地图片并转换为 base64
  ipcMain.handle('read-local-image', async (_, filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        return null
      }
      const imageBuffer = fs.readFileSync(filePath)
      const base64Image = imageBuffer.toString('base64')
      const ext = path.extname(filePath).toLowerCase()
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.webp': 'image/webp'
      }
      const mimeType = mimeTypes[ext] || 'image/jpeg'
      return `data:${mimeType};base64,${base64Image}`
    } catch (error) {
      console.error('读取本地图片失败:', error)
      return null
    }
  })

  // 选择保存文件路径
  ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog({
      title: options.title || '保存文件',
      defaultPath: options.defaultPath || '',
      filters: options.filters || [{ name: '文本文件', extensions: ['txt'] }],
      buttonLabel: options.buttonLabel || '保存'
    })

    if (!result.canceled && result.filePath) {
      return { filePath: result.filePath }
    }

    return null
  })

  // 写入导出文件
  ipcMain.handle('write-export-file', async (event, { filePath, content }) => {
    try {
      fs.writeFileSync(filePath, content, 'utf-8')
      return { success: true }
    } catch (error) {
      console.error('写入导出文件失败:', error)
      return { success: false, message: error.message || '写入文件失败' }
    }
  })

  // 创建书籍
  ipcMain.handle('create-book', async (event, bookInfo) => {
    const safeName = bookInfo.name.replace(/[\\/:*?"<>|]/g, '_')
    const booksDir = store.get('booksDir')
    const bookPath = join(booksDir, safeName)
    if (!fs.existsSync(bookPath)) {
      fs.mkdirSync(bookPath)
    }
    const meta = {
      ...bookInfo,
      createdAt: dayjs().format('YYYY/MM/DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY/MM/DD HH:mm:ss')
    }
    fs.writeFileSync(join(bookPath, 'mazi.json'), JSON.stringify(meta, null, 2), 'utf-8')

    const textPath = join(bookPath, '正文')
    fs.mkdirSync(textPath, { recursive: true })
    const notesPath = join(bookPath, '笔记')
    fs.mkdirSync(notesPath, { recursive: true })

    const volumePath = join(textPath, '正文')
    fs.mkdirSync(volumePath, { recursive: true })

    const chapterPath = join(volumePath, '第1章.txt')
    fs.writeFileSync(chapterPath, '')

    fs.mkdirSync(join(notesPath, '大纲'), { recursive: true })
    fs.mkdirSync(join(notesPath, '设定'), { recursive: true })
    fs.mkdirSync(join(notesPath, '人物'), { recursive: true })

    return true
  })

  // 读取书籍目录
  ipcMain.handle('read-books-dir', async () => {
    const books = []
    const booksDir = store.get('booksDir')
    if (!fs.existsSync(booksDir)) return books

    const files = fs.readdirSync(booksDir, { withFileTypes: true })
    for (const file of files) {
      if (file.isDirectory()) {
        const metaPath = join(booksDir, file.name, 'mazi.json')
        if (fs.existsSync(metaPath)) {
          try {
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
            books.push(meta)
          } catch (e) {
            console.error('read-books-dir', e)
          }
        }
      }
    }

    books.sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0)
      const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0)
      return dateB.getTime() - dateA.getTime()
    })
    return books
  })

  // 删除书籍
  ipcMain.handle('delete-book', async (event, { name }) => {
    try {
      const booksDir = store.get('booksDir')
      if (!booksDir) {
        return false
      }

      const bookPath = join(booksDir, name)

      if (!fs.existsSync(bookPath)) {
        console.error('书籍不存在:', bookPath)
        return false
      }

      fs.rmSync(bookPath, { recursive: true, force: true })
      return true
    } catch (error) {
      console.error('删除书籍失败:', error)
      return false
    }
  })

  // 编辑书籍
  ipcMain.handle('edit-book', async (event, bookInfo) => {
    try {
      const booksDir = store.get('booksDir')

      const originalName = bookInfo.originalName || bookInfo.name

      const bookPath = join(booksDir, originalName)

      if (!fs.existsSync(bookPath)) {
        return { success: false, message: '书籍不存在' }
      }

      const metaPath = join(bookPath, 'mazi.json')

      const existingMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))

      if (bookInfo.name !== originalName) {
        const newBookPath = join(booksDir, bookInfo.name)

        if (fs.existsSync(newBookPath)) {
          return { success: false, message: '已存在同名书籍' }
        }

        fs.renameSync(bookPath, newBookPath)

        const newMetaPath = join(newBookPath, 'mazi.json')

        const mergedMeta = { ...existingMeta, ...bookInfo }
        fs.writeFileSync(newMetaPath, JSON.stringify(mergedMeta, null, 2), 'utf-8')
      } else {
        const mergedMeta = { ...existingMeta, ...bookInfo }
        fs.writeFileSync(metaPath, JSON.stringify(mergedMeta, null, 2), 'utf-8')
      }

      return { success: true }
    } catch (error) {
      console.error('编辑书籍失败:', error)
      return { success: false, message: error.message }
    }
  })

  // ========== 书架导出导入功能 ==========

  // 导出整个书架
  ipcMain.handle('export-bookshelf', async (event) => {
    try {
      const booksDir = store.get('booksDir')
      if (!booksDir) {
        return { success: false, message: '未设置书籍目录' }
      }

      const { filePath, canceled } = await dialog.showSaveDialog({
        title: '导出书架',
        defaultPath: `bookshelf_${dayjs().format('YYYYMMDD_HHmmss')}.youzibak`,
        filters: [{ name: '柚子写作备份文件', extensions: ['youzibak'] }]
      })

      if (canceled || !filePath) {
        return { success: false, message: '用户取消操作' }
      }

      const books = []
      const files = fs.readdirSync(booksDir, { withFileTypes: true })

      for (const file of files) {
        if (file.isDirectory()) {
          const metaPath = join(booksDir, file.name, 'mazi.json')
          if (fs.existsSync(metaPath)) {
            try {
              const bookPath = join(booksDir, file.name)

              const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))

              if (meta.coverUrl) {
                const cachedCover = await cacheImageToBase64(meta.coverUrl)
                if (cachedCover) {
                  meta.coverUrl = cachedCover
                }
              }

              const bookFiles = readDirectoryRecursive(bookPath, bookPath)
              const fileCount = bookFiles.filter((f) => !f.isDirectory).length
              const dirCount = bookFiles.filter((f) => f.isDirectory).length
              if (is.dev) {
                console.log(
                  `[导出] 书籍 "${file.name}" 包含 ${fileCount} 个文件${dirCount > 0 ? `, ${dirCount} 个空文件夹` : ''}`
                )
              }

              const charactersFile = bookFiles.find((f) => f.path === 'characters.json')
              if (charactersFile) {
                try {
                  const characters = JSON.parse(charactersFile.content)
                  if (Array.isArray(characters)) {
                    for (const char of characters) {
                      if (char.avatar) {
                        const cachedAvatar = await cacheImageToBase64(char.avatar)
                        if (cachedAvatar) {
                          char.avatar = cachedAvatar
                        }
                      }
                    }
                    charactersFile.content = JSON.stringify(characters, null, 2)
                  }
                } catch (error) {
                  console.error('处理人物头像失败:', error)
                }
              }

              books.push({
                name: file.name,
                metadata: meta,
                files: bookFiles
              })
            } catch (error) {
              console.error(`读取书籍失败: ${file.name}`, error)
            }
          }
        }
      }

      if (books.length === 0) {
        return { success: false, message: '没有找到任何书籍' }
      }

      const exportData = {
        version: '1.0.0',
        exportTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        booksCount: books.length,
        books: books
      }

      const jsonData = JSON.stringify(exportData)
      const encryptedData = encryptBackupData(jsonData)
      fs.writeFileSync(filePath, encryptedData, 'utf-8')

      const totalFiles = books.reduce(
        (sum, book) => sum + book.files.filter((f) => !f.isDirectory).length,
        0
      )
      const totalDirs = books.reduce(
        (sum, book) => sum + book.files.filter((f) => f.isDirectory).length,
        0
      )
      if (is.dev) {
        console.log(
          `[导出] 导出完成: ${books.length} 本书籍, 共 ${totalFiles} 个文件${totalDirs > 0 ? `, ${totalDirs} 个空文件夹` : ''}`
        )
      }

      return {
        success: true,
        filePath: filePath,
        booksCount: books.length,
        totalFiles: totalFiles,
        totalDirs: totalDirs
      }
    } catch (error) {
      console.error('导出书架失败:', error)
      return { success: false, message: error.message }
    }
  })

  // 检查导入书籍的冲突
  ipcMain.handle('check-import-conflicts', async (event, importData) => {
    try {
      const booksDir = store.get('booksDir')
      if (!booksDir) {
        return { success: false, message: '未设置书籍目录' }
      }

      const conflicts = []

      // 规范化作者名称
      const normalizeAuthor = (author) => {
        if (!author || author.trim() === '' || author === '佚名') {
          return '佚名'
        }
        return author.trim()
      }

      if (is.dev) {
        console.log('[导入日志] ========== 开始检查导入冲突 ==========')
        console.log('[导入日志] 导入数据中的书籍数量:', importData.books.length)
      }

      for (const book of importData.books) {
        if (is.dev) console.log('[导入日志] 检查书籍:', book.name)
        const bookAuthor = book.metadata?.author || book.author

        const mainPath = join(booksDir, book.name)
        if (fs.existsSync(mainPath)) {
          const metaPath = join(mainPath, 'mazi.json')
          if (fs.existsSync(metaPath)) {
            const existingMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))

            const normalizedBookAuthor = normalizeAuthor(bookAuthor)
            const normalizedExistingAuthor = normalizeAuthor(existingMeta.author)

            const isSame = normalizedBookAuthor === normalizedExistingAuthor

            conflicts.push({
              bookName: book.name,
              author: normalizedBookAuthor,
              existingAuthor: normalizedExistingAuthor,
              sameAuthor: isSame
            })
          }
        }
      }

      if (is.dev) {
        console.log('[导入日志] 冲突检查完成，共发现冲突:', conflicts.length)
      }

      return {
        success: true,
        conflicts: conflicts
      }
    } catch (error) {
      console.error('检查导入冲突失败:', error)
      return { success: false, message: error.message }
    }
  })

  // 导入书架
  ipcMain.handle('import-bookshelf', async (event, options = {}) => {
    try {
      const booksDir = store.get('booksDir')
      if (!booksDir) {
        return { success: false, message: '未设置书籍目录' }
      }

      let importData

      if (options.importData) {
        importData = options.importData
      } else {
        const { filePaths, canceled } = await dialog.showOpenDialog({
          title: '导入书架',
          filters: [{ name: '柚子写作备份文件', extensions: ['youzibak'] }],
          properties: ['openFile']
        })

        if (canceled || filePaths.length === 0) {
          return { success: false, message: '用户取消操作' }
        }

        const backupFilePath = filePaths[0]
        const encryptedData = fs.readFileSync(backupFilePath, 'utf-8')
        const jsonData = decryptBackupData(encryptedData)
        importData = JSON.parse(jsonData)
      }

      if (!importData.version || !importData.books || !Array.isArray(importData.books)) {
        return { success: false, message: '备份文件格式错误' }
      }

      if (!options.conflictResolutions) {
        return {
          success: false,
          needUserChoice: true,
          importData: importData
        }
      }

      // 规范化作者名称
      const normalizeAuthor = (author) => {
        if (!author || author.trim() === '' || author === '佚名') {
          return '佚名'
        }
        return author.trim()
      }

      const importedBooks = []
      const skippedBooks = []
      const overwrittenBooks = []

      if (is.dev) {
        console.log('[导入执行] ========== 开始执行导入 ==========')
      }

      for (const book of importData.books) {
        try {
          const resolution = options.conflictResolutions[book.name] || 'copy'
          const bookAuthor = book.metadata?.author || book.author

          const mainPath = join(booksDir, book.name)
          const mainExists = fs.existsSync(mainPath)

          if (mainExists) {
            if (resolution === 'skip') {
              skippedBooks.push(book.name)
              continue
            } else if (resolution === 'overwrite') {
              const targetPath = mainPath
              const metaPath = join(targetPath, 'mazi.json')

              if (fs.existsSync(metaPath)) {
                const existingMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))

                const normalizedBookAuthor = normalizeAuthor(bookAuthor)
                const normalizedExistingAuthor = normalizeAuthor(existingMeta.author)

                if (normalizedExistingAuthor === normalizedBookAuthor) {
                  // 作者一致，执行覆盖
                  fs.rmSync(targetPath, { recursive: true, force: true })
                  fs.mkdirSync(targetPath, { recursive: true })
                  // 问题6：使用提取的通用函数写入文件
                  writeBookFiles(targetPath, book.files)

                  const newMetaPath = join(targetPath, 'mazi.json')
                  if (fs.existsSync(newMetaPath)) {
                    const meta = JSON.parse(fs.readFileSync(newMetaPath, 'utf-8'))
                    meta.importedAt = dayjs().format('YYYY/MM/DD HH:mm:ss')
                    fs.writeFileSync(newMetaPath, JSON.stringify(meta, null, 2), 'utf-8')
                  }

                  overwrittenBooks.push(book.name)
                  continue
                }
                // 作者不一致，继续走副本逻辑
              }
            }
          }

          // 副本模式或覆盖失败（作者不一致）
          if (resolution === 'copy' || (resolution === 'overwrite' && mainExists)) {
            let targetName = book.name
            let targetPath = join(booksDir, targetName)
            let counter = 1

            while (fs.existsSync(targetPath)) {
              if (counter === 1) {
                targetName = `${book.name}（副本）`
              } else {
                targetName = `${book.name}（副本${counter}）`
              }
              targetPath = join(booksDir, targetName)
              counter++
            }

            fs.mkdirSync(targetPath, { recursive: true })
            // 问题6：使用提取的通用函数写入文件
            writeBookFiles(targetPath, book.files)

            const metaPath = join(targetPath, 'mazi.json')
            if (fs.existsSync(metaPath)) {
              const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
              meta.name = targetName
              meta.importedAt = dayjs().format('YYYY/MM/DD HH:mm:ss')
              meta.originalName = book.name
              fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8')
            }

            importedBooks.push(targetName)
          } else {
            // 无冲突，直接导入
            const targetPath = join(booksDir, book.name)
            fs.mkdirSync(targetPath, { recursive: true })
            // 问题6：使用提取的通用函数写入文件
            writeBookFiles(targetPath, book.files)

            const metaPath = join(targetPath, 'mazi.json')
            if (fs.existsSync(metaPath)) {
              const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
              meta.importedAt = dayjs().format('YYYY/MM/DD HH:mm:ss')
              fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8')
            }

            importedBooks.push(book.name)
          }
        } catch (error) {
          console.error('[导入执行] 导入书籍失败:', book.name, error)
          skippedBooks.push(book.name)
        }
      }

      if (is.dev) {
        console.log(
          `[导入执行] 完成: 导入 ${importedBooks.length} 本, 跳过 ${skippedBooks.length} 本, 覆盖 ${overwrittenBooks.length} 本`
        )
      }

      return {
        success: true,
        importedCount: importedBooks.length,
        skippedCount: skippedBooks.length,
        overwrittenCount: overwrittenBooks.length,
        importedBooks: importedBooks,
        skippedBooks: skippedBooks,
        overwrittenBooks: overwrittenBooks,
        savePath: booksDir
      }
    } catch (error) {
      console.error('导入书架失败:', error)
      return { success: false, message: error.message }
    }
  })

  // 打开文件选择对话框（用于选择自定义字体）
  ipcMain.handle('show-open-dialog', async (event, options) => {
    try {
      const result = await dialog.showOpenDialog(options)
      return result
    } catch (error) {
      console.error('打开文件对话框失败:', error)
      return { canceled: true }
    }
  })

  // 读取字体文件并返回 Base64 编码
  ipcMain.handle('read-font-file', async (event, fontPath) => {
    try {
      if (!fs.existsSync(fontPath)) {
        throw new Error('字体文件不存在')
      }
      const fontData = fs.readFileSync(fontPath)
      return fontData.toString('base64')
    } catch (error) {
      console.error('读取字体文件失败:', error)
      return null
    }
  })

  // ========== 禁词管理 ==========

  // 获取禁词列表
  ipcMain.handle('get-banned-words', async (event, bookName) => {
    try {
      const booksDir = store.get('booksDir')
      if (!booksDir || !bookName) {
        return { success: false, message: '参数错误' }
      }
      const bannedWordsPath = join(booksDir, bookName, 'banned-words.json')
      if (!fs.existsSync(bannedWordsPath)) {
        return { success: true, data: [] }
      }
      const data = JSON.parse(fs.readFileSync(bannedWordsPath, 'utf-8'))
      return { success: true, data: data.words || [] }
    } catch (error) {
      console.error('获取禁词列表失败:', error)
      return { success: false, message: error.message }
    }
  })

  // 添加禁词
  ipcMain.handle('add-banned-word', async (event, bookName, word) => {
    try {
      const booksDir = store.get('booksDir')
      if (!booksDir || !bookName || !word) {
        return { success: false, message: '参数错误' }
      }
      const bannedWordsPath = join(booksDir, bookName, 'banned-words.json')
      let data = { words: [] }
      if (fs.existsSync(bannedWordsPath)) {
        data = JSON.parse(fs.readFileSync(bannedWordsPath, 'utf-8'))
      }
      if (!data.words) {
        data.words = []
      }
      // 检查是否已存在
      if (data.words.includes(word)) {
        return { success: false, message: '该禁词已存在' }
      }
      // 新增禁词插入到数组开头，使最新的显示在前面
      data.words.unshift(word)
      fs.writeFileSync(bannedWordsPath, JSON.stringify(data, null, 2), 'utf-8')
      return { success: true }
    } catch (error) {
      console.error('添加禁词失败:', error)
      return { success: false, message: error.message }
    }
  })

  // 删除禁词
  ipcMain.handle('remove-banned-word', async (event, bookName, word) => {
    try {
      const booksDir = store.get('booksDir')
      if (!booksDir || !bookName || !word) {
        return { success: false, message: '参数错误' }
      }
      const bannedWordsPath = join(booksDir, bookName, 'banned-words.json')
      if (!fs.existsSync(bannedWordsPath)) {
        return { success: false, message: '禁词文件不存在' }
      }
      const data = JSON.parse(fs.readFileSync(bannedWordsPath, 'utf-8'))
      const index = data.words.indexOf(word)
      if (index === -1) {
        return { success: false, message: '禁词不存在' }
      }
      data.words.splice(index, 1)
      fs.writeFileSync(bannedWordsPath, JSON.stringify(data, null, 2), 'utf-8')
      return { success: true }
    } catch (error) {
      console.error('删除禁词失败:', error)
      return { success: false, message: error.message }
    }
  })
}
