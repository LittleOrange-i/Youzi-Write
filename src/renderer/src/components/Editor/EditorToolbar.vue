<template>
  <div class="editor-toolbar"> <!-- 工具栏主容器 -->
    <div class="toolbar-buttons"> <!-- 按钮组容器 -->
      <el-button class="tool-btn" @click="handleRandomName" :title="`随机起名 (${getShortcutLabel('random-name')})`"> <!-- 随机起名按钮 -->
        <div class="btn-inner"> <!-- 按钮内部包装层 -->
          <div class="btn-main"> <!-- 按钮主体部分（图标+文字） -->
            <SvgIcon name="naming" :size="16" /> <!-- 随机起名图标 -->
            <span>随机起名</span> <!-- 按钮文本 -->
          </div> <!-- 主体结束 -->
          <div class="shortcut-hint">{{ getShortcutLabel('random-name') }}</div> <!-- 快捷键提示文本 -->
        </div> <!-- 包装层结束 -->
      </el-button> <!-- 按钮结束 -->
      <RandomName ref="randomNameRef" /> <!-- 随机起名功能组件 -->
      <el-button class="tool-btn" @click="handleWorldMap" :title="`设计地图 (${getShortcutLabel('world-map')})`"> <!-- 设计地图按钮 -->
        <div class="btn-inner"> <!-- 按钮内部包装层 -->
          <div class="btn-main"> <!-- 按钮主体部分 -->
            <SvgIcon name="map" :size="16" /> <!-- 设计地图图标 -->
            <span>设计地图</span> <!-- 按钮文本 -->
          </div> <!-- 主体结束 -->
          <div class="shortcut-hint">{{ getShortcutLabel('world-map') }}</div> <!-- 快捷键提示文本 -->
        </div> <!-- 包装层结束 -->
      </el-button> <!-- 按钮结束 -->
      <el-button class="tool-btn" @click="handleTimeline" :title="`时间线 (${getShortcutLabel('timeline')})`"> <!-- 时间线按钮 -->
        <div class="btn-inner"> <!-- 按钮内部包装层 -->
          <div class="btn-main"> <!-- 按钮主体部分 -->
            <SvgIcon name="timeline" :size="16" /> <!-- 时间线图标 -->
            <span>时间线</span> <!-- 按钮文本 -->
          </div> <!-- 主体结束 -->
          <div class="shortcut-hint">{{ getShortcutLabel('timeline') }}</div> <!-- 快捷键提示文本 -->
        </div> <!-- 包装层结束 -->
      </el-button> <!-- 按钮结束 -->
      <el-button class="tool-btn" @click="handleEntryDictionary" :title="`词条字典 (${getShortcutLabel('dictionary')})`"> <!-- 词条字典按钮 -->
        <div class="btn-inner"> <!-- 按钮内部包装层 -->
          <div class="btn-main"> <!-- 按钮主体部分 -->
            <SvgIcon name="dictionary" :size="16" /> <!-- 词条字典图标 -->
            <span>词条字典</span> <!-- 按钮文本 -->
          </div> <!-- 主体结束 -->
          <div class="shortcut-hint">{{ getShortcutLabel('dictionary') }}</div> <!-- 快捷键提示文本 -->
        </div> <!-- 包装层结束 -->
      </el-button> <!-- 按钮结束 -->
      <el-button class="tool-btn" @click="handleCharacterProfile" :title="`人物谱 (${getShortcutLabel('character-profile')})`"> <!-- 人物谱按钮 -->
        <div class="btn-inner"> <!-- 按钮内部包装层 -->
          <div class="btn-main"> <!-- 按钮主体部分 -->
            <SvgIcon name="character" :size="16" /> <!-- 人物谱图标 -->
            <span>人物谱</span> <!-- 按钮文本 -->
          </div> <!-- 主体结束 -->
          <div class="shortcut-hint">{{ getShortcutLabel('character-profile') }}</div> <!-- 快捷键提示文本 -->
        </div> <!-- 包装层结束 -->
      </el-button> <!-- 按钮结束 -->
      <el-button class="tool-btn" @click="handleRelationshipMap" :title="`关系图 (${getShortcutLabel('relationship-map')})`"> <!-- 关系图按钮 -->
        <div class="btn-inner"> <!-- 按钮内部包装层 -->
          <div class="btn-main"> <!-- 按钮主体部分 -->
            <SvgIcon name="relationship" :size="16" /> <!-- 关系图图标 -->
            <span>关系图</span> <!-- 按钮文本 -->
          </div> <!-- 主体结束 -->
          <div class="shortcut-hint">{{ getShortcutLabel('relationship-map') }}</div> <!-- 快捷键提示文本 -->
        </div> <!-- 包装层结束 -->
      </el-button> <!-- 按钮结束 -->
      <el-button class="tool-btn" @click="handleEventsSequence" :title="`事序图 (${getShortcutLabel('events-sequence')})`"> <!-- 事序图按钮 -->
        <div class="btn-inner"> <!-- 按钮内部包装层 -->
          <div class="btn-main"> <!-- 按钮主体部分 -->
            <SvgIcon name="gantt" :size="16" /> <!-- 事序图图标 -->
            <span>事序图</span> <!-- 按钮文本 -->
          </div> <!-- 主体结束 -->
          <div class="shortcut-hint">{{ getShortcutLabel('events-sequence') }}</div> <!-- 快捷键提示文本 -->
        </div> <!-- 包装层结束 -->
      </el-button> <!-- 按钮结束 -->
      <el-button class="tool-btn" @click="handleOrganization" :title="`组织架构 (${getShortcutLabel('organization')})`"> <!-- 组织架构按钮 -->
        <div class="btn-inner"> <!-- 按钮内部包装层 -->
          <div class="btn-main"> <!-- 按钮主体部分 -->
            <SvgIcon name="organization" :size="16" /> <!-- 组织架构图标 -->
            <span>组织架构</span> <!-- 按钮文本 -->
          </div> <!-- 主体结束 -->
          <div class="shortcut-hint">{{ getShortcutLabel('organization') }}</div> <!-- 快捷键提示文本 -->
        </div> <!-- 包装层结束 -->
      </el-button> <!-- 按钮结束 -->
      <el-button class="tool-btn" @click="handleBannedWords" :title="`禁词管理 (${getShortcutLabel('banned-words')})`"> <!-- 禁词管理按钮 -->
        <div class="btn-inner"> <!-- 按钮内部包装层 -->
          <div class="btn-main"> <!-- 按钮主体部分 -->
            <SvgIcon name="banned-words" :size="16" /> <!-- 禁词管理图标 -->
            <span>禁词管理</span> <!-- 按钮文本 -->
          </div> <!-- 主体结束 -->
          <div class="shortcut-hint">{{ getShortcutLabel('banned-words') }}</div> <!-- 快捷键提示文本 -->
        </div> <!-- 包装层结束 -->
      </el-button> <!-- 按钮结束 -->
      <BannedWordsDrawer ref="bannedWordsRef" :book-name="route.query.name" /> <!-- 禁词抽屉组件 -->
      
      <el-button class="tool-btn" @click="handleParagraphSettings" :title="`字数设置 (${getShortcutLabel('paragraph-settings')})`"> <!-- 字数设置按钮 -->
        <div class="btn-inner"> <!-- 按钮内部包装层 -->
          <div class="btn-main"> <!-- 按钮主体部分 -->
            <el-icon><Setting /></el-icon> <!-- 设置图标 -->
            <span>字数设置</span> <!-- 按钮文本 -->
          </div> <!-- 主体结束 -->
          <div class="shortcut-hint">{{ getShortcutLabel('paragraph-settings') }}</div> <!-- 快捷键提示文本 -->
        </div> <!-- 包装层结束 -->
      </el-button> <!-- 按钮结束 -->

      <!-- 段落字数设置弹窗 -->
      <el-dialog
        v-model="paragraphLengthDialogVisible"
        title="段落字数设置"
        width="350px"
        :append-to-body="true"
      >
        <el-form label-width="100px">
          <el-form-item label="最大字数">
            <el-input-number
              v-model="tempParagraphMaxLength"
              :min="1"
              :max="1000"
              :step="5"
              controls-position="right"
            />
            <span style="margin-left: 8px">字</span>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="paragraphLengthDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveParagraphMaxLength">确定</el-button>
        </template>
      </el-dialog>
    </div>
    
    <!-- 主题切换按钮 -->
    <div class="toolbar-right">
      <ThemeSelector />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue' // 导入 Vue 核心 API
