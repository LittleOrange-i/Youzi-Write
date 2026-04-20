import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  nativeImage,
  protocol,
  globalShortcut
} from 'electron'
// 修复 DevTools 中的 Autofill 报错：'Autofill.enable' wasn't found
// 这是因为某些版本的 Electron/Chromium 在开启开发者工具时会尝试调用此接口，但该接口未被支持
app.commandLine.appendSwitch('disable-features', 'Autofill') // 禁用自动填充功能以修复调试工具报错
import { setupUpdater } from './updater.js' // 导入更新程序设置函数
import { join } from 'path'
import fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import Store from 'electron-store'

// ========== 业务模块 Handler ==========
import { registerBooksHandlers } from './handlers/books.js'
import { registerChaptersHandlers } from './handlers/chapters.js'
import { registerNotesHandlers } from './handlers/notes.js'
import { registerStatsHandlers, readStats, updateBookMetadata } from './handlers/stats.js'
import { registerWorldbuildingHandlers } from './handlers/worldbuilding.js'
import { registerMapsHandlers } from './handlers/maps.js'
import { registerRelationshipsHandlers } from './handlers/relationships.js'
import { registerOrganizationsHandlers } from './handlers/organizations.js'
import { registerAiHandlers } from './handlers/ai.js'

// macOS 图标获取函数
// 注意：nativeImage 只支持 PNG 和 JPEG 格式，不支持 .icns
// .icns 文件仅用于打包后的应用图标，由 electron-builder 自动处理
// 开发环境使用 PNG 文件来设置 Dock 图标
function getMacIcon() {
  if (process.platform !== 'darwin') {
    return null
  }

  // 只在开发环境设置 Dock 图标
  // 生产环境的图标由 electron-builder 自动处理，不需要手动设置
  if (!is.dev) {
    return null
  }

  // 开发环境：使用 PNG 文件（nativeImage 支持 PNG 和 JPEG）
  const projectRoot = process.cwd()
  // 优先使用 build/icon.png，如果没有则使用 resources/icon.png
  let iconPath = join(projectRoot, 'build/icon.png')
  if (!fs.existsSync(iconPath)) {
    iconPath = join(projectRoot, 'resources/icon.png')
  }

  // 检查文件是否存在
  if (!fs.existsSync(iconPath)) {
    console.warn('未找到图标文件，跳过设置 Dock 图标')
    return null
  }

  // 使用 nativeImage 加载图标（支持 PNG 和 JPEG）
  try {
    const image = nativeImage.createFromPath(iconPath)
    if (image.isEmpty()) {
      console.warn('图标文件为空或无法读取:', iconPath)
      return null
    }
    return image
  } catch (error) {
    console.warn('加载图标失败:', iconPath, error.message)
    return null
  }
}

// 创建 store 实例
const store = new Store({
  // 设置默认值
  defaults: {
    config: {
      theme: 'light',
      booksDir: ''
    }
  }
})

// ========== Store 基础操作 ==========

ipcMain.handle('store:get', async (_, key) => {
  return store.get(key)
})

ipcMain.handle('store:set', async (_, key, value) => {
  store.set(key, value)
  return true
})

ipcMain.handle('store:delete', async (_, key) => {
  store.delete(key)
  return true
})

// ========== 工具窗口管理 ==========

// 维护已打开书籍编辑窗口的映射
const bookEditorWindows = new Map() // 用于存储书籍编辑窗口的 Map
const toolWindows = new Map() // 用于存储独立工具窗口的 Map（地图、时间线等）

// 工具窗口标题映射
const toolTitles = {
  '/map-list': '设计地图',
  '/timeline': '时间线',
  '/dictionary': '词条字典',
  '/character-profile': '人物谱',
  '/relationship-list': '关系图',
  '/events-sequence': '事序图',
  '/organization-list': '组织架构'
}

