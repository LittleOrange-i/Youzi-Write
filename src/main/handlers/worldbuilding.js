import { ipcMain } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { is } from '@electron-toolkit/utils'

/**
 * 注册时间线、人物谱、词条字典、事序图相关的 IPC 处理器
 * @param {import('electron-store').default} store - electron-store 实例
 */
export function registerWorldbuildingHandlers(store) {
  // 读取时间线数据
  ipcMain.handle('read-timeline', async (event, { bookName }) => {
    const booksDir = store.get('booksDir')
    const bookPath = join(booksDir, bookName)
    const timelinePath = join(bookPath, 'timelines.json')
    if (!fs.existsSync(timelinePath)) return []
    try {
      return JSON.parse(fs.readFileSync(timelinePath, 'utf-8'))
    } catch {
      return []
    }
  })

  // 保存时间线数据
  ipcMain.handle('write-timeline', async (event, { bookName, data }) => {
    const booksDir = store.get('booksDir')
    const bookPath = join(booksDir, bookName)
    const timelinePath = join(bookPath, 'timelines.json')

    try {
      // 确保目录存在
      if (!fs.existsSync(bookPath)) {
        fs.mkdirSync(bookPath, { recursive: true })
      }

      fs.writeFileSync(timelinePath, JSON.stringify(data, null, 2), 'utf-8')
      return { success: true }
    } catch (error) {
      console.error('保存时间线失败:', error)
      return { success: false, message: error.message }
    }
  })

  // 读取人物谱数据
  ipcMain.handle('read-characters', async (event, { bookName }) => {
    const booksDir = store.get('booksDir')
    const bookPath = join(booksDir, bookName)
    const charactersPath = join(bookPath, 'characters.json')
    if (!fs.existsSync(charactersPath)) return []
    try {
      return JSON.parse(fs.readFileSync(charactersPath, 'utf-8'))
    } catch {
      return []
    }
  })

  // 保存人物谱数据
  ipcMain.handle('write-characters', async (event, { bookName, data }) => {
    const booksDir = store.get('booksDir')
    const bookPath = join(booksDir, bookName)
    const charactersPath = join(bookPath, 'characters.json')

    try {
      // 确保目录存在
      if (!fs.existsSync(bookPath)) {
        fs.mkdirSync(bookPath, { recursive: true })
      }

      fs.writeFileSync(charactersPath, JSON.stringify(data, null, 2), 'utf-8')
      return { success: true }
    } catch (error) {
      console.error('保存人物谱失败:', error)
      return { success: false, message: error.message }
    }
  })

  // 保存单个角色到人物谱
  ipcMain.handle('save-character', async (event, { bookName, character }) => {
    const booksDir = store.get('booksDir')
    const bookPath = join(booksDir, bookName)
    const charactersPath = join(bookPath, 'characters.json')

    try {
      // 确保目录存在
      if (!fs.existsSync(bookPath)) {
        fs.mkdirSync(bookPath, { recursive: true })
      }

      // 读取现有人物谱数据
      let characters = []
      if (fs.existsSync(charactersPath)) {
        try {
          characters = JSON.parse(fs.readFileSync(charactersPath, 'utf-8'))
        } catch {
          characters = []
        }
      }

      // 检查角色是否已存在（根据ID）
      const existingIndex = characters.findIndex((c) => c.id === character.id)
      if (existingIndex !== -1) {
        // 更新现有角色
        characters[existingIndex] = character
      } else {
        // 添加新角色
        characters.push(character)
      }

      // 保存更新后的数据
      fs.writeFileSync(charactersPath, JSON.stringify(characters, null, 2), 'utf-8')
      return { success: true }
    } catch (error) {
      console.error('保存角色失败:', error)
      return { success: false, message: error.message }
    }
  })

  // 读取词条字典数据
  ipcMain.handle('read-dictionary', async (event, { bookName }) => {
    const booksDir = store.get('booksDir')
    const bookPath = join(booksDir, bookName)
    const dictionaryPath = join(bookPath, 'dictionary.json')
    if (!fs.existsSync(dictionaryPath)) return []
    try {
      return JSON.parse(fs.readFileSync(dictionaryPath, 'utf-8'))
    } catch {
      return []
    }
  })

  // 保存词条字典数据
  ipcMain.handle('write-dictionary', async (event, { bookName, data }) => {
    const booksDir = store.get('booksDir')
    const bookPath = join(booksDir, bookName)
    const dictionaryPath = join(bookPath, 'dictionary.json')

    try {
      // 确保目录存在
      if (!fs.existsSync(bookPath)) {
        fs.mkdirSync(bookPath, { recursive: true })
      }

      fs.writeFileSync(dictionaryPath, JSON.stringify(data, null, 2), 'utf-8')
      return { success: true }
    } catch (error) {
      console.error('保存词条字典失败:', error)
      return { success: false, message: error.message }
    }
  })

  // 读取事序图数据
  ipcMain.handle('read-sequence-charts', async (event, { bookName }) => {
    const booksDir = store.get('booksDir')
    const bookPath = join(booksDir, bookName)
    const filePath = join(bookPath, 'sequence-charts.json')
    if (!fs.existsSync(filePath)) return []
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    } catch {
      return []
    }
  })

  // 保存事序图数据
  ipcMain.handle('write-sequence-charts', async (event, { bookName, data }) => {
    const booksDir = store.get('booksDir')
    const bookPath = join(booksDir, bookName)
    const filePath = join(bookPath, 'sequence-charts.json')

    try {
      if (!fs.existsSync(bookPath)) {
        fs.mkdirSync(bookPath, { recursive: true })
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
      return { success: true }
    } catch (error) {
      console.error('保存事序图失败:', error)
      return { success: false, message: error.message }
    }
  })

  // 读取物品档案数据
  ipcMain.handle('read-items', async (event, { bookName }) => {
    const booksDir = store.get('booksDir')
    const bookPath = join(booksDir, bookName)
    const itemsPath = join(bookPath, 'items.json')
    if (!fs.existsSync(itemsPath)) return []
    try {
      return JSON.parse(fs.readFileSync(itemsPath, 'utf-8'))
    } catch {
      return []
    }
  })

  // 保存物品档案数据
  ipcMain.handle('write-items', async (event, { bookName, data }) => {
    const booksDir = store.get('booksDir')
    const bookPath = join(booksDir, bookName)
    const itemsPath = join(bookPath, 'items.json')

    try {
      // 确保目录存在
      if (!fs.existsSync(bookPath)) {
        fs.mkdirSync(bookPath, { recursive: true })
      }

      fs.writeFileSync(itemsPath, JSON.stringify(data, null, 2), 'utf-8')
      return { success: true }
    } catch (error) {
      console.error('保存物品档案失败:', error)
      return { success: false, message: error.message }
    }
  })

  if (is.dev) {
    console.log('[worldbuilding] 时间线/人物谱/词条/事序图/物品档案相关 IPC 处理器注册完成')
  }
}
