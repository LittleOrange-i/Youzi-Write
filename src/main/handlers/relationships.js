import { ipcMain } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { is } from '@electron-toolkit/utils'

/**
 * 注册关系图相关 IPC 处理器
 * @param {import('electron-store').default} store - electron-store 实例
 */
export function registerRelationshipsHandlers(store) {
  // 读取关系图列表
  ipcMain.handle('read-relationships', async (event, bookName) => {
    try {
      const booksDir = store.get('booksDir')
      if (!booksDir) {
        throw new Error('未设置书籍目录')
      }
      const bookPath = join(booksDir, bookName)
      const relationshipsDir = join(bookPath, 'relationships')
      if (!fs.existsSync(relationshipsDir)) {
        fs.mkdirSync(relationshipsDir, { recursive: true })
        return []
      }
      const files = fs.readdirSync(relationshipsDir)
      const relationships = files
        .filter((file) => file.endsWith('.json'))
        .map((file) => {
          const name = file.replace('.json', '')
          const jsonPath = join(relationshipsDir, `${name}.json`)
          const pngPath = join(relationshipsDir, `${name}.png`)

          let relationshipData = {}
          let thumbnail = ''

          try {
            // 读取 JSON 数据
            relationshipData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
          } catch (error) {
            console.error(`读取关系图数据失败: ${name}`, error)
            relationshipData = {
              id: name,
              name: name,
              description: '',
              nodes: [],
              lines: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }

          // 检查 PNG 缩略图是否存在
          if (fs.existsSync(pngPath)) {
            thumbnail = `${name}.png`
          }

          return {
            id: relationshipData.id || name,
            name: relationshipData.name || name,
            description: relationshipData.description || '',
            thumbnail: thumbnail,
            nodes: relationshipData.nodes || [],
            lines: relationshipData.lines || [],
            createdAt: relationshipData.createdAt || new Date().toISOString(),
            updatedAt: relationshipData.updatedAt || new Date().toISOString()
          }
        })
      return relationships
    } catch (error) {
      console.error('读取关系图列表失败:', error)
      throw error
    }
  })

  // 读取关系图数据
  ipcMain.handle('read-relationship-data', async (event, { bookName, relationshipName }) => {
    try {
      const booksDir = store.get('booksDir')
      if (!booksDir) {
        throw new Error('未设置书籍目录')
      }
      const bookPath = join(booksDir, bookName)
      const relationshipsDir = join(bookPath, 'relationships')
      const jsonPath = join(relationshipsDir, `${relationshipName}.json`)

      if (!fs.existsSync(jsonPath)) {
        return null
      }

      const relationshipData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
      return relationshipData
    } catch (error) {
      console.error('读取关系图数据失败:', error)
      throw error
    }
  })

  // 创建关系图
  ipcMain.handle(
    'create-relationship',
    async (event, { bookName, relationshipName, relationshipData }) => {
      try {
        const booksDir = store.get('booksDir')
        if (!booksDir) {
          throw new Error('未设置书籍目录')
        }
        const bookPath = join(booksDir, bookName)
        const relationshipsDir = join(bookPath, 'relationships')

        if (!fs.existsSync(relationshipsDir)) {
          fs.mkdirSync(relationshipsDir, { recursive: true })
        }

        // 检查同名文件
        const jsonPath = join(relationshipsDir, `${relationshipName}.json`)

        if (fs.existsSync(jsonPath)) {
          throw new Error('已存在同名关系图')
        }

        // 只保存 JSON 数据，不创建 PNG 文件
        fs.writeFileSync(jsonPath, JSON.stringify(relationshipData, null, 2), 'utf-8')

        return { success: true }
      } catch (error) {
        console.error('创建关系图失败:', error)
        throw error
      }
    }
  )

  // 保存关系图数据
  ipcMain.handle(
    'save-relationship-data',
    async (event, { bookName, relationshipName, relationshipData }) => {
      try {
        const booksDir = store.get('booksDir')
        if (!booksDir) {
          throw new Error('未设置书籍目录')
        }
        const bookPath = join(booksDir, bookName)
        const relationshipsDir = join(bookPath, 'relationships')

        if (!fs.existsSync(relationshipsDir)) {
          fs.mkdirSync(relationshipsDir, { recursive: true })
        }

        const jsonPath = join(relationshipsDir, `${relationshipName}.json`)

        // 保存 JSON 数据
        fs.writeFileSync(jsonPath, JSON.stringify(relationshipData, null, 2), 'utf-8')

        return { success: true }
      } catch (error) {
        console.error('保存关系图数据失败:', error)
        throw error
      }
    }
  )

  // 更新关系图缩略图
  ipcMain.handle(
    'update-relationship-thumbnail',
    async (event, { bookName, relationshipName, thumbnailData }) => {
      try {
        const booksDir = store.get('booksDir')
        if (!booksDir) {
          throw new Error('未设置书籍目录')
        }
        const bookPath = join(booksDir, bookName)
        const relationshipsDir = join(bookPath, 'relationships')
        const pngPath = join(relationshipsDir, `${relationshipName}.png`)

        if (!fs.existsSync(relationshipsDir)) {
          fs.mkdirSync(relationshipsDir, { recursive: true })
        }

        // 保存 PNG 缩略图
        if (thumbnailData) {
          const base64Data = thumbnailData.replace(/^data:image\/\w+;base64,/, '')
          const buffer = Buffer.from(base64Data, 'base64')
          fs.writeFileSync(pngPath, buffer)
        }

        return { success: true }
      } catch (error) {
        console.error('更新关系图缩略图失败:', error)
        throw error
      }
    }
  )

  // 删除关系图
  ipcMain.handle('delete-relationship', async (event, { bookName, relationshipName }) => {
    try {
      const booksDir = store.get('booksDir')
      if (!booksDir) {
        throw new Error('未设置书籍目录')
      }
      const bookPath = join(booksDir, bookName)
      const relationshipsDir = join(bookPath, 'relationships')
      const jsonPath = join(relationshipsDir, `${relationshipName}.json`)
      const pngPath = join(relationshipsDir, `${relationshipName}.png`)

      // 删除 JSON 文件
      if (fs.existsSync(jsonPath)) {
        fs.unlinkSync(jsonPath)
      }

      // 删除 PNG 文件
      if (fs.existsSync(pngPath)) {
        fs.unlinkSync(pngPath)
      }

      return { success: true }
    } catch (error) {
      console.error('删除关系图失败:', error)
      throw error
    }
  })

  // 读取关系图图片
  ipcMain.handle('read-relationship-image', async (event, { bookName, imageName }) => {
    try {
      const booksDir = store.get('booksDir')
      if (!booksDir) {
        throw new Error('未设置书籍目录')
      }
      const bookPath = join(booksDir, bookName)
      const relationshipsDir = join(bookPath, 'relationships')
      const imagePath = join(relationshipsDir, imageName)

      if (!fs.existsSync(imagePath)) {
        throw new Error('图片文件不存在')
      }

      const data = fs.readFileSync(imagePath)
      return `data:image/png;base64,${data.toString('base64')}`
    } catch (error) {
      console.error('读取关系图图片失败:', error)
      throw error
    }
  })

  if (is.dev) {
    console.log('[主进程] 关系图模块处理器已注册')
  }
}
