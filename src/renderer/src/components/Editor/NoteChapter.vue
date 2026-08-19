<template>
  <div class="note-chapter">
    <!-- 笔记部分 -->
    <div class="panel-section">
      <div class="section-header" @click="toggleNotes">
        <div class="section-header-left">
          <el-icon class="toggle-icon" :class="{ 'is-active': notesExpanded }">
            <ArrowRight />
          </el-icon>
          <span>笔记</span>
        </div>
        <div class="section-header-right">
          <el-tooltip content="创建笔记本" placement="bottom" :show-after="2000">
            <el-icon @click.stop="createNotebook"><FolderAdd /></el-icon>
          </el-tooltip>
        </div>
      </div>
      <div v-show="notesExpanded" class="section-content">
        <el-tree
          ref="noteTreeRef"
          :data="notesTree"
          :props="defaultProps"
          empty-text="暂无笔记"
          node-key="path"
          highlight-current
          :default-expand-all="true"
          :current-node-key="currentNoteNodeKey"
          @node-click="handleNoteClick"
        >
          <template #default="{ node }">
            <div class="custom-tree-node">
              <span
                v-if="!editingNoteNode || editingNoteNode.path !== node.data.path"
                class="node-name"
              >
                {{ node.label }}
              </span>
              <el-input
                v-else
                v-model="editingNoteName"
                size="small"
                maxlength="20"
                @click.stop
                @keyup.enter="confirmEditNote(node)"
                @blur="confirmEditNote(node)"
              />
              <div class="chapter-actions">
                <el-icon v-if="node.data.type === 'folder'" @click.stop="createNote(node)">
                  <DocumentAdd />
                </el-icon>
                <el-icon @click.stop="editNoteNode(node)"><Edit /></el-icon>
                <el-icon @click.stop="deleteNoteNode(node)"><Delete /></el-icon>
              </div>
            </div>
          </template>
        </el-tree>
      </div>
    </div>

    <!-- 正文部分 -->
    <div class="panel-section">
      <div class="section-header" @click="toggleChapters">
        <div class="section-header-left">
          <el-icon class="toggle-icon" :class="{ 'is-active': chaptersExpanded }">
            <ArrowRight />
          </el-icon>
          <span>正文</span>
        </div>
        <div class="section-header-right">
          <el-tooltip content="创建卷" placement="bottom" :show-after="2000">
            <el-icon @click.stop="createVolume"><FolderAdd /></el-icon>
          </el-tooltip>
          <el-tooltip content="排序设置" placement="bottom" :show-after="2000">
            <el-icon @click.stop="openSortDialog"><Sort /></el-icon>
          </el-tooltip>
          <el-tooltip content="正文设置" placement="bottom" :show-after="2000">
            <el-icon @click.stop="openChapterSettings"><Setting /></el-icon>
          </el-tooltip>
          <el-tooltip content="导入小说（txt）" placement="bottom" :show-after="2000">
            <el-icon @click.stop="openImportNovel"><Upload /></el-icon>
          </el-tooltip>
        </div>
      </div>
      <div v-show="chaptersExpanded" class="section-content chapter-tree-container">
        <el-tree
          ref="chapterTreeRef"
          :data="chaptersTree"
          :props="defaultProps"
          empty-text="暂无章节"
          node-key="path"
          highlight-current
          :current-node-key="currentChapterNodeKey"
          :default-expand-all="true"
          :expand-on-click-node="false"
          :check-strictly="true"
          @node-click="handleChapterClick"
          @node-expand="handleNodeExpand"
          @node-collapse="handleNodeCollapse"
        >
          <template #default="{ node }">
            <div class="custom-tree-node">
              <span v-if="!editingNode || editingNode.path !== node.data.path" class="node-name">
                {{ node.label }}
              </span>
              <el-input
                v-else
                v-model="editingName"
                size="small"
                maxlength="20"
                @click.stop
                @keyup.enter="confirmEdit(node)"
                @blur="confirmEdit(node)"
              />
              <div class="chapter-actions">
                <span
                  v-if="
                    node.data.type === 'chapter' &&
                    (!editingNode || editingNode.path !== node.data.path)
                  "
                  class="chapter-word-count"
                >
                  {{ node.data.wordCount || 0 }}字
                </span>
                <el-icon
                  v-if="node.data.type === 'volume'"
                  @click.stop="createChapter(node.data.id)"
                >
                  <DocumentAdd />
                </el-icon>
                <el-icon @click.stop="editNode(node)"><Edit /></el-icon>
                <el-icon @click.stop="deleteNode(node)"><Delete /></el-icon>
              </div>
            </div>
          </template>
        </el-tree>
      </div>
    </div>

    <!-- 章节设置弹框 -->
    <ChapterSettingsDialog
      v-model:visible="chapterSettingsVisible"
      :book-name="bookName"
      :current-settings="chapterSettings"
      @settings-changed="handleSettingsChanged"
      @reformat-requested="handleReformatRequested"
    />

    <!-- 排序设置弹框 -->
    <el-dialog
      v-model="sortDialogVisible"
      title="排序设置"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="sort-settings">
        <div class="sort-item">
          <div class="sort-label">卷排序</div>
          <el-radio-group v-model="sortOrder" @change="handleVolumeSortChange">
            <el-radio label="asc">升序</el-radio>
            <el-radio label="desc">降序</el-radio>
          </el-radio-group>
        </div>
        <div class="sort-item">
          <div class="sort-label">章节排序（按创建时间）</div>
          <el-radio-group v-model="chapterSortOrder" @change="handleChapterSortChange">
            <el-radio label="asc">升序（旧的在前）</el-radio>
            <el-radio label="desc">降序（新的在前）</el-radio>
          </el-radio-group>
        </div>
      </div>
      <template #footer>
        <el-button @click="sortDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 导入小说对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入小说（txt）"
      width="460px"
      :close-on-click-modal="false"
    >
      <div class="import-novel-form">
        <div class="import-row">
          <span class="import-label">目标卷</span>
          <el-select v-model="importVolume" placeholder="选择卷" style="flex: 1">
            <el-option
              v-for="v in volumeOptions"
              :key="v.id"
              :label="v.name"
              :value="v.id"
            />
          </el-select>
        </div>
        <div class="import-row">
          <span class="import-label">文件编码</span>
          <el-select v-model="importEncoding" style="flex: 1">
            <el-option label="自动探测" value="auto" />
            <el-option label="UTF-8" value="utf-8" />
            <el-option label="GBK / GB18030" value="gbk" />
          </el-select>
        </div>
        <div class="import-row">
          <span class="import-label">小说文件</span>
          <el-input v-model="importFilePath" readonly placeholder="请选择 txt 文件" style="flex: 1">
            <template #append>
              <el-button @click="selectNovelFile">选择</el-button>
            </template>
          </el-input>
        </div>
        <p class="import-tip">
          将按"第x章/回/集"等标题自动拆分为章节，并追加到该卷现有最新章节之后。
        </p>
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!importFilePath" :loading="importing" @click="confirmImportNovel">
          导入
        </el-button>
      </template>
    </el-dialog>

    <!-- 导入预览/冲突确认对话框 -->
    <el-dialog
      v-model="conflictDialogVisible"
      title="导入预览确认"
      width="620px"
      :close-on-click-modal="false"
      @closed="resetImportForm"
    >
      <div class="preview-summary">
        共识别到 <strong>{{ importPreviewList.length }}</strong> 章
        <span v-if="previewConflictCount > 0" class="summary-conflict">，其中 {{ previewConflictCount }} 章存在冲突</span>
        <span v-if="previewEmptyCount > 0" class="summary-empty">，{{ previewEmptyCount }} 章正文为空</span>
        <span v-if="previewMergedCount > 0" class="summary-merged">，已智能合并 {{ previewMergedCount }} 处连续重复章节</span>
      </div>
      <div class="preview-batch-actions">
        <span>批量处理：</span>
        <el-button
          size="small"
          :type="isAllResolvedAs('skip') ? 'primary' : ''"
          @click="batchSetResolution('skip')"
        >
          冲突/空章全部跳过
        </el-button>
        <el-button
          size="small"
          :type="isAllResolvedAs('overwrite') ? 'primary' : ''"
          @click="batchSetResolution('overwrite')"
        >
          冲突/空章全部覆盖
        </el-button>
      </div>
      <div class="preview-list">
        <div
          v-for="(item, idx) in importPreviewList"
          :key="item.chapterName"
          class="preview-item"
          :class="{ conflict: item.conflict, empty: item.isEmptyBody, merged: item.mergedCount > 1 }"
        >
          <div class="preview-main">
            <span class="preview-index">{{ idx + 1 }}</span>
            <div class="preview-info">
              <div class="preview-name">{{ item.chapterName }}</div>
              <div class="preview-meta">
                <span>原文：{{ item.rawTitle }}</span>
                <span>{{ item.wordCount || 0 }} 字</span>
                <span v-if="item.mergedCount > 1" class="tag merged-tag">已合并 {{ item.mergedCount }} 段</span>
                <span v-if="item.isEmptyBody" class="tag empty-tag">空正文</span>
                <span v-if="item.conflict" class="tag conflict-tag">冲突</span>
              </div>
              <div v-if="item.conflict" class="preview-reason">与目标卷中已有章节同名</div>
            </div>
          </div>
          <el-radio-group
            v-if="item.conflict || item.isEmptyBody"
            v-model="conflictResolutions[item.chapterName]"
            size="small"
          >
            <el-radio-button value="skip">跳过</el-radio-button>
            <el-radio-button value="overwrite">覆盖</el-radio-button>
          </el-radio-group>
          <span v-else class="preview-new-tag">新建</span>
          <span
            v-if="item.conflict || item.isEmptyBody"
            class="preview-resolution-hint"
          >
            已选：{{ conflictResolutions[item.chapterName] === 'overwrite' ? '覆盖' : '跳过' }}
          </span>
        </div>
      </div>
      <template #footer>
        <el-button @click="conflictDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="resolving" @click="confirmImportWithResolutions">
          确认导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import {
  ArrowRight,
  DocumentAdd,
  FolderAdd,
  Sort,
  Setting,
  Edit,
  Delete,
  Upload
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useEditorStore } from '@renderer/stores/editor'
import ChapterSettingsDialog from '@renderer/components/Editor/ChapterSettingsDialog.vue'