import RandomName from '@renderer/components/RandomName.vue' // 导入随机起名组件
import BannedWordsDrawer from './BannedWordsDrawer.vue' // 导入禁词管理抽屉组件
import ThemeSelector from '@renderer/components/ThemeSelector.vue' // 导入主题选择组件
import { useRouter, useRoute } from 'vue-router' // 导入路由相关 API
import SvgIcon from '@renderer/components/SvgIcon.vue' // 导入 SVG 图标组件
import { Setting } from '@element-plus/icons-vue' // 导入 Element Plus 设置图标
import { useEditorStore } from '@renderer/stores/editor' // 导入编辑器状态存储
import { useJailStore } from '@renderer/stores/jail' // 导入专注模式状态存储
import { ElMessage } from 'element-plus' // 导入消息提示组件

const editorStore = useEditorStore() // 获取编辑器 Store 实例
const jailStore = useJailStore() // 获取专注模式 Store 实例
const randomNameRef = ref(null) // 定义随机起名组件引用
const bannedWordsRef = ref(null) // 定义禁词管理组件引用
const router = useRouter() // 获取路由实例
const route = useRoute() // 获取当前路由信息

// 默认快捷键配置定义
const DEFAULT_SHORTCUTS = [ // 快捷键列表定义
  { id: 'random-name', key: 'Alt+Q' }, // 随机起名快捷键
  { id: 'world-map', key: 'Alt+A' }, // 设计地图快捷键
  { id: 'timeline', key: 'Alt+Z' }, // 时间线快捷键
  { id: 'dictionary', key: 'Alt+W' }, // 词条字典快捷键
  { id: 'character-profile', key: 'Alt+S' }, // 人物谱快捷键
  { id: 'relationship-map', key: 'Alt+X' }, // 关系图快捷键
  { id: 'events-sequence', key: 'Alt+E' }, // 事序图快捷键
  { id: 'organization', key: 'Alt+D' }, // 组织架构快捷键
  { id: 'banned-words', key: 'Alt+C' }, // 禁词管理快捷键
  { id: 'paragraph-settings', key: 'Alt+R' } // 字数设置快捷键
] // 默认配置结束

