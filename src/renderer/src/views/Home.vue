<template>
  <div class="flex h-screen w-screen home-background">
    <!-- 左侧导航栏 - 使用 Tailwind 现代化设计 -->
    <aside class="w-64 bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 flex flex-col sidebar-style">
      <!-- Logo 区域 -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center logo-background overflow-hidden">
        <div class="logo-container flex items-center justify-center w-full">
          <div class="flex items-center gap-4 max-w-full">
            <img 
              src="/src/assets/images/youzi-icon.png" 
              alt="柚子图标" 
              class="logo-icon w-16 h-16 object-contain flex-shrink-0"
            />
            <h1 class="logo-text whitespace-nowrap">柚子写作</h1>
          </div>
        </div>
      </div>

      <!-- 导航菜单 -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div class="menu-item-modern active group">
          <svg class="w-5 h-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span class="font-medium">我的书架</span>
        </div>

        <div class="menu-item-modern group" @click="showSettingsDialog = true">
          <svg class="w-5 h-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="font-medium">系统设置</span>
        </div>

        <div class="menu-item-modern group" @click="handleOpenShortcutDialog">
          <svg class="w-5 h-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span class="font-medium">快捷键设置</span>
        </div>

        <div class="menu-item-modern group" @click="showShelfPasswordDialog = true">
          <svg class="w-5 h-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span class="font-medium">书架密码</span>
        </div>

        <div class="menu-item-modern group" @click="goToUserGuide">
          <svg class="w-5 h-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span class="font-medium">写作指南</span>
        </div>

        <div class="menu-item-modern group" @click="showHelpDialog = true">
          <svg class="w-5 h-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="font-medium">帮助中心</span>
        </div>

        <div class="menu-item-modern group" @click="showSponsorDialog = true">
          <svg class="w-5 h-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span class="font-medium">赞助作者</span>
        </div>
      </nav>
    </aside>

    <!-- 主内容区 - 书架 -->
    <Bookshelf />

    <!-- 选择书籍目录弹窗 -->
    <el-dialog
      v-model="showDirDialog"
      title="请选择书籍主目录"
      width="600px"
      :close-on-click-modal="false"
      :show-close="false"
      align-center
    >
      <el-form label-width="80px">
        <el-form-item label="书籍目录">
          <el-row :gutter="10" style="width: 100%">
            <el-col :span="18">
              <el-input v-model="bookDir" readonly placeholder="请选择目录" />
            </el-col>
            <el-col :span="6">
              <el-button type="primary" style="width: 100%" @click="handleChooseDir">
                选择目录
              </el-button>
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :disabled="!bookDir" @click="handleConfirmDir">确定</el-button>
      </template>
    </el-dialog>

    <!-- 帮助中心弹框 -->
    <el-dialog v-model="showHelpDialog" title="帮助中心" width="420px" align-center> <!-- 帮助中心对话框 -->
      <div class="flex flex-col items-center gap-4 text-center"> <!-- 内容居中布局容器 -->
        <img :src="qqGroupQrcode" alt="QQ 群二维码" class="w-64 max-w-full rounded-xl shadow-lg" /> <!-- QQ群二维码图片 -->
        <p class="text-sm" :style="{ color: 'var(--text-gray)' }"> <!-- 底部提示文本 -->
          问题反馈 <!-- 文本内容 -->
          <a class="font-medium" :style="{ color: 'var(--accent-color)' }" :href="`mailto:${contactEmail}`">{{ contactEmail }}</a> <!-- 邮箱链接 -->
        </p> <!-- 文本结束 -->
      </div> <!-- 容器结束 -->
    </el-dialog> <!-- 对话框结束 -->

    <!-- 赞助作者弹框 -->
    <el-dialog v-model="showSponsorDialog" title="赞助作者" width="520px" align-center> <!-- 赞助作者对话框 -->
      <div class="flex flex-col items-center"> <!-- 内容居中布局容器 -->
        <img :src="rewardQrcode" alt="赞助二维码" class="w-128 max-w-full rounded-xl shadow-lg" /> <!-- 赞助二维码图片 -->
      </div> <!-- 容器结束 -->
    </el-dialog> <!-- 对话框结束 -->

    <!-- 书架密码设置弹框 -->
    <el-dialog v-model="showShelfPasswordDialog" title="书架密码" width="500px" align-center>
      <div class="space-y-4">
        <!-- 显示当前密码状态 -->
        <el-alert
          :title="hasShelfPassword ? '已设置书架密码' : '未设置书架密码'"
          :type="hasShelfPassword ? 'success' : 'info'"
          :closable="false"
        />
        
        <el-form ref="shelfPasswordFormRef" :model="shelfPasswordForm" :rules="shelfPasswordRules" label-width="100px">
          <!-- 如果已有密码，需要先验证原密码 -->
          <el-form-item v-if="hasShelfPassword" prop="oldPassword" label="原密码">
            <el-input
              v-model="shelfPasswordForm.oldPassword"
              type="password"
              placeholder="请输入原密码"
              maxlength="8"
              show-password
              clearable
            />
          </el-form-item>
          
          <el-form-item prop="password" :label="hasShelfPassword ? '新密码' : '设置密码'">
            <el-input
              v-model="shelfPasswordForm.password"
              type="password"
              :placeholder="hasShelfPassword ? '请输入新密码（留空表示关闭密码）' : '请输入4-8位数字或字母组合'"
              maxlength="8"
              show-password
              clearable
            />
          </el-form-item>
          
          <el-form-item prop="confirmPassword" label="确认密码">
            <el-input
              v-model="shelfPasswordForm.confirmPassword"
              type="password"
              :placeholder="hasShelfPassword ? '请再次输入新密码' : '请再次输入密码'"
              maxlength="8"
              show-password
              clearable
            />
          </el-form-item>
          
          <el-form-item prop="hint" label="密码提示">
            <el-input
              v-model="shelfPasswordForm.hint"
              placeholder="请输入密码提示（选填，忘记密码时查看）"
              maxlength="50"
              clearable
            />
          </el-form-item>
        </el-form>
        
        <el-alert
          v-if="currentShelfPasswordHint"
          :title="`当前密码提示: ${currentShelfPasswordHint}`"
          type="info"
          :closable="false"
        />
      </div>
      <template #footer>
        <el-button @click="showShelfPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveShelfPassword">
          {{ hasShelfPassword ? (shelfPasswordForm.password ? '修改密码' : '关闭密码') : '设置密码' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 系统设置弹框 -->
    <el-dialog v-model="showSettingsDialog" title="系统设置" width="600px" align-center :style="{ maxHeight: '80vh' }"> <!-- 系统设置对话框 -->
      <div class="space-y-6 settings-dialog-content"> <!-- 设置内容容器 -->
        <!-- 书籍目录设置 -->
        <div class="setting-section"> <!-- 书籍存储目录设置区块 -->
          <h4 class="text-sm font-semibold text-[var(--text-base)] mb-3">书籍存储目录</h4> <!-- 区块标题 -->
          <el-form label-width="0"> <!-- 表单容器 -->
            <el-form-item> <!-- 表单项 -->
              <el-row :gutter="10" style="width: 100%"> <!-- 栅格行 -->
                <el-col :span="18"> <!-- 输入框列 -->
                  <el-input v-model="bookDir" readonly placeholder="请选择目录" /> <!-- 目录显示输入框 -->
                </el-col> <!-- 列结束 -->
                <el-col :span="6"> <!-- 按钮列 -->
                  <el-button type="primary" style="width: 100%" @click="handleChooseDir"> <!-- 选择按钮 -->
                    选择目录 <!-- 按钮文字 -->
                  </el-button> <!-- 按钮结束 -->
                </el-col> <!-- 列结束 -->
              </el-row> <!-- 行结束 -->
            </el-form-item> <!-- 项结束 -->
          </el-form> <!-- 表单结束 -->
        </div> <!-- 区块结束 -->

        <!-- 独立窗口设置 -->
        <div class="setting-section"> <!-- 窗口管理设置区块 -->
          <h4 class="text-sm font-semibold text-[var(--text-base)] mb-3">窗口管理</h4> <!-- 区块标题 -->
          <div class="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-mute)] border border-[var(--border-color)]"> <!-- 设置项容器 -->
            <div class="flex flex-col"> <!-- 文本说明容器 -->
              <span class="text-sm font-medium text-[var(--text-base)]">独立窗口模式</span> <!-- 功能名称 -->
              <p class="text-xs text-[var(--text-gray)] mt-1">开启后，点击地图、时间线等工具将以独立窗口打开</p> <!-- 功能描述 -->
            </div> <!-- 文本说明结束 -->
            <el-switch v-model="independentWindowMode" @change="handleWindowModeChange" /> <!-- 切换开关 -->
          </div> <!-- 容器结束 -->
        </div> <!-- 区块结束 -->

       
        <!-- 主题设置 -->
        <div class="setting-section"> <!-- 主题外观设置区块 -->
          <h4 class="text-sm font-semibold text-[var(--text-base)] mb-3">主题外观</h4> <!-- 区块标题 -->
          <div class="grid grid-cols-2 gap-3"> <!-- 主题网格布局 -->
            <button
              v-for="(config, themeKey) in THEME_CONFIGS"
              :key="themeKey"
              @click="handleThemeChange(themeKey)"
              class="theme-card p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md"
              :style="{
                borderColor: themeStore.currentTheme === themeKey ? 'var(--accent-color)' : 'var(--border-color)',
                backgroundColor: themeStore.currentTheme === themeKey ? 'var(--bg-mute)' : 'var(--bg-soft)'
              }"
            > <!-- 主题卡片按钮 -->
              <!-- 主题颜色预览 -->
              <div class="flex gap-1 mb-2"> <!-- 颜色预览容器 -->
                <div
                  v-for="(color, index) in getThemeColors(themeKey)"
                  :key="index"
                  class="flex-1 h-8 rounded"
                  :style="{ backgroundColor: color }"
                ></div> <!-- 颜色块 -->
              </div> <!-- 预览结束 -->
              
              <!-- 主题名称 -->
              <div class="text-left"> <!-- 文字对齐容器 -->
                <div class="flex items-center justify-between"> <!-- 名称和勾选图标容器 -->
                  <span
                    class="text-sm font-medium"
                    :style="{
                      color: themeStore.currentTheme === themeKey ? 'var(--accent-color)' : 'var(--text-base)'
                    }"
                  > <!-- 主题名称 -->
                    {{ config.name }} <!-- 名称内容 -->
                  </span> <!-- 名称结束 -->
                  <svg
                    v-if="themeStore.currentTheme === themeKey"
                    class="w-4 h-4"
                    :style="{ color: 'var(--accent-color)' }"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  > <!-- 选中图标 -->
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    /> <!-- 图标路径 -->
                  </svg> <!-- 图标结束 -->
                </div> <!-- 容器结束 -->
                <p class="text-xs text-[var(--text-gray)] mt-1"> <!-- 主题描述 -->
                  {{ config.description }} <!-- 描述内容 -->
                </p> <!-- 描述结束 -->
              </div> <!-- 文字结束 -->
            </button> <!-- 按钮结束 -->

          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 快捷键设置弹框 -->
    <el-dialog 
      v-model="showShortcutDialog" 
      title="快捷键设置" 
      width="700px" 
      align-center 
      :style="{ maxHeight: '80vh' }"
      @close="handleShortcutDialogClose"
    > <!-- 快捷键设置对话框 -->
      <div class="space-y-4 shortcut-dialog-content"> <!-- 对话框内容容器 -->
        <!-- 被占用快捷键警告 -->
        <el-alert
          v-if="hasOccupiedShortcuts"
          title="检测到部分快捷键被系统或其他应用占用，无法正常使用。请重新设置这些快捷键。"
          type="warning"
          :closable="false"
        > <!-- 占用警告提示 -->
          <template #default> <!-- 警告内容模板 -->
            <!-- 只在自动打开时显示"不再提示"选项 -->
            <div v-if="isAutoOpenShortcut" class="mt-2"> <!-- 自动打开时的选项容器 -->
              <el-checkbox v-model="ignoreOccupiedWarning"> <!-- 忽略警告复选框 -->
                不再提示（下次启动不会自动打开此设置） <!-- 复选框文字 -->
              </el-checkbox> <!-- 复选框结束 -->
            </div> <!-- 容器结束 -->
          </template> <!-- 模板结束 -->
        </el-alert> <!-- 警告结束 -->

        <!-- 提示信息 -->
        <el-alert
          title="提示：点击快捷键输入框，按下键盘组合键即可设置。系统会自动检测冲突。"
          type="info"
          :closable="false"
        /> <!-- 操作提示 -->

        <!-- 快捷键列表 -->
        <div class="shortcut-list space-y-3"> <!-- 快捷键列表容器 -->
          <div
            v-for="(shortcut, index) in shortcuts"
            :key="shortcut.id"
            class="shortcut-item p-4 rounded-lg border transition-all"
            :style="{
              borderColor: (shortcut.conflict || shortcut.occupied) ? '#fca5a5' : 'var(--border-color)',
              backgroundColor: (shortcut.conflict || shortcut.occupied) ? 'rgba(254, 226, 226, 0.2)' : 'var(--bg-soft)'
            }"
          > <!-- 快捷键项 -->
            <div class="flex items-center justify-between gap-4"> <!-- 项内布局容器 -->
              <!-- 功能名称和描述 -->
              <div class="flex-1"> <!-- 左侧信息列 -->
                <div class="font-medium" :style="{ color: 'var(--text-base)' }"> <!-- 功能名称 -->
                  {{ shortcut.name }} <!-- 名称内容 -->
                  <span v-if="shortcut.occupied" class="text-orange-500 text-sm ml-2">（被占用）</span> <!-- 占用标记 -->
                </div> <!-- 名称结束 -->
                <div class="text-xs mt-1" :style="{ color: 'var(--text-gray)' }"> <!-- 功能描述 -->
                  {{ shortcut.description }} <!-- 描述内容 -->
                </div> <!-- 描述结束 -->
              </div> <!-- 信息列结束 -->

              <!-- 快捷键输入 -->
              <div class="flex items-center gap-2"> <!-- 右侧输入列 -->
                <input
                  :value="shortcut.key"
                  @keydown.prevent="handleKeyDown($event, index)"
                  @focus="handleInputFocus(index)"
                  placeholder="按下快捷键"
                  readonly
                  class="shortcut-input px-3 py-2 rounded border text-center cursor-pointer min-w-[180px] transition-all"
                  :style="{
                    borderColor: (shortcut.conflict || shortcut.occupied) ? '#f87171' : 'var(--border-color)',
                    backgroundColor: (shortcut.conflict || shortcut.occupied) ? 'rgba(254, 226, 226, 0.3)' : 'var(--bg-primary)',
                    color: (shortcut.conflict || shortcut.occupied) ? '#ef4444' : 'var(--text-base)'
                  }"
                /> <!-- 快捷键输入框 -->
                <el-button
                  size="small"
                  type="danger"
                  text
                  @click="handleClearShortcut(index)"
                > <!-- 清除按钮 -->
                  清除 <!-- 按钮文字 -->
                </el-button> <!-- 按钮结束 -->
              </div> <!-- 输入列结束 -->
            </div> <!-- 布局容器结束 -->

            <!-- 冲突提示 -->
            <div v-if="shortcut.conflict" class="mt-2 text-sm text-red-600 dark:text-red-400"> <!-- 冲突警告文字 -->
              ⚠️ 该快捷键与"{{ shortcut.conflictWith }}"冲突，请更换其他组合 <!-- 警告内容 -->
            </div> <!-- 警告结束 -->
            <!-- 被占用提示 -->
            <div v-if="shortcut.occupied" class="mt-2 text-sm text-orange-600 dark:text-orange-400"> <!-- 占用警告文字 -->
              ⚠️ 该快捷键已被系统或其他应用占用，请更换其他组合 <!-- 警告内容 -->
            </div> <!-- 警告结束 -->
          </div> <!-- 项结束 -->
        </div> <!-- 列表结束 -->
      </div> <!-- 内容容器结束 -->

      <template #footer>
        <div class="flex justify-between items-center">
          <el-button @click="handleResetShortcuts">恢复默认</el-button>
          <div>
            <el-button @click="handleCloseShortcutDialog">取消</el-button>
            <el-button type="primary" @click="handleSaveShortcuts" :disabled="hasConflict">
              保存设置
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import Bookshelf from '@renderer/components/Bookshelf.vue'
import { useThemeStore, THEME_CONFIGS } from '@renderer/stores/theme'
import { ElDialog, ElMessage } from 'element-plus'

