<template>
  <LayoutTool title="时间线管理">
    <template #headrAction>
      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          class="search-input"
          clearable
          placeholder="搜索关键词"
        />
        <el-button type="primary" @click="addTimeline">
          <el-icon><Plus /></el-icon>
          <span>新增时间线</span>
        </el-button>
      </div>
    </template>
    <template #default>
      <el-empty v-if="filteredTimelines.length === 0" :image-size="200" description="暂无时间线" />
      <div v-else class="timeline-main">
        <div class="timeline-list">
          <div v-for="timeline in filteredTimelines" :key="timeline.id" class="timeline-column">
            <div class="timeline-title-wrap">
              <h3
                v-show="editTitleIdx !== timeline._idx"
                class="timeline-title"
                @mouseenter="hoverTitleIdx = timeline._idx"
                @mouseleave="hoverTitleIdx = -1"
                @click="
                  () => {
                    editTitleIdx = timeline._idx
                    editTitleValue = timeline.title
                  }
                "
              >
                {{ timeline.title }}
                <el-icon v-show="hoverTitleIdx === timeline._idx" class="edit-title-icon"
                  ><EditPen
                /></el-icon>
              </h3>
              <el-input
                v-show="editTitleIdx === timeline._idx"
                v-model="editTitleValue"
                placeholder="时间线标题"
                :maxlength="20"
                :autofocus="true"
                input-style="text-align: center"
                @keyup.enter="confirmEditTitle(timeline._idx)"
                @blur="cancelEditTitle"
              />
            </div>
            <el-timeline>
              <el-timeline-item
                v-for="node in timeline._nodes"
                :key="node.id"
                :timestamp="node.title"
                placement="top"
              >
                <div class="timeline-node-content">
                  <p>{{ node.desc }}</p>
                  <!-- 关联人物标签 -->
                  <div v-if="node.characters && node.characters.length > 0" class="node-characters">
                    <el-tag
                      v-for="cid in node.characters"
                      :key="cid"
                      size="small"
                      class="node-character-tag"
                      :style="getCharacterTagStyle(cid)"
                    >
                      {{ getCharacterName(cid) }}
                    </el-tag>
                  </div>
                  <div class="timeline-node-actions">
                    <el-icon @click="addNode(timeline._idx, node._nidx)"><EditPen /></el-icon>
                    <el-icon @click="removeNode(timeline._idx, node._nidx)"><Delete /></el-icon>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
            <div class="timeline-actions">
              <el-button class="add-node-btn" @click="addNode(timeline._idx)">新增节点</el-button>
              <el-button
                class="remove-timeline-btn"
                type="danger"
                @click="removeTimeline(timeline._idx)"
              >
                删除时间线
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </LayoutTool>
  <!-- 对话框：新增或编辑节点 (禁用点击遮罩层和Esc键关闭) -->
  <el-dialog
    v-model="dialogVisible"
    :title="nodeInfo.id === -1 ? '新增节点' : '编辑节点'"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="dialogVisible = false"
  >
    <el-form :model="nodeInfo" label-width="80px">
      <el-form-item label="节点标题">
        <el-input v-model="nodeInfo.title" placeholder="节点标题" clearable />
      </el-form-item>
      <el-form-item label="节点描述">
        <el-input
          v-model="nodeInfo.desc"
          placeholder="节点描述"
          type="textarea"
          :rows="3"
          clearable
        />
      </el-form-item>
      <!-- 关联人物 -->
      <el-form-item label="关联人物">
        <el-select
          v-model="nodeInfo.characters"
          multiple
          filterable
          placeholder="选择关联人物（可多选）"
          style="width: 100%"
          :no-data-text="characters.length === 0 ? '暂无人物，请先在人物谱中创建' : '无匹配'"
        >
          <el-option
            v-for="c in characters"
            :key="c.id"
            :label="c.name"
            :value="c.id"
          >
            <div class="character-option">
              <!-- 颜色标记 -->
              <span
                v-if="c.markerColor"
                class="character-option-marker"
                :style="{ backgroundColor: c.markerColor }"
              ></span>
              <span>{{ c.name }}</span>
              <span class="character-option-meta">{{ c.gender }} · {{ c.age }}岁</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmAddNode">确认</el-button>
    </template>
  </el-dialog>

  <!-- 对话框：新增时间线 (禁用点击遮罩层和Esc键关闭) -->
  <el-dialog
    v-model="timelineDialogVisible"
    title="新增时间线"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="timelineDialogVisible = false"
  >
    <el-form :model="timelineInfo" label-width="80px">
      <el-form-item label="名称">
        <el-input
          v-model="timelineInfo.title"
          placeholder="请输入时间线名称"
          :maxlength="20"
          clearable
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="timelineDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmAddTimeline">确认</el-button>
    </template>
  </el-dialog>
