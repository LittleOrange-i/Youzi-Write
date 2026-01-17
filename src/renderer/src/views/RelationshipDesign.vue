<template>
  <LayoutTool :title="relationshipName || '关系图编辑'">
    <template #headrAction>
      <el-button type="primary" :loading="saving" @click="handleSave">
        <el-icon><Check /></el-icon>
        <span>保存</span>
      </el-button>
    </template>
    <template #default>
      <div class="relationship-design">
        <!-- 移除顶部工具栏 -->
        <div ref="canvasRef" class="design-canvas">
          <RelationGraph
            ref="graphRef"
            :options="graphOptions"
            :on-line-click="onLineClick"
            :on-node-click="onNodeClick"
            @canvas-click="onCanvasClick"
          >
            <template #graph-plug>
              <RadialMenu
                v-if="showRadialMenu"
                :style="{
                  width: nodeMenuPanel.width + 'px',
                  height: nodeMenuPanel.height + 'px',
                  left: nodeMenuPanel.x + 'px',
                  top: nodeMenuPanel.y + 'px'
                }"
                @info="handleNodeInfo"
                @add="handleNodeAdd"
                @link="handleNodeLink"
                @delete="handleNodeDelete"
              />
            </template>
            <template #node="{ node }">
              <div
                class="custom-node"
                :style="getNodeStyle(node)"
                @dblclick.stop="handleNodeDoubleClickDirect(node, $event)"
                @contextmenu.prevent="handleNodeRightClick(node, $event)"
              >
                <div class="node-text">
                  {{ node.text }}
                </div>
              </div>
            </template>
          </RelationGraph>
        </div>
      </div>
    </template>
  </LayoutTool>
  <el-dialog
    v-model="infoDialogVisible"
    :title="isAddMode ? '新增角色' : '编辑角色信息'"
    width="500px"
  >
    <el-form label-width="80px">
      <el-form-item label="角色">
        <el-select
          v-model="infoForm.characterId"
          placeholder="选择角色或输入新名称"
          style="width: 100%"
          filterable
          allow-create
          default-first-option
          :filter-method="filterCharacters"
          @change="onCharacterChange"
          @visible-change="onSelectVisibleChange"
        >
          <el-option
            v-for="character in filteredCharacters"
            :key="character.id"
            :label="character.name"
            :value="character.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="性别">
        <el-radio-group v-model="infoForm.gender">
          <el-radio value="male">男</el-radio>
          <el-radio value="female">女</el-radio>
          <el-radio value="none">无</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="背景色">
        <div style="display: flex; gap: 8px; align-items: center">
          <div class="color-squares">
            <div
              v-for="c in presetColors"
              :key="c.value"
              class="color-square"
              :class="{ 'color-square-selected': infoForm.color === c.value }"
              :style="{ background: c.value }"
              @click="selectPresetColor(c.value)"
            ></div>
          </div>
          <el-color-picker v-model="customColor" style="margin-left: 8px" @change="onCustomColor" />
        </div>
      </el-form-item>
      <el-form-item label="头像">
        <div style="width: 100%; display: flex; gap: 8px; align-items: flex-start">
          <el-input v-model="infoForm.avatar" placeholder="请输入图片链接或选择本地图片" />
          <el-button @click="selectLocalImage">选择本地图片</el-button>
          <div v-if="infoForm.avatar" class="avatar-preview">
            <el-image
              :src="getAvatarSrc(infoForm.avatar)"
              alt="头像预览"
              class="preview-image"
              :fit="'cover'"
            />
          </div>
        </div>
      </el-form-item>
      <el-form-item label="描述">
        <el-input
          v-model="infoForm.description"
          type="textarea"
          :rows="3"
          placeholder="请输入描述"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" @click="saveNodeInfo">保存</el-button>
    </template>
  </el-dialog>

  <!-- 连线编辑弹框 -->
  <el-dialog v-model="edgeDialogVisible" title="编辑关系" width="400px">
    <el-form label-width="80px">
      <el-form-item label="关系描述">
        <el-input v-model="edgeForm.text" placeholder="请输入关系描述" style="width: 100%" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="closeEdgeDialog">取消</el-button>
      <el-button type="primary" @click="saveEdgeInfo">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import LayoutTool from '@renderer/components/LayoutTool.vue'
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Check } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import RelationGraph from 'relation-graph-vue3'
import RadialMenu from '@renderer/components/RadialMenu.vue'
import { genId } from '@renderer/utils/utils'

const route = useRoute()
const bookName = route.query.name
const relationshipName = route.query.id

const saving = ref(false)
const graphRef = ref(null)
const selectedNode = ref(null)

// 角色数据
const characters = ref([])
// 过滤后的角色数据
const filteredCharacters = ref([])

// 关系图数据
const relationshipData = reactive({
  id: '',
  name: relationshipName,
  description: '',
  nodes: [],
  lines: [],
  createdAt: '',
  updatedAt: ''
})

