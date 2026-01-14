import { defineStore } from 'pinia'
import { ref } from 'vue'

// 主题配置常量
export const THEME_CONFIGS = {
  light: {
    name: '浅色经典',
    description: '清爽明亮的浅色主题',
    isDark: false
  },
  dark: {
    name: '深色护眼',
    description: '舒适护眼的深色主题',
    isDark: true
  },
  yellow: {
    name: '柔和护眼',
    description: '温暖柔和的护眼主题',
    isDark: false
  },
  daisyui: {
    name: 'DaisyUI',
    description: '活力彩色设计风格',
    isDark: false
  },
  'daisyui-dark': {
    name: 'DaisyUI Dark',
    description: 'DaisyUI 深色模式',
    isDark: true
  },
  flowbite: {
    name: 'Flowbite',
    description: '清新蓝色现代风格',
    isDark: false
  },
  'flowbite-dark': {
    name: 'Flowbite Dark',
    description: 'Flowbite 深色模式',
    isDark: true
  },
  preline: {
    name: 'Preline',
    description: '简约商务风格',
    isDark: false
  },
  'preline-dark': {
    name: 'Preline Dark',
    description: 'Preline 深色模式',
    isDark: true
  },
  material: {
    name: 'Material',
    description: 'Material Design 风格',
    isDark: false
  },
  'material-dark': {
    name: 'Material Dark',
    description: 'Material 深色模式',
    isDark: true
  },
  meraki: {
    name: 'Meraki',
    description: '优雅渐变风格',
    isDark: false
  },
  'meraki-dark': {
    name: 'Meraki Dark',
    description: 'Meraki 深色模式',
    isDark: true
  }
}

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref('light')

  // 初始化主题
  const initTheme = async () => {
    const theme = await window.electronStore.get('config.theme')
    if (theme) {
      currentTheme.value = theme
      applyTheme(theme)
    }
  }

  // 应用主题
  const applyTheme = (theme) => {
    console.log('[Theme Store] applyTheme 被调用, 参数:', theme)
    const root = document.documentElement
    console.log('[Theme Store] root 元素:', root)
    console.log('[Theme Store] 应用前 classList:', root.classList.toString())
    
    // 为 Tailwind CSS 的 dark 模式添加/移除 dark 类
    const themeConfig = THEME_CONFIGS[theme]
    if (themeConfig?.isDark) {
      console.log('[Theme Store] 添加 dark 类')
      root.classList.add('dark')
    } else {
      console.log('[Theme Store] 移除 dark 类')
      root.classList.remove('dark')
    }
    
    console.log('[Theme Store] 应用后 classList:', root.classList.toString())
    
    switch (theme) {
      case 'dark':
        // 主背景色：更深的护眼灰蓝色（#1a202c - 类似slate-900）
        root.style.setProperty('--bg-primary', '#1a202c')
        root.style.setProperty('--bg-primary-a5', 'rgba(26, 32, 44, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(26, 32, 44, 0.7)')
        // 次级背景色：稍亮的灰蓝色（#2d3748 - 类似slate-800）
        root.style.setProperty('--bg-soft', '#2d3748')
        root.style.setProperty('--bg-soft-a5', 'rgba(45, 55, 72, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(45, 55, 72, 0.7)')
        // 弱化背景色：更亮一些的灰蓝色（#4a5568 - 类似slate-700）
        root.style.setProperty('--bg-mute', '#4a5568')
        root.style.setProperty('--bg-mute-a5', 'rgba(74, 85, 104, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(74, 85, 104, 0.7)')
        // 文本颜色：柔和的灰白色（#cbd5e0 - 类似slate-300），更护眼
        root.style.setProperty('--text-base', '#cbd5e0')
        root.style.setProperty('--text-gray', '#718096')
        root.style.setProperty('--text-gray-light', '#a0aec0')
        root.style.setProperty('--text-gray-lighter', '#cbd5e0')
        root.style.setProperty('--text-gray-lightest', '#e2e8f0')
        root.style.setProperty('--accent-color', '#64748B')
        root.style.setProperty('--border-color', '#4a5568')
        root.style.setProperty('--border-color-soft', '#5a6b7f')
        root.style.setProperty('--success-green', '#48bb78')
        break
      case 'yellow':
        // 暖黄色护眼主题
        root.style.setProperty('--bg-primary', '#FAF0E6')
        root.style.setProperty('--bg-primary-a5', 'rgba(250, 240, 230, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(250, 240, 230, 0.7)')
        root.style.setProperty('--bg-soft', '#F5E6D3')
        root.style.setProperty('--bg-soft-a5', 'rgba(245, 230, 211, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(245, 230, 211, 0.7)')
        root.style.setProperty('--bg-mute', '#F0DCC0')
        root.style.setProperty('--bg-mute-a5', 'rgba(240, 220, 192, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(240, 220, 192, 0.7)')
        root.style.setProperty('--text-base', '#3A2F21')
        root.style.setProperty('--text-gray', '#666666')
        root.style.setProperty('--text-gray-light', '#999999')
        root.style.setProperty('--text-gray-lighter', '#CCCCCC')
        root.style.setProperty('--text-gray-lightest', '#F5F5F5')
        root.style.setProperty('--accent-color', '#D97706')
        root.style.setProperty('--border-color', '#E4D5B7')
        root.style.setProperty('--border-color-soft', '#EBE0C9')
        root.style.setProperty('--success-green', '#84CC16')
        break
      // DaisyUI 主题 - 紫色系
      case 'daisyui':
        root.style.setProperty('--bg-primary', '#FAF7FF')
        root.style.setProperty('--bg-primary-a5', 'rgba(250, 247, 255, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(250, 247, 255, 0.7)')
        root.style.setProperty('--bg-soft', '#F3EEFF')
        root.style.setProperty('--bg-soft-a5', 'rgba(243, 238, 255, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(243, 238, 255, 0.7)')
        root.style.setProperty('--bg-mute', '#EBE4FF')
        root.style.setProperty('--bg-mute-a5', 'rgba(235, 228, 255, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(235, 228, 255, 0.7)')
        root.style.setProperty('--text-base', '#1f2937')
        root.style.setProperty('--text-gray', '#6b7280')
        root.style.setProperty('--text-gray-light', '#9ca3af')
        root.style.setProperty('--text-gray-lighter', '#d1d5db')
        root.style.setProperty('--text-gray-lightest', '#f3f4f6')
        root.style.setProperty('--accent-color', '#8B5CF6')
        root.style.setProperty('--border-color', '#E4DBFF')
        root.style.setProperty('--border-color-soft', '#EDE7FF')
        root.style.setProperty('--success-green', '#10B981')
        break
      case 'daisyui-dark':
        // 深紫色系暗色主题
        root.style.setProperty('--bg-primary', '#1E1B2E')
        root.style.setProperty('--bg-primary-a5', 'rgba(30, 27, 46, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(30, 27, 46, 0.7)')
        root.style.setProperty('--bg-soft', '#2A2440')
        root.style.setProperty('--bg-soft-a5', 'rgba(42, 36, 64, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(42, 36, 64, 0.7)')
        root.style.setProperty('--bg-mute', '#3D3555')
        root.style.setProperty('--bg-mute-a5', 'rgba(61, 53, 85, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(61, 53, 85, 0.7)')
        root.style.setProperty('--text-base', '#E9D5FF')
        root.style.setProperty('--text-gray', '#C4B5FD')
        root.style.setProperty('--text-gray-light', '#A78BFA')
        root.style.setProperty('--text-gray-lighter', '#8B5CF6')
        root.style.setProperty('--text-gray-lightest', '#7C3AED')
        root.style.setProperty('--accent-color', '#A78BFA')
        root.style.setProperty('--border-color', '#4C3A6B')
        root.style.setProperty('--border-color-soft', '#5B4780')
        root.style.setProperty('--success-green', '#34D399')
        break
      // Flowbite 主题 - 蓝色系
      case 'flowbite':
        root.style.setProperty('--bg-primary', '#F0F9FF')
        root.style.setProperty('--bg-primary-a5', 'rgba(240, 249, 255, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(240, 249, 255, 0.7)')
        root.style.setProperty('--bg-soft', '#E0F2FE')
        root.style.setProperty('--bg-soft-a5', 'rgba(224, 242, 254, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(224, 242, 254, 0.7)')
        root.style.setProperty('--bg-mute', '#BAE6FD')
        root.style.setProperty('--bg-mute-a5', 'rgba(186, 230, 253, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(186, 230, 253, 0.7)')
        root.style.setProperty('--text-base', '#0C4A6E')
        root.style.setProperty('--text-gray', '#075985')
        root.style.setProperty('--text-gray-light', '#0284C7')
        root.style.setProperty('--text-gray-lighter', '#7DD3FC')
        root.style.setProperty('--text-gray-lightest', '#BAE6FD')
        root.style.setProperty('--accent-color', '#0EA5E9')
        root.style.setProperty('--border-color', '#7DD3FC')
        root.style.setProperty('--border-color-soft', '#BAE6FD')
        root.style.setProperty('--success-green', '#14B8A6')
        break
      case 'flowbite-dark':
        // 深蓝色系暗色主题
        root.style.setProperty('--bg-primary', '#0C1E2F')
        root.style.setProperty('--bg-primary-a5', 'rgba(12, 30, 47, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(12, 30, 47, 0.7)')
        root.style.setProperty('--bg-soft', '#1E3A52')
        root.style.setProperty('--bg-soft-a5', 'rgba(30, 58, 82, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(30, 58, 82, 0.7)')
        root.style.setProperty('--bg-mute', '#2E5266')
        root.style.setProperty('--bg-mute-a5', 'rgba(46, 82, 102, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(46, 82, 102, 0.7)')
        root.style.setProperty('--text-base', '#BAE6FD')
        root.style.setProperty('--text-gray', '#7DD3FC')
        root.style.setProperty('--text-gray-light', '#38BDF8')
        root.style.setProperty('--text-gray-lighter', '#0EA5E9')
        root.style.setProperty('--text-gray-lightest', '#0284C7')
        root.style.setProperty('--accent-color', '#38BDF8')
        root.style.setProperty('--border-color', '#1E3A52')
        root.style.setProperty('--border-color-soft', '#2E5266')
        root.style.setProperty('--success-green', '#2DD4BF')
        break
      // Preline 主题 - 靛蓝色系
      case 'preline':
        root.style.setProperty('--bg-primary', '#EEF2FF')
        root.style.setProperty('--bg-primary-a5', 'rgba(238, 242, 255, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(238, 242, 255, 0.7)')
        root.style.setProperty('--bg-soft', '#E0E7FF')
        root.style.setProperty('--bg-soft-a5', 'rgba(224, 231, 255, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(224, 231, 255, 0.7)')
        root.style.setProperty('--bg-mute', '#C7D2FE')
        root.style.setProperty('--bg-mute-a5', 'rgba(199, 210, 254, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(199, 210, 254, 0.7)')
        root.style.setProperty('--text-base', '#1E1B4B')
        root.style.setProperty('--text-gray', '#3730A3')
        root.style.setProperty('--text-gray-light', '#4F46E5')
        root.style.setProperty('--text-gray-lighter', '#818CF8')
        root.style.setProperty('--text-gray-lightest', '#A5B4FC')
        root.style.setProperty('--accent-color', '#6366F1')
        root.style.setProperty('--border-color', '#A5B4FC')
        root.style.setProperty('--border-color-soft', '#C7D2FE')
        root.style.setProperty('--success-green', '#059669')
        break
      case 'preline-dark':
        // 深靛蓝色系暗色主题
        root.style.setProperty('--bg-primary', '#1E1B4B')
        root.style.setProperty('--bg-primary-a5', 'rgba(30, 27, 75, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(30, 27, 75, 0.7)')
        root.style.setProperty('--bg-soft', '#312E81')
        root.style.setProperty('--bg-soft-a5', 'rgba(49, 46, 129, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(49, 46, 129, 0.7)')
        root.style.setProperty('--bg-mute', '#3730A3')
        root.style.setProperty('--bg-mute-a5', 'rgba(55, 48, 163, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(55, 48, 163, 0.7)')
        root.style.setProperty('--text-base', '#E0E7FF')
        root.style.setProperty('--text-gray', '#C7D2FE')
        root.style.setProperty('--text-gray-light', '#A5B4FC')
        root.style.setProperty('--text-gray-lighter', '#818CF8')
        root.style.setProperty('--text-gray-lightest', '#6366F1')
        root.style.setProperty('--accent-color', '#818CF8')
        root.style.setProperty('--border-color', '#4338CA')
        root.style.setProperty('--border-color-soft', '#4F46E5')
        root.style.setProperty('--success-green', '#10B981')
        break
      // Material Tailwind 主题 - 青色系
      case 'material':
        root.style.setProperty('--bg-primary', '#ECFEFF')
        root.style.setProperty('--bg-primary-a5', 'rgba(236, 254, 255, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(236, 254, 255, 0.7)')
        root.style.setProperty('--bg-soft', '#CFFAFE')
        root.style.setProperty('--bg-soft-a5', 'rgba(207, 250, 254, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(207, 250, 254, 0.7)')
        root.style.setProperty('--bg-mute', '#A5F3FC')
        root.style.setProperty('--bg-mute-a5', 'rgba(165, 243, 252, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(165, 243, 252, 0.7)')
        root.style.setProperty('--text-base', '#164E63')
        root.style.setProperty('--text-gray', '#0E7490')
        root.style.setProperty('--text-gray-light', '#0891B2')
        root.style.setProperty('--text-gray-lighter', '#22D3EE')
        root.style.setProperty('--text-gray-lightest', '#67E8F9')
        root.style.setProperty('--accent-color', '#06B6D4')
        root.style.setProperty('--border-color', '#67E8F9')
        root.style.setProperty('--border-color-soft', '#A5F3FC')
        root.style.setProperty('--success-green', '#14B8A6')
        break
      case 'material-dark':
        // 深青色系暗色主题
        root.style.setProperty('--bg-primary', '#083344')
        root.style.setProperty('--bg-primary-a5', 'rgba(8, 51, 68, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(8, 51, 68, 0.7)')
        root.style.setProperty('--bg-soft', '#0E4C5D')
        root.style.setProperty('--bg-soft-a5', 'rgba(14, 76, 93, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(14, 76, 93, 0.7)')
        root.style.setProperty('--bg-mute', '#155E75')
        root.style.setProperty('--bg-mute-a5', 'rgba(21, 94, 117, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(21, 94, 117, 0.7)')
        root.style.setProperty('--text-base', '#A5F3FC')
        root.style.setProperty('--text-gray', '#67E8F9')
        root.style.setProperty('--text-gray-light', '#22D3EE')
        root.style.setProperty('--text-gray-lighter', '#06B6D4')
        root.style.setProperty('--text-gray-lightest', '#0891B2')
        root.style.setProperty('--accent-color', '#22D3EE')
        root.style.setProperty('--border-color', '#164E63')
        root.style.setProperty('--border-color-soft', '#155E75')
        root.style.setProperty('--success-green', '#2DD4BF')
        break
      // Meraki UI 主题 - 粉色系
      case 'meraki':
        root.style.setProperty('--bg-primary', '#FDF2F8')
        root.style.setProperty('--bg-primary-a5', 'rgba(253, 242, 248, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(253, 242, 248, 0.7)')
        root.style.setProperty('--bg-soft', '#FCE7F3')
        root.style.setProperty('--bg-soft-a5', 'rgba(252, 231, 243, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(252, 231, 243, 0.7)')
        root.style.setProperty('--bg-mute', '#FBCFE8')
        root.style.setProperty('--bg-mute-a5', 'rgba(251, 207, 232, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(251, 207, 232, 0.7)')
        root.style.setProperty('--text-base', '#831843')
        root.style.setProperty('--text-gray', '#9F1239')
        root.style.setProperty('--text-gray-light', '#BE123C')
        root.style.setProperty('--text-gray-lighter', '#F472B6')
        root.style.setProperty('--text-gray-lightest', '#F9A8D4')
        root.style.setProperty('--accent-color', '#EC4899')
        root.style.setProperty('--border-color', '#F9A8D4')
        root.style.setProperty('--border-color-soft', '#FBCFE8')
        root.style.setProperty('--success-green', '#10B981')
        break
      case 'meraki-dark':
        // 深玫瑰色系暗色主题
        root.style.setProperty('--bg-primary', '#4C0519')
        root.style.setProperty('--bg-primary-a5', 'rgba(76, 5, 25, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(76, 5, 25, 0.7)')
        root.style.setProperty('--bg-soft', '#701A3A')
        root.style.setProperty('--bg-soft-a5', 'rgba(112, 26, 58, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(112, 26, 58, 0.7)')
        root.style.setProperty('--bg-mute', '#881337')
        root.style.setProperty('--bg-mute-a5', 'rgba(136, 19, 55, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(136, 19, 55, 0.7)')
        root.style.setProperty('--text-base', '#FCE7F3')
        root.style.setProperty('--text-gray', '#FBCFE8')
        root.style.setProperty('--text-gray-light', '#F9A8D4')
        root.style.setProperty('--text-gray-lighter', '#F472B6')
        root.style.setProperty('--text-gray-lightest', '#EC4899')
        root.style.setProperty('--accent-color', '#F472B6')
        root.style.setProperty('--border-color', '#9F1239')
        root.style.setProperty('--border-color-soft', '#BE123C')
        root.style.setProperty('--success-green', '#34D399')
        break
      default: // light
        root.style.setProperty('--bg-primary', '#F8F9FA')
        root.style.setProperty('--bg-primary-a5', 'rgba(248, 249, 250, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(248, 249, 250, 0.7)')
        root.style.setProperty('--bg-soft', '#FFFFFF')
        root.style.setProperty('--bg-soft-a5', 'rgba(255, 255, 255, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(255, 255, 255, 0.7)')
        root.style.setProperty('--bg-mute', '#F1F3F5')
        root.style.setProperty('--bg-mute-a5', 'rgba(241, 243, 245, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(241, 243, 245, 0.7)')
        root.style.setProperty('--text-base', '#121212')
        root.style.setProperty('--text-gray', '#666666')
        root.style.setProperty('--text-gray-light', '#999999')
        root.style.setProperty('--text-gray-lighter', '#CCCCCC')
        root.style.setProperty('--text-gray-lightest', '#F5F5F5')
        root.style.setProperty('--accent-color', '#4A90E2')
        root.style.setProperty('--border-color', '#E1E4E8')
        root.style.setProperty('--border-color-soft', '#E9ECEF')
        root.style.setProperty('--success-green', '#22C55E')
    }
  }

  // 切换主题
  const setTheme = async (theme) => {
    console.log('[Theme Store] setTheme 被调用, 参数:', theme)
    console.log('[Theme Store] 切换前 currentTheme.value:', currentTheme.value)
    
    currentTheme.value = theme
    console.log('[Theme Store] 切换后 currentTheme.value:', currentTheme.value)
    
    applyTheme(theme)
    console.log('[Theme Store] applyTheme 执行完成')
    
    await window.electronStore.set('config.theme', theme)
    console.log('[Theme Store] 已保存到 electronStore')
  }

  return {
    currentTheme,
    initTheme,
    setTheme
  }
})