const shortcuts = ref([]) // 定义响应式快捷键列表

// 加载最新快捷键配置
const loadShortcuts = async () => { // 异步加载函数
  try { // 异常处理
    const savedShortcuts = await window.electronStore.get('shortcuts') // 从本地存储获取
    if (savedShortcuts && Array.isArray(savedShortcuts)) { // 校验数据格式
      shortcuts.value = savedShortcuts // 应用保存的快捷键
    } else { // 无保存数据时
      shortcuts.value = DEFAULT_SHORTCUTS // 使用默认配置
    } // 判断结束
  } catch (error) { // 捕获错误
    console.error('加载快捷键失败:', error) // 打印错误日志
    shortcuts.value = DEFAULT_SHORTCUTS // 回退到默认配置
  } // 异步结束
} // 函数定义结束

// 获取指定功能的快捷键显示文本
const getShortcutLabel = (id) => { // 定义获取标签函数
  const shortcut = shortcuts.value.find(s => s.id === id) // 查找对应 ID 的快捷键
  return shortcut ? shortcut.key : '' // 返回按键组合文本
} // 函数定义结束

// 段落字数设置相关
const paragraphLengthDialogVisible = ref(false) // 字数设置对话框显示状态
const tempParagraphMaxLength = ref(35) // 临时存储段落最大字数