// 打开书籍编辑器窗口的处理程序
ipcMain.handle('open-book-editor-window', async (event, { id, name }) => {
  // 若该书籍已有打开的编辑窗口，则直接聚焦
  if (bookEditorWindows.has(name)) {
    const win = bookEditorWindows.get(name)
    if (win && !win.isDestroyed()) {
      win.focus()
      return true
    }
  }

  const macIcon = getMacIcon()

  // 获取保存的窗口尺寸
  const savedBounds = store.get('window-bounds:editor') || {
    width: 1150,
    height: 800
  }

  const editorWindow = new BrowserWindow({
    title: name,
    width: savedBounds.width,
    height: savedBounds.height,
    minWidth: 1150,
    minHeight: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    ...(process.platform === 'darwin' && macIcon ? { icon: macIcon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      additionalArguments: ['isToolWindow=true']
    }
  })

  bookEditorWindows.set(name, editorWindow)

  editorWindow.on('ready-to-show', () => {
    editorWindow.show()
    windowShortcutStates.set(editorWindow.id, true) // 启用该窗口的快捷键
  })

  // 页面加载完成后强制恢复标题，防止被前端覆盖
  editorWindow.webContents.on('did-finish-load', () => {
    editorWindow.setTitle(name)
  })

  // 监听窗口最大化/还原事件
  editorWindow.on('maximize', () => {
    editorWindow.webContents.send('window:maximize')
  })
  editorWindow.on('unmaximize', () => {
    editorWindow.webContents.send('window:unmaximize')
  })

  // 监听窗口尺寸变化并保存
  editorWindow.on('resize', () => {
    const { width, height } = editorWindow.getBounds()
    store.set('window-bounds:editor', { width, height })
  })

  editorWindow.on('closed', () => {
    bookEditorWindows.delete(name)
    windowShortcutStates.delete(editorWindow.id) // 清理快捷键状态
  })

  // 阻止 Alt 键激活菜单栏（仅 Windows）
  if (process.platform === 'win32') {
    editorWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'Alt' && !input.control && !input.meta && !input.shift) {
        event.preventDefault()
      }
    })
  }

  const query = { name: encodeURIComponent(name), reset: 'true' }
  const queryString = Object.entries(query)
    .map(([k, v]) => `${k}=${v}`)
    .join('&')

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    editorWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/editor?${queryString}`)
  } else {
    editorWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: `/editor?${queryString}`
    })
  }

  return true
})

// 打开独立工具窗口的处理程序
ipcMain.handle('window:open-tool', async (event, { route, query }) => {
  const toolKey = `${route}?name=${query.name}` // 生成窗口唯一键名

  if (toolWindows.has(toolKey)) {
    const win = toolWindows.get(toolKey)
    if (win && !win.isDestroyed()) {
      win.focus()
      return true
    }
  }

  const macIcon = getMacIcon()
  const title = toolTitles[route] || '工具窗口'

  // 获取保存的窗口尺寸
  const savedBounds = store.get(`window-bounds:${route}`) || {
    width: 900,
    height: 625
  }

  const toolWindow = new BrowserWindow({
    title: `${title} - ${query.name}`,
    width: savedBounds.width,
    height: savedBounds.height,
    minWidth: 750,
    minHeight: 520,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    ...(process.platform === 'darwin' && macIcon ? { icon: macIcon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      additionalArguments: ['isToolWindow=true']
    }
  })

  toolWindows.set(toolKey, toolWindow)

  toolWindow.on('ready-to-show', () => {
    toolWindow.show()
    windowShortcutStates.set(toolWindow.id, true) // 在该窗口中启用快捷键
  })

  // 页面加载完成后，再次强制设置一次标题，防止被前端页面标题覆盖
  toolWindow.webContents.on('did-finish-load', () => {
    toolWindow.setTitle(`${title} - ${query.name}`)
  })

  // 监听窗口尺寸变化并保存
  toolWindow.on('resize', () => {
    const { width, height } = toolWindow.getBounds()
    store.set(`window-bounds:${route}`, { width, height })
  })

  toolWindow.on('closed', () => {
    toolWindows.delete(toolKey)
    windowShortcutStates.delete(toolWindow.id) // 清理该窗口的快捷键状态
  })

  // 阻止 Alt 键激活菜单栏（仅 Windows）
  if (process.platform === 'win32') {
    toolWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'Alt' && !input.control && !input.meta && !input.shift) {
        event.preventDefault()
      }
    })
  }

  const queryString = Object.entries(query)
    .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
    .join('&')

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    toolWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#${route}?${queryString}`)
  } else {
    toolWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: `${route}?${queryString}`
    })
  }

  return true
})

