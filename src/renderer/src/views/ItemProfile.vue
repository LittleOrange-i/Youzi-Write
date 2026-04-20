<template>
  <LayoutTool title="物品档案">
    <template #headrAction>
      <el-button type="primary" @click="handleCreateItem">
        <el-icon><Plus /></el-icon>
        <span>新增物品</span>
      </el-button>
    </template>
    <template #default>
      <!-- 筛选与视图切换栏 -->
      <div class="view-toggle">
        <el-input
          v-model="searchQuery"
          placeholder="搜索物品名称"
          clearable
          style="width: 200px; margin-right: 10px;"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="filterCategory"
          placeholder="全部类型"
          clearable
          style="width: 130px; margin-right: 10px;"
        >
          <el-option
            v-for="cat in ITEM_CATEGORIES"
            :key="cat.value"
            :label="cat.label"
            :value="cat.value"
          />
        </el-select>
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button value="card">
            <el-icon><Grid /></el-icon>
            卡片
          </el-radio-button>
          <el-radio-button value="table">
            <el-icon><List /></el-icon>
            表格
          </el-radio-button>
        </el-radio-group>
      </div>

      <!-- 卡片模式 -->
      <div v-if="viewMode === 'card'" class="item-grid">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="item-card"
          :style="item.markerColor ? { borderTopColor: item.markerColor } : {}"
          @click="handlePreviewItem(item)"
        >
          <!-- 物品图标/图片区域 -->
          <div class="item-image-wrap" @click.stop="previewItemImage(item)">
            <el-image
              v-if="item.image"
              :src="item.image"
              alt="物品图"
              class="item-image"
              fit="cover"
            />
            <div v-else class="item-image-placeholder">
              <el-icon :size="28"><Box /></el-icon>
            </div>
          </div>
          <!-- 主体信息 -->
          <div class="item-info">
            <div class="item-name-row">
              <span
                v-if="item.markerColor"
                class="item-marker"
                :style="{ backgroundColor: item.markerColor }"
              ></span>
              <span class="item-name">{{ item.name }}</span>
            </div>
            <!-- 类型与稀有度 -->
            <div class="item-meta-row">
              <el-tag size="small" :type="getCategoryTagType(item.category)" class="meta-tag">
                {{ getCategoryLabel(item.category) }}
              </el-tag>
              <el-tag v-if="item.rarity" size="small" :type="getRarityTagType(item.rarity)" class="meta-tag">
                {{ item.rarity }}
              </el-tag>
            </div>
            <!-- 别名 -->
            <div v-if="item.aliases && item.aliases.length > 0" class="item-aliases">
              <span class="section-label">别名：</span>
              <el-tag
                v-for="(alias, idx) in item.aliases.slice(0, 4)"
                :key="idx"
                size="small"
                type="info"
                class="alias-tag"
              >{{ alias }}</el-tag>
              <el-tag v-if="item.aliases.length > 4" size="small" type="info" class="alias-tag">
                +{{ item.aliases.length - 4 }}
              </el-tag>
            </div>
            <!-- 标签 -->
            <div v-if="item.tags && item.tags.length > 0" class="item-tags">
              <el-tag
                v-for="(tag, idx) in item.tags.slice(0, 4)"
                :key="idx"
                size="small"
                class="tag-item"
              >{{ tag }}</el-tag>
              <el-tag v-if="item.tags.length > 4" size="small" class="tag-item">
                +{{ item.tags.length - 4 }}
              </el-tag>
            </div>
            <!-- 描述 -->
            <div v-if="item.description" class="item-desc">{{ item.description }}</div>
          </div>
          <!-- 操作按钮（悬停显示） -->
          <div class="item-actions">
            <el-icon @click.stop="handleEditItem(item)"><Edit /></el-icon>
            <el-icon @click.stop="handleDeleteItem(item)"><Delete /></el-icon>
          </div>
        </div>
      </div>

      <!-- 表格模式 -->
      <div v-else-if="viewMode === 'table'" class="item-table">
        <el-table
          ref="tableRef"
          :data="filteredItems"
          row-key="id"
          border
          style="width: 100%"
          @row-click="handlePreviewItem"
        >
          <el-table-column label="图片" width="70" align="center">
            <template #default="{ row }">
              <div class="table-image" @click.stop="previewItemImage(row)">
                <el-image
                  v-if="row.image"
                  :src="row.image"
                  class="table-image-img"
                  fit="cover"
                />
                <div v-else class="table-image-placeholder">
                  <el-icon :size="18"><Box /></el-icon>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="名称" width="130" align="center">
            <template #default="{ row }">
              <div class="table-name-cell">
                <span
                  v-if="row.markerColor"
                  class="table-marker"
                  :style="{ backgroundColor: row.markerColor }"
                ></span>
                <span>{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="getCategoryTagType(row.category)">
                {{ getCategoryLabel(row.category) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="rarity" label="稀有度" width="90" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.rarity" size="small" :type="getRarityTagType(row.rarity)">
                {{ row.rarity }}
              </el-tag>
              <span v-else class="no-data">—</span>
            </template>
          </el-table-column>
          <el-table-column label="别名" width="180" align="center">
            <template #default="{ row }">
              <div v-if="row.aliases && row.aliases.length > 0" class="table-aliases">
                <el-tag
                  v-for="(alias, idx) in row.aliases"
                  :key="idx"
                  size="small"
                  type="info"
                  class="alias-item"
                >{{ alias }}</el-tag>
              </div>
              <span v-else class="no-data">无</span>
            </template>
          </el-table-column>
          <el-table-column label="标签" width="160" align="center">
            <template #default="{ row }">
              <div v-if="row.tags && row.tags.length > 0" class="table-tags">
                <el-tag v-for="tag in row.tags" :key="tag" size="small" class="tag-item">
                  {{ tag }}
                </el-tag>
              </div>
              <span v-else class="no-data">无</span>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="物品描述" min-width="200" align="center">
            <template #default="{ row }">
              <div class="table-text-preview">{{ row.description }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="effect" label="效果/能力" min-width="200" align="center">
            <template #default="{ row }">
              <div class="table-text-preview">{{ row.effect }}</div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right" align="center">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button type="info" size="small" @click.stop="handlePreviewItem(row)">
                  <el-icon><View /></el-icon>
                  预览
                </el-button>
                <el-button type="primary" size="small" @click.stop="handleEditItem(row)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button type="danger" size="small" @click.stop="handleDeleteItem(row)">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-empty
        v-if="filteredItems.length === 0"
        :image-size="200"
        description="暂无物品"
        class="empty-state"
      />
    </template>
  </LayoutTool>

  <!-- 创建/编辑物品弹框 -->
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑物品' : '新增物品'"
    width="700px"
    align-center
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="resetForm"
    class="edit-dialog"
  >
    <div ref="editScrollContainer" class="edit-scroll-container">
      <el-form ref="formRef" :model="itemForm" :rules="formRules" label-width="80px">
        <!-- 图片区域 -->
        <el-form-item label="图片" class="image-form-item">
          <div class="image-form-section">
            <div class="image-preview" @click="previewFormImage">
              <el-image
                v-if="itemForm.image"
                :src="itemForm.image"
                alt="物品图"
                class="form-image"
                fit="cover"
              />
              <div v-else class="form-image-placeholder">
                <el-icon :size="28"><Box /></el-icon>
              </div>
            </div>
            <div class="image-input-section">
              <div class="input-row">
                <el-input
                  v-model="itemForm.image"
                  placeholder="请输入图片链接或选择本地图片"
                  clearable
                />
                <el-button @click="selectLocalImage">选择图片</el-button>
              </div>
            </div>
          </div>
        </el-form-item>

        <el-row :gutter="10">
          <el-col :span="12">
            <el-form-item label="名称" prop="name">
              <el-input v-model="itemForm.name" placeholder="请输入物品名称" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型" prop="category">
              <el-select v-model="itemForm.category" placeholder="请选择物品类型" style="width:100%">
                <el-option
                  v-for="cat in ITEM_CATEGORIES"
                  :key="cat.value"
                  :label="cat.label"
                  :value="cat.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="10">
          <el-col :span="12">
            <el-form-item label="稀有度" prop="rarity">
              <el-select v-model="itemForm.rarity" placeholder="请选择稀有度" clearable style="width:100%">
                <el-option
                  v-for="r in ITEM_RARITIES"
                  :key="r.value"
                  :label="r.label"
                  :value="r.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源" prop="origin">
              <el-input v-model="itemForm.origin" placeholder="物品来源或获取方式" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 别名 -->
        <el-form-item label="别名" prop="aliases">
          <div class="aliases-container">
            <div class="aliases-list">
              <el-tag
                v-for="(alias, index) in itemForm.aliases"
                :key="index"
                closable
                @close="removeAlias(index)"
                class="alias-tag"
              >{{ alias }}</el-tag>
            </div>
            <div v-if="itemForm.aliases.length < 20" class="alias-input-row">
              <el-input
                v-model="newAliasInput"
                placeholder="输入别名/别称"
                maxlength="15"
                show-word-limit
                @keyup.enter="addAlias"
                clearable
              />
              <el-button type="primary" @click="addAlias" :disabled="!newAliasInput.trim()">
                <el-icon><Plus /></el-icon>
                添加
              </el-button>
            </div>
            <div v-else class="alias-limit-tip">
              <el-text type="info" size="small">已达到最大数量限制（20个）</el-text>
            </div>
          </div>
        </el-form-item>

        <!-- 标签 -->
        <el-form-item label="标签" prop="tags">
          <div class="aliases-container">
            <div class="aliases-list">
              <el-tag
                v-for="(tag, index) in itemForm.tags"
                :key="index"
                closable
                @close="removeTag(index)"
                class="alias-tag"
              >{{ tag }}</el-tag>
            </div>
            <div v-if="itemForm.tags.length < 20" class="alias-input-row">
              <el-input
                v-model="newTagInput"
                placeholder="输入标签（如：上古神器、传说武器）"
                maxlength="15"
                show-word-limit
                @keyup.enter="addTag"
                clearable
              />
              <el-button type="primary" @click="addTag" :disabled="!newTagInput.trim()">
                <el-icon><Plus /></el-icon>
                添加
              </el-button>
            </div>
            <div v-else class="alias-limit-tip">
              <el-text type="info" size="small">已达到最大数量限制（20个）</el-text>
            </div>
          </div>
        </el-form-item>

        <!-- 物品描述 -->
        <el-form-item label="物品描述" prop="description">
          <div class="text-field-trigger" @click="openTextEditor('description')">
            <div v-if="itemForm.description" class="text-field-preview">
              {{ itemForm.description }}
            </div>
            <div v-else class="text-field-placeholder">
              点击编辑物品描述（外观、材质、来历等）
            </div>
            <el-icon class="text-field-icon"><Edit /></el-icon>
          </div>
        </el-form-item>

        <!-- 效果/能力 -->
        <el-form-item label="效果/能力" prop="effect">
          <div class="text-field-trigger" @click="openTextEditor('effect')">
            <div v-if="itemForm.effect" class="text-field-preview">
              {{ itemForm.effect }}
            </div>
            <div v-else class="text-field-placeholder">
              点击编辑物品效果、能力或特殊能力描述
            </div>
            <el-icon class="text-field-icon"><Edit /></el-icon>
          </div>
        </el-form-item>

        <!-- 备注 -->
        <el-form-item label="备注" prop="notes">
          <div class="text-field-trigger" @click="openTextEditor('notes')">
            <div v-if="itemForm.notes" class="text-field-preview">
              {{ itemForm.notes }}
            </div>
            <div v-else class="text-field-placeholder">
              点击编辑备注（持有者、相关人物、剧情相关等）
            </div>
            <el-icon class="text-field-icon"><Edit /></el-icon>
          </div>
        </el-form-item>

        <!-- 标记色 -->
        <el-form-item label="标记色">
          <div class="marker-selector">
            <button
              v-for="color in presetMarkerColors"
              :key="color || 'none'"
              type="button"
              class="marker-swatch"
              :class="{ active: color === itemForm.markerColor, empty: !color }"
              :style="color ? { backgroundColor: color } : {}"
              @click="itemForm.markerColor = color"
            >
              <span v-if="!color" class="marker-none">无</span>
            </button>
            <el-color-picker
              v-model="itemForm.markerColor"
              :predefine="presetMarkerColors.filter(c => !!c)"
              :show-alpha="false"
              size="small"
            />
          </div>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmSave">确认</el-button>
    </template>
  </el-dialog>

  <!-- 图片预览器 -->
  <el-image-viewer
    v-if="imageViewerVisible"
    :url-list="imageViewerSrcList"
    :initial-index="0"
    @close="imageViewerVisible = false"
  />

  <!-- 文本编辑器弹窗 -->
  <el-dialog
    v-model="textEditorVisible"
    :title="textEditorTitle"
    width="700px"
    align-center
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="text-editor-dialog"
  >
    <el-input
      v-model="textEditorContent"
      type="textarea"
      :placeholder="textEditorPlaceholder"
      :rows="20"
      :maxlength="textEditorMaxLength"
      show-word-limit
      resize="none"
    />
    <template #footer>
      <el-button @click="textEditorVisible = false">取消</el-button>
      <el-button type="primary" @click="saveTextEditor">确认</el-button>
    </template>
  </el-dialog>

  <!-- 物品预览弹框 -->
  <el-dialog
    v-model="previewDialogVisible"
    title="物品详情"
    width="700px"
    align-center
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    class="preview-dialog"
  >
    <div v-if="previewItem" class="preview-content">
      <div ref="previewScrollContainer" class="preview-scroll-container">
        <!-- 头部：图片 + 基本信息 -->
        <div class="preview-header">
          <div class="preview-image" @click="previewItemImage(previewItem)">
            <el-image
              v-if="previewItem.image"
              :src="previewItem.image"
              alt="物品图"
              class="preview-image-img"
              fit="cover"
            />
            <div v-else class="preview-image-placeholder">
              <el-icon :size="36"><Box /></el-icon>
            </div>
          </div>
          <div class="preview-details">
            <div class="preview-name-row">
              <span
                v-if="previewItem.markerColor"
                class="preview-marker"
                :style="{ backgroundColor: previewItem.markerColor }"
              ></span>
              <span class="preview-name">{{ previewItem.name }}</span>
            </div>
            <div class="preview-meta-row">
              <el-tag size="small" :type="getCategoryTagType(previewItem.category)" class="meta-tag">
                {{ getCategoryLabel(previewItem.category) }}
              </el-tag>
              <el-tag v-if="previewItem.rarity" size="small" :type="getRarityTagType(previewItem.rarity)" class="meta-tag">
                {{ previewItem.rarity }}
              </el-tag>
            </div>
            <div v-if="previewItem.origin" class="preview-origin">
              <span class="preview-info-label">来源：</span>
              <span class="preview-info-value">{{ previewItem.origin }}</span>
            </div>
          </div>
        </div>

        <!-- 别名 -->
        <div v-if="previewItem.aliases && previewItem.aliases.length > 0" class="preview-section">
          <div class="preview-section-title">别名</div>
          <div class="preview-tags-wrap">
            <el-tag
              v-for="(alias, idx) in previewItem.aliases"
              :key="idx"
              size="small"
              type="info"
              class="preview-tag"
            >{{ alias }}</el-tag>
          </div>
        </div>

        <!-- 标签 -->
        <div v-if="previewItem.tags && previewItem.tags.length > 0" class="preview-section">
          <div class="preview-section-title">标签</div>
          <div class="preview-tags-wrap">
            <el-tag
              v-for="tag in previewItem.tags"
              :key="tag"
              size="small"
              class="preview-tag"
            >{{ tag }}</el-tag>
          </div>
        </div>

        <!-- 物品描述 -->
        <div v-if="previewItem.description" class="preview-section">
          <div class="preview-section-title">物品描述</div>
          <p class="preview-text">{{ previewItem.description }}</p>
        </div>

        <!-- 效果/能力 -->
        <div v-if="previewItem.effect" class="preview-section">
          <div class="preview-section-title">效果 / 能力</div>
          <p class="preview-text">{{ previewItem.effect }}</p>
        </div>

        <!-- 备注 -->
        <div v-if="previewItem.notes" class="preview-section">
          <div class="preview-section-title">备注</div>
          <p class="preview-text">{{ previewItem.notes }}</p>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button type="primary" @click="handleEditItem(previewItem)">
        <el-icon><Edit /></el-icon>
        编辑
      </el-button>
      <el-button @click="previewDialogVisible = false">确定</el-button>
    </template>
  </el-dialog>
</template>


<script setup>
import LayoutTool from '@renderer/components/LayoutTool.vue'
import { ref, reactive, onMounted, watch, toRaw, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Grid, List, Edit, Search, View, Box } from '@element-plus/icons-vue'
import { genId } from '@renderer/utils/utils'

const route = useRoute()
const bookName = route.query.name || ''

// ========== 响应式状态 ==========
const dialogVisible = ref(false) // 创建/编辑弹框
const isEdit = ref(false) // 是否为编辑模式
const viewMode = ref('card') // 视图模式
const items = ref([]) // 物品列表
const formRef = ref(null) // 表单引用
const tableRef = ref(null) // 表格引用
const searchQuery = ref('') // 搜索关键词
const filterCategory = ref('') // 类型筛选

// 预览弹框
const previewDialogVisible = ref(false)
const previewItem = ref(null)
const previewScrollContainer = ref(null)
const editScrollContainer = ref(null)

// 图片预览
const imageViewerVisible = ref(false)
const imageViewerSrcList = ref([])

// 文本编辑器弹窗
const textEditorVisible = ref(false)
const textEditorContent = ref('')
const textEditorField = ref('')
const textEditorTitle = ref('')
const textEditorPlaceholder = ref('')
const textEditorMaxLength = ref(1000)

const newAliasInput = ref('') // 别名输入框
const newTagInput = ref('') // 标签输入框

// ========== 常量定义 ==========

// 物品类型
const ITEM_CATEGORIES = [
  { value: 'weapon', label: '武器', tagType: 'danger' },
  { value: 'armor', label: '防具', tagType: 'primary' },
  { value: 'treasure', label: '法宝/神器', tagType: 'warning' },
  { value: 'pill', label: '丹药/药材', tagType: 'success' },
  { value: 'skill', label: '功法/秘籍', tagType: '' },
  { value: 'accessory', label: '饰品/配件', tagType: 'info' },
  { value: 'material', label: '材料/素材', tagType: 'info' },
  { value: 'other', label: '其他', tagType: 'info' }
]

// 稀有度
const ITEM_RARITIES = [
  { value: '普通', label: '普通', tagType: 'info' },
  { value: '精良', label: '精良', tagType: '' },
  { value: '稀有', label: '稀有', tagType: 'primary' },
  { value: '史诗', label: '史诗', tagType: 'warning' },
  { value: '传说', label: '传说', tagType: 'danger' },
  { value: '神话', label: '神话', tagType: 'danger' }
]

// 标记色预设
const presetMarkerColors = [
  '',
  '#e198b8',
  '#FF4D4F',
  '#FF9F1C',
  '#FFD600',
  '#00C853',
  '#1890FF',
  '#B368FF',
  '#FF6F91',
  '#8D99AE',
  '#A3E635',
  '#00C9A7',
  '#13C2C2',
  '#2F54EB'
]

// ========== 表单数据 ==========
const itemForm = reactive({
  id: '',
  name: '',
  category: 'weapon',
  rarity: '',
  origin: '',
  aliases: [],
  tags: [],
  description: '',
  effect: '',
  notes: '',
  image: '',
  markerColor: ''
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入物品名称', trigger: 'blur' },
    { min: 1, max: 30, message: '名称长度在 1 到 30 个字符', trigger: 'blur' }
  ],
  category: [{ required: true, message: '请选择物品类型', trigger: 'change' }]
}

// ========== 计算属性 ==========

// 过滤后的物品列表
const filteredItems = computed(() => {
  let list = items.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(item => item.name.toLowerCase().includes(q))
  }
  if (filterCategory.value) {
    list = list.filter(item => item.category === filterCategory.value)
  }
  return list
})

// ========== 工具函数 ==========

// 获取类型标签类型
function getCategoryTagType(category) {
  const found = ITEM_CATEGORIES.find(c => c.value === category)
  return found ? found.tagType : 'info'
}

// 获取类型标签文本
function getCategoryLabel(category) {
  const found = ITEM_CATEGORIES.find(c => c.value === category)
  return found ? found.label : '其他'
}

// 获取稀有度标签类型
function getRarityTagType(rarity) {
  const found = ITEM_RARITIES.find(r => r.value === rarity)
  return found ? found.tagType : 'info'
}

// ========== 搜索 ==========
function handleSearch() {
  // 由 computed 自动处理，无需额外逻辑
}

// ========== 数据加载与保存 ==========

// 加载物品数据
async function loadItems() {
  try {
    const data = await window.electron.readItems(bookName)
    items.value = Array.isArray(data) ? data.map(item => ({
      ...item,
      aliases: Array.isArray(item.aliases) ? item.aliases : [],
      tags: Array.isArray(item.tags) ? item.tags : []
    })) : []
  } catch (error) {
    console.error('加载物品档案失败:', error)
    items.value = []
  }
}

// 保存物品数据
async function saveItems() {
  try {
    const raw = JSON.parse(JSON.stringify(toRaw(items.value)))
    const result = await window.electron.writeItems(bookName, raw)
    if (!result.success) throw new Error(result.message || '保存失败')
  } catch (error) {
    console.error('保存物品档案失败:', error)
    ElMessage.error('保存物品档案失败')
  }
}

// ========== 创建/编辑/删除 ==========

// 新增物品
function handleCreateItem() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
  nextTick(() => {
    if (editScrollContainer.value) editScrollContainer.value.scrollTop = 0
  })
}

// 编辑物品
function handleEditItem(item) {
  isEdit.value = true
  Object.assign(itemForm, JSON.parse(JSON.stringify(item)))
  previewDialogVisible.value = false
  dialogVisible.value = true
  nextTick(() => {
    if (editScrollContainer.value) editScrollContainer.value.scrollTop = 0
  })
}

// 预览物品详情
function handlePreviewItem(item) {
  if (!item) return
  previewItem.value = JSON.parse(JSON.stringify(toRaw(item)))
  previewDialogVisible.value = true
  nextTick(() => {
    if (previewScrollContainer.value) previewScrollContainer.value.scrollTop = 0
  })
}

// 删除物品
async function handleDeleteItem(item) {
  try {
    await ElMessageBox.confirm(
      `确定要删除物品"${item.name}"吗？此操作不可恢复！`,
      '删除确认',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
    const idx = items.value.findIndex(i => i.id === item.id)
    if (idx > -1) {
      items.value.splice(idx, 1)
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消
  }
}

// 确认保存
async function confirmSave() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()

    // 校验名称唯一性
    const nameExists = items.value.some(i => i.name === itemForm.name && i.id !== itemForm.id)
    if (nameExists) {
      ElMessage.error(`物品"${itemForm.name}"已存在，请勿重复创建`)
      return
    }

    if (isEdit.value) {
      const idx = items.value.findIndex(i => i.id === itemForm.id)
      if (idx > -1) items.value[idx] = { ...itemForm }
    } else {
      items.value.push({ ...itemForm, id: genId() })
    }

    dialogVisible.value = false
    ElMessage.success(isEdit.value ? '编辑成功' : '创建成功')
  } catch (error) {
    console.error('保存失败:', error)
  }
}

// ========== 别名/标签管理 ==========

function addAlias() {
  const val = newAliasInput.value.trim()
  if (!val) return
  if (itemForm.aliases.length >= 20) { ElMessage.warning('最多只能添加20个别名'); return }
  if (itemForm.aliases.includes(val)) { ElMessage.warning('该别名已存在'); return }
  itemForm.aliases.push(val)
  newAliasInput.value = ''
}

function removeAlias(index) {
  itemForm.aliases.splice(index, 1)
}

function addTag() {
  const val = newTagInput.value.trim()
  if (!val) return
  if (itemForm.tags.length >= 20) { ElMessage.warning('最多只能添加20个标签'); return }
  if (itemForm.tags.includes(val)) { ElMessage.warning('该标签已存在'); return }
  itemForm.tags.push(val)
  newTagInput.value = ''
}

function removeTag(index) {
  itemForm.tags.splice(index, 1)
}

// ========== 文本编辑器 ==========

const TEXT_EDITOR_CONFIG = {
  description: { title: '编辑物品描述', placeholder: '请输入物品描述（外观、材质、来历等）', maxLength: 1000 },
  effect: { title: '编辑效果/能力', placeholder: '请输入物品效果、特殊能力等', maxLength: 1000 },
  notes: { title: '编辑备注', placeholder: '请输入备注（持有者、相关人物、剧情关联等）', maxLength: 1000 }
}

function openTextEditor(field) {
  const config = TEXT_EDITOR_CONFIG[field]
  if (!config) return
  textEditorField.value = field
  textEditorContent.value = itemForm[field] || ''
  textEditorTitle.value = config.title
  textEditorPlaceholder.value = config.placeholder
  textEditorMaxLength.value = config.maxLength
  textEditorVisible.value = true
}

function saveTextEditor() {
  if (textEditorField.value) {
    itemForm[textEditorField.value] = textEditorContent.value
  }
  textEditorVisible.value = false
}

// ========== 图片相关 ==========

// 预览表单图片
function previewFormImage() {
  if (itemForm.image) {
    imageViewerSrcList.value = [itemForm.image]
    imageViewerVisible.value = true
  } else {
    ElMessage.warning('暂无图片可预览')
  }
}

// 预览物品图片
function previewItemImage(item) {
  if (item.image) {
    imageViewerSrcList.value = [item.image]
    imageViewerVisible.value = true
  } else {
    ElMessage.warning(`${item.name} 暂无图片可预览`)
  }
}

// 选择本地图片
async function selectLocalImage() {
  try {
    const result = await window.electron.selectImage()
    if (result && result.dataUrl) {
      itemForm.image = result.dataUrl
      ElMessage.success('图片选择成功')
    }
  } catch (error) {
    console.error('选择图片失败:', error)
    ElMessage.error('选择图片失败')
  }
}

// ========== 表单重置 ==========

function resetForm() {
  if (formRef.value) formRef.value.resetFields()
  Object.assign(itemForm, {
    id: '',
    name: '',
    category: 'weapon',
    rarity: '',
    origin: '',
    aliases: [],
    tags: [],
    description: '',
    effect: '',
    notes: '',
    image: '',
    markerColor: ''
  })
  newAliasInput.value = ''
  newTagInput.value = ''
}

// ========== 监听与生命周期 ==========

watch(items, saveItems, { deep: true })

onMounted(async () => {
  await loadItems()
})
</script>


<style lang="scss" scoped>
// 筛选/视图切换栏
.view-toggle {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 6px;
}

// ========== 卡片模式 ==========
.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 8px 0;
}

.item-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-top: 3px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  gap: 0;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

    .item-actions {
      opacity: 1;
    }
  }
}