// 监听书籍变化，加载对应的字数设置
watch( // 监听器定义
  () => route.query.name, // 监听路由参数中的书名
  async (bookName) => { // 书名变化时的回调
    if (bookName) { // 如果书名存在
      try { // 异常处理
        const key = `paragraphMaxLength_${bookName}` // 构建存储键名
        const savedMaxLength = await window.electronStore.get(key) // 从存储获取字数设置
        if (savedMaxLength) { // 如果有保存的设置
          editorStore.setParagraphMaxLength(savedMaxLength) // 更新到全局状态
        } // 判断结束
      } catch (error) { // 捕获错误
        console.error('加载段落字数设置失败:', error) // 打印错误日志
      } // 处理结束
    } // 书名判断结束
  }, // 回调结束
  { immediate: true } // 立即执行一次
) // 监听器定义结束

// 工具栏功能处理函数
const handleRandomName = () => { // 随机起名处理函数
  if (randomNameRef.value?.visible) { // 如果组件已显示
    randomNameRef.value.close() // 执行关闭
  } else { // 否则
    randomNameRef.value?.open() // 执行打开
  } // 判断结束
} // 函数结束

const handleParagraphSettings = () => { // 段落设置处理函数
  if (paragraphLengthDialogVisible.value) { // 如果对话框已显示
    paragraphLengthDialogVisible.value = false // 执行关闭
  } else { // 否则
    tempParagraphMaxLength.value = editorStore.paragraphMaxLength // 同步当前字数到临时变量
    paragraphLengthDialogVisible.value = true // 显示对话框
  } // 判断结束
} // 函数结束

const saveParagraphMaxLength = async () => { // 保存段落字数设置
  const bookName = route.query.name // 获取当前书名
  if (!bookName) return // 无书名则返回

  editorStore.setParagraphMaxLength(tempParagraphMaxLength.value) // 更新全局状态
  
  try { // 异常处理
    const key = `paragraphMaxLength_${bookName}` // 构建存储键名
    await window.electronStore.set(key, tempParagraphMaxLength.value) // 保存到本地存储
  } catch (error) { // 捕获错误
    console.error('保存段落字数设置失败:', error) // 打印错误日志
  } // 处理结束
  
  paragraphLengthDialogVisible.value = false // 关闭对话框
} // 函数结束

const handleWorldMap = () => { // 设计地图处理函数
  const bookName = route.query.name // 获取当前书名
  // 如果已经在地图列表页面，返回编辑器；否则跳转到地图列表
  if (route.path === '/map-list') { // 如果当前在地图列表
    router.push({ path: '/editor', query: { name: bookName } }) // 返回编辑器
  } else { // 否则
    router.push({ path: '/map-list', query: { name: bookName } }) // 跳转到地图列表
  } // 判断结束
} // 函数结束

const handleTimeline = () => { // 时间线处理函数
  const bookName = route.query.name // 获取当前书名
  // 如果已经在时间线页面，返回编辑器；否则跳转到时间线
  if (route.path === '/timeline') { // 如果当前在时间线
    router.push({ path: '/editor', query: { name: bookName } }) // 返回编辑器
  } else { // 否则
    router.push({ path: '/timeline', query: { name: bookName } }) // 跳转到时间线
  } // 判断结束
} // 函数结束

const handleEntryDictionary = () => { // 词条字典处理函数
  const bookName = route.query.name // 获取当前书名
  // 如果已经在词条字典页面，返回编辑器；否则跳转到词条字典
  if (route.path === '/dictionary') { // 如果当前在字典
    router.push({ path: '/editor', query: { name: bookName } }) // 返回编辑器
  } else { // 否则
    router.push({ path: '/dictionary', query: { name: bookName } }) // 跳转到字典
  } // 判断结束
} // 函数结束

const handleCharacterProfile = () => { // 人物谱处理函数
  const bookName = route.query.name // 获取当前书名
  // 如果已经在人物谱页面，返回编辑器；否则跳转到人物谱
  if (route.path === '/character-profile') { // 如果当前在人物谱
    router.push({ path: '/editor', query: { name: bookName } }) // 返回编辑器
  } else { // 否则
    router.push({ path: '/character-profile', query: { name: bookName } }) // 跳转到人物谱
  } // 判断结束
} // 函数结束

