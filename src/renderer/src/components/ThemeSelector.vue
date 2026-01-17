<template>
  <div class="relative">
    <!-- 主题切换按钮 -->
    <button
      @click="showThemeMenu = !showThemeMenu"
      class="p-2.5 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-600"
      :title="'当前主题: ' + THEME_CONFIGS[themeStore.currentTheme]?.name"
    >
      <!-- 主题图标 -->
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    </button>

    <!-- 点击外部关闭菜单 -->
    <div
      v-if="showThemeMenu"
      @click="showThemeMenu = false"
      class="fixed inset-0 z-40"
      style="pointer-events: auto;"
    ></div>

    <!-- 主题选择菜单 -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="showThemeMenu"
        class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
        @click.stop
        style="pointer-events: auto;"
      >
        <!-- 菜单头部 -->
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-gray-700 dark:to-gray-700">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">选择主题</h3>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">{{ allThemes.length }} 个主题可选</p>
        </div>

        <!-- 主题列表 -->
        <div class="max-h-96 overflow-y-auto py-1">
          <button
            v-for="themeKey in allThemes"
            :key="themeKey"
            @click.stop="handleThemeChange(themeKey)"
            class="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 cursor-pointer"
            :class="{
              'bg-primary-50 dark:bg-primary-900/20': themeStore.currentTheme === themeKey
            }"
          >
            <!-- 主题颜色预览 -->
            <div class="flex gap-1">
              <div
                v-for="(color, index) in getThemeColors(themeKey)"
                :key="index"
                class="w-4 h-4 rounded"
                :style="{ backgroundColor: color }"
              ></div>
            </div>

            <!-- 主题信息 -->
            <div class="flex-1 text-left">
              <div class="flex items-center gap-2">
                <span
                  class="text-sm font-medium"
                  :class="{
                    'text-primary-600 dark:text-primary-400': themeStore.currentTheme === themeKey,
                    'text-gray-900 dark:text-gray-100': themeStore.currentTheme !== themeKey
                  }"
                >
                  {{ THEME_CONFIGS[themeKey]?.name }}
                </span>
                <!-- 当前主题标记 -->
                <svg
                  v-if="themeStore.currentTheme === themeKey"
                  class="w-4 h-4 text-primary-600 dark:text-primary-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {{ THEME_CONFIGS[themeKey]?.description }}
              </p>
            </div>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useThemeStore, THEME_CONFIGS } from '@renderer/stores/theme'

const themeStore = useThemeStore()
const showThemeMenu = ref(false)

// 组件挂载时输出日志
onMounted(() => {
  console.log('[ThemeSelector] 组件已挂载')
  console.log('[ThemeSelector] 当前主题:', themeStore.currentTheme)
  console.log('[ThemeSelector] 主题配置:', THEME_CONFIGS)
})

// 所有主题列表
const allThemes = computed(() => Object.keys(THEME_CONFIGS))

// 获取主题的颜色预览
function getThemeColors(themeKey) {
  const colorMap = {
    // 经典主题
    light: ['#F8F9FA', '#FFFFFF', '#4A90E2'],
    dark: ['#1a202c', '#2d3748', '#64748B'],
    yellow: ['#FAF0E6', '#F5E6D3', '#D97706'],
    // 柔和渐变色系
    pink: ['#FFF5F4', '#FFD5D1', '#FFB7B2'],
    peach: ['#FFF9F5', '#FFE5D0', '#FFDAC1'],
    lime: ['#FAFCF5', '#EAF4D8', '#AAD55C'],
    mint: ['#F5FCFA', '#D0F1E8', '#B5EAD7'],
    lavender: ['#F7F8FC', '#DFE2F0', '#C7CEEA'],
    // 绿色系渐变
    'green-light': ['#F5FCF9', '#D5F0E3', '#4CAF7E'],
    'green-soft': ['#F3FAF5', '#CCEBD7', '#55B377'],
    'green-sage': ['#F2F7F3', '#C2E0C8', '#66B37A'],
    'green-forest': ['#EEF5F0', '#B8D5BE', '#4F8B5B'],
    'green-dark': ['#EBF3ED', '#AECFB4', '#3D7A47'],
    // Call Me By Your Name 主题
    'sky-blue': ['#F0FAFC', '#C8EDF5', '#7CC8D8'],
    'ocean-blue': ['#EFF6FB', '#B8D4E8', '#4682B4'],
    'sand-beige': ['#FFFBF5', '#FFEDC8', '#F5DEB3'],
    'coral-orange': ['#FFF7F5', '#FFDCD0', '#F08460'],
    'emerald-green': ['#F0FAF6', '#C8EBD9', '#3F9B72']
  }
  return colorMap[themeKey] || ['#ccc', '#ddd', '#eee']
}

// 切换主题
async function handleThemeChange(themeKey) {
  console.log('[ThemeSelector] 开始切换主题:', themeKey)
  try {
    await themeStore.setTheme(themeKey)
    console.log('[ThemeSelector] 主题切换成功')
    showThemeMenu.value = false
  } catch (error) {
    console.error('[ThemeSelector] 主题切换失败:', error)
  }
}
</script>

<style scoped>
/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.5);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(75, 85, 99, 0.7);
}
</style>