const props = defineProps({
  bookName: {
    type: String,
    required: true
  }
})

// 树形控件配置
const defaultProps = {
  children: 'children',
  label: 'name'
}

// 面板展开状态
const notesExpanded = ref(false)
const chaptersExpanded = ref(true)

// 模拟数据 - 实际应该从主进程获取
const notesTree = ref([])
const chaptersTree = ref([])

// 编辑节点相关
const editingNode = ref(null)
const editingName = ref('')

// 笔记编辑相关
const editingNoteNode = ref(null)
const editingNoteName = ref('')

// 排序状态
const sortOrder = ref('asc')
// 章节时间排序状态（'asc' 升序，'desc' 降序，默认降序）
const chapterSortOrder = ref('desc')
// 排序对话框显示状态
const sortDialogVisible = ref(false)

const editorStore = useEditorStore()

// 当前笔记节点 key
const currentNoteNodeKey = ref(null)

// 当前章节节点 key
const currentChapterNodeKey = ref(null)

// 新增的 ref 和 keys
const chapterTreeRef = ref(null)
const noteTreeRef = ref(null)

// 章节设置相关
const chapterSettingsVisible = ref(false)
const chapterSettings = ref({
  chapterFormat: 'number',
  suffixType: '章',
  targetWords: 2000
})

// 导入小说相关
const importDialogVisible = ref(false)
const importing = ref(false)
const importVolume = ref('')
const importEncoding = ref('auto')
const importFilePath = ref('')

// 冲突确认相关
const conflictDialogVisible = ref(false)
const resolving = ref(false)
const conflictList = ref([])
const conflictResolutions = ref({})
const pendingImportParams = ref(null)
const importPreviewList = ref([])

// 当前书的卷选项（来自已加载的章节树）
const volumeOptions = computed(() =>
  (chaptersTree.value || []).map((v) => ({ id: v.id, name: v.name }))
)