const handleRelationshipMap = () => { // 关系图处理函数
  const bookName = route.query.name // 获取当前书名
  // 如果已经在关系图列表页面，返回编辑器；否则跳转到关系图列表
  if (route.path === '/relationship-list') { // 如果当前在关系图列表
    router.push({ path: '/editor', query: { name: bookName } }) // 返回编辑器
  } else { // 否则
    router.push({ path: '/relationship-list', query: { name: bookName } }) // 跳转到关系图列表
  } // 判断结束
} // 函数结束

const handleEventsSequence = () => { // 事序图处理函数
  const bookName = route.query.name // 获取当前书名
  // 如果已经在事序图页面，返回编辑器；否则跳转到事序图
  if (route.path === '/events-sequence') { // 如果当前在事序图
    router.push({ path: '/editor', query: { name: bookName } }) // 返回编辑器
  } else { // 否则
    router.push({ path: '/events-sequence', query: { name: bookName } }) // 跳转到事序图
  } // 判断结束
} // 函数结束

const handleOrganization = () => { // 组织架构处理函数
  const bookName = route.query.name // 获取当前书名
  // 如果已经在组织架构列表页面，返回编辑器；否则跳转到组织架构列表
  if (route.path === '/organization-list') { // 如果当前在组织架构列表
    router.push({ path: '/editor', query: { name: bookName } }) // 返回编辑器
  } else { // 否则
    router.push({ path: '/organization-list', query: { name: bookName } }) // 跳转到组织架构列表
  } // 判断结束
} // 函数结束

const handleBannedWords = () => { // 禁词管理处理函数
  if (bannedWordsRef.value?.visible) { // 如果组件已显示
    bannedWordsRef.value.close() // 执行关闭
  } else { // 否则
    bannedWordsRef.value?.open() // 执行打开
  } // 判断结束
} // 函数结束

// 快捷键处理函数映射
const shortcutHandlers = { // 映射对象定义
  'random-name': handleRandomName, // 随机起名映射
  'world-map': handleWorldMap, // 设计地图映射
  'timeline': handleTimeline, // 时间线映射
  'dictionary': handleEntryDictionary, // 词条字典映射
  'character-profile': handleCharacterProfile, // 人物谱映射
  'relationship-map': handleRelationshipMap, // 关系图映射
  'events-sequence': handleEventsSequence, // 事序图映射
  'organization': handleOrganization, // 组织架构映射
  'banned-words': handleBannedWords, // 禁词管理映射
  'paragraph-settings': handleParagraphSettings // 字数设置映射
} // 映射结束

// 快捷键与路由的映射关系
const shortcutRouteMap = { // 映射对象定义
  'world-map': '/map-list', // 设计地图路由映射
  'timeline': '/timeline', // 时间线路由映射
  'dictionary': '/dictionary', // 词条字典路由映射
  'character-profile': '/character-profile', // 人物谱路由映射
  'relationship-map': '/relationship-list', // 关系图路由映射
  'events-sequence': '/events-sequence', // 事序图路由映射
  'organization': '/organization-list' // 组织架构路由映射
} // 映射结束