// 图表配置
const graphOptions = {
  allowShowDownloadButton: false,
  defaultNodeBorderWidth: 0,
  allowSwitchLineShape: true,
  allowSwitchJunctionPoint: true,
  defaultLineShape: 1,
  creatingLinePlot: false, // 连线创建模式
  layouts: [
    {
      layoutName: 'center'
    }
  ],
  defaultJunctionPoint: 'border',
  defaultLineFontColor: '#409eff', // 设置默认线条文字颜色为蓝色
  // 自定义角色渲染
  defaultNodeShape: 0, // 使用矩形角色
  defaultNodeWidth: 100,
  defaultNodeHeight: 100,
  // 角色文字样式
  defaultNodeFontColor: '#333333',
  defaultNodeFontSize: 16,
  // 允许自定义角色HTML
  allowNodeCustomHTML: true
}

// 加载角色数据
const loadCharacters = async () => {
  try {
    const data = await window.electron.readCharacters(bookName)
    characters.value = Array.isArray(data) ? data : []
    // 初始化过滤后的角色数据
    filteredCharacters.value = [...characters.value]
  } catch (error) {
    console.error('加载角色数据失败:', error)
    characters.value = []
    filteredCharacters.value = []
  }
}

// 加载关系图数据
const loadRelationshipData = async () => {
  try {
    const data = await window.electron.readRelationshipData(bookName, relationshipName)
    if (data) {
      // 数据格式迁移：将旧格式的属性迁移到 data 对象中
      const migratedNodes = Array.isArray(data.nodes)
        ? data.nodes.map((node) => {
            if (!node.data) {
              node.data = {}
            }
            // 迁移旧格式的属性到 data 中
            if (node.gender !== undefined) {
              node.data.gender = node.gender
              delete node.gender
            }
            if (node.description !== undefined) {
              node.data.description = node.description
              delete node.description
            }
            if (node.characterId !== undefined) {
              node.data.characterId = node.characterId
              delete node.characterId
            }
            // 确保头像字段存在
            if (!node.data.avatar) {
              node.data.avatar = ''
            }
            // 确保字体大小字段存在并迁移到 data 中
            if (!node.data.fontSize) {
              const level = calculateNodeLevel(node.id, data.nodes, data.lines)
              const size = calculateNodeSize(node.id, data.nodes, data.lines, level)
              node.data.fontSize = size.fontSize
            }
            // 如果旧数据中有 fontSize 属性，迁移到 data 中
            if (node.fontSize && !node.data.fontSize) {
              node.data.fontSize = node.fontSize
              delete node.fontSize
            }
            return node
          })
        : []

      // 确保所有连线都有正确的文字颜色
      const migratedLines = Array.isArray(data.lines)
        ? data.lines.map((line) => ({
            ...line,
            fontColor: line.fontColor || '#409eff' // 如果没有设置颜色，使用默认蓝色
          }))
        : []

      Object.assign(relationshipData, {
        ...data,
        nodes: migratedNodes,
        lines: migratedLines
      })
      await graphRef.value.setJsonData(relationshipData)
      // const graphInstance = graphRef.value.getInstance()
      // await graphInstance.moveToCenter()
      // await graphInstance.zoomToFit()
      // applyNodeSizes() // 加载数据后应用角色大小
    } else {
      // 保证nodes/edges为数组
      relationshipData.nodes = []
      relationshipData.lines = []
      // 初始化空图表
      if (graphRef.value && graphRef.value.setJsonData) {
        graphRef.value.setJsonData(relationshipData)
      }
    }
  } catch (error) {
    console.error('加载关系图数据失败:', error)
    ElMessage.error('加载关系图数据失败')
    // 保证nodes/edges为数组
    relationshipData.nodes = []
    relationshipData.lines = []
    // 初始化空图表
    if (graphRef.value && graphRef.value.setJsonData) {
      graphRef.value.setJsonData(relationshipData)
    }
  }
}

// 保存关系图
const handleSave = async () => {
  try {
    saving.value = true

    // 更新修改时间
    relationshipData.updatedAt = new Date().toISOString()

    // 保存关系图数据
    await window.electron.saveRelationshipData(
      bookName,
      relationshipName,
      JSON.parse(JSON.stringify(relationshipData))
    )

    // 生成并保存缩略图
    if (relationshipData.nodes.length > 0) {
      // 获取图表实例, 获取图片base64
      const imageBase64 = await graphRef.value.getInstance().getImageBase64()
      await window.electron.updateRelationshipThumbnail({
        bookName,
        relationshipName,
        thumbnailData: imageBase64
      })
    }

    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存关系图失败:', error)
    ElMessage.error('保存关系图失败')
  } finally {
    saving.value = false
  }
}

// 环绕菜单相关响应式变量
const showRadialMenu = ref(false)
const nodeMenuPanel = ref({
  width: 160,
  height: 160,
  x: 0,
  y: 0
})

