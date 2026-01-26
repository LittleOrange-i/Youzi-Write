<template>
  <el-dialog
    v-model="dialogVisible"
    title="更多设置"
    width="600px"
    :close-on-click-modal="false"
    class="more-settings-dialog"
    append-to-body
  >
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

      <!-- 后续可以添加更多标签页 -->
      <!-- 
      <el-tab-pane label="其他设置" name="others">
        <div style="padding: 20px;">其他设置内容</div>
      </el-tab-pane>
      -->
    </el-tabs>

    <template #footer>
      <el-button type="primary" @click="handleClose">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import TypingSoundSettings from './TypingSoundSettings.vue'

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
  }
})

// Emits
const emit = defineEmits([
  'update:modelValue',
  'update:typingSoundEffect',
  'update:typingSoundVolume',
  'playPreview'
])

// 本地状态
const dialogVisible = ref(props.modelValue)
const activeTab = ref('typingSound')

// 监听 props 变化
watch(() => props.modelValue, (newVal) => {
  dialogVisible.value = newVal
})

// 监听本地状态变化
watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal)
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

// 关闭弹窗
const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style scoped>
.more-settings-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.more-settings-dialog :deep(.el-tabs__content) {
  padding: 20px 0;
}
</style>
