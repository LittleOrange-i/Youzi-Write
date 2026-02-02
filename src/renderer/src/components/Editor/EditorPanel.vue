<template>
  <div class="editor-panel" :class="{ 'fullscreen-panel': isFullscreenMode }">
    <!-- 菜单栏 -->
    <EditorMenubar
      ref="editorMenubarRef"
      v-model="menubarState"
      :editor="lastFocusedEditor || editor"
      :book-name="bookName"
      @toggle-search="toggleSearchPanel"
      @toggle-fullscreen="toggleFullscreen"
      @save="saveContent"
      @export="handleExport"
      @update-style="handleStyleUpdate"
      @toggle-drawer="() => $emit('toggle-drawer')"
    />
    <!-- 章节标题 - 全屏模式下隐藏 -->
    <div v-if="!isFullscreenMode" class="chapter-title">
      <el-input
        v-model="chapterTitle"
        placeholder="章节标题"
        maxlength="30"
        class="chapter-title-input"
        @blur="handleTitleBlur"
      />
      <!-- 人物高亮开关 -->
      <el-switch
        v-if="editorStore.file?.type === 'chapter'"
        v-model="characterHighlightEnabled"
        active-text="人物"
        inactive-text="人物"
        inline-prompt
        class="character-highlight-switch"
        @change="handleCharacterHighlightChange"
      />

      <!-- 禁词提示开关 -->
      <el-switch
        v-if="editorStore.file?.type === 'chapter'"
        v-model="bannedWordsHintEnabled"
        active-text="禁词"
        inactive-text="禁词"
        inline-prompt
        class="banned-words-hint-switch"
        @change="handleBannedWordsHintChange"
      />

      <!-- 对白高亮开关 -->
      <el-switch
        v-if="editorStore.file?.type === 'chapter'"
        v-model="dialogueHighlightEnabled"
        active-text="对白"
        inactive-text="对白"
        inline-prompt
        class="dialogue-highlight-switch"
        @change="handleDialogueHighlightChange"
      />
      <!-- 段落字数校验按钮 -->
      <el-button
        v-if="editorStore.file?.type === 'chapter'"
        type="soft"
        size="small"
        class="paragraph-check-button"
        @click="checkParagraphLength"
      >
        段落字数
      </el-button>
      
      <!-- 专注模式按钮：专注模式激活时禁用按钮 -->
      <el-button
        v-if="editorStore.file?.type === 'chapter'"
        type="danger"
        size="small"
        class="jail-mode-button"
        style="margin-left: 10px;"
        :disabled="isJailModeActive"
        @click="openJailModeDialog"
      >
        {{ isJailModeActive ? '专注中...' : '专注模式' }}
      </el-button>

      <!-- 更多设置按钮 -->
      <el-button
        v-if="editorStore.file?.type === 'chapter'"
        type="primary"
        size="small"
        style="margin-left: 10px;"
        @click="openMoreSettings"
      >
        更多
      </el-button>
    </div>
    <!-- 正文内容编辑区容器，支持视图切分布局 -->
    <div class="editor-main-area" :class="[`split-${splitMode}`]">
      <!-- 第一个编辑器视图 -->
      <EditorContent 
        class="editor-content first-editor" 
        :editor="editor" 
        @keydown="updateActivity" 
        @mousemove="updateActivity"
        @click="() => { lastFocusedEditor = editor; updateActivity(); updateCursorPosition(); }"
        @contextmenu.prevent="showContextMenu"
      />
      <!-- 切分模式下的分割线 -->
      <div v-if="splitMode !== 'none'" class="split-divider"></div>
      <!-- 第二个编辑器视图容器，增加鼠标移入移出监听以控制章节选择器的显示 -->
      <div 
        v-if="splitMode !== 'none'" 
        class="editor-content-wrapper second-editor-wrapper relative flex flex-col h-full overflow-hidden"
        @mouseleave="startSelectorTimer"
      >
        <!-- 顶部触发区域：鼠标移到此处显示选择器 -->
        <div 
          class="absolute top-0 left-0 right-0 h-4 z-30 cursor-pointer"
          @mouseenter="handleTriggerMouseEnter"
          @mouseleave="startSelectorTimer"
        ></div>

        <!-- 浮动章节选择器：仅在 splitMode 不为 none 且 showEditor2Selector 为 true 时显示 -->
        <Transition name="fade-slide">
          <div 
            v-if="showEditor2Selector"
            class="absolute top-0 left-0 right-0 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-indigo-100 dark:border-indigo-900/30 px-4 py-2 flex items-center gap-3 shadow-md transition-all duration-300"
            @mouseenter="clearSelectorTimer"
            @mouseleave="startSelectorTimer"
          >
            <!-- 章节选择下拉框 -->
            <el-cascader
              v-model="editor2ChapterValue"
              :options="allChaptersOptions"
              placeholder="切换对比章节"
              size="small"
              class="flex-1"
              :props="{ label: 'name', value: 'name', children: 'children' }"
              @change="handleEditor2ChapterChange"
              @visible-change="handleCascaderVisibleChange"
            />
            <!-- 当前章节提示 -->
            <span class="text-xs text-indigo-500 font-medium whitespace-nowrap">
              当前: {{ editor2File?.name || '未选择' }}
            </span>
          </div>
        </Transition>

        <!-- 第二个编辑器视图 -->
        <EditorContent 
          class="editor-content second-editor flex-1" 
          :editor="editor2" 
          @keydown="updateActivity" 
          @mousemove="updateActivity"
          @click="() => { lastFocusedEditor = editor2; updateActivity(); updateCursorPosition(); }"
          @contextmenu.prevent="showContextMenu"
        />
      </div>
    </div>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <!-- 使用 Teleport 将菜单渲染到 body 下，避免层级问题 -->
      <div
        v-if="menuVisible"
        ref="contextMenuRef" 
        class="fixed z-[9999] min-w-[160px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl py-2 animate-in fade-in zoom-in duration-200"
        :style="{ left: menuX + 'px', top: menuY + 'px' }"
        @click.stop
      >
        <!-- 右键菜单容器，使用 ref 获取高度进行位置调整 -->
        <!-- 一键排版菜单项 -->
        <div 
          class="flex items-center gap-3 px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 group"
          @click="handleQuickFormat"
        >
          <el-icon class="text-base text-indigo-500 group-hover:scale-110 transition-transform"><MagicStick /></el-icon>
          <span class="text-sm font-medium">一键排版</span>
        </div>
        
        <!-- 复制全文菜单项 -->
        <div 
          class="flex items-center gap-3 px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 group"
          @click="handleCopyFullText"
        >
          <el-icon class="text-base text-indigo-500 group-hover:scale-110 transition-transform"><CopyDocument /></el-icon>
          <span class="text-sm font-medium">复制全文</span>
        </div>

        <!-- 切分章节菜单项 -->
        <div 
          class="flex items-center gap-3 px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 group"
          @click="handleSplitChapter"
        >
          <el-icon class="text-base text-indigo-500 group-hover:scale-110 transition-transform"><Scissor /></el-icon>
          <span class="text-sm font-medium">切分章节</span>
        </div>

        <!-- 水平切分菜单项 -->
         <div 
           v-if="splitMode === 'none' || splitMode === 'vertical'"
           class="flex items-center gap-3 px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 group"
           @click="handleHorizontalSplit"
         > <!-- 菜单项容器，当处于无切分或垂直切分时显示 -->
           <el-icon class="text-base text-indigo-500 group-hover:scale-110 transition-transform"><Bottom /></el-icon> <!-- 使用向下图标表示水平切分 -->
           <span class="text-sm font-medium">水平切分</span> <!-- 菜单文字 -->
         </div> <!-- 结束水平切分菜单 -->
 
         <!-- 垂直切分菜单项 -->
         <div 
           v-if="splitMode === 'none' || splitMode === 'horizontal'"
           class="flex items-center gap-3 px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 group"
           @click="handleVerticalSplit"
         > <!-- 菜单项容器，当处于无切分或水平切分时显示 -->
           <el-icon class="text-base text-indigo-500 group-hover:scale-110 transition-transform"><Right /></el-icon> <!-- 使用向右图标表示垂直切分 -->
           <span class="text-sm font-medium">垂直切分</span> <!-- 菜单文字 -->
         </div> <!-- 结束垂直切分菜单 -->
 
         <!-- 取消切分菜单项 -->
         <div 
           v-if="splitMode !== 'none'"
           class="flex items-center gap-3 px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 group"
           @click="handleCancelSplit"
         > <!-- 菜单项容器，仅在处于切分状态时显示 -->
           <el-icon class="text-base text-red-500 group-hover:scale-110 transition-transform"><Close /></el-icon> <!-- 使用关闭图标 -->
           <span class="text-sm font-medium text-red-500">取消切分</span> <!-- 红色警告文字 -->
         </div> <!-- 结束取消切分菜单 -->

        <!-- 分隔线 -->
        <div class="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-2"></div>

        <!-- 全选菜单项 -->
        <div 
          class="flex items-center gap-3 px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 group"
          @click="handleSelectAll"
        >
          <el-icon class="text-base text-indigo-500 group-hover:scale-110 transition-transform"><Select /></el-icon>
          <span class="text-sm font-medium">全选</span>
        </div>

        <!-- 查找和替换菜单项 -->
        <div 
          class="flex items-center gap-3 px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 group"
          @click="handleOpenReplace"
        >
          <!-- 查找图标 -->
          <el-icon class="text-base text-indigo-500 group-hover:scale-110 transition-transform"><Search /></el-icon>
          <!-- 菜单文字 -->
          <span class="text-sm font-medium">查找和替换</span>
        </div>

        <!-- 分隔线容器 -->
        <div class="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-2"></div> <!-- 分隔线样式 -->

        <!-- 前往顶部菜单项容器 -->
        <div 
          class="flex items-center gap-3 px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 group" 
          @click="handleGoToTop"
        > <!-- 点击触发前往顶部 -->
          <!-- 置顶图标 -->
          <el-icon 
            class="text-base text-indigo-500 group-hover:scale-110 transition-transform"
          > <!-- 图标样式 -->
            <CaretTop /> <!-- 使用置顶图标 -->
          </el-icon> <!-- 结束图标 -->
          <!-- 菜单文本 -->
          <span 
            class="text-sm font-medium"
          > <!-- 文本样式 -->
            前往顶部 <!-- 文本内容 -->
          </span> <!-- 结束文本 -->
        </div> <!-- 结束顶部菜单项 -->

        <!-- 前往底部菜单项容器 -->
        <div 
          class="flex items-center gap-3 px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 group" 
          @click="handleGoToBottom"
        > <!-- 点击触发前往底部 -->
          <!-- 置底图标 -->
          <el-icon 
            class="text-base text-indigo-500 group-hover:scale-110 transition-transform"
          > <!-- 图标样式 -->
            <CaretBottom /> <!-- 使用置底图标 -->
          </el-icon> <!-- 结束图标 -->
          <!-- 菜单文本 -->
          <span 
            class="text-sm font-medium"
          > <!-- 文本样式 -->
            前往底部 <!-- 文本内容 -->
          </span> <!-- 结束文本 -->
        </div> <!-- 结束底部菜单项 -->
      </div>
    </Teleport>
    <!-- 编辑器内容配置组件（隐藏，仅提供逻辑） -->
    <ChapterEditorContent
      ref="chapterEditorContentRef"
      :editor-store="editorStore"
      :menubar-state="menubarState"
      :is-composing="isComposing"
      :get-font-family="getFontFamily"
      :auto-save-content="autoSaveContent"
    />
    <NoteEditorContent
      ref="noteEditorContentRef"
      :editor-store="editorStore"
      :menubar-state="menubarState"
      :is-composing="isComposing"
      :get-font-family="getFontFamily"
      :auto-save-content="autoSaveContent"
    />
    <!-- 码字进度 - 全屏模式下或切分模式下隐藏 -->
    <EditorProgress
      v-if="!isFullscreenMode && splitMode === 'none' && editorStore.file?.type === 'chapter'"
      :current-words="contentWordCount"
      :target-words="editorStore.chapterTargetWords"
      :book-name="bookName"
    />
    <!-- 编辑器统计 - 全屏模式下或切分模式下隐藏 -->
    <EditorStats
      v-if="!isFullscreenMode && splitMode === 'none' && editorStore.file?.type === 'chapter'"
      ref="editorStatsRef"
      :book-name="bookName"
      :content-word-count="contentWordCount"
      :cursor-position="cursorPosition"
      :file-type="editorStore.file?.type"
      @update-chapter-word-count="(data) => emit('chapter-word-count-updated', data)"
    />

    <!-- 搜索面板 -->
    <SearchPanel ref="searchPanelRef" :visible="searchPanelVisible" :editor="editor" @close="closeSearchPanel" />
    
    <!-- 段落字数校验结果弹窗 -->
    <el-dialog
      v-model="paragraphCheckDialogVisible"
      title="段落字数校验结果"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-if="overLengthParagraphs.length === 0" class="check-result-empty">
        <el-empty description="所有段落字数均符合要求" />
      </div>
      <div v-else class="check-result-list">
        <div class="result-summary">
          共发现 <span class="highlight-number">{{ overLengthParagraphs.length }}</span> 个超标段落
          （阈值：{{ editorStore.paragraphMaxLength }} 字）
        </div>
        <el-scrollbar height="400px">
          <div
            v-for="(item, index) in overLengthParagraphs"
            :key="index"
            class="paragraph-item"
            @click="jumpToParagraph(item)"
          >
            <div class="paragraph-header">
              <span class="paragraph-index">段落 {{ index + 1 }}</span>
              <el-tag v-if="splitMode !== 'none'" size="small" type="info" class="editor-label-tag">
                {{ item.editorLabel }}
              </el-tag>
              <span class="paragraph-length">{{ item.length }} 字</span>
              <span class="over-length">超出 {{ item.length - editorStore.paragraphMaxLength }} 字</span>
            </div>
            <div class="paragraph-preview">{{ item.preview }}</div>
          </div>
        </el-scrollbar>
      </div>
      <template #footer>
        <el-button type="primary" @click="paragraphCheckDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 专注模式设置弹窗 -->
    <el-dialog
      v-model="jailModeDialogVisible"
      title="请谨慎开启本功能"
      width="500px"
      :close-on-click-modal="false"
      class="jail-mode-dialog"
      append-to-body
    >
      <div class="jail-mode-warning" style="margin-bottom: 20px; color: #666; line-height: 1.6;">
        <p style="margin-bottom: 10px;">当开启专注模式后，码字界面将会被锁定，<span style="color: #f56c6c; font-weight: bold;">无法退出码字界面，无法打开电脑其他软件</span>。只有完成设定的字数，或达到设定的时间，才会解除锁定。</p>
        <p>当设定的目标完成后，30秒内将会解锁，只有持续正常创作才会计入任务进度，非正常输入、粘贴、闲置等不被计入任务进度。</p>
      </div>

      <div class="jail-mode-form">
        <div class="form-item" style="margin-bottom: 20px; display: flex; align-items: center;">
          <span class="label" style="width: 80px; font-weight: bold;">专注模式</span>
          <div class="radio-group">
            <el-button 
              :type="jailModeType === 'word' ? 'primary' : 'default'" 
              @click="jailModeType = 'word'"
            >
              字数模式
            </el-button>
            <el-button 
              :type="jailModeType === 'time' ? 'primary' : 'default'" 
              @click="jailModeType = 'time'"
              style="margin-left: 10px;"
            >
              时长模式
            </el-button>
          </div>
        </div>

        <div class="form-item" style="display: flex; align-items: center;">
          <span class="label" style="width: 80px; font-weight: bold;">专注目标</span>
          <el-input 
            v-model="jailTarget" 
            :placeholder="jailModeType === 'word' ? '请输入目标，范围1-20000字' : '请输入目标，范围1-360分钟'"
            type="number"
            style="flex: 1;"
          />
        </div>
      </div>

      <template #footer>
        <div style="text-align: right;">
          <el-button @click="jailModeDialogVisible = false">取消</el-button>
          <el-button type="info" color="#4b4b4b" @click="startJailMode">开始专注</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 专注模式状态浮窗 -->
    <!-- 浮窗已移至 App.vue 中统一管理 -->

    <!-- 更多设置弹窗 -->
    <MoreSettingsDialog
      v-model="moreSettingsDialogVisible"
      :typing-sound-effect="typingSoundEffect"
      :typing-sound-volume="typingSoundVolume"
      @update:typing-sound-effect="handleTypingSoundChange"
      @update:typing-sound-volume="handleVolumeChange"
      @play-preview="handlePlayPreviewSound"
      @apply-formatting="handleApplyFormatting"
    />
  </div>

