import { ipcMain } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { is } from '@electron-toolkit/utils'
import dayjs from 'dayjs'
import { findBookPath } from './chapters.js'

const NOTE_FILE_EXTENSIONS = ['.md', '.markdown', '.txt']
const DEFAULT_NOTE_EXTENSION = '.md'

function isSupportedNoteFile(fileName) {
  return NOTE_FILE_EXTENSIONS.some((ext) => fileName.toLowerCase().endsWith(ext))
}

function stripNoteExtension(fileName) {
  return fileName.replace(/\.(md|markdown|txt)$/i, '')
}

function resolveNotePath(notebookPath, noteName) {
  for (const ext of NOTE_FILE_EXTENSIONS) {
    const candidate = join(notebookPath, `${noteName}${ext}`)
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }
  return null
}

function buildUniqueNoteName(notebookPath, baseName) {
  let candidateName = baseName
  let index = 1
  while (resolveNotePath(notebookPath, candidateName)) {
    candidateName = `${baseName}${index}`
    index++
  }
  return candidateName
}

/**
 * 注册笔记本、笔记、回收站相关的 IPC 处理器
 * @param {import('electron-store').default} store - electron-store 实例
 * @param {Function} updateBookMetadata - 更新书籍元数据的函数（来自 stats 模块）
 */
