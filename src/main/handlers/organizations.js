import { ipcMain } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { is } from '@electron-toolkit/utils'

/**
 * 注册组织架构相关 IPC 处理器
 * @param {import('electron-store').default} store - electron-store 实例
 */
export function registerOrganizationsHandlers(store) {
  // 读取组织架构列表
  ipcMain.handle('read-organizations', async (event, { bookName }) => {
    try {
      const booksDir = store.get('booksDir')
      if (!booksDir) {
        throw new Error('未设置书籍目录')
      }
      const bookPath = join(booksDir, bookName)
      const organizationsDir = join(bookPath, 'organizations')
      if (!fs.existsSync(organizationsDir)) {
        fs.mkdirSync(organizationsDir, { recursive: true })
        return { success: true, data: [] }
      }
      const files = fs.readdirSync(organizationsDir)
      const organizations = files
        .filter((file) => file.endsWith('.json'))
        .map((file) => {
          const name = file.replace('.json', '')
          const jsonPath = join(organizationsDir, `${name}.json`)
          const pngPath = join(organizationsDir, `${name}.png`)

          let organizationData = {}
          let thumbnail = ''

          try {
            // 读取 JSON 数据
            organizationData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
          } catch (error) {
            console.error(`读取组织架构数据失败: ${name}`, error)
            organizationData = {
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
            id: organizationData.id || name,
            name: organizationData.name || name,
            description: organizationData.description || '',
            thumbnail: thumbnail,
            nodes: organizationData.nodes || [],
            lines: organizationData.lines || [],
            createdAt: organizationData.createdAt || new Date().toISOString(),
            updatedAt: organizationData.updatedAt || new Date().toISOString()
          }
        })
      return { success: true, data: organizations }
    } catch (error) {
      console.error('读取组织架构列表失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 读取组织架构数据
  ipcMain.handle('read-organization', async (event, { bookName, organizationName }) => {
    try {
      const booksDir = store.get('booksDir')
      if (!booksDir) {
        throw new Error('未设置书籍目录')
      }
      const bookPath = join(booksDir, bookName)
      const organizationsDir = join(bookPath, 'organizations')
      const jsonPath = join(organizationsDir, `${organizationName}.json`)

      if (!fs.existsSync(jsonPath)) {
        return { success: false, error: '组织架构不存在' }
      }

      const organizationData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
      return { success: true, data: organizationData }
    } catch (error) {
      console.error('读取组织架构数据失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 创建组织架构
  ipcMain.handle(
    'create-organization',
    async (event, { bookName, organizationName, organizationData }) => {
      try {
        const booksDir = store.get('booksDir')
        if (!booksDir) {
          throw new Error('未设置书籍目录')
        }
        const bookPath = join(booksDir, bookName)
        const organizationsDir = join(bookPath, 'organizations')

        if (!fs.existsSync(organizationsDir)) {
          fs.mkdirSync(organizationsDir, { recursive: true })
        }

        // 检查同名文件
        const jsonPath = join(organizationsDir, `${organizationName}.json`)

        if (fs.existsSync(jsonPath)) {
          throw new Error('已存在同名组织架构')
        }

        // 保存 JSON 数据
        fs.writeFileSync(jsonPath, JSON.stringify(organizationData, null, 2), 'utf-8')

        return { success: true }
      } catch (error) {
        console.error('创建组织架构失败:', error)
        throw error
      }
    }
  )

  // 保存组织架构数据
  ipcMain.handle(
    'write-organization',
    async (event, { bookName, organizationName, organizationData }) => {
      try {
        const booksDir = store.get('booksDir')
        if (!booksDir) {
          throw new Error('未设置书籍目录')
        }
        const bookPath = join(booksDir, bookName)
        const organizationsDir = join(bookPath, 'organizations')

        if (!fs.existsSync(organizationsDir)) {
          fs.mkdirSync(organizationsDir, { recursive: true })
        }

        const jsonPath = join(organizationsDir, `${organizationName}.json`)

        // 保存 JSON 数据
        fs.writeFileSync(jsonPath, JSON.stringify(organizationData, null, 2), 'utf-8')

        return { success: true }
      } catch (error) {
        console.error('保存组织架构数据失败:', error)
        throw error
      }
    }
  )

  // 更新组织架构缩略图
  ipcMain.handle(
    'update-organization-thumbnail',
    async (event, { bookName, organizationId, thumbnailData }) => {
      try {
        const booksDir = store.get('booksDir')
        if (!booksDir) {
          throw new Error('未设置书籍目录')
        }
        const bookPath = join(booksDir, bookName)
        const organizationsDir = join(bookPath, 'organizations')
        const pngPath = join(organizationsDir, `${organizationId}.png`)

        if (!fs.existsSync(organizationsDir)) {
          fs.mkdirSync(organizationsDir, { recursive: true })
        }

        // 保存 PNG 缩略图
        if (thumbnailData) {
          const base64Data = thumbnailData.replace(/^data:image\/\w+;base64,/, '')
          const buffer = Buffer.from(base64Data, 'base64')
          fs.writeFileSync(pngPath, buffer)
        }

        return { success: true }
      } catch (error) {
        console.error('更新组织架构缩略图失败:', error)
        throw error
      }
    }
  )

  // 读取组织架构图片
  ipcMain.handle('read-organization-image', async (event, { bookName, imageName }) => {
    try {
      const booksDir = store.get('booksDir')
      if (!booksDir) {
        throw new Error('未设置书籍目录')
      }
      const bookPath = join(booksDir, bookName)
      const organizationsDir = join(bookPath, 'organizations')
      const imagePath = join(organizationsDir, imageName)

      if (!fs.existsSync(imagePath)) {
        throw new Error('图片文件不存在')
      }

      const data = fs.readFileSync(imagePath)
      return `data:image/png;base64,${data.toString('base64')}`
    } catch (error) {
      console.error('读取组织架构图片失败:', error)
      throw error
    }
  })

  // 删除组织架构
  ipcMain.handle('delete-organization', async (event, { bookName, organizationName }) => {
    try {
      const booksDir = store.get('booksDir')
      if (!booksDir) {
        throw new Error('未设置书籍目录')
      }
      const bookPath = join(booksDir, bookName)
      const organizationsDir = join(bookPath, 'organizations')
      const jsonPath = join(organizationsDir, `${organizationName}.json`)
      const pngPath = join(organizationsDir, `${organizationName}.png`)

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
      console.error('删除组织架构失败:', error)
      throw error
    }
  })

  if (is.dev) {
    console.log('[主进程] 组织架构模块处理器已注册')
  }
}