// 物品图片区域
.item-image-wrap {
  width: 80px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-soft);
  cursor: pointer;

  .item-image {
    width: 80px;
    height: 100%;
    min-height: 80px;
    object-fit: cover;
  }

  .item-image-placeholder {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
  }
}

// 物品信息区域
.item-info {
  flex: 1;
  padding: 10px 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 5px;

  .item-name-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .item-marker {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 0 1px var(--border-color);
  }

  .item-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-base);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-meta-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;

    .meta-tag {
      margin: 0;
    }
  }

  .item-aliases,
  .item-tags {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    max-height: 44px;
    overflow: hidden;

    .section-label {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 500;
      flex-shrink: 0;
    }

    .alias-tag,
    .tag-item {
      margin: 0;
      font-size: 10px;
    }
  }

  .item-desc {
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.5;
    word-break: break-word;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

// 悬停操作按钮
.item-actions {
  position: absolute;
  top: 6px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;

  .el-icon {
    font-size: 18px;
    color: var(--text-base);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;

    &:hover {
      background: var(--bg-mute);
    }

    &:first-child:hover {
      color: #409eff;
    }

    &:last-child:hover {
      color: #f56c6c;
    }
  }
}

// ========== 表格模式 ==========
.item-table {
  .table-image {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    overflow: hidden;
    margin: 0 auto;
    cursor: pointer;
    background: var(--bg-soft);
    display: flex;
    align-items: center;
    justify-content: center;

    .table-image-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .table-image-placeholder {
      color: var(--text-secondary);
    }
  }

  .table-name-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .table-marker {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 0 1px var(--border-color);
  }

  .table-text-preview {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 4.5em;
    line-height: 1.5;
    text-align: left;
    word-break: break-word;
  }

  .table-aliases,
  .table-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: center;

    .alias-item,
    .tag-item {
      margin: 0;
      font-size: 12px;
    }
  }

  .no-data {
    color: #999;
    font-size: 12px;
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;

    ::v-deep(.el-button) {
      margin: 0;
    }
  }
}

