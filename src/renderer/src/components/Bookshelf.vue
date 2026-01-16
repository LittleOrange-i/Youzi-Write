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
            @click="() => { readBooksDir(); refreshChart();  ElMessage.success('刷新成功') }"
            class="p-2.5 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-600"
          >
            <el-icon class="text-lg"><Refresh /></el-icon>
          </button>
        </div>
        
        <!-- 主题选择器 -->
        <ThemeSelector />
      </div>
    </div>

    <!-- 新建/编辑书籍弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑书籍' : '新建书籍'" width="700px">
      <div class="flex gap-6">
        <!-- 左侧：封面预览区域 -->
        <div class="flex-shrink-0">
          <div class="cover-preview-container">
            <div 
              class="cover-preview"
              :style="previewCoverStyle"
            >
              <!-- 半透明遮罩 -->
              <div class="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/40"></div>
              
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
                      <span class="text-[9.33px] font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">200万字</span>
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

            
            <el-form-item prop="type" label="类型">
              <el-select v-model="form.type" placeholder="请选择类型">
                <el-option
                  v-for="item in BOOK_TYPES"
                  :key="item.value + item.label"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
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
          @on-open="onOpen(book)"
          @on-edit="onEdit(book)"
          @on-delete="onDelete(book)"
        />
      </div>
    </div>

    <!-- 图表区域 - 固定在底部 -->
    <div class="flex-shrink-0 px-8 pb-6 pt-2">
      <WordCountChart ref="chartRef" height="240px" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import Book from './Book.vue'
import WordCountChart from './WordCountChart.vue'
import ThemeSelector from './ThemeSelector.vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { useMainStore } from '@renderer/stores'
import { BOOK_TYPES } from '@renderer/constants/config'
import { readBooksDir, createBook, deleteBook, updateBook } from '@renderer/service/books'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const mainStore = useMainStore()
const router = useRouter()

// 新建书籍弹窗相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const editBookId = ref('')
const formRef = ref(null)
const form = ref({
  name: '',
  author: '',
  type: '',
  targetCount: 100000,
  intro: '',
  originalName: '',
  password: '',
  confirmPassword: '',
  coverUrl: '' // 书籍封面URL
})
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
        backgroundPosition: 'center'
      }
    }
    // 如果是网络路径，直接使用
    else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return {
        backgroundImage: `url("${imageUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
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
        backgroundPosition: 'center'
      }
    }
  } else {
    // 默认渐变背景
    return {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
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
function onOpen(book) {
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
        name: book.name
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
  form.value.type = book.type
  form.value.targetCount = book.targetCount
  form.value.intro = book.intro
  form.value.password = book.password || ''
  form.value.confirmPassword = book.password || ''
  form.value.coverUrl = book.coverUrl || '' // 加载封面URL
  // 保存原始书名，用于定位文件夹
  form.value.originalName = book.name
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
        id: randomId,
        name: form.value.name,
        author: form.value.author || '佚名',
        type: form.value.type,
        typeName: BOOK_TYPES.find((item) => item.value === form.value.type)?.label,
        targetCount: form.value.targetCount,
        intro: form.value.intro,
        password: form.value.password || null,
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
  form.value.author = ''
  form.value.type = ''
  form.value.targetCount = 10000
  form.value.intro = ''
  form.value.originalName = ''
  form.value.password = ''
  form.value.confirmPassword = ''
  form.value.coverUrl = '' // 重置封面URL
  dialogVisible.value = true
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

// 刷新图表数据
async function refreshChart() {
  chartRef.value?.updateData()
}

onMounted(() => {
  readBooksDir()
  refreshChart()
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
  letter-spacing: 0.15em;
  line-height: 1.2;
}
</style>


