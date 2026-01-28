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
            <div class="action-buttons top-buttons">
              <el-button type="primary" @click="applyFormatting">应用格式化</el-button>
              <el-button @click="resetFormatOptions">重置选项</el-button>
            </div>

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
          </div>
        </el-tab-pane>

        <!-- 对白高亮设置 -->
        <el-tab-pane label="对白高亮" name="dialogueHighlight">
          <div class="dialogue-highlight-settings">
            <div class="scroll-content">
              <div class="setting-group">
                <div class="setting-item">
                  <span class="label">默认高亮颜色</span>
                  <el-color-picker v-model="localDialogueHighlight.defaultColor" show-alpha />
                </div>
                <div class="setting-item">
                  <span class="label">支持换行高亮</span>
                  <el-switch v-model="localDialogueHighlight.allowNewLine" />
                  <el-tooltip content="开启后，对白中包含换行符也会保持高亮状态" placement="top">
                    <el-icon class="info-icon"><InfoFilled /></el-icon>
                  </el-tooltip>
                </div>
                <div class="setting-item">
                  <span class="label">允许无结束符</span>
                  <el-switch v-model="localDialogueHighlight.allowNoEnd" />
                  <el-tooltip content="开启后，即使没有对应的结束符号，对白也会从起始符号开始高亮直到段落结束" placement="top">
                    <el-icon class="info-icon"><InfoFilled /></el-icon>
                  </el-tooltip>
                </div>
              </div>

              <div class="symbols-list-header">
                <span>对白符号设置</span>
                <span class="tip">（可自定义每个符号的独立颜色）</span>
              </div>

              <div class="symbols-list">
                <div v-for="symbol in localDialogueHighlight.symbols" :key="symbol.id" class="symbol-item">
                  <div class="symbol-info">
                    <el-checkbox v-model="symbol.enabled" class="symbol-checkbox">
                      <span class="symbol-label">{{ symbol.label }}</span>
                    </el-checkbox>
                  </div>
                  <div class="symbol-actions">
                    <el-tooltip content="自定义颜色" placement="top">
                      <el-switch 
                        v-model="symbol.useCustomColor" 
                        size="small"
                        :disabled="!symbol.enabled"
                        class="custom-color-switch"
                        @change="(val) => handleCustomColorToggle(val, symbol)"
                      />
                    </el-tooltip>
                    <el-color-picker 
                      v-model="symbol.color" 
                      show-alpha 
                      size="small"
                      :disabled="!symbol.enabled || !symbol.useCustomColor"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div class="action-buttons bottom-buttons">
              <el-button type="primary" @click="saveDialogueSettings">保存设置</el-button>
              <el-button @click="resetDialogueSettings">重置设置</el-button>
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
import { Rank, InfoFilled } from '@element-plus/icons-vue'
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

// 对白高亮设置
const localDialogueHighlight = ref({
  defaultColor: '#e198b8',
  allowNewLine: true,
  allowNoEnd: false,
  symbols: []
})

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

  // 初始化对白高亮设置
  if (editorStore.editorSettings.dialogueHighlight) {
    localDialogueHighlight.value = JSON.parse(JSON.stringify(editorStore.editorSettings.dialogueHighlight))
    
    // 确保加载时，未开启自定义配色的符号颜色与默认颜色一致
    if (localDialogueHighlight.value.symbols) {
      localDialogueHighlight.value.symbols.forEach(symbol => {
        if (!symbol.useCustomColor) {
          symbol.color = localDialogueHighlight.value.defaultColor
        }
      })
    }
  }
}

// 监听默认高亮颜色变化，同步更新未开启自定义配色的符号
watch(() => localDialogueHighlight.value.defaultColor, (newColor) => {
  if (localDialogueHighlight.value.symbols) {
    localDialogueHighlight.value.symbols.forEach(symbol => {
      // 如果没有开启自定义颜色，则跟随默认颜色改变
      if (!symbol.useCustomColor) {
        symbol.color = newColor
      }
    })
  }
})

// 处理单个符号自定义颜色开关切换
const handleCustomColorToggle = (val, symbol) => {
  // 如果关闭了自定义颜色，则立即回退到当前的默认高亮颜色
  if (!val) {
    symbol.color = localDialogueHighlight.value.defaultColor
  }
}

// 保存对白高亮设置
const saveDialogueSettings = () => {
  editorStore.saveEditorSettings({
    dialogueHighlight: localDialogueHighlight.value
  })
  ElMessage.success('对白高亮设置已保存')
}

