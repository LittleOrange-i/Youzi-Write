<template>
  <LayoutTool title="人物谱管理">
    <template #headrAction>
      <el-button type="primary" plain @click="handleImportCharacter">
        <el-icon><Upload /></el-icon>
        <span>导入人物</span>
      </el-button>
      <el-button type="primary" @click="handleCreateCharacter">
        <el-icon><Plus /></el-icon>
        <span>创建人物</span>
      </el-button>
    </template>
    <template #default>
      <div class="view-toggle">
        <el-input 
          v-model="searchQuery" 
          placeholder="搜索人物姓名" 
          clearable 
          style="width: 240px; margin-right: 10px;"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button value="card">
            <el-icon><Grid /></el-icon>
            卡片模式
          </el-radio-button>
          <el-radio-button value="table">
            <el-icon><List /></el-icon>
            表格模式
          </el-radio-button>
        </el-radio-group>
      </div>
      <!-- 卡片模式 -->
      <div v-if="viewMode === 'card'" class="character-grid">
        <div
          v-for="character in filteredCharacters"
          :key="character.id"
          class="character-card"
          :class="{ male: character.gender === '男', female: character.gender === '女', neutral: character.gender === '无' }"
          @click="handlePreviewCharacter(character)"
        >
          <div class="character-info">
            <div class="character-header">
              <div class="character-avatar" @click.stop="previewCharacterAvatar(character)">
                <el-image
                  v-if="character.avatar"
                  :src="getAvatarSrc(character.avatar)"
                  alt="头像"
                  class="avatar-image"
                  fit="cover"
                />
                <div v-else class="avatar-placeholder">
                  {{ character.name.charAt(0) }}
                </div>
              </div>
              <div class="character-details">
                <div class="name-row">
                  <span
                    v-if="character.markerColor"
                    class="character-marker"
                    :style="{ backgroundColor: character.markerColor }"
                  ></span>
                  <span class="character-name">{{ character.name }}</span>
                </div>
                <div class="info-row">
                  <span class="info-item">
                    <span class="info-label">年龄:</span>
                    <span class="info-value">{{ character.age }}岁</span>
                  </span>
                  <span class="info-divider">|</span>
                  <span class="info-item">
                    <span class="info-label">身高:</span>
                    <span class="info-value">{{ character.height }}cm</span>
                  </span>
                  <span class="info-divider">|</span>
                  <span class="info-item">
                    <span class="info-label">性别:</span>
                    <span class="info-value">{{ character.gender }}</span>
                  </span>
                </div>
              </div>
            </div>
            <!-- 别名显示区域 -->
            <div v-if="character.aliases && character.aliases.length > 0" class="character-aliases">
              <div class="section-label">别名：</div>
              <div class="aliases-display">
                <el-tag
                  v-for="(alias, index) in character.aliases.slice(0, 5)"
                  :key="index"
                  size="small"
                  type="info"
                  class="alias-display-tag"
                >
                  {{ alias }}
                </el-tag>
                <el-tag
                  v-if="character.aliases.length > 5"
                  size="small"
                  type="info"
                  class="alias-more-tag"
                >
                  +{{ character.aliases.length - 5 }}
                </el-tag>
              </div>
            </div>
            <!-- 标签显示区域 -->
            <div v-if="character.tags && character.tags.length > 0" class="character-tags">
              <div class="section-label">标签：</div>
              <div class="tags-display">
                <el-tag 
                  v-for="(tag, index) in character.tags.slice(0, 5)" 
                  :key="index" 
                  size="small" 
                  class="tag-item"
                >
                  {{ tag }}
                </el-tag>
                <el-tag
                  v-if="character.tags.length > 5"
                  size="small"
                  class="tag-more-tag"
                >
                  +{{ character.tags.length - 5 }}
                </el-tag>
              </div>
            </div>
            <!-- 形象介绍 -->
            <div v-if="character.appearance" class="character-section">
              <div class="section-title-wrapper">
                <span class="section-title-bar"></span>
                <div class="section-title">形象介绍</div>
              </div>
              <p class="character-intro appearance-intro">{{ character.appearance }}</p>
            </div>
            <!-- 生平介绍 -->
            <div v-if="character.biography" class="character-section">
              <div class="section-title-wrapper">
                <span class="section-title-bar"></span>
                <div class="section-title">生平介绍</div>
              </div>
              <p class="character-intro biography-intro">{{ character.biography }}</p>
            </div>
          </div>
          <div class="character-actions">
            <el-icon @click.stop="handleEditCharacter(character)"><Edit /></el-icon>
            <el-icon @click.stop="handleDeleteCharacter(character)"><Delete /></el-icon>
          </div>
        </div>
      </div>

      <!-- 表格模式 -->
      <div v-else-if="viewMode === 'table'" class="character-table">
        <el-table
          ref="tableRef"
          :data="filteredCharacters"
          row-key="id"
          border
          style="width: 100%"
          @row-click="handlePreviewCharacter"
        >
          <el-table-column label="头像" width="80" align="center">
            <template #default="{ row }">
              <div class="table-avatar" @click.stop="previewCharacterAvatar(row)">
                <el-image
                  v-if="row.avatar"
                  :src="getAvatarSrc(row.avatar)"
                  alt="头像"
                  class="table-avatar-image"
                  fit="cover"
                />
                <div v-else class="table-avatar-placeholder">
                  {{ row.name.charAt(0) }}
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="姓名" width="140" align="center">
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
          <el-table-column prop="aliases" label="别名" width="200" align="center">
            <template #default="{ row }">
              <div v-if="row.aliases && row.aliases.length > 0" class="table-aliases">
                <el-tag
                  v-for="(alias, index) in row.aliases"
                  :key="index"
                  size="small"
                  type="info"
                  class="alias-item"
                >
                  {{ alias }}
                </el-tag>
              </div>
              <span v-else class="no-aliases">无别名</span>
            </template>
          </el-table-column>
          <el-table-column prop="age" label="年龄" width="80" align="center">
            <template #default="{ row }"> {{ row.age }}岁 </template>
          </el-table-column>
          <el-table-column prop="gender" label="性别" width="80" align="center">
            <template #default="{ row }">
              <el-tag 
                :type="row.gender === '男' ? 'primary' : row.gender === '女' ? 'danger' : 'info'" 
                size="small"
              >
                {{ row.gender }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="height" label="身高" width="100" align="center">
            <template #default="{ row }"> {{ row.height }}cm </template>
          </el-table-column>
          <el-table-column prop="tags" label="标签" width="140" align="center">
            <template #default="{ row }">
              <div v-if="row.tags && row.tags.length > 0" class="table-tags">
                <el-tag v-for="tag in row.tags" :key="tag" size="small" class="tag-item">
                  {{ tag }}
                </el-tag>
              </div>
              <span v-else class="no-tags">无标签</span>
            </template>
          </el-table-column>
          <el-table-column prop="appearance" label="形象介绍" min-width="200" align="center">
            <template #default="{ row }">
              <div class="table-text-preview">{{ row.appearance }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="biography" label="生平介绍" min-width="300" align="center">
            <template #default="{ row }">
              <div class="table-text-preview">{{ row.biography }}</div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right" align="center">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button type="info" size="small" @click.stop="handlePreviewCharacter(row)">
                  <el-icon><View /></el-icon>
                  预览
                </el-button>
                <el-button type="primary" size="small" @click.stop="handleEditCharacter(row)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button type="danger" size="small" @click.stop="handleDeleteCharacter(row)">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-empty
        v-if="filteredCharacters.length === 0"
        :image-size="200"
        description="暂无人物"
        class="empty-state"
      />
    </template>
  </LayoutTool>

  <!-- 创建/编辑人物弹框 -->
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑人物' : '创建人物'"
    width="700px"
    align-center
    :close-on-click-modal="false" 
    :close-on-press-escape="false"
    @close="resetForm"
    class="edit-dialog"
  > <!-- 对话框：创建或编辑人物 -->
    <div ref="editScrollContainer" class="edit-scroll-container">
      <el-form ref="formRef" :model="characterForm" :rules="formRules" label-width="80px">
      <!-- 头像操作区域 -->
      <el-form-item label="头像" class="avatar-form-item">
        <div class="avatar-form-section">
          <div class="avatar-preview" @click="previewFormAvatar">
            <el-image
              v-if="characterForm.avatar"
              :src="getAvatarSrc(characterForm.avatar)"
              alt="头像预览"
              class="form-avatar-image"
              fit="cover"
            />
            <div v-else class="form-avatar-placeholder">
              {{ characterForm.name ? characterForm.name.charAt(0) : '头' }}
            </div>
          </div>
          <div class="avatar-input-section">
            <div class="input-row">
              <el-input
                v-model="characterForm.avatar"
                placeholder="请输入图片链接或选择本地图片"
                clearable
              />
              <el-button @click="selectLocalImage">选择本地图片</el-button>
            </div>
          </div>
        </div>
      </el-form-item>
      <el-row :gutter="10">
        <el-col :span="12">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="characterForm.name" placeholder="请输入人物姓名" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="性别" prop="gender">
            <el-radio-group v-model="characterForm.gender">
              <el-radio value="男">男</el-radio>
              <el-radio value="女">女</el-radio>
              <el-radio value="无">无</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="别名" prop="aliases">
        <div class="aliases-container">
          <div class="aliases-list">
            <el-tag
              v-for="(alias, index) in characterForm.aliases"
              :key="index"
              closable
              @close="removeAlias(index)"
              class="alias-tag"
            >
              {{ alias }}
            </el-tag>
          </div>
          <div v-if="characterForm.aliases.length < 20" class="alias-input-row">
            <el-input
              v-model="newAliasInput"
              placeholder="输入别名/外号/称号"
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
      <el-row :gutter="10">
        <el-col :span="12">
          <el-form-item label="年龄" prop="age">
            <el-input-number
              v-model="characterForm.age"
              :min="1"
              :max="99999"
              placeholder="请输入年龄"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="身高" prop="height">
            <el-input-number
              v-model="characterForm.height"
              :min="1"
              :max="99999"
              placeholder="请输入身高(cm)"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="形象介绍" prop="appearance">
        <div class="text-field-trigger" @click="openTextEditor('appearance')">
          <div v-if="characterForm.appearance" class="text-field-preview">
            {{ characterForm.appearance }}
          </div>
          <div v-else class="text-field-placeholder">
            点击编辑人物形象介绍（外貌、气质、穿着等）
          </div>
          <el-icon class="text-field-icon"><Edit /></el-icon>
        </div>
      </el-form-item>
      <el-form-item label="生平介绍" prop="biography">
        <div class="text-field-trigger" @click="openTextEditor('biography')">
          <div v-if="characterForm.biography" class="text-field-preview">
            {{ characterForm.biography }}
          </div>
          <div v-else class="text-field-placeholder">
            点击编辑人物生平介绍（经历、性格、背景故事等）
          </div>
          <el-icon class="text-field-icon"><Edit /></el-icon>
        </div>
      </el-form-item>
      <el-form-item label="标签" prop="tags">
        <el-tree-select
          v-model="characterForm.tags"
          :data="tagOptions"
          multiple
          filterable
          default-first-option
          placeholder="请选择标签"
          style="width: 100%"
          :props="{
            children: 'children',
            label: 'name',
            value: 'name'
          }"
          node-key="name"
          check-strictly
          :render-after-expand="false"
          clearable
        />
      </el-form-item>
      <el-form-item label="标记色">
        <div class="marker-selector">
          <button
            v-for="color in presetMarkerColors"
            :key="color || 'none'"
            type="button"
            class="marker-swatch"
            :class="{ active: color === characterForm.markerColor, empty: !color }"
            :style="color ? { backgroundColor: color } : {}"
            @click="handlePresetMarkerClick(color)"
          >
            <span v-if="!color" class="marker-none">无</span>
          </button>
          <el-color-picker
            v-model="characterForm.markerColor"
            :predefine="colorPickerPredefine"
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
    :initial-index="imageViewerInitialIndex"
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
  > <!-- 对话框：文本编辑 -->
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

  <!-- 人物预览弹框 -->
  <el-dialog
    v-model="previewDialogVisible"
    title="人物详情"
    width="700px"
    align-center
    :close-on-click-modal="true"
    :close-on-press-escape="true" 
    class="preview-dialog"
  > <!-- 对话框：人物详情预览 -->
    <div v-if="previewCharacter" class="preview-content">
      <div ref="previewScrollContainer" class="preview-scroll-container">
        <div class="preview-header">
          <div class="preview-avatar" @click="previewCharacterAvatar(previewCharacter)">
            <el-image
              v-if="previewCharacter.avatar"
              :src="getAvatarSrc(previewCharacter.avatar)"
              alt="头像"
              class="preview-avatar-image"
              fit="cover"
            /> <!-- 人物头像图片 -->
            <div v-else class="preview-avatar-placeholder">
              {{ previewCharacter.name.charAt(0) }}
            </div> <!-- 无头像时的占位符，显示姓名首字母 -->
          </div> <!-- 头像显示区域结束 -->
          <div class="preview-details">
            <div class="preview-name-row">
              <span
                v-if="previewCharacter.markerColor"
                class="preview-marker"
                :style="{ backgroundColor: previewCharacter.markerColor }"
              ></span> <!-- 人物标记颜色点 -->
              <span class="preview-name">{{ previewCharacter.name }}</span> <!-- 人物姓名 -->
            </div> <!-- 姓名行结束 -->
            <div class="preview-info-row">
              <span class="preview-info-item">
                <span class="preview-info-label">年龄:</span> <!-- 年龄标签 -->
                <span class="preview-info-value">{{ previewCharacter.age }}岁</span> <!-- 年龄数值 -->
              </span> <!-- 年龄项结束 -->
              <span class="preview-divider">|</span> <!-- 分隔符 -->
              <span class="preview-info-item">
                <span class="preview-info-label">身高:</span> <!-- 身高标签 -->
                <span class="preview-info-value">{{ previewCharacter.height }}cm</span> <!-- 身高数值 -->
              </span> <!-- 身高项结束 -->
              <span class="preview-divider">|</span> <!-- 分隔符 -->
              <span class="preview-info-item">
                <span class="preview-info-label">性别:</span> <!-- 性别标签 -->
                <span class="preview-info-value">{{ previewCharacter.gender }}</span> <!-- 性别数值 -->
              </span> <!-- 性别项结束 -->
            </div> <!-- 基础信息行结束 -->
          </div> <!-- 详情信息区域结束 -->
        </div> <!-- 预览头部结束 -->
        
        <!-- 别名显示区域 -->
        <div v-if="previewCharacter.aliases && previewCharacter.aliases.length > 0" class="preview-section">
          <div class="preview-section-title">别名</div> <!-- 别名栏目标题 -->
          <div class="preview-aliases">
            <el-tag
              v-for="(alias, index) in previewCharacter.aliases"
              :key="index"
              size="small"
              type="info"
              class="preview-alias-tag"
            >
              {{ alias }}
            </el-tag> <!-- 循环显示每一个别名标签 -->
          </div> <!-- 别名列表结束 -->
        </div> <!-- 别名区域结束 -->
        
        <!-- 标签显示区域 -->
        <div v-if="previewCharacter.tags && previewCharacter.tags.length > 0" class="preview-section">
          <div class="preview-section-title">标签</div> <!-- 标签栏目标题 -->
          <div class="preview-tags">
            <el-tag v-for="tag in previewCharacter.tags" :key="tag" size="small" class="preview-tag">
              {{ tag }}
            </el-tag> <!-- 循环显示每一个人物标签 -->
          </div> <!-- 标签列表结束 -->
        </div> <!-- 标签区域结束 -->
        
        <!-- 形象介绍 -->
        <div v-if="previewCharacter.appearance" class="preview-section">
          <div class="preview-section-title">形象介绍</div> <!-- 形象介绍标题 -->
          <p class="preview-text">{{ previewCharacter.appearance }}</p> <!-- 形象介绍详细内容 -->
        </div> <!-- 形象介绍区域结束 -->
        
        <!-- 生平介绍 -->
        <div v-if="previewCharacter.biography" class="preview-section">
          <div class="preview-section-title">生平介绍</div> <!-- 生平介绍标题 -->
          <p class="preview-text">{{ previewCharacter.biography }}</p> <!-- 生平介绍详细内容 -->
        </div> <!-- 生平介绍区域结束 -->
      </div> <!-- 预览滚动容器结束 -->
    </div> <!-- 预览内容主体结束 -->


    <template #footer>
      <el-button type="primary" @click="handleEditCharacter(previewCharacter)">
        <el-icon><Edit /></el-icon>
        编辑
      </el-button> <!-- 编辑按钮：点击跳转到该人物的编辑界面 -->
      <el-button @click="previewDialogVisible = false">确定</el-button> <!-- 确定按钮：点击关闭预览弹窗 -->
    </template> <!-- 弹窗页脚结束 -->
  </el-dialog>

  <!-- 导入人物弹窗 -->
  <el-dialog
    v-model="importDialogVisible" 
    title="导入人物" 
    width="500px" 
    align-center 
    :close-on-click-modal="false" 
    class="import-dialog" 
  > <!-- 对话框：导入人物 -->
    <div class="import-content"> <!-- 导入内容容器 -->
      <div class="template-download" style="margin-bottom: 20px; text-align: center;"> <!-- 模板下载区域 -->
        <div style="margin-bottom: 10px;"> <!-- 文字提示间距 -->
          <el-text class="mx-1">请先下载导入模板，按规则填写后上传</el-text> <!-- 提示文字 -->
        </div> <!-- 文字提示结束 -->
        <el-button type="primary" link @click="downloadTemplate"> <!-- 下载按钮 -->
          <el-icon style="margin-right: 4px;"><Download /></el-icon> <!-- 下载图标 -->
          下载导入模板.xlsx <!-- 按钮文本 -->
        </el-button> <!-- 按钮结束 -->
      </div> <!-- 模板下载区域结束 -->
      
      <el-upload
        class="upload-area" 
        drag 
        action="#" 
        :auto-upload="false" 
        :on-change="handleFileChange" 
        :show-file-list="false" 
        accept=".xlsx" 
      > <!-- 上传区域：拖拽或点击上传 -->
        <el-icon class="el-icon--upload"><upload-filled /></el-icon> <!-- 上传图标 -->
        <div class="el-upload__text"> <!-- 上传说明文字 -->
          将文件拖到此处，或<em>点击上传</em> <!-- 说明内容 -->
        </div> <!-- 文字结束 -->
        <template #tip> <!-- 底部提示插槽 -->
          <div class="el-upload__tip" style="text-align: center; margin-top: 10px;"> <!-- 提示容器 -->
            仅支持 .xlsx 格式文件 <!-- 格式限制说明 -->
          </div> <!-- 提示容器结束 -->
        </template> <!-- 插槽结束 -->
      </el-upload> <!-- 上传组件结束 -->

      <!-- 校验结果提示 -->
      <div v-if="importErrors.length > 0" class="import-errors" style="margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 15px;"> <!-- 错误提示容器 -->
        <div class="error-title" style="margin-bottom: 10px; font-weight: bold; color: var(--el-color-danger);">数据校验失败 (共 {{ importErrors.length }} 条错误):</div> <!-- 错误汇总标题 -->
        <el-scrollbar max-height="200px"> <!-- 错误列表滚动容器 -->
          <div v-for="(error, index) in importErrors" :key="index" class="error-item" style="margin-bottom: 4px;"> <!-- 循环显示错误项 -->
            <el-text type="danger">第 {{ error.row }} 行: {{ error.message }}</el-text> <!-- 错误行号与内容 -->
          </div> <!-- 错误项结束 -->
        </el-scrollbar> <!-- 滚动容器结束 -->
      </div> <!-- 错误提示容器结束 -->
    </div> <!-- 导入内容主体结束 -->
    <template #footer> <!-- 弹窗页脚插槽 -->
      <el-button @click="importDialogVisible = false">取消</el-button> <!-- 关闭弹窗按钮 -->
      <el-button type="primary" :disabled="!canImport" @click="confirmImport"> <!-- 确认导入按钮 -->
        开始导入 <!-- 按钮显示文本 -->
      </el-button> <!-- 按钮结束 -->
    </template> <!-- 页脚插槽结束 -->
  </el-dialog> <!-- 导入弹窗结束 -->
</template> <!-- 模板根节点结束 -->


<script setup>
import LayoutTool from '@renderer/components/LayoutTool.vue'
import { ref, reactive, onMounted, watch, toRaw, computed, nextTick, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Grid, List, Edit, Search, View, Upload, Download, UploadFilled } from '@element-plus/icons-vue'
import { genId } from '@renderer/utils/utils'
import Sortable from 'sortablejs'
import * as XLSX from 'xlsx'

const route = useRoute()
const dialogVisible = ref(false)
const isEdit = ref(false)
const viewMode = ref('card') // 视图模式：card 或 table
const characters = ref([])
const dictionary = ref([]) // 字典数据
const bookName = route.query.name || ''
const formRef = ref(null)
const tableRef = ref(null)
const searchQuery = ref('') // 搜索关键词
const previewDialogVisible = ref(false) // 预览弹框可见性
const previewCharacter = ref(null) // 预览的人物数据
let sortableInstance = null // 存储 SortableJS 实例

const presetMarkerColors = [
  '', // 无颜色
  '#e198b8', // 默认高亮颜色
  '#FF4D4F', // 红色
  '#FF9F1C', // 橙色
  '#FFD600', // 黄色
  '#00C853', // 绿色
  '#1890FF', // 蓝色
  '#B368FF', // 紫色
  '#FF6F91', // 粉色
  '#8D99AE', // 灰色
  '#A3E635', // 草绿色
  '#00C9A7', // 青色
  '#13C2C2', // 湖蓝色
  '#2F54EB' // 深蓝色
]

const colorPickerPredefine = presetMarkerColors.filter((color) => !!color)

// 图片预览相关
const imageViewerVisible = ref(false)
const imageViewerSrcList = ref([])
const imageViewerInitialIndex = ref(0)

// 预览弹框滚动容器ref
const previewScrollContainer = ref(null)
// 编辑弹框滚动容器ref
const editScrollContainer = ref(null)

// 文本编辑器弹窗相关
const textEditorVisible = ref(false) // 文本编辑器弹窗可见性
const textEditorContent = ref('') // 当前编辑的文本内容
const textEditorField = ref('') // 当前编辑的字段名 'appearance' 或 'biography'
const textEditorTitle = ref('') // 弹窗标题
const textEditorPlaceholder = ref('') // 占位提示
const textEditorMaxLength = ref(500) // 最大字符数

// 表单数据
const characterForm = reactive({
  id: '', // 唯一标识符
  name: '', // 姓名
  age: 18, // 年龄，默认为 18
  gender: '男', // 性别，默认为男
  height: 170, // 身高，默认为 170
  aliases: [], // 别名数组字段
  tags: [], // 标签字段
  biography: '', // 生平介绍
  appearance: '', // 形象介绍
  avatar: '', // 头像路径或链接
  markerColor: '#e198b8' // 标记色，默认设置为 #e198b8
})

// 新别名输入框
const newAliasInput = ref('')

// 导入相关状态
const importDialogVisible = ref(false) // 导入弹窗可见性
const importErrors = ref([]) // 导入错误列表
const importData = ref([]) // 待导入的数据
const canImport = computed(() => importData.value.length > 0 && importErrors.value.length === 0) // 是否可以开始导入

// 处理导入按钮点击
function handleImportCharacter() {
  importDialogVisible.value = true // 显示导入弹窗
  importErrors.value = [] // 清空之前的错误信息
  importData.value = [] // 清空之前解析的数据
} // 函数结束

// 下载导入模板
function downloadTemplate() {
  // 定义模板列名
  const headers = ['头像', '姓名', '性别', '别名', '年龄', '身高', '形象介绍', '生平介绍', '标记色'] // 标题行数据
  // 定义示例数据
  const exampleData = [
    {
      '头像': 'https://example.com/avatar.jpg',
      '姓名': '张三',
      '性别': '男',
      '别名': '法外狂徒 三哥',
      '年龄': 25,
      '身高': 180,
      '形象介绍': '身穿黑色西装，眼神犀利。',
      '生平介绍': '出生于平凡家庭，后因某种契机走上法外之路。',
      '标记色': '#FF0000'
    }
  ] // 示例行数据

  // 创建工作表
  const worksheet = XLSX.utils.json_to_sheet(exampleData, { header: headers }) // 生成工作表
  // 创建工作簿
  const workbook = XLSX.utils.book_new() // 创建新工作簿
  XLSX.utils.book_append_sheet(workbook, worksheet, '人物导入模板') // 将工作表添加到工作簿

  // 生成二进制数据并触发下载
  XLSX.writeFile(workbook, '人物导入模板.xlsx') // 导出并下载文件
  
  // 弹出规则说明，优化排版
  const templateInfo = `
    <div style="line-height: 1.8;">
      <p><b>导入规则说明：</b></p>
      <ul style="padding-left: 20px; margin: 0;">
        <li><b>头像</b> (可选): 图片链接或本地图片绝对路径</li>
        <li><b>姓名</b> (<span style="color: red;">必填</span>): 最大20字</li>
        <li><b>性别</b> (<span style="color: red;">必填</span>): 只能填 <b>男</b>、<b>女</b> 或 <b>无</b></li>
        <li><b>别名</b> (可选): 多个别名用<b>空格</b>分隔，最多20个，每个最多15字</li>
        <li><b>年龄</b> (<span style="color: red;">必填</span>): 必须为<b>纯数字</b></li>
        <li><b>身高</b> (<span style="color: red;">必填</span>): 必须为<b>纯数字</b></li>
        <li><b>形象介绍</b> (<span style="color: red;">必填</span>): 最大500字</li>
        <li><b>生平介绍</b> (<span style="color: red;">必填</span>): 最大1000字</li>
        <li><b>标记色</b> (可选): 十六进制颜色码，如 <b>#FF0000</b></li>
      </ul>
    </div>
  ` // 使用 HTML 字符串优化排版内容

  ElMessageBox.alert(templateInfo, '导入模板说明', { // 弹出说明对话框
    confirmButtonText: '知道了', // 按钮文本
    dangerouslyUseHTMLString: true, // 允许使用 HTML 字符串渲染
    type: 'info', // 消息类型
    customStyle: { maxWidth: '500px' } // 自定义样式，限制最大宽度
  }) // 对话框调用结束
} // 函数结束

// 处理文件选择
async function handleFileChange(file) {
  importErrors.value = [] // 重置错误列表
  importData.value = [] // 重置导入数据
  
  const rawFile = file.raw // 获取原始文件对象
  if (!rawFile) return // 如果文件不存在则返回

  // 校验文件格式
  const isXlsx = rawFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 rawFile.name.endsWith('.xlsx') // 判断是否为 xlsx 格式
  
  if (!isXlsx) { // 如果不是 xlsx 格式
    ElMessage.error('只能上传 .xlsx 格式的文件') // 弹出错误提示
    return // 返回
  } // 格式校验结束

  // 使用 XLSX 库读取文件内容
  const reader = new FileReader() // 创建文件读取器
  reader.onload = async (e) => { // 读取完成后的回调，改为异步函数以支持内部 await
    try {
      const data = new Uint8Array(e.target.result) // 将结果转换为 8 位无符号整数数组
      const workbook = XLSX.read(data, { type: 'array' }) // 解析 Excel 数据
      const firstSheetName = workbook.SheetNames[0] // 获取第一个工作表的名称
      const worksheet = workbook.Sheets[firstSheetName] // 获取工作表对象
      const jsonData = XLSX.utils.sheet_to_json(worksheet) // 将工作表转换为 JSON 数组

      if (jsonData.length === 0) { // 如果数据为空
        ElMessage.warning('上传的文件中没有数据') // 弹出警告
        return // 返回
      } // 空数据校验结束

      const { errors, validatedData } = await validateImportData(jsonData) // 执行数据校验（异步）
      importErrors.value = errors // 记录错误列表
      importData.value = validatedData // 记录通过校验的数据

      if (errors.length > 0) { // 如果存在校验错误
        ElMessage.error(`发现 ${errors.length} 处数据格式错误，请修正后重新上传`) // 弹出错误提示
      } else { // 如果校验全部通过
        ElMessage.success(`文件解析成功，准备导入 ${validatedData.length} 条数据`) // 弹出成功提示
      } // 校验结果处理结束
    } catch (err) { // 捕获解析过程中的错误
      console.error('解析 Excel 失败:', err) // 打印错误日志
      ElMessage.error('解析文件失败，请检查文件是否损坏') // 弹出错误提示
    } // 异常处理结束
  } // 回调定义结束
  reader.readAsArrayBuffer(rawFile) // 以 ArrayBuffer 方式读取文件内容
} // 函数结束

// 校验导入数据
async function validateImportData(dataList) {
  const errors = [] // 存储所有错误
  const validatedData = [] // 存储验证通过的数据
  const existingNames = characters.value.map(c => c.name) // 获取当前已存在的所有人物姓名
  const importedNamesInThisFile = new Set() // 用于记录本次导入文件中已处理的姓名，防止文件内部重复

  // 格式化并转换本地路径为 DataURL 的工具函数
  const processAvatarPath = async (path) => {
    if (!path) return ''
    const pathStr = path.toString().trim()
    
    // 1. 如果是 http/https 开头的链接，直接返回
    if (/^https?:\/\//i.test(pathStr)) {
      return pathStr
    }
    
    // 2. 如果已经是 DataURL (base64)，直接返回
    if (pathStr.startsWith('data:image/')) {
      return pathStr
    }

    // 3. 处理本地路径
    let localPath = pathStr
    if (pathStr.startsWith('file:///')) {
      // file:///C:/Users/... -> C:/Users/...
      localPath = pathStr.replace(/^file:\/\/\//, '')
    }

    try {
      // 调用 Electron 接口将本地路径转换为 DataURL
      const dataUrl = await window.electron.readLocalImage(localPath)
      return dataUrl || pathStr // 如果转换失败，保留原路径（虽然可能无法显示）
    } catch (err) {
      console.error('转换头像路径失败:', err)
      return pathStr
    }
  } // 转换函数结束

  // 使用 for...of 循环处理异步操作
  for (const [index, item] of dataList.entries()) {
    const rowNum = index + 2 // 计算当前行号（加上标题行）
    const rowErrors = [] // 存储当前行的错误

    // 2. 姓名（必填）
    const name = item.姓名 ? item.姓名.toString().trim() : ''
    if (!name) { // 校验姓名是否为空
      rowErrors.push('姓名是必填项') // 添加错误信息
    } else if (name.length > 20) { // 校验姓名长度
      rowErrors.push('姓名长度不能超过20个字符') // 添加错误信息
    } else if (existingNames.includes(name)) { // 校验是否与库中现有姓名冲突
      rowErrors.push(`人物"${name}"已存在，请勿重复导入`) // 添加错误信息
    } else if (importedNamesInThisFile.has(name)) { // 校验文件内部是否存在重复姓名
      rowErrors.push(`文件内存在重复的人物姓名"${name}"`) // 添加错误信息
    } else {
      importedNamesInThisFile.add(name) // 记录已处理的姓名
    } // 姓名校验结束

    // 3. 性别（必填）：只能填 男 女 无
    const validGenders = ['男', '女', '无'] // 定义合法的性别选项
    if (!item.性别 || !validGenders.includes(item.性别.toString().trim())) { // 校验性别
      rowErrors.push('性别只能填写“男”、“女”或“无”') // 添加错误信息
    } // 性别校验结束

    // 4. 别名（可选）：空格分隔，最多20个，每个长度15
    let aliases = [] // 存储解析后的别名列表
    if (item.别名) { // 如果填写了别名
      aliases = item.别名.toString().split(/\s+/).filter(a => a.trim()) // 使用空格分割并过滤空项
      if (aliases.length > 20) { // 校验别名数量
        rowErrors.push('别名最多只能有20个') // 添加错误信息
      } // 数量校验结束
      if (aliases.some(a => a.length > 15)) { // 校验每个别名的长度
        rowErrors.push('每个别名长度不能超过15个字符') // 添加错误信息
      } // 长度校验结束
    } // 别名校验结束

    // 5. 年龄（必填）：纯数字
    const age = parseInt(item.年龄) // 尝试转换为整数
    if (isNaN(age)) { // 校验是否为数字
      rowErrors.push('年龄必须是纯数字') // 添加错误信息
    } // 年龄校验结束

    // 6. 身高（必填）：纯数字
    const height = parseInt(item.身高) // 尝试转换为整数
    if (isNaN(height)) { // 校验是否为数字
      rowErrors.push('身高必须是纯数字') // 添加错误信息
    } // 身高校验结束

    // 7. 形象介绍（必填）：最大500字
    if (!item.形象介绍 || !item.形象介绍.toString().trim()) { // 校验形象介绍是否为空
      rowErrors.push('形象介绍是必填项') // 添加错误信息
    } else if (item.形象介绍.toString().length > 500) { // 校验字数
      rowErrors.push('形象介绍长度不能超过500个字符') // 添加错误信息
    } // 形象介绍校验结束

    // 8. 生平介绍（必填）：最大1000字
    if (!item.生平介绍 || !item.生平介绍.toString().trim()) { // 校验生平介绍是否为空
      rowErrors.push('生平介绍是必填项') // 添加错误信息
    } else if (item.生平介绍.toString().length > 1000) { // 校验字数
      rowErrors.push('生平介绍长度不能超过1000个字符') // 添加错误信息
    } // 生平介绍校验结束

    // 9. 标记色（可选）：十六进制
    if (item.标记色 && !/^#[0-9A-Fa-f]{6}$/.test(item.标记色.toString().trim())) { // 校验色值格式
      rowErrors.push('标记色必须是有效的十六进制表示（如 #FFFFFF）') // 添加错误信息
    } // 标记色校验结束

    if (rowErrors.length > 0) { // 如果当前行有错误
      rowErrors.forEach(msg => { // 遍历当前行错误
        errors.push({ row: rowNum, message: msg }) // 添加到全局错误列表
      }) // 遍历结束
    } else { // 如果没有错误
      validatedData.push({ // 添加到验证通过的列表
        id: genId(), // 生成唯一ID
        name: item.姓名.toString().trim(), // 姓名
        gender: item.性别.toString().trim(), // 性别
        aliases: aliases, // 别名列表
        age: age, // 年龄
        height: height, // 身高
        appearance: item.形象介绍.toString().trim(), // 形象介绍
        biography: item.生平介绍.toString().trim(), // 生平介绍
        avatar: await processAvatarPath(item.头像), // 头像处理：异步转换为 DataURL
        markerColor: item.标记色 ? item.标记色.toString().trim() : '#e198b8', // 标记色
        tags: [] // 默认空标签
      }) // 对象构建结束
    } // 结果处理结束
  } // 循环结束

  return { errors, validatedData } // 返回校验结果
} // 函数结束

// 确认导入
function confirmImport() {
  if (importData.value.length > 0) { // 如果有待导入的数据
    characters.value.push(...importData.value) // 合并到现有角色列表
    ElMessage.success(`成功导入 ${importData.value.length} 个角色`) // 弹出成功提示
    importDialogVisible.value = false // 关闭弹窗
  } // 判断结束
} // 函数结束

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入人物姓名', trigger: 'blur' },
    { min: 1, max: 20, message: '姓名长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  age: [{ required: true, message: '请输入年龄(岁)', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  height: [{ required: true, message: '请输入身高(cm)', trigger: 'blur' }],
  biography: [
    { required: true, message: '请输入生平介绍', trigger: 'blur' },
    { min: 1, max: 1000, message: '生平介绍长度在 1 到 1000 个字符', trigger: 'blur' }
  ],
  appearance: [
    { required: true, message: '请输入形象介绍', trigger: 'blur' },
    { min: 1, max: 500, message: '形象介绍长度在 1 到 500 个字符', trigger: 'blur' }
  ]
}

// 计算标签选项（从字典词条中获取，保持树形结构）
const tagOptions = computed(() => {
  // 深拷贝字典数据，避免修改原数据
  const cloneDictionary = JSON.parse(JSON.stringify(dictionary.value))

  // 递归处理树形结构，确保每个节点都有name属性
  function processTreeData(nodes) {
    return nodes
      .map((node) => ({
        ...node,
        children: node.children && node.children.length > 0 ? processTreeData(node.children) : []
      }))
      .filter((node) => node.name && node.name.trim()) // 过滤掉没有名称的节点
  }

  return processTreeData(cloneDictionary)
})

// 计算过滤后的人物列表（根据搜索关键词）
const filteredCharacters = computed(() => {
  if (!searchQuery.value.trim()) {
    return characters.value
  }
  const query = searchQuery.value.toLowerCase()
  return characters.value.filter(character => 
    character.name.toLowerCase().includes(query)
  )
})

// 处理搜索输入
function handleSearch() {
  // 实时搜索，由computed自动处理
}

// 加载人物数据
async function loadCharacters() {
  try {
    const data = await window.electron.readCharacters(bookName) // 调用 Electron 接口读取数据
    let loadedData = Array.isArray(data) ? data : [] // 确保数据是数组

    // 数据兼容处理与字段初始化
    loadedData = loadedData.map((character) => {
      // 兼容旧版本：将 introduction 迁移到 biography
      if (character.introduction && !character.biography) {
        return {
          ...character,
          biography: character.introduction,
          appearance: character.appearance || '',
          avatar: character.avatar || '',
          aliases: Array.isArray(character.aliases) ? character.aliases : [], // 确保别名是数组
          tags: Array.isArray(character.tags) ? character.tags : [], // 确保标签是数组
          introduction: undefined // 移除旧字段
        }
      }
      // 确保所有必要字段都已初始化，防止预览或编辑时显示异常
      return {
        ...character,
        biography: character.biography || '',
        appearance: character.appearance || '',
        avatar: character.avatar || '',
        markerColor: character.markerColor || '',
        aliases: Array.isArray(character.aliases) ? character.aliases : [], // 确保别名是数组
        tags: Array.isArray(character.tags) ? character.tags : [] // 确保标签是数组
      }
    }) // map 结束

    characters.value = loadedData // 更新响应式角色列表
  } catch (error) { // 捕获错误
    console.error('加载人物数据失败:', error) // 打印错误日志
    characters.value = [] // 加载失败则设置为空数组
  } // 异常处理结束
} // 函数结束

// 加载字典数据
async function loadDictionary() {
  try {
    const data = await window.electron.readDictionary(bookName)
    dictionary.value = data || []
  } catch (error) {
    console.error('加载字典数据失败:', error)
    dictionary.value = []
  }
}

// 保存人物数据
async function saveCharacters() {
  try {
    // 移除 sort 字段（如果存在），因为数组顺序就是最终顺序
    const rawCharacters = JSON.parse(JSON.stringify(toRaw(characters.value))).map((character) => {
      // eslint-disable-next-line no-unused-vars
      const { sort, ...rest } = character
      return rest
    })
    const result = await window.electron.writeCharacters(bookName, rawCharacters)
    if (!result.success) {
      throw new Error(result.message || '保存失败')
    }
  } catch (error) {
    console.error('保存人物数据失败:', error)
    ElMessage.error('保存人物数据失败')
  }
}

// 创建人物
function handleCreateCharacter() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
  // 使用 nextTick 确保 DOM 更新后再重置滚动位置
  nextTick(() => {
    if (editScrollContainer.value) {
      editScrollContainer.value.scrollTop = 0
    }
  })
}

// 编辑人物 - 使用深拷贝避免直接修改原数据
function handleEditCharacter(character) {
  isEdit.value = true
  // 深拷贝人物数据,避免直接修改原对象
  Object.assign(characterForm, JSON.parse(JSON.stringify(character)))
  previewDialogVisible.value = false // 关闭预览弹框
  dialogVisible.value = true
  // 使用 nextTick 确保 DOM 更新后再重置滚动位置
  nextTick(() => {
    if (editScrollContainer.value) {
      editScrollContainer.value.scrollTop = 0
    }
  })
}

// 预览人物详情
function handlePreviewCharacter(character) {
  if (!character) return // 如果没有数据则返回
  // 使用 toRaw 获取原始对象并深拷贝，确保所有字段（包括数组）都被正确复制且响应式正常
  previewCharacter.value = JSON.parse(JSON.stringify(toRaw(character))) // 深拷贝人物数据
  previewDialogVisible.value = true // 显示预览弹窗
  // 使用 nextTick 确保 DOM 更新后再重置滚动位置
  nextTick(() => {
    if (previewScrollContainer.value) { // 如果滚动容器存在
      previewScrollContainer.value.scrollTop = 0 // 重置滚动位置到顶部
    } // 判断结束
  }) // nextTick 结束
} // 函数结束

// 删除人物
async function handleDeleteCharacter(character) {
  try {
    await ElMessageBox.confirm(
      `确定要删除人物"${character.name}"吗？此操作不可恢复！`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const index = characters.value.findIndex((c) => c.id === character.id)
    if (index > -1) {
      characters.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消，无需处理
  }
}

// 确认保存
async function confirmSave() {
  if (!formRef.value) return // 如果表单引用不存在则返回

  try {
    await formRef.value.validate() // 执行表单验证

    // 校验姓名唯一性（仅在创建新人物或修改了姓名时校验）
    const nameExists = characters.value.some(c => 
      c.name === characterForm.name && c.id !== characterForm.id
    ) // 检查是否存在同名人物（排除自身）
    
    if (nameExists) { // 如果姓名已存在
      ElMessage.error(`人物"${characterForm.name}"已存在，请勿重复创建`) // 弹出错误提示
      return // 返回，不保存
    } // 唯一性校验结束

    if (isEdit.value) { // 如果是编辑模式
      // 编辑模式：更新现有人物
      const index = characters.value.findIndex((c) => c.id === characterForm.id) // 查找当前人物索引
      if (index > -1) { // 如果找到了索引
        characters.value[index] = { ...characterForm } // 更新人物数据
      } // 更新结束
    } else { // 如果是创建模式
      // 创建模式：添加新人物（直接添加到数组末尾）
      characters.value.push({ // 将新人物推入数组
        ...characterForm, // 展开表单数据
        id: genId() // 生成新 ID
      }) // 添加结束
    } // 模式判断结束

    dialogVisible.value = false // 关闭对话框
    ElMessage.success(isEdit.value ? '编辑成功' : '创建成功') // 弹出成功提示
  } catch (error) { // 捕获验证或其他错误
    console.error('保存失败:', error) // 打印错误日志
  } // 异常处理结束
} // 函数结束

// 添加别名
function addAlias() {
  const trimmedAlias = newAliasInput.value.trim()
  if (!trimmedAlias) {
    return
  }
  if (characterForm.aliases.length >= 20) {
    ElMessage.warning('最多只能添加20个别名')
    return
  }
  if (characterForm.aliases.includes(trimmedAlias)) {
    ElMessage.warning('该别名已存在')
    return
  }
  characterForm.aliases.push(trimmedAlias)
  newAliasInput.value = ''
}

// 删除别名
function removeAlias(index) {
  characterForm.aliases.splice(index, 1)
}

// 打开文本编辑器弹窗
function openTextEditor(field) {
  textEditorField.value = field
  textEditorContent.value = characterForm[field] || ''
  
  if (field === 'appearance') {
    textEditorTitle.value = '编辑形象介绍'
    textEditorPlaceholder.value = '请输入人物形象介绍（外貌、气质、穿着等）'
    textEditorMaxLength.value = 500
  } else if (field === 'biography') {
    textEditorTitle.value = '编辑生平介绍'
    textEditorPlaceholder.value = '请输入人物生平介绍（经历、性格、背景故事等）'
    textEditorMaxLength.value = 1000
  }
  
  textEditorVisible.value = true
}

// 保存文本编辑器内容
function saveTextEditor() {
  if (textEditorField.value) {
    characterForm[textEditorField.value] = textEditorContent.value
  }
  textEditorVisible.value = false
}

// 重置表单
function resetForm() {
  if (formRef.value) {
    formRef.value.resetFields() // 重置表单验证状态
  }
  Object.assign(characterForm, {
    id: '', // 重置 ID
    name: '', // 重置姓名
    age: 18, // 重置年龄为 18
    gender: '男', // 重置性别为男
    height: 170, // 重置身高为 170
    aliases: [], // 重置别名数组
    tags: [], // 重置标签
    biography: '', // 重置生平介绍
    appearance: '', // 重置形象介绍
    avatar: '', // 重置头像
    markerColor: '#e198b8' // 重置标记色为 #e198b8
  })
  newAliasInput.value = '' // 重置别名输入框
}

function handlePresetMarkerClick(color) {
  characterForm.markerColor = color
}

// 初始化表格拖拽排序
function initTableDragSort() {
  // 清理之前的实例
  try {
    if (sortableInstance && typeof sortableInstance.destroy === 'function') {
      sortableInstance.destroy()
    }
  } catch (error) {
    console.error('清理 SortableJS 实例失败:', error)
  }
  sortableInstance = null

  // 只在表格模式下初始化
  if (viewMode.value !== 'table') return

  nextTick(() => {
    if (!tableRef.value) return

    const tableEl = tableRef.value.$el
    if (!tableEl) return

    // 查找 tbody
    const tbody = tableEl.querySelector('tbody')
    if (!tbody) return

    sortableInstance = Sortable.create(tbody, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      filter: '.el-button, .el-button__text, .table-avatar',
      onEnd: (evt) => {
        const { oldIndex, newIndex } = evt
        if (oldIndex === newIndex) return
        reorderCharacters(oldIndex, newIndex)
      }
    })
  })
}

// 重新排序人物数组（根据拖拽后的顺序）
async function reorderCharacters(oldIndex, newIndex) {
  const list = characters.value
  if (!list || list.length === 0) return

  // 移动数组元素（数组顺序就是最终顺序）
  const movedItem = list[oldIndex]
  list.splice(oldIndex, 1)
  list.splice(newIndex, 0, movedItem)

  // 手动触发保存
  await saveCharacters()
}

// 监听表单头像字段变化，如果是本地路径则自动转换
watch(
  () => characterForm.avatar,
  async (newPath) => {
    if (!newPath) return
    const pathStr = newPath.toString().trim()
    
    // 只有在是本地绝对路径或 file:/// 路径，且不是 data: 或 http 时才处理
    if (
      (pathStr.startsWith('file:///') || /^[a-zA-Z]:[\\/]/.test(pathStr)) && 
      !pathStr.startsWith('data:') && 
      !pathStr.startsWith('http')
    ) {
      let localPath = pathStr
      if (pathStr.startsWith('file:///')) {
        localPath = pathStr.replace(/^file:\/\/\//, '')
      }
      
      try {
        const dataUrl = await window.electron.readLocalImage(localPath)
        if (dataUrl) {
          characterForm.avatar = dataUrl // 自动替换为 DataURL，以便预览显示
        }
      } catch (err) {
        console.error('自动转换本地头像失败:', err)
      }
    }
  }
)

// 监听数据变化，自动保存
watch(characters, saveCharacters, { deep: true })

// 监听表格数据变化，重新初始化拖拽（仅在表格模式下）
watch(
  () => [characters.value, viewMode.value],
  () => {
    if (viewMode.value === 'table') {
      nextTick(() => {
        initTableDragSort()
      })
    }
  },
  { deep: true }
)

// 预览表单中的头像
function previewFormAvatar() {
  if (characterForm.avatar) {
    imageViewerSrcList.value = [getAvatarSrc(characterForm.avatar)]
    imageViewerInitialIndex.value = 0
    imageViewerVisible.value = true
  } else {
    ElMessage.warning('暂无头像可预览')
  }
}

// 预览人物头像
function previewCharacterAvatar(character) {
  if (character.avatar) {
    imageViewerSrcList.value = [getAvatarSrc(character.avatar)]
    imageViewerInitialIndex.value = 0
    imageViewerVisible.value = true
  } else {
    ElMessage.warning(`${character.name} 暂无头像可预览`)
  }
}

// 选择本地图片
async function selectLocalImage() {
  try {
    const result = await window.electron.selectImage()
    if (result && result.dataUrl) {
      // 使用 base64 数据 URL，可以直接在浏览器中显示
      characterForm.avatar = result.dataUrl
      ElMessage.success('图片选择成功')
    }
  } catch (error) {
    console.error('选择图片失败:', error)
    ElMessage.error('选择图片失败')
  }
}

// 获取头像源地址
function getAvatarSrc(avatarPath) {
  if (!avatarPath) return ''

  // 直接返回路径（可能是 http/https URL 或 base64 数据 URL）
  return avatarPath
}

// 组件挂载时加载数据并初始化拖拽
onMounted(async () => {
  await loadCharacters()
  await loadDictionary() // 加载字典数据
  // 等待数据加载完成和 DOM 更新后再初始化拖拽
  await nextTick()
  initTableDragSort()
})

// 组件卸载时清理 SortableJS 实例
onBeforeUnmount(() => {
  try {
    if (sortableInstance && typeof sortableInstance.destroy === 'function') {
      sortableInstance.destroy()
    }
  } catch (error) {
    console.error('清理 SortableJS 实例失败:', error)
  }
  sortableInstance = null
})
</script>

<style lang="scss" scoped>
.view-toggle {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 10px;
}
.character-table {
  // 拖拽排序样式
  :deep(.sortable-ghost) {
    opacity: 0.4;
    background-color: var(--bg-soft);
  }

  :deep(.sortable-chosen) {
    background-color: var(--bg-soft);
  }

  :deep(.sortable-drag) {
    opacity: 0.8;
  }

  .table-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    margin: 0 auto;
    cursor: pointer;
    transition: all 0.3s ease;

    // &:hover {
    //   transform: scale(1.1);
    //   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    // }

    .table-avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .table-avatar-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      font-weight: bold;
    }
  }

  // 表格内文本预览样式，限制最多显示3行
  .table-text-preview {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 4.5em;
    line-height: 1.5;
    text-align: left;
    word-break: break-word;
  }

  .table-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: center;
  }

  .no-tags {
    color: #999;
    font-size: 12px;
    text-align: center;
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

  .table-aliases {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: center;

    .alias-item {
      margin: 0;
      font-size: 12px;
    }
  }

  .no-aliases {
    color: #999;
    font-size: 12px;
    text-align: center;
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

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  padding: 8px 0;
}

.character-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  height: 260px; // 固定卡片高度
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

    .character-actions {
      opacity: 1;
    }
  }

  // 卡片左侧颜色标识条
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6px;
  }

  &.male {
    &::before {
      background: #409eff;
    }
    
    .section-title-bar {
      background: #409eff;
    }
  }

  &.female {
    &::before {
      background: #ff86ad;
    }
    
    .section-title-bar {
      background: #ff86ad;
    }
  }

  &.neutral {
    &::before {
      background: #7048a1;
    }
    
    .section-title-bar {
      background: #7048a1;
    }
  }
}