// 导入预览统计
const previewConflictCount = computed(() => importPreviewList.value.filter((c) => c.conflict).length)
const previewEmptyCount = computed(() => importPreviewList.value.filter((c) => c.isEmptyBody).length)
const previewMergedCount = computed(
  () => importPreviewList.value.reduce((sum, c) => sum + (c.mergedCount > 1 ? 1 : 0), 0)
)

// 确保 chapterSettings 始终是一个响应式对象,避免传递 null 或 undefined
watch(chapterSettings, (newVal) => {
  if (!newVal || typeof newVal !== 'object') {
    chapterSettings.value = {
      chapterFormat: 'number',
      suffixType: '章',
      targetWords: 2000
    }
  }
}, { immediate: true, deep: true })

watch(
  () => editorStore.chapterTargetWords,
  (value) => {
    const numeric = Number(value)
    chapterSettings.value.targetWords =
      Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : 2000
  }
)

// 切换笔记面板
function toggleNotes() {
  notesExpanded.value = !notesExpanded.value
}

// 切换章节面板
function toggleChapters() {
  chaptersExpanded.value = !chaptersExpanded.value
}

// 处理节点展开事件（章节树使用 default-expand-all="true" 自动展开）
function handleNodeExpand() {
  // 章节树自动展开，无需手动管理
}

// 处理节点折叠事件（章节树使用 default-expand-all="true" 自动展开）
function handleNodeCollapse() {
  // 章节树自动展开，无需手动管理
}

// 处理笔记点击
async function handleNoteClick(data, node) {
  if (data.type === 'note') {
    const currentFile = editorStore.file
    if (currentFile && currentFile.path === data.path) return
    // 先尝试保存当前文件，失败不阻塞切换
    try {
      await editorStore.saveCurrentFileThroughHandler(false)
    } catch {
      // 保存失败不影响切换
    }
    const parent = node.parent.data
    const res = await window.electron.readNote(props.bookName, parent.name, data.name)
    if (res.success) {
      editorStore.setFile({
        name: data.name,
        type: 'note',
        path: data.path,
        notebook: parent.name
      })
      // 确保内容至少是空字符串，即使文件为空或返回 undefined
      const content = res.content || ''
      editorStore.setContent(content, { isInitialLoad: true })
      editorStore.setChapterTitle(data.name) // 笔记名作为标题
      currentNoteNodeKey.value = data.path // 保持选中态
    } else {
      ElMessage.error(res.message || '读取笔记失败')
    }
  }
}

// 处理章节点击
async function handleChapterClick(data, node) {
  if (data.type === 'chapter') {
    const currentFile = editorStore.file
    if (currentFile && currentFile.path === data.path) return

    // 如果当前打开的文件是章节，且卷名与树节点中的卷名不一致，说明卷名已经改了
    // 需要先更新 editorStore.file.volume，确保保存时使用正确的卷名
    if (
      currentFile &&
      currentFile.type === 'chapter' &&
      currentFile.name === data.name &&
      currentFile.volume !== node.parent.data.name
    ) {
      // 卷名已经改了，更新 editorStore.file 中的卷名和路径
      editorStore.setFile({
        ...currentFile,
        volume: node.parent.data.name,
        path: data.path
      })
    }

    // 先尝试保存当前文件，失败不阻塞切换
    try {
      await editorStore.saveCurrentFileThroughHandler(false)
    } catch {
      // 保存失败不影响切换
    }
    // 读取章节内容
    const res = await window.electron.readChapter(props.bookName, node.parent.data.name, data.name)
    if (res.success) {
      editorStore.setFile({
        name: data.name,
        type: 'chapter',
        path: data.path,
        volume: node.parent.data.name
      })
      // 确保内容至少是空字符串，即使文件为空或返回 undefined
      const content = res.content || ''
      editorStore.setContent(content, { isInitialLoad: true })
      editorStore.setChapterTitle(data.name) // 章节名作为标题
      currentChapterNodeKey.value = data.path // 保持选中态
    } else {
      ElMessage.error(res.message || '读取章节失败')
    }
  }
}

// 创建卷
async function createVolume() {
  try {
    const result = await window.electron.createVolume(props.bookName)
    if (result.success) {
      ElMessage.success('创建卷成功')

      // 等待一小段时间确保文件系统同步
      await new Promise((resolve) => setTimeout(resolve, 100))

      // 重新加载章节数据
      await loadChapters()

      // 章节树会自动展开（使用 default-expand-all="true"）
    } else {
      ElMessage.error(result.message || '创建卷失败')
    }
  } catch {
    ElMessage.error('创建卷失败')
  }
}

// 创建章节
async function createChapter(volumeId) {
  try {
    const result = await window.electron.createChapter(props.bookName, volumeId)
    if (result.success) {
      ElMessage.success('创建章节成功')

      // 等待一小段时间确保文件系统同步
      await new Promise((resolve) => setTimeout(resolve, 100))

      // 重新加载章节数据并自动选中新创建的章节
      await loadChapters(true, volumeId)

      // 章节树会自动展开（使用 default-expand-all="true"）
    } else {
      ElMessage.error(result.message || '创建章节失败')
    }
  } catch {
    ElMessage.error('创建章节失败')
  }
}

// 打开导入小说对话框
function openImportNovel() {
  // 默认选中第一个卷
  if (!importVolume.value && volumeOptions.value.length > 0) {
    importVolume.value = volumeOptions.value[0].id
  }
  importDialogVisible.value = true
}

// 选择小说 txt 文件
async function selectNovelFile() {
  try {
    const result = await window.electron.showOpenDialog({
      title: '选择小说 txt 文件',
      properties: ['openFile'],
      filters: [{ name: '文本文件', extensions: ['txt'] }, { name: '所有文件', extensions: ['*'] }]
    })
    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
      importFilePath.value = result.filePaths[0]
    }
  } catch {
    ElMessage.error('选择文件失败')
  }
}