// 双击检测相关变量
let clickTimer = null
let clickCount = 0
let lastClickNode = null // 记录上次点击的节点
const CLICK_DELAY = 250 // 双击检测延迟时间（毫秒），缩短以便更快响应

// 原生双击事件处理（优先级最高）
function handleNodeDoubleClickDirect(node, event) {
  console.log('原生双击事件触发，节点ID:', node.id)
  
  // 阻止事件冒泡
  event.stopPropagation()
  
  // 清除单击定时器
  if (clickTimer) {
    clearTimeout(clickTimer)
    clickTimer = null
  }
  
  // 重置点击计数
  clickCount = 0
  lastClickNode = null
  
  // 设置选中的节点
  selectedNode.value = node
  
  // 隐藏环绕菜单
  showRadialMenu.value = false
  
  // 触发新增角色操作
  handleNodeDoubleClick(node)
}

// 角色点击事件，显示环绕菜单
const onNodeClick = (nodeObject) => {
  // 如果在连线模式下，处理连线目标节点选择
  if (isLinkMode.value && linkStartNode.value) {
    // 检查是否点击了同一个节点
    if (linkStartNode.value.id === nodeObject.id) {
      ElMessage.warning('不能连接到自己')
      return
    }

    // 检查连线是否已存在
    const existingLine = relationshipData.lines.find(
      (line) => line.from === linkStartNode.value.id && line.to === nodeObject.id
    )
    if (existingLine) {
      ElMessage.warning('连线已存在')
      // 退出连线模式
      isLinkMode.value = false
      linkStartNode.value = null
      return
    }

    // 创建新连线
    const newLine = {
      id: genId(),
      from: linkStartNode.value.id,
      to: nodeObject.id,
      text: '',
      fontColor: '#409eff',
      lineShape: 1
    }

    // 添加到数据源
    relationshipData.lines.push(newLine)

    // 使用增量更新
    const graphInstance = graphRef.value?.getInstance()
    if (graphInstance) {
      // 添加新连线
      graphInstance.addLines([newLine])
      
      // 重新计算并应用角色大小（因为连线关系可能改变了层级）
      applyNodeSizes()
    }

    // 退出连线模式
    isLinkMode.value = false
    linkStartNode.value = null

    ElMessage.success('连线创建成功')
    return
  }
  
  // 设置选中的角色
  selectedNode.value = nodeObject

  // 如果点击的不是同一个节点，重置计数
  if (lastClickNode !== nodeObject.id) {
    clickCount = 0
    lastClickNode = nodeObject.id
  }

  // 增加点击计数
  clickCount++
  
  console.log('节点点击，当前计数:', clickCount, '节点ID:', nodeObject.id)

  // 清除之前的定时器（但不重置计数）
  if (clickTimer) {
    clearTimeout(clickTimer)
    clickTimer = null
  }

  // 设置新的定时器
  clickTimer = setTimeout(() => {
    console.log('定时器触发，最终计数:', clickCount)
    
    if (clickCount === 1) {
      // 单击：显示环绕菜单
      console.log('触发单击操作')
      showRadialMenu.value = false
      const t = setTimeout(() => {
        const graphInstance = graphRef.value?.getInstance()
        if (graphInstance) {
          const viewCoordinate = graphInstance.getClientCoordinateByCanvasCoordinate({
            x: nodeObject.x + nodeObject.el.offsetHeight / 2,
            y: nodeObject.y + nodeObject.el.offsetHeight / 2
          })
          nodeMenuPanel.value.x = viewCoordinate.x - graphInstance.options.canvasOffset.x
          nodeMenuPanel.value.y = viewCoordinate.y - graphInstance.options.canvasOffset.y
          showRadialMenu.value = true
        }
        clearTimeout(t)
      }, 50) // 缩短延迟
    } else if (clickCount >= 2) {
      // 双击：触发新增角色操作（备用方案，一般不会执行到这里）
      console.log('触发双击操作 - 新增角色')
      showRadialMenu.value = false
      handleNodeDoubleClick(nodeObject)
    }
    
    // 重置点击计数和定时器
    clickCount = 0
    lastClickNode = null
    clickTimer = null
  }, CLICK_DELAY)
}

// 连线点击事件处理
const onLineClick = (line) => {
  if (!line || !line.id) {
    console.warn('Invalid line object:', line)
    return
  }

  selectedEdge.value = line
  edgeForm.text = line.text || ''
  edgeDialogVisible.value = true

  // console.log('Edge dialog opened for line:', line.id, 'with text:', line.text)
}

// 画布点击时隐藏菜单
const onCanvasClick = () => {
  showRadialMenu.value = false
  
  // 如果在连线模式下，退出连线模式
  if (isLinkMode.value) {
    isLinkMode.value = false
    linkStartNode.value = null
    ElMessage.info('已取消连线')
  }
}

