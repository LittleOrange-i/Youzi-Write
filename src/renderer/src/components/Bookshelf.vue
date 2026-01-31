<template>
  <div class="flex-1 flex flex-col h-screen bookshelf-background">
    <!-- 顶部操作栏 - 现代化设计 -->
    <div class="flex-shrink-0 px-8 py-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 z-10 relative">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button
            @click="handleNewBook"
            class="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transform hover:scale-105"
          >
            <el-icon class="text-lg"><Plus /></el-icon>
            <span>新建书籍</span>
          </button>

          <button
            @click="handleExportBookshelf"
            class="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg border border-green-500"
            title="导出整个书架"
          >
            <el-icon class="text-lg"><Upload /></el-icon>
            <span>导出书架</span>
          </button>
          <button
            @click="handleImportBookshelf"
            class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg border border-blue-500"
            title="导入书架"
          >
            <el-icon class="text-lg"><Download /></el-icon>
            <span>导入书架</span>
          </button>

          <button
            @click="() => { readBooksDir(); refreshChart();  ElMessage.success('刷新成功') }"
            class="p-2.5 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-600"
          >
            <el-icon class="text-lg"><Refresh /></el-icon>
          </button>

          <!-- 更新按钮 -->
          <button
            v-if="hasUpdate"
            @click="updateDialogVisible = true"
            class="p-2.5 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-600"
            title="发现新版本"
          >
            <img :src="updateIcon" class="w-[18px] h-[18px]" alt="更新" />
          </button>
        </div>
        
        <!-- 主题选择器 -->
        <ThemeSelector />
      </div>
    </div>

    <!-- 新建/编辑书籍弹窗 - 限制最大高度并支持内部滚动 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑书籍' : '新建书籍'" 
      width="700px"
      destroy-on-close
      top="15vh"
      class="custom-book-dialog"
    > <!-- 弹窗容器 -->
      <div class="dialog-scroll-content"> <!-- 内部滚动容器 -->
        <div class="flex gap-6 p-1"> <!-- 内容布局容器 -->
          <!-- 左侧：封面预览区域 -->
        <div class="flex-shrink-0">
          <div class="cover-preview-container">
            <div 
              class="cover-preview"
              :style="previewCoverStyle"
            >

              <!-- 渐变光效 -->
              <div class="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-white/0 to-purple-900/30 transition-opacity duration-500"></div>
              
              <!-- 预览内容区 -->
              <div class="relative h-full flex">
                <!-- 左侧信息栏 (75%宽度) - 不使用整体磨砂 -->
                <div class="w-[75%] flex flex-col justify-between p-2 ">
                  <!-- 顶部：类型标签 -->
                  <div class="flex items-start justify-start">
                    <div class="inline-flex items-center gap-[0.17rem] px-[0.33rem] py-[0.17rem] bg-gradient-to-r from-amber-500/90 to-orange-500/90 rounded shadow-lg">
                      <svg class="w-[0.42rem] h-[0.42rem] text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
                      </svg>
                      <span class="text-[8px] font-bold text-white whitespace-nowrap">{{ form.type ? BOOK_TYPES.find(t => t.value === form.type)?.label : '类型' }}</span>
                    </div>
                  </div>
                  
                  <!-- 底部信息区 - 添加磨砂效果 -->
                  <div class="flex flex-col gap-[0.33rem] -ml-[0.17rem] p-[0.08rem] rounded-lg bg-black/30 backdrop-blur-sm border border-white/20">
                    <!-- 作者信息 -->
                    <div class="flex items-center gap-[0.17rem]">
                      <svg class="w-[0.58rem] h-[0.58rem] flex-shrink-0 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                      </svg>
                      <span class="text-[8px] font-semibold text-white break-all drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{{ form.author || '佚名' }}</span>
                    </div>

                    <!-- 字数统计 -->
                    <div class="flex items-center gap-[0.17rem]">
                      <svg class="w-[0.58rem] h-[0.58rem] flex-shrink-0 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
                      </svg>
                      <span class="text-[9.33px] font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">200 万字</span>
                    </div>
                    
                    <!-- 更新时间 - 显示到秒 -->
                    <div class="flex items-center gap-[0.17rem]">
                      <svg class="w-[0.58rem] h-[0.58rem] flex-shrink-0 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                      </svg>
                      <span class="text-[7.33px] font-semibold text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">01/01 12:00:00</span>
                    </div>
                  </div>
                </div>

                <!-- 右侧书名栏 (25%宽度) - 纵向显示，紧贴右边，顶部对齐 -->
                <div class="flex-1 flex items-start justify-end pr-[0.67rem] pt-[0.17rem] pb-[1rem]">
                  <!-- 第二列（右侧）- 显示第9-15个字符 -->
                  <div v-if="(form.name || '书名预览').length > 8" class="vertical-title-container">
                    <h3 
                      class="vertical-title text-white font-black tracking-widest"
                      :style="{ fontSize: getPreviewTitleSize() + 'px', writingMode: 'vertical-rl', textOrientation: 'upright' }"
                    >
                      <span style="visibility: hidden;">空</span>{{ (form.name || '书名预览').slice(8) }}
                    </h3>
                  </div>
                  <!-- 第一列（右侧）- 显示前8个字符 -->
                  <div class="vertical-title-container">
                    <h3 
                      class="vertical-title text-white font-black tracking-widest"
                      :style="{ fontSize: getPreviewTitleSize() + 'px', writingMode: 'vertical-rl', textOrientation: 'upright' }"
                    >
                      {{ (form.name || '书名预览').slice(0, 8) }}
                    </h3>
                  </div>
                </div>
              </div>
              
              <!-- 无封面提示 -->
              <div v-if="!form.coverUrl" class="absolute inset-0 flex items-center justify-center text-white/40 text-xs pointer-events-none">
                <span>预览</span>
              </div>
            </div>
            <div class="text-xs text-gray-500 text-center mt-2">封面预览</div>
          </div>
        </div>

        <!-- 右侧：表单区域 -->
        <div class="flex-1 min-w-0">
          <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
            <el-form-item prop="name" label="书名">
              <el-input
                v-model="form.name"
                placeholder="请输入书籍名称（最多15个字符）"
                maxlength="15"
                show-word-limit
              />
            </el-form-item>

                        <el-form-item prop="coverUrl" label="书籍封面">
              <el-input
                v-model="form.coverUrl"
                placeholder="支持网络链接或本地图片路径（可选）"
                clearable
              >
                <template #append>
                  <el-button @click="selectLocalCover">选择本地</el-button>
                </template>
              </el-input>
              <!-- <div class="text-xs text-gray-500 mt-1">
                支持网络链接或本地图片路径，不设置则使用默认封面
              </div> -->
            </el-form-item>
            <el-form-item prop="author" label="作者">
              <el-input
                v-model="form.author"
                placeholder="请输入作者名称"
                maxlength="10"
                show-word-limit
              />
            </el-form-item>

            
            <el-form-item prop="type" label="作品分类"> <!-- 作品分类表单项 -->
              <el-select v-model="form.type" placeholder="请选择类型" class="w-full"> <!-- 分类选择框 -->
                <el-option
                  v-for="item in BOOK_TYPES"
                  :key="item.value + item.label"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="作品标签"> <!-- 作品标签表单项 -->
              <div class="flex flex-col gap-3 w-full"> <!-- 纵向布局容器 -->
                <div class="flex items-center gap-2"> <!-- 横向输入容器 -->
                  <el-input
                    v-model="newTag"
                    placeholder="添加自定义标签..."
                    maxlength="8"
                    show-word-limit
                    class="flex-1"
                    @keyup.enter="handleAddTag"
                  /> <!-- 标签输入框 -->
                  <el-button type="primary" plain @click="handleAddTag"> <!-- 添加按钮 -->
                    <el-icon><Plus /></el-icon>添加
                  </el-button>
                  
                  <el-popover placement="bottom" :width="300" trigger="click"> <!-- 标签墙弹出框 -->
                    <template #reference>
                      <el-button type="info" plain class="tag-wall-btn"> <!-- 标签墙触发按钮 -->
                        标签墙 <el-icon class="ml-1"><ArrowDown /></el-icon>
                      </el-button>
                    </template>
                    <div class="tag-wall-content"> <!-- 标签墙内容容器 -->
                      <div v-if="tagWall.length === 0" class="text-gray-400 text-center py-4 text-xs"> <!-- 空状态 -->
                        暂无保存的标签
                      </div>
                      <div v-else class="flex flex-wrap gap-2"> <!-- 标签列表 -->
                        <el-tag
                          v-for="tag in tagWall"
                          :key="tag"
                          :type="form.tags.includes(tag) ? 'primary' : 'info'"
                          class="cursor-pointer hover:opacity-80 transition-opacity"
                          @click="toggleTagFromWall(tag)"
                        > <!-- 单个标签 -->
                          {{ tag }}
                        </el-tag>
                      </div>
                      <div v-if="tagWall.length > 0" class="mt-3 pt-2 border-t border-gray-100 flex justify-end"> <!-- 清空功能 -->
                        <el-button 
                          size="small" 
                          type="danger" 
                          link 
                          @click="() => { tagWall = []; localStorage.removeItem('tagWall'); ElMessage.success('标签墙已清空') }"
                        >
                          清空标签墙
                        </el-button>
                      </div>
                    </div>
                  </el-popover>
                </div>

                <!-- 已选标签展示 -->
                <div v-if="form.tags.length > 0" class="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700"> <!-- 已选标签容器 -->
                  <div class="w-full text-xs text-gray-500 mb-1 flex justify-between items-center"> <!-- 计数信息 -->
                    <span>已选择 {{ form.tags.length }}/8</span>
                    <el-button type="primary" link size="small" @click="form.tags = []">清除全部</el-button>
                  </div>
                  <el-tag
                    v-for="tag in form.tags"
                    :key="tag"
                    closable
                    type="primary"
                    class="custom-selected-tag"
                    @close="handleRemoveTag(tag)"
                  > <!-- 已选标签项 -->
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
            </el-form-item>
            <el-form-item prop="targetCount" label="目标字数">
              <el-input
                v-model="form.targetCount"
                placeholder="请输入目标字数"
                type="number"
                :min="10000"
                :max="10000000"
                :step="10000"
              />
            </el-form-item>
            <el-form-item prop="intro" label="简介">
              <el-input v-model="form.intro" type="textarea" :rows="5" placeholder="请输入简介" />
            </el-form-item>
            <el-form-item prop="password" label="密码">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入4-8位数字或字母组合（可选）"
                maxlength="8"
                show-password
              />
            </el-form-item>
            <el-form-item prop="confirmPassword" label="确认密码">
              <el-input
                v-model="form.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                maxlength="8"
                show-password
              />
            </el-form-item>

          </el-form>
        </div>
      </div>
      </div> <!-- 结束内部滚动容器 -->
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">{{ isEdit ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>

    <!-- 密码验证弹框 -->
    <el-dialog v-model="passwordDialogVisible" title="密码验证" width="400px">
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="80px"
      >
        <el-form-item prop="password" label="密码">
          <el-input
            v-model="passwordForm.password"
            type="password"
            placeholder="请输入书籍密码"
            maxlength="8"
            show-password
            @keyup.enter="handlePasswordConfirm"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePasswordConfirm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 书籍列表 - 网格布局 -->
    <div class="flex-1 min-h-0 overflow-y-auto px-8 py-6">
      <div v-if="books.length === 0" class="h-full flex items-center justify-center">
        <el-empty description="暂无书籍" />
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-x-5 gap-y-8">
        <Book
          v-for="book in books"
          :key="book.id"
          :id="book.id"
          :name="book.name"
          :type="book.type"
          :type-name="book.typeName"
          :author="book.author"
          :total-words="book.totalWords"
          :updated-at="book.updatedAt"
          :cover-url="book.coverUrl"
          :tags="book.tags"
          :intro="book.intro"
          @on-open="onOpen(book)"
          @on-edit="onEdit(book)"
          @on-delete="onDelete(book)"
          @on-show-detail="handleShowDetail"
        />
      </div>
    </div>

    <!-- 书籍详情弹窗 - 移至 Bookshelf 层级，解决 transform 和 width/scroll 问题 -->
    <el-dialog
      v-model="detailVisible"   
      width="700px"  
      destroy-on-close   
      top="10vh"  
      class="custom-book-dialog detail-dialog"   
    > <!-- 详情展示弹窗组件开始 -->
      <div class="dialog-scroll-content"> <!-- 弹窗内部的滚动视图容器 -->
        <div v-if="selectedBook" class="flex flex-col gap-6"> <!-- 书籍详情内容的弹性布局容器 -->
          <!-- 书籍基本信息卡片 -->
          <div class="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm"> <!-- 基本信息卡片 -->
            <div class="w-24 aspect-[1/1.45] rounded-lg shadow-md overflow-hidden flex-shrink-0"> <!-- 封面图片容器 -->
              <div class="w-full h-full bg-[#c4b5d8] bg-cover bg-center" :style="getCoverStyleForDetail(selectedBook)"></div> <!-- 封面图展示 -->
            </div> <!-- 封面结束 -->
            <div class="flex-1 flex flex-col justify-between py-1"> <!-- 右侧文字信息栏 -->
              <div class="flex flex-col gap-2"> <!-- 标题标签区 -->
                <h3 class="text-lg font-bold text-gray-800 dark:text-white leading-tight">{{ selectedBook.name }}</h3> <!-- 书名显示 -->
                <div class="flex items-center gap-2"> <!-- 类型作者行 -->
                  <el-tag size="small" type="warning" effect="dark" class="rounded">{{ selectedBook.typeName }}</el-tag> <!-- 类型标签 -->
                  <span class="text-sm text-gray-600 dark:text-gray-400 font-medium">作者：{{ selectedBook.author }}</span> <!-- 作者名称 -->
                </div> <!-- 类型作者行结束 -->
                <!-- 作品标签 -->
                <div v-if="selectedBook.tags && selectedBook.tags.length > 0" class="flex flex-wrap gap-1.5 mt-1"> <!-- 标签展示容器 -->
                  <el-tag v-for="tag in selectedBook.tags" :key="tag" size="small" type="primary" plain class="rounded-full px-2">{{ tag }}</el-tag> <!-- 循环显示标签 -->
                </div> <!-- 标签展示结束 -->
              </div> <!-- 顶部信息区结束 -->
              <div class="flex flex-col gap-1.5"> <!-- 底部统计信息区 -->
                <div class="text-xs text-gray-500 flex items-center gap-1"> <!-- 字数统计行 -->
                  <span>累计创作：</span> <!-- 文本提示 -->
                  <span class="text-primary-600 font-bold">{{ formatWordsForDetail(selectedBook.totalWords) }}</span> <!-- 字数数值 -->
                </div> <!-- 字数统计行结束 -->
                <div class="text-xs text-gray-500">最后更新：{{ formatFullDateTimeForDetail(selectedBook.updatedAt) }}</div> <!-- 最后更新时间 -->
              </div> <!-- 底部统计区结束 -->
            </div> <!-- 文字信息栏结束 -->
          </div> <!-- 基本信息卡片结束 -->

          <!-- 故事简介 -->
          <div class="flex flex-col gap-3"> <!-- 简介模块容器 -->
            <div class="flex items-center gap-2 px-1"> <!-- 简介标题行 -->
              <div class="w-1 h-4 bg-primary-500 rounded-full"></div> <!-- 装饰条 -->
              <span class="text-sm font-bold text-gray-700 dark:text-gray-300">故事简介</span> <!-- 模块标题 -->
            </div> <!-- 简介标题行结束 -->
            <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 leading-7 whitespace-pre-wrap min-h-[120px]"> <!-- 简介内容区 -->
              {{ selectedBook.intro || '暂无简介' }} <!-- 简介文本显示 -->
            </div> <!-- 内容区结束 -->
          </div> <!-- 简介模块结束 -->
        </div> <!-- 详情内容容器结束 -->
      </div> <!-- 滚动容器结束 -->
      <template #footer> <!-- 弹窗页脚 -->
        <div class="px-2 pb-2"> <!-- 页脚内边距容器 -->
          <el-button type="primary" class="w-full h-10 rounded-lg font-bold shadow-md shadow-primary-500/20" @click="detailVisible = false">返回书架</el-button> <!-- 关闭按钮 -->
        </div> <!-- 页脚内边距结束 -->
      </template> <!-- 页脚模板结束 -->
    </el-dialog> <!-- 详情弹窗组件结束 -->

    <!-- 图表区域 - 固定在底部 -->
    <div class="flex-shrink-0 px-8 pb-6 pt-2">
      <WordCountChart ref="chartRef" height="240px" />
    </div>

    <!-- 更新弹窗 -->
    <UpdateDialog
      v-model="updateDialogVisible"
      :version-info="updateInfo"
      :current-version="currentVersion"
      @ignore="handleIgnoreUpdate"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, h } from 'vue'
