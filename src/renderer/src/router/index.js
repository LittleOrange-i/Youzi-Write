import { createRouter, createWebHashHistory } from 'vue-router'
import { ElMessageBox } from 'element-plus'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@renderer/views/Home.vue'),
    meta: { requiresAuth: true } // 需要书架密码验证
  },
  {
    path: '/editor',
    name: 'Editor',
    component: () => import('@renderer/views/Editor.vue')
  },
  {
    path: '/timeline',
    name: 'Timeline',
    component: () => import('@renderer/views/Timeline.vue')
  },
  {
    path: '/character-profile',
    name: 'CharacterProfile',
    component: () => import('@renderer/views/CharacterProfile.vue')
  },
  {
    path: '/dictionary',
    name: 'Dictionary',
    component: () => import('@renderer/views/Dictionary.vue')
  },
  {
    path: '/map-list',
    name: 'MapList',
    component: () => import('@renderer/views/MapList.vue')
  },
  {
    path: '/map-design',
    name: 'MapDesign',
    component: () => import('@renderer/views/MapDesign.vue')
  },
  {
    path: '/relationship-list',
    name: 'RelationshipList',
    component: () => import('@renderer/views/RelationshipList.vue')
  },
  {
    path: '/relationship-design',
    name: 'RelationshipDesign',
    component: () => import('@renderer/views/RelationshipDesign.vue')
  },
  {
    path: '/user-guide',
    name: 'UserGuide',
    component: () => import('@renderer/views/UserGuide.vue')
  },
  {
    path: '/events-sequence',
    name: 'EventsSequence',
    component: () => import('@renderer/views/EventsSequence.vue')
  },
  {
    path: '/organization-list',
    name: 'OrganizationList',
    component: () => import('@renderer/views/OrganizationList.vue')
  },
  {
    path: '/organization-design',
    name: 'OrganizationDesign',
    component: () => import('@renderer/views/OrganizationDesign.vue')
  }
  // 在这里添加更多路由配置
]

const router = createRouter({
  // 在 Electron 中使用 hash 模式
  history: createWebHashHistory(),
  routes
})

// 会话状态：记录当前会话是否已通过书架密码验证
let isShelfPasswordVerified = false

// 路由守卫：验证书架密码
router.beforeEach(async (to, from, next) => {
  // 检查是否需要书架密码验证
  if (to.meta.requiresAuth && !isShelfPasswordVerified) {
    try {
      // 获取加密的书架密码
      const result = await window.electron?.getShelfPassword()
      
      if (!result?.success) {
        // 获取密码失败，放行
        next()
        return
      }

      const hasPassword = result.hasPassword
      
      if (!hasPassword) {
        // 没有设置书架密码，直接放行
        isShelfPasswordVerified = true
        next()
        return
      }

      // 需要验证密码 - 循环直到验证成功或用户取消
      let passwordVerified = false
      while (!passwordVerified) {
        const passwordResult = await promptShelfPassword(result.hint)
        
        if (!passwordResult.confirmed) {
          // 用户取消输入密码，退出程序
          window.electron?.quitApp()
          next(false)
          return
        }
        
        // 验证密码是否正确
        const verifyResult = await window.electron?.verifyShelfPassword(passwordResult.password)
        
        if (verifyResult?.success && verifyResult.valid) {
          // 密码正确，标记已验证，放行
          isShelfPasswordVerified = true
          passwordVerified = true
          next()
        } else {
          // 密码错误，提示用户重新输入（不关闭弹窗，继续循环）
          await ElMessageBox.alert('密码错误，请重新输入', '验证失败', {
            confirmButtonText: '重新输入',
            type: 'error',
            modalClass: 'white-modal-overlay'
          })
          // 继续循环，重新输入密码
        }
      }
    } catch (error) {
      console.error('书架密码验证失败:', error)
      next(false)
    }
  } else {
    // 不需要验证或已验证，放行
    next()
  }
})

// 弹出密码输入框
function promptShelfPassword(hint) {
  return new Promise((resolve) => {
    let hintText = hint ? `<div style="margin-top: 10px; color: #909399; font-size: 12px;">密码提示：${hint}</div>` : ''
    
    ElMessageBox.prompt('请输入书架密码', '书架验证', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'password',
      inputPlaceholder: '请输入密码',
      inputPattern: /^[a-zA-Z0-9]{4,8}$/,
      inputErrorMessage: '密码必须是4-8位数字或字母组合',
      dangerouslyUseHTMLString: true,
      message: hintText,
      modalClass: 'white-modal-overlay', // 添加自定义类名
      beforeClose: (action, instance, done) => {
        if (action === 'confirm') {
          const password = instance.inputValue
          if (!password || !password.trim()) {
            instance.editorErrorMessage = '请输入密码'
            return
          }
          done()
        } else {
          done()
        }
      }
    })
      .then(({ value }) => {
        resolve({ confirmed: true, password: value })
      })
      .catch(() => {
        resolve({ confirmed: false, password: null })
      })
  })
}

export default router