// 环绕菜单事件处理函数（预留实现）
function handleNodeInfo() {
  if (!selectedNode.value) return
  // 初始化表单
  infoForm.text = selectedNode.value.text
  infoForm.gender = selectedNode.value.data?.gender || 'none' // 如果没有性别信息，默认无
  infoForm.color = presetColors.find((c) => c.value === selectedNode.value.color)
    ? selectedNode.value.color
    : ''
  customColor.value = !infoForm.color ? selectedNode.value.color || '' : ''
  infoForm.description = selectedNode.value.data?.description || ''
  // 如果有头像路径，转换为 file:// 协议以便预览
  const avatarPath = selectedNode.value.data?.avatar || ''
  infoForm.avatar = getAvatarSrc(avatarPath)

  // 检查当前角色文本是否对应已存在的角色
  const existingCharacter = characters.value.find((c) => c.name === selectedNode.value.text)
  if (existingCharacter) {
    infoForm.characterId = existingCharacter.id
    // 如果角色有性别信息，使用角色的性别，否则保持当前角色的性别
    if (existingCharacter.gender) {
      infoForm.gender = existingCharacter.gender
    }
  } else {
    // 如果是新名称，设置为文本内容
    infoForm.characterId = selectedNode.value.text
  }

  // 如果角色有保存的 characterId，优先使用，并回填角色信息
  if (selectedNode.value.data?.characterId) {
    infoForm.characterId = selectedNode.value.data.characterId
    // 根据characterId查找对应的角色，回填头像等信息
    const matchedCharacter = characters.value.find(
      (c) => c.id === selectedNode.value.data.characterId
    )
    if (matchedCharacter) {
      // 如果角色没有头像或角色有头像，使用角色的头像
      if (!infoForm.avatar && matchedCharacter.avatar) {
        infoForm.avatar = matchedCharacter.avatar
      }
      // 同步角色的描述信息（如果角色没有描述）
      if (!infoForm.description && (matchedCharacter.biography || matchedCharacter.introduction)) {
        infoForm.description = matchedCharacter.biography || matchedCharacter.introduction || ''
      }
      // 同步角色的性别（如果角色没有性别或角色有性别）
      if (matchedCharacter.gender) {
        infoForm.gender = matchedCharacter.gender === '女' ? 'female' : matchedCharacter.gender === '男' ? 'male' : 'none'
      }
    }
  } else if (existingCharacter && existingCharacter.avatar) {
    // 如果通过名称匹配到角色且角色有头像，回填头像
    if (!infoForm.avatar) {
      infoForm.avatar = existingCharacter.avatar
    }
  }

  // 重置过滤结果
  filteredCharacters.value = characters.value

  infoDialogVisible.value = true
  showRadialMenu.value = false
}
function handleNodeAdd() {
  // 新增一个名为“新角色”的角色，并自动连线
  if (!selectedNode.value) return
  // 重置表单为默认值
  resetForm()

  // 设置新增模式标识
  isAddMode.value = true

  // 显示角色编辑弹框
  infoDialogVisible.value = true
  showRadialMenu.value = false
}
function handleNodeLink() {
  if (!selectedNode.value) return

  // 进入连线模式
  isLinkMode.value = true

  // 隐藏环绕菜单
  showRadialMenu.value = false

  // 使用RelationGraph的正确连线API
  const graphInstance = graphRef.value?.getInstance()
  if (graphInstance) {
    // 使用startCreatingLinePlot方法启动连线创建模式
    if (typeof graphInstance.startCreatingLinePlot === 'function') {
      const creatingOptions = {
        onCreateLine: (fromNode, toNode) => {
          console.log('Line created from', fromNode.id, 'to', toNode.id)

          // 创建新连线数据
          const newLine = {
            id: genId(),
            from: fromNode.id,
            to: toNode.id,
            text: '',
            fontColor: '#409eff',
            lineShape: 1
          }

          // 添加到数据源
          relationshipData.lines.push(newLine)

          // 使用增量更新而不是重新设置整个数据
          const graphInstance = graphRef.value?.getInstance()
          if (graphInstance) {
            // 添加新连线
            graphInstance.addLines([newLine])
            // 重新布局
            // graphInstance.doLayout()

            // 重新计算并应用角色大小（因为连线关系可能改变了层级）
            applyNodeSizes()
          }

          // 退出连线模式
          isLinkMode.value = false

          // 停止连线创建模式
          if (typeof graphInstance.stopCreatingLinePlot === 'function') {
            graphInstance.stopCreatingLinePlot()
          }

          ElMessage.success('连线创建成功')
        }
      }

      // 启动连线创建模式
      graphInstance.startCreatingLinePlot(null, creatingOptions)
      console.log('Started line creation mode with startCreatingLinePlot')

      // 设置起始角色，这样预览连线就会从当前角色开始
      if (graphInstance.options && graphInstance.options.editingLineController) {
        // 设置起始角色位置
        const startNode = graphInstance.getNodeById(selectedNode.value.id)
        if (startNode) {
          graphInstance.options.editingLineController.startPoint = {
            x: startNode.x,
            y: startNode.y
          }
          graphInstance.options.editingLineController.endPoint = {
            x: startNode.x,
            y: startNode.y
          }
          graphInstance.updateEditingLineView()
        }
      }
    } else {
      console.warn('startCreatingLinePlot method not found')
      ElMessage.error('连线功能不可用')
      return
    }
  }

  // 显示连线模式提示
  ElMessage.info('连线模式已启动，请点击目标角色完成连线')
}
function handleNodeDelete() {
  if (!selectedNode.value) return

  const nodeName = selectedNode.value.text || '未知角色'

  ElMessageBox.confirm(
    `确定要删除角色"${nodeName}"吗？\n删除操作将同时删除当前角色和所有子角色，此操作不可恢复！`,
    '确认删除',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
      dangerouslyUseHTMLString: false
    }
  )
    .then(() => {
      // 用户确认删除
      const nodeId = selectedNode.value.id

      // 递归查找所有子角色id
      function collectDescendants(id, nodes, lines, collected = new Set()) {
        collected.add(id)
        lines.forEach((line) => {
          if (line.from === id && !collected.has(line.to)) {
            collectDescendants(line.to, nodes, lines, collected)
          }
        })
        return collected
      }

      const toDeleteIds = collectDescendants(nodeId, relationshipData.nodes, relationshipData.lines)
      const deleteCount = toDeleteIds.size

      try {
        // 删除角色
        relationshipData.nodes = relationshipData.nodes.filter((n) => !toDeleteIds.has(n.id))
        // 删除相关连线
        relationshipData.lines = relationshipData.lines.filter(
          (l) => !toDeleteIds.has(l.from) && !toDeleteIds.has(l.to)
        )

        // 使用增量更新而不是重新设置整个数据
        const graphInstance = graphRef.value?.getInstance()
        if (graphInstance) {
          // 删除角色和连线
          toDeleteIds.forEach((nodeId) => {
            graphInstance.removeNodeById(nodeId)
          })

          // 重新布局并居中
          // graphInstance.doLayout()
          graphInstance.moveToCenter()

          // 重新计算并应用角色大小（因为删除角色可能改变了层级关系）
          applyNodeSizes()
        }

        // 清空选中的角色
        selectedNode.value = null
        showRadialMenu.value = false

        // 显示删除结果
        if (deleteCount === 1) {
          ElMessage.success('角色已删除')
        } else {
          ElMessage.success(`已删除 ${deleteCount} 个角色及其相关连线`)
        }
      } catch (error) {
        console.error('删除角色失败:', error)
        ElMessage.error('删除失败，请重试')
      }
    })
    .catch(() => {
      // 用户取消删除
      showRadialMenu.value = false
    })
}

