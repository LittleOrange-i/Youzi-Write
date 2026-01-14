<template>
  <div class="ai-sidebar">
    <!-- 模型选择 -->
    <div class="model-selector">
      <el-icon class="model-icon"><MagicStick /></el-icon>
      <el-select v-model="selectedModel" placeholder="选择模型" size="small">
        <el-option
          v-for="model in modelList"
          :key="model.id"
          :label="model.name"
          :value="model.id"
        >
          <div class="model-option">
            <span class="model-name">{{ model.name }}</span>
            <div class="model-actions" @click.stop>
              <el-icon @click="handleEditModel(model)"><Edit /></el-icon>
              <el-icon @click="handleDeleteModel(model.id)"><Delete /></el-icon>
            </div>
          </div>
        </el-option>
        <el-option value="__add_new__" class="add-model-option">
          <div class="add-model-trigger">
            <el-icon><Plus /></el-icon>
            <span>添加模型</span>
          </div>
        </el-option>
      </el-select>
      <span class="beta-tag">Beta</span>
    </div>

    <!-- 输入文本区域 -->
    <div class="input-section">
      <div class="section-title">输入文本</div>
      <el-input
        v-model="inputText"
        type="textarea"
        :rows="3"
        placeholder="输入或选中文本后自动填充..."
        class="input-textarea"
      />
      <!-- 按钮组 -->
      <div class="button-group">
        <el-button class="chapter-btn" size="small" @click="handleUseCurrentChapter">
          <el-icon><Document /></el-icon>
          当前章节
        </el-button>
        <el-button
          v-if="hasSelectedText"
          class="selected-text-btn"
          size="small"
          type="primary"
          @click="handleUseSelectedText"
        >
          <el-icon><Select /></el-icon>
          使用选中文本
        </el-button>
      </div>
    </div>

    <!-- AI 操作 -->
    <div class="ai-operations">
      <div class="section-title">AI 操作</div>
      <div class="operations-grid">
        <div class="operation-item" @click="handleRewrite">
          <el-icon><Refresh /></el-icon>
          <span>改写</span>
        </div>
        <div class="operation-item" @click="handleExpand">
          <el-icon><Plus /></el-icon>
          <span>扩写</span>
        </div>
        <div class="operation-item" @click="handlePolish">
          <el-icon><MagicStick /></el-icon>
          <span>润色</span>
        </div>
        <div class="operation-item" @click="handleContinue">
          <el-icon><Right /></el-icon>
          <span>续写</span>
        </div>
        <div class="operation-item" @click="handleNaming">
          <el-icon><User /></el-icon>
          <span>起名助手</span>
        </div>
        <div class="operation-item" @click="handleEmotions">
          <el-icon><Star /></el-icon>
          <span>情绪列表</span>
        </div>
        <div class="operation-item" @click="handleQA">
          <el-icon><ChatDotRound /></el-icon>
          <span>AI 问答</span>
        </div>
      </div>
    </div>

    <!-- 添加/编辑模型弹窗 -->
    <el-dialog
      v-model="modelDialogVisible"
      :title="editingModelId ? '编辑模型' : '添加模型'"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form :model="modelForm" label-width="120px" class="model-form">
            <el-form-item label="选择厂商">
              <el-select
                v-model="selectedProvider"
                placeholder="选择API厂商"
                @change="handleProviderChange"
              >
                <el-option
                  v-for="provider in apiProviders"
                  :key="provider.id"
                  :label="provider.name"
                  :value="provider.id"
                >
                  <div class="provider-option">
                    <span class="provider-name">{{ provider.name }}</span>
                    <span v-if="provider.novelAbility" class="provider-ability">
                      小说能力: {{ provider.novelAbility }}
                    </span>
                  </div>
                </el-option>
              </el-select>
              <div v-if="selectedProviderInfo?.description" class="provider-desc">
                💡 {{ selectedProviderInfo.description }}
              </div>
            </el-form-item>

            <el-form-item label="模型名称" required>
              <el-input
                v-model="modelForm.name"
                placeholder="例如：GPT-4 小说助手"
              />
            </el-form-item>

            <el-form-item label="描述">
              <el-input
                v-model="modelForm.description"
                placeholder="简短描述模型的功能..."
              />
            </el-form-item>

            <el-form-item label="API 接口地址" required>
              <el-input
                v-model="modelForm.endpoint"
                placeholder="https://api.example.com/v1/chat/completions"
              />
            </el-form-item>

            <el-form-item label="API 秘钥">
              <el-input
                v-model="modelForm.apiKey"
                type="password"
                placeholder="sk-... 或其他格式的秘钥"
                show-password
              />
            </el-form-item>

            <el-form-item label="模型ID" required>
              <el-select
                v-if="availableModels.length > 0"
                v-model="modelForm.modelId"
                placeholder="选择模型"
                filterable
                allow-create
              >
                <el-option
                  v-for="model in availableModels"
                  :key="model"
                  :label="model"
                  :value="model"
                />
              </el-select>
              <el-input
                v-else
                v-model="modelForm.modelId"
                placeholder="例如：gpt-4、qwen-max"
              />
            </el-form-item>
          </el-form>

      <template #footer>
        <el-button @click="modelDialogVisible = false">取消</el-button>
        <el-button 
          type="warning" 
          :loading="isTesting"
          :disabled="!canTest"
          @click="handleTestModel"
        >
          {{ isTesting ? '测试中...' : '快速测试' }}
        </el-button>
        <el-button 
          type="primary" 
          :disabled="!testPassed"
          @click="handleSaveModel"
        >
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 改写弹窗 -->
    <el-dialog
      v-model="rewriteDialogVisible"
      title="改写"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="风格选择">
          <el-select
            v-model="rewriteForm.style"
            placeholder="请选择风格"
          >
            <el-option
              v-for="style in writingStyles"
              :key="style.value"
              :label="style.label"
              :value="style.value"
            >
              <div class="style-option">
                <div class="style-label">{{ style.label }}</div>
                <div class="style-desc">{{ style.description }}</div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        
        <!-- 自定义风格输入框 -->
        <el-form-item 
          v-if="rewriteForm.style === 'custom'" 
          label="风格描述"
        >
          <el-input
            v-model="rewriteForm.customStyle"
            type="textarea"
            :rows="3"
            placeholder="请详细描述您想要的写作风格..."
          />
        </el-form-item>
        
        <el-form-item label="人物情绪">
          <el-select
            v-model="rewriteForm.emotion"
            placeholder="请选择情绪（可选）"
            clearable
          >
            <el-option
              v-for="emotion in emotionList"
              :key="emotion"
              :label="emotion"
              :value="emotion"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="自定义需求">
          <el-input
            v-model="rewriteForm.customRequirement"
            type="textarea"
            :rows="2"
            placeholder="输入额外的自定义需求（可选）..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleCancelRewrite">取消</el-button>
        <el-button type="primary" :loading="aiProcessing" @click="executeRewrite">
          {{ aiProcessing ? '生成中...' : '开始改写' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 扩写弹窗 -->
    <el-dialog
      v-model="expandDialogVisible"
      title="扩写"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="目标字数">
          <el-input-number
            v-model="expandForm.targetWords"
            :min="100"
            :max="10000"
            :step="100"
            placeholder="请输入目标字数"
          />
        </el-form-item>
        <el-form-item label="人物情绪">
          <el-select
            v-model="expandForm.emotion"
            placeholder="请选择情绪（可选）"
            clearable
          >
            <el-option
              v-for="emotion in emotionList"
              :key="emotion"
              :label="emotion"
              :value="emotion"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="自定义需求">
          <el-input
            v-model="expandForm.customRequirement"
            type="textarea"
            :rows="2"
            placeholder="输入额外的自定义需求（可选）..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleCancelExpand">取消</el-button>
        <el-button type="primary" :loading="aiProcessing" @click="executeExpand">
          {{ aiProcessing ? '生成中...' : '开始扩写' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 续写弹窗 -->
    <el-dialog
      v-model="continueDialogVisible"
      title="续写"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="目标字数">
          <el-input-number
            v-model="continueForm.targetWords"
            :min="100"
            :max="10000"
            :step="100"
            placeholder="请输入目标字数"
          />
        </el-form-item>
        <el-form-item label="人物情绪">
          <el-select
            v-model="continueForm.emotion"
            placeholder="请选择情绪（可选）"
            clearable
          >
            <el-option
              v-for="emotion in emotionList"
              :key="emotion"
              :label="emotion"
              :value="emotion"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="自定义需求">
          <el-input
            v-model="continueForm.customRequirement"
            type="textarea"
            :rows="2"
            placeholder="输入额外的自定义需求（可选）..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleCancelContinue">取消</el-button>
        <el-button type="primary" :loading="aiProcessing" @click="executeContinue">
          {{ aiProcessing ? '生成中...' : '开始续写' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 润色弹窗 -->
    <el-dialog
      v-model="polishDialogVisible"
      title="润色"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="人物情绪">
          <el-select
            v-model="polishForm.emotion"
            placeholder="请选择情绪（可选）"
            clearable
          >
            <el-option
              v-for="emotion in emotionList"
              :key="emotion"
              :label="emotion"
              :value="emotion"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="自定义需求">
          <el-input
            v-model="polishForm.customRequirement"
            type="textarea"
            :rows="2"
            placeholder="输入额外的自定义需求（可选）..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleCancelPolish">取消</el-button>
        <el-button type="primary" :loading="aiProcessing" @click="executePolish">
          {{ aiProcessing ? '生成中...' : '开始润色' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 起名助手弹窗 -->
    <el-dialog
      v-model="namingDialogVisible"
      title="起名助手"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="名称类型">
          <el-select
            v-model="namingForm.nameType"
            placeholder="请选择名称类型"
          >
            <el-option label="中国人名" value="chinese_person" />
            <el-option label="日本人名" value="japanese_person" />
            <el-option label="西方人名" value="western_person" />
            <el-option label="地点名" value="location" />
            <el-option label="功法名" value="skill" />
            <el-option label="法宝名" value="treasure" />
            <el-option label="灵药名" value="medicine" />
          </el-select>
        </el-form-item>
        
        <!-- 人名类型时显示性别选择 -->
        <el-form-item 
          v-if="isPersonNameType"
          label="性别"
        >
          <el-checkbox-group v-model="namingForm.gender">
            <el-checkbox label="male">男</el-checkbox>
            <el-checkbox label="female">女</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <!-- 关键字字段 -->
        <el-form-item label="关键字">
          <el-input
            v-model="namingForm.keyword"
            placeholder="输入关键字，AI将根据关键字生成相应名称"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleCancelNaming">取消</el-button>
        <el-button type="primary" :loading="aiProcessing" @click="executeNaming">
          {{ aiProcessing ? '生成中...' : '开始生成' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 问答弹窗 -->
    <el-dialog
      v-model="qaDialogVisible"
      title="AI 问答"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="提问">
          <el-input
            v-model="qaForm.question"
            type="textarea"
            :rows="6"
            placeholder="请输入您的问题..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleCancelQA">取消</el-button>
        <el-button type="primary" :loading="aiProcessing" @click="executeQA">
          {{ aiProcessing ? '生成中...' : '提问' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 情绪列表弹窗 -->
    <el-dialog
      v-model="emotionDialogVisible"
      title="情绪列表管理"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="emotion-manager">
        <div class="emotion-input">
          <el-input
            v-model="newEmotion"
            placeholder="输入新情绪..."
            @keyup.enter="addEmotion"
          />
          <el-button type="primary" @click="addEmotion">添加</el-button>
        </div>
        <div class="emotion-tags">
          <el-tag
            v-for="emotion in emotionList"
            :key="emotion"
            closable
            @close="removeEmotion(emotion)"
            class="emotion-tag"
          >
            {{ emotion }}
          </el-tag>
        </div>
      </div>
      <template #footer>
        <el-button @click="emotionDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="resetEmotions">恢复默认</el-button>
      </template>
    </el-dialog>

    <!-- AI 结果弹窗 -->
    <el-dialog
      v-model="resultDialogVisible"
      title="AI 生成结果"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-input
        v-model="aiResult"
        type="textarea"
        :rows="15"
        placeholder="AI 生成的内容将显示在这里..."
        readonly
      />
      <template #footer>
        <el-button @click="resultDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="copyResult">复制结果</el-button>
        <el-button type="success" @click="insertResult">插入到编辑器</el-button>
      </template>
    </el-dialog>

    <!-- 可移动浮动结果窗口 -->
    <Teleport to="body">
      <Transition name="floating-fade">
        <div
          v-if="showFloatingResult"
          class="floating-result-window"
          :class="{ 'is-dragging': isDragging }"
          :style="{
            left: floatingPosition.x + 'px',
            top: floatingPosition.y + 'px',
            zIndex: floatingZIndex
          }"
        >
          <div class="floating-header" @mousedown="startDrag">
            <div class="header-title">
              <el-icon class="drag-icon"><Rank /></el-icon>
              <span>AI 生成结果</span>
              <span class="drag-tip">可拖动</span>
            </div>
            <div class="header-actions">
              <el-tooltip content="关闭" placement="top">
                <el-icon class="action-icon" @click="closeFloatingResult">
                  <Close />
                </el-icon>
              </el-tooltip>
            </div>
          </div>
          <div class="floating-content">
            <div v-if="aiProcessing" class="loading-overlay">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>AI 正在生成中...</span>
            </div>
            <el-input
              v-model="aiResult"
              type="textarea"
              :rows="12"
              placeholder="AI 生成的内容将显示在这里..."
              readonly
              class="result-textarea"
            />
          </div>
          <div class="floating-footer">
            <el-button size="small" @click="closeFloatingResult">关闭</el-button>
            <el-button size="small" type="primary" @click="copyResult">复制</el-button>
            <el-button size="small" type="success" @click="insertFloatingResult">插入</el-button>
            <el-button 
              size="small" 
              :loading="aiProcessing"
              :disabled="!lastOperation"
              @click="regenerateResult"
            >
              {{ aiProcessing ? '生成中...' : '重新生成' }}
            </el-button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, inject, watch, onBeforeUnmount, onMounted, computed } from 'vue'
import {
  Refresh,
  Plus,
  MagicStick,
  Right,
  User,
  Star,
  Document,
  Select,
  Edit,
  Delete,
  Rank,
  Close,
  Loading,
  ChatDotRound
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 各大厂商API配置预设（专注小说/文本生成）
const apiProviders = [
  {
    id: 'zhipu',
    name: '智谱 AI (GLM)',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    models: ['glm-4-flash', 'glm-4-plus', 'glm-4-air'],
    requiresKey: true,
    supportsWebSearch: true,
    isOpenAICompatible: true,
    novelAbility: '极强',
    description: '中文叙事、情感描写优秀，glm-4-flash 免费且快速'
  },
  {
    id: 'alibaba',
    name: '阿里云 (通义千问)',
    endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    models: ['qwen3-max','qwen-max', 'qwen-plus', 'qwen-turbo'],
    requiresKey: true,
    supportsWebSearch: true,
    isOpenAICompatible: false,
    novelAbility: '强',
    description: '支持长上下文、角色设定、风格模仿'
  },
  {
    id: 'deepseek',
    name: '深度求索 (DeepSeek)',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    models: ['deepseek-r1', 'deepseek-v3'],
    requiresKey: true,
    isOpenAICompatible: true,
    novelAbility: '强',
    description: '擅长网文风格、长文本生成，开源模型'
  },
  {
    id: 'siliconflow',
    name: '硅基流动 (SiliconFlow)',
    endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
    models: ['deepseek-ai/DeepSeek-R1-0528-Qwen3-8B', 'Qwen/Qwen3-8B', 'THUDM/glm-4-9b'],
    requiresKey: true,
    isOpenAICompatible: true,
    novelAbility: '强',
    description: '聚合多个模型，免费额度高，支持 DeepSeek-R1'
  },
  {
    id: 'baidu',
    name: '百度 (文心一言)',
    endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-4.5',
    models: ['ernie-4.5', 'ernie-speed', 'ernie-lite'],
    requiresKey: true,
    supportsWebSearch: true,
    isOpenAICompatible: false,
    novelAbility: '中等',
    description: '需先用 client_id + client_secret 换取 access_token，偏正式风格'
  },
  {
    id: 'moonshot',
    name: '月之暗面 (Kimi)',
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    models: ['kimi-k2-0905-preview','moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    requiresKey: true,
    supportsWebSearch: true,
    isOpenAICompatible: true,
    novelAbility: '强',
    description: '支持超长上下文（128k），适合长篇连载续写'
  },
  {
    id: 'tencent',
    name: '腾讯混元',
    endpoint: 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions',
    models: ['hunyuan-lite', 'hunyuan-standard', 'hunyuan-pro'],
    requiresKey: true,
    isOpenAICompatible: true,
    novelAbility: '中等',
    description: '腾讯自研大模型'
  },
  {
    id: 'openai',
    name: 'OpenAI (GPT)',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4o-mini'],
    requiresKey: true,
    isOpenAICompatible: true,
    novelAbility: '顶级',
    description: '情节、人物、节奏控制极佳，国内需代理'
  },
  {
    id: 'google',
    name: 'Google Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    requiresKey: true,
    isOpenAICompatible: false,
    novelAbility: '强',
    description: '支持 2M 上下文，适合长篇续写'
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    endpoint: 'https://api.anthropic.com/v1/messages',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-opus', 'claude-3-haiku'],
    requiresKey: true,
    isOpenAICompatible: false,
    novelAbility: '最佳',
    description: '文笔细腻、逻辑连贯'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (聚合平台)',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: ['google/gemini-2.0-flash-exp:free', 'meta-llama/llama-3.1-8b-instruct:free'],
    requiresKey: true,
    isOpenAICompatible: true,
    novelAbility: '中等',
    description: '聚合多个模型，可使用 :free 标签筛选免费模型'
  },
  {
    id: 'custom',
    name: '自定义接口',
    endpoint: '',
    models: [],
    requiresKey: false,
    isOpenAICompatible: true,
    description: '手动配置 API 地址和模型'
  }
]

// 响应式数据
const selectedModel = ref('')
const inputText = ref('')
const hasSelectedText = ref(false)
const selectedText = ref('')

// 模型管理相关
const modelList = ref([]) // 用户添加的模型列表
const modelDialogVisible = ref(false)
const editingModelId = ref(null)
const selectedProvider = ref('')
const availableModels = ref([])
const isTesting = ref(false) // 测试状态
const testPassed = ref(false) // 测试是否通过

// 模型表单数据
const modelForm = ref({
  name: '',
  description: '',
  endpoint: '',
  apiKey: '',
  modelId: ''
})

// AI 操作弹窗状态
const rewriteDialogVisible = ref(false)
const expandDialogVisible = ref(false)
const continueDialogVisible = ref(false)
const polishDialogVisible = ref(false)
const namingDialogVisible = ref(false)
const emotionDialogVisible = ref(false)
const resultDialogVisible = ref(false)
const qaDialogVisible = ref(false)

// AI 操作表单数据
const rewriteForm = ref({
  emotion: '',
  style: '', // 风格选择
  customStyle: '', // 自定义风格描述
  customRequirement: '' // 自定义需求
})

// 写作风格列表
const writingStyles = [
  { value: 'original', label: '保持原有风格', description: '维持原文的基本风格和语调' },
  { value: 'literary', label: '文艺感慨风', description: '语言优美、富有诗意，常使用比喻、象征等修辞，强调情感渲染与哲思' },
  { value: 'casual', label: '直白吐槽风', description: '口语化强，情绪直接，常用感叹、反问，贴近日常交流' },
  { value: 'reflective', label: '深沉反思风', description: '理性冷静，带有批判性思维，注重逻辑推演与社会观察' },
  { value: 'formal', label: '正式/专业风', description: '用于学术、公文或新闻报道，语言严谨、术语规范、逻辑清晰' },
  { value: 'chatty', label: '口语化/朋友聊天风', description: '轻松自然，多用短句、俚语、语气词，适合社交媒体内容' },
  { value: 'fresh', label: '小清新风格', description: '清新脱俗，文字简洁明快，注重意境营造' },
  { value: 'narrative', label: '工整叙事风格', description: '结构严谨，叙述流畅，逻辑清晰，适合故事叙述' },
  { value: 'prose', label: '散文风格', description: '形散神聚，文字优美，富有文学性和艺术感' },
  { value: 'humorous', label: '诙谐搞笑风格', description: '幽默风趣，善用夸张、双关等手法，轻松活泼' },
  { value: 'classical', label: '文言文风格', description: '使用古典文言文表达，典雅庄重' },
  { value: 'ornate', label: '华丽词藻风格', description: '用词华美，修辞丰富，注重文字的艺术性' },
  { value: 'newmedia', label: '新媒体风格', description: '简洁明快，适合网络传播，注重标题和节奏感' },
  { value: 'custom', label: '自定义', description: '自行输入风格要求' }
]

const expandForm = ref({
  targetWords: 500,
  emotion: '',
  customRequirement: '' // 自定义需求
})

const continueForm = ref({
  targetWords: 500,
  emotion: '',
  customRequirement: '' // 自定义需求
})

const polishForm = ref({
  emotion: '',
  customRequirement: '' // 自定义需求
})

const namingForm = ref({
  nameType: '',
  gender: [], // 性别多选：['male', 'female']
  keyword: '' // 关键字字段
})

const qaForm = ref({
  question: ''
})

// AI 处理状态和结果
const aiProcessing = ref(false)
const aiResult = ref('')
// 用于中断 AI 生成的标志
const abortController = ref(null)

// 浮动结果窗口相关
const showFloatingResult = ref(false)
const floatingPosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 }) // 记录拖动偏移量
const lastOperation = ref(null) // 保存最后一次操作，用于重新生成
const floatingZIndex = ref(500) // 固定层级

// 初始化浮动窗口位置（居中显示）
const initFloatingPosition = () => {
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  const floatingWidth = 500
  const floatingHeight = 400
  const rightMargin = 100 // 距离右侧的间距
  
  floatingPosition.value = {
    // x: (windowWidth - floatingWidth) / 2,
    x: windowWidth - floatingWidth - rightMargin,
    y: (windowHeight - floatingHeight) / 2
  }
}

// 情绪列表管理
const newEmotion = ref('')
const emotionList = ref([
  '愤怒', '喜悦', '悲伤', '恐惧', '惊讶', '厌恶',
  '焦虑', '期待', '平静', '兴奋', '沮丧', '满足',
  '羞愧', '骄傲', '嫉妒', '感激', '同情', '怀疑',
  '紧张', '放松', '困惑', '自信', '绝望', '希望'
])

// System prompt 配置
const AI_SYSTEM_PROMPT = '你是一个资深的网文作者以及编辑的身份，擅长写小说，对画面感的掌控十分有经验，人物情绪的表达也十分到位，下面请根据以下要求进行回答，只返回回答的内容，不要返回其他的'

// 计算属性：当前选择的厂商信息
const selectedProviderInfo = computed(() => {
  return apiProviders.find((p) => p.id === selectedProvider.value)
})

// 计算属性：是否可以测试
const canTest = computed(() => {
  return modelForm.value.endpoint.trim() && modelForm.value.modelId.trim()
})

// 计算属性：判断是否为人名类型
const isPersonNameType = computed(() => {
  return ['chinese_person', 'japanese_person', 'western_person'].includes(namingForm.value.nameType)
})

// 监听表单关键字段变化，重置测试状态
watch(
  () => [modelForm.value.endpoint, modelForm.value.modelId, modelForm.value.apiKey],
  () => {
    // 只在非编辑模式下重置测试状态
    if (!editingModelId.value) {
      testPassed.value = false
    }
  }
)

// 注入编辑器实例（从父组件提供）
const editorInstance = inject('editorInstance', ref(null))

// 从 localStorage 加载模型列表
const loadModels = () => {
  try {
    const saved = localStorage.getItem('ai_models')
    if (saved) {
      modelList.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('加载模型列表失败:', error)
  }
}

// 保存模型列表到 localStorage
const saveModels = () => {
  try {
    localStorage.setItem('ai_models', JSON.stringify(modelList.value))
  } catch (error) {
    console.error('保存模型列表失败:', error)
  }
}



// 监听模型选择变化
watch(selectedModel, (newVal) => {
  if (newVal === '__add_new__') {
    // 打开添加模型弹窗
    handleAddModel()
    // 重置选择
    selectedModel.value = modelList.value[0]?.id || ''
  }
})



// 处理添加模型
const handleAddModel = () => {
  editingModelId.value = null
  modelForm.value = {
    name: '',
    description: '',
    endpoint: '',
    apiKey: '',
    modelId: ''
  }
  selectedProvider.value = ''
  availableModels.value = []
  testPassed.value = false
  isTesting.value = false
  modelDialogVisible.value = true
}

// 处理编辑模型
const handleEditModel = (model) => {
  editingModelId.value = model.id
  modelForm.value = { ...model }
  selectedProvider.value = model.providerId || ''
  availableModels.value = []
  testPassed.value = true // 编辑模式默认已通过测试
  isTesting.value = false
  modelDialogVisible.value = true
}

// 处理删除模型
const handleDeleteModel = async (modelId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个模型吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    modelList.value = modelList.value.filter((m) => m.id !== modelId)
    saveModels()

    // 如果删除的是当前选中的模型，切换到第一个模型
    if (selectedModel.value === modelId) {
      selectedModel.value = modelList.value[0]?.id || ''
    }

    ElMessage.success('删除成功')
  } catch (error) {
    // 用户取消删除
  }
}



// 处理厂商选择变化
const handleProviderChange = (providerId) => {
  const provider = apiProviders.find((p) => p.id === providerId)
  if (provider) {
    modelForm.value.endpoint = provider.endpoint
    availableModels.value = provider.models || []

    // 如果只有一个模型，自动选择
    if (availableModels.value.length === 1) {
      modelForm.value.modelId = availableModels.value[0]
    }
  }
  // 更改配置后需要重新测试
  testPassed.value = false
}

// 快速测试模型配置
const handleTestModel = async () => {
  // 验证必填项
  if (!modelForm.value.endpoint.trim()) {
    ElMessage.warning('请输入API接口地址')
    return
  }
  if (!modelForm.value.modelId.trim()) {
    ElMessage.warning('请输入模型ID')
    return
  }

  isTesting.value = true
  testPassed.value = false

  try {
    // 通过主进程调用 API 测试
    const result = await window.electron.testAIModel({
      endpoint: modelForm.value.endpoint,
      apiKey: modelForm.value.apiKey,
      modelId: modelForm.value.modelId,
      providerId: selectedProvider.value
    })

    if (result.success) {
      testPassed.value = true
      ElMessage.success(result.message || '测试成功！模型配置正确')
    } else {
      testPassed.value = false
      ElMessage.error(`测试失败: ${result.error}`)
    }
  } catch (error) {
    testPassed.value = false
    ElMessage.error(`测试失败: ${error.message}`)
    console.error('模型测试失败:', error)
  } finally {
    isTesting.value = false
  }
}





// 保存模型
const handleSaveModel = () => {
  // 验证必填项
  if (!modelForm.value.name.trim()) {
    ElMessage.warning('请输入模型名称')
    return
  }
  if (!modelForm.value.endpoint.trim()) {
    ElMessage.warning('请输入API接口地址')
    return
  }
  if (!modelForm.value.modelId.trim()) {
    ElMessage.warning('请输入模型ID')
    return
  }

  if (!testPassed.value) {
    ElMessage.warning('请先通过快速测试')
    return
  }

  if (editingModelId.value) {
    // 编辑模式
    const index = modelList.value.findIndex((m) => m.id === editingModelId.value)
    if (index !== -1) {
      modelList.value[index] = {
        ...modelForm.value,
        id: editingModelId.value,
        providerId: selectedProvider.value
      }
    }
    ElMessage.success('模型更新成功')
  } else {
    // 新增模式
    const newModel = {
      ...modelForm.value,
      id: `model_${Date.now()}`,
      providerId: selectedProvider.value
    }
    modelList.value.push(newModel)
    selectedModel.value = newModel.id
    ElMessage.success('模型添加成功')
  }

  saveModels()
  modelDialogVisible.value = false
}

// 组件挂载时加载模型
onMounted(() => {
  loadModels()
  // 默认选择第一个模型
  if (modelList.value.length > 0) {
    selectedModel.value = modelList.value[0].id
  }
  // 加载情绪列表
  loadEmotions()
  // 初始化浮动窗口位置
  initFloatingPosition()
})

// 情绪列表管理函数
const loadEmotions = () => {
  try {
    const saved = localStorage.getItem('ai_emotions')
    if (saved) {
      emotionList.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('加载情绪列表失败:', error)
  }
}




const saveEmotions = () => {
  try {
    localStorage.setItem('ai_emotions', JSON.stringify(emotionList.value))
  } catch (error) {
    console.error('保存情绪列表失败:', error)
  }
}




const addEmotion = () => {
  const emotion = newEmotion.value.trim()
  if (!emotion) {
    ElMessage.warning('请输入情绪名称')
    return
  }
  if (emotionList.value.includes(emotion)) {
    ElMessage.warning('该情绪已存在')
    return
  }
  emotionList.value.push(emotion)
  saveEmotions()
  newEmotion.value = ''
  ElMessage.success('添加成功')
}

const removeEmotion = (emotion) => {
  emotionList.value = emotionList.value.filter((e) => e !== emotion)
  saveEmotions()
  ElMessage.success('删除成功')
}

const resetEmotions = () => {
  emotionList.value = [
    '愤怒', '喜悦', '悲伤', '恐惧', '惊讶', '厌恶',
    '焦虑', '期待', '平静', '兴奋', '沮丧', '满足',
    '羞愧', '骄傲', '嫉妒', '感激', '同情', '怀疑',
    '紧张', '放松', '困惑', '自信', '绝望', '希望'
  ]
  saveEmotions()
  ElMessage.success('已恢复默认情绪列表')
}

// 监听编辑器选择变化
const handleSelectionUpdate = () => {
  if (!editorInstance.value) return

  const { state } = editorInstance.value
  const { from, to } = state.selection

  // 判断是否有选中文本（选区起点和终点不同）
  if (from !== to) {
    const text = state.doc.textBetween(from, to, '\n')
    if (text.trim()) {
      hasSelectedText.value = true
      selectedText.value = text
    } else {
      hasSelectedText.value = false
      selectedText.value = ''
    }
  } else {
    hasSelectedText.value = false
    selectedText.value = ''
  }
}



// 监听编辑器实例变化，当编辑器准备好时自动绑定事件
watch(
  () => editorInstance.value,
  (newEditor, oldEditor) => {
    // 移除旧编辑器的事件监听
    if (oldEditor) {
      oldEditor.off('selectionUpdate', handleSelectionUpdate)
    }

    // 绑定新编辑器的事件监听
    if (newEditor) {
      newEditor.on('selectionUpdate', handleSelectionUpdate)
    }
  },
  { immediate: true }
)

// 组件卸载时，移除事件监听
onBeforeUnmount(() => {
  if (editorInstance.value) {
    editorInstance.value.off('selectionUpdate', handleSelectionUpdate)
  }
})


// 处理使用当前章节内容
const handleUseCurrentChapter = () => {
  if (!editorInstance || !editorInstance.value) {
    ElMessage.warning('编辑器未就绪，请先打开章节或笔记')
    return
  }

  // 获取编辑器的全部文本内容
  const fullText = editorInstance.value.getText()

  if (!fullText.trim()) {
    ElMessage.warning('当前内容为空')
    return
  }

  inputText.value = fullText
  ElMessage.success('已加载当前内容')
}

// 处理使用选中文本
const handleUseSelectedText = () => {
  if (!selectedText.value.trim()) {
    ElMessage.warning('未选中文本')
    return
  }

  inputText.value = selectedText.value
  ElMessage.success('已加载选中文本')
}

// AI 操作处理函数
const handleRewrite = () => {
  if (!inputText.value.trim()) {
    ElMessage.warning('请先输入文本')
    return
  }
  if (!selectedModel.value) {
    ElMessage.warning('请先选择模型')
    return
  }
  // 重置表单数据
  rewriteForm.value.style = 'original'
  rewriteForm.value.emotion = ''
  rewriteForm.value.customStyle = ''
  rewriteForm.value.customRequirement = ''
  rewriteDialogVisible.value = true
}

const handleExpand = () => {
  if (!inputText.value.trim()) {
    ElMessage.warning('请先输入文本')
    return
  }
  if (!selectedModel.value) {
    ElMessage.warning('请先选择模型')
    return
  }
  expandForm.value.targetWords = 500
  expandForm.value.emotion = ''
  expandForm.value.customRequirement = ''
  expandDialogVisible.value = true
}

const handlePolish = () => {
  if (!inputText.value.trim()) {
    ElMessage.warning('请先输入文本')
    return
  }
  if (!selectedModel.value) {
    ElMessage.warning('请先选择模型')
    return
  }
  polishForm.value.emotion = ''
  polishForm.value.customRequirement = ''
  polishDialogVisible.value = true
}

const handleContinue = () => {
  if (!inputText.value.trim()) {
    ElMessage.warning('请先输入文本')
    return
  }
  if (!selectedModel.value) {
    ElMessage.warning('请先选择模型')
    return
  }
  continueForm.value.targetWords = 500
  continueForm.value.emotion = ''
  continueForm.value.customRequirement = ''
  continueDialogVisible.value = true
}

const handleNaming = () => {
  if (!selectedModel.value) {
    ElMessage.warning('请先选择模型')
    return
  }
  namingForm.value.nameType = ''
  namingForm.value.gender = []
  namingForm.value.keyword = ''
  namingDialogVisible.value = true
}

const handleEmotions = () => {
  emotionDialogVisible.value = true
}

const handleQA = () => {
  if (!selectedModel.value) {
    ElMessage.warning('请先选择模型')
    return
  }
  qaForm.value.question = ''
  qaDialogVisible.value = true
}

// 取消按钮处理函数 - 在生成中时确认是否取消
const handleCancelRewrite = async () => {
  if (aiProcessing.value) {
    try {
      await ElMessageBox.confirm('AI 正在生成中，确定要取消吗？', '提示', {
        confirmButtonText: '确定取消',
        cancelButtonText: '继续生成',
        type: 'warning'
      })
      // 用户确认取消，中断生成
      if (abortController.value) {
        abortController.value.abort()
        abortController.value = null
      }
      aiProcessing.value = false
      rewriteDialogVisible.value = false
      ElMessage.info('已取消生成')
    } catch {
      // 用户点击"继续生成"，不做任何操作
    }
  } else {
    rewriteDialogVisible.value = false
  }
}

const handleCancelExpand = async () => {
  if (aiProcessing.value) {
    try {
      await ElMessageBox.confirm('AI 正在生成中，确定要取消吗？', '提示', {
        confirmButtonText: '确定取消',
        cancelButtonText: '继续生成',
        type: 'warning'
      })
      if (abortController.value) {
        abortController.value.abort()
        abortController.value = null
      }
      aiProcessing.value = false
      expandDialogVisible.value = false
      ElMessage.info('已取消生成')
    } catch {
      // 用户点击"继续生成"
    }
  } else {
    expandDialogVisible.value = false
  }
}

const handleCancelContinue = async () => {
  if (aiProcessing.value) {
    try {
      await ElMessageBox.confirm('AI 正在生成中，确定要取消吗？', '提示', {
        confirmButtonText: '确定取消',
        cancelButtonText: '继续生成',
        type: 'warning'
      })
      if (abortController.value) {
        abortController.value.abort()
        abortController.value = null
      }
      aiProcessing.value = false
      continueDialogVisible.value = false
      ElMessage.info('已取消生成')
    } catch {
      // 用户点击"继续生成"
    }
  } else {
    continueDialogVisible.value = false
  }
}

const handleCancelPolish = async () => {
  if (aiProcessing.value) {
    try {
      await ElMessageBox.confirm('AI 正在生成中，确定要取消吗？', '提示', {
        confirmButtonText: '确定取消',
        cancelButtonText: '继续生成',
        type: 'warning'
      })
      if (abortController.value) {
        abortController.value.abort()
        abortController.value = null
      }
      aiProcessing.value = false
      polishDialogVisible.value = false
      ElMessage.info('已取消生成')
    } catch {
      // 用户点击"继续生成"
    }
  } else {
    polishDialogVisible.value = false
  }
}

const handleCancelNaming = async () => {
  if (aiProcessing.value) {
    try {
      await ElMessageBox.confirm('AI 正在生成中，确定要取消吗？', '提示', {
        confirmButtonText: '确定取消',
        cancelButtonText: '继续生成',
        type: 'warning'
      })
      if (abortController.value) {
        abortController.value.abort()
        abortController.value = null
      }
      aiProcessing.value = false
      namingDialogVisible.value = false
      ElMessage.info('已取消生成')
    } catch {
      // 用户点击"继续生成"
    }
  } else {
    namingDialogVisible.value = false
  }
}

const handleCancelQA = async () => {
  if (aiProcessing.value) {
    try {
      await ElMessageBox.confirm('AI 正在生成中，确定要取消吗？', '提示', {
        confirmButtonText: '确定取消',
        cancelButtonText: '继续生成',
        type: 'warning'
      })
      if (abortController.value) {
        abortController.value.abort()
        abortController.value = null
      }
      aiProcessing.value = false
      qaDialogVisible.value = false
      ElMessage.info('已取消生成')
    } catch {
      // 用户点击"继续生成"
    }
  } else {
    qaDialogVisible.value = false
  }
}

// 调用 AI 的通用函数
const callAI = async (userPrompt) => {
  const currentModel = modelList.value.find((m) => m.id === selectedModel.value)
  if (!currentModel) {
    throw new Error('未找到选中的模型')
  }

  // 创建新的 AbortController
  abortController.value = new AbortController()

  try {
    const result = await window.electron.callAI({
      endpoint: currentModel.endpoint,
      apiKey: currentModel.apiKey,
      modelId: currentModel.modelId,
      providerId: currentModel.providerId,
      systemPrompt: AI_SYSTEM_PROMPT,
      userPrompt: userPrompt,
      signal: abortController.value.signal
    })

    if (!result.success) {
      throw new Error(result.error || 'AI 调用失败')
    }

    return result.content
  } finally {
    // 清理 AbortController
    abortController.value = null
  }
}

// 执行改写
const executeRewrite = async () => {
  // 验证必填项
  if (!rewriteForm.value.style) {
    ElMessage.warning('请选择风格')
    return
  }
  
  if (rewriteForm.value.style === 'custom' && !rewriteForm.value.customStyle?.trim()) {
    ElMessage.warning('请输入自定义风格描述')
    return
  }

  aiProcessing.value = true
  try {
    let prompt = ''
    
    // 根据风格选择构建 prompt
    if (rewriteForm.value.style === 'original') {
      prompt = `请将以下文本改写，保持原有风格和基本意思不变，使表达更加流畅：\n\n${inputText.value}`
    } else if (rewriteForm.value.style === 'custom') {
      prompt = `请将以下文本改写为：${rewriteForm.value.customStyle}：\n\n${inputText.value}`
    } else {
      // 获取风格描述
      const selectedStyle = writingStyles.find(s => s.value === rewriteForm.value.style)
      const styleDesc = selectedStyle ? selectedStyle.description : ''
      prompt = `请将以下文本改写为${selectedStyle?.label}（${styleDesc}）：\n\n${inputText.value}`
    }
    
    if (rewriteForm.value.emotion) {
      prompt += `\n\n要求：添加【${rewriteForm.value.emotion}】的人物情绪描写。`
    }

    // 添加自定义需求
    if (rewriteForm.value.customRequirement?.trim()) {
      prompt += `\n\n额外需求：${rewriteForm.value.customRequirement}`
    }

    const result = await callAI(prompt)
    
    // 检查是否被中断
    if (!aiProcessing.value) {
      return
    }
    
    aiResult.value = result
    rewriteDialogVisible.value = false
    
    // 保存当前操作信息，用于重新生成
    lastOperation.value = {
      type: 'rewrite',
      prompt: prompt
    }
    
    // 使用浮动窗口显示改写结果
    initFloatingPosition()
    showFloatingResult.value = true
    ElMessage.success('改写完成')
  } catch (error) {
    // 如果是用户取消，不显示错误
    if (error.name === 'AbortError' || !aiProcessing.value) {
      return
    }
    ElMessage.error(`改写失败: ${error.message}`)
    console.error('改写失败:', error)
  } finally {
    aiProcessing.value = false
  }
}





// 执行扩写
const executeExpand = async () => {
  aiProcessing.value = true
  try {
    let prompt = `请在以下原文的基础上进行扩展，增加更多细节或内容，使其更加丰富。目标字数约为 ${expandForm.value.targetWords} 字：\n\n${inputText.value}`
    
    if (expandForm.value.emotion) {
      prompt += `\n\n要求：添加【${expandForm.value.emotion}】的人物情绪描写。`
    }

    // 添加自定义需求
    if (expandForm.value.customRequirement?.trim()) {
      prompt += `\n\n额外需求：${expandForm.value.customRequirement}`
    }

    const result = await callAI(prompt)
    
    // 检查是否被中断
    if (!aiProcessing.value) {
      return
    }
    
    aiResult.value = result
    expandDialogVisible.value = false
    
    // 保存当前操作信息，用于重新生成
    lastOperation.value = {
      type: 'expand',
      prompt: prompt
    }
    
    // 使用浮动窗口显示扩写结果
    initFloatingPosition()
    showFloatingResult.value = true
    ElMessage.success('扩写完成')
  } catch (error) {
    // 如果是用户取消，不显示错误
    if (error.name === 'AbortError' || !aiProcessing.value) {
      return
    }
    ElMessage.error(`扩写失败: ${error.message}`)
    console.error('扩写失败:', error)
  } finally {
    aiProcessing.value = false
  }
}


// 执行续写
const executeContinue = async () => {
  aiProcessing.value = true
  try {
    let prompt = `请根据以下原文的上下文进行续写，续写字数约为 ${continueForm.value.targetWords} 字：\n\n${inputText.value}`
    
    if (continueForm.value.emotion) {
      prompt += `\n\n要求：添加【${continueForm.value.emotion}】的人物情绪描写。`
    }

    // 添加自定义需求
    if (continueForm.value.customRequirement?.trim()) {
      prompt += `\n\n额外需求：${continueForm.value.customRequirement}`
    }

    const result = await callAI(prompt)
    
    // 检查是否被中断
    if (!aiProcessing.value) {
      return
    }
    
    aiResult.value = result
    continueDialogVisible.value = false
    
    // 保存当前操作信息，用于重新生成
    lastOperation.value = {
      type: 'continue',
      prompt: prompt
    }
    
    // 使用浮动窗口显示续写结果
    initFloatingPosition()
    showFloatingResult.value = true
    ElMessage.success('续写完成')
  } catch (error) {
    // 如果是用户取消，不显示错误
    if (error.name === 'AbortError' || !aiProcessing.value) {
      return
    }
    ElMessage.error(`续写失败: ${error.message}`)
    console.error('续写失败:', error)
  } finally {
    aiProcessing.value = false
  }
}



// 执行润色
const executePolish = async () => {
  aiProcessing.value = true
  try {
    let prompt = `请对以下原文进行修饰，使其语言更加优美，表达更加精确：\n\n${inputText.value}`
    
    if (polishForm.value.emotion) {
      prompt += `\n\n要求：强化【${polishForm.value.emotion}】的人物情绪表达。`
    }

    // 添加自定义需求
    if (polishForm.value.customRequirement?.trim()) {
      prompt += `\n\n额外需求：${polishForm.value.customRequirement}`
    }

    const result = await callAI(prompt)
    
    // 检查是否被中断
    if (!aiProcessing.value) {
      return
    }
    
    aiResult.value = result
    polishDialogVisible.value = false
    
    // 保存当前操作信息，用于重新生成
    lastOperation.value = {
      type: 'polish',
      prompt: prompt
    }
    
    // 使用浮动窗口显示润色结果
    initFloatingPosition()
    showFloatingResult.value = true
    ElMessage.success('润色完成')
  } catch (error) {
    // 如果是用户取消，不显示错误
    if (error.name === 'AbortError' || !aiProcessing.value) {
      return
    }
    ElMessage.error(`润色失败: ${error.message}`)
    console.error('润色失败:', error)
  } finally {
    aiProcessing.value = false
  }
}





// 执行起名助手
const executeNaming = async () => {
  if (!namingForm.value.nameType) {
    ElMessage.warning('请选择名称类型')
    return
  }

  // 如果是人名类型，必须选择性别
  if (isPersonNameType.value && namingForm.value.gender.length === 0) {
    ElMessage.warning('请选择性别')
    return
  }

  aiProcessing.value = true
  try {
    const nameTypeMap = {
      chinese_person: '中国人名',
      japanese_person: '日本人名（中文表达）',
      western_person: '西方人名（中文表达）',
      location: '地点名',
      skill: '功法名',
      treasure: '法宝名',
      medicine: '灵药名'
    }

    const typeName = nameTypeMap[namingForm.value.nameType]
    let prompt = ''

    // 根据是否为人名类型构建不同的 prompt
    if (isPersonNameType.value) {
      // 构建性别描述
      const genderMap = {
        male: '男性',
        female: '女性'
      }
      const genderDesc = namingForm.value.gender.map(g => genderMap[g]).join('和')
      
      // 计算生成数量：如果选择了两个性别，每个性别生成8个，共16个
      const countPerGender = namingForm.value.gender.length === 2 ? 8 : 12
      const totalCount = countPerGender * namingForm.value.gender.length
      
      prompt = `请生成 ${totalCount} 个${genderDesc}${typeName}。`
      
      if (namingForm.value.gender.length === 2) {
        prompt += `\n请分别生成 ${countPerGender} 个男性名字和 ${countPerGender} 个女性名字。`
      }
      
      // 添加关键字要求
      if (namingForm.value.keyword.trim()) {
        prompt += `\n要求：每个名字中必须包含关键字"${namingForm.value.keyword}"或与之相关的字。`
      }
      
      // 根据不同人名类型添加特殊说明
      if (namingForm.value.nameType === 'japanese_person') {
        prompt += '\n注意：生成日本风格的人名，但使用中文字符，如：山本美智子、佐藤健太郎等。'
      } else if (namingForm.value.nameType === 'western_person') {
        prompt += '\n注意：生成西方风格的人名，但使用中文音译，如：艾米丽·约翰逊、詹姆斯·史密斯等。'
      }
      
      // 添加输入文本作为描述（如果有）
      if (inputText.value.trim()) {
        prompt += `\n\n参考描述：${inputText.value}`
      }
      
      prompt += '\n\n格式：每个名字单独一行，按性别分组显示。'
    } else {
      // 非人名类型
      prompt = `请生成 10-15 个合适的${typeName}。`
      
      // 添加关键字要求
      if (namingForm.value.keyword.trim()) {
        prompt += `\n要求：每个名字中必须包含关键字"${namingForm.value.keyword}"或与之相关的字，富有创意且贴合主题。`
      } else {
        prompt += '\n要求：名字要富有创意且贴合主题。'
      }
      
      // 添加输入文本作为描述（如果有）
      if (inputText.value.trim()) {
        prompt += `\n\n参考描述：${inputText.value}`
      }
      
      prompt += '\n\n格式：每个名字单独一行。'
    }

    const result = await callAI(prompt)
    
    // 检查是否被中断
    if (!aiProcessing.value) {
      return
    }
    
    aiResult.value = result
    namingDialogVisible.value = false
    
    // 保存当前操作信息，用于重新生成
    lastOperation.value = {
      type: 'naming',
      prompt: prompt
    }
    
    // 显示可移动的结果窗口（重新计算位置）
    initFloatingPosition()
    showFloatingResult.value = true
    ElMessage.success('名称生成完成')
  } catch (error) {
    // 如果是用户取消，不显示错误
    if (error.name === 'AbortError' || !aiProcessing.value) {
      return
    }
    ElMessage.error(`生成失败: ${error.message}`)
    console.error('起名失败:', error)
  } finally {
    aiProcessing.value = false
  }
}

// 执行问答
const executeQA = async () => {
  if (!qaForm.value.question.trim()) {
    ElMessage.warning('请输入问题')
    return
  }

  aiProcessing.value = true
  try {
    const prompt = qaForm.value.question

    const result = await callAI(prompt)
    
    // 检查是否被中断
    if (!aiProcessing.value) {
      return
    }
    
    aiResult.value = result
    qaDialogVisible.value = false
    
    // 保存当前操作信息，用于重新生成
    lastOperation.value = {
      type: 'qa',
      prompt: prompt
    }
    
    // 使用浮动窗口显示问答结果
    initFloatingPosition()
    showFloatingResult.value = true
    ElMessage.success('回答完成')
  } catch (error) {
    // 如果是用户取消，不显示错误
    if (error.name === 'AbortError' || !aiProcessing.value) {
      return
    }
    ElMessage.error(`回答失败: ${error.message}`)
    console.error('问答失败:', error)
  } finally {
    aiProcessing.value = false
  }
}

// 结果操作函数
const copyResult = () => {
  if (!aiResult.value) {
    ElMessage.warning('没有可复制的内容')
    return
  }
  
  navigator.clipboard.writeText(aiResult.value).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const insertResult = () => {
  if (!aiResult.value) {
    ElMessage.warning('没有可插入的内容')
    return
  }
  
  if (!editorInstance.value) {
    ElMessage.warning('编辑器未就绪')
    return
  }

  // 在当前光标位置插入内容
  const { state } = editorInstance.value
  const { from } = state.selection
  editorInstance.value.chain().focus().insertContentAt(from, aiResult.value).run()
  
  resultDialogVisible.value = false
  ElMessage.success('已插入到编辑器')
}

// 浮动窗口拖动函数
const startDrag = (e) => {
  // 只响应鼠标左键
  if (e.button !== 0) return
  
  isDragging.value = true
  // 记录鼠标相对于窗口左上角的偏移量
  dragOffset.value = {
    x: e.clientX - floatingPosition.value.x,
    y: e.clientY - floatingPosition.value.y
  }
  
  // 拖动时临时提升层级
  floatingZIndex.value = 1000
  
  // 绑定到 document，确保在整个页面范围内响应
  document.addEventListener('mousemove', onDrag, { passive: false })
  document.addEventListener('mouseup', stopDrag, { once: true })
  
  // 阻止文本选择
  e.preventDefault()
}

const onDrag = (e) => {
  if (!isDragging.value) return
  
  // 使用 requestAnimationFrame 优化性能
  requestAnimationFrame(() => {
    floatingPosition.value = {
      x: e.clientX - dragOffset.value.x,
      y: e.clientY - dragOffset.value.y
    }
  })
  
  e.preventDefault()
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  
  // 拖动结束后恢复默认层级
  floatingZIndex.value = 500
}

// 插入浮动窗口结果到编辑器
const insertFloatingResult = () => {
  if (!aiResult.value) {
    ElMessage.warning('没有可插入的内容')
    return
  }
  
  if (!editorInstance.value) {
    ElMessage.warning('编辑器未就绪')
    return
  }

  // 在当前光标位置插入内容
  const { state } = editorInstance.value
  const { from } = state.selection
  editorInstance.value.chain().focus().insertContentAt(from, aiResult.value).run()
  
  // 不自动关闭窗口，保持置顶状态，方便用户继续查看或多次插入
  // ElMessage.success('已插入到编辑器，窗口保持打开状态')
}

// 关闭浮动窗口
const closeFloatingResult = () => {
  showFloatingResult.value = false
  // 重置状态
  floatingZIndex.value = 500
  isDragging.value = false
}

// 重新生成结果
const regenerateResult = async () => {
  if (!lastOperation.value) {
    ElMessage.warning('没有可重新生成的内容')
    return
  }

  aiProcessing.value = true
  try {
    ElMessage.info('正在重新生成...')
    const result = await callAI(lastOperation.value.prompt)
    aiResult.value = result
    ElMessage.success('重新生成完成')
  } catch (error) {
    ElMessage.error(`重新生成失败: ${error.message}`)
    console.error('重新生成失败:', error)
  } finally {
    aiProcessing.value = false
  }
}
</script>

<style lang="scss" scoped>
.ai-sidebar {
  width: 100%;
  height: 100%;
  background: var(--bg-soft);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 16px;
  box-sizing: border-box;
  overflow-y: auto;

  .model-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-color);

    .model-icon {
      font-size: 18px;
      color: var(--el-color-primary);
    }

    .el-select {
      flex: 1;
    }

    .beta-tag {
      font-size: 12px;
      color: var(--text-secondary);
      background: var(--bg-primary);
      padding: 2px 8px;
      border-radius: 4px;
    }
  }

  .input-section {
    margin-bottom: 24px;

    .section-title {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 12px;
    }

    .input-textarea {
      margin-bottom: 12px;

      :deep(.el-textarea__inner) {
        background: var(--bg-primary);
        border-color: var(--border-color);
        color: var(--text-base);
        font-size: 13px;
      }
    }

    // 按钮组容器
    .button-group {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .chapter-btn,
    .selected-text-btn {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      white-space: nowrap;
    }

    .chapter-btn {
      background: var(--bg-primary);
      border-color: var(--border-color);
      color: var(--text-base);

      &:hover {
        color: var(--el-color-primary);
        border-color: var(--el-color-primary);
      }
    }

    .selected-text-btn {
      // Element Plus 主题色按钮
      animation: fadeIn 0.2s ease-in;
    }
  }

  .ai-operations {
    .section-title {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 12px;
    }

    .operations-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      
      // 当有奇数个操作时，让最后一项占满一行
      .operation-item:last-child:nth-child(odd) {
        grid-column: 1 / -1;
      }

      .operation-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 16px 8px;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        color: var(--text-base);

        &:hover {
          color: var(--el-color-primary);
          border-color: var(--el-color-primary);
          background: var(--bg-soft);
        }

        .el-icon {
          font-size: 24px;
        }

        span {
          font-size: 13px;
          text-align: center;
        }
      }
    }
  }
}

</style>

<!-- 非 scoped 样式用于下拉菜单（Teleport 到 body） -->
<style lang="scss">
/* 模型选项样式 - 覆盖 ElementPlus 的默认 padding */
.el-select-dropdown__item {
  &:has(.model-option) {
    padding: 0 !important;
  }
}

.model-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 20px 0 20px;
  min-height: 34px;

  .model-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-right: 16px;
  }

  .model-actions {
    display: flex;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.2s;
    flex-shrink: 0;

    .el-icon {
      cursor: pointer;
      font-size: 14px;
      color: #606266;
      transition: color 0.2s;
      
      &:hover {
        color: var(--el-color-primary);
      }
    }
  }

  &:hover .model-actions {
    opacity: 1;
  }
}

.add-model-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-color-primary);
  font-weight: 500;
}
</style>

<style lang="scss" scoped>
.model-form {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 10px;

  .provider-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    .provider-name {
      font-weight: 500;
    }

    .provider-ability {
      font-size: 12px;
      color: var(--text-secondary);
      margin-left: auto;
    }
  }

  .provider-desc {
    margin-top: 8px;
    padding: 8px 12px;
    background: var(--el-color-primary-light-9);
    border-left: 3px solid var(--el-color-primary);
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.6;
  }
}

// 淡入动画
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}





// 情绪管理器样式
.emotion-manager {
  .emotion-input {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;

    .el-input {
      flex: 1;
    }
  }

  .emotion-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    max-height: 300px;
    overflow-y: auto;
    padding: 10px;
    background: var(--bg-soft);
    border-radius: 6px;

    .emotion-tag {
      cursor: pointer;
      
      &:hover {
        transform: scale(1.05);
      }
    }
  }
}



// 弹窗内表单样式调整
:deep(.el-dialog) {
  .el-form-item {
    margin-bottom: 20px;
  }

  .el-input-number {
    width: 100%;
  }
}

// 风格选项样式
.style-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
  
  .style-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-base);
  }
  
  .style-desc {
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.4;
  }
}

