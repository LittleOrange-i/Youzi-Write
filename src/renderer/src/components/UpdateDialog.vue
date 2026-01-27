<template>
  <el-dialog
    v-model="dialogVisible"
    :title="downloaded ? '更新准备就绪' : '发现新版本'"
    width="500px"
    align-center
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="!downloading"
    append-to-body
  >
    <div v-if="!downloading && !downloaded">
      <div class="flex items-center gap-4 mb-4">
        <div class="bg-primary-100 p-3 rounded-full text-primary-600">
          <el-icon class="text-2xl"><Upload /></el-icon>
        </div>
        <div>
          <div class="text-lg font-bold text-gray-800">{{ versionInfo?.version }}</div>
          <div class="text-sm text-gray-500">当前版本: v{{ currentVersion }} （温馨提示，更新版本前请保存文稿）</div>
        </div>
      </div>
      

      
      <div class="flex justify-end gap-3">
        <el-button @click="handleClose">暂不更新</el-button>
        <el-button type="primary" @click="startDownload">立即更新</el-button>
      </div>
    </div>

    <div v-else-if="downloading" class="py-6">
      <div class="text-center mb-4 text-gray-700 font-medium">正在下载更新...</div>
      <el-progress 
        :percentage="Number(progress.toFixed(2))" 
        :stroke-width="12" 
        striped 
        striped-flow 
        :duration="10"
      />
      <div class="text-center mt-2 text-sm text-gray-500">{{ progress.toFixed(2) }}%</div>
      <div class="text-center mt-6 text-xs text-gray-400">下载过程请勿关闭程序</div>
    </div>

    <div v-else-if="downloaded" class="py-4">
      <div class="text-center mb-6">
        <el-icon class="text-5xl text-green-500 mb-3"><CircleCheckFilled /></el-icon>
        <div class="text-lg font-medium text-gray-800">下载完成</div>
        <div class="text-sm text-gray-500 mt-1">更新已准备就绪，安装将重启应用</div>
      </div>
      <div class="flex justify-center">
        <el-button type="primary" size="large" @click="installUpdate" class="w-full">立即重启安装</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Upload, CircleCheckFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: Boolean,
  versionInfo: Object,
  currentVersion: String
})

const emit = defineEmits(['update:modelValue', 'ignore'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => {
    if (!downloading.value) {
      emit('update:modelValue', val)
    }
  }
})

const downloading = ref(false)
const downloaded = ref(false)
const progress = ref(0)
const downloadedFilePath = ref('')

function handleClose() {
  dialogVisible.value = false
  emit('ignore')
}

function startDownload() {
  if (!props.versionInfo?.downloadUrl) {
    ElMessage.error('无法获取下载链接')
    return
  }
  
  downloading.value = true
  progress.value = 0
  
  // 开始下载
  window.electron.startDownloadUpdate(props.versionInfo.downloadUrl, props.versionInfo.fileName)
}

// 安装更新并重启
function installUpdate() {
  // 检查已下载文件的路径是否存在
  if (downloadedFilePath.value) {
    // 调用主进程的安装更新接口，传入安装包路径
    window.electron.installUpdate(downloadedFilePath.value)
  }
}

// 监听下载事件
if (window.electron) {
  window.electron.onDownloadProgress((percent) => {
    progress.value = percent
  })
  
  window.electron.onUpdateDownloaded((filePath) => {
    downloading.value = false
    downloaded.value = true
    downloadedFilePath.value = filePath
  })
  
  window.electron.onUpdateError((error) => {
    downloading.value = false
    ElMessage.error(`更新失败: ${error}`)
  })
}
</script>
