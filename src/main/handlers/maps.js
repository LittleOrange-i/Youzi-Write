import { ipcMain } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { is } from '@electron-toolkit/utils'

/**
 * 注册地图相关 IPC 处理器
 * @param {import('electron-store').default} store - electron-store 实例
 */
export function registerMapsHandlers(store) {
  // 读取地图列表
  ipcMain.handle('read-maps', async (event, bookName) => {
    try {
      const booksDir = store.get('booksDir')
      if (!booksDir) {
        throw new Error('未设置书籍目录')
      }
      const bookPath = join(booksDir, bookName)
      const mapsDir = join(bookPath, 'maps')
      if (!fs.existsSync(mapsDir)) {
        fs.mkdirSync(mapsDir, { recursive: true })
        return []
      }
      const files = fs.readdirSync(mapsDir)
      const maps = files
        .filter((file) => file.endsWith('.png'))
        .map((file) => {
          const name = file.split('.').slice(0, -1).join('.')
          const filePath = join(mapsDir, file)
          const jsonPath = join(mapsDir, `${name}.json`)

          let thumbnail = ''
          try {
            const data = fs.readFileSync(filePath)
            thumbnail = `data:image/png;base64,${data.toString('base64')}`
          } catch {
            thumbnail = ''
          }

          // 读取地图元数据（如果存在）
          let mapData = {
            id: name,
            name: name,
            description: ''
          }
          if (fs.existsSync(jsonPath)) {
            try {
              const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
              mapData = {
                id: jsonData.id || name,
                name: jsonData.name || name,
                description: jsonData.description || ''
              }
            } catch (error) {
              console.error(`读取地图元数据失败: ${name}`, error)
            }
          }

          return {
            ...mapData,
            thumbnail
          }
        })
      return maps
    } catch (error) {
      console.error('读取地图列表失败:', error)
      throw error
    }
  })

  // 读取地图图片为 base64
  ipcMain.handle('read-map-image', async (event, { bookName, mapName }) => {
    try {
      const booksDir = store.get('booksDir')
      if (!booksDir) {
        throw new Error('未设置书籍目录')
      }
      const filePath = join(booksDir, bookName, 'maps', `${mapName}.png`)
      if (!fs.existsSync(filePath)) return ''
      const data = fs.readFileSync(filePath)
      return `data:image/png;base64,${data.toString('base64')}`
    } catch {
      return ''
    }
  })

  // 创建地图（有同名校验）
  ipcMain.handle('create-map', async (event, { bookName, mapName, description, imageData }) => {
    try {
      const booksDir = store.get('booksDir')
      if (!booksDir) {
        throw new Error('未设置书籍目录')
      }
      const bookPath = join(booksDir, bookName)
      const mapsDir = join(bookPath, 'maps')
      if (!fs.existsSync(mapsDir)) {
        fs.mkdirSync(mapsDir, { recursive: true })
      }
      // 校验同名文件
      const filePath = join(mapsDir, `${mapName}.png`)
      const jsonPath = join(mapsDir, `${mapName}.json`)
      if (fs.existsSync(filePath) || fs.existsSync(jsonPath)) {
        throw new Error('已存在同名地图文件')
      }
      // 保存图片
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      fs.writeFileSync(filePath, buffer)

      // 保存地图元数据
      const mapData = {
        id: mapName,
        name: mapName,
        description: description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      fs.writeFileSync(jsonPath, JSON.stringify(mapData, null, 2), 'utf-8')

      return {
        success: true,
        path: filePath
      }
    } catch (error) {
      console.error('创建地图失败:', error)
      throw error
    }
  })

  // 更新地图（无同名校验）
  ipcMain.handle('update-map', async (event, { bookName, mapName, imageData, mapData }) => {
    try {
      const booksDir = store.get('booksDir')
      if (!booksDir) {
        throw new Error('未设置书籍目录')
      }
      const bookPath = join(booksDir, bookName)
      const mapsDir = join(bookPath, 'maps')
      if (!fs.existsSync(mapsDir)) {
        fs.mkdirSync(mapsDir, { recursive: true })
      }
      const filePath = join(mapsDir, `${mapName}.png`)
      const dataFilePath = join(mapsDir, `${mapName}.data.json`)

      // 保存图片（覆盖）
      if (imageData) {
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        fs.writeFileSync(filePath, buffer)
      }

      // 保存地图数据（画板内容）
      if (mapData) {
        fs.writeFileSync(dataFilePath, JSON.stringify(mapData, null, 2), 'utf-8')
      }

      return {
        success: true,
        path: filePath
      }
    } catch (error) {
      console.error('更新地图失败:', error)
      throw error
    }
  })

  // 保存地图数据（画板内容）
  ipcMain.handle('save-map-data', async (event, { bookName, mapName, mapData }) => {
    try {
      const booksDir = store.get('booksDir')
      if (!booksDir) {
        throw new Error('未设置书籍目录')
      }
      const bookPath = join(booksDir, bookName)
      const mapsDir = join(bookPath, 'maps')
      if (!fs.existsSync(mapsDir)) {
        fs.mkdirSync(mapsDir, { recursive: true })
      }
      const dataFilePath = join(mapsDir, `${mapName}.data.json`)
      fs.writeFileSync(dataFilePath, JSON.stringify(mapData, null, 2), 'utf-8')
      return {
        success: true,
        path: dataFilePath
      }
    } catch (error) {
      console.error('保存地图数据失败:', error)
      throw error
    }
  })

  // 加载地图数据（画板内容）
  ipcMain.handle('load-map-data', async (event, { bookName, mapName }) => {
    try {
      const booksDir = store.get('booksDir')
      if (!booksDir) {
        throw new Error('未设置书籍目录')
      }
      const dataFilePath = join(booksDir, bookName, 'maps', `${mapName}.data.json`)
      if (!fs.existsSync(dataFilePath)) {
        return null // 如果没有数据文件，返回 null
      }
      const data = fs.readFileSync(dataFilePath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error('加载地图数据失败:', error)
      return null
    }
  })

  // 删除地图
  ipcMain.handle('delete-map', async (event, { bookName, mapName }) => {
    try {
      const booksDir = store.get('booksDir')
      if (!booksDir) {
        throw new Error('未设置书籍目录')
      }
      const mapsDir = join(booksDir, bookName, 'maps')
      const filePath = join(mapsDir, `${mapName}.png`)
      const jsonPath = join(mapsDir, `${mapName}.json`)
      const dataFilePath = join(mapsDir, `${mapName}.data.json`)

      // 删除图片文件
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      // 删除元数据文件
      if (fs.existsSync(jsonPath)) {
        fs.unlinkSync(jsonPath)
      }
      // 删除数据文件
      if (fs.existsSync(dataFilePath)) {
        fs.unlinkSync(dataFilePath)
      }

      return { success: true }
    } catch (error) {
      console.error('删除地图失败:', error)
      throw error
    }
  })

  if (is.dev) {
    console.log('[主进程] 地图模块处理器已注册')
  }
}