const router = useRouter()
const showDirDialog = ref(false)
const showSettingsDialog = ref(false)
const bookDir = ref('')
const showHelpDialog = ref(false)
const showSponsorDialog = ref(false)
const themeStore = useThemeStore()
const independentWindowMode = ref(false) // 独立窗口模式状态
const qqGroupQrcode = new URL('../../../../static/qq_chart.jpg', import.meta.url).href
const rewardQrcode = new URL('../../../../static/wx_reward_qrcode.jpg', import.meta.url).href
const contactEmail = '3026408975@qq.com'

// 快捷键设置相关
const showShortcutDialog = ref(false)
const currentFocusIndex = ref(-1)
const ignoreOccupiedWarning = ref(false) // 是否忽略被占用快捷键警告
const hasOccupiedShortcuts = ref(false) // 是否有被占用的快捷键
const isAutoOpenShortcut = ref(false) // 是否是自动打开快捷键设置（用于区分是否显示"不再提示"）

// 默认快捷键配置
const DEFAULT_SHORTCUTS = [
  {
    id: 'random-name',
    name: '随机起名',
    description: '随机生成人物名称',
    key: 'Alt+Q',
    defaultKey: 'Alt+Q'
  },
  {
    id: 'world-map',
    name: '设计地图',
    description: '打开世界地图设计工具',
    key: 'Alt+A',
    defaultKey: 'Alt+A'
  },
  {
    id: 'timeline',
    name: '时间线',
    description: '打开时间线管理',
    key: 'Alt+Z',
    defaultKey: 'Alt+Z'
  },
  {
    id: 'dictionary',
    name: '词条字典',
    description: '打开词条字典管理',
    key: 'Alt+W',
    defaultKey: 'Alt+W'
  },
  {
    id: 'character-profile',
    name: '人物谱',
    description: '打开人物谱管理',
    key: 'Alt+S',
    defaultKey: 'Alt+S'
  },
  {
    id: 'relationship-map',
    name: '关系图',
    description: '打开人物关系图',
    key: 'Alt+X',
    defaultKey: 'Alt+X'
  },
  {
    id: 'events-sequence',
    name: '事序图',
    description: '打开事件序列图',
    key: 'Alt+E',
    defaultKey: 'Alt+E'
  },
  {
    id: 'organization',
    name: '组织架构',
    description: '打开组织架构图',
    key: 'Alt+D',
    defaultKey: 'Alt+D'
  },
  {
    id: 'ai-result',
    name: 'AI生成结果',
    description: '打开AI生成结果浮窗',
    key: 'Alt+R',
    defaultKey: 'Alt+R'
  },
  {
    id: 'banned-words',
    name: '禁词管理',
    description: '打开禁词管理工具',
    key: 'Alt+C',
    defaultKey: 'Alt+C'
  },
  {
    id: 'paragraph-settings',
    name: '字数设置',
    description: '设置段落字数相关参数',
    key: 'Alt+V',
    defaultKey: 'Alt+V'
  }
]

