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
  // 柔和渐变色系
  pink: {
    name: '柔粉',
    description: '温柔舒适的粉色主题',
    isDark: false
  },
  peach: {
    name: '蜜桃',
    description: '温暖明媚的橙色主题',
    isDark: false
  },
  lime: {
    name: '青柠',
    description: '清新活力的黄绿主题',
    isDark: false
  },
  mint: {
    name: '薄荷',
    description: '清凉舒爽的青绿主题',
    isDark: false
  },
  lavender: {
    name: '薰衣草',
    description: '优雅宁静的淡紫主题',
    isDark: false
  },
  // 绿色系渐变
  'green-light': {
    name: '浅绿',
    description: '柔和清新的浅绿主题',
    isDark: false
  },
  'green-soft': {
    name: '嫩绿',
    description: '温和舒适的嫩绿主题',
    isDark: false
  },
  'green-sage': {
    name: '鼠尾草绿',
    description: '自然静谧的鼠尾草绿',
    isDark: false
  },
  'green-forest': {
    name: '森林绿',
    description: '深邃沉稳的森林绿',
    isDark: false
  },
  'green-dark': {
    name: '墨绿',
    description: '深沉雅致的墨绿主题',
    isDark: false
  },
  // "Call Me By Your Name" 主题 - 蓝绿色系
  'sky-blue': {
    name: '天蓝',
    description: '清新明亮的天蓝主题',
    isDark: false
  },
  'ocean-blue': {
    name: '海洋蓝',
    description: '深邃沉稳的海洋蓝',
    isDark: false
  },
  'sand-beige': {
    name: '沙滩米',
    description: '温暖柔和的沙滩米色',
    isDark: false
  },
  'coral-orange': {
    name: '珊瑚橙',
    description: '活力温暖的珊瑚橙',
    isDark: false
  },
  'emerald-green': {
    name: '翡翠绿',
    description: '优雅自然的翡翠绿',
    isDark: false
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
    // // console.log('[Theme Store] applyTheme 被调用, 参数:', theme)
    const root = document.documentElement
    // // console.log('[Theme Store] root 元素:', root)
    // // console.log('[Theme Store] 应用前 classList:', root.classList.toString())
    
    // 为 Tailwind CSS 的 dark 模式添加/移除 dark 类
    const themeConfig = THEME_CONFIGS[theme]
    if (themeConfig?.isDark) {
      // // console.log('[Theme Store] 添加 dark 类')
      root.classList.add('dark')
    } else {
      // // console.log('[Theme Store] 移除 dark 类')
      root.classList.remove('dark')
    }
    
    // console.log('[Theme Store] 应用后 classList:', root.classList.toString())
    
    switch (theme) {
      case 'dark':
        // 主背景色:更深的护眼灰蓝色(#1a202c - 类似slate-900)
        root.style.setProperty('--bg-primary', '#1a202c')
        root.style.setProperty('--bg-primary-a5', 'rgba(26, 32, 44, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(26, 32, 44, 0.7)')
        // 次级背景色:稍亮的灰蓝色(#2d3748 - 类似slate-800)
        root.style.setProperty('--bg-soft', '#2d3748')
        root.style.setProperty('--bg-soft-a5', 'rgba(45, 55, 72, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(45, 55, 72, 0.7)')
        // 弱化背景色:更亮一些的灰蓝色(#4a5568 - 类似slate-700)
        root.style.setProperty('--bg-mute', '#4a5568')
        root.style.setProperty('--bg-mute-a5', 'rgba(74, 85, 104, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(74, 85, 104, 0.7)')
        // 文本颜色:更明亮的灰白色(#e2e8f0 - 类似slate-200),提高对比度
        root.style.setProperty('--text-base', '#e2e8f0')
        root.style.setProperty('--text-secondary', '#cbd5e0')
        root.style.setProperty('--text-gray', '#94a3b8')
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
      // 柔粉主题 (#FFB7B2)
      case 'pink':
        root.style.setProperty('--bg-primary', '#FFF5F4')
        root.style.setProperty('--bg-primary-a5', 'rgba(255, 245, 244, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(255, 245, 244, 0.7)')
        root.style.setProperty('--bg-soft', '#FFE8E6')
        root.style.setProperty('--bg-soft-a5', 'rgba(255, 232, 230, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(255, 232, 230, 0.7)')
        root.style.setProperty('--bg-mute', '#FFD5D1')
        root.style.setProperty('--bg-mute-a5', 'rgba(255, 213, 209, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(255, 213, 209, 0.7)')
        root.style.setProperty('--text-base', '#4A1F1E')
        root.style.setProperty('--text-gray', '#7C3533')
        root.style.setProperty('--text-gray-light', '#A64D4B')
        root.style.setProperty('--text-gray-lighter', '#D17572')
        root.style.setProperty('--text-gray-lightest', '#FFA09A')
        root.style.setProperty('--accent-color', '#FFB7B2')
        root.style.setProperty('--border-color', '#FFC5C0')
        root.style.setProperty('--border-color-soft', '#FFE0DD')
        root.style.setProperty('--success-green', '#10B981')
        break
      // 蜜桃主题 (#FFDAC1)
      case 'peach':
        root.style.setProperty('--bg-primary', '#FFF9F5')
        root.style.setProperty('--bg-primary-a5', 'rgba(255, 249, 245, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(255, 249, 245, 0.7)')
        root.style.setProperty('--bg-soft', '#FFF0E5')
        root.style.setProperty('--bg-soft-a5', 'rgba(255, 240, 229, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(255, 240, 229, 0.7)')
        root.style.setProperty('--bg-mute', '#FFE5D0')
        root.style.setProperty('--bg-mute-a5', 'rgba(255, 229, 208, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(255, 229, 208, 0.7)')
        root.style.setProperty('--text-base', '#4A2F1E')
        root.style.setProperty('--text-gray', '#7C5133')
        root.style.setProperty('--text-gray-light', '#A6714B')
        root.style.setProperty('--text-gray-lighter', '#D19972')
        root.style.setProperty('--text-gray-lightest', '#FFBE8F')
        root.style.setProperty('--accent-color', '#FFDAC1')
        root.style.setProperty('--border-color', '#FFE8D5')
        root.style.setProperty('--border-color-soft', '#FFF0E5')
        root.style.setProperty('--success-green', '#10B981')
        break
      // 青柠主题 (#E2F0CB)
      case 'lime':
        root.style.setProperty('--bg-primary', '#FAFCF5')
        root.style.setProperty('--bg-primary-a5', 'rgba(250, 252, 245, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(250, 252, 245, 0.7)')
        root.style.setProperty('--bg-soft', '#F2F7E5')
        root.style.setProperty('--bg-soft-a5', 'rgba(242, 247, 229, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(242, 247, 229, 0.7)')
        root.style.setProperty('--bg-mute', '#EAF4D8')
        root.style.setProperty('--bg-mute-a5', 'rgba(234, 244, 216, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(234, 244, 216, 0.7)')
        root.style.setProperty('--text-base', '#2F4A1E')
        root.style.setProperty('--text-gray', '#4D6B33')
        root.style.setProperty('--text-gray-light', '#6B8B4B')
        root.style.setProperty('--text-gray-lighter', '#90B372')
        root.style.setProperty('--text-gray-lightest', '#B8D89A')
        root.style.setProperty('--accent-color', '#AAD55C')
        root.style.setProperty('--border-color', '#D5E8B0')
        root.style.setProperty('--border-color-soft', '#E8F4D3')
        root.style.setProperty('--success-green', '#84CC16')
        break
      // 薄荷主题 (#B5EAD7)
      case 'mint':
        root.style.setProperty('--bg-primary', '#F5FCFA')
        root.style.setProperty('--bg-primary-a5', 'rgba(245, 252, 250, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(245, 252, 250, 0.7)')
        root.style.setProperty('--bg-soft', '#E5F7F2')
        root.style.setProperty('--bg-soft-a5', 'rgba(229, 247, 242, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(229, 247, 242, 0.7)')
        root.style.setProperty('--bg-mute', '#D0F1E8')
        root.style.setProperty('--bg-mute-a5', 'rgba(208, 241, 232, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(208, 241, 232, 0.7)')
        root.style.setProperty('--text-base', '#1E4A3D')
        root.style.setProperty('--text-gray', '#336B5B')
        root.style.setProperty('--text-gray-light', '#4B8B79')
        root.style.setProperty('--text-gray-lighter', '#72B39E')
        root.style.setProperty('--text-gray-lightest', '#9AD5C2')
        root.style.setProperty('--accent-color', '#58C2A3')
        root.style.setProperty('--border-color', '#A0DCC9')
        root.style.setProperty('--border-color-soft', '#CCEEDE')
        root.style.setProperty('--success-green', '#14B8A6')
        break
      // 薰衣草主题 (#C7CEEA)
      case 'lavender':
        root.style.setProperty('--bg-primary', '#F7F8FC')
        root.style.setProperty('--bg-primary-a5', 'rgba(247, 248, 252, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(247, 248, 252, 0.7)')
        root.style.setProperty('--bg-soft', '#EEF0F7')
        root.style.setProperty('--bg-soft-a5', 'rgba(238, 240, 247, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(238, 240, 247, 0.7)')
        root.style.setProperty('--bg-mute', '#DFE2F0')
        root.style.setProperty('--bg-mute-a5', 'rgba(223, 226, 240, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(223, 226, 240, 0.7)')
        root.style.setProperty('--text-base', '#2D324A')
        root.style.setProperty('--text-gray', '#4D556B')
        root.style.setProperty('--text-gray-light', '#6B758B')
        root.style.setProperty('--text-gray-lighter', '#9099B3')
        root.style.setProperty('--text-gray-lightest', '#B5BDD5')
        root.style.setProperty('--accent-color', '#8A95C8')
        root.style.setProperty('--border-color', '#B8BFDC')
        root.style.setProperty('--border-color-soft', '#D8DCF0')
        root.style.setProperty('--success-green', '#10B981')
        break
      // 浅绿主题
      case 'green-light':
        root.style.setProperty('--bg-primary', '#F5FCF9')
        root.style.setProperty('--bg-primary-a5', 'rgba(245, 252, 249, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(245, 252, 249, 0.7)')
        root.style.setProperty('--bg-soft', '#E8F7F0')
        root.style.setProperty('--bg-soft-a5', 'rgba(232, 247, 240, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(232, 247, 240, 0.7)')
        root.style.setProperty('--bg-mute', '#D5F0E3')
        root.style.setProperty('--bg-mute-a5', 'rgba(213, 240, 227, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(213, 240, 227, 0.7)')
        root.style.setProperty('--text-base', '#1E4A35')
        root.style.setProperty('--text-gray', '#2D6B4F')
        root.style.setProperty('--text-gray-light', '#3D8B69')
        root.style.setProperty('--text-gray-lighter', '#5FB391')
        root.style.setProperty('--text-gray-lightest', '#8DD5B8')
        root.style.setProperty('--accent-color', '#4CAF7E')
        root.style.setProperty('--border-color', '#B8E5CF')
        root.style.setProperty('--border-color-soft', '#D8F2E5')
        root.style.setProperty('--success-green', '#10B981')
        break
      // 嫩绿主题
      case 'green-soft':
        root.style.setProperty('--bg-primary', '#F3FAF5')
        root.style.setProperty('--bg-primary-a5', 'rgba(243, 250, 245, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(243, 250, 245, 0.7)')
        root.style.setProperty('--bg-soft', '#E3F4E8')
        root.style.setProperty('--bg-soft-a5', 'rgba(227, 244, 232, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(227, 244, 232, 0.7)')
        root.style.setProperty('--bg-mute', '#CCEBD7')
        root.style.setProperty('--bg-mute-a5', 'rgba(204, 235, 215, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(204, 235, 215, 0.7)')
        root.style.setProperty('--text-base', '#234A31')
        root.style.setProperty('--text-gray', '#376B48')
        root.style.setProperty('--text-gray-light', '#4B8B5F')
        root.style.setProperty('--text-gray-lighter', '#6FAF86')
        root.style.setProperty('--text-gray-lightest', '#9BD5B1')
        root.style.setProperty('--accent-color', '#55B377')
        root.style.setProperty('--border-color', '#ADDFC3')
        root.style.setProperty('--border-color-soft', '#D0F0DC')
        root.style.setProperty('--success-green', '#22C55E')
        break
      // 鼠尾草绿主题
      case 'green-sage':
        root.style.setProperty('--bg-primary', '#F2F7F3')
        root.style.setProperty('--bg-primary-a5', 'rgba(242, 247, 243, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(242, 247, 243, 0.7)')
        root.style.setProperty('--bg-soft', '#E0EFE3')
        root.style.setProperty('--bg-soft-a5', 'rgba(224, 239, 227, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(224, 239, 227, 0.7)')
        root.style.setProperty('--bg-mute', '#C2E0C8')
        root.style.setProperty('--bg-mute-a5', 'rgba(194, 224, 200, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(194, 224, 200, 0.7)')
        root.style.setProperty('--text-base', '#2A4A32')
        root.style.setProperty('--text-gray', '#416B4A')
        root.style.setProperty('--text-gray-light', '#588B62')
        root.style.setProperty('--text-gray-lighter', '#79AF89')
        root.style.setProperty('--text-gray-lightest', '#A3D5B0')
        root.style.setProperty('--accent-color', '#66B37A')
        root.style.setProperty('--border-color', '#9BCCAA')
        root.style.setProperty('--border-color-soft', '#C8E5D0')
        root.style.setProperty('--success-green', '#16A34A')
        break
      // 森林绿主题
      case 'green-forest':
        root.style.setProperty('--bg-primary', '#EEF5F0')
        root.style.setProperty('--bg-primary-a5', 'rgba(238, 245, 240, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(238, 245, 240, 0.7)')
        root.style.setProperty('--bg-soft', '#DAEADE')
        root.style.setProperty('--bg-soft-a5', 'rgba(218, 234, 222, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(218, 234, 222, 0.7)')
        root.style.setProperty('--bg-mute', '#B8D5BE')
        root.style.setProperty('--bg-mute-a5', 'rgba(184, 213, 190, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(184, 213, 190, 0.7)')
        root.style.setProperty('--text-base', '#304A37')
        root.style.setProperty('--text-gray', '#496B4F')
        root.style.setProperty('--text-gray-light', '#628B67')
        root.style.setProperty('--text-gray-lighter', '#84AF8E')
        root.style.setProperty('--text-gray-lightest', '#A8D5B5')
        root.style.setProperty('--accent-color', '#4F8B5B')
        root.style.setProperty('--border-color', '#90BF9B')
        root.style.setProperty('--border-color-soft', '#BFDDC6')
        root.style.setProperty('--success-green', '#15803D')
        break
      // 墨绿主题
      case 'green-dark':
        root.style.setProperty('--bg-primary', '#EBF3ED')
        root.style.setProperty('--bg-primary-a5', 'rgba(235, 243, 237, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(235, 243, 237, 0.7)')
        root.style.setProperty('--bg-soft', '#D5E5D8')
        root.style.setProperty('--bg-soft-a5', 'rgba(213, 229, 216, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(213, 229, 216, 0.7)')
        root.style.setProperty('--bg-mute', '#AECFB4')
        root.style.setProperty('--bg-mute-a5', 'rgba(174, 207, 180, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(174, 207, 180, 0.7)')
        root.style.setProperty('--text-base', '#354A3A')
        root.style.setProperty('--text-gray', '#4E6B52')
        root.style.setProperty('--text-gray-light', '#678B6A')
        root.style.setProperty('--text-gray-lighter', '#8DAF92')
        root.style.setProperty('--text-gray-lightest', '#B5D5BA')
        root.style.setProperty('--accent-color', '#3D7A47')
        root.style.setProperty('--border-color', '#87B990')
        root.style.setProperty('--border-color-soft', '#B8DBC0')
        root.style.setProperty('--success-green', '#166534')
        break
      // 天蓝主题 (#7CC8D8)
      case 'sky-blue':
        root.style.setProperty('--bg-primary', '#F0FAFC')
        root.style.setProperty('--bg-primary-a5', 'rgba(240, 250, 252, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(240, 250, 252, 0.7)')
        root.style.setProperty('--bg-soft', '#E0F4F9')
        root.style.setProperty('--bg-soft-a5', 'rgba(224, 244, 249, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(224, 244, 249, 0.7)')
        root.style.setProperty('--bg-mute', '#C8EDF5')
        root.style.setProperty('--bg-mute-a5', 'rgba(200, 237, 245, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(200, 237, 245, 0.7)')
        root.style.setProperty('--text-base', '#1E4A55')
        root.style.setProperty('--text-gray', '#2F6B7B')
        root.style.setProperty('--text-gray-light', '#4A8B9C')
        root.style.setProperty('--text-gray-lighter', '#6FAFC0')
        root.style.setProperty('--text-gray-lightest', '#9BD3E0')
        root.style.setProperty('--accent-color', '#7CC8D8')
        root.style.setProperty('--border-color', '#A8DCE8')
        root.style.setProperty('--border-color-soft', '#D0EDF5')
        root.style.setProperty('--success-green', '#14B8A6')
        break
      // 海洋蓝主题 (#4682B4)
      case 'ocean-blue':
        root.style.setProperty('--bg-primary', '#EFF6FB')
        root.style.setProperty('--bg-primary-a5', 'rgba(239, 246, 251, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(239, 246, 251, 0.7)')
        root.style.setProperty('--bg-soft', '#DCE9F5')
        root.style.setProperty('--bg-soft-a5', 'rgba(220, 233, 245, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(220, 233, 245, 0.7)')
        root.style.setProperty('--bg-mute', '#B8D4E8')
        root.style.setProperty('--bg-mute-a5', 'rgba(184, 212, 232, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(184, 212, 232, 0.7)')
        root.style.setProperty('--text-base', '#1E3A52')
        root.style.setProperty('--text-gray', '#2F5570')
        root.style.setProperty('--text-gray-light', '#4A708E')
        root.style.setProperty('--text-gray-lighter', '#6F95B3')
        root.style.setProperty('--text-gray-lightest', '#9BBAD8')
        root.style.setProperty('--accent-color', '#4682B4')
        root.style.setProperty('--border-color', '#8BACC9')
        root.style.setProperty('--border-color-soft', '#C0D5E5')
        root.style.setProperty('--success-green', '#0891B2')
        break
      // 沙滩米色主题 (#F5DEB3)
      case 'sand-beige':
        root.style.setProperty('--bg-primary', '#FFFBF5')
        root.style.setProperty('--bg-primary-a5', 'rgba(255, 251, 245, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(255, 251, 245, 0.7)')
        root.style.setProperty('--bg-soft', '#FFF5E8')
        root.style.setProperty('--bg-soft-a5', 'rgba(255, 245, 232, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(255, 245, 232, 0.7)')
        root.style.setProperty('--bg-mute', '#FFEDC8')
        root.style.setProperty('--bg-mute-a5', 'rgba(255, 237, 200, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(255, 237, 200, 0.7)')
        root.style.setProperty('--text-base', '#4A3F2E')
        root.style.setProperty('--text-gray', '#6B5B45')
        root.style.setProperty('--text-gray-light', '#8B775C')
        root.style.setProperty('--text-gray-lighter', '#B39A7A')
        root.style.setProperty('--text-gray-lightest', '#D5C3A8')
        root.style.setProperty('--accent-color', '#D4A574')
        root.style.setProperty('--border-color', '#E8D0A8')
        root.style.setProperty('--border-color-soft', '#F5E5C8')
        root.style.setProperty('--success-green', '#84CC16')
        break
      // 珊瑚橙主题 (#F08460)
      case 'coral-orange':
        root.style.setProperty('--bg-primary', '#FFF7F5')
        root.style.setProperty('--bg-primary-a5', 'rgba(255, 247, 245, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(255, 247, 245, 0.7)')
        root.style.setProperty('--bg-soft', '#FFEDE8')
        root.style.setProperty('--bg-soft-a5', 'rgba(255, 237, 232, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(255, 237, 232, 0.7)')
        root.style.setProperty('--bg-mute', '#FFDCD0')
        root.style.setProperty('--bg-mute-a5', 'rgba(255, 220, 208, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(255, 220, 208, 0.7)')
        root.style.setProperty('--text-base', '#4A2520')
        root.style.setProperty('--text-gray', '#7C3F35')
        root.style.setProperty('--text-gray-light', '#A6594A')
        root.style.setProperty('--text-gray-lighter', '#D1806F')
        root.style.setProperty('--text-gray-lightest', '#FFAA95')
        root.style.setProperty('--accent-color', '#F08460')
        root.style.setProperty('--border-color', '#FFB8A0')
        root.style.setProperty('--border-color-soft', '#FFD8C8')
        root.style.setProperty('--success-green', '#10B981')
        break
      // 翡翠绿主题 (#3F9B72)
      case 'emerald-green':
        root.style.setProperty('--bg-primary', '#F0FAF6')
        root.style.setProperty('--bg-primary-a5', 'rgba(240, 250, 246, 0.5)')
        root.style.setProperty('--bg-primary-a7', 'rgba(240, 250, 246, 0.7)')
        root.style.setProperty('--bg-soft', '#E0F4ED')
        root.style.setProperty('--bg-soft-a5', 'rgba(224, 244, 237, 0.5)')
        root.style.setProperty('--bg-soft-a7', 'rgba(224, 244, 237, 0.7)')
        root.style.setProperty('--bg-mute', '#C8EBD9')
        root.style.setProperty('--bg-mute-a5', 'rgba(200, 235, 217, 0.5)')
        root.style.setProperty('--bg-mute-a7', 'rgba(200, 235, 217, 0.7)')
        root.style.setProperty('--text-base', '#1E4A39')
        root.style.setProperty('--text-gray', '#2F6B55')
        root.style.setProperty('--text-gray-light', '#4A8B71')
        root.style.setProperty('--text-gray-lighter', '#6FAF95')
        root.style.setProperty('--text-gray-lightest', '#9BD3BE')
        root.style.setProperty('--accent-color', '#3F9B72')
        root.style.setProperty('--border-color', '#88C4A8')
        root.style.setProperty('--border-color-soft', '#BCDDC8')
        root.style.setProperty('--success-green', '#16A34A')
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
    // console.log('[Theme Store] setTheme 被调用, 参数:', theme)
    // console.log('[Theme Store] 切换前 currentTheme.value:', currentTheme.value)
    
    currentTheme.value = theme
    // console.log('[Theme Store] 切换后 currentTheme.value:', currentTheme.value)
    
    applyTheme(theme)
    // console.log('[Theme Store] applyTheme 执行完成')
    
    await window.electronStore.set('config.theme', theme)
    // console.log('[Theme Store] 已保存到 electronStore')
  }

  return {
    currentTheme,
    initTheme,
    setTheme
  }
})
