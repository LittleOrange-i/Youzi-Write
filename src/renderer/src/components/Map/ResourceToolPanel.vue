<template>
  <Transition name="fade">
    <div v-if="visible" ref="panelRef" class="resource-tool-panel-wrapper" @click.stop>
      <div class="resource-tool-panel">
        <div class="resource-grid">
          <div
            v-for="(resource, index) in resources"
            :key="index"
            class="resource-item"
            @click="handleResourceSelect(resource)"
            @mousedown="handleResourceMouseDown(resource, $event)"
          >
            <SvgIcon :name="resource.icon" :size="32" />
            <span class="resource-name">{{ resource.name }}</span>
          </div>
          <!-- 导入本地图片按钮 -->
          <div class="resource-item import-item" @click="triggerImport">
            <div class="import-icon-wrapper"> <!-- 图标包装容器 -->
              <svg t="1769826240531" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="13124" width="32" height="32"> <!-- SVG 图标开始 -->
                <path d="M774 896H250c-100.7 0-182.6-81.9-182.6-182.6V310.6C67.4 209.9 149.3 128 250 128h524c100.7 0 182.6 81.9 182.6 182.6v402.8C956.6 814.1 874.7 896 774 896zM250 191.5c-65.7 0-119.1 53.4-119.1 119.1v402.8c0 65.7 53.4 119.1 119.1 119.1h524c65.7 0 119.1-53.4 119.1-119.1V310.6c0-65.7-53.4-119.1-119.1-119.1H250z" fill="currentColor" p-id="13125"></path> <!-- 路径 1：图标外框 -->
                <path d="M375.2 519.6c-83.5 0-151.5-67.8-151.5-151.2s68-151.2 151.5-151.2S526.7 285 526.7 368.4s-68 151.2-151.5 151.2z m0-238.9c-48.5 0-88 39.3-88 87.7 0 48.4 39.5 87.7 88 87.7s87.9-39.3 87.9-87.7c0-48.4-39.4-87.7-87.9-87.7zM130.9 826.7c-8.1 0-16.2-3.1-22.4-9.2-12.5-12.4-12.5-32.5-0.1-44.9l187.3-188.3c10.6-10.6 27.1-12.4 39.7-4.3L528 703.6l211.6-255.8c6.2-7.5 15.6-12 25.4-11.5 9.8 0.3 18.9 5.1 24.7 12.9l159 216.6c10.4 14.1 7.3 34-6.8 44.4-14.2 10.4-34 7.3-44.4-6.8L762.4 519.5 558.9 765.6c-10.3 12.4-28.1 15.1-41.6 6.5L322.6 647.2 153.4 817.4c-6.2 6.2-14.4 9.3-22.5 9.3z" fill="currentColor" p-id="13126"></path> <!-- 路径 2：图标内部图案 -->
              </svg> <!-- SVG 图标结束 -->
            </div> <!-- 图标包装容器结束 -->
            <span class="resource-name">导入图片</span>
          </div>
        </div>
        <!-- 隐藏的文件输入框，限制格式为 jpg, png, webp -->
        <input
          ref="fileInputRef"
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          style="display: none"
          @change="handleFileChange"
        />
        <div class="resource-tip">可拖拽任意资源图标到画布中</div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import SvgIcon from '../SvgIcon.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['resource-select', 'resource-mousedown', 'update:visible'])

const panelRef = ref(null)
const fileInputRef = ref(null) // 文件输入框引用

// 资源数据定义在组件内部，使用图标资源
const resources = [
  { name: '宫殿', icon: 'gongdian' },
  { name: '村庄', icon: 'cunzhuang' },
  { name: '房屋', icon: 'fangwu' },
  { name: '森林', icon: 'senlin' },
  { name: '山', icon: 'shanmai' },
  { name: '城市', icon: 'chengshi' },
  { name: '战场', icon: 'zhanchang' },
  { name: '城堡', icon: 'chengbao' },
  { name: '湖泊', icon: 'hubo' },
  { name: '沙漠', icon: 'shamo' }
]

// 触发文件选择
function triggerImport() {
  fileInputRef.value?.click() // 点击隐藏的文件输入框
}

// 处理文件选择
function handleFileChange(event) {
  const file = event.target.files?.[0] // 获取选中的第一个文件
  if (!file) return // 如果没有选择文件则返回

  // 校验文件格式
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    alert('仅支持 jpg, png, webp 格式的图片') // 格式不正确提示
    return
  }

  const reader = new FileReader() // 创建文件读取器
  reader.onload = (e) => {
    const url = e.target.result // 获取文件的 base64 编码
    
    // 创建图片对象以获取原始尺寸
    const img = new Image()
    img.onload = () => {
      // 模拟资源对象
      const resource = {
        name: file.name.split('.')[0], // 使用文件名作为资源名称
        url: url, // 图片的 base64 地址
        isLocal: true, // 标记为本地导入资源
        width: img.width, // 图片原始宽度
        height: img.height, // 图片原始高度
        aspectRatio: img.width / img.height // 计算纵横比
      }
      // 选中资源
      handleResourceSelect(resource)
    }
    img.src = url

    // 重置文件输入框，以便下次选择同一文件也能触发 change
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
  reader.readAsDataURL(file) // 以 DataURL 格式读取文件内容
}

// 点击外部关闭弹出层
function handleClickOutside(event) {
  if (props.visible && panelRef.value && !panelRef.value.contains(event.target)) {
    emit('update:visible', false)
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function handleResourceSelect(resource) {
  emit('resource-select', resource)
}

function handleResourceMouseDown(resource, event) {
  // 拖拽时立即关闭弹框
  emit('update:visible', false)
  emit('resource-mousedown', resource, event)
}
</script>

<style lang="scss" scoped>
.resource-tool-panel-wrapper {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  pointer-events: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
}

.resource-tool-panel {
  background: #ffffff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 420px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  margin-bottom: 8px;
}

.resource-tip {
  text-align: center;
  font-size: 12px;
  color: #909399;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
  margin-top: 8px;
}

.resource-item {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  padding: 8px 4px;
  border-radius: 6px;

  &:hover {
    background-color: rgba(64, 158, 255, 0.08);
  }

  &.import-item {
    border: 1px dashed #dcdfe6; // 虚线边框表示可导入
    &:hover {
      border-color: #409eff; // 悬浮时边框颜色变化
      background-color: rgba(64, 158, 255, 0.04);
    }
    .import-icon-wrapper {
      color: #909399; // 图标默认颜色
    }
    &:hover .import-icon-wrapper {
      color: #409eff; // 悬浮时图标颜色变化
    }
  }

  .resource-name {
    text-align: center;
    word-break: break-word;
    font-size: 12px;
    color: #606266;
  }
}
</style>