// ========== 快捷键管理 ==========

// 存储当前注册的快捷键
let registeredShortcuts = {}

// 存储各窗口的快捷键启用状态（true表示可以触发快捷键，false表示在其他页面不可触发）
const windowShortcutStates = new Map()

// 存储启动时被占用的快捷键信息
let occupiedShortcuts = []

// 注册快捷键
ipcMain.handle('register-shortcuts', async (event, shortcutMap) => {
  try {
    // 先注销所有已注册的快捷键
    globalShortcut.unregisterAll()
    registeredShortcuts = {}

    // 注册新的快捷键
    for (const [actionId, accelerator] of Object.entries(shortcutMap)) {
      if (accelerator && accelerator.trim()) {
        try {
          const success = globalShortcut.register(accelerator, () => {
            // 发送快捷键触发事件到渲染进程（只有启用状态的窗口才会响应）
            const focusedWindow = BrowserWindow.getFocusedWindow()
            if (focusedWindow) {
              const windowId = focusedWindow.id
              const isEnabled = windowShortcutStates.get(windowId)

              if (is.dev) {
                console.log(
                  `[主进程] 快捷键触发: ${actionId}, 窗口ID: ${windowId}, 启用状态: ${isEnabled}`
                )
              }

              // 只有当窗口的快捷键状态为启用时才发送事件
              if (isEnabled) {
                focusedWindow.webContents.send('shortcut-triggered', actionId)
              } else if (is.dev) {
                console.log(`[主进程] 窗口快捷键未启用，忽略快捷键: ${actionId}`)
              }
            }
          })

          if (success) {
            registeredShortcuts[actionId] = accelerator
          } else {
            console.warn(`快捷键注册失败: ${actionId} - ${accelerator}`)
          }
        } catch (error) {
          console.error(`注册快捷键出错: ${actionId} - ${accelerator}`, error)
        }
      }
    }

    return { success: true, registered: registeredShortcuts }
  } catch (error) {
    console.error('注册快捷键失败:', error)
    return { success: false, message: error.message }
  }
})

// 设置窗口的快捷键启用状态
ipcMain.handle('set-shortcut-enabled', async (event, enabled) => {
  try {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      windowShortcutStates.set(window.id, enabled)
      if (is.dev) {
        console.log(`[主进程] 设置窗口 ${window.id} 快捷键状态: ${enabled}`)
      }
      return { success: true }
    }
    return { success: false, message: '未找到窗口' }
  } catch (error) {
    console.error('设置快捷键状态失败:', error)
    return { success: false, message: error.message }
  }
})

// 检查快捷键是否已被占用
ipcMain.handle('check-shortcut-available', async (event, accelerator) => {
  try {
    // 检查快捷键格式是否有效
    if (!accelerator || !accelerator.trim()) {
      return { available: false, message: '快捷键不能为空' }
    }

    // 检查是否已被当前应用注册
    if (globalShortcut.isRegistered(accelerator)) {
      // 检查是否是当前应用注册的
      const isOwnShortcut = Object.values(registeredShortcuts).includes(accelerator)
      if (isOwnShortcut) {
        // 是自己应用注册的，返回可用（允许重新分配）
        return { available: true }
      } else {
        // 被系统或其他应用占用
        return { available: false, message: '快捷键已被系统或其他应用占用' }
      }
    }

    // 尝试临时注册以测试可用性
    const success = globalShortcut.register(accelerator, () => {})

    if (success) {
      // 注册成功，立即注销（只是测试）
      globalShortcut.unregister(accelerator)
      return { available: true }
    } else {
      return { available: false, message: '快捷键无法注册（可能被系统保留）' }
    }
  } catch (error) {
    return { available: false, message: `检查失败: ${error.message}` }
  }
})

// 应用退出时注销所有快捷键
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// 获取被占用的快捷键信息
ipcMain.handle('get-occupied-shortcuts', async () => {
  return occupiedShortcuts
})

// 清除被占用的快捷键信息（用户确认忽略后调用）
ipcMain.handle('clear-occupied-shortcuts', async () => {
  occupiedShortcuts = []
  return { success: true }
})