</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, MagicStick, CopyDocument, Scissor, Select, Search, CaretTop, CaretBottom, Bottom, Right, Close } from '@element-plus/icons-vue' // 导入 Element Plus 图标，增加置顶、置底、切分视图图标
import { EditorContent } from '@tiptap/vue-3' // 导入 Tiptap 编辑器内容组件
import { TextSelection } from 'prosemirror-state' // 导入 Prosemirror 选区状态
import { useEditorStore } from '@renderer/stores/editor' // 导入编辑器 Store
import { useJailStore } from '@renderer/stores/jail' // 导入专注模式 Store
import SearchPanel from '@renderer/components/Editor/SearchPanel.vue' // 导入搜索面板组件
import EditorMenubar from '@renderer/components/Editor/EditorMenubar.vue' // 导入编辑器菜单栏组件
import EditorStats from '@renderer/components/Editor/EditorStats.vue' // 导入编辑器统计组件
import EditorProgress from '@renderer/components/Editor/EditorProgress.vue' // 导入编辑器进度组件
import ChapterEditorContent from '@renderer/components/Editor/ChapterEditorContent.vue' // 导入章节编辑器内容组件
import NoteEditorContent from '@renderer/components/Editor/NoteEditorContent.vue' // 导入笔记编辑器内容组件
import MoreSettingsDialog from '@renderer/components/Editor/MoreSettingsDialog.vue' // 导入更多设置弹窗组件
import { formatText } from '@renderer/utils/formatText' // 导入文本格式化工具函数

// 全局菜单管理器 - 模块级单例，所有组件实例共享
let currentCloseHandler = null // 存储当前显示的菜单的关闭函数

const globalMenuManager = {
  // 设置新的菜单关闭处理器
  setCloseHandler(handler) {
    // 如果已有处理器且不是当前处理器，则先执行旧处理器的关闭逻辑
    if (currentCloseHandler && currentCloseHandler !== handler) {
      currentCloseHandler()
    }
    currentCloseHandler = handler // 更新当前处理器
  },
  // 清除指定的菜单关闭处理器
  clearCloseHandler(handler) {
    // 只清除匹配的处理器，避免误删
    if (currentCloseHandler === handler) {
      currentCloseHandler = null
    }
  }
}

const editorStore = useEditorStore()
const route = useRoute()

// 检查是否需要重置编辑会话（仅当从书架进入时，带有 reset=true 参数）
// 在 setup 中执行，确保早于子组件挂载
if (route.query.reset === 'true') {
  editorStore.resetEditingSession()
}

const props = defineProps({
  bookName: String,
  isFullscreenMode: {
    type: Boolean,
    default: false
  }
})

const isMounted = ref(false)

const emit = defineEmits(['refresh-notes', 'refresh-chapters', 'editor-ready', 'jail-mode-change', 'chapter-word-count-updated', 'toggle-fullscreen', 'toggle-drawer'])

// 默认高亮颜色（当人物没有设置标记颜色时使用）
const defaultHighlightColor = '#e198b8'

// 编辑器实例
const editor = ref(null)
const lastFocusedEditor = ref(null) // 记录最后获得焦点的编辑器实例

// 监听最后聚焦的编辑器变化，同步给父组件，确保 AI 插入等功能指向正确的视图
watch(lastFocusedEditor, (newEditor) => {
  if (newEditor) {
    emit('editor-ready', newEditor) // 触发 editor-ready 事件，通知父组件更新当前活跃的编辑器实例
  }
})

// 右键菜单状态
const menuVisible = ref(false) // 控制右键菜单是否显示
const menuX = ref(0) // 右键菜单的 X 轴坐标
const menuY = ref(0) // 右键菜单的 Y 轴坐标
const contextMenuRef = ref(null) // 右键菜单的 DOM 引用

// 视图切分状态管理
const splitMode = computed({ // 使用计算属性对接 store 中的切分模式，实现跨组件状态持久化
  get: () => editorStore.splitMode, // 获取 store 中的切分状态
  set: (val) => { // 设置 store 中的切分状态
    editorStore.splitMode = val // 同步更新 store
  }
})
const editor2 = ref(null) // 第二个编辑器实例，用于分屏显示
const editor2File = computed({
  get: () => editorStore.editor2File,
  set: (val) => {
    editorStore.editor2File = val
  }
})
const allChaptersOptions = ref([]) // 所有卷和章节的级联选择器选项
const editor2ChapterValue = computed({
  get: () => editorStore.editor2ChapterValue,
  set: (val) => {
    editorStore.editor2ChapterValue = val
  }
})
const showEditor2Selector = ref(false) // 是否显示第二个编辑器的章节选择器
const isCascaderVisible = ref(false) // 级联选择器弹出层是否可见
let selectorTimer = null // 章节选择器的自动隐藏定时器
let editor2SaveTimer = null // 第二个编辑器的自动保存定时器
let isSyncing = false // 全局同步标记，用于在分屏模式下防止两个编辑器之间产生循环同步更新

// 开始计时器，1秒后隐藏选择器
function startSelectorTimer() {
  clearSelectorTimer() // 先清除已有的定时器
  // 如果下拉框正处于展开状态，则不启动隐藏计时器
  if (isCascaderVisible.value) return 
  
  selectorTimer = setTimeout(() => { // 设置 1 秒定时器
    showEditor2Selector.value = false // 隐藏选择器
  }, 500) // 500 毫秒即 0.5 秒
}

// 清除隐藏选择器的计时器
function clearSelectorTimer() {
  if (selectorTimer) { // 如果定时器存在
    clearTimeout(selectorTimer) // 清除定时器
    selectorTimer = null // 设为 null
  }
}

// 处理顶部触发区域的鼠标移入事件
function handleTriggerMouseEnter() {
  showEditor2Selector.value = true // 鼠标移入顶部触发区时显示选择器
  clearSelectorTimer() // 停止自动隐藏计时
}

// 处理级联选择器弹出层可见性变化
function handleCascaderVisibleChange(visible) {
  isCascaderVisible.value = visible // 同步弹出层状态
  if (visible) {
    clearSelectorTimer() // 展开时确保不计时
  } else {
    // 关闭时，如果鼠标不在选择器范围内，则开始计时隐藏
    startSelectorTimer()
  }
}

// 加载所有章节选项，用于级联选择器
async function loadAllChaptersOptions() {
  if (!props.bookName) return // 没书名直接返回
  try {
    const chaptersData = await window.electron.loadChapters(props.bookName) // 获取所有卷和章节
    allChaptersOptions.value = chaptersData || [] // 更新选项数据
  } catch (error) {
    console.error('加载章节选项失败:', error) // 打印错误日志
  }
}

// 处理第二个编辑器切换章节
async function handleEditor2ChapterChange(value) {
  if (!value || value.length < 2) return // 确保选择了章节
  const [volumeName, chapterName] = value // 解构卷名和章节名
  
  try { // 开始异常处理
    // 查找对应的章节对象以获取正确路径
    const volume = allChaptersOptions.value.find((v) => v.name === volumeName) // 在所有章节选项中查找对应卷
    const chapter = volume?.children?.find((c) => c.name === chapterName) // 在卷中查找对应章节
    const correctPath = chapter?.path || `books/${props.bookName}/${volumeName}/${chapterName}.txt` // 获取章节的绝对路径，若未找到则拼接一个路径作为兜底

    // 切换前先尝试保存当前第二个编辑器的内容（如果是独立章节）
    if (editor2.value && editor2File.value && editor2File.value.path !== editorStore.file?.path) {
      await saveEditor2File(false) // 静默保存当前第二个编辑器的内容
    } // 结束保存逻辑

    // 加载目标章节内容
    const result = await window.electron.readChapter(props.bookName, volumeName, chapterName) // 调用后端接口读取章节内容
    if (result.success && editor2.value) { // 如果读取成功且编辑器实例存在
      // 更新第二个编辑器的文件信息
      editor2File.value = { // 设置新的文件对象
        name: chapterName, // 章节名
        volume: volumeName, // 卷名
        type: 'chapter', // 类型为章节
        path: correctPath // 使用查找到的绝对路径，确保与主编辑器路径格式一致
      } // 结束文件信息更新
      
      // 【新增同步逻辑】如果第二个编辑器切换后的章节正好是主编辑器正在编辑的章节
      // 则优先从主编辑器获取可能已被修改但尚未保存到磁盘的内容，实现即时同步
      let contentToSet = result.content // 默认使用从磁盘读取的内容
      if (editor.value && editorStore.file?.path === correctPath) { // 如果主编辑器路径与新路径一致
        contentToSet = chapterEditorContentRef.value.getSaveContent(editor.value) // 从主编辑器提取最新内容
      } // 结束同步内容获取

      // 更新编辑器内容
      chapterEditorContentRef.value.setChapterContent(editor2.value, contentToSet) // 将内容设置到第二个编辑器中
      
      // 提示加载成功
      ElMessage.success(`已切换至章节: ${chapterName}`) // 弹出成功提示
    } else { // 如果读取失败
      ElMessage.error('加载章节内容失败') // 弹出错误提示
    } // 结束读取结果处理
  } catch (error) { // 捕获执行过程中的错误
    console.error('切换章节失败:', error) // 打印错误详情到控制台
    ElMessage.error('切换章节失败') // 弹出通用错误提示
  } // 结束异常处理
} // 结束 handleEditor2ChapterChange 函数

// 第二个编辑器的保存函数
async function saveEditor2File(showMessage = false) {
  if (!editor2.value || !editor2File.value) return false // 没实例或没文件直接返回

  // 如果第二个编辑器显示的内容和主编辑器一致，则由主编辑器的保存逻辑负责
  if (editor2File.value.path === editorStore.file?.path) {
    return true 
  }

  try {
    const contentToSave = chapterEditorContentRef.value.getSaveContent(editor2.value) // 获取编辑器内容
    
    const result = await window.electron.saveChapter({ // 调用保存接口
      bookName: props.bookName,
      volumeName: editor2File.value.volume,
      chapterName: editor2File.value.name,
      content: contentToSave
    })

    if (result.success) { // 保存成功
      if (showMessage) ElMessage.success(`[分屏] 章节 ${editor2File.value.name} 已保存`)
      return true
    } else {
      if (showMessage) ElMessage.error(`[分屏] 保存失败: ${result.message}`)
      return false
    }
  } catch (error) {
    console.error('第二个编辑器保存失败:', error)
    return false
  }
}

// 处理第二个编辑器的内容更新
function handleEditor2Update({ transaction }) {
  // 1. 处理内容同步（如果章节相同）
  syncEditors(editor2.value, editor.value, transaction)
  
  // 2. 如果开启了对白高亮，且内容发生变化，则应用高亮
  if (transaction.docChanged && dialogueHighlightEnabled.value) {
    applyDialogueHighlights()
  }

  // 3. 如果章节不同，则开启自动保存计时器
  if (transaction.docChanged && editor2File.value?.path !== editorStore.file?.path) {
    if (editor2SaveTimer) clearTimeout(editor2SaveTimer) // 清除旧定时器
    editor2SaveTimer = setTimeout(() => { // 设置新定时器，3秒后自动保存
      saveEditor2File(false) // 静默保存
    }, 3000)
  }
}

// 同步两个编辑器内容的通用核心函数
function syncEditors(sourceEditor, targetEditor, transaction) {
  // 核心同步函数：将源编辑器的内容同步到目标编辑器
  // 如果当前正在同步中、目标编辑器尚未初始化、或者本次更新未涉及文档内容改变，则直接跳过
  if (isSyncing || !targetEditor || !transaction?.docChanged) return 
  
  // 关键：只有当两个编辑器显示的章节一致时才同步内容
  // 如果 editor2 显示的是其他参考章节，则禁止同步
  const editor1File = editorStore.file // 获取主编辑器文件
  if (editor1File?.path !== editor2File.value?.path) return // 路径不一致不同步
  
  // 关键修复：如果目标编辑器当前正处于聚焦状态（用户正在其中输入），则不从另一个编辑器同步内容
  // 这可以防止在分屏模式下，后台定时任务（如高亮、统计）触发的同步导致用户正在输入的编辑器光标跳到末尾
  if (targetEditor.isFocused) return // 结束判断
  
  isSyncing = true // 开启同步标记，锁定状态，防止 targetEditor 的更新事件再次触发同步
  const contentComponent = getEditorContentComponent() // 获取当前适用的编辑器内容组件（章节或笔记）
  if (!contentComponent) { // 如果没找到对应的组件
    isSyncing = false // 释放同步锁
    return // 退出函数
  }
  
  const content = contentComponent.getSaveContent(sourceEditor) // 从源编辑器中提取当前最新的内容（HTML或纯文本）
  
  // 优化：检查目标编辑器的当前内容是否已与源内容一致
  // 如果内容已经一致，则无需再次 setContent，这样可以保留目标编辑器的光标和滚动位置
  const targetContent = contentComponent.getSaveContent(targetEditor) // 获取目标编辑器内容
  if (targetContent === content) { // 如果内容完全一致
    isSyncing = false // 释放同步锁
    return // 直接返回，不做冗余更新
  } // 结束优化判断

  const isNote = editorStore.file?.type === 'note' // 判断当前操作的文件是否为笔记类型
  
  if (isNote) { // 如果是笔记模式
    noteEditorContentRef.value.setNoteContent(targetEditor, content) // 使用笔记组件的方法将内容同步到目标编辑器
  } else { // 如果是章节模式
    chapterEditorContentRef.value.setChapterContent(targetEditor, content) // 使用章节组件的方法将内容同步到目标编辑器
  }
  
  // 在内容同步完成后，利用 nextTick 等待 Vue 完成 DOM 更新
  nextTick(() => { // 开启异步回调处理
    if (characterHighlightEnabled.value) applyCharacterHighlights() // 如果开启了人物高亮，则重新扫描并应用高亮标记
    if (bannedWordsHintEnabled.value) applyBannedWordsStrikes() // 如果开启了禁词提示，则重新扫描并应用删除线
    if (dialogueHighlightEnabled.value) applyDialogueHighlights() // 如果开启了对白高亮，则重新扫描并应用对白颜色
    isSyncing = false // 所有副作用处理完毕后，正式释放同步锁，允许下一次同步
  }) // 结束 nextTick 调用
} // 结束 syncEditors 函数定义

// 初始化第二个编辑器
async function initEditor2() {
  if (editor2.value) { // 如果已经存在第二个编辑器
    editor2.value.destroy() // 销毁旧实例
    editor2.value = null // 清空引用
  }

  const editorContentComponent = getEditorContentComponent() // 获取当前编辑器类型组件
  if (!editorContentComponent) return // 如果组件不存在则返回

  editor2.value = editorContentComponent.createEditor() // 创建新的编辑器实例

  // 初始化第二个编辑器的文件信息
  // 优先使用 store 中记录的第二个编辑器的文件信息，实现跨全屏模式的状态保持
  if (editorStore.editor2File) {
    // 已经在 computed setter 中处理了同步，这里直接读取即可
    console.log('[分屏] 恢复第二个编辑器的章节:', editorStore.editor2File.name)
  } else if (editorStore.file) {
    // 如果 store 中没有记录，则默认为当前主编辑器的文件
    editor2File.value = { ...editorStore.file }
    editor2ChapterValue.value = [editorStore.file.volume, editorStore.file.name]
  }

  // 根据当前确定的 editor2File 加载内容
  let currentContent = ''
  if (editor2File.value) {
    if (editor2File.value.path === editorStore.file?.path) {
      // 如果路径一致，直接从主编辑器或 store 获取
      currentContent = editor.value ? getEditorContentComponent().getSaveContent(editor.value) : (editorStore.content || '')
    } else {
      // 如果路径不一致，说明是不同的章节，需要从磁盘读取
      try {
        const result = await window.electron.readChapter(props.bookName, editor2File.value.volume, editor2File.value.name)
        if (result.success) {
          currentContent = result.content
        }
      } catch (error) {
        console.error('[分屏] 恢复第二个编辑器内容失败:', error)
      }
    }
  }

  // 加载书籍所有章节选项，供切换使用
  await loadAllChaptersOptions()

  // 添加焦点监听
  editor2.value.on('focus', () => {
    lastFocusedEditor.value = editor2.value
  })

  // 设置初始内容
  const isNote = editorStore.file?.type === 'note'
  if (isNote) {
    noteEditorContentRef.value.setNoteContent(editor2.value, currentContent)
  } else {
    chapterEditorContentRef.value.setChapterContent(editor2.value, currentContent)
  }

  // 为第二个编辑器绑定基本事件
  editor2.value.on('selectionUpdate', () => { // 监听第二个编辑器的选区更新事件
    updateCursorPosition() // 当选区改变时，同步更新底部的光标位置统计信息
  }) // 结束监听绑定

  // 监听第二个编辑器的内容更新
  editor2.value.on('update', handleEditor2Update) // 使用重构后的处理函数

  await nextTick() // 等待 Vue 完成当前的 DOM 渲染周期
  updateEditorStyle() // 确保第二个编辑器也应用了当前的字体、字号和行高等样式设置
  
  // 初始切分时，为第二个编辑器应用一次高亮效果
  if (characterHighlightEnabled.value) applyCharacterHighlights() // 如果开启了人物高亮，则执行高亮逻辑
  if (bannedWordsHintEnabled.value) applyBannedWordsStrikes() // 如果开启了禁词提示，则执行划线逻辑
  if (dialogueHighlightEnabled.value) applyDialogueHighlights() // 如果开启了对白高亮，则执行染色逻辑
} // 结束 initEditor2 函数定义