// 快捷键列表
const shortcuts = ref(JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS)))

// 检查是否有冲突或被占用
const hasConflict = computed(() => {
  return shortcuts.value.some(s => s.conflict || s.occupied)
})

// 书架密码设置相关
const showShelfPasswordDialog = ref(false)
const shelfPasswordFormRef = ref(null)
const shelfPasswordForm = ref({
  oldPassword: '',
  password: '',
  confirmPassword: '',
  hint: ''
})
const currentShelfPasswordHint = ref('')
const hasShelfPassword = ref(false) // 标记是否已设置密码

const shelfPasswordRules = ref({
  oldPassword: [
    {
      validator: (rule, value, callback) => {
        if (hasShelfPassword.value && !value) {
          callback(new Error('请输入原密码'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
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
        if (shelfPasswordForm.value.password && value !== shelfPasswordForm.value.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

// 加载书架密码提示和状态
async function loadShelfPasswordHint() {
  try {
    const result = await window.electron?.getShelfPassword()
    if (result?.success) {
      hasShelfPassword.value = result.hasPassword
      currentShelfPasswordHint.value = result.hint || ''
    }
  } catch (error) {
    console.error('加载书架密码提示失败:', error)
  }
}

// 保存书架密码
async function handleSaveShelfPassword() {
  try {
    await shelfPasswordFormRef.value.validate()
    
    const oldPassword = shelfPasswordForm.value.oldPassword
    const password = shelfPasswordForm.value.password
    const hint = shelfPasswordForm.value.hint

    // 如果已有密码，需要先验证原密码
    if (hasShelfPassword.value) {
      const verifyResult = await window.electron?.verifyShelfPassword(oldPassword)
      
      if (!verifyResult?.success || !verifyResult.valid) {
        ElMessage.error('原密码错误')
        return
      }
    }

    // 调用主进程保存加密密码
    const result = await window.electron?.setShelfPassword({
      password: password || null,
      hint: hint || null
    })

    if (result?.success) {
      if (hasShelfPassword.value) {
        ElMessage.success(password ? '书架密码修改成功' : '书架密码已关闭')
      } else {
        ElMessage.success('书架密码设置成功')
      }
      
      showShelfPasswordDialog.value = false
      
      // 更新密码状态和提示
      hasShelfPassword.value = !!password
      currentShelfPasswordHint.value = hint || ''
      
      // 重置表单
      shelfPasswordForm.value.oldPassword = ''
      shelfPasswordForm.value.password = ''
      shelfPasswordForm.value.confirmPassword = ''
      shelfPasswordForm.value.hint = ''
    } else {
      ElMessage.error(result?.message || '保存失败')
    }
  } catch (error) {
    console.error('保存书架密码失败:', error)
  }
}

// 检查本地存储是否有bookDir
onMounted(async () => {
  const dir = await window.electronStore?.get('booksDir')
  if (!dir) {
    showDirDialog.value = true
  } else {
    bookDir.value = dir
  }
  // 初始化主题
  await themeStore.initTheme()
  // 加载书架密码提示
  await loadShelfPasswordHint()
  // 加载快捷键设置
  await loadShortcuts()
  // 加载独立窗口模式设置
  const savedMode = await window.electronStore?.get('independent-window-mode') // 从本地存储获取配置
  independentWindowMode.value = !!savedMode // 应用保存的配置
  // 检查被占用的快捷键
  await checkOccupiedShortcuts()
})

// 选择目录
async function handleChooseDir() {
  const result = await window.electron?.selectBooksDir()
  if (result && result.filePaths && result.filePaths[0]) {
    bookDir.value = result.filePaths[0]
    await window.electronStore.set('booksDir', bookDir.value)
    ElMessage.success('书籍目录设置成功')
  }
}

// 确认目录
async function handleConfirmDir() {
  await window.electronStore.set('booksDir', bookDir.value)
  showDirDialog.value = false
}

// 跳转到写作指南
const goToUserGuide = () => {
  router.push('/user-guide')
}

// 获取主题的颜色预览
function getThemeColors(themeKey) {
  const colorMap = {
    light: ['#F8F9FA', '#FFFFFF', '#4A90E2'],
    dark: ['#1a202c', '#2d3748', '#64748B'],
    yellow: ['#FAF0E6', '#F5E6D3', '#D97706'],
    daisyui: ['#FAF7FF', '#F3EEFF', '#8B5CF6'],
    'daisyui-dark': ['#1E1B2E', '#2A2440', '#A78BFA'],
    flowbite: ['#F0F9FF', '#E0F2FE', '#0EA5E9'],
    'flowbite-dark': ['#0C1E2F', '#1E3A52', '#38BDF8'],
    preline: ['#EEF2FF', '#E0E7FF', '#6366F1'],
    'preline-dark': ['#1E1B4B', '#312E81', '#818CF8'],
    material: ['#ECFEFF', '#CFFAFE', '#06B6D4'],
    'material-dark': ['#083344', '#0E4C5D', '#22D3EE'],
    meraki: ['#FDF2F8', '#FCE7F3', '#EC4899'],
    'meraki-dark': ['#4C0519', '#701A3A', '#F472B6']
  }
  return colorMap[themeKey] || ['#ccc', '#ddd', '#eee']
}

// 切换主题
function handleThemeChange(themeKey) {
  themeStore.setTheme(themeKey)
  // ElMessage.success(`已切换到 ${THEME_CONFIGS[themeKey]?.name} 主题`)
}

// 处理独立窗口模式切换
const handleWindowModeChange = async (val) => { // 切换处理函数
  try { // 异常处理
    await window.electronStore.set('independent-window-mode', val) // 保存新配置到本地存储
    ElMessage.success(val ? '已开启独立窗口模式' : '已关闭独立窗口模式') // 成功提示
  } catch (error) { // 捕获错误
    console.error('保存窗口模式失败:', error) // 打印错误日志
  } // 处理结束
} // 函数定义结束

// 加载保存的快捷键设置
async function loadShortcuts() {
  try {
    const savedShortcuts = await window.electronStore?.get('shortcuts')
    if (savedShortcuts) {
      shortcuts.value = savedShortcuts.map(saved => {
        const defaultShortcut = DEFAULT_SHORTCUTS.find(d => d.id === saved.id)
        return {
          ...defaultShortcut,
          ...saved,
          conflict: false,
          conflictWith: '',
          occupied: false // 初始化被占用状态,每次加载时都重置
        }
      })
    } else {
      // 如果没有保存的快捷键,使用默认值
      shortcuts.value = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS))
    }
  } catch (error) {
    console.error('加载快捷键设置失败:', error)
  }
}

// 检查被占用的快捷键
// forceCheck: 是否强制检查（忽略"不再提示"的设置）
async function checkOccupiedShortcuts(forceCheck = false) {
  try {
    // 检查是否已设置忽略警告（除非强制检查）
    if (!forceCheck) {
      const ignored = await window.electronStore?.get('ignoreShortcutOccupiedWarning')
      if (ignored) {
        return // 如果已忽略，直接返回
      }
    }

    // 获取被占用的快捷键列表
    if (window.electron?.getOccupiedShortcuts) {
      const occupiedList = await window.electron.getOccupiedShortcuts()
      
      if (occupiedList && occupiedList.length > 0) {
        // 标记被占用的快捷键
        occupiedList.forEach(occupied => {
          const shortcut = shortcuts.value.find(s => s.id === occupied.id)
          if (shortcut) {
            shortcut.occupied = true
          }
        })
        
        // 设置有被占用快捷键的标志
        hasOccupiedShortcuts.value = true
        
        // 如果是自动检查（非强制），延迟打开对话框，并标记为自动打开
        if (!forceCheck) {
          isAutoOpenShortcut.value = true
          setTimeout(() => {
            showShortcutDialog.value = true
          }, 500)
        }
      } else {
        // 如果没有被占用的快捷键，清除所有占用标记
        shortcuts.value.forEach(shortcut => {
          shortcut.occupied = false
        })
        hasOccupiedShortcuts.value = false
      }
    }
  } catch (error) {
    console.error('检查被占用快捷键失败:', error)
  }
}

// 处理打开快捷键设置对话框
async function handleOpenShortcutDialog() {
  // 标记为手动打开
  isAutoOpenShortcut.value = false
  
  // 重新加载快捷键配置（清除所有旧的状态标记）
  await loadShortcuts()
  
  // 每次打开时都重新检查快捷键占用情况（强制检查）
  await checkOccupiedShortcuts(true)
  
  // 打开对话框
  showShortcutDialog.value = true
}



// 处理键盘按下事件
function handleKeyDown(event, index) {
  const keys = []
  
  // 修饰键
  if (event.ctrlKey) keys.push('Ctrl')
  if (event.altKey) keys.push('Alt')
  if (event.shiftKey) keys.push('Shift')
  if (event.metaKey) keys.push('Meta')
  
  // 主键
  const mainKey = event.key
  if (mainKey && !['Control', 'Alt', 'Shift', 'Meta'].includes(mainKey)) {
    // 规范化按键名称
    let normalizedKey = mainKey
    if (mainKey.length === 1) {
      normalizedKey = mainKey.toUpperCase()
    }
    keys.push(normalizedKey)
  }
  
  // 至少需要一个修饰键和一个主键
  if (keys.length >= 2) {
    const keyCombo = keys.join('+')
    shortcuts.value[index].key = keyCombo
    
    // 检查冲突
    checkConflicts(index)
  }
}

// 检查快捷键冲突
async function checkConflicts(currentIndex) {
  const currentShortcut = shortcuts.value[currentIndex]
  
  // 重置当前快捷键的冲突和占用状态
  currentShortcut.conflict = false
  currentShortcut.conflictWith = ''
  currentShortcut.occupied = false // 用户修改后清除占用状态
  
  // 先清除所有快捷键的冲突状态（但不重置occupied状态）
  shortcuts.value.forEach((shortcut) => {
    shortcut.conflict = false
    shortcut.conflictWith = ''
  })
  
  // 重新检查所有快捷键之间的冲突
  shortcuts.value.forEach((shortcut, index) => {
    if (index !== currentIndex && shortcut.key && currentShortcut.key) {
      // 检查是否与当前快捷键冲突
      if (shortcut.key === currentShortcut.key) {
        currentShortcut.conflict = true
        currentShortcut.conflictWith = shortcut.name
        shortcut.conflict = true
        shortcut.conflictWith = currentShortcut.name
      }
    }
  })
  
  // 检查系统快捷键占用
  if (currentShortcut.key && !currentShortcut.conflict && window.electron?.checkShortcutAvailable) {
    try {
      const result = await window.electron.checkShortcutAvailable(currentShortcut.key)
      if (!result.available) {
        currentShortcut.occupied = true // 使用occupied而不是conflict
      }
    } catch (error) {
      console.error('检查快捷键可用性失败:', error)
    }
  }
}

// 处理输入框聚焦
function handleInputFocus(index) {
  currentFocusIndex.value = index
}

// 清除快捷键
function handleClearShortcut(index) {
  shortcuts.value[index].key = ''
  checkConflicts(index)
}

// 验证所有快捷键的可用性和冲突
async function validateAllShortcuts() {
  if (!window.electron?.checkShortcutAvailable) {
    return false // 如果没有检查API，直接返回
  }

  let hasOccupied = false
  let hasConflictInternal = false
  
  // 先清除所有状态
  shortcuts.value.forEach(shortcut => {
    shortcut.occupied = false
    shortcut.conflict = false
    shortcut.conflictWith = ''
  })
  
  // 检查内部冲突（先检查冲突，因为这个更重要）
  for (let i = 0; i < shortcuts.value.length; i++) {
    const shortcut = shortcuts.value[i]
    
    if (!shortcut.key) {
      continue // 跳过空快捷键
    }
    
    for (let j = i + 1; j < shortcuts.value.length; j++) {
      if (shortcuts.value[j].key === shortcut.key && shortcut.key) {
        // 发现冲突
        shortcut.conflict = true
        shortcuts.value[j].conflict = true
        shortcut.conflictWith = shortcuts.value[j].name
        shortcuts.value[j].conflictWith = shortcut.name
        hasConflictInternal = true
      }
    }
  }
  
  // 如果有内部冲突，直接返回，不需要检查系统占用
  if (hasConflictInternal) {
    return { hasConflict: true, hasOccupied: false }
  }
  
  // 检查系统占用
  for (let i = 0; i < shortcuts.value.length; i++) {
    const shortcut = shortcuts.value[i]
    
    if (!shortcut.key) {
      continue // 跳过空快捷键
    }
    
    try {
      const result = await window.electron.checkShortcutAvailable(shortcut.key)
      if (!result.available) {
        shortcut.occupied = true
        hasOccupied = true
      }
    } catch (error) {
      console.error(`检查快捷键 ${shortcut.key} 失败:`, error)
    }
  }
  
  hasOccupiedShortcuts.value = hasOccupied
  return { hasConflict: false, hasOccupied }
}

// 恢复默认快捷键
async function handleResetShortcuts() {
  // 先恢复默认值
  shortcuts.value = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS))
  
  // 验证默认快捷键是否可用
  const result = await validateAllShortcuts()
  
  if (result.hasConflict) {
    ElMessage.warning('默认快捷键已恢复，但存在冲突，请检查')
  } else if (result.hasOccupied) {
    ElMessage.warning('默认快捷键已恢复，但部分快捷键已被系统占用，请重新设置被占用的快捷键')
  } else {
    ElMessage.success('已恢复默认快捷键设置')
  }
}

// 保存快捷键设置
async function handleSaveShortcuts() {
  // 保存前再次验证所有快捷键的可用性和冲突
  const result = await validateAllShortcuts()
  
  // 检查是否有内部冲突
  if (result.hasConflict) {
    ElMessage.error('存在快捷键冲突，请修改冲突的快捷键后再保存')
    return
  }
  
  // 检查是否有被占用的快捷键
  if (result.hasOccupied) {
    ElMessage.error('检测到部分快捷键已被系统占用，请重新设置后再保存')
    return
  }
  
  try {
    // 将响应式对象转换为纯对象数组（避免克隆错误）
    const plainShortcuts = shortcuts.value.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      key: s.key,
      defaultKey: s.defaultKey
    }))
    
    // 保存到本地存储
    await window.electronStore?.set('shortcuts', plainShortcuts)
    
    // 通知主进程注册快捷键
    if (window.electron?.registerShortcuts) {
      const shortcutMap = {}
      shortcuts.value.forEach(s => {
        if (s.key) {
          shortcutMap[s.id] = s.key
        }
      })
      await window.electron.registerShortcuts(shortcutMap)
    }
    
    // 如果勾选了忽略警告，保存设置并清除占用信息
    if (ignoreOccupiedWarning.value) {
      await window.electronStore?.set('ignoreShortcutOccupiedWarning', true)
      if (window.electron?.clearOccupiedShortcuts) {
        await window.electron.clearOccupiedShortcuts()
      }
    }
    
    ElMessage.success('快捷键设置保存成功')
    
    // 重置状态
    hasOccupiedShortcuts.value = false
    ignoreOccupiedWarning.value = false
    isAutoOpenShortcut.value = false
    
    // 关闭对话框
    showShortcutDialog.value = false
    
    // 清除被占用的快捷键记录（因为已经保存了新的配置）
    if (window.electron?.clearOccupiedShortcuts) {
      await window.electron.clearOccupiedShortcuts()
    }
  } catch (error) {
    console.error('保存快捷键设置失败:', error)
    ElMessage.error('保存失败，请重试')
  }
}

// 关闭快捷键设置对话框（取消按钮）
async function handleCloseShortcutDialog() {
  // 如果勾选了忽略警告且是自动打开，保存设置并清除占用信息
  if (ignoreOccupiedWarning.value && isAutoOpenShortcut.value) {
    await window.electronStore?.set('ignoreShortcutOccupiedWarning', true)
    if (window.electron?.clearOccupiedShortcuts) {
      await window.electron.clearOccupiedShortcuts()
    }
  }
  
  showShortcutDialog.value = false
  hasOccupiedShortcuts.value = false
  ignoreOccupiedWarning.value = false
  isAutoOpenShortcut.value = false
}


// 弹窗关闭时的处理 (用于监听所有关闭方式)
async function handleShortcutDialogClose() {
  // 在弹窗关闭时检查是否勾选了"不再提示"（只在自动打开时生效）
  if (ignoreOccupiedWarning.value && isAutoOpenShortcut.value) {
    await window.electronStore?.set('ignoreShortcutOccupiedWarning', true)
    if (window.electron?.clearOccupiedShortcuts) {
      await window.electron.clearOccupiedShortcuts()
    }
  }
  
  // 重置状态
  hasOccupiedShortcuts.value = false
  ignoreOccupiedWarning.value = false
  isAutoOpenShortcut.value = false
}






</script>


<style lang="scss" scoped>
/* 首页背景渐变 - 跟随主题 */
.home-background {
  background: var(--bg-primary);
  background-image: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-mute) 100%);
}