// 重置对白高亮设置
const resetDialogueSettings = () => {
  localDialogueHighlight.value = {
    defaultColor: '#e198b8', // 默认高亮颜色设置为 #e198b8
    allowNewLine: true, // 允许换行
    allowNoEnd: false, // 不允许无结束符
    symbols: [
      { id: 1, label: '“”', start: '“', end: '”', enabled: true, color: '#e198b8', useCustomColor: false }, // 双引号，默认不开启自定义颜色
      { id: 2, label: '‘’', start: '‘', end: '’', enabled: true, color: '#e198b8', useCustomColor: false }, // 单引号
      { id: 3, label: '『』', start: '『', end: '』', enabled: true, color: '#e198b8', useCustomColor: false }, // 括号
      { id: 4, label: '「」', start: '「', end: '」', enabled: true, color: '#e198b8', useCustomColor: false }, // 方括号
      { id: 5, label: '（）', start: '（', end: '）', enabled: true, color: '#e198b8', useCustomColor: false }, // 圆括号
      { id: 6, label: '〈〉', start: '〈', end: '〉', enabled: true, color: '#e198b8', useCustomColor: false }, // 尖括号
      { id: 7, label: '《》', start: '《', end: '》', enabled: true, color: '#e198b8', useCustomColor: false }, // 书名号
      { id: 8, label: '()', start: '(', end: ')', enabled: true, color: '#e198b8', useCustomColor: false }, // 英文圆括号
      { id: 9, label: '[]', start: '[', end: ']', enabled: true, color: '#e198b8', useCustomColor: false }, // 英文方括号
      { id: 10, label: '{}', start: '{', end: '}', enabled: true, color: '#e198b8', useCustomColor: false }, // 英文花括号
      { id: 11, label: '【】', start: '【', end: '】', enabled: true, color: '#e198b8', useCustomColor: false }, // 粗括号
      { id: 12, label: '〔〕', start: '〔', end: '〕', enabled: true, color: '#e198b8', useCustomColor: false }, // 龟甲号
      { id: 13, label: '""', start: '"', end: '"', enabled: true, color: '#e198b8', useCustomColor: false }, // 英文双引号
      { id: 14, label: "''", start: "'", end: "'", enabled: true, color: '#e198b8', useCustomColor: false } // 英文单引号
    ]
  }
  ElMessage.info('对白高亮设置已重置') // 提示重置成功
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
  padding: 0 10px; /* 设置内边距 */
  display: flex; /* 使用弹性布局 */
  flex-direction: column; /* 垂直排列 */
  height: 100%; /* 占满高度 */
}

.formatting-tip {
  margin-bottom: 15px; /* 设置底部外边距 */
}

.rules-list {
  flex: 1; /* 占据剩余空间 */
  overflow-y: auto; /* 允许垂直滚动 */
  border: 1px solid var(--border-color); /* 设置边框颜色 */
  background-color: var(--bg-primary); /* 设置背景颜色 */
  border-radius: 4px; /* 设置圆角 */
  padding: 5px; /* 设置内边距 */
}

.rule-item {
  display: flex; /* 使用弹性布局 */
  align-items: center; /* 垂直居中 */
  padding: 8px 10px; /* 设置内边距 */
  border-bottom: 1px solid var(--border-color-soft); /* 设置底部边框 */
  background-color: var(--bg-primary); /* 设置背景颜色 */
  transition: background-color 0.2s; /* 设置背景颜色过渡效果 */
  color: var(--text-base); /* 设置文字颜色 */
}

.rule-item:last-child {
  border-bottom: none; /* 最后一个项移除底部边框 */
}

.rule-item:hover {
  background-color: var(--bg-mute); /* 悬浮时改变背景颜色 */
}

.drag-handle {
  cursor: move; /* 设置鼠标样式为移动 */
  margin-right: 10px; /* 设置右侧外边距 */
  color: var(--text-gray); /* 设置颜色 */
  display: flex; /* 使用弹性布局 */
  align-items: center; /* 垂直居中 */
}

.drag-handle:hover {
  color: var(--accent-color); /* 悬浮时改变颜色 */
}

.rule-checkbox {
  flex: 1; /* 占据剩余空间 */
  margin-right: 0 !important; /* 移除右侧外边距 */
  height: auto !important; /* 高度自适应 */
}

:deep(.el-checkbox__label) {
  white-space: normal; /* 允许文字换行 */
  line-height: 1.5; /* 设置行高 */
  color: var(--text-base); /* 设置文字颜色 */
}