.character-info {
  padding: 5px 0px 5px 6px; // 左侧增加6px间距避开颜色条
  height: 100%; // 占满卡片高度
  display: flex;
  flex-direction: column;
  overflow: hidden; // 防止内容溢出

  .character-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 0 10px;
    margin-bottom: 8px;
    flex-shrink: 0; // 头部不缩小
  }

  .character-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    position: relative;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
      font-weight: bold;
    }
  }

  .character-details {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;

    .name-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .character-marker {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
      box-shadow: 0 0 0 1px var(--border-color);
    }

    .character-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-base);
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 4px;
      
      .info-label {
        font-size: 12px;
        color: var(--text-secondary);
        font-weight: 500;
      }
      
      .info-value {
        font-size: 13px;
        color: var(--text-base);
        font-weight: 600;
      }
    }

    .info-divider {
      font-size: 12px;
      color: var(--border-color);
    }
  }

  // 别名显示样式
  .character-aliases {
    padding: 0 10px;
    margin-bottom: 6px;
    display: flex;
    align-items: flex-start;
    gap: 6px;
    flex-shrink: 0; // 不缩小
    max-height: 50px; // 限制最大高度
    overflow: hidden; // 超出隐藏

    .section-label {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 500;
      flex-shrink: 0;
      padding-top: 2px; // 对齐标签
    }

    .aliases-display {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      flex: 1;
      overflow: hidden; // 超出隐藏
      max-height: 50px; // 与父容器一致

      .alias-display-tag {
        margin: 0;
        font-size: 10px;
        border-radius: 4px;
        white-space: nowrap; // 标签不换行
        overflow: hidden;
        text-overflow: ellipsis; // 超长省略
        max-width: 120px; // 单个标签最大宽度
      }

      .alias-more-tag {
        margin: 0;
        font-size: 10px;
        border-radius: 4px;
        background: var(--el-color-info-light-9) !important;
        border-color: var(--el-color-info-light-7) !important;
        color: var(--el-color-info) !important;
        font-weight: 600;
      }
    }
  }

  // 标签样式（与别名样式保持一致）
  .character-tags {
    padding: 0 10px;
    margin-bottom: 6px;
    display: flex;
    align-items: flex-start;
    gap: 6px;
    flex-shrink: 0; // 不缩小
    max-height: 50px; // 限制最大高度
    overflow: hidden; // 超出隐藏

    .section-label {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 500;
      flex-shrink: 0;
      padding-top: 2px; // 对齐标签
    }

    .tags-display {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      flex: 1;
      overflow: hidden; // 超出隐藏
      max-height: 50px; // 与父容器一致

      .tag-item {
        margin: 0;
        font-size: 10px;
        border-radius: 4px;
        white-space: nowrap; // 标签不换行
        overflow: hidden;
        text-overflow: ellipsis; // 超长省略
        max-width: 120px; // 单个标签最大宽度
      }

      .tag-more-tag {
        margin: 0;
        font-size: 10px;
        border-radius: 4px;
        background: var(--el-color-info-light-9) !important;
        border-color: var(--el-color-info-light-7) !important;
        color: var(--el-color-info) !important;
        font-weight: 600;
      }
    }
  }

  // 介绍区域样式
  .character-section {
    padding: 0 10px;
    margin-bottom: 6px;
    display: flex;
    flex-direction: column;
    flex: 1; // 自动占据剩余空间
    min-height: 0; // 允许flex收缩
    overflow: hidden; // 防止溢出

    // 最后一个元素不需要下边距
    &:last-child {
      margin-bottom: 5px; // 底部留一点间距
    }

    .section-title-wrapper {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
      flex-shrink: 0; // 标题不缩小

      .section-title-bar {
        width: 3px;
        height: 14px;
        border-radius: 2px;
        flex-shrink: 0;
      }

      .section-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-base);
      }
    }
  }

  .character-intro {
    font-size: 12px;
    color: var(--text-base);
    line-height: 1.5;
    margin: 0;
    text-align: left;
    word-break: break-word;
    padding: 4px;
    background: var(--bg-soft);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    flex: 1; // 占据剩余空间
    overflow: hidden; // 超出隐藏
    display: -webkit-box;
    // -webkit-box-orient: vertical;
    // -webkit-line-clamp: 10; // 最多显示10行
    text-overflow: ellipsis;
  }

  // 形象介绍：根据剩余空间自适应
  .appearance-intro {
    // 继承父类样式即可
  }

  // 生平介绍：根据剩余空间自适应
  .biography-intro {
    // 继承父类样式即可
  }
}

