<template>
  <div 
    class="book-card group relative cursor-pointer"
    @click="emit('onOpen')" 
    @contextmenu.prevent="showMenu($event)"
  >
    <!-- 四周环绕线性光晕效果 -->
    <div class="absolute -inset-[2px] bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-2xl opacity-0 group-hover:opacity-60 blur-sm transition-all duration-500 animate-pulse-glow"></div>
    
    <!-- 书籍主体 - 9:16 比例 -->
    <div class="book-body relative rounded-xl shadow-xl overflow-hidden">
      <!-- 背景图片或默认渐变背景 -->
      <div 
        class="absolute inset-0 bg-cover bg-center bg-no-repeat"
        :style="coverStyle"
      >
        <!-- 半透明遮罩 -->
        <div class="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/40"></div>
      </div>
      
      <!-- 渐变光效 -->
      <div class="absolute inset-0 bg-gradient-to-br bg-gradient-to-r  from-blue-900/20 via-white/0 to-purple-900/30 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <!-- 主要内容区 - 左右分栏布局 -->
      <div class="relative h-full flex">
        <!-- 左侧信息栏 (约75%宽度) - 不使用整体磨砂 -->
        <div class="w-[75%] flex flex-col justify-between p-3">
          <!-- 顶部：类型标签和备份标识 -->
          <div class="flex items-start justify-start gap-1.5">
            <div class="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-500/90 to-orange-500/90 rounded-md shadow-lg">
              <svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
              </svg>
              <span class="text-xs font-bold text-white whitespace-nowrap">{{ typeName }}</span>
            </div>
          </div>

          <!-- 底部信息区 - 添加磨砂效果 -->
          <div class="flex flex-col gap-2 -ml-1  p-0.5 rounded-lg bg-black/30 backdrop-blur-sm border border-white/20">
            <!-- 作者信息 -->
            <div class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5 flex-shrink-0 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
              </svg>
              <span class="text-xs font-semibold text-white break-all drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{{ author || '佚名' }}</span>
            </div>

            <!-- 字数统计 -->
            <div class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5 flex-shrink-0 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
              </svg>
              <span class="text-sm font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{{ formatWords(totalWords) }}</span>
            </div>
            
            <!-- 更新时间 - 显示到秒 -->
            <div class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5 flex-shrink-0 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
              </svg>
              <span class="text-[11px] font-semibold text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{{ fullDateTime }}</span>
            </div>
          </div>
        </div>

        <!-- 右侧书名栏 (约25%宽度) - 纵向显示，紧贴右边，顶部对齐 -->
        <div class="flex-1 flex items-start justify-end pr-4 pt-1 pb-6">
          <!-- 第二列（右侧）- 显示第9-15个字符 -->
          <div v-if="name && name.length > 8" class="vertical-title-container">
            <h3 
              class="vertical-title text-white font-black tracking-widest"
              :style="{ fontSize: getVerticalTitleSize() + 'px', writingMode: 'vertical-rl', textOrientation: 'upright' }"
            >
              <span style="visibility: hidden;">空</span>{{ name.slice(8) }}
            </h3>
          </div>
          <!-- 第一列（右侧）- 显示前8个字符 -->
          <div class="vertical-title-container">
            <h3 
              class="vertical-title text-white font-black tracking-widest"
              :style="{ fontSize: getVerticalTitleSize() + 'px', writingMode: 'vertical-rl', textOrientation: 'upright' }"
            >
              {{ name ? name.slice(0, 8) : '' }}
            </h3>
          </div>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div
        v-if="menuVisible"
        :key="id"
        class="fixed z-[9999] min-w-[140px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl py-2"
        :style="{ left: menuX + 'px', top: menuY + 'px' }"
        @click.stop
      >
        <div 
          class="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors text-gray-700 dark:text-gray-300"
          @click="handleEdit"
        >
          <el-icon class="text-base"><Edit /></el-icon>
          <span class="text-sm font-medium">编辑</span>
        </div>
        <div 
          class="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors text-red-600 dark:text-red-400"
          @click="handleDelete"
        >
          <el-icon class="text-base"><Delete /></el-icon>
          <span class="text-sm font-medium">删除</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
// 全局菜单管理器 - 模块级单例，所有组件实例共享
let currentCloseHandler = null

export const globalMenuManager = {
  setCloseHandler(handler) {
    console.log('设置新的菜单处理器', handler?.name || 'anonymous')
    // 关闭上一个菜单
    if (currentCloseHandler && currentCloseHandler !== handler) {
      console.log('关闭上一个菜单')
      currentCloseHandler()
    }
    currentCloseHandler = handler
  },
  clearCloseHandler(handler) {
    console.log('清除菜单处理器', handler?.name || 'anonymous')
    // 只清除匹配的处理器
    if (currentCloseHandler === handler) {
      currentCloseHandler = null
    }
  }
}
</script>

<script setup>
import { ref, computed, onBeforeUnmount, nextTick } from 'vue'
import { Edit, Delete } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const emit = defineEmits(['onOpen', 'onEdit', 'onDelete'])
const props = defineProps({
  id: String,
  name: String,
  type: String,
  typeName: String,
  author: {
    type: String,
    default: '佚名'
  },
  totalWords: {
    type: [String, Number],
    default: '0'
  },
  updatedAt: {
    type: String,
    default: '暂无更新'
  },
  coverUrl: String
})

// 右键菜单状态
const menuVisible = ref(false)
const menuX = ref(0)
const menuY = ref(0)

