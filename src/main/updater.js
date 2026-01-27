import { app, shell, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import https from 'https'
import { is } from '@electron-toolkit/utils'

// GitHub 仓库信息
const GITHUB_USER = 'LittleOrange-i'
const GITHUB_REPO = 'Youzi-Write'
const RELEASES_API = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/releases/latest`

// 缓存下载路径
const UPDATE_DIR = path.join(app.getPath('userData'), 'updates')

if (!fs.existsSync(UPDATE_DIR)) {
  fs.mkdirSync(UPDATE_DIR, { recursive: true })
}

// 比较版本号
function compareVersions(v1, v2) {
  const normalize = (v) => v.replace(/^v/, '').split('.').map(Number)
  const parts1 = normalize(v1)
  const parts2 = normalize(v2)
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0
    const p2 = parts2[i] || 0
    if (p1 > p2) return 1
    if (p1 < p2) return -1
  }
  return 0
}

let downloadRequest = null

// 清理更新目录中的旧安装包文件
function cleanupUpdates() {
  // 检查更新目录是否存在
  if (fs.existsSync(UPDATE_DIR)) {
    try {
      // 读取目录下的所有文件和文件夹
      const files = fs.readdirSync(UPDATE_DIR)
      // 遍历所有找到的文件
      for (const file of files) {
        // 构建完整的文件路径
        const curPath = path.join(UPDATE_DIR, file)
        // 获取文件状态信息
        const stats = fs.statSync(curPath)
        // 如果是文件（不是子目录）
        if (stats.isFile()) {
          // 删除该文件
          fs.unlinkSync(curPath)
          // 记录删除成功的日志
          console.log(`[Updater] 已清理旧安装包: ${file}`)
        }
      }
    } catch (err) {
      // 捕获并记录清理过程中的错误
      console.error(`[Updater] 清理更新目录失败: ${err}`)
    }
  }
}

// 导出设置更新程序的函数
export function setupUpdater() {
  // 启动时清理更新目录，删除旧的安装包
  cleanupUpdates()

  // 注册获取应用程序版本号的 IPC 处理函数
  ipcMain.handle('get-app-version', () => {
    // 调用 Electron 的 app.getVersion() 并返回结果
    return app.getVersion()
  })

  // 注册检查更新的 IPC 处理函数
  ipcMain.handle('check-for-updates', async () => {
    // 开始尝试检查更新
    try {
      // 在控制台输出检查更新的开始日志
      console.log('[Updater] Checking for updates...')
      // 发起对 GitHub API 的网络请求以获取最新版本信息
      const response = await fetch(RELEASES_API, {
        // 设置请求头，包含 User-Agent 以符合 GitHub API 要求
        headers: {
          'User-Agent': 'Youzi-Write-App'
        }
      })
      
      // 如果响应状态不正常，则抛出错误
      if (!response.ok) {
        // 抛出包含状态文本的错误
        throw new Error(`GitHub API Error: ${response.statusText}`)
      }
      
      // 解析返回的 JSON 数据
      const data = await response.json()
      // 获取最新版本的标签名
      const latestVersion = data.tag_name
      // 获取当前运行的应用版本
      const currentVersion = app.getVersion()
      
      // 在控制台打印版本对比信息
      console.log(`[Updater] 当前版本: ${currentVersion}, API最新版本: ${latestVersion}`)
      
      // 比较最新版本和当前版本，如果最新版本更高
      if (compareVersions(latestVersion, currentVersion) > 0) {
        // 定义用于存储匹配资产的变量
        let asset = null
        // 根据不同操作系统平台精细化查找对应的安装包文件
        if (process.platform === 'win32') {
          // Windows 平台：优先寻找包含 "setup" 且以 ".exe" 结尾的安装包
          asset = data.assets.find(a => a.name.toLowerCase().includes('setup') && a.name.endsWith('.exe'))
          // 如果没找到带有 setup 的，再退而求其次找任何 .exe 文件
          if (!asset) {
            asset = data.assets.find(a => a.name.endsWith('.exe'))
          }
        } else if (process.platform === 'darwin') {
          // macOS 平台：查找以 ".dmg" 结尾的磁盘映像文件
          asset = data.assets.find(a => a.name.endsWith('.dmg'))
        } else if (process.platform === 'linux') {
          // Linux 平台：优先寻找 ".AppImage" 文件（通常是通用且可直接运行的格式）
          asset = data.assets.find(a => a.name.endsWith('.AppImage'))
          // 如果没有 AppImage，则寻找 ".deb" 安装包（适用于 Debian/Ubuntu 系列）
          if (!asset) {
            asset = data.assets.find(a => a.name.endsWith('.deb'))
          }
        }
        
        // 如果找到了对应平台的资产，记录匹配到的文件名日志
        if (asset) {
          console.log(`[Updater] 匹配到适用于 ${process.platform} 的安装包: ${asset.name}`)
        } else {
          // 如果没找到，记录警告日志
          console.warn(`[Updater] 未能为当前平台 ${process.platform} 匹配到合适的安装包`)
        }

        // 返回包含更新信息的对象
        return {
          // 标记有更新可用
          updateAvailable: true,
          // 返回最新版本号
          version: latestVersion,
          // 返回发布说明内容
          releaseNotes: data.body,
          // 返回下载链接（如果找到了对应平台的资产）
          downloadUrl: asset ? asset.browser_download_url : null,
          // 返回文件名
          fileName: asset ? asset.name : null
        }
      }
      
      // 如果没有新版本，返回标记为无更新的对象
      return { updateAvailable: false }
    } catch (error) {
      // 捕获异常并在控制台输出错误日志
      console.error('[Updater] Check failed:', error)
      // 返回包含错误信息的对象
      return { error: error.message }
    }
  })

  // 注册开始下载更新的 IPC 监听器
  ipcMain.on('start-download-update', (event, downloadUrl, fileName) => {
    // 检查下载链接和文件名是否有效
    if (!downloadUrl || !fileName) {
      // 如果无效，向渲染进程发送更新错误消息
      event.sender.send('update-error', '无效的下载链接')
      // 结束当前处理
      return
    }
    
    // 构建完整的文件保存路径
    const filePath = path.join(UPDATE_DIR, fileName)
    // 创建文件写入流
    const file = fs.createWriteStream(filePath)
    
    // 在控制台输出下载路径日志
    console.log(`[Updater] Downloading to ${filePath}`)
    
    // 发起 HTTPS GET 请求下载文件
    downloadRequest = https.get(downloadUrl, {
      // 设置请求头
      headers: {
        'User-Agent': 'Youzi-Write-App'
      }
    }, (response) => {
      // 检查是否为重定向响应（301 或 302）
      if (response.statusCode === 302 || response.statusCode === 301) {
        // 如果是重定向，则对重定向后的位置发起新的下载请求
        downloadRequest = https.get(response.headers.location, (redirectResponse) => {
           // 处理重定向后的响应数据
           handleResponse(redirectResponse, file, event, filePath)
        }).on('error', (err) => {
          // 处理重定向下载过程中的错误
          handleError(err, event, file)
        })
        // 结束当前重定向处理逻辑
        return
      }
      // 处理正常的下载响应数据
      handleResponse(response, file, event, filePath)
    }).on('error', (err) => {
      // 处理下载请求发起阶段的错误
      handleError(err, event, file)
    })
  })

  // 处理安装更新的 IPC 调用请求
  ipcMain.handle('install-update', async (event, filePath) => {
    // 在控制台输出开始安装的日志，记录目标文件路径
    console.log(`[Updater] 准备安装更新，文件路径: ${filePath}`)
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      // 如果文件不存在，输出错误日志并退出处理
      console.error(`[Updater] 安装失败：文件不存在于路径 ${filePath}`)
      // 返回错误信息给渲染进程（如果有需要）
      return
    }

    // 获取文件详细信息
    try {
      // 获取文件的状态信息
      const stats = fs.statSync(filePath)
      // 输出文件大小日志，单位转换为 MB
      console.log(`[Updater] 检查安装文件：大小为 ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
    } catch (statErr) {
      // 记录获取文件信息失败的日志
      console.error(`[Updater] 无法读取文件信息: ${statErr}`)
    }
    
    // 使用 try-catch 块捕获可能发生的启动异常
    try {
      // 针对 Windows 平台使用更可靠的启动方式
      if (process.platform === 'win32') {
        // 在 Windows 上，使用 spawn 配合 shell: true 启动 .exe 文件通常更稳定
        // 不再使用静默参数 /S，以便用户能看到安装界面
        console.log(`[Updater] 正在 Windows 环境下启动安装程序...`)
        // 启动子进程，设置 detached 为 true 允许其独立运行，shell 为 true 使用系统外壳启动
        const subprocess = spawn(`"${filePath}"`, [], {
          // 允许子进程在主进程退出后继续运行
          detached: true,
          // 使用系统外壳执行，这样能正确处理路径中的空格
          shell: true,
          // 忽略标准输入输出
          stdio: 'ignore'
        })
        
        // 解除子进程与主进程的引用关联
        subprocess.unref()
        // 记录子进程启动成功的日志
        console.log(`[Updater] 安装程序子进程已创建，准备退出主应用`)
      } else {
        // 对于 macOS 和 Linux，继续使用 shell.openPath
        console.log(`[Updater] 正在使用 shell.openPath 启动安装程序...`)
        // 异步打开安装包文件
        const error = await shell.openPath(filePath)
        // 检查启动是否返回错误
        if (error) {
          // 如果返回了错误信息，则在控制台打印日志
          console.error(`[Updater] shell.openPath 启动失败: ${error}`)
          // 不退出应用程序
          return
        }
      }
      
      // 在启动安装程序后，给安装程序一点启动时间，然后再退出应用
      console.log(`[Updater] 应用将在 1 秒后退出以完成更新...`)
      // 设置 1000 毫秒的延迟，确保安装进程已经成功接管
      setTimeout(() => {
        // 记录即将退出的日志
        console.log(`[Updater] 应用正在退出...`)
        // 退出当前正在运行的应用程序
        app.quit()
      }, 1000)
    } catch (err) {
      // 捕获并处理执行过程中的意外错误
      console.error(`[Updater] 安装逻辑执行过程中出现异常: ${err}`)
    }
  })
}