// 加载并注册保存的快捷键（应用启动时调用）
async function loadAndRegisterShortcuts() {
  try {
    // 清空之前记录的被占用快捷键
    occupiedShortcuts = []

    const savedShortcuts = store.get('shortcuts')
    if (savedShortcuts && Array.isArray(savedShortcuts)) {
      const shortcutMap = {}
      savedShortcuts.forEach((s) => {
        if (s.key && s.id) {
          shortcutMap[s.id] = s.key
        }
      })

      // 注册快捷键
      for (const [actionId, accelerator] of Object.entries(shortcutMap)) {
        if (accelerator && accelerator.trim()) {
          try {
            const success = globalShortcut.register(accelerator, () => {
              // 发送快捷键触发事件到渲染进程（只有启用状态的窗口才会响应）
              const focusedWindow = BrowserWindow.getFocusedWindow()
              if (focusedWindow) {
                const windowId = focusedWindow.id
                const isEnabled = windowShortcutStates.get(windowId)

                if (is.dev) {
                  console.log(
                    `[主进程] 快捷键触发: ${actionId}, 窗口ID: ${windowId}, 启用状态: ${isEnabled}`
                  )
                }

                // 只有当窗口的快捷键状态为启用时才发送事件
                if (isEnabled) {
                  focusedWindow.webContents.send('shortcut-triggered', actionId)
                } else if (is.dev) {
                  console.log(`[主进程] 窗口快捷键未启用，忽略快捷键: ${actionId}`)
                }
              }
            })

            if (success) {
              registeredShortcuts[actionId] = accelerator
            } else {
              // 记录注册失败的快捷键（被占用）
              console.warn(`快捷键注册失败: ${actionId} - ${accelerator}`)
              const shortcutInfo = savedShortcuts.find((s) => s.id === actionId)
              occupiedShortcuts.push({
                id: actionId,
                name: shortcutInfo?.name || actionId,
                key: accelerator,
                description: shortcutInfo?.description || ''
              })
            }
          } catch (error) {
            // 记录注册出错的快捷键
            console.error(`注册快捷键出错: ${actionId} - ${accelerator}`, error)
            const shortcutInfo = savedShortcuts.find((s) => s.id === actionId)
            occupiedShortcuts.push({
              id: actionId,
              name: shortcutInfo?.name || actionId,
              key: accelerator,
              description: shortcutInfo?.description || '',
              error: error.message
            })
          }
        }
      }
    }
  } catch (error) {
    console.error('加载快捷键设置失败:', error)
  }
}

// 退出应用程序
ipcMain.handle('quit-app', () => {
  app.quit()
})

// ========== 专注模式控制 ==========

ipcMain.handle('jail-mode:enable', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (window) {
    // 开启 Kiosk 模式（全屏且屏蔽部分系统快捷键）
    window.setKiosk(true)
    // 始终置顶，级别设为 screen-saver 以覆盖大多数窗口
    window.setAlwaysOnTop(true, 'screen-saver')
    // 阻止窗口关闭
    window.closable = false
    // 阻止窗口最小化
    window.minimizable = false
    // 阻止窗口全屏切换（防止用户按 F11 退出）
    window.fullScreenable = false
    return { success: true }
  }
  return { success: false, message: '无法获取窗口实例' }
})

ipcMain.handle('jail-mode:disable', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (window) {
    // 恢复窗口控制（必须先恢复 fullScreenable，否则 setFullScreen(false) 可能无效）
    window.closable = true
    window.minimizable = true
    window.maximizable = true
    window.resizable = true
    window.fullScreenable = true

    // 关闭 Kiosk 模式
    window.setKiosk(false)
    // 显式退出全屏
    window.setFullScreen(false)
    // 取消置顶
    window.setAlwaysOnTop(false)

    return { success: true }
  }
  return { success: false, message: '无法获取窗口实例' }
})

// ========== 窗口状态控制 ==========

// 获取窗口最大化状态
ipcMain.handle('window:is-maximized', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (window) {
    return window.isMaximized()
  }
  return false
})