// 确认导入：先分析，再打开预览/冲突确认框，用户确认后才写入
async function confirmImportNovel() {
  if (!importFilePath.value) {
    ElMessage.warning('请先选择小说文件')
    return
  }
  importing.value = true
  try {
    const analyze = await window.electron.analyzeImportNovel({
      bookName: props.bookName,
      filePath: importFilePath.value,
      volumeId: importVolume.value || undefined,
      encoding: importEncoding.value === 'auto' ? undefined : importEncoding.value
    })
    if (!analyze.success) {
      ElMessage.error(analyze.message || '分析失败')
      return
    }
    if (analyze.chapters.length === 0) {
      ElMessage.warning('未识别到可导入的章节')
      return
    }

    // 保存导入参数与预览数据
    pendingImportParams.value = {
      bookName: props.bookName,
      filePath: importFilePath.value,
      volumeId: importVolume.value || undefined,
      encoding: importEncoding.value === 'auto' ? undefined : importEncoding.value
    }
    importPreviewList.value = analyze.chapters

    // 初始化默认处理策略：空正文/冲突默认跳过，其他新建
    const resolutions = {}
    analyze.chapters.forEach((c) => {
      if (c.conflict || c.isEmptyBody) {
        resolutions[c.chapterName] = 'skip'
      }
    })
    conflictResolutions.value = resolutions

    importDialogVisible.value = false
    conflictDialogVisible.value = true
  } catch (err) {
    console.error('[导入] 分析小说失败:', err)
    ElMessage.error(`导入失败：${err?.message || '未知错误'}`)
  } finally {
    importing.value = false
  }
}

// 判断所有冲突/空章是否已统一设置为某种处理策略（用于批量按钮高亮）
function isAllResolvedAs(type) {
  const targets = importPreviewList.value.filter((c) => c.conflict || c.isEmptyBody)
  if (targets.length === 0) return false
  return targets.every((c) => conflictResolutions.value[c.chapterName] === type)
}

// 批量设置冲突/重复项的处理方式
function batchSetResolution(type) {
  // 仅对"冲突章"或"空正文章"生效；其余为新建，不需要处理策略
  const targets = importPreviewList.value.filter((c) => c.conflict || c.isEmptyBody)
  if (targets.length === 0) {
    ElMessage.info('当前没有冲突章节或空正文章，无需批量处理')
    return
  }
  const next = { ...conflictResolutions.value }
  targets.forEach((c) => {
    next[c.chapterName] = type
  })
  conflictResolutions.value = next
  const label = type === 'skip' ? '跳过' : '覆盖'
  ElMessage.success(`已将 ${targets.length} 个冲突/空章设为「${label}」`)
}

// 执行真正的导入写入
async function executeImport(params, resolutions) {
  // 关键：Vue 的 reactive 代理对象无法被 IPC 的 structuredClone 克隆，
  // 必须用 JSON 序列化转成纯普通对象，否则会抛 "An object could not be cloned"
  const plainParams = JSON.parse(JSON.stringify(params || {}))
  const plainResolutions = JSON.parse(JSON.stringify(resolutions || {}))
  const result = await window.electron.importNovel({ ...plainParams, resolutions: plainResolutions })
  if (result.success) {
    const parts = []
    if (result.createdCount) parts.push(`新建 ${result.createdCount} 章`)
    if (result.overwrittenCount) parts.push(`覆盖 ${result.overwrittenCount} 章`)
    if (result.skippedCount) parts.push(`跳过 ${result.skippedCount} 章`)
    ElMessage.success(parts.length ? `导入完成：${parts.join('，')}` : '导入完成')
    conflictDialogVisible.value = false
    importDialogVisible.value = false
    importPreviewList.value = []
    // 重新加载章节数据，并选中最新导入的章节
    await loadChapters()
    const vol = (chaptersTree.value || []).find(
      (v) => v.id === (params.volumeId || result.volumeName)
    )
    const targetVolume = vol || (chaptersTree.value || [])[0]
    if (targetVolume && targetVolume.children && targetVolume.children.length > 0) {
      // 取编号最大的章节（即最新导入的）
      const latest = [...targetVolume.children]
        .sort((a, b) => getChapterOrderValue(a.name) - getChapterOrderValue(b.name))
        .pop()
      if (latest) {
        const fakeNode = { data: latest, parent: { data: targetVolume } }
        await handleChapterClick(latest, fakeNode)
        currentChapterNodeKey.value = latest.path
      }
    }
  } else {
    ElMessage.error(result.message || '导入失败')
  }
}

// 预览对话框中确认导入
async function confirmImportWithResolutions() {
  if (!pendingImportParams.value) return
  resolving.value = true
  try {
    await executeImport(pendingImportParams.value, conflictResolutions.value)
  } catch (err) {
    console.error('[导入] 执行导入失败:', err)
    ElMessage.error(`导入失败：${err?.message || '未知错误'}`)
  } finally {
    resolving.value = false
  }
}

// 重置导入表单（在预览对话框关闭时调用，统一清理导入状态）
function resetImportForm() {
  importFilePath.value = ''
  importEncoding.value = 'auto'
  pendingImportParams.value = null
  conflictList.value = []
  conflictResolutions.value = {}
  importPreviewList.value = []
  // 保留已选卷，方便连续导入
}

// 从章节名中解析编号（"第3章" -> 3，无数字编号的章节如"序章"返回极大值排最后）
// 注意必须始终返回数字，否则排序比较会产生 NaN 导致顺序错乱
function getChapterOrderValue(name) {
  if (!name) return Number.MAX_SAFE_INTEGER
  const match = String(name).replace(/\.txt$/, '').match(/^第(\d+)/)
  if (match) {
    return parseInt(match[1], 10)
  }
  // 无数字编号时统一排到数字章节之后，具体先后由主排序的名称兜底处理
  return Number.MAX_SAFE_INTEGER
}

