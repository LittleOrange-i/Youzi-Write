<template>
  <el-drawer
    v-model="visible"
    title="禁词管理"
    direction="rtl"
    size="500px"
    header-class="drawer-header"
    :close-on-click-modal="true"
  >
    <!-- 新增禁词输入区 -->
    <div class="add-word-section">
      <el-input v-model="newWord" placeholder="请输入禁词" clearable @keyup.enter="handleAddWord" />
      <el-button type="primary" @click="handleAddWord">新增</el-button>
    </div>

    <el-empty v-if="bannedWords.length === 0" :image-size="200" description="暂无禁词" />
    <!-- 禁词标签列表 -->
    <div v-else class="words-list">
      <el-tag
        v-for="word in bannedWords"
        :key="word"
        class="word-tag"
        closable
        @close="handleDeleteWord(word)"
      >
        {{ word }}
      </el-tag>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useEditorStore } from '@renderer/stores/editor' // 导入编辑器 Store
import { storeToRefs } from 'pinia' // 导入 storeToRefs

const props = defineProps({
  bookName: {
    type: String,
    default: ''
  }
})

const editorStore = useEditorStore() // 获取编辑器 store 实例
const { bannedWords } = storeToRefs(editorStore) // 获取 store 中的响应式禁词列表
const visible = ref(false) // 抽屉可见性状态
const newWord = ref('') // 新禁词输入内容

// 打开抽屉
const open = () => {
  visible.value = true
  loadBannedWords()
}

const close = () => {
  visible.value = false
}

// 加载禁词列表
const loadBannedWords = async () => {
  if (!props.bookName) return
  await editorStore.fetchBannedWords(props.bookName)
}

// 新增禁词
const handleAddWord = async () => {
  const word = newWord.value.trim()

  // 校验：是否为空
  if (!word) {
    ElMessage.warning('请输入禁词')
    return
  }

  // 校验：是否已存在
  if (bannedWords.value.includes(word)) {
    ElMessage.warning('该禁词已存在')
    return
  }

  try {
    const result = await editorStore.addBannedWord(props.bookName, word)
    if (result.success) {
      newWord.value = ''
      ElMessage.success('添加成功')
    } else {
      ElMessage.error(result.message || '添加失败')
    }
  } catch (error) {
    console.error('添加禁词失败:', error)
    ElMessage.error('添加失败')
  }
}

// 删除禁词
const handleDeleteWord = async (word) => {
  try {
    const result = await editorStore.removeBannedWord(props.bookName, word)
    if (result.success) {
      ElMessage.success('删除成功')
    } else {
      ElMessage.error(result.message || '删除失败')
    }
  } catch (error) {
    console.error('删除禁词失败:', error)
    ElMessage.error('删除失败')
  }
}

// 监听bookName变化，重新加载
watch(
  () => props.bookName,
  () => {
    if (visible.value) {
      loadBannedWords()
    }
  }
)

// 暴露方法给父组件
defineExpose({
  open,
  close,
  visible
})
</script>

<style lang="scss" scoped>
.add-word-section {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.words-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  .empty-tip {
    width: 100%;
    text-align: center;
    color: var(--text-secondary);
    padding: 40px 0;
  }

  .word-tag {
    font-size: 14px;
  }
}
</style>
<style lang="scss">
.drawer-header {
  margin-bottom: 0px;
  padding: 15px 20px;
}
</style>