:deep(.el-select-dropdown__item) {
  height: auto;
  padding: 8px 12px;
  
  &:hover .style-option .style-label {
    color: var(--el-color-primary);
  }
}





// 浮动结果窗口样式
.floating-result-window {
  position: fixed;
  width: 500px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  will-change: transform; // 优化性能

  // 拖动时的样式
  &.is-dragging {
    user-select: none;
    cursor: move !important;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
    
    * {
      cursor: move !important;
      user-select: none;
    }
  }
}

  .floating-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--bg-soft);
    border-bottom: 1px solid var(--border-color);
    cursor: move;
    user-select: none;

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-base);

      .drag-icon {
        color: var(--el-color-primary);
        font-size: 16px;
      }

      .drag-tip {
        font-size: 12px;
        color: var(--text-secondary);
        padding: 2px 6px;
        background: var(--el-color-primary-light-9);
        border-radius: 4px;
        margin-left: 4px;
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;

      .action-icon {
        cursor: pointer;
        font-size: 16px;
        color: var(--text-secondary);
        transition: all 0.2s;

        &:hover {
          color: var(--el-color-primary);
        }

        &.pin-icon.pinned {
          color: var(--el-color-primary);
          transform: rotate(45deg);
        }
      }
    }
  }

  .floating-content {
    padding: 16px;
    flex: 1;
    overflow: hidden;
    background: var(--bg-primary);
    position: relative;

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      z-index: 10;
      color: #fff;
      font-size: 14px;

      .el-icon {
        font-size: 32px;
      }
    }

    .result-textarea {
      :deep(.el-textarea__inner) {
        background: var(--bg-soft);
        border-color: var(--border-color);
        color: var(--text-base);
        font-size: 13px;
        line-height: 1.6;
        resize: none;
      }
    }
  }

  .floating-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 16px;
    background: var(--bg-soft);
    border-top: 1px solid var(--border-color);
  }





</style>