.action-buttons {
  margin: 10px 0; /* 设置上下外边距 */
  text-align: center; /* 文字居中 */
  padding: 15px 0; /* 设置上下内边距 */
  border-top: 1px solid #EBEEF5; /* 设置顶部边框 */
}

.action-buttons.top-buttons {
  margin-top: 0; /* 顶部按钮移除上外边距 */
  border-top: none; /* 顶部按钮移除上边框 */
  border-bottom: 1px solid #EBEEF5; /* 顶部按钮添加下边框 */
  padding-bottom: 15px; /* 设置下内边距 */
}

.action-buttons.bottom-buttons {
  margin-bottom: 0; /* 底部按钮移除下外边距 */
  padding-top: 15px; /* 设置上内边距 */
}

.action-buttons .el-button {
  margin: 0 10px; /* 设置左右外边距 */
}

/* 对白高亮设置样式 */
.dialogue-highlight-settings {
  padding: 0 10px; /* 设置内边距 */
  display: flex; /* 使用弹性布局 */
  flex-direction: column; /* 垂直排列 */
  height: 100%; /* 占满高度 */
  overflow: hidden; /* 隐藏溢出内容 */
}

.scroll-content {
  flex: 1; /* 占据剩余空间 */
  overflow-y: auto; /* 允许垂直滚动 */
  padding-right: 5px; /* 设置右侧内边距 */
}

.setting-group {
  background-color: var(--bg-primary); /* 设置背景颜色 */
  border: 1px solid var(--border-color); /* 设置边框颜色 */
  border-radius: 8px; /* 设置圆角 */
  padding: 15px; /* 设置内边距 */
  margin-bottom: 20px; /* 设置下外边距 */
}

.setting-item {
  display: flex; /* 使用弹性布局 */
  align-items: center; /* 垂直居中 */
  justify-content: space-between; /* 两端对齐 */
  padding: 10px 0; /* 设置上下内边距 */
  border-bottom: 1px solid var(--border-color-soft); /* 设置底部边框 */
}

.setting-item:last-child {
  border-bottom: none; /* 最后一个项移除底部边框 */
}

.setting-item .label {
  font-size: 14px; /* 设置字体大小 */
  color: var(--text-base); /* 设置文字颜色 */
  display: flex; /* 使用弹性布局 */
  align-items: center; /* 垂直居中 */
  gap: 8px; /* 设置间距 */
}

.info-icon {
  font-size: 14px; /* 设置字体大小 */
  color: var(--text-gray); /* 设置颜色 */
  cursor: help; /* 设置鼠标样式为帮助 */
}

.symbols-list-header {
  display: flex; /* 使用弹性布局 */
  align-items: center; /* 垂直居中 */
  justify-content: space-between; /* 两端对齐 */
  margin-bottom: 10px; /* 设置底部外边距 */
  font-size: 14px; /* 设置字体大小 */
  font-weight: bold; /* 设置字体加粗 */
  color: var(--text-base); /* 设置文字颜色 */
}

.symbols-list-header .tip {
  font-size: 12px; /* 设置字体大小 */
  font-weight: normal; /* 设置字体粗细为正常 */
  color: var(--text-gray); /* 设置颜色 */
}

.symbols-list {
  display: grid; /* 使用网格布局 */
  grid-template-columns: repeat(2, 1fr); /* 两列平分 */
  gap: 10px; /* 设置间距 */
  background-color: var(--bg-primary); /* 设置背景颜色 */
  border: 1px solid var(--border-color); /* 设置边框颜色 */
  border-radius: 8px; /* 设置圆角 */
  padding: 15px; /* 设置内边距 */
  margin-bottom: 20px; /* 设置底部外边距 */
}

.symbol-item {
  display: flex; /* 使用弹性布局 */
  align-items: center; /* 垂直居中 */
  justify-content: space-between; /* 两端对齐 */
  padding: 8px; /* 设置内边距 */
  background-color: var(--bg-mute); /* 设置背景颜色 */
  border-radius: 4px; /* 设置圆角 */
}

.symbol-info {
  display: flex; /* 使用弹性布局 */
  align-items: center; /* 垂直居中 */
}

.symbol-label {
  font-size: 16px; /* 设置字体大小 */
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif; /* 设置字体族 */
}

.symbol-actions {
  display: flex; /* 使用弹性布局 */
  align-items: center; /* 垂直居中 */
  gap: 8px; /* 设置间距 */
}

.custom-color-switch {
  margin-right: 4px; /* 设置右侧外边距 */
}
</style>