.character-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.3s ease;

  .el-icon {
    font-size: 20px;
    color: var(--text-base);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;

    &:hover {
      background: var(--bg-mute);
    }

    &:first-child:hover {
      color: #409eff; // 编辑按钮悬浮蓝色
    }

    &:last-child:hover {
      color: #f56c6c; // 删除按钮悬浮红色
    }
  }
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

// 头像表单样式
.avatar-form-item {
  ::v-deep(.el-form-item__content) {
    display: flex;
    align-items: center;
    min-height: 100px;
  }
}

.avatar-form-section {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;

  .avatar-preview {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    border: 2px solid var(--border-color);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .form-avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .form-avatar-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      font-weight: bold;
    }
  }

  .avatar-input-section {
    flex: 1;

    .input-row {
      display: flex;
      gap: 12px;
      align-items: center;

      .el-input {
        flex: 1;
      }

      .el-button {
        flex-shrink: 0;
      }
    }
  }
}

.marker-selector {
  display: flex;
  align-items: center;
  gap: 12px;
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
      box-shadow:
        0 0 0 2px var(--bg-primary),
        0 0 0 4px rgba(64, 158, 255, 0.4);
    }

    .marker-none {
      font-size: 12px;
    }
  }
}

// 别名容器样式
.aliases-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;

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
    align-items: flex-start;

    .el-input {
      flex: 1;
    }

    .el-button {
      flex-shrink: 0;
    }
  }

  .alias-limit-tip {
    text-align: center;
    padding: 4px 0;
  }
}

