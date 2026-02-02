<template> <!-- 模板开始 -->
  <div class="editor-drawer-content"> <!-- 侧边抽屉主内容容器 -->
    <div class="drawer-header"> <!-- 抽屉顶部菜单栏 -->
      <el-tabs v-model="activeTab" class="menu-tabs"> <!-- 使用 Element Plus 标签页作为菜单 -->

        <el-tab-pane label="网格线条" name="grid" /> <!-- 网格线条标签页 -->
        <el-tab-pane label="回收站" name="recycle" /> <!-- 回收站标签页 -->
      </el-tabs> <!-- 标签页结束 -->
    </div> <!-- 顶部菜单栏结束 -->

    <div class="drawer-body"> <!-- 抽屉功能区域 -->
      <!-- 网格线条功能区 -->
      <div v-if="activeTab === 'grid'" class="grid-settings"> <!-- 仅在选中网格线条时显示 -->
        <!-- ... 原有内容 ... -->
        <!-- 线条设置部分 -->
        <div class="settings-section"> <!-- 设置区块 -->
          <div class="section-header"> <!-- 区块标题栏 -->
            <span>线条设置</span> <!-- 区块名称 -->
            <div class="header-actions"> <!-- 标题栏操作按钮 -->
              <el-icon class="action-btn" title="重置" @click="resetGridSettings"><RefreshRight /></el-icon> <!-- 重置按钮 -->
              <el-icon class="action-btn" :class="{ collapsed: isSettingsCollapsed }" @click="isSettingsCollapsed = !isSettingsCollapsed"> <!-- 折叠按钮 -->
                <ArrowDown /> <!-- 向下箭头图标 -->
              </el-icon> <!-- 折叠按钮结束 -->
            </div> <!-- 操作按钮结束 -->
          </div> <!-- 标题栏结束 -->

          <el-collapse-transition> <!-- 折叠动画包裹 -->
            <div v-show="!isSettingsCollapsed" class="section-content"> <!-- 区块内容 -->
              <el-checkbox v-model="gridLines.stickToBottom" @change="saveSettings">线条紧贴文本底部</el-checkbox> <!-- 紧贴底部复选框 -->
              <el-checkbox v-model="gridLines.boldSize" @change="saveSettings">线条尺寸加粗显示</el-checkbox> <!-- 加粗显示复选框 -->
            </div> <!-- 内容结束 -->
          </el-collapse-transition> <!-- 动画结束 -->
        </div> <!-- 设置区块结束 -->

        <!-- 线条类型部分 -->
        <div class="settings-section"> <!-- 类型区块 -->
          <div class="section-header"> <!-- 区块标题栏 -->
            <span>线条类型</span> <!-- 区块名称 -->
            <el-icon class="action-btn" :class="{ collapsed: isTypeCollapsed }" @click="isTypeCollapsed = !isTypeCollapsed"> <!-- 折叠按钮 -->
              <ArrowDown /> <!-- 向下箭头图标 -->
            </el-icon> <!-- 折叠按钮结束 -->
          </div> <!-- 标题栏结束 -->

          <el-collapse-transition> <!-- 折叠动画包裹 -->
            <div v-show="!isTypeCollapsed" class="section-content"> <!-- 区块内容 -->
              <div class="type-grid"> <!-- 类型网格布局 -->
                <div 
                  v-for="type in lineTypes" 
                  :key="type.value" 
                  class="type-item" 
                  :class="{ active: gridLines.enabled && gridLines.lineType === type.value }"
                  @click="handleTypeSelect(type.value)"
                > <!-- 循环渲染类型项 -->
                  <div class="type-preview" :class="type.value"> <!-- 类型预览图标 -->
                    <div v-if="type.value === 'single-solid'" class="line single-solid"></div> <!-- 单行实线预览 -->
                    <div v-if="type.value === 'double-solid'" class="line double-solid"> <!-- 双行实线预览 -->
                      <div class="sub-line"></div> <!-- 第一行 -->
                      <div class="sub-line"></div> <!-- 第二行 -->
                    </div> <!-- 双行结束 -->
                    <div v-if="type.value === 'sparse-dashed'" class="line sparse-dashed"></div> <!-- 稀疏虚线预览 -->
                    <div v-if="type.value === 'dense-dashed'" class="line dense-dashed"></div> <!-- 密集虚线预览 -->
                  </div> <!-- 预览结束 -->
                  <div class="type-label">{{ type.label }}</div> <!-- 类型名称 -->
                </div> <!-- 项结束 -->
              </div> <!-- 网格结束 -->
              <div class="type-hint">*点击选中类型，再次点击取消</div> <!-- 操作提示 -->
            </div> <!-- 内容结束 -->
          </el-collapse-transition> <!-- 动画结束 -->
        </div> <!-- 类型区块结束 -->

        <!-- 线条颜色部分 -->
        <div class="settings-section"> <!-- 颜色区块 -->
          <div class="section-header"> <!-- 区块标题栏 -->
            <span>线条颜色</span> <!-- 区块名称 -->
            <el-icon class="action-btn" :class="{ collapsed: isColorCollapsed }" @click="isColorCollapsed = !isColorCollapsed"> <!-- 折叠按钮 -->
              <ArrowDown /> <!-- 向下箭头图标 -->
            </el-icon> <!-- 折叠按钮结束 -->
          </div> <!-- 标题栏结束 -->

          <el-collapse-transition> <!-- 折叠动画包裹 -->
            <div v-show="!isColorCollapsed" class="section-content"> <!-- 区块内容 -->
              <div class="color-palette"> <!-- 调色盘容器 -->
                <!-- 预设颜色 -->
                <div 
                  v-for="color in presetColors" 
                  :key="color" 
                  class="color-item" 
                  :style="{ backgroundColor: color }"
                  :class="{ active: gridLines.lineColor === color }"
                  @click="selectColor(color)"
                > <!-- 循环渲染预设颜色 -->
                  <el-icon v-if="gridLines.lineColor === color"><Check /></el-icon> <!-- 选中标记 -->
                </div> <!-- 预设项结束 -->

                <!-- 自定义颜色 -->
                <div 
                  v-for="(color, index) in gridLines.customColors" 
                  :key="index" 
                  class="color-item" 
                  :style="{ backgroundColor: color }"
                  :class="{ active: gridLines.lineColor === color }"
                  @click="selectColor(color)"
                  @contextmenu.prevent="removeCustomColor(index)"
                > <!-- 循环渲染自定义颜色 -->
                  <el-icon v-if="gridLines.lineColor === color"><Check /></el-icon> <!-- 选中标记 -->
                </div> <!-- 自定义项结束 -->

                <!-- 添加自定义颜色按钮 -->
                <div class="color-item add-color" @click="triggerColorPicker"> <!-- 添加按钮 -->
                  <el-icon><Plus /></el-icon> <!-- 加号图标 -->
                  <input 
                    ref="colorPicker" 
                    type="color" 
                    class="hidden-color-picker" 
                    @change="addCustomColor" 
                  /> <!-- 隐藏的原生颜色选择器 -->
                </div> <!-- 添加按钮结束 -->
              </div> <!-- 调色盘结束 -->
              <div class="type-hint">*右键删除自定义线条颜色</div> <!-- 操作提示 -->
            </div> <!-- 内容结束 -->
          </el-collapse-transition> <!-- 动画结束 -->
        </div> <!-- 颜色区块结束 -->
      </div> <!-- 网格功能区结束 -->

      <!-- 回收站功能区 -->
      <div v-else-if="activeTab === 'recycle'" class="recycle-settings"> <!-- 仅在选中回收站时显示 -->
        <div v-loading="loading" class="recycle-bin-container"> <!-- 列表容器 -->
          <div v-if="snapshots.length === 0" class="empty-state"> <!-- 无数据 -->
            <el-empty description="暂无历史快照 (每30秒自动保存一次)" /> <!-- 空提示 -->
          </div> <!-- 判断结束 -->
          <div v-else class="snapshot-list"> <!-- 快照列表 -->
            <div 
              v-for="item in snapshots" 
              :key="item.timestamp" 
              class="snapshot-item"
            > <!-- 循环快照项 -->
              <div class="snapshot-info"> <!-- 信息 -->
                <span class="time">{{ item.timeStr }}</span> <!-- 时间 -->
              </div> <!-- 结束 -->
              <div class="snapshot-actions"> <!-- 操作 -->
                <el-button 
                  type="primary" 
                  link 
                  @click="viewDiff(item)"
                > <!-- 对比按钮 -->
                  对比
                </el-button> <!-- 结束 -->
                <el-button 
                  type="success" 
                  link 
                  @click="restoreSnapshot(item)"
                > <!-- 还原按钮 -->
                  还原
                </el-button> <!-- 结束 -->
              </div> <!-- 结束 -->
            </div> <!-- 循环结束 -->
          </div> <!-- 列表结束 -->
        </div> <!-- 容器结束 -->

        <!-- 差异对比弹窗容器 -->
        <el-dialog
          v-model="diffDialogVisible"
          title="版本差异对比"
          width="80%"
          top="5vh"
          append-to-body
          class="diff-dialog"
        > <!-- 差异对比对话框 -->
          <div v-loading="diffLoading" class="diff-viewer"> <!-- 差异查看器主体 -->
            <div class="diff-legend"> <!-- 图例颜色说明栏 -->
              <span class="legend-item current">保持不变</span> <!-- 保持不变 -->
              <span class="legend-item added">当前新增</span> <!-- 新增 -->
              <span class="legend-item removed">当前缺失</span> <!-- 缺失 -->
            </div> <!-- 结束 -->
            <div class="diff-content"> <!-- 差异内容展示区 -->
              <span 
                v-for="(change, index) in diffChanges" 
                :key="index"
                :class="{ 
                  'diff-added': change.added, 
                  'diff-removed': change.removed 
                }"
              > <!-- 应用差异样式 -->
                {{ change.value }} <!-- 内容 -->
              </span> <!-- 循环结束 -->
            </div> <!-- 内容区结束 -->
          </div> <!-- 主体结束 -->
          <template #footer> <!-- 底部操作 -->
            <div class="dialog-footer"> <!-- 容器 -->
              <el-button @click="diffDialogVisible = false">关闭</el-button> <!-- 关闭 -->
              <el-button type="success" @click="restoreSnapshot(selectedSnapshot)">还原此版本</el-button> <!-- 还原 -->
            </div> <!-- 容器结束 -->
          </template> <!-- 底部结束 -->
        </el-dialog> <!-- 对话框结束 -->
      </div> <!-- 回收站功能区结束 -->

      <!-- 其他功能区占位 -->
      <div v-else class="placeholder-content"> <!-- 占位内容容器 -->
        <el-empty :description="`正在开发中...`" /> <!-- 暂未开放提示 -->
      </div> <!-- 占位内容结束 -->
    </div> <!-- 功能区域结束 -->
  </div> <!-- 主容器结束 -->
