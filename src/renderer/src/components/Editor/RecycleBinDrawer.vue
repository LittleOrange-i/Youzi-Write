<script setup>
import { ref, onMounted, watch } from 'vue' // 导入 Vue 核心钩子
import { useEditorStore } from '@renderer/stores/editor' // 导入编辑器存储
import { ElMessage, ElMessageBox } from 'element-plus' // 导入 Element Plus 组件
import * as diff from 'diff' // 导入差异对比库

const props = defineProps({ // 定义组件属性
  modelValue: Boolean, // 控制抽屉显示隐藏
  bookName: String // 当前书籍名称
}) // 结束属性定义

const emit = defineEmits(['update:modelValue', 'restore']) // 定义组件事件

const editorStore = useEditorStore() // 获取编辑器 store 实例
const snapshots = ref([]) // 定义响应式快照列表变量
const loading = ref(false) // 定义响应式加载状态变量

// 差异对比相关状态
const diffDialogVisible = ref(false) // 定义差异对话框显示状态
const diffChanges = ref([]) // 定义差异数据数组
const selectedSnapshot = ref(null) // 定义当前选中的快照对象
const diffLoading = ref(false) // 定义差异加载状态变量

// 获取快照列表函数
async function fetchSnapshots() { // 定义异步获取函数
  if (!props.bookName || !editorStore.file) return // 如果缺少书名或文件则返回
  
  loading.value = true // 开启加载动画
  try { // 开始异常处理
    const params = { // 准备后端请求参数
      bookName: props.bookName, // 书籍名称
      type: editorStore.file.type // 文件类型（章节或笔记）
    } // 结束参数对象

    if (editorStore.file.type === 'chapter') { // 如果是章节类型
      params.volumeName = editorStore.file.volume // 设置卷名参数
      params.chapterName = editorStore.file.name // 设置章节名参数
    } else { // 如果是笔记类型
      params.notebookName = editorStore.file.notebook // 设置笔记本名参数
      params.noteName = editorStore.file.name // 设置笔记名参数
    } // 结束类型判断

    const result = await window.electron.getRecycleBinSnapshots(params) // 调用 Electron 接口获取快照
    if (result.success) { // 如果接口调用成功
      snapshots.value = result.snapshots || [] // 更新快照列表数据
    } // 结束成功判断
  } catch (error) { // 捕获执行过程中的错误
    console.error('获取快照列表失败:', error) // 在控制台打印错误信息
  } finally { // 无论成功失败都会执行
    loading.value = false // 关闭加载动画
  } // 结束异常处理
} // 结束 fetchSnapshots 函数

// 查看差异函数
async function viewDiff(snapshot) { // 定义异步查看差异函数
  diffLoading.value = true // 开启差异对比加载
  selectedSnapshot.value = snapshot // 记录当前要对比的快照
  try { // 开始异常处理
    const result = await window.electron.readRecycleBinSnapshot({ // 读取指定快照的内容
      bookName: props.bookName, // 书籍名
      fileName: snapshot.fileName // 快照文件名
    }) // 结束接口调用

    if (result.success) { // 如果快照内容读取成功
      const oldContent = result.content // 获取历史快照的内容
      let currentContent = editorStore.content // 获取当前编辑器的内容
      
      // 这里的 diffChars 适合中文字符对比，计算两者的差异
      // 调整顺序为 (旧内容, 新内容)，这样 added 表示当前版本比快照多出的内容，removed 表示缺失的内容
      diffChanges.value = diff.diffChars(oldContent, currentContent) // 执行差异对比算法
      diffDialogVisible.value = true // 显示差异对比对话框
    } else { // 如果读取失败
      ElMessage.error('读取快照内容失败') // 弹出错误提示信息
    } // 结束读取结果判断
  } catch (error) { // 捕获执行过程中的错误
    console.error('查看差异失败:', error) // 在控制台打印错误日志
  } finally { // 无论成功失败都会执行
    diffLoading.value = false // 关闭差异对比加载
  } // 结束异常处理
} // 结束 viewDiff 函数