// 加载章节数据
async function loadChapters(autoSelectLatest = false, targetVolumeId = null) {
  try {
    const chapters = await window.electron.loadChapters(props.bookName)

    if (sortOrder.value === 'desc') {
      chapters.reverse()
    }

    // 根据排序状态对每个卷内的章节进行排序
    // 文件创建时间（birthtime）在复制/导入/同步场景下不可靠，因此以章节编号为主排序依据，
    // 升序=编号从小到大，降序=编号从大到小，符合"旧在前/新在前"的直觉且顺序稳定。
    for (const volume of chapters) {
      if (volume.children && volume.children.length > 0) {
        volume.children.sort((a, b) => {
          const orderA = getChapterOrderValue(a.name)
          const orderB = getChapterOrderValue(b.name)
          const diff = orderA - orderB
          if (diff !== 0) {
            return chapterSortOrder.value === 'desc' ? -diff : diff
          }
          // 编号相同（如"第x章"无数字）时按创建时间兜底，再按名称稳定排序
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          const timeDiff = chapterSortOrder.value === 'desc' ? timeB - timeA : timeA - timeB
          if (timeDiff !== 0) return timeDiff
          return String(a.name).localeCompare(String(b.name), 'zh')
        })
      }
    }

    // 验证数据结构
    if (Array.isArray(chapters) && chapters.length > 0) {
      if (chapters[0].children) {
        // 检查章节编号连续性
        await checkChapterNumberingAndWarn(chapters[0])
      }
    }

    chaptersTree.value = chapters

    // 使用 default-expand-all="true" 自动展开所有节点

    // 自动选中最新卷的最新章节
    if (autoSelectLatest && chapters.length > 0) {
      let latestVolume = null

      // 如果指定了卷ID，尝试找到该卷
      if (targetVolumeId) {
        latestVolume = chapters.find((v) => v.id === targetVolumeId)
      }

      // 如果没指定卷ID或没找到，则根据排序规则选择"最新"的卷
      if (!latestVolume) {
        // desc: index 0; asc: index length-1
        const index = sortOrder.value === 'desc' ? 0 : chapters.length - 1
        latestVolume = chapters[index]
      }

      if (latestVolume && latestVolume.children && latestVolume.children.length > 0) {
        // 根据章节排序规则选择"最新"的章节
        // desc: index 0; asc: index length-1
        const chapterIndex =
          chapterSortOrder.value === 'desc' ? 0 : latestVolume.children.length - 1
        const latestChapter = latestVolume.children[chapterIndex]

        const fakeNode = {
          data: latestChapter,
          parent: { data: latestVolume }
        }
        await handleChapterClick(latestChapter, fakeNode)
        currentChapterNodeKey.value = latestChapter.path
      }
    }
  } catch {
    ElMessage.error('加载章节失败')
  }
}

function ensureTrailingSpace(name) {
  const match = name.match(/^(第[^\s]+[章回集节部卷]?)(\s*)(.*)$/)
  if (!match) return name
  const [, prefix, spaces, rest] = match
  if (!rest) {
    return spaces === ' ' ? name : `${prefix} `
  }
  return spaces === '' ? name : `${prefix}${rest}`
}

function editNode(node) {
  editingNode.value = { ...node.data }
  editingName.value = ensureTrailingSpace(node.data.name)
}

// 确认编辑
async function confirmEdit(node) {
  if (!editingNode.value) return
  const newName = editingName.value.trim()
  if (!newName) {
    // 为空则还原
    editingNode.value = null
    editingName.value = ''
    return
  }

  // 如果名称没有变化，直接返回
  if (editingNode.value.name === newName) {
    editingNode.value = null
    editingName.value = ''
    return
  }

  let payload = { type: editingNode.value.type, newName }
  if (editingNode.value.type === 'volume') {
    payload.volume = editingNode.value.name
  } else if (editingNode.value.type === 'chapter') {
    // 需要找到父卷名
    payload.volume = node.parent.data.name
    payload.chapter = editingNode.value.name
  }
  try {
    const result = await window.electron.editNode(props.bookName, payload)
    if (result.success) {
      ElMessage.success('编辑成功')

      // 保存当前选中状态信息（使用更可靠的方式）
      const wasSelected = currentChapterNodeKey.value === editingNode.value.path
      const oldPath = editingNode.value.path

      // 重新加载章节数据
      await loadChapters()

      // 如果修改的是卷名，且当前打开的文件是该卷下的章节，需要更新 editorStore.file
      if (editingNode.value.type === 'volume') {
        const currentFile = editorStore.file
        if (
          currentFile &&
          currentFile.type === 'chapter' &&
          currentFile.volume === editingNode.value.name
        ) {
          // 当前打开的文件是被重命名卷下的章节，需要更新卷名和路径
          const newVolume = chaptersTree.value.find((v) => v.name === newName)
          if (newVolume && newVolume.children) {
            // 找到对应的章节（根据章节名匹配）
            const updatedChapter = newVolume.children.find((c) => c.name === currentFile.name)
            if (updatedChapter) {
              // 更新 editorStore.file 中的卷名和路径
              editorStore.setFile({
                ...currentFile,
                volume: newName,
                path: updatedChapter.path
              })
            }
          }
        }
      }

      // 如果修改的是章节名，且当前打开的文件正是这个章节，需要更新 editorStore.file 和 chapterTitle
      if (editingNode.value.type === 'chapter') {
        const currentFile = editorStore.file
        if (
          currentFile &&
          currentFile.type === 'chapter' &&
          currentFile.name === editingNode.value.name &&
          currentFile.volume === node.parent.data.name
        ) {
          // 当前打开的文件正是被重命名的章节，需要更新章节名、路径和标题
          const parentVolume = chaptersTree.value.find((v) => v.name === node.parent.data.name)
          if (parentVolume && parentVolume.children) {
            const updatedChapter = parentVolume.children.find((c) => c.name === newName)
            if (updatedChapter) {
              // 更新 editorStore.file 中的章节名和路径
              editorStore.setFile({
                ...currentFile,
                name: newName,
                path: updatedChapter.path
              })
              // 同步更新章节标题显示
              editorStore.setChapterTitle(newName)
            }
          }
        }
      }

      // 恢复选中状态：如果之前选中的是被编辑的节点，则选中新名称对应的节点
      await nextTick()
      if (wasSelected && editingNode.value.type === 'volume') {
        // 对于卷，需要根据新名称找到对应的节点
        const newVolume = chaptersTree.value.find((v) => v.name === newName)
        if (newVolume) {
          currentChapterNodeKey.value = newVolume.path
        }
      } else if (wasSelected && editingNode.value.type === 'chapter') {
        // 对于章节，需要根据父卷名和新章节名找到对应的节点
        const parentVolume = chaptersTree.value.find((v) => v.name === node.parent.data.name)
        if (parentVolume && parentVolume.children) {
          const newChapter = parentVolume.children.find((c) => c.name === newName)
          if (newChapter) {
            currentChapterNodeKey.value = newChapter.path
          }
        }
      } else if (currentChapterNodeKey.value === oldPath) {
        // 如果当前选中的仍然是旧路径，尝试更新为新路径
        if (editingNode.value.type === 'volume') {
          const newVolume = chaptersTree.value.find((v) => v.name === newName)
          if (newVolume) {
            currentChapterNodeKey.value = newVolume.path
          }
        } else if (editingNode.value.type === 'chapter') {
          const parentVolume = chaptersTree.value.find((v) => v.name === node.parent.data.name)
          if (parentVolume && parentVolume.children) {
            const newChapter = parentVolume.children.find((c) => c.name === newName)
            if (newChapter) {
              currentChapterNodeKey.value = newChapter.path
            }
          }
        }
      }
    } else {
      ElMessage.error(result.message || '编辑失败')
    }
  } catch (error) {
    console.error('编辑失败:', error)
    ElMessage.error('编辑失败')
  }
  editingNode.value = null
  editingName.value = ''
}