import Book from './Book.vue'
import WordCountChart from './WordCountChart.vue'
import ThemeSelector from './ThemeSelector.vue'
import UpdateDialog from './UpdateDialog.vue'
import updateIcon from '../../../../static/update.png'
import { Plus, Refresh, Upload, Download, Check, ArrowDown } from '@element-plus/icons-vue' // 导入图标组件
import { useMainStore } from '@renderer/stores'
import { BOOK_TYPES } from '@renderer/constants/config'
import { readBooksDir, createBook, deleteBook, updateBook } from '@renderer/service/books'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'

const mainStore = useMainStore()
const router = useRouter()

// 更新相关
const updateDialogVisible = ref(false)
const hasUpdate = ref(false)
const updateInfo = ref(null)
const currentVersion = ref('')

async function checkUpdate() {
  if (!window.electron || !window.electron.checkForUpdates) return
  
  try {
    currentVersion.value = await window.electron.getAppVersion()
    const result = await window.electron.checkForUpdates()
    
    if (result && result.updateAvailable) {
      updateInfo.value = result
      hasUpdate.value = true
      
      // 检查是否忽略过此版本
      const ignoredVersion = localStorage.getItem('ignoredUpdateVersion')
      if (ignoredVersion !== result.version) {
        updateDialogVisible.value = true
      }
    }
  } catch (error) {
    console.error('检查更新失败:', error)
  }
}

