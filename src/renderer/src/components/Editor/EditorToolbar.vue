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

const editorStore = useEditorStore()
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
  // 跳转到地图列表页面，带上当前书籍名
  const bookName = route.query.name
  router.push({ path: '/map-list', query: { name: bookName } })
}

const handleTimeline = () => {
  // 跳转到时间线页面，带上当前书籍名
  const bookName = route.query.name
  router.push({ path: '/timeline', query: { name: bookName } })
}

const handleEntryDictionary = () => {
  // 跳转到词条字典页面，带上当前书籍名
  const bookName = route.query.name
  router.push({ path: '/dictionary', query: { name: bookName } })
}

const handleCharacterProfile = () => {
  // 跳转到人物谱页面，带上当前书籍名
  const bookName = route.query.name
  router.push({ path: '/character-profile', query: { name: bookName } })
}

const handleRelationshipMap = () => {
  // 跳转到关系图列表页面，带上当前书籍名
  const bookName = route.query.name
  router.push({ path: '/relationship-list', query: { name: bookName } })
}

const handleEventsSequence = () => {
  // 跳转到事序图页面，带上当前书籍名
  const bookName = route.query.name
  router.push({ path: '/events-sequence', query: { name: bookName } })
}

const handleOrganization = () => {
  // 跳转到组织架构列表页面，带上当前书籍名
  const bookName = route.query.name
  router.push({ path: '/organization-list', query: { name: bookName } })
}

const handleBannedWords = () => {
  if (bannedWordsRef.value?.visible) {
    bannedWordsRef.value.close()
  } else {
    bannedWordsRef.value?.open()
  }
}

// 快捷键处理
const handleKeydown = (e) => {
  // Alt key (Option on Mac)
  if (e.altKey) {
    switch (e.key.toLowerCase()) {
      case 'q':
        e.preventDefault()
        e.stopPropagation()
        handleRandomName()
        break
      case 'c':
        e.preventDefault()
        e.stopPropagation()
        handleBannedWords()
        break
      case 'r':
        e.preventDefault()
        e.stopPropagation()
        handleParagraphSettings()
        break
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown, true)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown, true)
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