// 信息编辑弹窗相关
const infoDialogVisible = ref(false)
const infoForm = reactive({
  text: '',
  gender: 'none', // 默认无
  color: '',
  description: '',
  characterId: '', // 选中的角色谱id
  avatar: '' // 头像路径或链接
})

// 连线编辑弹窗相关
const edgeDialogVisible = ref(false)
const selectedEdge = ref(null)
const edgeForm = reactive({
  text: ''
})

// 新增/编辑模式标识
const isAddMode = ref(false)

// 连线模式相关状态
const isLinkMode = ref(false)

const presetColors = [
  { label: '蓝色', value: '#409eff' },
  { label: '橙色', value: '#ff5819' },
  { label: '红色', value: '#f56c6c' },
  { label: '绿色', value: '#67c23a' }
]
const customColor = ref('')

// 过滤角色数据
function filterCharacters(query) {
  if (query === '') {
    filteredCharacters.value = characters.value
  } else {
    filteredCharacters.value = characters.value.filter((character) =>
      character.name.toLowerCase().includes(query.toLowerCase())
    )
  }
}

// 选择角色谱时自动同步性别、描述、背景色、头像
function onCharacterChange(val) {
  // 检查是否是已存在的角色ID
  const character = characters.value.find((c) => c.id === val)
  if (character) {
    // 选择已存在的角色
    infoForm.text = character.name
    infoForm.gender = character.gender === '女' ? 'female' : character.gender === '男' ? 'male' : 'none' // 性别映射
    infoForm.description = character.introduction || character.biography || ''
    infoForm.color = character.gender === '女' ? '#ff5819' : '#409eff'
    // 如果角色有头像，回填头像信息
    infoForm.avatar = character.avatar || ''
    customColor.value = ''
  } else {
    // 输入新名称，设置默认值
    infoForm.text = val
    infoForm.gender = 'female' // 新名称默认女性
    infoForm.description = ''
    infoForm.color = '#409eff'
    infoForm.avatar = '' // 清空头像
    customColor.value = ''
  }
}