function handleIgnoreUpdate() {
  if (updateInfo.value?.version) {
    localStorage.setItem('ignoredUpdateVersion', updateInfo.value.version)
  }
}

// 新建书籍弹窗相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const detailVisible = ref(false) // 详情弹窗显示状态
const selectedBook = ref(null) // 当前选中的书籍数据
const editBookId = ref('')
const formRef = ref(null)
const form = ref({
  name: '',
  author: '',
  type: '', // 书籍类型
  tags: [], // 作品标签
  targetCount: 100000, // 目标字数
  intro: '', // 简介
  originalName: '', // 原始书名
  password: '', // 密码
  confirmPassword: '', // 确认密码
  coverUrl: '' // 书籍封面URL
})
// 标签墙数据，从本地存储读取
const tagWall = ref(JSON.parse(localStorage.getItem('tagWall') || '[]')) // 标签墙
const newTag = ref('') // 新输入的标签内容

// 添加新标签
const handleAddTag = () => { // 添加标签函数
  const tag = newTag.value.trim() // 去除空格
  if (!tag) return // 为空则返回
  if (tag.length > 8) { // 长度限制
    ElMessage.warning('标签长度不能超过8个字') // 警告提示
    return // 返回
  }
  if (form.value.tags.includes(tag)) { // 检查重复
    ElMessage.warning('该标签已存在') // 警告提示
    return // 返回
  }
  if (form.value.tags.length >= 8) { // 限制标签数量
    ElMessage.warning('最多只能添加8个标签') // 警告提示
    return // 返回
  }
  form.value.tags.push(tag) // 添加到当前书籍标签
  if (!tagWall.value.includes(tag)) { // 如果标签墙没有
    tagWall.value.push(tag) // 添加到标签墙
    localStorage.setItem('tagWall', JSON.stringify(tagWall.value)) // 保存到本地
  }
  newTag.value = '' // 清空输入框
}