export function registerNotesHandlers(store, updateBookMetadata) {
  // 加载笔记数据
  ipcMain.handle('load-notes', async (event, bookName) => {
    const booksDir = store.get('booksDir')
    const bookPath = join(booksDir, bookName)
    const notesPath = join(bookPath, '笔记')
    if (!fs.existsSync(notesPath)) {
      return []
    }
    // 递归读取笔记目录
    function readNotesDir(dir, isRoot = false) {
      const items = fs.readdirSync(dir, { withFileTypes: true })
      return items
        .filter((item) => {
          if (isRoot) return item.isDirectory() // 根层只返回文件夹（笔记本）
          if (item.isDirectory()) return true
          return item.isFile() && isSupportedNoteFile(item.name)
        })
        .reduce((acc, item) => {
          if (item.isDirectory()) {
            acc.push({
              id: item.name,
              name: item.name,
              type: 'folder',
              path: join(dir, item.name), // 唯一
              children: readNotesDir(join(dir, item.name))
            })
          } else {
            const noteName = stripNoteExtension(item.name)
            const existingIndex = acc.findIndex(
              (child) => child.type === 'note' && child.name === noteName
            )
            const noteItem = {
              id: noteName,
              name: noteName,
              type: 'note',
              path: join(dir, item.name) // 唯一
            }
            if (existingIndex === -1) {
              acc.push(noteItem)
            } else {
              const existingItem = acc[existingIndex]
              const existingExt = existingItem.path.toLowerCase().match(/\.[^.]+$/)?.[0] || ''
              const currentExt = item.name.toLowerCase().match(/\.[^.]+$/)?.[0] || ''
              if (
                NOTE_FILE_EXTENSIONS.indexOf(currentExt) <
                NOTE_FILE_EXTENSIONS.indexOf(existingExt)
              ) {
                acc[existingIndex] = noteItem
              }
            }
          }
          return acc
        }, [])
    }
    return readNotesDir(notesPath, true)
  })

  // 创建笔记本
  ipcMain.handle('create-notebook', async (event, { bookName }) => {
    const booksDir = store.get('booksDir')
    const notesPath = join(booksDir, bookName, '笔记')
    let baseName = '新建笔记本'
    let notebookName = baseName
    let index = 1
    while (fs.existsSync(join(notesPath, notebookName))) {
      notebookName = `${baseName}${index}`
      index++
    }
    fs.mkdirSync(join(notesPath, notebookName))
    return { success: true, notebookName }
  })

  // 删除笔记本
  ipcMain.handle('delete-notebook', async (event, { bookName, notebookName }) => {
    const booksDir = store.get('booksDir')
    const notebookPath = join(booksDir, bookName, '笔记', notebookName)
    if (!fs.existsSync(notebookPath)) {
      return { success: false, message: '笔记本不存在' }
    }
    fs.rmSync(notebookPath, { recursive: true, force: true })
    return { success: true }
  })

  // 重命名笔记本
  ipcMain.handle('rename-notebook', async (event, { bookName, oldName, newName }) => {
    const booksDir = store.get('booksDir')
    const notesPath = join(booksDir, bookName, '笔记')
    const oldPath = join(notesPath, oldName)
    const newPath = join(notesPath, newName)
    if (!fs.existsSync(oldPath)) {
      return { success: false, message: '原笔记本不存在' }
    }
    if (fs.existsSync(newPath)) {
      return { success: false, message: '新笔记本名已存在' }
    }
    fs.renameSync(oldPath, newPath)
    return { success: true }
  })

  // 创建笔记
  ipcMain.handle('create-note', async (event, { bookName, notebookName, noteName }) => {
    const booksDir = store.get('booksDir')
    const notebookPath = join(booksDir, bookName, '笔记', notebookName)
    if (!fs.existsSync(notebookPath)) {
      return { success: false, message: '笔记本不存在' }
    }
    const baseName = noteName || '新建笔记'
    const uniqueName = buildUniqueNoteName(notebookPath, baseName)
    fs.writeFileSync(join(notebookPath, `${uniqueName}${DEFAULT_NOTE_EXTENSION}`), '', 'utf-8')
    return { success: true }
  })

  // 删除笔记
  ipcMain.handle('delete-note', async (event, { bookName, notebookName, noteName }) => {
    const booksDir = store.get('booksDir')
    const notebookPath = join(booksDir, bookName, '笔记', notebookName)
    const notePath = resolveNotePath(notebookPath, noteName)
    if (!notePath || !fs.existsSync(notePath)) {
      return { success: false, message: '笔记不存在' }
    }
    fs.rmSync(notePath)
    return { success: true }
  })

  // 重命名笔记
  ipcMain.handle('rename-note', async (event, { bookName, notebookName, oldName, newName }) => {
    const booksDir = store.get('booksDir')
    const notebookPath = join(booksDir, bookName, '笔记', notebookName)
    const oldPath = resolveNotePath(notebookPath, oldName)
    const duplicatedPath = resolveNotePath(notebookPath, newName)
    const newPath = join(notebookPath, `${newName}${DEFAULT_NOTE_EXTENSION}`)
    if (!oldPath || !fs.existsSync(oldPath)) {
      return { success: false, message: '原笔记不存在' }
    }
    if (duplicatedPath && duplicatedPath !== oldPath) {
      return { success: false, message: '新笔记名已存在' }
    }
    fs.renameSync(oldPath, newPath)
    return { success: true }
  })

  // 读取笔记内容
  ipcMain.handle('read-note', async (event, { bookName, notebookName, noteName }) => {
    const booksDir = store.get('booksDir')
    const notebookPath = join(booksDir, bookName, '笔记', notebookName)
    const notePath = resolveNotePath(notebookPath, noteName)
    if (!notePath || !fs.existsSync(notePath)) {
      return { success: false, message: '笔记不存在' }
    }
    const content = fs.readFileSync(notePath, 'utf-8')
    return { success: true, content }
  })

  // 保存笔记内容并支持重命名
  ipcMain.handle(
    'edit-note',
    async (event, { bookName, notebookName, noteName, newName, content }) => {
      const booksDir = store.get('booksDir')
      const notebookPath = join(booksDir, bookName, '笔记', notebookName)
      const oldPath = resolveNotePath(notebookPath, noteName)
      const targetName = newName || noteName
      const duplicatePath = resolveNotePath(notebookPath, targetName)
      const newPath = join(notebookPath, `${targetName}${DEFAULT_NOTE_EXTENSION}`)
      if (!oldPath || !fs.existsSync(oldPath)) {
        return { success: false, message: '笔记不存在' }
      }
      if (duplicatePath && duplicatePath !== oldPath) {
        return { success: false, message: '笔记名已存在', name: noteName }
      }
      fs.writeFileSync(newPath, content, 'utf-8')
      if (oldPath !== newPath && fs.existsSync(oldPath)) {
        fs.rmSync(oldPath)
      }
      // 3. 更新书籍元数据（更新updatedAt字段）
      await updateBookMetadata(store, bookName)
      return { success: true, name: targetName }
    }
  )

  // --------- 回收站相关 ---------

  // 保存回收站快照
  ipcMain.handle(
    'save-recycle-bin-snapshot',
    async (event, { bookName, type, volumeName, chapterName, notebookName, noteName, content }) => {
      const bookPath = findBookPath(store, bookName)
      if (!bookPath) return { success: false, message: '书籍不存在' }

      const recycleBinPath = join(bookPath, '.recycle_bin')
      if (!fs.existsSync(recycleBinPath)) {
        fs.mkdirSync(recycleBinPath, { recursive: true })
      }

      const timestamp = Date.now()
      let targetName = ''
      if (type === 'chapter') {
        targetName = `chapter_${volumeName}_${chapterName}`
      } else {
        targetName = `note_${notebookName}_${noteName}`
      }

      // 移除文件名中的非法字符，确保在 Windows 等系统上能够正常保存
      targetName = targetName.replace(/[\\/:*?"<>|]/g, '_')

      const snapshotFileName = `${targetName}_${timestamp}.txt`
      const snapshotPath = join(recycleBinPath, snapshotFileName)

      fs.writeFileSync(snapshotPath, content, 'utf-8')

      // 限制每个文件的快照数量（保留最近50个），避免磁盘空间占用过大
      const files = fs
        .readdirSync(recycleBinPath)
        .filter((f) => f.startsWith(targetName))
        .sort((a, b) => {
          const timeA = parseInt(a.split('_').pop())
          const timeB = parseInt(b.split('_').pop())
          return timeB - timeA
        })

      if (files.length > 50) {
        for (let i = 50; i < files.length; i++) {
          fs.unlinkSync(join(recycleBinPath, files[i]))
        }
      }

      return { success: true }
    }
  )

  // 获取回收站快照列表
  ipcMain.handle(
    'get-recycle-bin-snapshots',
    async (event, { bookName, type, volumeName, chapterName, notebookName, noteName }) => {
      const bookPath = findBookPath(store, bookName)
      if (!bookPath) return { success: false, message: '书籍不存在' }

      const recycleBinPath = join(bookPath, '.recycle_bin')
      if (!fs.existsSync(recycleBinPath)) return { success: true, snapshots: [] }

      let targetPrefix = ''
      if (type === 'chapter') {
        targetPrefix = `chapter_${volumeName}_${chapterName}`
      } else {
        targetPrefix = `note_${notebookName}_${noteName}`
      }
      targetPrefix = targetPrefix.replace(/[\\/:*?"<>|]/g, '_')

      const files = fs
        .readdirSync(recycleBinPath)
        .filter((f) => f.startsWith(targetPrefix))
        .map((f) => {
          const parts = f.split('_')
          const timestamp = parseInt(parts.pop().replace('.txt', ''))
          return {
            fileName: f,
            timestamp,
            timeStr: dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
          }
        })
        .sort((a, b) => b.timestamp - a.timestamp)

      return { success: true, snapshots: files }
    }
  )

  // 读取回收站快照内容
  ipcMain.handle('read-recycle-bin-snapshot', async (event, { bookName, fileName }) => {
    const bookPath = findBookPath(store, bookName)
    if (!bookPath) return { success: false, message: '书籍不存在' }

    const snapshotPath = join(bookPath, '.recycle_bin', fileName)
    if (!fs.existsSync(snapshotPath)) return { success: false, message: '快照不存在' }

    const content = fs.readFileSync(snapshotPath, 'utf-8')
    return { success: true, content }
  })

  if (is.dev) {
    console.log('[notes] 笔记/回收站相关 IPC 处理器注册完成')
  }
}