// 下拉框显示/隐藏时的处理
function onSelectVisibleChange(visible) {
  if (visible) {
    // 显示时重置过滤结果
    filteredCharacters.value = characters.value
  }
}

// 选择预设色
function onCustomColor(val) {
  infoForm.color = val
}

// 选择预设颜色
function selectPresetColor(color) {
  infoForm.color = color
  customColor.value = '' // 清空自定义颜色
}

// 选择本地图片
async function selectLocalImage() {
  try {
    const result = await window.electron.selectImage()
    if (result && result.dataUrl) {
      // 使用 base64 数据 URL，可以直接在浏览器中显示
      infoForm.avatar = result.dataUrl
      ElMessage.success('图片选择成功')
    }
  } catch (error) {
    console.error('选择图片失败:', error)
    ElMessage.error('选择图片失败')
  }
}

// 重置表单到默认值
function resetForm() {
  infoForm.text = ''
  infoForm.gender = 'none' // 重置为默认无
  infoForm.color = ''
  infoForm.description = ''
  infoForm.characterId = ''
  infoForm.avatar = ''
  customColor.value = '#409eff'
}

// 处理节点双击事件（左键双击头像新增角色）
function handleNodeDoubleClick(node) {
  // 设置选中的节点
  selectedNode.value = node
  
  // 重置表单为默认值
  resetForm()
  
  // 设置新增模式标识
  isAddMode.value = true
  
  // 隐藏环绕菜单
  showRadialMenu.value = false
  
  // 显示角色编辑弹框
  infoDialogVisible.value = true
}

// 处理节点右键点击事件（右键双击进入连线模式）
let rightClickTimer = null
let rightClickCount = 0

function handleNodeRightClick(node, event) {
  // 阻止默认右键菜单
  event.preventDefault()
  
  // 设置选中的节点
  selectedNode.value = node
  
  // 增加右键点击计数
  rightClickCount++
  
  // 清除之前的定时器
  if (rightClickTimer) {
    clearTimeout(rightClickTimer)
  }
  
  // 设置新的定时器
  rightClickTimer = setTimeout(() => {
    if (rightClickCount === 2) {
      // 双击右键：以当前节点为起点进入连线模式
      handleNodeLinkFromNode(node)
    }
    // 重置点击计数
    rightClickCount = 0
  }, 300) // 300ms内的点击视为双击
}

// 连线起始节点
const linkStartNode = ref(null)

// 从指定节点开始连线
function handleNodeLinkFromNode(node) {
  if (!node) return

  // 设置连线起始节点
  linkStartNode.value = node

  // 进入连线模式
  isLinkMode.value = true

  // 隐藏环绕菜单
  showRadialMenu.value = false

  // 显示连线模式提示
  ElMessage.info(`从 "${node.text}" 开始连线，请点击目标角色完成连线`)
  console.log('Link mode started from node:', node.id)
}

// 关闭对话框并重置表单
function closeDialog() {
  infoDialogVisible.value = false
  isAddMode.value = false
  resetForm()
}

// 关闭连线编辑对话框
function closeEdgeDialog() {
  edgeDialogVisible.value = false
  selectedEdge.value = null
  edgeForm.text = ''
}