// 删除已选标签
const handleRemoveTag = (tag) => { // 删除标签函数
  form.value.tags = form.value.tags.filter(t => t !== tag) // 过滤掉要删除的标签
}

// 从标签墙选择或取消选择
const toggleTagFromWall = (tag) => { // 切换标签墙标签函数
  if (form.value.tags.includes(tag)) { // 如果已选择
    handleRemoveTag(tag) // 则移除
  } else { // 如果未选择
    if (form.value.tags.length >= 8) { // 限制标签数量
      ElMessage.warning('最多只能选择8个标签') // 警告提示
      return // 返回
    }
    form.value.tags.push(tag) // 添加标签
  }
}
const rules = ref({
  name: [
    { required: true, message: '请输入书籍名称', trigger: 'blur' },
    { max: 20, message: '书名不能超过20个字符', trigger: 'blur' }
  ],
  author: [
    { required: true,max: 20, message: '作者名称', trigger: 'blur' }
  ],
  type: [{ required: true, message: '请选择类型', trigger: 'blur' }],
  targetCount: [{ required: true, message: '请输入目标字数', trigger: 'blur' }],
  intro: [{ required: true, message: '请输入简介', trigger: 'blur' }],
  password: [
    {
      validator: (rule, value, callback) => {
        if (value && !/^[a-zA-Z0-9]{4,8}$/.test(value)) {
          callback(new Error('密码必须是4-8位数字或字母组合'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    {
      validator: (rule, value, callback) => {
        if (form.value.password && value !== form.value.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

// 书籍列表数据
const books = computed(() => mainStore.books)

// 封面预览样式计算
const previewCoverStyle = computed(() => {
  if (form.value.coverUrl) {
    let imageUrl = form.value.coverUrl
    
    // 如果包含 URL 编码的 data: 标记，先解码
    if (imageUrl.includes('data%3Aimage') || imageUrl.includes('data%3aimage')) {
      try {
        imageUrl = decodeURIComponent(imageUrl)
      } catch (e) {
        console.warn('URL解码失败:', e)
      }
    }
    
    // 优先检查：如果是 base64 数据URL，直接使用
    if (imageUrl.startsWith('data:image/')) {
      return {
        backgroundImage: `url("${imageUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#c4b5d8'
      }
    }
    // 如果是网络路径，直接使用
    else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return {
        backgroundImage: `url("${imageUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#c4b5d8'
      }
    } 
    else {
      // 本地路径使用 atom:// 协议（Electron 安全协议）
      // 将 Windows 反斜杠转换为正斜杠，并使用 encodeURI 保留路径结构
      const normalizedPath = imageUrl.replace(/\\/g, '/')
      const encodedPath = encodeURI(normalizedPath)
      return {
        backgroundImage: `url("atom://${encodedPath}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#c4b5d8'
      }
    }
  } else {
    // 默认背景：与书架封面一致的淡紫色
    return {
      backgroundColor: '#c4b5d8'
    }
  }
})

const chartRef = ref(null)

// 密码验证相关
const passwordDialogVisible = ref(false)
const passwordFormRef = ref(null)
const passwordForm = ref({
  password: ''
})
const passwordRules = ref({
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
})
const pendingAction = ref(null) // 存储待执行的操作
const currentBook = ref(null) // 当前操作的书籍

// 打开书籍
// 处理显示书籍详情
function handleShowDetail(book) {
  selectedBook.value = book // 设置选中的书籍数据
  detailVisible.value = true // 显示详情弹窗
}

// 格式化字数显示 (详情弹窗专用)
function formatWordsForDetail(words) {
  const num = Number(words) || 0 // 转换为数字
  if (num >= 10000) { // 如果超过一万
    return (num / 10000).toFixed(1) + ' 万字' // 显示万字
  }
  return num.toString() + '字' // 显示原数字
}

// 格式化完整时间 (详情弹窗专用)
function formatFullDateTimeForDetail(updatedAt) {
  if (!updatedAt || updatedAt === '暂无更新') { // 空值处理
    return '暂无更新'
  }
  const date = dayjs(updatedAt) // 解析日期
  return date.isValid() ? date.format('MM/DD HH:mm:ss') : '暂无更新' // 格式化
}

// 获取封面样式 (详情弹窗专用)
function getCoverStyleForDetail(book) {
  if (!book.coverUrl) return {} // 无封面返回空
  
  let imageUrl = book.coverUrl // 获取封面路径
  
  // URL 解码逻辑
  if (imageUrl.includes('data%3Aimage') || imageUrl.includes('data%3aimage')) {
    try {
      imageUrl = decodeURIComponent(imageUrl) // 解码
    } catch (e) {
      console.warn('URL解码失败:', e)
    }
  }
  
  // 基础 Base64 处理
  if (imageUrl.startsWith('data:image/')) {
    return { backgroundImage: `url("${imageUrl}")` }
  }
  
  // 网络路径处理
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return { backgroundImage: `url("${imageUrl}")` }
  } 
  
  // 本地路径处理 (atom 协议)
  const normalizedPath = imageUrl.replace(/\\/g, '/') // 转换路径斜杠
  const encodedPath = encodeURI(normalizedPath) // 编码路径
  return { backgroundImage: `url("atom://${encodedPath}")` }
}

const onOpen = (book) => {
  if (book.password) {
    // 有密码，需要验证
    currentBook.value = book
    pendingAction.value = 'open'
    passwordForm.value.password = ''
    passwordDialogVisible.value = true
  } else {
    // 无密码，直接打开
    executeOpenBook(book)
  }
}

// 执行打开书籍操作
function executeOpenBook(book) {
  // 通过 Electron API 请求主进程打开新窗口
  if (window.electron && window.electron.openBookEditorWindow) {
    window.electron.openBookEditorWindow(book.id, book.name)
  } else {
    // 兼容老逻辑
    router.push({
      path: '/editor',
      query: {
        name: book.name,
        reset: 'true'
      }
    })
  }
}

// 右键菜单相关
function onEdit(book) {
  if (book.password) {
    // 有密码，需要验证
    currentBook.value = book
    pendingAction.value = 'edit'
    passwordForm.value.password = ''
    passwordDialogVisible.value = true
  } else {
    // 无密码，直接编辑
    executeEditBook(book)
  }
}

// 执行编辑书籍操作
function executeEditBook(book) {
  isEdit.value = true
  editBookId.value = book.id
  dialogVisible.value = true
  form.value.name = book.name
  form.value.author = book.author || ''
  form.value.type = book.type // 加载类型
  form.value.tags = book.tags || [] // 加载标签数据，若无则默认为空数组
  form.value.targetCount = book.targetCount // 加载目标字数
  form.value.intro = book.intro // 加载简介
  form.value.password = book.password || '' // 加载密码
  form.value.confirmPassword = book.password || '' // 加载确认密码
  form.value.coverUrl = book.coverUrl || '' // 加载封面URL
  // 保存原始书名，用于定位文件夹
  form.value.originalName = book.name // 保存原始书名
}

async function onDelete(book) {
  if (book.password) {
    // 有密码，需要验证
    currentBook.value = book
    pendingAction.value = 'delete'
    passwordForm.value.password = ''
    passwordDialogVisible.value = true
  } else {
    // 无密码，直接删除
    executeDeleteBook(book)
  }
}

// 执行删除书籍操作
async function executeDeleteBook(book) {
  try {
    console.log('准备删除书籍:', book)
    await ElMessageBox.confirm(`确定要删除《${book.name}》吗？此操作不可恢复！`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    console.log('调用删除函数，书名:', book.name)
    const result = await deleteBook(book.name)
    console.log('删除结果:', result)
    if (result) {
      ElMessage.success('删除成功')
      await readBooksDir()
    } else {
      ElMessage.error('删除失败，书籍不存在或已被删除')
    }
  } catch (e) {
    // 用户取消或删除失败
    if (e !== 'cancel') {
      console.error('删除书籍失败:', e)
      ElMessage.error('删除失败，请重试')
    }
  }
}

// 密码验证处理
async function handlePasswordConfirm() {
  try {
    await passwordFormRef.value.validate()

    if (passwordForm.value.password === currentBook.value.password) {
      // 密码正确，执行对应操作
      passwordDialogVisible.value = false

      switch (pendingAction.value) {
        case 'open':
          executeOpenBook(currentBook.value)
          break
        case 'edit':
          executeEditBook(currentBook.value)
          break
        case 'delete':
          await executeDeleteBook(currentBook.value)
          break
      }

      // 清理状态
      pendingAction.value = null
      currentBook.value = null
    } else {
      ElMessage.error('密码错误，请重新输入')
    }
  } catch (error) {
    console.error('密码验证失败:', error)
  }
}

async function handleConfirm() {
  formRef.value.validate(async (valid) => {
    if (valid) {
      // 校验同名书籍
      const exists = books.value.some(
        (b) => b.name === form.value.name && (!isEdit.value || b.id !== editBookId.value)
      )
      if (exists) {
        ElMessage.error('已存在同名书籍，不能重复创建！')
        return
      }
      const randomId = isEdit.value
        ? editBookId.value
        : Date.now().toString() + Math.floor(Math.random() * 10000).toString()
      const bookData = {
        id: randomId, // 书籍 ID
        name: form.value.name, // 书名
        author: form.value.author || '佚名', // 作者名称
        type: form.value.type, // 作品分类
        tags: Array.isArray(form.value.tags) ? [...form.value.tags] : [], // 作品标签，浅拷贝避免 Proxy 问题
        typeName: BOOK_TYPES.find((item) => item.value === form.value.type)?.label, // 分类名称
        targetCount: form.value.targetCount, // 目标字数
        intro: form.value.intro, // 简介
        password: form.value.password || null, // 密码
        coverUrl: form.value.coverUrl || null // 保存封面URL
      }
      if (isEdit.value && editBookId.value) {
        // 编辑模式，调用 updateBook
        const result = await updateBook({
          ...bookData,
          id: editBookId.value,
          originalName: form.value.originalName
        })
        if (!result.success) {
          ElMessage.error(result.message || '编辑失败')
          return
        }
        ElMessage.success('编辑成功')
      } else {
        // 新建模式
        await createBook(bookData)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      isEdit.value = false
      editBookId.value = ''
      await readBooksDir()
    }
  })
}

function handleNewBook() {
  isEdit.value = false
  editBookId.value = ''
  form.value.name = ''
  form.value.author = '' // 重置作者
  form.value.type = '' // 重置类型
  form.value.tags = [] // 重置标签
  form.value.targetCount = 10000 // 重置目标字数
  form.value.intro = '' // 重置简介
  form.value.originalName = '' // 重置原始名
  form.value.password = '' // 重置密码
  form.value.confirmPassword = '' // 重置确认密码
  form.value.coverUrl = '' // 重置封面URL
  dialogVisible.value = true // 显示弹窗
}

// 防止重复点击的标志
const isSelectingCover = ref(false)

// 选择本地封面图片
async function selectLocalCover() {
  // 防止重复点击
  if (isSelectingCover.value) {
    return
  }
  
  try {
    isSelectingCover.value = true
    
    // 调用 Electron API 打开文件选择对话框
    if (window.electron && window.electron.selectImage) {
      const result = await window.electron.selectImage()
      if (result && result.dataUrl) {
        form.value.coverUrl = result.dataUrl
        ElMessage.success('封面图片已选择')
      }
    } else {
      ElMessage.warning('当前环境不支持本地文件选择')
    }
  } catch (error) {
    console.error('选择封面图片失败:', error)
    ElMessage.error('选择封面图片失败')
  } finally {
    // 延迟重置标志，避免对话框关闭时的快速点击
    setTimeout(() => {
      isSelectingCover.value = false
    }, 500)
  }
}

// 根据书名长度动态计算预览图纵向字号（按照 120/180 = 0.667 比例缩放）
function getPreviewTitleSize() {
  const nameLength = form.value.name ? form.value.name.length : 4
  if (nameLength <= 4) {
    return 21.33  // 对应实际的 32px × 0.667
  } else if (nameLength <= 6) {
    return 18.67  // 对应实际的 28px × 0.667
  } else if (nameLength <= 8) {
    return 16  // 对应实际的 24px × 0.667
  } else if (nameLength <= 10) {
    return 13.33  // 对应实际的 20px × 0.667
  } else {
    return 12  // 对应实际的 18px × 0.667
  }
}

// 导出书架
async function handleExportBookshelf() {
  try {
    const loading = ElMessage({
      message: '正在导出书架，请稍候...',
      type: 'info',
      duration: 0
    })
    
    const result = await window.electron.exportBookshelf()
    loading.close()
    
    if (result.success) {
      ElMessage({
        message: `导出成功！共导出 ${result.booksCount} 本书籍，包含 ${result.totalFiles || 0} 个文件`,
        type: 'success',
        duration: 3000
      })
    } else {
      ElMessage({
        message: `导出失败：${result.message}`,
        type: 'error',
        duration: 3000
      })
    }
  } catch (error) {
    ElMessage({
      message: `导出失败：${error.message}`,
      type: 'error',
      duration: 3000
    })
  }
}

// 导入书架
async function handleImportBookshelf() {
  try {
    await ElMessageBox.confirm(
      '导入的书籍将保存到书籍目录中。如果有同名书籍，将提示你选择处理方式。是否继续？',
      '导入书架',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    const loading = ElMessage({
      message: '正在导入书架，请稍候...',
      type: 'info',
      duration: 0
    })
    
    // 第一次调用：获取导入数据和冲突信息
    const result = await window.electron.importBookshelf()
    loading.close()
    
    if (!result.success && result.needUserChoice) {
      // 需要用户选择如何处理冲突
      const importData = result.importData
      const conflictResolutions = {}
      
      // 检查冲突
      const checkResult = await window.electron.checkImportConflicts(importData)
      
      if (checkResult.success && checkResult.conflicts.length > 0) {
        // 构建冲突提示信息
        let conflictMessages = []
        for (const conflict of checkResult.conflicts) {
          const location = conflict.location === 'main' ? '主书架' : '备份区'
          const authorMatch = conflict.sameAuthor ? '（作者相同）' : '（作者不同）'
          conflictMessages.push(`• ${conflict.bookName} - ${location} ${authorMatch}`)
        }
        
        // 创建下拉框选择对话框
        let selectedAction = 'copy' // 默认值
        
        await ElMessageBox({
          title: '处理冲突',
          message: h('div', { style: 'max-height: 400px; overflow-y: auto;' }, [
            h('p', { style: 'margin-bottom: 12px; font-weight: 500;' }, 
              `检测到 ${checkResult.conflicts.length} 本书籍存在冲突：`
            ),
            h('div', { style: 'margin-bottom: 16px; padding: 8px; background: #f5f5f5; border-radius: 4px; max-height: 200px; overflow-y: auto;' },
              conflictMessages.map(msg => 
                h('div', { style: 'padding: 4px 0; color: #606266;' }, msg)
              )
            ),
            h('p', { style: 'margin-bottom: 8px; font-weight: 500;' }, 
              '请为所有冲突书籍选择统一的处理方式：'
            ),
            h('select', {
              id: 'conflict-action-select',
              style: 'width: 100%; padding: 8px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px;',
              onChange: (e) => { selectedAction = e.target.value }
            }, [
              h('option', { value: 'copy' }, 'copy - 创建副本（默认）'),
              h('option', { value: 'overwrite' }, 'overwrite - 覆盖（仅作者相同时有效，否则创建副本）'),
              h('option', { value: 'skip' }, 'skip - 跳过')
            ])
          ]),
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          dangerouslyUseHTMLString: false,
          beforeClose: (action, instance, done) => {
            if (action === 'confirm') {
              const selectElement = document.getElementById('conflict-action-select')
              if (selectElement) {
                selectedAction = selectElement.value
              }
              instance.confirmButtonLoading = false
              done()
            } else {
              done()
            }
          }
        })
        
        const defaultAction = selectedAction || 'copy'
        
        // 为每本书设置处理方式
        for (const book of importData.books) {
          conflictResolutions[book.name] = defaultAction
        }
      } else {
        // 没有冲突，直接导入
        for (const book of importData.books) {
          conflictResolutions[book.name] = 'copy'
        }
      }
      
      // 第二次调用：使用用户选择的冲突解决方案执行导入
      // 传入 importData 和 conflictResolutions,避免再次打开文件选择对话框
      const loading2 = ElMessage({
        message: '正在导入书架，请稍候...',
        type: 'info',
        duration: 0
      })
      
      try {
        const finalResult = await window.electron.importBookshelf({
          importData: importData,
          conflictResolutions: conflictResolutions
        })
        
        loading2.close()
        
        if (finalResult.success) {
          let message = `导入成功！共导入 ${finalResult.importedCount} 本书籍`
          if (finalResult.overwrittenCount > 0) {
            message += `，覆盖 ${finalResult.overwrittenCount} 本`
          }
          if (finalResult.skippedCount > 0) {
            message += `，跳过 ${finalResult.skippedCount} 本`
          }
          // console.log(finalResult)
          message += `\n导入位置：${finalResult.savePath}`
          
          ElMessageBox.alert(message, '导入完成', {
            confirmButtonText: '确定',
            type: 'success',
            callback: () => {
              // 刷新书架列表
              readBooksDir()
            }
          })
        } else {
          ElMessage({
            message: `导入失败：${finalResult.message}`,
            type: 'error',
            duration: 3000
          })
        }
      } catch (error) {
        loading2.close()
        throw error
      }
    } else if (result.success) {
      // 直接成功（没有冲突的情况）
      let message = `导入成功！共导入 ${result.importedCount} 本书籍`
      if (result.skippedCount > 0) {
        message += `，跳过 ${result.skippedCount} 本`
      }

      // console.log(result)
      message += `\n导入位置：${result.savePath }`
      
      ElMessageBox.alert(message, '导入完成', {
        confirmButtonText: '确定',
        type: 'success',
        callback: () => {
          // 刷新书架列表
          readBooksDir()
        }
      })
    } else {
      ElMessage({
        message: `导入失败：${result.message}`,
        type: 'error',
        duration: 3000
      })
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage({
        message: `导入失败：${error.message || error}`,
        type: 'error',
        duration: 3000
      })
    }
  }
}

// 刷新图表数据
async function refreshChart() {
  chartRef.value?.updateData()
}

onMounted(() => {
  readBooksDir()
  refreshChart()
  checkUpdate()
})

onBeforeUnmount(() => {
  // 清理资源
})
</script>


<style lang="scss" scoped>
/* 书架背景渐变 - 跟随主题 */
.bookshelf-background {
  background: var(--bg-primary);
  background-image: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-mute) 100%);
}

/* 封面预览容器 */
.cover-preview-container {
  width: 120px; /* 固定宽度 */
}

/* 封面预览 - 保持 9:16 比例 */
.cover-preview {
  width: 120px;
  aspect-ratio: 1 / 1.45;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
    transform: translateY(-2px);
  }
}

/* 纵向书名样式 */
.vertical-title-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.vertical-title {
  font-family: 'KaiTi', 'STKaiti', '楷体', 'KaiTi_GB2312', serif;
  text-shadow: 
    0 2px 10px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(251, 191, 36, 0.3),
    2px 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.15em; // 字间距
  line-height: 1.2; // 行高
}

/* 标签墙弹出框内部样式 */
.tag-wall-content { // 标签墙内容容器样式
  max-height: 250px; // 最大高度
  overflow-y: auto; // 垂直滚动
  padding: 4px; // 内边距
}

/* 自定义选中的标签样式 */
.custom-selected-tag { // 自定义选中标签样式
  border: none; // 无边框
  background-color: var(--el-color-primary); // 使用主题主色背景
  color: white; // 白色文字
  font-weight: 500; // 字重
  
  :deep(.el-tag__close) { // 关闭图标样式
    color: white; // 白色
    &:hover { // 悬停样式
      background-color: rgba(255, 255, 255, 0.2); // 半透明背景
    }
  }
}

/* 标签墙按钮样式 */
.tag-wall-btn { // 标签墙按钮样式
  color: var(--el-color-primary); // 使用主题主色文字
  border-color: var(--el-color-primary); // 使用主题主色边框
  &:hover, &:focus { // 悬停和聚焦样式
    background-color: var(--el-color-primary-light-9); // 浅色背景
    color: var(--el-color-primary); // 主色文字
    border-color: var(--el-color-primary-light-5); // 浅色边框
  }
}

/* 弹窗样式优化 */
:deep(.custom-book-dialog) { // 弹窗容器深度选择器
  width: 700px !important; // 强制设置弹窗宽度为 700 像素
  margin-left: auto !important; // 自动设置左边距以实现水平居中
  margin-right: auto !important; // 自动设置右边距以实现水平居中
  border-radius: 12px; // 设置弹窗容器的圆角为 12 像素
  overflow: hidden; // 隐藏容器内超出部分的显示
  display: flex; // 开启弹性布局以支持内部自适应
  flex-direction: column; // 设置弹性容器的主轴方向为纵向
  max-height: 70vh; // 限制弹窗的最大高度为视口高度的 70%
  margin-bottom: 15vh; // 设置弹窗底部的外边距距离
  
  .el-dialog__body { // 弹窗主体内容区域样式定义
    padding: 0; // 清除主体区域的默认内边距
    flex: 1; // 设置主体区域自动占据剩余空间
    overflow: hidden; // 隐藏主体区域内溢出的内容
  }
}

/* 弹窗内部滚动容器 */
.dialog-scroll-content { // 滚动容器样式
  max-height: calc(90vh - 120px); // 减去头部和底部的预估高度
  overflow-y: auto; // 开启垂直滚动
  padding: 24px; // 内部内边距
  
  /* 自定义滚动条样式 */
  &::-webkit-scrollbar { // 滚动条宽度
    width: 6px;
  }
  &::-webkit-scrollbar-thumb { // 滚动条滑块
    background: #e5e7eb; // 滑块颜色
    border-radius: 3px; // 滑块圆角
  }
  &::-webkit-scrollbar-track { // 滚动条轨道
    background: transparent; // 轨道透明
  }
}
</style>


