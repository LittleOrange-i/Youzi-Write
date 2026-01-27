<template>
  <el-dialog
    v-model="dialogVisible"
    title="更多设置"
    width="700px"
    :close-on-click-modal="false"
    class="more-settings-dialog"
    append-to-body
  >
    <div class="dialog-content">
      <el-tabs v-model="activeTab">
        <!-- 码字音效设置 -->
        <el-tab-pane label="码字音效" name="typingSound">
          <TypingSoundSettings
            :typing-sound-effect="typingSoundEffect"
            :typing-sound-volume="typingSoundVolume"
            @update:typing-sound-effect="handleTypingSoundUpdate"
            @update:typing-sound-volume="handleVolumeUpdate"
            @play-preview="handlePlayPreview"
          />
        </el-tab-pane>

        <!-- 排版设置 -->
        <el-tab-pane label="排版设置" name="formatting">
          <div class="formatting-settings">
            <div class="formatting-tip">
              <el-alert
                title="拖拽列表项可调整规则执行顺序（从上往下执行）"
                type="info"
                show-icon
                :closable="false"
              />
            </div>
            
            <div ref="sortableList" class="rules-list">
              <div
                v-for="rule in localRules"
                :key="rule.id"
                class="rule-item"
              >
                <div class="drag-handle">
                  <el-icon><Rank /></el-icon>
                </div>
                <el-checkbox v-model="rule.enabled" class="rule-checkbox">
                  {{ rule.label }}
                </el-checkbox>
              </div>
            </div>

            <div class="action-buttons">
              <el-button type="primary" @click="applyFormatting">应用格式化</el-button>
              <el-button @click="resetFormatOptions">重置选项</el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <el-button type="primary" @click="handleClose">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Rank } from '@element-plus/icons-vue'
import Sortable from 'sortablejs'
import TypingSoundSettings from './TypingSoundSettings.vue'
import { useEditorStore } from '@renderer/stores/editor'
import { getDefaultFormattingConfig } from '@renderer/utils/textFormatter'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  typingSoundEffect: {
    type: String,
    default: ''
  },
  typingSoundVolume: {
    type: Number,
    default: 50
  },
  editorContent: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits([
  'update:modelValue',
  'update:typingSoundEffect',
  'update:typingSoundVolume',
  'playPreview',
  'applyFormatting'
])

const editorStore = useEditorStore()

// 本地状态
const dialogVisible = ref(props.modelValue)
const activeTab = ref('typingSound')
const sortableList = ref(null)
const sortableInstance = ref(null)

// 排版规则列表
const localRules = ref([])

// 初始化规则
const initRules = () => {
  // 尝试从 store 获取
  if (editorStore.editorSettings.formattingRules && editorStore.editorSettings.formattingRules.length > 0) {
    // 深拷贝以避免直接修改 store
    localRules.value = JSON.parse(JSON.stringify(editorStore.editorSettings.formattingRules))
  } else {
    // 使用默认配置
    localRules.value = getDefaultFormattingConfig()
  }
}

// 初始化 Sortable
const initSortable = () => {
  if (sortableInstance.value) {
    sortableInstance.value.destroy()
    sortableInstance.value = null
  }

  if (sortableList.value) {
    sortableInstance.value = Sortable.create(sortableList.value, {
      handle: '.drag-handle',
      animation: 150,
      onEnd: (evt) => {
        // 更新数组顺序
        const item = localRules.value.splice(evt.oldIndex, 1)[0]
        localRules.value.splice(evt.newIndex, 0, item)
      }
    })
  }
}

// 监听 props 变化
watch(() => props.modelValue, (newVal) => {
  dialogVisible.value = newVal
  if (newVal) {
    // 打开弹窗时重新加载规则（确保是最新的）
    initRules()
    // 如果当前是排版设置标签，初始化拖拽
    if (activeTab.value === 'formatting') {
      nextTick(() => {
        initSortable()
        // 重置滚动位置
        if (sortableList.value) {
          sortableList.value.scrollTop = 0
        }
      })
    }
  }
})