</template> <!-- 模板结束 -->

<script setup>
import { ref, computed, onMounted, watch } from 'vue' // 导入 Vue 核心 API
import { RefreshRight, ArrowDown, Check, Plus } from '@element-plus/icons-vue' // 导入图标
import { useEditorStore } from '@renderer/stores/editor' // 导入编辑器 store
import { useRoute } from 'vue-router' // 导入路由
import { ElMessage, ElMessageBox } from 'element-plus' // 导入 Element Plus
import * as diff from 'diff' // 导入差异对比库

const editorStore = useEditorStore() // 获取 store 实例
const route = useRoute() // 获取路由实例

const props = defineProps({ // 定义组件属性
  bookName: { // 书籍名称
    type: String, // 类型
    default: '' // 默认值
  } // 结束
}) // 结束

const emit = defineEmits(['restore']) // 定义事件

const activeTab = ref('grid') // 当前选中的标签页，默认选中网格线条

// 回收站相关状态
const snapshots = ref([]) // 快照列表
const loading = ref(false) // 加载状态
const diffLoading = ref(false) // 差异加载状态
const diffDialogVisible = ref(false) // 差异对话框显示
const diffChanges = ref([]) // 差异内容
const selectedSnapshot = ref(null) // 选中的快照

// 获取书名（优先从 props 获取，其次从路由获取）
const currentBookName = computed(() => props.bookName || route.query.name)