// 删除节点
async function deleteNode(node) {
  let payload = { type: node.data.type }
  if (node.data.type === 'volume') {
    payload.volume = node.data.name
  } else if (node.data.type === 'chapter') {
    payload.volume = node.parent.data.name
    payload.chapter = node.data.name
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除${node.data.type === 'volume' ? '卷' : '章节'}吗？此操作不可恢复！`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const result = await window.electron.deleteNode(props.bookName, payload)
    if (result.success) {
      ElMessage.success('删除成功')
      // 保存当前选中状态
      const currentSelectedKey = currentChapterNodeKey.value

      // 重新加载章节数据
      await loadChapters()

      // 恢复选中状态
      nextTick(() => {
        if (currentSelectedKey) {
          currentChapterNodeKey.value = currentSelectedKey
        }
      })
    } else {
      ElMessage.error(result.message || '删除失败')
    }
  } catch {
    // 用户取消
  }
}

// 打开排序对话框
function openSortDialog() {
  sortDialogVisible.value = true
}

// 处理卷排序改变
async function handleVolumeSortChange(order) {
  await window.electron.setSortOrder(props.bookName, order)
  chaptersTree.value = [...chaptersTree.value].reverse()
  ElMessage.success(`卷已按${order === 'asc' ? '升序' : '降序'}排序`)
}

// 处理章节排序改变
async function handleChapterSortChange(order) {
  // 保存排序状态
  await window.electron.setChapterSortOrder(props.bookName, order)
  
  // 重新加载章节数据
  await loadChapters()
  
  // 提示消息
  const orderText = order === 'desc' ? '降序（新的在前）' : '升序（旧的在前）'
  ElMessage.success(`章节已按创建时间${orderText}排序`)
}

// 创建笔记本
async function createNotebook() {
  const result = await window.electron.createNotebook(props.bookName)
  if (result.success) {
    ElMessage.success(`创建笔记本"${result.notebookName}"成功`)

    // 重新加载笔记数据
    notesTree.value = await window.electron.loadNotes(props.bookName)
  } else {
    ElMessage.error(result.message || '创建笔记本失败')
  }
}

// 创建笔记（可传父节点）
async function createNote(node) {
  let notebookName = '大纲'
  if (node && node.data && node.data.type === 'folder') {
    notebookName = node.data.name
  }
  const result = await window.electron.createNote(props.bookName, notebookName)
  if (result.success) {
    ElMessage.success('创建笔记成功')

    // 重新加载笔记数据
    notesTree.value = await window.electron.loadNotes(props.bookName)
  } else {
    ElMessage.error(result.message || '创建笔记失败')
  }
}

// 编辑笔记本/笔记名
function editNoteNode(node) {
  editingNoteNode.value = { ...node.data }
  editingNoteName.value = node.data.name
}

// 确认编辑笔记本/笔记名
async function confirmEditNote(node) {
  if (!editingNoteNode.value) return
  const newName = editingNoteName.value.trim()
  if (!newName) {
    editingNoteNode.value = null
    editingNoteName.value = ''
    return
  }
  let result
  if (editingNoteNode.value.type === 'folder') {
    // 校验重名
    const siblings = node.parent.data.children || notesTree.value
    if (siblings.some((n) => n.name === newName && n.path !== editingNoteNode.value.path)) {
      ElMessage.error('笔记本名已存在')
      return
    }
    result = await window.electron.renameNotebook(
      props.bookName,
      editingNoteNode.value.name,
      newName
    )
  } else if (editingNoteNode.value.type === 'note') {
    // 需要父节点名
    result = await window.electron.renameNote(
      props.bookName,
      node.parent.data.name,
      editingNoteNode.value.name,
      newName
    )
  }
  if (result && result.success) {
    ElMessage.success('重命名成功')

    // 重新加载笔记数据
    notesTree.value = await window.electron.loadNotes(props.bookName)

    // 如果修改的是笔记名，且当前打开的文件正是这个笔记，需要更新 editorStore.file 和 chapterTitle
    if (editingNoteNode.value.type === 'note') {
      const currentFile = editorStore.file
      if (
        currentFile &&
        currentFile.type === 'note' &&
        currentFile.name === editingNoteNode.value.name &&
        currentFile.notebook === node.parent.data.name
      ) {
        // 当前打开的文件正是被重命名的笔记，需要更新笔记名、路径和标题
        const parentNotebook = notesTree.value.find((nb) => nb.name === node.parent.data.name)
        if (parentNotebook && parentNotebook.children) {
          const updatedNote = parentNotebook.children.find((n) => n.name === newName)
          if (updatedNote) {
            // 更新 editorStore.file 中的笔记名和路径
            editorStore.setFile({
              ...currentFile,
              name: newName,
              path: updatedNote.path
            })
            // 同步更新笔记标题显示
            editorStore.setChapterTitle(newName)
          }
        }
      }
    }
  } else {
    ElMessage.error(result?.message || '重命名失败')
  }
  editingNoteNode.value = null
  editingNoteName.value = ''
}

// 删除笔记本/笔记
async function deleteNoteNode(node) {
  let typeText = node.data.type === 'folder' ? '笔记本' : '笔记'
  try {
    await ElMessageBox.confirm(
      `确定要删除${typeText}"${node.data.name}"吗？此操作不可恢复！`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    let result
    if (node.data.type === 'folder') {
      result = await window.electron.deleteNotebook(props.bookName, node.data.name)
    } else if (node.data.type === 'note') {
      result = await window.electron.deleteNote(
        props.bookName,
        node.parent.data.name,
        node.data.name
      )
    }
    if (result && result.success) {
      ElMessage.success('删除成功')

      // 重新加载笔记数据
      notesTree.value = await window.electron.loadNotes(props.bookName)
    } else {
      ElMessage.error(result?.message || '删除失败')
    }
  } catch {
    // 用户取消
  }
}

// 组件挂载时加载书籍数据
onMounted(async () => {
  try {
    sortOrder.value = await window.electron.getSortOrder(props.bookName)
    // 加载章节时间排序状态（默认降序）
    const savedChapterSortOrder = await window.electron.getChapterSortOrder(props.bookName)
    chapterSortOrder.value = savedChapterSortOrder || 'desc'
    
    // 首次打开书籍更新一次全部目录章节的字数
    try { // 开始尝试执行字数刷新
      // 调用接口刷新所有章节字数
      await window.electron.refreshAllChapterWordCounts(props.bookName) // 执行主进程字数刷新逻辑
    } catch (err) { // 捕获执行过程中的异常
      // 捕获并打印错误
      console.error('刷新字数失败:', err) // 在控制台输出错误信息
    } // 结束异常处理
    
    // 如果当前已经打开了文件（例如从全屏模式切回），则不需要自动选中最新章节
    const hasOpenFile = !!editorStore.file
    await loadChapters(!hasOpenFile) 
    
    // 如果已有打开的文件，同步选中状态到树组件
    if (hasOpenFile) {
      if (editorStore.file.type === 'chapter') {
        currentChapterNodeKey.value = editorStore.file.path
      } else if (editorStore.file.type === 'note') {
        currentNoteNodeKey.value = editorStore.file.path
        notesExpanded.value = true // 确保笔记面板展开
      }
    }
    
    notesTree.value = await window.electron.loadNotes(props.bookName)
    await loadChapterSettings()
  } catch (error) {
    console.error('加载书籍数据失败:', error)
    ElMessage.error('加载书籍数据失败')
  }
})

defineExpose({
  reloadNotes,
  reloadChapters: (autoSelectLatest = false) => loadChapters(autoSelectLatest),
  updateChapterWordCount
})

function updateChapterWordCount(path, wordCount) {
  if (!path || typeof wordCount !== 'number') return

  // 遍历章节树查找并更新
  for (const volume of chaptersTree.value) {
    if (volume.children) {
      const chapter = volume.children.find((c) => c.path === path)
      if (chapter) {
        chapter.wordCount = wordCount
        return
      }
    }
  }
}

async function reloadNotes() {
  notesTree.value = await window.electron.loadNotes(props.bookName)
}

// 打开章节设置弹框
function openChapterSettings() {
  chapterSettingsVisible.value = true
}

// 加载章节设置
async function loadChapterSettings() {
  try {
    const settings = await window.electron.getChapterSettings(props.bookName)
    if (settings) {
      const targetValue = Number(settings.targetWords)
      chapterSettings.value = {
        chapterFormat: settings.chapterFormat || 'number',
        suffixType: settings.suffixType || '章',
        targetWords: Number.isFinite(targetValue) && targetValue > 0 ? targetValue : 2000
      }
      editorStore.setChapterTargetWords(chapterSettings.value.targetWords)
    } else {
      editorStore.setChapterTargetWords(2000)
    }
  } catch {
    // 使用默认设置
    editorStore.setChapterTargetWords(2000)
  }
}

// 检查章节编号连续性并提示用户
async function checkChapterNumberingAndWarn(volume) {
  if (!volume.children || volume.children.length === 0) return

  // 简单的章节编号检查
  const chapterNumbers = volume.children
    .map((chapter) => {
      const name = chapter.name
      // 先尝试数字格式：第1章、第1集等
      let match = name.match(/^第(\d+)(.+)$/)
      if (match) {
        return parseInt(match[1])
      }
      // 再尝试汉字格式：第一章、第一集等
      match = name.match(/^第(.+?)(.+)$/)
      if (match) {
        // 简单的汉字转数字（只处理1-10）
        const chineseNumbers = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
        const index = chineseNumbers.indexOf(match[1])
        return index > 0 ? index : 0
      }
      return 0
    })
    .filter((num) => num > 0)
    .sort((a, b) => a - b)

  if (chapterNumbers.length === 0) return

  const maxNumber = Math.max(...chapterNumbers)
  const totalChapters = volume.children.length
  const missingNumbers = []

  // 检查缺失的编号
  for (let i = 1; i <= maxNumber; i++) {
    if (!chapterNumbers.includes(i)) {
      missingNumbers.push(i)
    }
  }

  const isSequential = missingNumbers.length === 0 && maxNumber === totalChapters

  if (!isSequential) {
    // 检查是否有 undefined 后缀问题
    const hasUndefinedSuffix = volume.children.some((chapter) => chapter.name.includes('undefined'))

    if (hasUndefinedSuffix) {
      console.warn(
        '🚨 检测到章节名包含 "undefined"，这是格式化错误！建议立即通过"正文设置" -> "重新格式化章节编号"来修复'
      )
    } else {
      console.warn('⚠️ 章节编号不连续，建议通过"正文设置" -> "重新格式化章节编号"来修复')
    }
  }
}

// 重新格式化章节编号
async function reformatChapterNumbers(volumeName, overrideSettings) {
  try {
    // 转换为普通对象，避免 IPC 克隆问题
    const cleanSettings = {
      chapterFormat:
        overrideSettings?.chapterFormat || chapterSettings.value.chapterFormat || 'number',
      suffixType: overrideSettings?.suffixType || chapterSettings.value.suffixType || '章'
    }

    const result = await window.electron.reformatChapterNumbers(
      props.bookName,
      volumeName,
      cleanSettings
    )

    if (result.success) {
      ElMessage.success(result.message)
      // 重新加载章节数据
      await loadChapters()
    } else {
      ElMessage.error(result.message || '重新格式化失败')
    }
  } catch {
    ElMessage.error('重新格式化失败')
  }
}

// 处理重新格式化请求（来自设置对话框）
async function handleReformatRequested(payload) {
  try {
    // 找到第一个卷
    if (chaptersTree.value && chaptersTree.value.length > 0) {
      const firstVolume = chaptersTree.value[0]
      // 调用重新格式化函数
      await reformatChapterNumbers(firstVolume.name, payload)
    } else {
      ElMessage.warning('没有找到可格式化的卷')
    }
  } catch {
    ElMessage.error('重新格式化失败')
  }
}

// 处理设置变更
async function handleSettingsChanged(newSettings) {
  const targetValue = Number(newSettings.targetWords)
  chapterSettings.value = {
    chapterFormat: newSettings.chapterFormat || 'number',
    suffixType: newSettings.suffixType || '章',
    targetWords: Number.isFinite(targetValue) && targetValue > 0 ? targetValue : 2000
  }
  editorStore.setChapterTargetWords(chapterSettings.value.targetWords)
  // 重新加载章节数据以显示新的命名格式
  await loadChapters()
}
</script>
<style lang="scss" scoped>
.note-chapter { // 笔记章节面板容器
  height: 100%; // 高度填充
  background-color: var(--bg-soft); // 背景颜色
  overflow-y: auto; // 允许垂直滚动

  /* 自定义滚动条样式 */
  scrollbar-width: thin; /* Firefox: 使用细滚动条 */
  scrollbar-color: var(--border-color) transparent; /* Firefox: 滚动条颜色 */

  &::-webkit-scrollbar { // Webkit内核滚动条整体
    width: 6px; // 减小宽度
  }

  &::-webkit-scrollbar-thumb { // 滚动条滑块
    background-color: var(--border-color); // 使用边框颜色
    border-radius: 3px; // 圆角
    
    &:hover { // 鼠标悬停
      background-color: var(--text-gray-light); // 悬停时加深颜色
    }
  }

  &::-webkit-scrollbar-track { // 滚动条轨道
    background-color: transparent; // 轨道透明
  }
}

.panel-section {
  border-bottom: 1px solid var(--border-color);
}

.section-header {
  padding: 10px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-base);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
  &-right {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-right: 10px;
    font-size: 16px;
  }

  &:hover {
    background-color: var(--bg-mute);
  }
}

.toggle-icon {
  transition: transform 0.2s;
  font-size: 12px;
  padding: 6px;
  box-sizing: content-box;
  padding: 6px;
  &.is-active {
    transform: rotate(90deg);
  }
}

.section-content {
  ::v-deep(.el-tree) {
    background-color: var(--bg-soft);
  }
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  // gap: 4px;
  font-size: 13px;
  width: 100%;
  overflow: hidden;
  .node-name {
    flex: 1;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-base); /* 确保文件名颜色使用主题变量 */
  }
  .chapter-actions {
    opacity: 0;
    display: flex;
    padding-right: 10px;
    align-items: center;
    gap: 12px;
  }
  &:hover {
    .chapter-actions {
      opacity: 1;
    }
  }
}

.chapter-tree-container .custom-tree-node {
  .chapter-actions {
    opacity: 1;
    .el-icon {
      display: none;
    }
    .chapter-word-count {
      font-size: 12px;
      color: var(--text-secondary, #999);
      white-space: nowrap;
    }
  }
  &:hover .chapter-actions {
    .el-icon {
      display: flex;
    }
    .chapter-word-count {
      display: none;
    }
  }
}

/* 排序设置对话框样式 */
.sort-settings {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 12px 0;
}

.sort-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sort-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-base);
}

/* 导入小说对话框样式 */
.import-novel-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0;
}

.import-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.import-label {
  width: 64px;
  flex-shrink: 0;
  font-size: 14px;
  color: var(--text-base);
  text-align: right;
}

.import-tip {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary, #999);
  line-height: 1.6;
}

/* 导入预览/冲突确认对话框样式 */
.preview-summary {
  font-size: 13px;
  color: var(--text-base);
  margin-bottom: 12px;
}

.preview-summary .summary-conflict {
  color: var(--el-color-danger);
}

.preview-summary .summary-empty {
  color: var(--el-color-warning);
}

.preview-summary .summary-merged {
  color: var(--el-color-success);
}

.preview-batch-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--text-base);
}

.preview-list {
  max-height: 360px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--bg-soft);
}

.preview-item.conflict {
  border-left: 3px solid var(--el-color-danger);
}

.preview-item.empty {
  border-left: 3px solid var(--el-color-warning);
}

.preview-item.merged {
  border-left: 3px solid var(--el-color-success);
}

.preview-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.preview-index {
  flex-shrink: 0;
  width: 22px;
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary, #999);
  line-height: 20px;
}

.preview-info {
  flex: 1;
  min-width: 0;
}

.preview-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-base);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-meta {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary, #999);
}

.preview-reason {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-color-danger);
}

.preview-new-tag {
  font-size: 12px;
  color: var(--el-color-success);
}

.preview-resolution-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--text-secondary, #999);
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  border-radius: 4px;
  font-size: 11px;
  line-height: 18px;
}

.tag.merged-tag {
  color: var(--el-color-success);
  background-color: var(--el-color-success-light-9);
}

.tag.empty-tag {
  color: var(--el-color-warning);
  background-color: var(--el-color-warning-light-9);
}

.tag.conflict-tag {
  color: var(--el-color-danger);
  background-color: var(--el-color-danger-light-9);
}
</style>
