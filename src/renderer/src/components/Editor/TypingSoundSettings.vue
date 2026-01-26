<template>
  <div class="typing-sound-settings">
    <div class="setting-item">
      <label class="setting-label">音效选择</label>
      <el-select
        v-model="localTypingSoundEffect"
        placeholder="请选择音效"
        size="default"
        style="width: 100%;"
        @change="handleSoundChange"
      >
        <el-option label="无音效" value="" />
        <el-option label="钢琴" value="gangqin" />
        <el-option label="爆裂鼓手" value="baoliegushou" />
        <el-option label="Cherry G80 3000" value="Cherry_G80_3000" />
        <el-option label="Cherry G80 3494" value="Cherry_G80_3494" />
        <el-option label="打字机" value="daziji" />
        <el-option label="剑气" value="jianqi" />
        <el-option label="机械键盘1" value="jixie1" />
        <el-option label="机械键盘2" value="jixie2" />
        <el-option label="机械键盘3" value="jixie3" />
        <el-option label="木鱼" value="muyu" />
        <el-option label="泉水" value="quanshui" />
        <el-option label="水滴" value="shuidi" />
      </el-select>
    </div>

    <div v-if="localTypingSoundEffect" class="setting-item">
      <label class="setting-label">
        音量控制 {{ localTypingSoundVolume }}%
        <span class="volume-hint">（相对于系统音量的百分比）</span>
      </label>
      <el-slider
        v-model="localTypingSoundVolume"
        :min="0"
        :max="100"
        :show-tooltip="true"
        :format-tooltip="(val) => `${val}%`"
        @change="handleVolumeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

// Props
const props = defineProps({
  typingSoundEffect: {
    type: String,
    default: ''
  },
  typingSoundVolume: {
    type: Number,
    default: 100
  }
})

// Emits
const emit = defineEmits(['update:typingSoundEffect', 'update:typingSoundVolume', 'playPreview'])

// 本地状态
const localTypingSoundEffect = ref(props.typingSoundEffect)
const localTypingSoundVolume = ref(props.typingSoundVolume)

// 监听 props 变化
watch(() => props.typingSoundEffect, (newVal) => {
  localTypingSoundEffect.value = newVal
})

watch(() => props.typingSoundVolume, (newVal) => {
  localTypingSoundVolume.value = newVal
})

// 处理音效变化
const handleSoundChange = (value) => {
  emit('update:typingSoundEffect', value)
  // 播放试听音频
  if (value) {
    emit('playPreview')
  }
}

// 处理音量变化
const handleVolumeChange = (value) => {
  emit('update:typingSoundVolume', value)
  // 播放试听音频
  if (localTypingSoundEffect.value) {
    emit('playPreview')
  }
}
</script>

<style scoped>
.typing-sound-settings {
  padding: 0;
}

.setting-item {
  margin-bottom: 24px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: block;
  font-size: 14px;
  color: #303133;
  margin-bottom: 10px;
}

.volume-hint {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}
</style>