// 预览弹框样式
.preview-dialog {
  :deep(.el-dialog__body) {
    padding: 0; // 移除padding，由内部容器控制
  }
}

// 编辑弹框样式
.edit-dialog {
  :deep(.el-dialog__body) {
    padding: 0; // 移除padding，由内部容器控制
  }
}

.edit-scroll-container {
  max-height: 500px; // 固定最大高度500px，与预览弹窗一致
  overflow-y: auto; // 添加垂直滚动条
  padding: 20px; // 在滚动容器内添加padding
  scrollbar-width: none; // 隐藏滚动条
}

// 文本编辑器弹窗样式
.text-editor-dialog {
  :deep(.el-textarea__inner) {
    font-family: inherit;
    line-height: 1.6;
  }
}

// 文本字段触发器样式
.text-field-trigger {
  height: 100px; // 固定高度，确保两个字段一致
  width: 100%;
  padding: 12px;
  background: var(--bg-soft);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: flex-start; // 改为顶部对齐

  &:hover {
    border-color: var(--el-color-primary);
    background: var(--bg-mute);

    .text-field-icon {
      opacity: 1;
    }
  }

  .text-field-preview {
    flex: 1;
    font-size: 14px;
    color: var(--text-base);
    line-height: 1.6;
    word-break: break-word;
    white-space: pre-wrap;
    max-height: 96px; // 调整为适应固定高度（120px - 24px padding）
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4; // 减少为4行，适应固定高度
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

.preview-content {
  .preview-scroll-container {
    max-height: 500px; // 固定最大高度500px
    overflow-y: auto; // 添加垂直滚动条
    padding: 20px; // 在滚动容器内添加padding
    scrollbar-width: none;   //隐藏滚动条
  }

  .preview-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-color);

    .preview-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .preview-avatar-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .preview-avatar-placeholder {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 28px;
        font-weight: bold;
      }
    }

    .preview-details {
      flex: 1;

      .preview-name-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

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

      .preview-info-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;

        .preview-info-item {
          display: flex;
          align-items: center;
          gap: 4px;

          .preview-info-label {
            font-size: 14px;
            color: var(--text-secondary);
            font-weight: 500;
          }

          .preview-info-value {
            font-size: 14px;
            color: var(--text-base);
            font-weight: 600;
          }
        }

        .preview-divider {
          font-size: 14px;
          color: var(--border-color);
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

    .preview-aliases,
    .preview-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 8px;
      background: var(--bg-soft);
      border-radius: 6px;
    }

    .preview-alias-tag,
    .preview-tag {
      margin: 0;
      font-size: 13px;
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
      white-space: pre-wrap; // 保留换行
    }
  }
}

// 深色模式特殊样式
:global(.dark) {
  .preview-content {
    .preview-header {
      border-bottom-color: rgba(255, 255, 255, 0.3);
    }

    .preview-text {
      border-color: rgba(255, 255, 255, 0.3);
    }
  }
}

// 导入弹窗样式
.import-dialog {
  .import-content {
    padding: 10px 0; // 内容上下内边距
  } // 内容结束
  
  .upload-area {
    width: 100%; // 宽度撑满
    
    :deep(.el-upload-dragger) {
      padding: 30px 20px; // 拖拽区域内边距
    } // 拖拽区域结束
  } // 上传区域结束
  
  .import-errors {
    background-color: var(--el-color-danger-light-9); // 错误区域背景色
    border-radius: 4px; // 圆角
    padding: 12px; // 内边距
    
    .error-title {
      font-size: 14px; // 标题字号
      margin-bottom: 8px; // 下边距
    } // 标题结束
    
    .error-item {
      font-size: 13px; // 错误项字号
      line-height: 1.6; // 行高
    } // 错误项结束
  } // 错误展示结束
} // 导入弹窗样式结束
</style>