/* 侧边栏样式 */
.sidebar-style {
  background-color: var(--bg-soft);
  border-color: var(--border-color);
}

/* Logo 背景 */
.logo-background {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.05) 0%, rgba(254, 202, 87, 0.05) 100%);
}

.dark .logo-background {
  background: var(--bg-soft);
}

/* Logo 容器样式 */
.logo-container {
  max-width: 100%;
  overflow: hidden;
}

/* Logo 图标样式 */
.logo-icon {
  flex-shrink: 0;
}

/* Logo 文字样式 - 带光影效果 */
.logo-text {
  font-size: 1.875rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  background: linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #ff9ff3 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(255, 107, 107, 0.3);
  filter: drop-shadow(0 4px 8px rgba(255, 107, 107, 0.2));
  transition: all 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  &:hover {
    transform: scale(1.03);
    filter: drop-shadow(0 6px 12px rgba(255, 107, 107, 0.4));
  }
}

/* 暗黑模式下的调整 */
.dark .logo-text {
  text-shadow: 0 0 40px rgba(255, 107, 107, 0.5);
  filter: drop-shadow(0 4px 12px rgba(255, 107, 107, 0.4));
}

/* 现代化菜单项样式 */
.menu-item-modern {
  @apply flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer;
  @apply transition-all duration-200;
  color: var(--text-base);
  
  &:hover {
    background-color: var(--bg-mute);
    color: var(--accent-color);
  }
  
  &.active {
    background-color: var(--bg-mute);
    color: var(--accent-color);
    @apply border-l-4;
    border-color: var(--accent-color);
  }
}