</template>


<script setup>
import LayoutTool from '@renderer/components/LayoutTool.vue'
import { ref, onMounted, watch, reactive, toRaw, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { EditPen, Delete, Plus } from '@element-plus/icons-vue'
import { genId } from '@renderer/utils/utils'

const route = useRoute()
// 节点对话框
const dialogVisible = ref(false)
const nodeInfo = reactive({
  id: -1,
  title: '',
  desc: '',
  characters: [] // 关联人物 id 数组
})
// 时间线对话框
const timelineDialogVisible = ref(false)
const timelineInfo = reactive({
  title: ''
})
const timelines = ref([])

// 本书人物列表
const characters = ref([])

// 搜索关键词
const searchQuery = ref('')

// 计算过滤后的时间线列表（根据搜索关键词）
// 注意：这里保留原始索引，避免过滤后编辑/删除错位
const filteredTimelines = computed(() => {
  if (!searchQuery.value.trim()) {
    return (timelines.value || []).map((timeline, idx) => ({
      ...timeline,
      _idx: idx,
      _nodes: (timeline.nodes || []).map((node, nidx) => ({
        ...node,
        _nidx: nidx
      }))
    }))
  }

  const query = searchQuery.value.toLowerCase()
  const result = []

  ;(timelines.value || []).forEach((timeline, idx) => {
    const title = (timeline.title || '').toLowerCase()
    const titleMatched = title.includes(query)

    const nodes = Array.isArray(timeline.nodes) ? timeline.nodes : []
    const mappedNodes = nodes.map((node, nidx) => ({
      ...node,
      _nidx: nidx
    }))

    // 标题匹配：展示该时间线全部节点
    if (titleMatched) {
      result.push({
        ...timeline,
        _idx: idx,
        _nodes: mappedNodes
      })
      return
    }

    // 节点匹配：展示匹配到的节点（标题/描述/关联人物姓名）
    const filteredNodes = mappedNodes.filter((node) => {
      const nodeTitle = (node.title || '').toLowerCase()
      const nodeDesc = (node.desc || '').toLowerCase()
      // 支持按关联人物姓名搜索
      const charMatched = (node.characters || []).some((cid) => {
        const name = getCharacterName(cid).toLowerCase()
        return name.includes(query)
      })
      return nodeTitle.includes(query) || nodeDesc.includes(query) || charMatched
    })

    if (filteredNodes.length > 0) {
      result.push({
        ...timeline,
        _idx: idx,
        _nodes: filteredNodes
      })
    }
  })

  return result
})

const bookName = route.query.name || ''
const currentTimelineIdx = ref(-1)
const currentNodeIdx = ref(-1)
const hoverTitleIdx = ref(-1)
const editTitleIdx = ref(-1)
const editTitleValue = ref('')

/**
 * 根据人物 id 获取姓名
 */
function getCharacterName(cid) {
  const c = characters.value.find((ch) => ch.id === cid)
  return c ? c.name : cid
}

/**
 * 根据人物 id 获取标签样式（使用人物的 markerColor）
 */
function getCharacterTagStyle(cid) {
  const c = characters.value.find((ch) => ch.id === cid)
  if (c && c.markerColor) {
    return {
      backgroundColor: c.markerColor + '22',
      borderColor: c.markerColor,
      color: c.markerColor
    }
  }
  return {}
}

async function loadTimelines() {
  try {
    const data = await window.electron.readTimeline(bookName)
    timelines.value = Array.isArray(data) ? data : []
  } catch {
    timelines.value = []
  }
}

async function loadCharacters() {
  try {
    const data = await window.electron.readCharacters(bookName)
    characters.value = Array.isArray(data) ? data : []
  } catch {
    characters.value = []
  }
}

async function saveTimelines() {
  try {
    // 彻底去除响应式
    const rawTimelines = JSON.parse(JSON.stringify(toRaw(timelines.value)))
    const result = await window.electron.writeTimeline(bookName, rawTimelines)
    if (!result) {
      throw new Error('保存失败')
    }
  } catch (error) {
    console.error('保存时间线失败:', error)
    ElMessage.error('保存时间线失败')
  }
}

/**
 * 打开新增时间线对话框
 */
function addTimeline() {
  timelineInfo.title = ''
  timelineDialogVisible.value = true
}

/**
 * 确认新增时间线
 */
function confirmAddTimeline() {
  const title = timelineInfo.title.trim()
  if (!title) {
    ElMessage.warning('请输入时间线名称')
    return
  }
  timelines.value.push({
    id: genId(),
    title: title,
    nodes: []
  })
  timelineDialogVisible.value = false
  ElMessage.success('时间线创建成功')
}

async function removeTimeline(idx) {
  try {
    await ElMessageBox.confirm('确定要删除该时间线吗？此操作不可恢复！', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    timelines.value.splice(idx, 1)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消，无需处理
  }
}

/**
 * 新增/编辑节点
 * @param {number} idx 时间线索引
 * @param {number} nidx 节点索引，undefined 表示新增
 */
function addNode(idx, nidx) {
  currentTimelineIdx.value = idx
  currentNodeIdx.value = nidx
  if (nidx === undefined) {
    // 新增模式：重置 id 为 -1
    nodeInfo.id = -1
    nodeInfo.title = '新节点'
    nodeInfo.desc = ''
    nodeInfo.characters = []
  } else {
    const node = timelines.value[idx].nodes[nidx]
    nodeInfo.id = node.id
    nodeInfo.title = node.title || '新节点'
    nodeInfo.desc = node.desc || ''
    nodeInfo.characters = Array.isArray(node.characters) ? [...node.characters] : []
  }
  dialogVisible.value = true
}

function confirmAddNode() {
  const nodeData = {
    id: nodeInfo.id === -1 ? genId() : nodeInfo.id,
    title: nodeInfo.title,
    desc: nodeInfo.desc,
    characters: [...nodeInfo.characters] // 保存关联人物 id 列表
  }
  if (nodeInfo.id === -1) {
    timelines.value[currentTimelineIdx.value].nodes.push(nodeData)
  } else {
    timelines.value[currentTimelineIdx.value].nodes[currentNodeIdx.value] = nodeData
  }
  dialogVisible.value = false
}

async function removeNode(tidx, nidx) {
  try {
    await ElMessageBox.confirm('确定要删除该节点吗？此操作不可恢复！', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    timelines.value[tidx].nodes.splice(nidx, 1)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消，无需处理
  }
}

function confirmEditTitle(idx) {
  if (editTitleValue.value.trim()) {
    timelines.value[idx].title = editTitleValue.value.trim()
  }
  editTitleIdx.value = -1
}

function cancelEditTitle() {
  editTitleIdx.value = -1
}

watch(timelines, saveTimelines, { deep: true })
onMounted(() => {
  loadTimelines()
  loadCharacters() // 加载本书人物数据
})
</script>

<style scoped>
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 135px;
}

.timeline-main {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}
.timeline-list {
  height: 100%;
  width: max-content;
}
.timeline-column {
  height: 100%;
  /* background: var(--bg-soft); */
  padding: 16px;
  width: 320px;
  border-right: 1px solid var(--border-color-soft);
  display: inline-block;
  overflow-y: auto;
  .el-button {
    width: 100%;
  }
}
.timeline-title-wrap {
  position: relative;
  margin-bottom: 16px;
}
.timeline-title {
  height: 32px;
  font-weight: bold;
  text-align: center;
  color: var(--text-base);
  margin-bottom: 0;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.edit-title-icon {
  font-size: 18px;
  transition: opacity 0.2s;
}
.el-timeline {
  padding: 0;
}
.timeline-node-content {
  padding: 8px 16px;
  background: var(--bg-mute);
  border-radius: 6px;
  box-shadow: 0 2px 8px #0002;
  position: relative;
  overflow: hidden;
  color: var(--text-base);
  &:hover {
    .timeline-node-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 28px;
    }
  }
}
.timeline-node-actions {
  position: absolute;
  right: 0px;
  top: 0px;
  left: 0px;
  bottom: 0px;
  display: none;
  background: #0008;
  color: #fff;
  font-size: 18px;
  .el-icon {
    cursor: pointer;
  }
}
.add-node-btn {
  margin-top: 8px;
  margin-bottom: 8px;
}
.remove-timeline-btn {
  margin: 0;
}
.timeline-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}
.timeline-node {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 8px;
}
.add-timeline {
  .el-button {
    width: 100%;
  }
}

/* 节点关联人物标签区域 */
.node-characters {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
  margin-bottom: 2px;
}
.node-character-tag {
  border-radius: 4px;
  font-size: 11px;
  padding: 0 6px;
  height: 20px;
  line-height: 20px;
}

/* 关联人物下拉选项 */
.character-option {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}
.character-option-marker {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.character-option-meta {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-placeholder, #aaa);
}
</style>