// 计算封面样式：支持自定义封面URL或默认渐变背景
const coverStyle = computed(() => {
  if (props.coverUrl) {
    // 如果有封面URL
    let imageUrl = props.coverUrl
    
    // 如果包含 URL 编码的 data: 标记，先解码
    // 检测是否是被编码的 data:image 格式（data%3Aimage）
    if (imageUrl.includes('data%3Aimage') || imageUrl.includes('data%3aimage')) {
      try {
        imageUrl = decodeURIComponent(imageUrl)
      } catch (e) {
        console.warn('URL解码失败:', e)
      }
    }
    
    // 优先检查：如果已经是 base64 数据URL，直接使用（避免被误认为本地路径）
    if (imageUrl.startsWith('data:image/')) {
      return {
        backgroundImage: `url("${imageUrl}")`
      }
    }
    // 如果是网络路径，直接使用
    else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return {
        backgroundImage: `url("${imageUrl}")`
      }
    } 
    else {
      // 本地路径使用 atom:// 协议（Electron 安全协议）
      // 支持多种图片格式：jpg, jpeg, png, gif, bmp, webp
      const path = require('path')
      const ext = path.extname(imageUrl).toLowerCase()
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.webp': 'image/webp'
      }
      
      // 验证图片格式
      if (mimeTypes[ext]) {
        // 将 Windows 反斜杠转换为正斜杠，并对特殊字符进行编码
        // 但保留路径分隔符和盘符冒号
        const normalizedPath = imageUrl.replace(/\\/g, '/')
        // 使用 encodeURI 而不是 encodeURIComponent，保留路径结构
        const encodedPath = encodeURI(normalizedPath)
        return {
          backgroundImage: `url("atom://${encodedPath}")`
        }
      } else {
        console.warn('不支持的图片格式:', ext)
        return {
          background: 'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 50%, #fbc2eb 100%)'
        }
      }
    }
  } else {
    // 默认渐变背景 - 温暖优雅的创作色调
    return {
      background: 'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 50%, #fbc2eb 100%)'
    }
  }
})

// 格式化更新时间 - 简短版
const shortDate = computed(() => {
  if (!props.updatedAt || props.updatedAt === '暂无更新') {
    return '暂无'
  }
  const date = dayjs(props.updatedAt)
  return date.isValid() ? date.format('MM/DD') : '暂无'
})

// 格式化更新时间 - 完整版（到秒）
const fullDateTime = computed(() => {
  if (!props.updatedAt || props.updatedAt === '暂无更新') {
    return '暂无更新'
  }
  const date = dayjs(props.updatedAt)
  return date.isValid() ? date.format('MM/DD HH:mm:ss') : '暂无更新'
})

// 格式化字数显示 - "万"字紧跟在数字后面
function formatWords(words) {
  const num = Number(words) || 0
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万字'
  }
  return num.toString() + '字'
}

// 根据书名长度动态计算纵向字号
function getVerticalTitleSize() {
  const nameLength = props.name ? props.name.length : 0
  if (nameLength <= 4) {
    return 32
  } else if (nameLength <= 6) {
    return 28
  } else if (nameLength <= 8) {
    return 24
  } else if (nameLength <= 10) {
    return 20
  } else {
    return 18
  }
}

// 显示右键菜单
function showMenu(e) {
  e.stopPropagation() // 阻止事件传播
  
  // 通知全局管理器关闭其他菜单
  globalMenuManager.setCloseHandler(hideMenu)
  
  // 先移除旧的监听器（如果存在）
  document.removeEventListener('click', hideMenu)
  document.removeEventListener('contextmenu', hideMenu)
  
  // 更新菜单位置和显示状态
  menuX.value = e.clientX
  menuY.value = e.clientY
  menuVisible.value = true
  
  // 使用 nextTick 延迟添加全局监听器
  nextTick(() => {
    document.addEventListener('click', hideMenu)
    document.addEventListener('contextmenu', hideMenu)
  })
}

// 隐藏右键菜单
function hideMenu() {
  menuVisible.value = false
  document.removeEventListener('click', hideMenu)
  document.removeEventListener('contextmenu', hideMenu)
  
  // 从全局管理器中清除
  globalMenuManager.clearCloseHandler(hideMenu)
}

// 处理编辑操作
function handleEdit() {
  emit('onEdit')
  hideMenu()
}

// 处理删除操作
function handleDelete() {
  emit('onDelete')
  hideMenu()
}

// 组件卸载时清理（防止内存泄漏）
onBeforeUnmount(() => {
  hideMenu()
  globalMenuManager.clearCloseHandler(hideMenu)
})
</script>



<style lang="scss" scoped>
/* 书籍卡片容器 - 9:16 比例 */
.book-card {
  width: 100%;
  max-width: 180px; /* 限制最大宽度 */
  aspect-ratio: 1 / 1.45; /* 修改为 1:1.45 比例 */
  position: relative;
  
  /* 轻微跳动动画 */
  animation: gentle-bounce 3s ease-in-out infinite;
  
  &:hover {
    animation: hover-bounce 0.6s ease-in-out;
    
    .book-body {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 
                  0 0 60px rgba(99, 102, 241, 0.3);
    }
  }
}

/* 书籍主体 */
.book-body {
  height: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 轻微的跳动动画 */
@keyframes gentle-bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

/* 悬停时的弹跳 */
@keyframes hover-bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

/* 光晕脉动动画 */
@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.6;
  }
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

/* 纵向书名样式 */
.vertical-title-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.vertical-title {
  font-family: 'KaiTi', 'STKaiti', '楷体', 'KaiTi_GB2312', serif;
  text-shadow: 
    0 2px 10px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(251, 191, 36, 0.3),
    2px 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.15em;
  line-height: 1.2;
}

/* 底部信息区文本使用楷体 */
.book-body {
  span {
    font-family: 'KaiTi', 'STKaiti', '楷体', 'KaiTi_GB2312', serif;
  }
}
</style>