/* 设置部分样式 */
.setting-section {
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

/* 主题卡片样式 */
.theme-card {
  @apply text-left transition-all duration-200;
  
  &:hover {
    @apply transform scale-105;
  }
}

/* 保留 Element Plus 深度选择器兼容 */
:deep(.el-radio) {
  display: flex;
  align-items: center;
  margin-right: 0;
  height: 32px;
}

/* 快捷键设置相关样式 */
.shortcut-list {
  max-height: 500px;
  overflow-y: auto;
  scrollbar-width: none; // 隐藏滚动条
}

.shortcut-item {
  transition: all 0.2s ease;
  background-color: var(--bg-soft);
}

.shortcut-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.shortcut-input {
  background-color: var(--bg-primary);
  color: var(--text-base);
  outline: none;
  transition: all 0.2s ease;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.875rem;
}

.shortcut-input:focus {
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.shortcut-input::placeholder {
  color: var(--text-muted);
}

/* 弹窗内容区域样式 - 防止高度撑满视口 */
.settings-dialog-content {
  max-height: calc(80vh - 120px);
  overflow-y: auto;
  scrollbar-width: none; // 隐藏滚动条

}

.shortcut-dialog-content {
  max-height: calc(80vh - 120px);
  overflow-y: auto;
  scrollbar-width: none; // 隐藏滚动条

}



</style>