// 监听本地状态变化
watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 监听标签页切换
watch(activeTab, (newVal) => {
  if (newVal === 'formatting' && dialogVisible.value) {
    nextTick(() => {
      initSortable()
      // 重置滚动位置
      if (sortableList.value) {
        sortableList.value.scrollTop = 0
      }
    })
  }
})

// 初始化
onMounted(() => {
  initRules()
})

// 处理音效更新
const handleTypingSoundUpdate = (value) => {
  emit('update:typingSoundEffect', value)
}

// 处理音量更新
const handleVolumeUpdate = (value) => {
  emit('update:typingSoundVolume', value)
}

// 处理试听播放
const handlePlayPreview = () => {
  emit('playPreview')
}

// 应用格式化
const applyFormatting = () => {
  const rules = localRules.value
  const hasSelectedOption = rules.some(r => r.enabled)
  
  if (!hasSelectedOption) {
    ElMessage.warning('请至少选择一个格式化选项')
    return
  }
  
  // 保存设置到 store
  editorStore.saveEditorSettings({
    formattingRules: rules
  })
  
  // 触发应用事件，传递规则列表
  emit('applyFormatting', rules)
  // ElMessage.success('格式化已应用')
}

// 重置格式化选项
const resetFormatOptions = () => {
  localRules.value = getDefaultFormattingConfig()
  ElMessage.info('已重置所有选项')
}

// 关闭弹窗
const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style>
/* 由于弹窗使用了 append-to-body，其 DOM 元素在组件作用域之外 */
/* 因此需要使用非 scoped 样式来控制弹窗本身的大小和布局 */
.more-settings-dialog.el-dialog {
  height: 650px; /* 固定弹窗高度 */
  display: flex;
  flex-direction: column;
  margin-top: 10vh !important; /* 保持一定的顶部距离 */
}

.more-settings-dialog .el-dialog__body {
  padding: 0 !important; /*以此处样式为准 */
  height: 500px; /* 固定内容区域高度 */
  overflow: hidden; /* 防止内容区域撑开弹窗 */
  flex: 1;
}
</style>

<style scoped>
/* .more-settings-dialog :deep(.el-dialog__body) 这里的旧样式已移除，移至上方非 scoped 块中 */

.dialog-content {
  height: 100%;
  /* 移除 overflow-y: auto，避免出现双重滚动条，由 el-tabs__content 负责滚动 */
  /* overflow-y: auto; */
  padding: 20px;
  box-sizing: border-box; /* 确保 padding 不会撑大高度 */
}

/* 使用 :deep 穿透选择器控制内部组件样式 */
:deep(.el-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow-y: hidden; /* 改为 hidden，由内部组件控制滚动 */
  padding: 0;
  /* 隐藏滚动条 */
  scrollbar-width: none; /* Firefox */

}

:deep(.el-tab-pane) {
  height: 100%; /* 确保 tab-pane 占满高度 */
}

/* 排版设置样式 */
.formatting-settings {
  padding: 0 10px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.formatting-tip {
  margin-bottom: 15px;
}

.rules-list {
  flex: 1;
  overflow-y: auto;
  /* border: 1px solid #ebeef5; */
  border: 1px solid var(--border-color);
  background-color: var(--bg-primary);
  border-radius: 4px;
  padding: 5px;
}

.rule-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-color-soft);
  background-color: var(--bg-primary);
  transition: background-color 0.2s;
  color: var(--text-base);
}

.rule-item:last-child {
  border-bottom: none;
}

.rule-item:hover {
  background-color: var(--bg-mute);
}

.drag-handle {
  cursor: move;
  margin-right: 10px;
  color: var(--text-gray);
  display: flex;
  align-items: center;
}

.drag-handle:hover {
  color: var(--accent-color);
}

.rule-checkbox {
  flex: 1;
  margin-right: 0 !important;
  height: auto !important;
}

:deep(.el-checkbox__label) {
  white-space: normal;
  line-height: 1.5;
  color: var(--text-base);
}

.action-buttons {
  margin-top: 20px;
  text-align: center;
  padding-top: 15px;
  border-top: 1px solid #EBEEF5;
}

.action-buttons .el-button {
  margin: 0 10px;
}
</style>