// 处理水平切分
async function handleHorizontalSplit() { // 定义异步函数处理水平切分请求
  const isAlreadySplit = splitMode.value !== 'none' // 检查当前是否已经处于某种切分模式（水平或垂直）
  splitMode.value = 'horizontal' // 将切分模式状态更新为水平切分
  hideContextMenu() // 执行完毕后隐藏右键菜单
  
  // 关键逻辑：如果当前已经处于切分模式，则只切换布局，不重新初始化编辑器，从而保留第二个编辑器的内容
  if (!isAlreadySplit) { // 如果之前不是切分模式
    await initEditor2() // 则需要执行完整的第二个编辑器初始化逻辑
  } // 结束判断
} // 结束函数

// 处理垂直切分
async function handleVerticalSplit() { // 定义异步函数处理垂直切分请求
  const isAlreadySplit = splitMode.value !== 'none' // 检查当前是否已经处于某种切分模式（水平或垂直）
  splitMode.value = 'vertical' // 将切分模式状态更新为垂直切分
  hideContextMenu() // 执行完毕后隐藏右键菜单
  
  // 关键逻辑：如果当前已经处于切分模式，则只切换布局，不重新初始化编辑器，从而保留第二个编辑器的内容
  if (!isAlreadySplit) { // 如果之前不是切分模式
    await initEditor2() // 则需要执行完整的第二个编辑器初始化逻辑
  } // 结束判断
} // 结束函数

// 处理取消切分
async function handleCancelSplit() { // 改为异步函数
  // 1. 如果第二个编辑器在编辑不同的章节，先保存
  if (editor2.value && editor2File.value && editor2File.value.path !== editorStore.file?.path) {
    await saveEditor2File(false) // 静默保存
  }

  // 2. 重置切分状态
  splitMode.value = 'none' // 设置切分模式为无
  if (editor2.value) { // 如果第二个编辑器实例存在
    editor2.value.destroy() // 销毁该实例
    editor2.value = null // 清空引用
    editor2File.value = null // 清空文件信息
  } // 结束判断
  hideContextMenu() // 隐藏右键菜单
} // 结束函数

// 显示右键菜单
function showContextMenu(e) {
  e.preventDefault() // 阻止系统默认右键菜单
  e.stopPropagation() // 阻止事件冒泡

  // 通知全局管理器关闭其他菜单
  globalMenuManager.setCloseHandler(hideContextMenu) // 设置当前关闭处理器

  // 初始位置设为鼠标点击位置
  const x = e.clientX // 获取鼠标点击的 X 坐标
  const y = e.clientY // 获取鼠标点击的 Y 坐标
  
  menuX.value = x // 设置菜单初始 X 坐标
  menuY.value = y // 设置菜单初始 Y 坐标
  menuVisible.value = true // 显示菜单

  // 在下个 tick 调整位置，确保菜单已渲染并能获取其尺寸
  nextTick(() => {
    if (contextMenuRef.value) { // 检查菜单 DOM 是否存在
      const menuHeight = contextMenuRef.value.offsetHeight // 获取菜单实际高度
      const menuWidth = contextMenuRef.value.offsetWidth // 获取菜单实际宽度
      
      // 获取编辑器容器的边界，确保菜单不超出编辑器区域
      const editorPanel = document.querySelector('.editor-panel') // 获取编辑器面板元素
      const rect = editorPanel ? editorPanel.getBoundingClientRect() : { bottom: window.innerHeight, right: window.innerWidth } // 获取面板边界或视口边界
      
      // 检查下方空间是否足够，如果不足则向上弹出
      if (y + menuHeight > rect.bottom) { // 如果菜单底部超出边界
        menuY.value = y - menuHeight // 将菜单向上移动一个菜单高度的位置
      }
      
      // 检查右侧空间是否足够，如果不足则向左弹出
      if (x + menuWidth > rect.right) { // 如果菜单右侧超出边界
        menuX.value = x - menuWidth // 将菜单向左移动一个菜单宽度的位置
      }
    }

    document.addEventListener('click', hideContextMenu) // 点击其他地方关闭菜单
    document.addEventListener('contextmenu', hideContextMenu) // 右键其他地方关闭菜单
  })
}

// 隐藏右键菜单
function hideContextMenu() {
  menuVisible.value = false // 隐藏菜单
  document.removeEventListener('click', hideContextMenu) // 移除点击监听
  document.removeEventListener('contextmenu', hideContextMenu) // 移除右键监听
  globalMenuManager.clearCloseHandler(hideContextMenu) // 清除全局关闭处理器
}

// 复制全文
async function handleCopyFullText() {
  if (!editor.value) return // 如果编辑器不存在则返回
  try {
    const text = editor.value.getText() // 获取编辑器纯文本内容
    await navigator.clipboard.writeText(text) // 写入剪贴板
    ElMessage.success('已复制全文到剪贴板') // 提示成功
  } catch (error) {
    console.error('复制失败:', error) // 记录错误日志
    ElMessage.error('复制失败') // 提示失败
  }
  hideContextMenu() // 关闭右键菜单
}

// 全选功能处理函数
function handleSelectAll() {
  const targetEditor = lastFocusedEditor.value || editor.value // 获取目标编辑器
  // 如果编辑器实例不存在，则直接返回
  if (!targetEditor) return 
  // 使用链式调用：先聚焦编辑器，再执行全选命令，最后运行
  targetEditor.chain().focus().selectAll().run() 
  // 执行完毕后隐藏右键菜单
  hideContextMenu() 
}

// 查找和替换
function handleOpenReplace() {
  hideContextMenu() // 关闭右键菜单
  if (!searchPanelVisible.value) { // 如果搜索面板未显示
    searchPanelVisible.value = true // 显示搜索面板
  }
  nextTick(() => {
    searchPanelRef.value?.openReplaceMode() // 切换到替换模式
  })
}