// 保存角色信息
async function saveNodeInfo() {
  if (isAddMode.value) {
    // 新增模式：创建新角色
    if (!infoForm.characterId.trim()) {
      ElMessage.warning('请输入角色名称')
      return
    }
    const newNodeId = genId()

    // 计算新角色的层级
    let newNodeLevel = 0
    if (selectedNode.value) {
      // 如果有选中的父角色，计算新角色的层级
      const parentLevel = calculateNodeLevel(
        selectedNode.value.id,
        relationshipData.nodes,
        relationshipData.lines
      )
      newNodeLevel = parentLevel + 1
    }

    // 根据层级计算角色大小
    const nodeSize = calculateNodeSize(
      newNodeId,
      relationshipData.nodes,
      relationshipData.lines,
      newNodeLevel
    )

    // 检查是否是已存在的角色ID
    let nodeText = infoForm.characterId.trim()
    let nodeCharacterId = nodeText
    const matchedCharacter = characters.value.find((c) => c.id === nodeText)
    if (matchedCharacter) {
      // 如果是已存在的角色，使用角色名称作为角色文本，角色ID作为characterId
      nodeText = matchedCharacter.name
      nodeCharacterId = matchedCharacter.id
    } else {
      // 如果是新角色，同步到人物谱
      try {
        const newCharacter = {
          id: genId(), // 生成新的角色ID
          name: nodeText,
          gender: infoForm.gender === 'female' ? '女' : infoForm.gender === 'male' ? '男' : '无',
          avatar: infoForm.avatar ? infoForm.avatar.replace(/^file:\/\//, '') : '',
          introduction: '',
          biography: '',
          relationship: '',
          abilities: '',
          tags: []
        }
        
        // 保存到人物谱
        await window.electron.saveCharacter(bookName, newCharacter)
        
        // 更新本地角色列表
        characters.value.push(newCharacter)
        filteredCharacters.value = [...characters.value]
        
        // 使用生成的角色ID
        nodeCharacterId = newCharacter.id
        
        ElMessage.success('角色已同步到人物谱')
      } catch (error) {
        console.error('同步角色到人物谱失败:', error)
        ElMessage.warning('角色创建成功，但同步到人物谱失败')
      }
    }

    const newNode = {
      id: newNodeId,
      text: nodeText,
      type: 'character',
      color: infoForm.color || customColor.value || '#409eff',
      width: nodeSize.width,
      height: nodeSize.height,
      data: {
        description: infoForm.description || '',
        gender: infoForm.gender || 'none',
        characterId: nodeCharacterId,
        avatar: infoForm.avatar ? infoForm.avatar.replace(/^file:\/\//, '') : '',
        fontSize: nodeSize.fontSize
      }
    }
    relationshipData.nodes.push(newNode)
    if (selectedNode.value) {
      // Create link to parent if a node was selected
      relationshipData.lines.push({
        id: genId(),
        from: selectedNode.value.id,
        to: newNodeId,
        text: '',
        fontColor: '#409eff'
      })
    }

    // 使用增量更新而不是重新设置整个数据
    const graphInstance = graphRef.value?.getInstance()
    if (graphInstance) {
      // 添加新角色
      graphInstance.addNodes([newNode])

      // 如果有连线，也添加连线
      if (selectedNode.value) {
        const newLine = relationshipData.lines[relationshipData.lines.length - 1]
        graphInstance.addLines([newLine])
      }

      // 重新布局并居中
      graphInstance.doLayout()
      graphInstance.moveToCenter()
    }

    infoDialogVisible.value = false
    isAddMode.value = false
    ElMessage.success('新角色已创建')
  } else {
    // 编辑模式：更新现有角色
    if (!infoForm.characterId.trim()) {
      ElMessage.warning('请输入角色名称')
      return
    }

    // 检查是否是已存在的角色ID
    const existingCharacter = characters.value.find((c) => c.id === infoForm.characterId)
    if (existingCharacter) {
      // 选择已存在的角色
      selectedNode.value.text = existingCharacter.name
      // 确保 data 对象存在
      if (!selectedNode.value.data) {
        selectedNode.value.data = {}
      }
      selectedNode.value.data.characterId = existingCharacter.id
      // 如果表单中没有头像但角色有头像，使用角色的头像
      if (!infoForm.avatar && existingCharacter.avatar) {
        infoForm.avatar = existingCharacter.avatar
      }
      // 如果表单中没有描述但角色有描述，使用角色的描述
      if (
        !infoForm.description &&
        (existingCharacter.biography || existingCharacter.introduction)
      ) {
        infoForm.description = existingCharacter.biography || existingCharacter.introduction || ''
      }
    } else {
      // 输入新名称
      selectedNode.value.text = infoForm.characterId
      // 确保 data 对象存在
      if (!selectedNode.value.data) {
        selectedNode.value.data = {}
      }
      selectedNode.value.data.characterId = '' // 清空角色ID，表示是新数据
    }

    // 确保 data 对象存在
    if (!selectedNode.value.data) {
      selectedNode.value.data = {}
    }

    selectedNode.value.data.gender = infoForm.gender
    selectedNode.value.color = infoForm.color || customColor.value
    selectedNode.value.data.description = infoForm.description
    selectedNode.value.data.avatar = infoForm.avatar
      ? infoForm.avatar.replace(/^file:\/\//, '')
      : ''

    // 同步到数据源
    const node = relationshipData.nodes.find((n) => n.id === selectedNode.value.id)
    if (node) {
      node.text = selectedNode.value.text
      node.color = selectedNode.value.color
      // 确保目标角色的 data 对象存在
      if (!node.data) {
        node.data = {}
      }
      node.data.gender = selectedNode.value.data.gender
      node.data.description = selectedNode.value.data.description
      node.data.characterId = selectedNode.value.data.characterId
      node.data.avatar = selectedNode.value.data.avatar
    }

    // 使用增量更新而不是重新设置整个数据
    const graphInstance = graphRef.value?.getInstance()
    if (graphInstance) {
      // 通知数据已更新，让RelationGraph重新渲染
      graphInstance.dataUpdated()
    }

    infoDialogVisible.value = false
    ElMessage.success('角色信息已更新')
  }
}

// 保存连线信息
function saveEdgeInfo() {
  if (!selectedEdge.value) {
    ElMessage.warning('没有选中的连线')
    return
  }

  if (!edgeForm.text.trim()) {
    ElMessage.warning('请输入关系描述')
    return
  }

  try {
    // 更新连线文本
    selectedEdge.value.text = edgeForm.text.trim()

    // 同步到本地数据
    const line = relationshipData.lines.find((l) => l.id === selectedEdge.value.id)
    if (line) {
      line.text = edgeForm.text.trim()
      // 确保文字颜色设置
      line.fontColor = line.fontColor || '#409eff'
    }

    // 使用增量更新而不是重新设置整个数据
    const graphInstance = graphRef.value?.getInstance()
    if (graphInstance) {
      // 通知数据已更新，让RelationGraph重新渲染
      graphInstance.dataUpdated()
    }

    edgeDialogVisible.value = false
    ElMessage.success('关系信息已更新')
  } catch (error) {
    console.error('Error saving edge info:', error)
    ElMessage.error('保存失败，请重试')
  }
}

// 根据角色层级计算角色大小和字体大小
function calculateNodeSize(nodeId, nodes, lines, level = 0) {
  // 根结点最大
  if (level === 0) {
    return { width: 100, height: 100, fontSize: 20 }
  }
  // 第一级子角色中等
  else if (level === 1) {
    return { width: 90, height: 90, fontSize: 18 }
  }
  // 第二级子角色较小
  else if (level === 2) {
    return { width: 80, height: 80, fontSize: 16 }
  }
  // 第三级及以后角色最小且一致
  else {
    return { width: 70, height: 70, fontSize: 14 }
  }
}

// 计算角色的层级
function calculateNodeLevel(nodeId, nodes, lines, visited = new Set()) {
  if (visited.has(nodeId)) return 0

  visited.add(nodeId)

  // 找到根结点（没有父角色的角色）
  const hasParent = lines.some((line) => line.to === nodeId)
  if (!hasParent) {
    return 0
  }

  // 找到父角色
  const parentLine = lines.find((line) => line.to === nodeId)
  if (parentLine) {
    const parentLevel = calculateNodeLevel(parentLine.from, nodes, lines, visited)
    return parentLevel + 1
  }

  return 0
}

// 应用角色大小
function applyNodeSizes() {
  const graphInstance = graphRef.value?.getInstance()
  if (!graphInstance) return

  relationshipData.nodes.forEach((node) => {
    const level = calculateNodeLevel(node.id, relationshipData.nodes, relationshipData.lines)
    const size = calculateNodeSize(node.id, relationshipData.nodes, relationshipData.lines, level)

    // 更新角色大小和字体大小
    node.width = size.width
    node.height = size.height

    // 确保 data 对象存在
    if (!node.data) {
      node.data = {}
    }
    node.data.fontSize = size.fontSize

    // 更新RelationGraph中的角色
    const graphNode = graphInstance.getNodeById(node.id)
    if (graphNode) {
      graphNode.width = size.width
      graphNode.height = size.height
      if (!graphNode.data) {
        graphNode.data = {}
      }
      graphNode.data.fontSize = size.fontSize
    }
  })

  // 通知数据已更新
  graphInstance.dataUpdated()
}

// 获取角色样式
function getNodeStyle(node) {
  return {
    width: node.width + 'px',
    height: node.height + 'px',
    backgroundColor: node.data?.avatar ? 'transparent' : node.color || '#409eff',
    backgroundImage: node.data?.avatar ? `url(${getAvatarSrc(node.data.avatar)})` : 'none',
    fontSize: (node.data?.fontSize || 16) + 'px'
  }
}

// 获取头像源地址
function getAvatarSrc(avatarPath) {
  if (!avatarPath) return ''

  // 直接返回路径（可能是 http/https URL 或 base64 数据 URL）
  return avatarPath
}

onMounted(async () => {
  // 等待下一个 tick 确保图表组件完全挂载
  await nextTick()
  loadCharacters()
  loadRelationshipData()
})
</script>

<style lang="scss" scoped>
.relationship-design {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.design-toolbar {
  display: flex;
  // justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.design-canvas {
  flex: 1;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

:deep(.relation-graph) {
  width: 100%;
  height: 100%;
}

:deep(.relation-graph-canvas) {
  background-color: var(--bg-primary);
}

.node-detail {
  .node-description {
    margin: 8px 0;
    line-height: 1.5;
  }

  .node-info {
    p {
      margin: 4px 0;
      color: var(--text-base);
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .design-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}

/* 颜色方块样式 */
.color-squares {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-square {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  position: relative;
}

.color-square:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.color-square-selected {
  border: 2px solid #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.color-square-selected::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* 头像预览样式 */
.avatar-preview {
  width: 80px;
  height: 80px;
  position: absolute;
  top: -100px;
  right: 0;
}
.preview-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

/* 自定义角色样式 */
.custom-node {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
}

.node-text {
  color: white;
  font-weight: bold;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  line-height: 1.2;
  word-break: break-word;
  padding: 4px;
}
</style>