// 还原快照函数
async function restoreSnapshot(snapshot) { // 定义异步还原快照函数
  try { // 开始确认和还原流程
    await ElMessageBox.confirm( // 弹出二次确认对话框
      '确定要还原到该版本的快照吗？当前未保存的内容将会被覆盖。', // 提示文本
      '还原快照', // 对话框标题
      { // 配置对象
        confirmButtonText: '确定还原', // 确认按钮文本
        cancelButtonText: '取消', // 取消按钮文本
        type: 'warning' // 警告图标类型
      } // 结束配置
    ) // 结束确认框

    const result = await window.electron.readRecycleBinSnapshot({ // 重新读取快照完整内容
      bookName: props.bookName, // 书籍名
      fileName: snapshot.fileName // 文件名
    }) // 结束接口调用

    if (result.success) { // 如果读取成功
      emit('restore', result.content) // 向父组件发送还原事件并传递内容
      emit('update:modelValue', false) // 发送关闭抽屉事件
      ElMessage.success('已成功还原到选定版本') // 弹出还原成功提示
    } else { // 如果读取失败
      ElMessage.error('还原快照失败') // 弹出错误提示信息
    } // 结束结果判断
  } catch (error) { // 捕获错误（如用户点击取消）
    if (error !== 'cancel') { // 如果不是用户主动取消
      console.error('还原快照失败:', error) // 在控制台打印错误信息
    } // 结束判断
  } // 结束异常处理
} // 结束 restoreSnapshot 函数

// 监听抽屉显示状态变化
watch(() => props.modelValue, (val) => { // 监听 modelValue 属性
  if (val) { // 如果抽屉变为显示状态
    fetchSnapshots() // 立即获取最新的快照列表
  } // 结束显示判断
}) // 结束监听器

// 监听当前文件对象变化
watch(() => editorStore.file, () => { // 监听文件切换
  if (props.modelValue) { // 如果抽屉当前正处于打开状态
    fetchSnapshots() // 重新获取对应新文件的快照列表
  } // 结束判断
}) // 结束监听器

// 处理抽屉关闭函数
function handleClose() { // 定义关闭处理函数
  emit('update:modelValue', false) // 同步父组件的状态为关闭
} // 结束函数
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    title="回收站 - 历史快照"
    direction="rtl"
    size="400px"
    @close="handleClose"
  > <!-- 抽屉主容器 -->
    <div v-loading="loading" class="recycle-bin-container"> <!-- 列表区域容器 -->
      <div v-if="snapshots.length === 0" class="empty-state"> <!-- 空状态显示区 -->
        <el-empty description="暂无历史快照 (每30秒自动保存一次)" /> <!-- 无快照时的占位提示 -->
      </div> <!-- 结束空状态判断 -->
      <div v-else class="snapshot-list"> <!-- 快照列表显示区 -->
        <div 
          v-for="item in snapshots" 
          :key="item.timestamp" 
          class="snapshot-item"
        > <!-- 循环遍历快照项 -->
          <div class="snapshot-info"> <!-- 快照信息展示区 -->
            <span class="time">{{ item.timeStr }}</span> <!-- 显示快照保存的具体时间 -->
          </div> <!-- 结束信息区 -->
          <div class="snapshot-actions"> <!-- 快照操作按钮区 -->
            <el-button 
              type="primary" 
              link 
              @click="viewDiff(item)"
            > <!-- 对比按钮 -->
              对比 <!-- 按钮文本 -->
            </el-button> <!-- 结束对比按钮 -->
            <el-button 
              type="success" 
              link 
              @click="restoreSnapshot(item)"
            > <!-- 还原按钮 -->
              还原 <!-- 按钮文本 -->
            </el-button> <!-- 结束还原按钮 -->
          </div> <!-- 结束按钮区 -->
        </div> <!-- 结束单个快照项循环 -->
      </div> <!-- 结束快照列表判断 -->
    </div> <!-- 结束列表容器 -->

    <!-- 差异对比弹窗容器 -->
    <el-dialog
      v-model="diffDialogVisible"
      title="版本差异对比"
      width="80%"
      top="5vh"
      append-to-body
    > <!-- 差异对比对话框 -->
      <div v-loading="diffLoading" class="diff-viewer"> <!-- 差异查看器主体 -->
        <div class="diff-legend"> <!-- 图例颜色说明栏 -->
          <span class="legend-item current">保持不变</span> <!-- 正常文本说明 -->
          <span class="legend-item added">当前新增</span> <!-- 新增文本说明 -->
          <span class="legend-item removed">当前缺失</span> <!-- 缺失文本说明 -->
        </div> <!-- 结束说明栏 -->
        <div class="diff-content"> <!-- 差异内容详细展示区 -->
          <span 
            v-for="(change, index) in diffChanges" 
            :key="index"
            :class="{ 
              'diff-added': change.added, 
              'diff-removed': change.removed 
            }"
          > <!-- 根据差异类型应用不同颜色样式 -->
            {{ change.value }} <!-- 显示具体的文本字符内容 -->
          </span> <!-- 结束单个差异片段循环 -->
        </div> <!-- 结束内容展示区 -->
      </div> <!-- 结束差异查看器主体 -->
      <template #footer> <!-- 弹窗底部操作栏 -->
        <div class="dialog-footer"> <!-- 底部容器 -->
          <el-button @click="diffDialogVisible = false">关闭</el-button> <!-- 关闭弹窗按钮 -->
          <el-button type="success" @click="restoreSnapshot(selectedSnapshot)">还原此版本</el-button> <!-- 确定还原此版本按钮 -->
        </div> <!-- 结束底部容器 -->
      </template> <!-- 结束底部模板 -->
    </el-dialog> <!-- 结束差异对比对话框 -->
  </el-drawer> <!-- 结束快照抽屉 -->
