<template>
  <div class="editor-toolbar">
    <div class="toolbar-buttons">
      <el-button class="tool-btn" @click="handleRandomName" title="随机起名 (Alt+Q)">
        <SvgIcon name="naming" :size="16" />
        <span>随机起名</span>
      </el-button>
      <RandomName ref="randomNameRef" />
      <el-button class="tool-btn" @click="handleWorldMap" title="设计地图 (Alt+A)">
        <SvgIcon name="map" :size="16" />
        <span>设计地图</span>
      </el-button>
      <el-button class="tool-btn" @click="handleTimeline" title="时间线 (Alt+Z)">
        <SvgIcon name="timeline" :size="16" />
        <span>时间线</span>
      </el-button>
      <el-button class="tool-btn" @click="handleEntryDictionary" title="词条字典 (Alt+W)">
        <SvgIcon name="dictionary" :size="16" />
        <span>词条字典</span>
      </el-button>
      <el-button class="tool-btn" @click="handleCharacterProfile" title="人物谱 (Alt+S)">
        <SvgIcon name="character" :size="16" />
        <span>人物谱</span>
      </el-button>
      <el-button class="tool-btn" @click="handleRelationshipMap" title="关系图 (Alt+X)">
        <SvgIcon name="relationship" :size="16" />
        <span>关系图</span>
      </el-button>
      <el-button class="tool-btn" @click="handleEventsSequence" title="事序图 (Alt+E)">
        <SvgIcon name="gantt" :size="16" />
        <span>事序图</span>
      </el-button>
      <el-button class="tool-btn" @click="handleOrganization" title="组织架构 (Alt+D)">
        <SvgIcon name="organization" :size="16" />
        <span>组织架构</span>
      </el-button>
      <el-button class="tool-btn" @click="handleBannedWords" title="禁词管理 (Alt+C)">
        <SvgIcon name="banned-words" :size="16" />
        <span>禁词管理</span>
      </el-button>
      <BannedWordsDrawer ref="bannedWordsRef" :book-name="route.query.name" />
      
      <el-button class="tool-btn" @click="handleParagraphSettings" title="字数设置 (Alt+R)">
        <el-icon><Setting /></el-icon>
        <span>字数设置</span>
      </el-button>

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
import { ref, onMounted, onUnmounted, watch } from 'vue'
import RandomName from '@renderer/components/RandomName.vue'
import BannedWordsDrawer from './BannedWordsDrawer.vue'
import ThemeSelector from '@renderer/components/ThemeSelector.vue'
import { useRouter, useRoute } from 'vue-router'
import SvgIcon from '@renderer/components/SvgIcon.vue'
import { Setting } from '@element-plus/icons-vue'
import { useEditorStore } from '@renderer/stores/editor'
import { useJailStore } from '@renderer/stores/jail'
import { ElMessage } from 'element-plus'

const editorStore = useEditorStore()
const jailStore = useJailStore()
const randomNameRef = ref(null)
const bannedWordsRef = ref(null)
const router = useRouter()
const route = useRoute()

// 段落字数设置相关
const paragraphLengthDialogVisible = ref(false)
const tempParagraphMaxLength = ref(35)

// 监听书籍变化，加载对应的字数设置
watch(
  () => route.query.name,
  async (bookName) => {
    if (bookName) {
      try {
        const key = `paragraphMaxLength_${bookName}`
        const savedMaxLength = await window.electronStore.get(key)
        if (savedMaxLength) {
          editorStore.setParagraphMaxLength(savedMaxLength)
        }
      } catch (error) {
        console.error('加载段落字数设置失败:', error)
      }
    }
  },
  { immediate: true }
)

// 工具栏功能处理函数
const handleRandomName = () => {
  if (randomNameRef.value?.visible) {
    randomNameRef.value.close()
  } else {
    randomNameRef.value?.open()
  }
}

const handleParagraphSettings = () => {
  if (paragraphLengthDialogVisible.value) {
    paragraphLengthDialogVisible.value = false
  } else {
    tempParagraphMaxLength.value = editorStore.paragraphMaxLength
    paragraphLengthDialogVisible.value = true
  }
}

const saveParagraphMaxLength = async () => {
  const bookName = route.query.name
  if (!bookName) return

  editorStore.setParagraphMaxLength(tempParagraphMaxLength.value)
  
  try {
    const key = `paragraphMaxLength_${bookName}`
    await window.electronStore.set(key, tempParagraphMaxLength.value)
  } catch (error) {
    console.error('保存段落字数设置失败:', error)
  }
  
  paragraphLengthDialogVisible.value = false
}

const handleWorldMap = () => {
  if (jailStore.isJailModeActive) {
    ElMessage.warning('坐牢模式下无法跳转页面')
    return
  }
  const bookName = route.query.name
  // 如果已经在地图列表页面，返回编辑器；否则跳转到地图列表
  if (route.path === '/map-list') {
    router.push({ path: '/editor', query: { name: bookName } })
  } else {
    router.push({ path: '/map-list', query: { name: bookName } })
  }
}