// 处理下载响应数据的函数
function handleResponse(response, file, event, filePath) {
  // 如果响应状态码不是 200，表示下载失败
  if (response.statusCode !== 200) {
    // 向渲染进程发送下载失败的消息，包含状态码
    event.sender.send('update-error', `Download failed: HTTP ${response.statusCode}`)
    // 关闭文件写入流
    file.close()
    // 异步删除可能已经创建但不完整的文件
    fs.unlink(filePath, () => {}) 
    // 结束处理
    return
  }

  // 从响应头中获取文件的总字节数
  const totalBytes = parseInt(response.headers['content-length'], 10)
  // 初始化已接收的字节数计数器
  let receivedBytes = 0

  // 监听响应的 data 事件，处理接收到的数据块
  response.on('data', (chunk) => {
    // 将数据块写入文件流
    file.write(chunk)
    // 累加已接收的字节数
    receivedBytes += chunk.length
    
    // 如果总字节数存在
    if (totalBytes) {
      // 计算当前的下载进度百分比
      const percent = (receivedBytes / totalBytes) * 100
      // 将进度百分比发送给渲染进程
      event.sender.send('download-progress', percent)
    }
  })

  // 监听响应的 end 事件，表示数据接收完成
  response.on('end', () => {
    // 结束文件写入流
    file.end()
    // 在控制台输出下载完成的日志
    console.log('[Updater] Download complete')
    // 向渲染进程发送下载完成的消息，并附带文件路径
    event.sender.send('update-downloaded', filePath)
  })
}

// 处理下载过程中错误的函数
function handleError(err, event, file) {
  // 在控制台输出下载错误的日志
  console.error('[Updater] Download error:', err)
  // 关闭文件写入流以释放资源
  file.close()
  // 向渲染进程发送具体的错误消息
  event.sender.send('update-error', err.message)
}