</template>

<style lang="scss" scoped>
.recycle-bin-container { // 回收站容器样式
  height: 100%; // 高度填充
  display: flex; // 弹性布局
  flex-direction: column; // 垂直排列
} // 样式结束

.snapshot-list { // 快照列表样式
  display: flex; // 弹性布局
  flex-direction: column; // 垂直排列
  gap: 12px; // 项间距
} // 样式结束

.snapshot-item { // 单个快照项样式
  display: flex; // 弹性布局
  justify-content: space-between; // 两端对齐
  align-items: center; // 垂直居中
  padding: 12px; // 内边距
  background-color: var(--el-fill-color-light); // 背景颜色
  border-radius: 8px; // 圆角
  transition: background-color 0.2s; // 过渡动画

  &:hover { // 悬停样式
    background-color: var(--el-fill-color); // 悬停背景色
  } // 样式结束

  .snapshot-info { // 信息区样式
    display: flex; // 弹性布局
    flex-direction: column; // 垂直排列
    
    .time { // 时间文本样式
      font-size: 14px; // 字号
      color: var(--el-text-color-primary); // 颜色
    } // 样式结束
  } // 样式结束
} // 样式结束

.diff-viewer { // 差异查看器样式
  max-height: 60vh; // 最大高度限制
  overflow-y: auto; // 允许垂直滚动
  padding: 16px; // 内边距
  background-color: var(--el-bg-color-page); // 背景颜色
  border-radius: 4px; // 圆角
  font-family: var(--el-font-family); // 字体
  line-height: 1.8; // 行高
  white-space: pre-wrap; // 保持空白符并换行
  word-break: break-all; // 强制换行
} // 样式结束

.diff-legend { // 图例说明样式
  margin-bottom: 16px; // 下边距
  padding-bottom: 12px; // 下内边距
  border-bottom: 1px solid var(--el-border-color-lighter); // 下边框
  display: flex; // 弹性布局
  gap: 16px; // 间距
  font-size: 12px; // 字号

  .legend-item { // 单个图例项样式
    display: flex; // 弹性布局
    align-items: center; // 垂直居中
    gap: 4px; // 间距

    &::before { // 前置色块样式
      content: ''; // 空内容
      display: inline-block; // 行内块
      width: 12px; // 宽度
      height: 12px; // 高度
      border-radius: 2px; // 圆角
    } // 样式结束

    &.current::before { background-color: transparent; border: 1px solid var(--el-border-color); } // 当前图例颜色
    &.added::before { background-color: #e6ffec; } // 新增图例颜色
    &.removed::before { background-color: #ffeef0; text-decoration: line-through; } // 移除图例颜色
  } // 样式结束
} // 样式结束

.diff-content { // 差异内容样式
  font-size: 15px; // 字号
} // 样式结束

.diff-added { // 新增差异文本样式
  background-color: #e6ffec; // 浅绿色背景
  color: #24292e; // 文字颜色
} // 样式结束

.diff-removed { // 移除差异文本样式
  background-color: #ffeef0; // 浅红色背景
  color: #d73a49; // 文字颜色
  text-decoration: line-through; // 删除线
} // 样式结束

.empty-state { // 空状态样式
  margin-top: 100px; // 上边距
} // 样式结束
</style>