// ========== 空状态 ==========
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

// ========== 图片表单 ==========
.image-form-item {
  ::v-deep(.el-form-item__content) {
    display: flex;
    align-items: center;
    min-height: 90px;
  }
}

.image-form-section {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;

  .image-preview {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    border: 2px solid var(--border-color);
    cursor: pointer;
    background: var(--bg-soft);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .form-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .form-image-placeholder {
      color: var(--text-secondary);
    }
  }

  .image-input-section {
    flex: 1;

    .input-row {
      display: flex;
      gap: 12px;
      align-items: center;

      .el-input { flex: 1; }
      .el-button { flex-shrink: 0; }
    }
  }
}

// ========== 别名/标签容器 ==========
.aliases-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .aliases-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    min-height: 32px;
    padding: 8px;
    background: var(--bg-mute);
    border-radius: 6px;
    border: 1px dashed var(--border-color);

    .alias-tag {
      font-size: 13px;
      height: 28px;
      line-height: 28px;
    }
  }

  .alias-input-row {
    display: flex;
    gap: 8px;

    .el-input { flex: 1; }
    .el-button { flex-shrink: 0; }
  }

  .alias-limit-tip {
    text-align: center;
    padding: 4px 0;
  }
}

// ========== 标记色选择器 ==========
.marker-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;

  .marker-swatch {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: var(--bg-primary);
    padding: 0;
    transition: all 0.2s ease;

    &.empty {
      background: var(--bg-mute);
      color: var(--text-secondary);
      font-size: 12px;
    }

    &.active {
      box-shadow: 0 0 0 2px var(--bg-primary), 0 0 0 4px rgba(64, 158, 255, 0.4);
    }

    .marker-none { font-size: 12px; }
  }
}