// 监听主进程发来的快捷键触发事件
const handleShortcutTriggered = (actionId) => { // 定义触发回调函数
  console.log(`[快捷键] 收到快捷键: ${actionId}, 当前路由: ${route.path}`) // 打印触发日志
  
  // 如果在编辑器页面，允许所有快捷键
  if (route.path === '/editor') { // 判断是否在编辑器
    console.log(`[快捷键] 在编辑器页面，允许执行快捷键: ${actionId}`) // 打印允许日志
    const handler = shortcutHandlers[actionId] // 获取对应的处理器
    if (handler) { // 如果处理器存在
      handler() // 执行处理器
    } // 处理器执行结束
    return // 返回
  } // 编辑器判断结束
  
  // 如果不在编辑器页面，检查当前路由是否对应该快捷键
  // 只有当前路由对应的快捷键才能触发（用于返回编辑器）
  const expectedRoute = shortcutRouteMap[actionId] // 获取预期路由
  if (expectedRoute && route.path === expectedRoute) { // 如果当前路由匹配预期
    console.log(`[快捷键] 当前在 ${route.path}，允许快捷键 ${actionId} 返回编辑器`) // 打印允许日志
    const handler = shortcutHandlers[actionId] // 获取对应的处理器
    if (handler) { // 如果处理器存在
      handler() // 执行处理器
    } // 处理器执行结束
  } else { // 路由不匹配时
    console.log(`[快捷键] 当前在 ${route.path}，只能使用对应的快捷键返回，快捷键 ${actionId} 被忽略`) // 打印忽略日志
  } // 路由匹配判断结束
} // 函数定义结束

onMounted(async () => { // 组件挂载后的异步钩子
  await loadShortcuts() // 每次进入编辑器获取一遍最新的组合

  // 监听全局快捷键事件
  if (window.electron?.onShortcutTriggered) { // 检查 electron API 是否可用
    window.electron.onShortcutTriggered(handleShortcutTriggered) // 注册快捷键触发监听
  } // 检查结束
  
  // 始终启用全局快捷键监听（在渲染进程中过滤）
  if (window.electron?.setShortcutEnabled) { // 检查设置函数是否可用
    window.electron.setShortcutEnabled(true) // 启用主进程快捷键分发
  } // 检查结束
}) // 钩子定义结束

onUnmounted(() => {
  // 注意：electron的事件监听器会在主进程中持续存在
  // 如果需要清理，可以在preload中添加removeListener方法
})
</script>

<style lang="scss" scoped>
.editor-toolbar {
  width: 100%;
  height: 56px;
  box-sizing: border-box;
  background: var(--bg-soft);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);

  .toolbar-buttons { // 按钮组容器样式
    display: flex; // 使用弹性布局
    align-items: center; // 垂直居中对齐
    gap: 8px; // 按钮之间的间距
    flex-wrap: wrap; // 自动换行
    flex: 1; // 占据剩余空间

    .tool-btn { // 工具按钮通用样式
      background: var(--bg-primary); // 按钮背景色
      border: 1px solid var(--border-color); // 按钮边框
      color: var(--text-base); // 按钮主文字颜色
      padding: 4px 10px; // 调整内边距以容纳双行内容
      height: 44px; // 增加高度以显示快捷键提示
      display: flex; // 弹性布局
      align-items: center; // 垂直居中
      justify-content: center; // 水平居中
      transition: all 0.2s; // 添加平滑过渡效果
      
      &:hover { // 鼠标悬停样式
        color: var(--el-color-primary); // 悬停时文字变色
        border-color: var(--el-color-primary); // 悬停时边框变色
      } // 悬停样式结束
      
      .btn-inner { // 内部布局容器
        display: flex; // 弹性布局
        flex-direction: column; // 垂直排列图标文字与提示
        align-items: center; // 水平居中
        gap: 2px; // 文字与提示之间的微小间距
      } // 容器样式结束

      .btn-main { // 图标与文字主体
        display: flex; // 弹性布局
        align-items: center; // 垂直居中
        gap: 4px; // 图标与文字的间距
        
        span { // 按钮主文字样式
          font-size: 13px; // 设置字体大小
          line-height: 1.2; // 设置行高
        } // 文字样式结束
      } // 主体样式结束
      
      .shortcut-hint { // 快捷键提示文字样式
        font-size: 10px; // 设置较小的字体
        color: var(--text-lighter); // 设置较浅的颜色
        opacity: 0.7; // 降低不透明度以示区分
        line-height: 1; // 紧凑行高
      } // 提示样式结束
    } // 按钮样式结束
  } // 按钮组样式结束
  
  .toolbar-right {
    display: flex;
    align-items: center;
    margin-left: 16px;
  }
}
</style>