// 切换全屏
ipcMain.handle('window:toggle-fullscreen', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (window) {
    const isFullScreen = window.isFullScreen()
    window.setFullScreen(!isFullScreen)
    return !isFullScreen
  }
  return false
})

// 设置全屏状态
ipcMain.handle('window:set-fullscreen', (event, flag) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (window) {
    window.setFullScreen(flag)
    return true
  }
  return false
})

// 获取全屏状态
ipcMain.handle('window:is-fullscreen', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (window) {
    return window.isFullScreen()
  }
  return false
})

// ========== 主窗口创建 ==========

function createWindow() {
  // 获取 macOS 图标
  const macIcon = getMacIcon()

  const mainWindow = new BrowserWindow({
    title: '柚子写作',
    width: 1150,
    height: 800,
    minWidth: 1150,
    minHeight: 800,
    show: false,
    autoHideMenuBar: true,
    // 设置窗口图标：Linux 使用 PNG，macOS 使用 ICNS
    ...(process.platform === 'linux' ? { icon } : {}),
    ...(process.platform === 'darwin' && macIcon ? { icon: macIcon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    // 默认启用主窗口的快捷键（主窗口是书架页面，默认启用）
    windowShortcutStates.set(mainWindow.id, true)
  })

  // 监听窗口最大化/还原事件
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximize')
  })
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:unmaximize')
  })

  // 阻止 Alt 键激活菜单栏（仅 Windows）
  if (process.platform === 'win32') {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      // 阻止单独按下 Alt 键激活菜单栏
      if (input.key === 'Alt' && !input.control && !input.meta && !input.shift) {
        event.preventDefault()
      }
    })
  }

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ========== 应用初始化 ==========

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  // 注册自定义协议用于加载本地图片
  // 使用 atom:// 协议来安全加载本地文件
  protocol.handle('atom', async (request) => {
    try {
      // 从 URL 中提取文件路径
      const url = request.url
      // 使用 decodeURI 解码（对应前端的 encodeURI）
      let filePath = decodeURI(url.replace('atom://', ''))

      // 将正斜杠转回 Windows 反斜杠（如果在 Windows 系统上）
      if (process.platform === 'win32') {
        // 处理 Windows 盘符格式 (C:/path -> C:\path)
        filePath = filePath.replace(/^([a-zA-Z]):\//, '$1:\\').replace(/\//g, '\\')
      }

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        console.error('文件不存在:', filePath)
        return new Response('File not found', { status: 404 })
      }

      // 读取文件并返回
      const data = fs.readFileSync(filePath)

      // 根据文件扩展名设置正确的 MIME 类型
      let mimeType = 'image/jpeg'
      if (filePath.endsWith('.png')) mimeType = 'image/png'
      else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) mimeType = 'image/jpeg'
      else if (filePath.endsWith('.gif')) mimeType = 'image/gif'
      else if (filePath.endsWith('.webp')) mimeType = 'image/webp'
      else if (filePath.endsWith('.bmp')) mimeType = 'image/bmp'

      return new Response(data, {
        headers: { 'Content-Type': mimeType }
      })
    } catch (error) {
      console.error('加载本地图片失败:', error)
      return new Response('Error loading file', { status: 500 })
    }
  })

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // 在 macOS 上设置 Dock 图标（开发环境）
  const macIcon = getMacIcon()
  if (process.platform === 'darwin' && macIcon) {
    try {
      app.dock.setIcon(macIcon)
    } catch (error) {
      console.warn('设置 Dock 图标失败:', error.message)
    }
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // 设置自动更新
  setupUpdater()

  if (is.dev) {
    console.log('当前版本:', app.getVersion())
  }

  // 注册所有业务模块的 IPC 处理器
  registerBooksHandlers(store)
  registerStatsHandlers(store)
  registerChaptersHandlers(store, readStats)
  registerNotesHandlers(store, updateBookMetadata)
  registerWorldbuildingHandlers(store)
  registerMapsHandlers(store)
  registerRelationshipsHandlers(store)
  registerOrganizationsHandlers(store)
  registerAiHandlers()

  createWindow()

  // 加载并注册保存的快捷键
  loadAndRegisterShortcuts()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 导出 bookEditorWindows 供其他模块使用（如需要）
export { bookEditorWindows }