// ========== 文本字段触发器 ==========
.text-field-trigger {
  height: 100px;
  width: 100%;
  padding: 12px;
  background: var(--bg-soft);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: flex-start;

  &:hover {
    border-color: var(--el-color-primary);
    background: var(--bg-mute);

    .text-field-icon { opacity: 1; }
  }

  .text-field-preview {
    flex: 1;
    font-size: 14px;
    color: var(--text-base);
    line-height: 1.6;
    word-break: break-word;
    white-space: pre-wrap;
    max-height: 76px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
    padding-right: 30px;
  }

  .text-field-placeholder {
    flex: 1;
    font-size: 14px;
    color: var(--text-secondary);
    padding-right: 30px;
  }

  .text-field-icon {
    position: absolute;
    right: 12px;
    top: 12px;
    font-size: 18px;
    color: var(--el-color-primary);
    opacity: 0.6;
    transition: opacity 0.3s ease;
  }
}

// ========== 弹框通用样式 ==========
.edit-dialog,
.preview-dialog {
  :deep(.el-dialog) {
    display: flex;
    flex-direction: column;
    max-height: 80vh !important;
    margin-bottom: 0;
  }

  :deep(.el-dialog__body) {
    padding: 0;
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
}

.edit-scroll-container {
  max-height: calc(80vh - 120px);
  overflow-y: auto;
  padding: 20px;
  scrollbar-width: none;
}

.text-editor-dialog {
  :deep(.el-textarea__inner) {
    font-family: inherit;
    line-height: 1.6;
  }
}

// ========== 预览弹框 ==========
.preview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .preview-scroll-container {
    max-height: calc(80vh - 120px);
    overflow-y: auto;
    padding: 20px;
    scrollbar-width: none;
  }

  .preview-header {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-color);

    .preview-image {
      width: 90px;
      height: 90px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
      cursor: pointer;
      background: var(--bg-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .preview-image-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .preview-image-placeholder {
        color: var(--text-secondary);
      }
    }

    .preview-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .preview-name-row {
        display: flex;
        align-items: center;
        gap: 8px;

        .preview-marker {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
          box-shadow: 0 0 0 1px var(--border-color);
        }

        .preview-name {
          font-size: 22px;
          font-weight: 600;
          color: var(--text-base);
        }
      }

      .preview-meta-row {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;

        .meta-tag { margin: 0; }
      }

      .preview-origin {
        font-size: 13px;

        .preview-info-label {
          color: var(--text-secondary);
          font-weight: 500;
        }

        .preview-info-value {
          color: var(--text-base);
          font-weight: 500;
        }
      }
    }
  }

  .preview-section {
    margin-bottom: 16px;

    .preview-section-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-base);
      margin-bottom: 10px;
      padding-left: 10px;
      border-left: 3px solid #409eff;
    }

    .preview-tags-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 8px;
      background: var(--bg-soft);
      border-radius: 6px;

      .preview-tag { margin: 0; font-size: 13px; }
    }

    .preview-text {
      font-size: 14px;
      color: var(--text-base);
      line-height: 1.8;
      margin: 0;
      text-align: left;
      word-break: break-word;
      padding: 12px;
      background: var(--bg-soft);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      white-space: pre-wrap;
    }
  }
}
</style>