// 前往顶部功能处理函数
function handleGoToTop() {
  hideContextMenu() // 执行完毕后隐藏右键菜单
  const targetEditor = lastFocusedEditor.value || editor.value // 获取目标编辑器
  if (!targetEditor) return // 如果编辑器实例不存在，则直接返回
  targetEditor.commands.focus('start') // 使用 Tiptap 命令将光标聚焦到文档起始位置
  
  // 查找对应的滚动容器
  const editorElement = targetEditor.view.dom
  const scrollContainer = editorElement.closest('.editor-content')
  if (scrollContainer) {
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// 前往底部功能处理函数
function handleGoToBottom() {
  hideContextMenu() // 执行完毕后隐藏右键菜单
  const targetEditor = lastFocusedEditor.value || editor.value // 获取目标编辑器
  if (!targetEditor) return // 如果编辑器实例不存在，则直接返回
  targetEditor.commands.focus('end') // 使用 Tiptap 命令将光标聚焦到文档末尾位置
  
  // 查找对应的滚动容器
  const editorElement = targetEditor.view.dom
  const scrollContainer = editorElement.closest('.editor-content')
  if (scrollContainer) {
    scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' })
  }
}

// 一键排版
function handleQuickFormat() {
  hideContextMenu() // 关闭右键菜单
  handleApplyFormatting() // 调用现有的排版功能
}

// 切分章节
async function handleSplitChapter() {
  hideContextMenu() // 隐藏右键菜单
  
  if (editorStore.file?.type !== 'chapter') { // 只有章节可以进行切分
    ElMessage({ // 提示只能切分章节
      message: '只有章节可以进行切分', // 消息内容
      type: 'warning', // 警告类型
      customClass: 'is-center-screen' // 居中显示
    })
    return
  }

  if (!editor.value) return // 检查编辑器是否存在

  try {
    // 1. 获取当前章节和卷信息
    const currentFile = editorStore.file // 获取当前编辑的文件信息
    const bookName = props.bookName // 获取当前书籍名称
    const volumeName = currentFile.volume // 获取当前所属卷名

    // 2. 获取所有章节，检查当前章节后面是否还有章节
    const chaptersData = await window.electron.loadChapters(bookName) // 加载所有章节数据
    const currentVolume = chaptersData.find(v => v.name === volumeName) // 查找当前卷
    
    if (!currentVolume) {
      ElMessage.error('未找到当前卷信息') // 卷信息不存在时报错
      return
    }

    // 找到当前章节在卷中的位置
    const currentIndex = currentVolume.children.findIndex(c => c.name === currentFile.name) // 查找当前章节索引
    
    if (currentIndex === -1) {
      ElMessage.error('未找到当前章节信息') // 章节信息不存在时报错
      return
    }

    // 检查是否是最后一个章节
    if (currentIndex < currentVolume.children.length - 1) { // 如果索引不是最后一个
      ElMessage({ // 提示不可切分
        message: '后面有章节不可进行切分', // 消息内容
        type: 'warning', // 警告类型
        customClass: 'is-center-screen' // 居中显示
      })
      return
    }

    // 3. 执行切分逻辑
    const targetEditor = lastFocusedEditor.value || editor.value // 获取目标编辑器
    if (!targetEditor) return // 检查编辑器是否存在

    const { state } = targetEditor // 获取编辑器状态
    const { selection } = state // 获取选区
    const pos = selection.from // 获取光标当前位置

    // 获取切分前后的内容
    const docSize = targetEditor.state.doc.content.size // 获取文档总长度
    
    // 如果光标在最前面或最后面，不进行切分
    if (pos <= 1 || pos >= docSize - 1) { // 检查位置是否合法
      ElMessage({ // 提示无法切分
        message: '当前位置无法切分', // 消息内容
        type: 'warning', // 警告类型
        customClass: 'is-center-screen' // 居中显示
      })
      return
    }

    // 弹出确认框
    const confirm = await ElMessageBox.confirm(
      '确定要从当前位置切分章节吗？切分后将自动创建新章节。', // 提示语
      '切分章节', // 标题
      {
        confirmButtonText: '确定', // 确定按钮
        cancelButtonText: '取消', // 取消按钮
        type: 'warning' // 警告类型
      }
    ).catch(() => false) // 捕获取消行为

    if (!confirm) return // 用户取消则退出

    // 获取前后两部分的纯文本内容（章节模式主要存储纯文本）
    const textBefore = targetEditor.state.doc.textBetween(0, pos, '\n') // 获取前半部分文本
    const textAfter = targetEditor.state.doc.textBetween(pos, docSize, '\n') // 获取后半部分文本
    
    // 4. 更新当前章节内容
    // 先更新编辑器内容，确保 saveFile 读取到的是截断后的内容
    chapterEditorContentRef.value.setChapterContent(targetEditor, textBefore) // 更新编辑器内的内容为前半部分
    editorStore.setContent(textBefore) // 同时更新 store 内容
    
    const saveResult = await saveFile(false) // 自动保存当前文件到磁盘
    if (!saveResult) {
      ElMessage.error('保存当前章节失败，无法切分') // 保存失败时报错并返回
      return
    }

    // 5. 创建新章节
    const volumeId = currentVolume.id // 获取卷 ID
    const createResult = await window.electron.createChapter(bookName, volumeId) // 调用后端接口创建新章节
    
    if (createResult.success) { // 如果新章节创建成功
      // 6. 将后半部分保存到新章节
      const newChapterName = createResult.chapterName // 获取新生成的章节名
      const saveNewResult = await window.electron.saveChapter({ // 将后半部分内容保存到新章节
        bookName,
        volumeName,
        chapterName: newChapterName,
        content: textAfter
      })

      if (saveNewResult.success) { // 如果新章节内容保存成功
        ElMessage.success('切分章节成功') // 提示切分成功
        emit('refresh-chapters') // 触发父组件刷新章节列表
      } else {
        ElMessage.error('保存新章节失败') // 新章节保存失败报错
      }
    } else {
      ElMessage.error('创建新章节失败') // 创建新章节接口调用失败报错
    }

  } catch (error) {
    console.error('切分章节失败:', error) // 打印错误详情
    ElMessage.error('切分章节失败') // 提示切分失败
  }
}

  watch(
    () => props.bookName,
    (name) => {
      if (name) {
        editorStore.currentBookName = name
        // 书籍切换时，加载对应书籍的人物高亮开关状态
        loadCharacterHighlightState(name)
        // 书籍切换时，加载对应书籍的禁词提示开关状态
        loadBannedWordsHintState(name)
        // 书籍切换时，加载对应书籍的对白高亮开关状态
        loadDialogueHighlightState(name)
        // 书籍切换时，加载对应书籍的码字音效设置
        loadTypingSoundSettings()
      }
    },
    { immediate: true }
  )

// 计算属性
const contentWordCount = computed(() => editorStore.contentWordCount)

// 光标位置（从文档开头算起的字符数）
const cursorPosition = ref(0)

// 更新光标位置
function updateCursorPosition() {
  const targetEditor = lastFocusedEditor.value || editor.value // 获取目标编辑器
  if (!targetEditor) return
  
  try {
    const { state } = targetEditor
    const { selection } = state
    // 获取光标位置（from 表示选区开始位置）
    const pos = selection.from
    // 计算从文档开头到光标位置的纯文本字符数
    const textBeforeCursor = state.doc.textBetween(0, pos, '') // 获取从文档开头到当前光标位置的所有文本内容
    cursorPosition.value = textBeforeCursor.replace(/[\s\n\r\t]/g, '').length // 过滤掉所有空白字符（如空格、换行、制表符等）后计算长度，确保光标字数统计不包含空白占位
  } catch (error) {
    console.error('更新光标位置失败:', error)
  }
}

// EditorStats 组件引用
const editorStatsRef = ref(null)
const editorMenubarRef = ref(null)

const chapterTitle = computed({
  get: () => editorStore.chapterTitle,
  set: (val) => editorStore.setChapterTitle(val)
})

// 字体映射表：为每种字体提供完整的字体族配置（包含回退字体）
const fontFamilyMap = {
  inherit: '',
  SimSun: "'STSong', 'SimSun', 'NSimSun', '宋体', serif",
  SimHei: "'SimHei', '黑体', 'STHeiti', sans-serif",
  KaiTi: "'STKaiti', 'KaiTi', '楷体', serif",
  FangSong: "'FangSong', '仿宋', 'STFangsong', serif",
  SourceHanSans: "'Noto Sans CJK SC', 'Source Han Sans SC', '思源黑体', 'PingFang SC', sans-serif",
  SourceHanSerif: "'Noto Serif CJK SC', 'Source Han Serif SC', '思源宋体', 'SimSun', serif",
  PingFang: "'PingFang SC', '苹方', 'Hiragino Sans GB', 'STHeiti', sans-serif"
}

// 菜单栏状态
const menubarState = ref({
  fontFamily: 'KaiTi',
  fontSize: '18px',
  lineHeight: '1.6',
  isBold: false,
  isItalic: false
})

let saveTimer = ref(null)
let styleUpdateTimer = null
let isComposing = false // 是否正在进行输入法输入（composition）
let compositionStartHandler = null
let compositionUpdateHandler = null // 输入法更新事件处理器
let compositionEndHandler = null
let keyupHandler = null // keyup 事件处理器
let inputHandler = null // input 事件处理器
let isTitleSaving = false
let lastKeydownPlayedSound = false // 标记上一次 keydown 是否播放了音频

// 编辑器内容组件引用
const chapterEditorContentRef = ref(null)
const noteEditorContentRef = ref(null)

// 人物高亮相关状态
const characterHighlightEnabled = ref(false) // 人物高亮开关状态，默认关闭
const characters = ref([]) // 人物数据列表
let characterHighlightTimer = null // 人物高亮定时器

// 段落字数校验相关状态
const paragraphCheckDialogVisible = ref(false) // 校验结果弹窗显示状态
const overLengthParagraphs = ref([]) // 超标段落列表

// 禁词提示相关状态
const bannedWordsHintEnabled = ref(false) // 禁词提示开关状态，默认关闭
const bannedWords = computed(() => editorStore.bannedWords) // 使用 store 中的禁词列表
let bannedWordsHintTimer = null // 禁词提示定时器

// 对白高亮相关状态
const dialogueHighlightEnabled = ref(false) // 对白高亮开关状态

async function handleTitleBlur() {
  const fileType = editorStore.file?.type
  if (!fileType || (fileType !== 'chapter' && fileType !== 'note')) return
  if (isTitleSaving) return
  try {
    isTitleSaving = true
    await saveFile(false)
  } finally {
    isTitleSaving = false
  }
}

// 搜索面板状态
const searchPanelVisible = ref(false)
const searchPanelRef = ref(null)

// 获取当前编辑器内容组件
function getEditorContentComponent() {
  const isNote = editorStore.file?.type === 'note'
  return isNote ? noteEditorContentRef.value : chapterEditorContentRef.value
}

// 获取完整的字体族配置
function getFontFamily(fontKey) {
  if (fontKey === 'inherit' || !fontKey) {
    return ''
  }
  // 检查是否是自定义字体（以 CustomFont_ 开头）
  if (fontKey.startsWith('CustomFont_')) {
    return `'${fontKey}', sans-serif`
  }
  // 使用预定义的字体映射
  return fontFamilyMap[fontKey] || `'${fontKey}', sans-serif`
}

// 更新编辑器样式
function updateEditorStyle() { // 定义更新编辑器样式的主函数
  const editors = [editor.value, editor2.value].filter(Boolean) // 获取当前页面所有有效的编辑器实例
  const gridSettings = editorStore.editorSettings.gridLines || {} // 从 store 获取网格线条的相关配置
  
  editors.forEach((ed) => { // 遍历每个编辑器实例进行样式应用
    const editorElement = ed.view.dom // 获取编辑器的 DOM 根节点
    if (editorElement) { // 确保 DOM 元素存在
      // 使用 setProperty 并设置 important 优先级，确保样式生效
      const fullFontFamily = getFontFamily(menubarState.value.fontFamily) // 根据配置获取完整的字体名称
      editorElement.style.setProperty('font-family', fullFontFamily, 'important') // 应用字体族样式
      editorElement.style.setProperty('font-size', menubarState.value.fontSize, 'important') // 应用字体大小样式
      editorElement.style.setProperty('line-height', menubarState.value.lineHeight, 'important') // 应用行高样式
      const isChapter = editorStore.file?.type === 'chapter' // 判断当前是否为章节编辑模式
      editorElement.style.setProperty('text-indent', isChapter ? '2em' : '0', 'important') // 章节模式设置首行缩进

      // 应用网格线条样式
      if (gridSettings.enabled) { // 如果用户启用了网格线条功能
        const color = gridSettings.lineColor || '#e0e0e0' // 获取配置的线条颜色，默认为浅灰色
        const thickness = gridSettings.boldSize ? '2px' : '1px' // 根据配置确定线条宽度
        const lineHeight = menubarState.value.lineHeight // 获取当前设置的行高倍数
        const fontSize = parseInt(menubarState.value.fontSize) // 获取当前设置的字号像素值
        const actualLineHeight = fontSize * lineHeight // 计算单行文本占用的实际像素高度
        
        // 计算紧贴底部的偏移量：当行高大于1时，文字在行内居中，需要减去上下多出的空白
        const stickOffset = gridSettings.stickToBottom ? (actualLineHeight - fontSize) / 2 : 0
        
        let backgroundImage = '' // 初始化背景图片字符串
        let backgroundSize = `100% ${actualLineHeight}px` // 初始化背景尺寸为单行高度
        let backgroundPosition = `0 ${-stickOffset}px` // 初始化背景起始位置，如果紧贴底部则向上偏移

        // 使用 SVG 数据链接来实现更精确的网格线条渲染，解决虚线和双线在不同缩放下的显示问题
        const encodedColor = encodeURIComponent(color) // 对颜色进行转义，确保在数据链接中可用
        const thicknessInt = parseInt(thickness) // 获取线条宽度的整数值
        
        if (gridSettings.lineType === 'single-solid') { // 处理单实线类型
          // 渲染单行实线：宽度为1（水平重复后成线），高度为行高，线条在 SVG 顶部
          backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='${actualLineHeight}'%3E%3Crect x='0' y='0' width='1' height='${thicknessInt}' fill='${encodedColor}'/%3E%3C/svg%3E")`
          backgroundSize = `100% ${actualLineHeight}px` // 背景尺寸设为行高以实现垂直重复
          backgroundPosition = `0 ${actualLineHeight - stickOffset - thicknessInt}px` // 将线条位置对齐到文本底部
        } else if (gridSettings.lineType === 'double-solid') { // 处理双实线类型
          // 渲染双行实线：第一行作为基准线对齐底部，第二行在其下方 3px 处，确保第一行不超标
          backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='${actualLineHeight}'%3E%3Crect x='0' y='0' width='1' height='${thicknessInt}' fill='${encodedColor}'/%3E%3Crect x='0' y='3' width='1' height='${thicknessInt}' fill='${encodedColor}'/%3E%3C/svg%3E")`
          backgroundSize = `100% ${actualLineHeight}px` // 背景尺寸设为行高
          backgroundPosition = `0 ${actualLineHeight - stickOffset - thicknessInt}px` // 以第一条线为基准对齐文本底部
        } else if (gridSettings.lineType === 'sparse-dashed' || gridSettings.lineType === 'dense-dashed') { // 处理虚线类型
          const dashLen = gridSettings.lineType === 'sparse-dashed' ? 8 : 4 // 根据类型确定虚线段的长度（稀疏8px，密集4px）
          // 渲染水平虚线：宽度为周期长度（dashLen * 2），实线部分长为 dashLen
          backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${dashLen * 2}' height='${actualLineHeight}'%3E%3Crect x='0' y='0' width='${dashLen}' height='${thicknessInt}' fill='${encodedColor}'/%3E%3C/svg%3E")`
          backgroundSize = `${dashLen * 2}px ${actualLineHeight}px` // 背景宽度设为周期长度以实现水平虚线
          backgroundPosition = `0 ${actualLineHeight - stickOffset - thicknessInt}px` // 将虚线对齐到文本底部
        } // 结束线条类型判断

        editorElement.style.setProperty('background-image', backgroundImage, 'important') // 应用生成的背景图样式
        editorElement.style.setProperty('background-size', backgroundSize, 'important') // 应用背景尺寸样式
        editorElement.style.setProperty('background-position', backgroundPosition, 'important') // 应用背景位置样式
        editorElement.style.setProperty('background-repeat', 'repeat', 'important') // 设置背景在水平和垂直方向重复
        editorElement.style.setProperty('background-attachment', 'local', 'important') // 设置背景随内容滚动
      } else { // 如果用户禁用了网格线条功能
        // 禁用时清除样式
        editorElement.style.removeProperty('background-image') // 移除背景图属性
        editorElement.style.removeProperty('background-size') // 移除背景尺寸属性
        editorElement.style.removeProperty('background-position') // 移除背景位置属性
        editorElement.style.removeProperty('background-repeat') // 移除背景重复属性
        editorElement.style.removeProperty('background-attachment') // 移除背景附着属性
      } // 结束启用状态处理
    } // 结束 DOM 元素有效性判断
  }) // 结束编辑器实例遍历
} // 结束 updateEditorStyle 函数定义

// 处理样式更新
function handleStyleUpdate() {
  updateEditorStyle()
  // 防抖保存设置
  if (styleUpdateTimer) clearTimeout(styleUpdateTimer)
  styleUpdateTimer = setTimeout(() => {
    editorStore.saveEditorSettings({
      fontFamily: menubarState.value.fontFamily,
      fontSize: menubarState.value.fontSize,
      lineHeight: menubarState.value.lineHeight,
      globalBoldMode: menubarState.value.isBold,
      globalItalicMode: menubarState.value.isItalic
    })
  }, 500)
}

// 处理导出事件
function handleExport() {
  // 导出功能已在 EditorMenubar 组件中实现，这里只需要处理事件
}

// 监听网格线条设置变化
watch( // 开启监听
  () => editorStore.editorSettings.gridLines, // 监听 store 中的网格线条配置
  () => { // 配置变化时的回调
    updateEditorStyle() // 重新应用编辑器样式
  }, // 结束回调
  { deep: true } // 开启深度监听
) // 结束监听定义

// 监听 store 内容变化，回显到编辑器
watch( // 开启监听
  () => editorStore.file, // 监听 store 中的文件对象
  async (newFile, oldFile) => { // 异步回调处理
    // 如果编辑器不存在且新文件存在，初始化编辑器
    if (!editor.value && newFile) { // 如果主编辑器未初始化但有新文件
      try { // 开启异常处理
        await initEditor() // 执行初始化
        await nextTick() // 等待 DOM 更新
        setupCompositionHandlers() // 设置输入法处理器
        // 如果是章节编辑器，等待内容渲染完成后加载状态并应用高亮/划线
        if (newFile?.type === 'chapter' && props.bookName) { // 如果是章节类型
          await nextTick() // 再次等待
          await nextTick() // 再次等待，确保 TipTap 准备好
          await new Promise((resolve) => setTimeout(resolve, 50)) // 延迟 50ms 确保稳定
          await loadCharacterHighlightState(props.bookName) // 加载人物高亮
          await loadBannedWordsHintState(props.bookName) // 加载禁词提示
          await loadDialogueHighlightState(props.bookName) // 加载对白高亮
        } // 结束章节处理
        return // 初始化完成，直接返回
      } catch (error) { // 捕获错误
        console.error('初始化编辑器失败:', error) // 打印错误
        return // 退出
      } // 结束异常处理
    } // 结束初始化逻辑

    if (!newFile) return // 如果没有新文件，直接返回

    // 如果文件类型发生变化，需要重新初始化编辑器
    const fileTypeChanged = newFile?.type !== oldFile?.type // 判断类型是否改变

    if (fileTypeChanged && editor.value) { // 如果类型改变且编辑器已存在
      try { // 开启异常处理
        // 销毁旧编辑器
        editor.value.destroy() // 销毁实例
        editor.value = null // 清空引用
        // 等待一下确保完全销毁
        await nextTick() // 等待 DOM 回收
        // 重新初始化编辑器（initEditor 内部会设置内容）
        await initEditor() // 重新初始化
        // 等待编辑器完全初始化
        await nextTick() // 等待更新
        setupCompositionHandlers() // 重新设置输入法处理器
        // 如果是章节编辑器，等待内容渲染完成后加载状态并应用高亮/划线
        if (newFile?.type === 'chapter' && props.bookName) { // 如果是章节类型
          await nextTick() // 等待
          await nextTick() // 再次等待
          await new Promise((resolve) => setTimeout(resolve, 50)) // 延迟
          await loadCharacterHighlightState(props.bookName) // 加载人物高亮
          await loadBannedWordsHintState(props.bookName) // 加载禁词提示
          await loadDialogueHighlightState(props.bookName) // 加载对白高亮
        } // 结束章节处理
        return // 重新初始化完成
      } catch (error) { // 捕获错误
        console.error('重新初始化编辑器失败:', error) // 打印错误
        // 出错时尝试恢复编辑器
        if (oldFile) { // 如果有旧文件
          try { // 尝试恢复
            await initEditor() // 执行初始化
          } catch (retryError) { // 恢复失败
            console.error('恢复编辑器失败:', retryError) // 打印恢复错误
          } // 结束恢复尝试
        } // 结束判断
        return // 退出
      } // 结束异常处理
    } // 结束类型变化处理

    // 只有在文件路径变化且编辑器已存在时才设置内容
    if (editor.value && newFile?.path !== oldFile?.path) { // 如果路径变化
      // 文件变化时，先开始编辑会话（设置初始化标志），再设置内容
      let newContent = editorStore.content || '' // 默认从 store 获取内容
      const isNote = newFile?.type === 'note' // 判断是否为笔记

      // 【关键修复】如果主编辑器新选择的章节正好是第二个编辑器正在编辑的章节
      // 则优先从第二个编辑器获取可能已被修改的内容，而不是从 store/磁盘读取旧内容
      if (editor2.value && editor2File.value?.path === newFile?.path) { // 如果第二个编辑器存在且路径匹配
        isSyncing = true // 开启同步锁，防止触发冗余更新
        newContent = chapterEditorContentRef.value.getSaveContent(editor2.value) // 从第二个编辑器提取最新内容
        // 更新 store，确保字数统计和主编辑器状态同步
        editorStore.setContent(newContent) // 同步 store 中的内容
      } // 结束路径匹配逻辑

      // 先开始编辑会话，设置 isInitializing = true，避免加载已有内容时被计入码字速度
      editorStore.startEditingSession(newContent) // 开始编辑会话

      // 根据文件类型使用对应的内容设置方法
      if (isNote) { // 如果是笔记模式
        noteEditorContentRef.value.setNoteContent(editor.value, newContent) // 设置笔记内容
      } else { // 如果是章节模式
        chapterEditorContentRef.value.setChapterContent(editor.value, newContent) // 设置章节内容
      } // 结束内容设置

      // 释放同步锁
      if (isSyncing) { // 如果开启了锁
        nextTick(() => { // 在下个渲染周期
          isSyncing = false // 释放锁
        }) // 结束异步操作
      } // 结束同步锁释放

      // 更新样式
      updateEditorStyle() // 刷新编辑器样式

      // 如果开启了人物高亮，重新应用高亮
      if (characterHighlightEnabled.value && !isNote) { // 如果开启了人物高亮且非笔记
        nextTick(() => { // 等待渲染
          loadCharacters().then(() => { // 加载人物数据
            applyCharacterHighlights() // 应用高亮
            // 确保定时器在运行
            if (!characterHighlightTimer) { // 如果定时器未启动
              startCharacterHighlightTimer() // 启动定时器
            } // 结束判断
          }) // 结束异步加载
        }) // 结束 nextTick
      } // 结束人物高亮应用

      // 如果开启了禁词提示，重新应用划线
      if (bannedWordsHintEnabled.value && !isNote) { // 如果开启了禁词提示且非笔记
        nextTick(() => { // 等待渲染
          loadBannedWords().then(() => { // 加载禁词数据
            applyBannedWordsStrikes() // 应用删除线
            // 确保定时器在运行
            if (!bannedWordsHintTimer) { // 如果定时器未启动
              startBannedWordsHintTimer() // 启动定时器
            } // 结束判断
          }) // 结束异步加载
        }) // 结束 nextTick
      } // 结束禁词提示应用

      // 如果全局格式模式开启，应用到新内容
      nextTick(() => { // 异步处理格式
        if (!editor.value) return // 校验实例
        const docSize = editor.value.state.doc.content.size // 获取内容长度
        if (docSize === 0) return // 内容为空跳过

        if (menubarState.value.isBold || menubarState.value.isItalic) { // 如果开启了加粗或倾斜
          setTimeout(() => { // 延迟应用
            if (!editor.value) return // 校验实例
            const currentDocSize = editor.value.state.doc.content.size // 再次校验长度
            if (currentDocSize === 0) return // 为空跳过

            let chain = editor.value.chain().focus().selectAll() // 开启命令链并全选
            if (menubarState.value.isBold) { // 处理加粗
              chain = chain.setBold() // 应用加粗
            } // 结束加粗处理
            if (menubarState.value.isItalic) { // 处理倾斜
              chain = chain.setItalic() // 应用倾斜
            } // 结束倾斜处理
            chain.run() // 执行命令链

            // 恢复光标到末尾
            if (currentDocSize > 0) { // 如果有内容
              editor.value.chain().focus().setTextSelection(currentDocSize).run() // 聚焦到末尾
            } // 结束光标恢复
          }, 100) // 结束延迟
        } // 结束格式处理
      }) // 结束格式异步
    } // 结束路径变化逻辑
  } // 结束 watch 回调
) // 结束 watch 监听

// 获取当前选中的文本
function getSelectedText() {
  if (!editor.value) return ''
  const { state } = editor.value
  const { from, to } = state.selection
  if (from === to) return '' // 没有选中文本
  return state.doc.textBetween(from, to, ' ')
}

// 键盘快捷键处理
function handleKeydown(event) {
  // 如果按下 Esc 键且当前处于全屏模式，则触发退出全屏
  if (event.key === 'Escape' && props.isFullscreenMode) {
    event.preventDefault() // 防止 Esc 键的默认行为
    event.stopPropagation() // 防止冒泡到 Editor.vue 的全局监听器，避免重复处理
    console.log('[编辑器面板] 检测到 Esc 键，退出全屏模式')
    emit('toggle-fullscreen', false) // 明确通知父组件退出全屏模式
    return
  }

  // Cmd/Ctrl + F: 打开搜索面板
  if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
    event.preventDefault()
    
    const selectedText = getSelectedText()
    
    if (!searchPanelVisible.value) {
      searchPanelVisible.value = true
    }
    
    if (selectedText) {
      nextTick(() => {
        searchPanelRef.value?.setSearchText(selectedText)
      })
    }
  }

  // Cmd/Ctrl + H: 打开替换面板
  if ((event.metaKey || event.ctrlKey) && event.key === 'h') {
    event.preventDefault()
    
    const selectedText = getSelectedText()
    
    if (!searchPanelVisible.value) {
      searchPanelVisible.value = true
    }
    // 等待面板显示后切换到替换模式
    nextTick(() => {
      searchPanelRef.value?.openReplaceMode()
      if (selectedText) {
        searchPanelRef.value?.setSearchText(selectedText)
      }
    })
  }

  // Cmd/Ctrl + S: 保存内容
  if ((event.metaKey || event.ctrlKey) && event.key === 's') {
    event.preventDefault()
    saveContent()
  }
}

// 窗口关闭前保存设置
function handleWindowClose() {
  // 清除定时器
  if (saveTimer.value) clearTimeout(saveTimer.value)
  if (styleUpdateTimer) clearTimeout(styleUpdateTimer)

  // 同步保存编辑器设置（窗口关闭时无法使用 async/await）
  editorStore
    .saveEditorSettings({
      fontFamily: menubarState.value.fontFamily,
      fontSize: menubarState.value.fontSize,
      lineHeight: menubarState.value.lineHeight,
      globalBoldMode: menubarState.value.isBold,
      globalItalicMode: menubarState.value.isItalic
    })
    .catch((error) => {
      console.error('保存编辑器设置失败:', error)
    })

  // 保存最后的内容
  autoSaveContent().catch((error) => {
    console.error('自动保存失败:', error)
  })
}

// 初始化编辑器的函数
async function initEditor() {
  if (editor.value) {
    // 如果编辑器已存在，先销毁
    editor.value.destroy()
    editor.value = null
  }

  // 加载编辑器设置
  await editorStore.loadEditorSettings()

  // 应用加载的设置
  if (editorStore.editorSettings) {
    const settings = editorStore.editorSettings
    // 只在值为 undefined 或 null 时才使用默认值，避免覆盖空字符串等有效值
    menubarState.value = {
      fontFamily:
        settings.fontFamily !== undefined && settings.fontFamily !== null
          ? settings.fontFamily
          : 'KaiTi',
      fontSize:
        settings.fontSize !== undefined && settings.fontSize !== null ? settings.fontSize : '16px',
      lineHeight:
        settings.lineHeight !== undefined && settings.lineHeight !== null
          ? settings.lineHeight
          : '1.6',
      isBold: settings.globalBoldMode !== undefined ? settings.globalBoldMode : false,
      isItalic: settings.globalItalicMode !== undefined ? settings.globalItalicMode : false
    }
  }

  // 获取对应的编辑器内容组件
  const editorContentComponent = getEditorContentComponent()
  if (!editorContentComponent) {
    console.error('编辑器内容组件未找到')
    return
  }

  // 使用组件提供的方法创建编辑器
  editor.value = editorContentComponent.createEditor()
  lastFocusedEditor.value = editor.value // 默认设置为主编辑器

  // 添加焦点监听
  editor.value.on('focus', () => {
    lastFocusedEditor.value = editor.value
  })

  // 添加光标位置变化监听
  editor.value.on('selectionUpdate', () => {
    updateCursorPosition()
  })
  
  // 添加内容更新监听
  editor.value.on('update', ({ transaction }) => { // 监听主编辑器内容更新事件
    updateCursorPosition() // 更新光标位置统计信息
    if (transaction.docChanged && dialogueHighlightEnabled.value) { // 如果内容发生变化且开启了对白高亮
      applyDialogueHighlights() // 实时应用对白染色逻辑
    } // 结束判断
    // 将变更同步到第二个编辑器（如果存在）
    syncEditors(editor.value, editor2.value, transaction) // 调用核心同步函数执行单向同步
  }) // 结束监听绑定

  // 设置初始内容
  const initialContent = editorStore.content || ''

  // 如果有初始内容，先开始编辑会话（设置初始化标志），再设置内容
  // 修改判断条件，确保空章节也能正确触发会话开始，从而清除初始化状态
  if (initialContent !== undefined && initialContent !== null) {
    editorStore.startEditingSession(initialContent)
  }

  if (editorStore.file?.name) {
    editorStore.setChapterTitle(editorStore.file.name)
  }

  // 根据文件类型使用对应的内容设置方法
  const isNote = editorStore.file?.type === 'note'
  if (isNote) {
    noteEditorContentRef.value.setNoteContent(editor.value, initialContent)
  } else {
    chapterEditorContentRef.value.setChapterContent(editor.value, initialContent)
  }

  // 等待DOM渲染完成后应用样式
  await nextTick()
  updateEditorStyle()

  // 通知父组件编辑器已就绪，使用当前聚焦的编辑器
  emit('editor-ready', lastFocusedEditor.value || editor.value)

  // 恢复切分视图状态：如果 store 中记录了切分模式，则自动初始化第二个编辑器
  if (splitMode.value !== 'none') { // 判断是否处于切分模式
    await initEditor2() // 异步执行第二个编辑器的初始化
  } // 结束切分视图恢复

  // 如果加载了加粗或倾斜状态，应用到所有内容
  if (menubarState.value.isBold || menubarState.value.isItalic) {
    if (initialContent) {
      // 等待编辑器完全初始化后再应用格式
      await nextTick()

      // 给编辑器更多时间来渲染内容
      setTimeout(() => {
        if (!editor.value) return

        // 确保有内容再应用格式
        const docSize = editor.value.state.doc.content.size
        if (docSize === 0) return

        // 保存当前选择位置
        const currentFrom = editor.value.state.selection.from
        const currentTo = editor.value.state.selection.to

        // 在同一个命令链中选择所有内容并应用格式
        let chain = editor.value.chain().focus().selectAll()

        if (menubarState.value.isBold) {
          chain = chain.setBold()
        }
        if (menubarState.value.isItalic) {
          chain = chain.setItalic()
        }

        chain.run()

        // 恢复之前的选择位置（如果有的话）
        if (docSize > 0) {
          const newFrom = Math.min(currentFrom, docSize - 1)
          const newTo = Math.min(currentTo, docSize - 1)
          editor.value.chain().focus().setTextSelection({ from: newFrom, to: newTo }).run()
        }
      }, 100)
    }
  }

  // 注意：startEditingSession 已经在上面调用过了，这里不需要重复调用

  // 设置输入法事件监听器
  setupCompositionHandlers()
}

// 设置输入法事件监听器的函数
function setupCompositionHandlers() {
  if (!editor.value || !editor.value.view || !editor.value.view.dom) return

  const editorElement = editor.value.view.dom

  // 先移除旧的监听器（如果存在）
  if (compositionStartHandler) {
    editorElement.removeEventListener('compositionstart', compositionStartHandler)
  }
  if (compositionUpdateHandler) {
    editorElement.removeEventListener('compositionupdate', compositionUpdateHandler)
  }
  if (compositionEndHandler) {
    editorElement.removeEventListener('compositionend', compositionEndHandler)
  }
  if (keyupHandler) {
    editorElement.removeEventListener('keyup', keyupHandler)
  }
  if (inputHandler) {
    editorElement.removeEventListener('input', inputHandler)
  }

  // compositionstart: 开始输入法输入
  compositionStartHandler = (e) => {
    isComposing = true
    inputCompositionText.value = e.data || ''
    // 记录事件日志
    addKeyboardEvent('compositionstart', e.data || '', '', e.data)
  }
  editorElement.addEventListener('compositionstart', compositionStartHandler)

  // compositionupdate: 输入法更新（正在输入拼音或选择候选词）
  compositionUpdateHandler = (e) => {
    inputCompositionText.value = e.data || ''
    // 记录事件日志
    addKeyboardEvent('compositionupdate', e.data || '', '', e.data)
  }
  editorElement.addEventListener('compositionupdate', compositionUpdateHandler)

  // compositionend: 输入法确认（回车或选择）
  compositionEndHandler = (e) => {
    isComposing = false
    inputCompositionText.value = ''
    // 记录事件日志
    addKeyboardEvent('compositionend', e.data || '', '', e.data)
    
    // 输入法确认后，立即更新字数统计
    if (editor.value) {
      const content = editor.value.getText()
      editorStore.setContent(content)
    }
  }
  editorElement.addEventListener('compositionend', compositionEndHandler)
  
  // 添加键盘事件监听器，用于播放码字音效和记录日志
  editorElement.addEventListener('keydown', handleEditorKeydown)
  
  // keyup: 按键抬起事件
  keyupHandler = (e) => {
    currentPressedKey.value = null
    
    // 记录事件日志（无条件记录）
    addKeyboardEvent('keyup', e.key, e.code)
    
    // 在 keyup 时播放音频（仅当 keydown 时没有播放）
    // 这样可以确保中文输入法模式下也能播放音频
    // 因为中文输入法下 keydown 时 isComposing=true，不会播放音频
    if (!lastKeydownPlayedSound && typingSoundEffect.value && isKeyAllowedToPlaySound(e.key)) {
      console.log('🎵 [keyup] 播放音频:', e.key)
      playTypingSound(e.key)
    }
    
    // 重置标志
    lastKeydownPlayedSound = false
  }
  editorElement.addEventListener('keyup', keyupHandler)

  // input: 输入事件
  inputHandler = (e) => {
    // 只在非输入法状态下记录
    if (!isComposing && e.data) {
      addKeyboardEvent('input', e.data, '', e.data)
    }
  }
  editorElement.addEventListener('input', inputHandler)
}

onMounted(async () => {
  isMounted.value = true
  
  // 书籍总字数由 EditorStats 组件通过 watch fileType 自动加载

  editorStore.registerExternalSaveHandler(saveFile)
  
  // 加载码字音效设置并预加载音效文件
  if (props.bookName) {
    await loadTypingSoundSettings()
    // 如果已设置音效，立即预加载到内存（仅加载一次）
    if (typingSoundEffect.value) {
      await preloadSoundFiles(typingSoundEffect.value)
    }
  }

  // 延迟初始化编辑器，等待文件加载完成
  // 如果 file 已经存在，立即初始化；否则等待 file 变化后再初始化
  if (editorStore.file) {
    await initEditor()
    await nextTick()
    setupCompositionHandlers()

    // 等待编辑器内容完全渲染后再加载状态并应用高亮/划线
    // 确保内容已经设置完成，特别是对于章节编辑器
    if (editorStore.file?.type === 'chapter') {
      // 多等待几个 tick，确保内容已经渲染到 DOM
      await nextTick()
      await nextTick()
      // 额外等待一小段时间，确保 TipTap 编辑器内容已经完全渲染
      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    // 在编辑器初始化完成后，加载当前书籍的人物高亮、段落字数校验和禁词提示开关状态
    // 这样各个 load 函数中的自动应用逻辑才能正常工作
    if (editorStore.file && editor.value && editorStore.file?.type === 'chapter') {
      await loadCharacterHighlightState(props.bookName)
      await loadBannedWordsHintState(props.bookName)
    }
  }
  // 如果 file 不存在，watch 会在文件加载后触发初始化

  // 添加键盘事件监听器
  document.addEventListener('keydown', handleKeydown)

  // 监听窗口关闭事件，确保设置被保存
  window.addEventListener('beforeunload', handleWindowClose)
})

onBeforeUnmount(async () => {
  editorStore.registerExternalSaveHandler(null)
  // 移除窗口关闭监听器
  window.removeEventListener('beforeunload', handleWindowClose)

  // 专注模式清理
  // if (isJailModeActive.value) {
  //   await window.electron.disableJailMode()
  // }
  // if (jailTimer) clearInterval(jailTimer)

  // 移除输入法事件监听器
  if (editor.value && editor.value.view && editor.value.view.dom) {
    const editorElement = editor.value.view.dom
    if (compositionStartHandler) {
      editorElement.removeEventListener('compositionstart', compositionStartHandler)
    }
    if (compositionUpdateHandler) {
      editorElement.removeEventListener('compositionupdate', compositionUpdateHandler)
    }
    if (compositionEndHandler) {
      editorElement.removeEventListener('compositionend', compositionEndHandler)
    }
    if (keyupHandler) {
      editorElement.removeEventListener('keyup', keyupHandler)
    }
    if (inputHandler) {
      editorElement.removeEventListener('input', inputHandler)
    }
    // 移除键盘事件监听器
    editorElement.removeEventListener('keydown', handleEditorKeydown)
  }

  // 停止人物高亮定时器
  stopCharacterHighlightTimer()

  // 停止禁词提示定时器
  stopBannedWordsHintTimer()

  if (saveTimer.value) clearTimeout(saveTimer.value)
  if (styleUpdateTimer) clearTimeout(styleUpdateTimer)

  // 保存编辑器设置
  await editorStore.saveEditorSettings({
    fontFamily: menubarState.value.fontFamily,
    fontSize: menubarState.value.fontSize,
    lineHeight: menubarState.value.lineHeight,
    globalBoldMode: menubarState.value.isBold,
    globalItalicMode: menubarState.value.isItalic
  })

  // 保存最后的内容
  await autoSaveContent()

  // 移除键盘事件监听器
  document.removeEventListener('keydown', handleKeydown)

  // 销毁编辑器
  editor.value && editor.value.destroy()
  editor2.value && editor2.value.destroy() // 销毁第二个编辑器实例
})

// 保存内容的通用函数
async function saveFile(showMessage = false) {
  const file = editorStore.file
  if (!file) {
    if (showMessage) ElMessage.warning('未选择章节或笔记')
    return false
  }

  // 根据文件类型使用对应的内容获取方法
  const isNote = file.type === 'note'
  let contentToSave = editorStore.content

  if (editor.value) {
    const editorContentComponent = getEditorContentComponent()
    if (editorContentComponent) {
      contentToSave = editorContentComponent.getSaveContent(editor.value)
      // 更新 store 中的纯文本内容用于字数统计
      if (isNote) {
        const textContent = noteEditorContentRef.value.htmlToPlainText(contentToSave)
        editorStore.setContent(textContent)
      } else {
        editorStore.setContent(contentToSave)
      }
    }
  }

  const saveParams = {
    bookName: props.bookName,
    newName: editorStore.chapterTitle,
    content: contentToSave
  }

  let result
  if (file.type === 'note') {
    result = await window.electron.editNote({
      ...saveParams,
      notebookName: file.notebook,
      noteName: file.name
    })
    if (showMessage && result.success) emit('refresh-notes')
  } else if (file.type === 'chapter') {
    result = await window.electron.saveChapter({
      ...saveParams,
      volumeName: file.volume,
      chapterName: file.name
    })
    if (showMessage && result.success) {
      emit('refresh-chapters')
      // 保存成功后，重新加载书籍总字数（确保与服务器同步）
      if (editorStatsRef.value) {
        await editorStatsRef.value.loadBookTotalWords(true)
      }
    }
  }

  if (result?.success) {
    // 每次保存成功都更新字数（包括自动保存）
    if (file.type === 'chapter' && typeof result.wordCount === 'number') {
      emit('chapter-word-count-updated', { path: file.path, wordCount: result.wordCount })
    }

    // 如果处于切分模式，且第二个编辑器正在编辑不同的章节，也需要执行保存逻辑
    if (splitMode.value !== 'none' && editor2.value && editor2File.value) {
      if (editor2File.value.path !== file.path) {
        // 静默保存第二个编辑器的内容
        await saveEditor2File(false)
      }
    }

    if (result.name && result.name !== file.name) {
      editorStore.setFile({ ...file, name: result.name })
      if (file.type === 'note') {
        emit('refresh-notes')
      } else if (file.type === 'chapter') {
        emit('refresh-chapters')
      }
    }
    // if (showMessage) ElMessage.success('保存成功')
    return true
  } else {
    if (showMessage) ElMessage.error(result?.message || '保存失败')
    else ElMessage.error(result?.message || '自动保存失败')
    return false
  }
}

// 手动保存内容
async function saveContent() {
  await saveFile(true)
}

// 搜索面板控制
function toggleSearchPanel() {
  searchPanelVisible.value = !searchPanelVisible.value
}

// 切换全屏模式
function toggleFullscreen() {
  emit('toggle-fullscreen')
}

function closeSearchPanel() {
  searchPanelVisible.value = false
}

// 自动保存内容
async function autoSaveContent() {
  await saveFile(false)
}

// 加载人物数据
async function loadCharacters() {
  if (!props.bookName) return
  try {
    const data = await window.electron.readCharacters(props.bookName)
    characters.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('加载人物数据失败:', error)
    characters.value = []
  }
}

// 清除所有人物高亮（不改变光标位置）
function clearCharacterHighlights() {
  const editors = [editor.value, editor2.value].filter(Boolean) // 获取所有已初始化的编辑器实例
  editors.forEach((ed) => { // 遍历每个编辑器
    const { state, view } = ed // 获取编辑器状态和视图
    const { tr } = state // 获取当前事务

    // 保存当前选择位置（使用数字位置，而不是选择对象）
    const selectionFrom = state.selection.from
    const selectionTo = state.selection.to

    // 获取 highlight mark 类型
    const highlightType = state.schema.marks.highlight

    // 遍历文档，移除所有人物高亮标记（保留段落校验高亮）
    state.doc.descendants((node, pos) => {
      if (node.marks) {
        node.marks.forEach((mark) => {
          if (mark.type.name === 'highlight') {
            // 只清除人物高亮（character-highlight），保留段落校验高亮（paragraph-check-highlight）
            const markClass = mark.attrs?.class || ''
            if (markClass !== 'paragraph-check-highlight') {
              const from = pos
              const to = pos + node.nodeSize
              tr.removeMark(from, to, highlightType)
            }
          }
        })
      }
    })

    // 恢复选择位置（使用 TextSelection.create 创建新的选择对象）
    if (tr.steps.length > 0) {
      const newSelection = TextSelection.create(tr.doc, selectionFrom, selectionTo)
      tr.setSelection(newSelection)
      view.dispatch(tr)
    }
  })
}

// 应用人物高亮（不改变光标位置）
function applyCharacterHighlights() {
  if (!characterHighlightEnabled.value || characters.value.length === 0) {
    return
  }

  const editors = [editor.value, editor2.value].filter(Boolean) // 获取所有已初始化的编辑器实例
  editors.forEach((ed) => { // 遍历每个编辑器
    const { state, view } = ed
    const { doc, tr, schema } = state

    // 保存当前选择位置（使用数字位置）
    const selectionFrom = state.selection.from
    const selectionTo = state.selection.to

    // 先清除之前的人物高亮（在同一事务中），但保留段落校验高亮
    const highlightType = schema.marks.highlight
    doc.descendants((node, pos) => {
      if (node.marks) {
        node.marks.forEach((mark) => {
          if (mark.type.name === 'highlight') {
            // 只清除人物高亮（character-highlight），保留段落校验高亮（paragraph-check-highlight）
            const markClass = mark.attrs?.class || ''
            if (markClass !== 'paragraph-check-highlight') {
              const from = pos
              const to = pos + node.nodeSize
              tr.removeMark(from, to, highlightType)
            }
          }
        })
      }
    })

    // 为每个人物名创建匹配项
    const matches = []

    // 转义正则表达式特殊字符的工具函数
    const escapeRegExp = (string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    // 遍历文档中的所有文本节点，查找人物名匹配
    characters.value.forEach((character) => {
      if (!character.name || !character.name.trim()) return

      const characterName = character.name.trim()
      // 转义特殊字符，用于正则表达式
      const escapedName = escapeRegExp(characterName)
      // 创建正则表达式，匹配完整的人物名（不区分大小写）
      const regex = new RegExp(escapedName, 'gi')

      // 遍历文档中的所有文本节点（使用当前事务的文档）
      tr.doc.descendants((node, pos) => {
        if (node.isText) {
          const text = node.text
          let match

          // 重置正则表达式的 lastIndex
          regex.lastIndex = 0

          while ((match = regex.exec(text)) !== null) {
            matches.push({
              from: pos + match.index,
              to: pos + match.index + match[0].length,
              text: match[0],
              color: character.markerColor || defaultHighlightColor
            })
          }
        }
      })
    })

    // 按位置排序，从后往前应用高亮（避免位置偏移）
    matches.sort((a, b) => b.from - a.from)

    // 批量应用高亮
    matches.forEach((match) => {
      const highlightMark = highlightType.create({ 
        color: match.color,
        class: 'character-highlight' // 添加自定义类名用于样式区分
      })
      tr.addMark(match.from, match.to, highlightMark)
    })
    
    // 恢复选择位置（使用 TextSelection.create 创建新的选择对象）
    const newSelection = TextSelection.create(tr.doc, selectionFrom, selectionTo)
    tr.setSelection(newSelection)

    // 应用事务，但不改变焦点
    if (tr.steps.length > 0) {
      view.dispatch(tr)
    }
  })
}

// 加载人物高亮开关状态（按书籍）
async function loadCharacterHighlightState(bookName) {
  if (!bookName) {
    characterHighlightEnabled.value = false
    // 清除高亮并停止定时器
    clearCharacterHighlights()
    stopCharacterHighlightTimer()
    return
  }

  try {
    const key = `characterHighlight_${bookName}`
    const savedState = await window.electronStore.get(key)
    // 如果该书籍有保存的状态，使用保存的状态；否则默认关闭
    const newState = savedState === true
    characterHighlightEnabled.value = newState

    // 如果状态是开启的，加载人物数据并应用高亮
    if (newState) {
      await loadCharacters()
      // 等待编辑器初始化完成后再应用高亮
      await nextTick()
      // 确保编辑器内容已经设置完成（检查文档是否有内容）
      if (editor.value && editorStore.file?.type === 'chapter') {
        // 等待内容渲染完成
        await nextTick()
        // 检查文档是否有内容，如果有内容则应用高亮
        const docSize = editor.value.state.doc.content.size
        if (docSize > 0) {
          applyCharacterHighlights()
          startCharacterHighlightTimer()
        }
      }
    } else {
      // 如果状态是关闭的，确保清除高亮并停止定时器
      clearCharacterHighlights()
      stopCharacterHighlightTimer()
    }
  } catch (error) {
    console.error('加载人物高亮状态失败:', error)
    characterHighlightEnabled.value = false
    clearCharacterHighlights()
    stopCharacterHighlightTimer()
  }
}

// 保存人物高亮开关状态（按书籍）
async function saveCharacterHighlightState(bookName, enabled) {
  if (!bookName) return

  try {
    const key = `characterHighlight_${bookName}`
    await window.electronStore.set(key, enabled)
  } catch (error) {
    console.error('保存人物高亮状态失败:', error)
  }
}

// 处理人物高亮开关变化
async function handleCharacterHighlightChange(enabled) {
  // 保存开关状态到当前书籍的设置中
  if (props.bookName) {
    await saveCharacterHighlightState(props.bookName, enabled)
  }

  if (enabled) {
    // 开启高亮：加载人物数据并应用高亮
    await loadCharacters()
    applyCharacterHighlights()
    // 启动定时器，定时检查并更新高亮
    startCharacterHighlightTimer()
  } else {
    // 关闭高亮：清除高亮并停止定时器
    clearCharacterHighlights()
    stopCharacterHighlightTimer()
  }
}

// 启动人物高亮定时器
function startCharacterHighlightTimer() {
  stopCharacterHighlightTimer() // 先清除旧的定时器

  // 每 2 秒检查一次并更新高亮
  characterHighlightTimer = setInterval(() => {
    if (characterHighlightEnabled.value && editor.value) {
      applyCharacterHighlights()
    }
  }, 2000)
}

// 停止人物高亮定时器
function stopCharacterHighlightTimer() {
  if (characterHighlightTimer) {
    clearInterval(characterHighlightTimer)
    characterHighlightTimer = null
  }
}

// ==================== 段落字数校验相关函数 ====================

// ==================== 段落字数校验相关函数 ====================

// 执行段落字数校验（一键校验）
function checkParagraphLength() {
  // 清空之前的结果
  overLengthParagraphs.value = []
  
  // 根据切分模式确定标签
  const label1 = splitMode.value === 'horizontal' ? '上方' : (splitMode.value === 'vertical' ? '左侧' : '主编辑器')
  const label2 = splitMode.value === 'horizontal' ? '下方' : '右侧'

  // 准备需要校验的编辑器列表
  const editorsToCheck = [
    { instance: editor.value, label: label1, id: 'first' }
  ]
  
  // 如果处于切分模式且第二个编辑器存在，也加入校验
  if (splitMode.value !== 'none' && editor2.value) {
    editorsToCheck.push({ instance: editor2.value, label: label2, id: 'second' })
  }

  editorsToCheck.forEach(({ instance, label, id }) => {
    if (!instance) return
    
    const { state } = instance
    const { doc } = state
    
    // 遍历所有段落节点，检查字数
    doc.descendants((node, pos) => {
      // 只处理段落节点
      if (node.type.name === 'paragraph') {
        const text = node.textContent
        // 排除空格和换行符，只计算实际字符
        const textLength = text.replace(/[\s\n\r\t]/g, '').length
        
        // 如果段落字数超过阈值，记录该段落
        if (textLength > editorStore.paragraphMaxLength) {
          // 获取段落预览文本（前50个字符）
          const preview = text.length > 50 ? text.substring(0, 50) + '...' : text
          
          overLengthParagraphs.value.push({
            editorId: id,
            editorLabel: label,
            from: pos + 1, // +1 跳过段落节点本身
            to: pos + node.nodeSize - 1, // -1 跳过结束标记
            length: textLength,
            preview: preview
          })
        }
      }
    })
  })
  
  // 显示结果弹窗
  paragraphCheckDialogVisible.value = true
  
  // 提示消息
  if (overLengthParagraphs.value.length === 0) {
    ElMessage.success('所有段落字数均符合要求')
  } 
}

// 跳转到指定段落（锚点跳转并高亮）
// 使用和人物高亮相同的原理：通过 ProseMirror 的 highlight mark 标记来实现临时高亮效果
function jumpToParagraph(item) {
  // 根据 item 携带的 editorId 确定目标编辑器
  const ed = item.editorId === 'second' ? editor2.value : editor.value
  if (!ed) return
  
  const { from, to } = item
  
  // 先关闭弹窗，使用 nextTick 确保弹窗关闭后再应用高亮
  paragraphCheckDialogVisible.value = false
  
  nextTick(() => {
    const { state, view } = ed
    const { schema } = state
    
    // 设置焦点并定位光标
    ed.chain().focus().setTextSelection(from).run()
    
    // 滚动到视图中
    const domAtPos = view.domAtPos(from)
    if (domAtPos && domAtPos.node) {
      let element = domAtPos.node
      if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentElement
      }
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    
    // 应用高亮标记
    const tr = ed.state.tr
    const highlightType = ed.state.schema.marks.highlight
    
    const highlightMark = highlightType.create({ 
      color: '#ff6b6b', // 橙红色，表示警告
      class: 'paragraph-check-highlight' // 添加自定义类名用于样式区分
    })
    tr.addMark(from, to, highlightMark)
    ed.view.dispatch(tr)
    
    // 5秒后移除高亮
    setTimeout(() => {
      if (!ed || ed.isDestroyed) return
      
      const finalState = ed.state
      const finalTr = finalState.tr
      const finalHighlightType = finalState.schema.marks.highlight
      
      finalTr.removeMark(from, to, finalHighlightType)
      ed.view.dispatch(finalTr)
    }, 5000)
  })
}

// ==================== 禁词提示相关函数 ====================


// 监听禁词列表变化，立即重新应用划线
watch(
  () => editorStore.bannedWords, // 监听 store 中的禁词列表
  () => {
    if (bannedWordsHintEnabled.value && editor.value) {
      applyBannedWordsStrikes() // 如果开启了禁词提示且编辑器已就绪，则重新应用划线
    }
  },
  { deep: true } // 深度监听数组变化
)

// 加载禁词数据
async function loadBannedWords() {
  if (!props.bookName) return
  await editorStore.fetchBannedWords(props.bookName)
}

// 清除所有禁词划线（不改变光标位置）
function clearBannedWordsStrikes() {
  const editors = [editor.value, editor2.value].filter(Boolean) // 获取所有已初始化的编辑器实例
  editors.forEach((ed) => { // 遍历每个编辑器
    const { state, view } = ed
    const { tr } = state

    // 保存当前选择位置（使用数字位置）
    const selectionFrom = state.selection.from
    const selectionTo = state.selection.to

    // 获取 strike mark 类型
    const strikeType = state.schema.marks.strike

    // 遍历文档，移除所有划线标记
    state.doc.descendants((node, pos) => {
      if (node.marks) {
        node.marks.forEach((mark) => {
          if (mark.type.name === 'strike') {
            // 移除划线标记，但不改变选择
            const from = pos
            const to = pos + node.nodeSize
            tr.removeMark(from, to, strikeType)
          }
        })
      }
    })

    // 恢复选择位置
    if (tr.steps.length > 0) {
      const newSelection = TextSelection.create(tr.doc, selectionFrom, selectionTo)
      tr.setSelection(newSelection)
      view.dispatch(tr)
    }
  })
}

// 应用禁词划线（不改变光标位置）
function applyBannedWordsStrikes() {
  if (!bannedWordsHintEnabled.value) {
    return
  }

  // 如果没有禁词，则清除所有现有的禁词划线
  if (bannedWords.value.length === 0) {
    clearBannedWordsStrikes()
    return
  }

  const editors = [editor.value, editor2.value].filter(Boolean) // 获取所有已初始化的编辑器实例
  editors.forEach((ed) => { // 遍历每个编辑器
    const { state, view } = ed
    const { doc, tr, schema } = state

    // 保存当前选择位置（使用数字位置）
    const selectionFrom = state.selection.from
    const selectionTo = state.selection.to

    // 先清除之前的禁词划线（在同一事务中）
    const strikeType = schema.marks.strike
    doc.descendants((node, pos) => {
      if (node.marks) {
        node.marks.forEach((mark) => {
          if (mark.type.name === 'strike') {
            const from = pos
            const to = pos + node.nodeSize
            tr.removeMark(from, to, strikeType)
          }
        })
      }
    })

    // 为每个禁词创建匹配项
    const matches = []

    // 转义正则表达式特殊字符的工具函数
    const escapeRegExp = (string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    // 遍历文档中的所有文本节点，查找禁词匹配
    bannedWords.value.forEach((bannedWord) => {
      if (!bannedWord || !bannedWord.trim()) return

      const word = bannedWord.trim()
      // 转义特殊字符，用于正则表达式
      const escapedWord = escapeRegExp(word)
      // 创建正则表达式，匹配完整的禁词（不区分大小写）
      const regex = new RegExp(escapedWord, 'gi')

      // 遍历文档中的所有文本节点（使用当前事务的文档）
      tr.doc.descendants((node, pos) => {
        if (node.isText) {
          const text = node.text
          let match

          // 重置正则表达式的 lastIndex
          regex.lastIndex = 0

          while ((match = regex.exec(text)) !== null) {
            matches.push({
              from: pos + match.index,
              to: pos + match.index + match[0].length,
              text: match[0]
            })
          }
        }
      })
    })

    // 按位置排序，从后往前应用划线（避免位置偏移）
    matches.sort((a, b) => b.from - a.from)

    // 批量应用划线
    matches.forEach((match) => {
      tr.addMark(match.from, match.to, strikeType.create())
    })

    // 恢复选择位置（使用 TextSelection.create 创建新的选择对象）
    const newSelection = TextSelection.create(tr.doc, selectionFrom, selectionTo)
    tr.setSelection(newSelection)

    // 应用事务，但不改变焦点
    if (tr.steps.length > 0) {
      view.dispatch(tr)
    }
  })
}

// 加载禁词提示开关状态（按书籍）
async function loadBannedWordsHintState(bookName) {
  if (!bookName) {
    bannedWordsHintEnabled.value = false
    // 清除划线并停止定时器
    clearBannedWordsStrikes()
    stopBannedWordsHintTimer()
    return
  }

  try {
    const key = `bannedWordsHint_${bookName}`
    const savedState = await window.electronStore.get(key)
    // 如果该书籍有保存的状态，使用保存的状态；否则默认关闭
    const newState = savedState === true
    bannedWordsHintEnabled.value = newState

    // 如果状态是开启的，加载禁词数据并应用划线
    if (newState) {
      await loadBannedWords()
      // 等待编辑器初始化完成后再应用划线
      await nextTick()
      // 确保编辑器内容已经设置完成（检查文档是否有内容）
      if (editor.value && editorStore.file?.type === 'chapter') {
        // 等待内容渲染完成
        await nextTick()
        // 检查文档是否有内容，如果有内容则应用划线
        const docSize = editor.value.state.doc.content.size
        if (docSize > 0) {
          applyBannedWordsStrikes()
          startBannedWordsHintTimer()
        }
      }
    } else {
      // 如果状态是关闭的，确保清除划线并停止定时器
      clearBannedWordsStrikes()
      stopBannedWordsHintTimer()
    }
  } catch (error) {
    console.error('加载禁词提示状态失败:', error)
    bannedWordsHintEnabled.value = false
    clearBannedWordsStrikes()
    stopBannedWordsHintTimer()
  }
}

// 保存禁词提示开关状态（按书籍）
async function saveBannedWordsHintState(bookName, enabled) {
  if (!bookName) return

  try {
    const key = `bannedWordsHint_${bookName}`
    await window.electronStore.set(key, enabled)
  } catch (error) {
    console.error('保存禁词提示状态失败:', error)
  }
}

// 处理禁词提示开关变化
async function handleBannedWordsHintChange(enabled) {
  // 保存开关状态到当前书籍的设置中
  if (props.bookName) {
    await saveBannedWordsHintState(props.bookName, enabled)
  }

  if (enabled) {
    // 开启提示：加载禁词数据并应用划线
    await loadBannedWords()
    applyBannedWordsStrikes()
    // 启动定时器，定时检查并更新划线
    startBannedWordsHintTimer()
  } else {
    // 关闭提示：清除划线并停止定时器
    clearBannedWordsStrikes()
    stopBannedWordsHintTimer()
  }
}

// 启动禁词提示定时器
function startBannedWordsHintTimer() {
  stopBannedWordsHintTimer() // 先清除旧的定时器

  // 每 2 秒检查一次并更新划线
  bannedWordsHintTimer = setInterval(() => {
    if (bannedWordsHintEnabled.value && editor.value) {
      applyBannedWordsStrikes()
    }
  }, 2000)
}

// 停止禁词提示定时器
function stopBannedWordsHintTimer() {
  if (bannedWordsHintTimer) {
    clearInterval(bannedWordsHintTimer)
    bannedWordsHintTimer = null
  }
}

// ==================== 对白高亮相关函数 ====================

// 清除所有对白高亮
function clearDialogueHighlights() {
  const editors = [editor.value, editor2.value].filter(Boolean)
  editors.forEach((ed) => {
    const { state, view } = ed
    const { tr } = state

    const selectionFrom = state.selection.from
    const selectionTo = state.selection.to

    const highlightType = state.schema.marks.highlight

    state.doc.descendants((node, pos) => {
      if (node.marks) {
        node.marks.forEach((mark) => {
          if (mark.type.name === 'highlight' && mark.attrs?.class === 'dialogue-highlight') {
            const from = pos
            const to = pos + node.nodeSize
            tr.removeMark(from, to, highlightType)
          }
        })
      }
    })

    if (tr.steps.length > 0) {
      const newSelection = TextSelection.create(tr.doc, selectionFrom, selectionTo)
      tr.setSelection(newSelection)
      view.dispatch(tr)
    }
  })
}

// 应用对白高亮
function applyDialogueHighlights() {
  const settings = editorStore.editorSettings.dialogueHighlight
  if (!dialogueHighlightEnabled.value || !settings) {
    return
  }

  const editors = [editor.value, editor2.value].filter(Boolean)
  editors.forEach((ed) => {
    const { state, view } = ed
    const { doc, tr, schema } = state

    const selectionFrom = state.selection.from
    const selectionTo = state.selection.to

    // 先清除之前的对白高亮
    const highlightType = schema.marks.highlight
    doc.descendants((node, pos) => {
      if (node.marks) {
        node.marks.forEach((mark) => {
          if (mark.type.name === 'highlight' && mark.attrs?.class === 'dialogue-highlight') {
            const from = pos
            const to = pos + node.nodeSize
            tr.removeMark(from, to, highlightType)
          }
        })
      }
    })

    const enabledSymbols = settings.symbols.filter((s) => s.enabled)
    if (enabledSymbols.length === 0) return

    // 获取所有文本节点及其位置
    const textNodes = []
    doc.descendants((node, pos) => {
      if (node.isText) {
        textNodes.push({ text: node.text, pos })
      } else if (node.type.name === 'paragraph' && textNodes.length > 0) {
        // 在段落之间添加换行符标记，用于跨行匹配
        textNodes.push({ text: '\n', pos: pos + node.nodeSize - 1, isSeparator: true })
      }
    })

    // 将所有文本拼接成一个大字符串，同时记录每个字符对应的原始位置
    let fullText = ''
    const posMap = []
    textNodes.forEach((item) => {
      for (let i = 0; i < item.text.length; i++) {
        fullText += item.text[i]
        posMap.push(item.pos + i)
      }
    })

    enabledSymbols.forEach((symbol) => {
      const startSym = symbol.start
      const endSym = symbol.end
      const color = symbol.color || settings.defaultColor || '#e198b8'

      let searchIndex = 0
      while (searchIndex < fullText.length) {
        const startIndex = fullText.indexOf(startSym, searchIndex)
        if (startIndex === -1) break

        let endIndex = -1
        if (startSym === endSym) {
          endIndex = fullText.indexOf(endSym, startIndex + startSym.length)
        } else {
          endIndex = fullText.indexOf(endSym, startIndex + startSym.length)
        }

        const nextNewLineIndex = fullText.indexOf('\n', startIndex)

        // 检查是否跨行
        const isCrossLine = nextNewLineIndex !== -1 && (endIndex === -1 || endIndex > nextNewLineIndex)

        if (isCrossLine && !settings.allowNewLine) {
          // 不允许换行，且当前匹配跨行了
          if (settings.allowNoEnd) {
            // 允许无结束符，高亮到行末
            const from = posMap[startIndex]
            const to = posMap[nextNewLineIndex]
            tr.addMark(from, to, highlightType.create({ color, class: 'dialogue-highlight' }))
          }
          searchIndex = nextNewLineIndex + 1
          continue
        }

        if (endIndex !== -1) {
          // 找到完整的对白
          const from = posMap[startIndex]
          // to 位置是结束符最后一个字符的位置 + 1
          const to = posMap[endIndex + endSym.length - 1] + 1
          tr.addMark(from, to, highlightType.create({ color, class: 'dialogue-highlight' }))
          searchIndex = endIndex + endSym.length
        } else if (settings.allowNoEnd) {
          // 没找到结束符，但允许无结束符
          const from = posMap[startIndex]
          let toIndex = settings.allowNewLine ? fullText.length - 1 : (nextNewLineIndex === -1 ? fullText.length - 1 : nextNewLineIndex - 1)
          const to = posMap[toIndex] + 1
          tr.addMark(from, to, highlightType.create({ color, class: 'dialogue-highlight' }))
          searchIndex = toIndex + 2
        } else {
          searchIndex = startIndex + startSym.length
        }
      }
    })

    if (tr.steps.length > 0) {
      const newSelection = TextSelection.create(tr.doc, selectionFrom, selectionTo)
      tr.setSelection(newSelection)
      view.dispatch(tr)
    }
  })
}

// 加载对白高亮状态
async function loadDialogueHighlightState(bookName) {
  if (!bookName) {
    dialogueHighlightEnabled.value = false
    clearDialogueHighlights()
    return
  }

  try {
    const key = `dialogueHighlight_${bookName}`
    const savedState = await window.electronStore.get(key)
    const newState = savedState === true
    dialogueHighlightEnabled.value = newState

    if (newState) {
      await nextTick()
      if (editor.value && editorStore.file?.type === 'chapter') {
        await nextTick()
        const docSize = editor.value.state.doc.content.size
        if (docSize > 0) {
          applyDialogueHighlights()
        }
      }
    } else {
      clearDialogueHighlights()
    }
  } catch (error) {
    console.error('加载对白高亮状态失败:', error)
    dialogueHighlightEnabled.value = false
    clearDialogueHighlights()
  }
}

// 处理对白高亮开关变化
async function handleDialogueHighlightChange(enabled) {
  if (props.bookName) {
    const key = `dialogueHighlight_${props.bookName}`
    await window.electronStore.set(key, enabled)
  }

  if (enabled) {
    applyDialogueHighlights()
  } else {
    clearDialogueHighlights()
  }
}

// 监听当前文件类型，动态设置首行缩进和编辑器模式
watch(
  () => editorStore.file,
  async (file) => {
    if (editor.value) {
      const isChapter = file?.type === 'chapter'
      const style = document.querySelector('.tiptap')
      if (style) {
        style.style.textIndent = isChapter ? '2em' : '0'
      }

      // 如果切换到笔记模式，需要重新初始化编辑器以加载 NoteOutlineParagraph 扩展
      // 但这里我们已经在 onMounted 中根据文件类型加载了扩展
      // 所以只需要确保内容正确加载即可
    }
  },
  { immediate: true }
)

// ==================== 码字音效相关 ====================
const typingSoundEffect = ref('') // 当前选择的音效类型
const typingSoundVolume = ref(100) // 音量大小（0-100），100%表示与系统音量一致
const soundCache = new Map() // 音效文件缓存
const lastPlayTime = ref(0) // 上次播放时间，用于防抖

// 音效类型配置表：定义每种音效的数字文件数量和特殊键文件（仅在程序启动时初始化一次）
const EFFECT_CONFIG = {
  'muyu': { maxNum: 1, specialFiles: ['backspace', 'enter'] },
  'shuidi': { maxNum: 1, specialFiles: [] },
  'jianqi': { maxNum: 6, specialFiles: ['space', 'enter', 'back'] },
  'quanshui': { maxNum: 8, specialFiles: ['enter'] },
  'jixie1': { maxNum: 5, specialFiles: [] },
  'jixie2': { maxNum: 3, specialFiles: ['Backspace', 'Enter', 'Space'] },
  'jixie3': { maxNum: 4, specialFiles: ['Backspace', 'Enter', 'Space'] },
  'Cherry_G80_3000': { maxNum: 5, specialFiles: [] },
  'Cherry_G80_3494': { maxNum: 3, specialFiles: ['backspace', 'enter', 'space'] },
  'baoliegushou': { maxNum: 4, specialFiles: ['backspace', 'enter', 'space'] },
  'daziji': { maxNum: 5, specialFiles: ['backspace', 'enter', 'space', 'up', 'down'] },
  'gangqin': { // 钢琴音效特殊配置
    files: [
      // 字母按键音效（大写）
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
      'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
      // 特殊按键音效
      'space', 'enter', 'Backspace',
      // 标点符号按键音效
      'Comma', 'Period', 'Semicolon', 'QuoteSingle', 'Slash', 
      'BracketLeft', 'BracketRight'
    ]
  }
}

// 键盘监听事件日志相关
const keyboardEvents = ref([]) // 键盘事件日志数组
let keyboardEventIdCounter = 0 // 事件ID计数器
const currentPressedKey = ref(null) // 当前按下的按键
const inputCompositionText = ref("") // 输入法组合文本

// 添加键盘事件日志
const addKeyboardEvent = (type, key, code, data) => {
  const newEvent = {
    id: keyboardEventIdCounter++,
    type,
    key,
    code,
    data,
    timestamp: Date.now(),
  }
  // 保留最近 100 条记录
  if (keyboardEvents.value.length >= 100) {
    keyboardEvents.value.shift()
  }
  keyboardEvents.value.push(newEvent)
  
  // 在控制台打印事件信息
  console.log(`⌨️ [键盘监听] ${type}事件:`, {
    type,
    key: key || '-',
    code: code || '-',
    data: data || '-',
    timestamp: new Date(newEvent.timestamp).toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + `.${String(new Date(newEvent.timestamp).getMilliseconds()).padStart(3, '0')}`
  })
}

// 定义允许播放音频的按键列表
const allowedKeys = new Set([
  // 26个字母键
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  // 空格键
  ' ', 'Space',
  // 回车键
  "Enter",
  // 退格键
  'Backspace',
  // Alt键
  'Alt',
  // P后面的三个键: [ ] \
  '[', ']', '\\',
  // L后面的三个键: ; ' Enter
  ';', '\'', 'Enter',
  // M后面的三个键: , . /
  ',', '.', '/'
])

// 检查按键是否允许播放音频
const isKeyAllowedToPlaySound = (key) => {
  return allowedKeys.has(key)
}

// 键盘按键与文件名的映射关系（用于钢琴音效）
const keyToFileMap = {
  // 字母键（不区分大小写，统一映射到大写文件名）
  'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D', 'e': 'E', 'f': 'F', 'g': 'G', 'h': 'H',
  'i': 'I', 'j': 'J', 'k': 'K', 'l': 'L', 'm': 'M', 'n': 'N', 'o': 'O', 'p': 'P',
  'q': 'Q', 'r': 'R', 's': 'S', 't': 'T', 'u': 'U', 'v': 'V', 'w': 'W', 'x': 'X',
  'y': 'Y', 'z': 'Z',
  'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'H': 'H',
  'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N', 'O': 'O', 'P': 'P',
  'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U', 'V': 'V', 'W': 'W', 'X': 'X',
  'Y': 'Y', 'Z': 'Z',
  // 特殊键
  ' ': 'space',
  'Enter': 'enter',
  'Backspace': 'Backspace', // 修正：钢琴音效中退格键文件名是大写的 Backspace.wav
  ',': 'Comma',
  '.': 'Period',
  ';': 'Semicolon',
  '\'': 'QuoteSingle',
  '/': 'Slash',
  '[': 'BracketLeft',
  ']': 'BracketRight',
  'ArrowUp': 'up',
  'ArrowDown': 'down'
}

// 加载码字音效设置
async function loadTypingSoundSettings() {
  if (!props.bookName) return
  
  try {
    const effectKey = `typingSoundEffect_${props.bookName}`
    const volumeKey = `typingSoundVolume_${props.bookName}`
    
    const savedEffect = await window.electronStore.get(effectKey)
    const savedVolume = await window.electronStore.get(volumeKey)
    
    typingSoundEffect.value = savedEffect || ''
    typingSoundVolume.value = savedVolume !== undefined ? savedVolume : 100
  } catch (error) {
    console.error('加载码字音效设置失败:', error)
  }
}

// 保存码字音效设置
async function saveTypingSoundSettings() {
  if (!props.bookName) return
  
  try {
    const effectKey = `typingSoundEffect_${props.bookName}`
    const volumeKey = `typingSoundVolume_${props.bookName}`
    
    await window.electronStore.set(effectKey, typingSoundEffect.value)
    await window.electronStore.set(volumeKey, typingSoundVolume.value)
  } catch (error) {
    console.error('保存码字音效设置失败:', error)
  }
}

// 处理音效选择变化
async function handleTypingSoundChange(value) {
  typingSoundEffect.value = value
  await saveTypingSoundSettings()
  // 预加载新选择的音效文件（如果尚未缓存）
  if (typingSoundEffect.value) {
    await preloadSoundFiles(typingSoundEffect.value)
  }
}

// 处理音量变化
async function handleVolumeChange(value) {
  typingSoundVolume.value = value
  await saveTypingSoundSettings()
}

// 预加载音效文件（仅在首次使用时加载一次，后续从缓存读取）
async function preloadSoundFiles(effectType) {
  // 如果已缓存，直接返回
  if (!effectType || soundCache.has(effectType)) return
  
  try {
    // 构建音效文件夹路径
    // 修改为相对路径，适配 electron-vite 构建后的目录结构
    const soundDir = `sounds/${effectType}`
    const cache = {}
    
    // 从配置表获取音效配置
    const config = EFFECT_CONFIG[effectType]
    
    // 如果是钢琴音效，使用预定义的文件列表
    if (effectType === 'gangqin' && config?.files) {
      for (const file of config.files) {
        cache[file] = `${soundDir}/${file}.wav`
      }
    } else {
      // 其他音效类型：使用配置表中的数字文件数量和特殊文件
      const effectConfig = config || { maxNum: 5, specialFiles: [] }
      const maxNum = effectConfig.maxNum
      
      // 缓存数字音效文件
      for (let i = 1; i <= maxNum; i++) {
        cache[i.toString()] = `${soundDir}/${i}.wav`
      }
      
      // 统一处理特殊键（所有音效类型都适用）
      const specialKeys = [
        { keys: ['space', 'Space'], files: ['space', 'Space'] },
        { keys: ['enter', 'Enter'], files: ['enter', 'Enter'] },
        { keys: ['backspace', 'Backspace', 'back'], files: ['backspace', 'Backspace', 'back'] },
        { keys: ['up', 'Up'], files: ['up', 'Up'] },
        { keys: ['down', 'Down'], files: ['down', 'Down'] }
      ]
      
      // 使用最大数字音频作为默认音频
      const defaultSound = `${soundDir}/${maxNum}.wav`
      
      for (const { keys, files } of specialKeys) {
        let foundFile = null
        
        // 在配置的特殊文件列表中查找匹配的文件
        for (const file of files) {
          if (effectConfig.specialFiles.includes(file)) {
            foundFile = `${soundDir}/${file}.wav`
            break
          }
        }
        
        // 为所有相关的键设置音频文件（找到专用文件就用专用文件，否则用默认音频）
        const soundToUse = foundFile || defaultSound
        for (const key of keys) {
          cache[key] = soundToUse
        }
      }
    }
    
    // 将配置缓存到内存中，后续直接使用
    soundCache.set(effectType, cache)
  } catch (error) {
    console.error('预加载音效文件失败:', error)
  }
}

// 播放码字音效
async function playTypingSound(key) {
  if (!typingSoundEffect.value) return
  
  // 防抖：限制播放频率（30ms内不重复播放）
  const now = Date.now()
  if (now - lastPlayTime.value < 30) {
    return
  }
  lastPlayTime.value = now
  
  try {
    // 预加载音效文件
    await preloadSoundFiles(typingSoundEffect.value)
    
    const cache = soundCache.get(typingSoundEffect.value)
    if (!cache) return
    
    let soundFile = null
    
    // 判断音效类型
    const effectType = typingSoundEffect.value
    
    // 钢琴音效：按照键盘字母和标点符号映射
    if (effectType === 'gangqin') {
      // 先尝试直接映射
      const mappedKey = keyToFileMap[key]
      if (mappedKey && cache[mappedKey]) {
        soundFile = cache[mappedKey]
      } else {
        // 如果钢琴音效中没有对应的按键，播放随机音效
        const letterKeys = Object.keys(cache).filter(k => /^[A-Z]$/.test(k))
        if (letterKeys.length > 0) {
          const randomKey = letterKeys[Math.floor(Math.random() * letterKeys.length)]
          soundFile = cache[randomKey]
        }
      }
    } else {
      // 数字命名的音效文件
      const lowerKey = key.toLowerCase()
      
      // 优先检查特殊键映射（space、enter、backspace等）
      if (cache[key]) {
        soundFile = cache[key]
      } else if (cache[lowerKey]) {
        soundFile = cache[lowerKey]
      } else if (keyToFileMap[key] && cache[keyToFileMap[key]]) {
        soundFile = cache[keyToFileMap[key]]
      } else if (cache[keyToFileMap[lowerKey]]) {
        soundFile = cache[keyToFileMap[lowerKey]]
      } else {
        // 对于所有其他按键（包括P后、L后、M后的键和Alt等），随机选择数字音效
        const maxNum = Object.keys(cache).filter(k => /^\d+$/.test(k)).length
        if (maxNum > 0) {
          const randomNum = Math.floor(Math.random() * maxNum) + 1
          soundFile = cache[randomNum.toString()]
        }
      }
    }
    
    // 播放音效
    if (soundFile) {
      const audio = new Audio(soundFile)
      audio.volume = typingSoundVolume.value / 100
      audio.play().catch(err => {
        console.warn('❌ 播放音效失败:', err)
      })
    }
  } catch (error) {
    console.error('❌ 播放码字音效失败:', error)
  }
}

// 处理编辑器键盘事件
function handleEditorKeydown(event) {
  // 检查编辑器是否有焦点
  if (!editor.value || !editor.value.isFocused) {
    return
  }
  
  // 记录当前按下的按键
  currentPressedKey.value = event.key
  
  // 记录 keydown 事件日志
  addKeyboardEvent('keydown', event.key, event.code)
  
  // 更新活动状态（用于专注模式）
  updateActivity()
  
  // 播放码字音效 - 只在非中文输入法状态下且按键在白名单中时播放
  if (typingSoundEffect.value && !isComposing && isKeyAllowedToPlaySound(event.key)) {
    playTypingSound(event.key)
    lastKeydownPlayedSound = true // 标记已播放音频
  } else {
    lastKeydownPlayedSound = false // 标记未播放音频
  }
}
// ==================== 专注模式相关 ====================
const jailStore = useJailStore()
const jailModeDialogVisible = ref(false)
const jailModeType = ref('time') // 'word' | 'time'
const jailTarget = ref('')
const isJailModeActive = computed(() => jailStore.isJailModeActive)

// 更多设置弹窗
const moreSettingsDialogVisible = ref(false)

function openJailModeDialog() {
  jailModeDialogVisible.value = true
  jailModeType.value = 'word'
  jailTarget.value = ''
}

// 打开更多设置弹窗
function openMoreSettings() {
  moreSettingsDialogVisible.value = true
}

// 播放试听音频
function handlePlayPreviewSound() {
  if (typingSoundEffect.value) {
    // 使用常见按键播放试听音频
    playTypingSound('a')
  }
}

// 处理应用格式化
function handleApplyFormatting(options) {
  // 如果是章节编辑器，直接调用 EditorMenubar 的一键排版功能（复用逻辑和光标处理）
  if (editorStore.file?.type === 'chapter' && editorMenubarRef.value) {
    // handleFormatContent 会使用 store 中的设置，而 MoreSettingsDialog 已经在 emit 前保存了设置
    editorMenubarRef.value.handleFormatContent()
    // 立即保存内容
    saveContent()
    return
  }

  try {
    // 检查编辑器是否已初始化
    const targetEditor = lastFocusedEditor.value || editor.value
    if (!targetEditor) {
      ElMessage.warning('编辑器未就绪')
      return
    }

    // 获取当前文本内容
    const currentText = targetEditor.getText()
    
    if (!currentText || currentText.trim().length === 0) {
      ElMessage.warning('编辑器内容为空')
      return
    }
    
    // 应用格式化
    const formattedText = formatText(currentText, options)
    
    // 获取编辑器内容组件
    const editorContentComponent = getEditorContentComponent()
    const isNote = editorStore.file?.type === 'note'
    
    // 更新编辑器内容
    if (editorContentComponent) {
      if (isNote) {
        editorContentComponent.setNoteContent(targetEditor, formattedText)
      } else {
        editorContentComponent.setChapterContent(targetEditor, formattedText)
      }
    } else {
      // 降级方案：直接设置内容
      targetEditor.commands.setContent(formattedText)
    }
    
    // 保存更改
    saveContent()
    
    // ElMessage.success('文本格式化完成')
  } catch (error) {
    console.error('格式化失败:', error)
    ElMessage.error('格式化失败，请重试')
  }
}

function updateActivity() {
  jailStore.updateActivity()
}

async function startJailMode() {
  const target = parseInt(jailTarget.value)
  if (isNaN(target) || target <= 0) {
    ElMessage.warning('请输入有效的目标')
    return
  }
  
  if (jailModeType.value === 'word') {
    if (target < 1 || target > 20000) {
      ElMessage.warning('字数范围 1-20000')
      return
    }
  } else {
    if (target < 1 || target > 360) {
      ElMessage.warning('时长范围 1-360 分钟')
      return
    }
  }

  const success = await jailStore.startJailMode(
    target, 
    jailModeType.value, 
    editorStore.contentWordCount
  )
  
  if (success) {
    jailModeDialogVisible.value = false
  }
}

// Watch word count for jail mode
watch(() => editorStore.contentWordCount, (newVal, oldVal) => {
  jailStore.updateWordCount(newVal, oldVal)
})

// Watch jail mode state and emit event
watch(isJailModeActive, (newVal) => {
  emit('jail-mode-change', newVal)
})

defineExpose({
  saveContent,
  autoSaveContent
})

</script>

<style lang="scss" scoped>
.editor-panel {
  display: flex; // 使用弹性布局
  flex-direction: column; // 垂直排列子元素
  height: 100%; // 占据父容器全部高度
  background-color: var(--bg-primary); // 使用主题背景色
  color: var(--text-base); // 使用主题文字颜色
  min-height: 0; // 允许在 flex 容器中收缩
  overflow: hidden; // 隐藏溢出内容

  /* 全屏模式样式 - 适配比例布局 */
   &.fullscreen-panel {
     width: 100%; /* 宽度填充父容器 */
     margin: 0 auto; /* 水平居中 */
     box-shadow: none; /* 移除阴影 */
     border-left: none; /* 移除左侧边框，实现全屏覆盖 */
     border-right: none; /* 移除右侧边框，实现全屏覆盖 */
   }
}
.chapter-title {
  padding: 8px 15px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-soft);
  display: flex;
  align-items: center;
  gap: 12px;
}
.chapter-title-input {
  font-size: 20px;
  font-weight: bold;
  flex: 1;
}
.character-highlight-switch,
.paragraph-length-check-switch,
.banned-words-hint-switch {
  flex-shrink: 0;
}
.editor-main-area { // 编辑器主区域
  flex: 1; // 占据剩余空间
  display: flex; // 使用弹性布局
  min-height: 0; // 允许收缩
  overflow: hidden; // 隐藏溢出
  position: relative; // 相对定位

  &.split-horizontal { // 水平切分模式
    flex-direction: column; // 垂直排列编辑器
    .first-editor,
    .second-editor-wrapper { // 编辑器内容区及其包装容器
      height: 50%; // 各占一半高度
      width: 100%; // 宽度填充
      flex: none; // 禁用自动伸缩
    }
  }

  &.split-vertical { // 垂直切分模式
    flex-direction: row; // 水平排列编辑器
    .first-editor,
    .second-editor-wrapper { // 编辑器内容区及其包装容器
      width: 50%; // 各占一半宽度
      height: 100%; // 高度填充
      flex: none; // 禁用自动伸缩
    }
  }
}

.split-divider { // 切分模式下的分割线
  background-color: var(--border-color); // 使用主题边框颜色
  flex-shrink: 0; // 不收缩
  
  .split-horizontal & { // 水平模式下的线
    height: 3px; // 1像素高
    width: 100%; // 宽度填充
  }
  
  .split-vertical & { // 垂直模式下的线
    width: 1px; // 1像素宽
    height: 100%; // 高度填充
  }
}
.editor-content { // 编辑器内容区域样式
  flex: 1; // 占据剩余空间
  min-height: 0; // 允许内容收缩
  padding: 16px; // 内边距
  overflow-y: auto; // 允许垂直滚动
  background: var(--bg-primary); // 背景颜色
  white-space: pre-wrap; // 保证Tab缩进和换行显示
  font-family: inherit, monospace; // 字体设置

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

::v-deep(.tiptap) {
  height: max-content;
  min-height: 100%;
  white-space: pre-wrap; // 保证Tab缩进和换行显示
  // 字体、字号、行高通过动态样式设置，不在这里固定设置

  &:focus {
    outline: none;
  }

  // 加粗样式 - 确保在所有情况下都生效
  strong,
  b,
  [data-type='bold'] {
    font-weight: 700;
    font-style: normal;
  }

  // 倾斜样式 - 确保在所有情况下都生效
  em,
  i,
  [data-type='italic'] {
    font-style: italic;
    font-weight: inherit;
  }

  // 同时加粗和倾斜
  strong em,
  strong i,
  b em,
  b i,
  em strong,
  i strong,
  em b,
  i b {
    font-weight: 700;
    font-style: italic;
  }

  // 删除线样式 - 用于禁词提示
  s,
  strike,
  del,
  [data-type='strike'] {
    text-decoration: line-through;
    color: red;
  }

  // 人物高亮样式 - 使用人物谱中的标记色作为背景
  mark.character-highlight,
  mark[data-highlight-class="character-highlight"] {
    color: inherit !important;
    font-weight: inherit !important;
  }

  // 对白高亮样式 - 保持高亮效果，不闪烁
  mark.dialogue-highlight,
  mark[data-highlight-class="dialogue-highlight"] {
    font-weight: inherit !important;
    animation: none !important;
  }

  // 段落字数高亮样式 - 浅红色背景 + 虚线下划线
mark.paragraph-length-highlight {
  /* background-color: rgba(245, 108, 108, 0.15) !important; */
  border-bottom: 1px dashed #b30707 !important;
  color: inherit !important;
}

  // 搜索高亮样式 - 使用选择高亮
  ::selection {
    background-color: #409eff;
    color: white;
  }

  // // 搜索匹配文本的高亮样式（仅用于搜索功能，不使用 data-color）
  // .search-highlight:not([data-color]) {
  //   background-color: #ffeb3b !important;
  //   color: #000 !important;
  //   padding: 1px 2px;
  //   border-radius: 2px;
  //   border: 1px solid #f4d03f;
  // }

  // .search-highlight-current {
  //   background-color: #409eff !important;
  //   color: white !important;
  //   padding: 1px 2px;
  //   border-radius: 2px;
  //   box-shadow: 0 0 4px rgba(64, 158, 255, 0.5);
  // }

  // Tiptap highlight扩展的样式（支持多颜色）
  // 确保有 data-color 属性的 mark 元素使用 TipTap 扩展设置的颜色
  // TipTap 扩展会通过内联 style 设置 background-color，优先级高于类选择器
  // mark.search-highlight[data-color] {
  //   // padding: 1px 2px;
  //   // border-radius: 2px;
  //   // 移除强制背景色，让内联样式生效
  //   // background-color: unset !important;
  //   // 颜色由 TipTap 扩展通过 style 属性设置
  // }

  // 笔记大纲样式
  p[data-note-outline] {
    position: relative;
    margin: 6px 0;
    // 缩进通过 renderHTML 中的 style 属性控制（padding-left: level * 24px）
    // 但需要为控制按钮留出空间
    min-height: 24px;
    line-height: 1.6;
    display: block;
    width: 100%;

    &:hover {
      .note-outline-controls {
        opacity: 1 !important;
        pointer-events: auto !important;
      }
    }
  }

  // 控制按钮容器（使用全局样式，因为是通过装饰器添加的）
  :global(.note-outline-controls) {
    position: absolute;
    left: -50px;
    top: 50%;
    transform: translateY(-50%);
    height: 20px;
    display: flex;
    align-items: center;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
    z-index: 10;

    .note-outline-toggle {
      width: 16px;
      height: 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 10px;
      color: var(--text-base, #333);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border-radius: 2px;
      transition: background-color 0.2s;
      flex-shrink: 0;

      &:hover {
        background-color: var(--bg-mute, rgba(0, 0, 0, 0.05));
      }
    }

    .note-outline-spacer {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .note-outline-drag-handle {
      width: 12px;
      height: 12px;
      cursor: grab !important;
      font-size: 10px;
      color: var(--text-mute, #999);
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      user-select: none;
      flex-shrink: 0;
      pointer-events: auto !important;

      &:hover {
        cursor: grab !important;
        color: var(--text-base, #333);
      }

      &:active {
        cursor: grabbing !important;
      }
    }
  }

  // 当段落悬停时显示控制按钮
  p[data-note-outline]:hover ~ :global(.note-outline-controls),
  p[data-note-outline]:hover :global(.note-outline-controls) {
    opacity: 1 !important;
    pointer-events: auto !important;
  }

  // 确保段落悬停时，控制按钮可以交互
  p[data-note-outline]:hover {
    :global(.note-outline-controls) {
      opacity: 1 !important;
      pointer-events: auto !important;

      .note-outline-drag-handle {
        pointer-events: auto !important;
        cursor: grab !important;
      }
    }
  }
}

/* 段落字数校验按钮样式 */
.paragraph-check-button {
  margin-left: 10px;
}

/* 段落跳转后的呼吸闪烁动画 */
:deep(.paragraph-highlight-flash) {
  animation: paragraph-breath 1.5s ease-in-out 2;
  position: relative;
}

@keyframes paragraph-breath {
  0%, 100% {
    background-color: transparent;
    box-shadow: none;
  }
  50% {
    background-color: rgba(255, 193, 7, 0.2);
    box-shadow: 0 0 0 4px rgba(255, 193, 7, 0.3), 
                0 0 0 8px rgba(255, 193, 7, 0.1);
  }
}

/* 光标呼吸闪烁动画 - 更醒目的样式 */
:deep(.paragraph-highlight-flash) {
  .ProseMirror-focused & {
    caret-color: #ff9800;
  }
}

/* 自定义光标闪烁效果 */
:deep(.ProseMirror-focused .paragraph-highlight-flash::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(to bottom, #ff9800, #ffc107, #ff9800);
  animation: cursor-pulse 1s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(255, 152, 0, 0.8),
              0 0 20px rgba(255, 152, 0, 0.4);
}

@keyframes cursor-pulse {
  0%, 100% {
    opacity: 1;
    transform: scaleY(1);
  }
  50% {
    opacity: 0.4;
    transform: scaleY(1.2);
  }
}

/* 章节选择器动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease; // 动画时长 0.3 秒
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0; // 初始/结束透明度为 0
  transform: translateY(-20px); // 初始/结束位置向上偏移 20 像素
}

/* 段落字数校验结果弹窗样式 */
.check-result-empty {
  padding: 40px 0;
  text-align: center;
}

.check-result-list {
  .result-summary {
    padding: 10px 0;
    font-size: 14px;
    color: var(--text-base, #333);
    border-bottom: 1px solid var(--border, #e0e0e0);
    margin-bottom: 10px;
    
    .highlight-number {
      color: #f56c6c;
      font-weight: bold;
      font-size: 16px;
    }
  }
  
  .paragraph-item {
    padding: 12px;
    margin-bottom: 8px;
    border: 1px solid var(--border, #e0e0e0);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background-color: var(--bg-mute, #f5f5f5);
      border-color: var(--primary, #409eff);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .paragraph-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      font-size: 13px;
      
      .paragraph-index {
        font-weight: bold;
        color: var(--text-base, #333);
      }

      .editor-label-tag {
        margin-right: 4px;
      }
      
      .paragraph-length {
        color: var(--text-secondary, #666);
      }
      
      .over-length {
        color: #f56c6c;
        font-weight: bold;
        margin-left: auto;
      }
    }
    
    .paragraph-preview {
      font-size: 12px;
      color: var(--text-secondary, #666);
      line-height: 1.5;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