const handleTimeline = () => {
  if (jailStore.isJailModeActive) {
    ElMessage.warning('坐牢模式下无法跳转页面')
    return
  }
  const bookName = route.query.name
  // 如果已经在时间线页面，返回编辑器；否则跳转到时间线
  if (route.path === '/timeline') {
    router.push({ path: '/editor', query: { name: bookName } })
  } else {
    router.push({ path: '/timeline', query: { name: bookName } })
  }
}

const handleEntryDictionary = () => {
  if (jailStore.isJailModeActive) {
    ElMessage.warning('坐牢模式下无法跳转页面')
    return
  }
  const bookName = route.query.name
  // 如果已经在词条字典页面，返回编辑器；否则跳转到词条字典
  if (route.path === '/dictionary') {
    router.push({ path: '/editor', query: { name: bookName } })
  } else {
    router.push({ path: '/dictionary', query: { name: bookName } })
  }
}

const handleCharacterProfile = () => {
  const bookName = route.query.name
  // 如果已经在人物谱页面，返回编辑器；否则跳转到人物谱
  if (route.path === '/character-profile') {
    router.push({ path: '/editor', query: { name: bookName } })
  } else {
    router.push({ path: '/character-profile', query: { name: bookName } })
  }
}

const handleRelationshipMap = () => {
  const bookName = route.query.name
  // 如果已经在关系图列表页面，返回编辑器；否则跳转到关系图列表
  if (route.path === '/relationship-list') {
    router.push({ path: '/editor', query: { name: bookName } })
  } else {
    router.push({ path: '/relationship-list', query: { name: bookName } })
  }
}

const handleEventsSequence = () => {
  const bookName = route.query.name
  // 如果已经在事序图页面，返回编辑器；否则跳转到事序图
  if (route.path === '/events-sequence') {
    router.push({ path: '/editor', query: { name: bookName } })
  } else {
    router.push({ path: '/events-sequence', query: { name: bookName } })
  }
}

const handleOrganization = () => {
  if (jailStore.isJailModeActive) {
    ElMessage.warning('坐牢模式下无法跳转页面')
    return
  }
  const bookName = route.query.name
  // 如果已经在组织架构列表页面，返回编辑器；否则跳转到组织架构列表
  if (route.path === '/organization-list') {
    router.push({ path: '/editor', query: { name: bookName } })
  } else {
    router.push({ path: '/organization-list', query: { name: bookName } })
  }
}

const handleBannedWords = () => {
  if (bannedWordsRef.value?.visible) {
    bannedWordsRef.value.close()
  } else {
    bannedWordsRef.value?.open()
  }
}

// 快捷键处理函数映射
const shortcutHandlers = {
  'random-name': handleRandomName,
  'world-map': handleWorldMap,
  'timeline': handleTimeline,
  'dictionary': handleEntryDictionary,
  'character-profile': handleCharacterProfile,
  'relationship-map': handleRelationshipMap,
  'events-sequence': handleEventsSequence,
  'organization': handleOrganization,
  'banned-words': handleBannedWords,
  'paragraph-settings': handleParagraphSettings
}

// 快捷键与路由的映射关系
const shortcutRouteMap = {
  'world-map': '/map-list',
  'timeline': '/timeline',
  'dictionary': '/dictionary',
  'character-profile': '/character-profile',
  'relationship-map': '/relationship-list',
  'events-sequence': '/events-sequence',
  'organization': '/organization-list'
}

// 监听主进程发来的快捷键触发事件
const handleShortcutTriggered = (actionId) => {
  console.log(`[快捷键] 收到快捷键: ${actionId}, 当前路由: ${route.path}`)
  
  // 如果在编辑器页面，允许所有快捷键
  if (route.path === '/editor') {
    console.log(`[快捷键] 在编辑器页面，允许执行快捷键: ${actionId}`)
    const handler = shortcutHandlers[actionId]
    if (handler) {
      handler()
    }
    return
  }
  
  // 如果不在编辑器页面，检查当前路由是否对应该快捷键
  // 只有当前路由对应的快捷键才能触发（用于返回编辑器）
  const expectedRoute = shortcutRouteMap[actionId]
  if (expectedRoute && route.path === expectedRoute) {
    console.log(`[快捷键] 当前在 ${route.path}，允许快捷键 ${actionId} 返回编辑器`)
    const handler = shortcutHandlers[actionId]
    if (handler) {
      handler()
    }
  } else {
    console.log(`[快捷键] 当前在 ${route.path}，只能使用对应的快捷键返回，快捷键 ${actionId} 被忽略`)
  }
}

onMounted(() => {
  // 监听全局快捷键事件
  if (window.electron?.onShortcutTriggered) {
    window.electron.onShortcutTriggered(handleShortcutTriggered)
  }
  
  // 始终启用全局快捷键监听（在渲染进程中过滤）
  if (window.electron?.setShortcutEnabled) {
    window.electron.setShortcutEnabled(true)
  }
})

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

  .toolbar-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    flex: 1;

    .tool-btn {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      color: var(--text-base);
      padding: 6px 12px;
      height: 32px;
      display: flex;
      align-items: center;
      gap: 4px;
      
      &:hover {
        color: var(--el-color-primary);
        border-color: var(--el-color-primary);
      }
      
      span {
        font-size: 13px;
      }
    }
  }
  
  .toolbar-right {
    display: flex;
    align-items: center;
    margin-left: 16px;
  }
}
</style>