// 获取快照列表
async function fetchSnapshots() {
  if (!currentBookName.value || !editorStore.file) return
  
  loading.value = true
  try {
    const params = {
      bookName: currentBookName.value,
      type: editorStore.file.type
    }

    if (editorStore.file.type === 'chapter') {
      params.volumeName = editorStore.file.volume
      params.chapterName = editorStore.file.name
    } else {
      params.notebookName = editorStore.file.notebook
      params.noteName = editorStore.file.name
    }

    const result = await window.electron.getRecycleBinSnapshots(params)
    if (result.success) {
      snapshots.value = result.snapshots || []
    }
  } catch (error) {
    console.error('获取快照列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 查看差异
async function viewDiff(snapshot) {
  diffLoading.value = true
  selectedSnapshot.value = snapshot
  try {
    const result = await window.electron.readRecycleBinSnapshot({
      bookName: currentBookName.value,
      fileName: snapshot.fileName
    })

    if (result.success) {
      const oldContent = result.content
      let currentContent = editorStore.content
      diffChanges.value = diff.diffChars(oldContent, currentContent)
      diffDialogVisible.value = true
    } else {
      ElMessage.error('读取快照内容失败')
    }
  } catch (error) {
    console.error('查看差异失败:', error)
  } finally {
    diffLoading.value = false
  }
}

// 还原快照
async function restoreSnapshot(snapshot) {
  try {
    await ElMessageBox.confirm(
      '确定要还原到该版本的快照吗？当前未保存的内容将会被覆盖。',
      '还原快照',
      {
        confirmButtonText: '确定还原',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const result = await window.electron.readRecycleBinSnapshot({
      bookName: currentBookName.value,
      fileName: snapshot.fileName
    })

    if (result.success) {
      emit('restore', result.content)
      ElMessage.success('已成功还原到选定版本')
    } else {
      ElMessage.error('还原快照失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('还原快照失败:', error)
    }
  }
}

// 监听标签切换
watch(activeTab, (val) => {
  if (val === 'recycle') {
    fetchSnapshots()
  }
})

// 监听文件变化
watch(() => editorStore.file, () => {
  if (activeTab.value === 'recycle') {
    fetchSnapshots()
  }
})

// 线条设置折叠状态
const isSettingsCollapsed = ref(false) // 设置区块折叠状态
const isTypeCollapsed = ref(false) // 类型区块折叠状态
const isColorCollapsed = ref(false) // 颜色区块折叠状态

// 线条类型定义
const lineTypes = [ // 线条类型列表
  { label: '单行实线', value: 'single-solid' }, // 单行实线配置
  { label: '双行实线', value: 'double-solid' }, // 双行实线配置
  { label: '稀疏虚线', value: 'sparse-dashed' }, // 稀疏虚线配置
  { label: '密集虚线', value: 'dense-dashed' } // 密集虚线配置
] // 结束列表

// 预设颜色定义
const presetColors = ['#000000', '#ffffff', '#d2c2b2', '#c1e4d1'] // 黑色, 白色, 浅褐, 浅绿

// 网格线条配置引用
const gridLines = computed(() => editorStore.editorSettings.gridLines) // 从 store 获取配置

// 处理类型选择
function handleTypeSelect(type) { // 定义类型选择处理函数
  if (gridLines.value.enabled && gridLines.value.lineType === type) { // 如果已选中且再次点击
    gridLines.value.enabled = false // 取消启用
  } else { // 否则
    gridLines.value.enabled = true // 启用
    gridLines.value.lineType = type // 设置类型
  } // 结束判断
  saveSettings() // 保存设置
} // 结束函数

// 选择颜色
function selectColor(color) { // 定义颜色选择函数
  gridLines.value.lineColor = color // 设置颜色
  saveSettings() // 保存设置
} // 结束函数

// 触发颜色选择器
const colorPicker = ref(null) // 颜色选择器 input 引用
function triggerColorPicker() { // 定义触发函数
  colorPicker.value.click() // 模拟点击 input
} // 结束函数

// 添加自定义颜色
function addCustomColor(event) { // 定义添加颜色函数
  const color = event.target.value // 获取选择的颜色
  if (!gridLines.value.customColors.includes(color)) { // 如果不存在该颜色
    gridLines.value.customColors.push(color) // 添加到列表
    gridLines.value.lineColor = color // 设为当前颜色
    saveSettings() // 保存设置
  } // 结束判断
} // 结束函数

// 删除自定义颜色
function removeCustomColor(index) { // 定义删除颜色函数
  gridLines.value.customColors.splice(index, 1) // 从列表中移除
  saveSettings() // 保存设置
} // 结束函数

// 重置设置
function resetGridSettings() { // 定义重置设置函数
  gridLines.value.enabled = false // 禁用
  gridLines.value.stickToBottom = false // 不紧贴底部
  gridLines.value.boldSize = false // 不加粗
  gridLines.value.lineType = 'single-solid' // 默认类型
  gridLines.value.lineColor = '#e0e0e0' // 默认颜色
  saveSettings() // 保存设置
} // 结束函数

// 保存设置到 store
function saveSettings() { // 定义保存设置函数
  editorStore.saveEditorSettings({ // 调用 store 方法保存
    gridLines: JSON.parse(JSON.stringify(gridLines.value)) // 序列化后保存
  }) // 结束保存
} // 结束函数

onMounted(() => { // 挂载钩子
  // 初始化时确保配置存在
  if (!editorStore.editorSettings.gridLines) { // 如果配置不存在
    editorStore.editorSettings.gridLines = { // 设置默认配置
      enabled: false, // 默认不启用
      stickToBottom: false, // 默认不紧贴
      boldSize: false, // 默认不加粗
      lineType: 'single-solid', // 默认实线
      lineColor: '#e0e0e0', // 默认浅灰
      customColors: [] // 默认无自定义色
    } // 结束设置
  } // 结束判断
}) // 结束钩子
</script> <!-- 脚本结束 -->

<style lang="scss" scoped> /* 样式开始 */
.editor-drawer-content { /* 内容容器样式 */
  height: 100%; /* 全高 */
  display: flex; /* 弹性布局 */
  flex-direction: column; /* 垂直排列 */
  background-color: var(--bg-primary); // 使用背景色
  color: var(--text-base); // 使用主文本色

  .drawer-header { /* 头部样式 */
    padding: 0; /* 内边距 */
    border-bottom: 1px solid var(--border-color); // 分割线
    
    :deep(.el-tabs__header) { /* 深度选择标签头部 */
      margin: 0; // 移除默认边距
    } /* 结束 */
    
    :deep(.el-tabs__nav-wrap::after) { /* 深度选择导航包装 */
      display: none; // 移除底部长线
    } /* 结束 */
  } /* 结束 */

  .drawer-body { /* 主体样式 */
    flex: 1; /* 占据剩余空间 */
    overflow-y: auto; /* 允许垂直滚动 */
    padding: 16px; /* 内边距 */

    .settings-section { /* 设置区块样式 */
      margin-bottom: 24px; /* 下边距 */

      .section-header { /* 区块头部样式 */
        display: flex; /* 弹性布局 */
        justify-content: space-between; /* 两端对齐 */
        align-items: center; /* 垂直居中 */
        margin-bottom: 16px; /* 下边距 */
        font-size: 14px; /* 字体大小 */
        color: var(--text-lighter); // 使用次级文本色

        .header-actions { /* 头部操作区样式 */
          display: flex; /* 弹性布局 */
          gap: 12px; /* 间距 */
          align-items: center; /* 垂直居中 */
        } /* 结束 */

        .action-btn { /* 操作按钮样式 */
          cursor: pointer; /* 鼠标指针 */
          transition: transform 0.3s; /* 过渡效果 */
          
          &:hover { /* 悬停效果 */
            color: var(--el-color-primary); // 悬停变色
          } /* 结束 */

          &.collapsed { /* 折叠状态样式 */
            transform: rotate(-90deg); // 折叠时旋转图标
          } /* 结束 */
        } /* 结束 */
      } /* 结束 */

      .section-content { /* 区块内容样式 */
        display: flex; /* 弹性布局 */
        flex-direction: column; /* 垂直排列 */
        gap: 12px; /* 间距 */

        :deep(.el-checkbox) { /* 深度选择复选框 */
          margin: 0; // 移除复选框默认边距
          color: var(--text-base); /* 颜色 */
        } /* 结束 */
      } /* 结束 */
    } /* 结束 */

    .type-grid { /* 类型网格布局样式 */
      display: grid; /* 网格布局 */
      grid-template-columns: 1fr 1fr; // 两列布局
      gap: 12px; /* 间距 */

      .type-item { /* 类型项样式 */
        background: var(--bg-soft); // 使用次级背景
        border: 1px solid var(--border-color); /* 边框 */
        border-radius: 4px; /* 圆角 */
        padding: 16px; /* 内边距 */
        cursor: pointer; /* 指针 */
        display: flex; /* 弹性布局 */
        flex-direction: column; /* 垂直排列 */
        align-items: center; /* 水平居中 */
        gap: 8px; /* 间距 */
        transition: all 0.2s; /* 过渡 */

        &:hover { /* 悬停 */
          border-color: var(--el-color-primary); // 悬停变色
        } /* 结束 */

        &.active { /* 激活状态 */
          border-color: var(--el-color-primary); // 激活变色
          background: var(--el-color-primary-light-9); // 激活背景
        } /* 结束 */

        .type-preview { /* 预览区样式 */
          width: 40px; /* 宽度 */
          height: 30px; /* 高度 */
          display: flex; /* 弹性 */
          align-items: center; /* 居中 */
          justify-content: center; /* 居中 */

          .line { /* 线条样式 */
            width: 100%; /* 宽度 */
            height: 2px; /* 高度 */
            background: #ccc; /* 背景 */

            &.single-solid { /* 单实线 */
              height: 2px; /* 高度 */
            } /* 结束 */

            &.double-solid { /* 双实线 */
              background: transparent; /* 背景透明 */
              display: flex; /* 弹性 */
              flex-direction: column; /* 垂直 */
              justify-content: space-between; /* 两端对齐 */
              height: 6px; /* 高度 */
              
              .sub-line { /* 子线条 */
                height: 1px; /* 高度 */
                background: #ccc; /* 背景 */
                width: 100%; /* 宽度 */
              } /* 结束 */
            } /* 结束 */

            &.sparse-dashed { /* 稀疏虚线 */
              background: transparent; /* 透明 */
              border-bottom: 2px dashed #ccc; /* 虚线边框 */
            } /* 结束 */

            &.dense-dashed { /* 密集虚线 */
              background: transparent; /* 透明 */
              border-bottom: 2px dotted #ccc; /* 点状边框 */
            } /* 结束 */
          } /* 结束 */
        } /* 结束 */

        .type-label { /* 标签样式 */
          font-size: 12px; /* 字体大小 */
          color: var(--text-secondary); /* 颜色 */
        } /* 结束 */
      } /* 结束 */
    } /* 结束 */

    .type-hint { /* 提示信息样式 */
      font-size: 12px; /* 字体大小 */
      color: var(--text-lighter); /* 颜色 */
      margin-top: 8px; /* 上边距 */
    } /* 结束 */

    .color-palette { /* 调色盘样式 */
      display: flex; /* 弹性 */
      flex-wrap: wrap; /* 换行 */
      gap: 12px; /* 间距 */

      .color-item { /* 颜色项样式 */
        width: 32px; /* 宽度 */
        height: 32px; /* 高度 */
        border-radius: 4px; /* 圆角 */
        cursor: pointer; /* 指针 */
        display: flex; /* 弹性 */
        align-items: center; /* 居中 */
        justify-content: center; /* 居中 */
        border: 1px solid var(--border-color); /* 边框 */
        transition: all 0.2s; /* 过渡 */

        &:hover { /* 悬停 */
          transform: scale(1.1); // 悬停缩放
        } /* 结束 */

        &.active { /* 激活 */
          border-color: var(--el-color-primary); // 激活变色
          border-width: 2px; /* 边框加粗 */
        } /* 结束 */

        .el-icon { /* 图标样式 */
          color: var(--el-color-primary); /* 颜色 */
          font-weight: bold; /* 加粗 */
          background: white; /* 背景 */
          border-radius: 50%; /* 圆形 */
          padding: 1px; /* 内边距 */
        } /* 结束 */

        &.add-color { /* 添加颜色按钮样式 */
          background: var(--bg-soft); /* 背景 */
          color: var(--el-color-success); /* 颜色 */
          
          .hidden-color-picker { /* 隐藏的 picker 样式 */
            display: none; // 隐藏实际的 input
          } /* 结束 */
        } /* 结束 */
      } /* 结束 */
    } /* 结束 */
  } /* 结束 */
} /* 结束 */

.recycle-bin-container { // 回收站容器样式
  height: 100%; // 高度填充
  display: flex; // 弹性布局
  flex-direction: column; // 垂直排列
  gap: 16px; // 间距
} // 结束

.snapshot-list { // 快照列表样式
  display: flex; // 弹性布局
  flex-direction: column; // 垂直排列
  gap: 12px; // 间距
} // 结束

.snapshot-item { // 快照项样式
  display: flex; // 弹性布局
  justify-content: space-between; // 两端对齐
  align-items: center; // 垂直居中
  padding: 12px; // 内边距
  background-color: var(--bg-soft); // 次级背景色
  border: 1px solid var(--border-color); // 边框
  border-radius: 8px; // 圆角
  transition: all 0.2s; // 过渡

  &:hover { // 悬停
    background-color: var(--bg-mute); // 悬停色
    border-color: var(--el-color-primary); // 边框色
  } // 结束

  .snapshot-info { // 信息样式
    .time { // 时间样式
      font-size: 14px; // 字号
      color: var(--text-base); // 主文字色
    } // 结束
  } // 结束

  .snapshot-actions { // 操作样式
    display: flex; // 弹性
    gap: 8px; // 间距
  } // 结束
} // 结束

.diff-viewer { // 差异查看器样式
  max-height: 60vh; // 最大高度
  overflow-y: auto; // 滚动
  padding: 16px; // 内边距
  background-color: var(--bg-primary); // 背景
  border-radius: 4px; // 圆角
  line-height: 1.8; // 行高
  white-space: pre-wrap; // 预格式化
  word-break: break-all; // 单词折行
  color: var(--text-base); // 文字色
} // 结束

.diff-legend { // 图例样式
  margin-bottom: 16px; // 下边距
  padding-bottom: 12px; // 下内边距
  border-bottom: 1px solid var(--border-color); // 下边框
  display: flex; // 弹性
  gap: 16px; // 间距
  font-size: 12px; // 字号

  .legend-item { // 图例项样式
    display: flex; // 弹性
    align-items: center; // 居中
    gap: 4px; // 间距

    &::before { // 前置色块
      content: ''; // 内容
      display: inline-block; // 块
      width: 12px; // 宽
      height: 12px; // 高
      border-radius: 2px; // 圆角
    } // 结束

    &.current::before { border: 1px solid var(--border-color); } // 当前色块
    &.added::before { background-color: #e6ffec; } // 新增色块
    &.removed::before { background-color: #ffeef0; } // 移除色块
  } // 结束
} // 结束

.diff-content { // 差异内容样式
  font-size: 15px; // 字号
  
  .diff-added { // 新增文本样式
    background-color: #e6ffec; // 绿底
    color: #24292e; // 黑字
  } // 结束

  .diff-removed { // 移除文本样式
    background-color: #ffeef0; // 红底
    color: #d73a49; // 红字
    text-decoration: line-through; // 删除线
  } // 结束
} // 结束

.empty-state { // 空状态样式
  padding-top: 40px; // 上边距
} // 结束
</style> <!-- 样式结束 -->

<!-- 差异对话框样式（全局） -->
<style lang="scss">
.diff-dialog { // 差异对话框样式
  .el-dialog__body { // 主体样式
    padding: 0 20px 20px 20px !important; // 内边距
  } // 结束
} // 结束
</style>
