# 柚子写作 - 前端渲染进程 (Renderer Process)

## 🏗️ 技术栈
- **框架**: Vue 3 (Composition API) <!-- 使用 Vue 3 组合式 API 框架 -->
- **状态管理**: Pinia <!-- 使用 Pinia 进行全局状态管理 -->
- **UI 组件库**: Element Plus <!-- 使用 Element Plus 组件库构建界面 -->
- **样式**: Tailwind CSS & SCSS <!-- 使用 Tailwind CSS 和 SCSS 处理样式 -->
- **编辑器**: TipTap (基于 ProseMirror) <!-- 使用 TipTap 作为核心编辑器引擎 -->
- **可视化**: ECharts & relation-graph-vue3 <!-- 使用 ECharts 和 relation-graph 进行数据可视化 -->

## 📂 目录结构说明
- `src/components`: 公用 UI 组件 <!-- 存放所有通用的 UI 组件 -->
  - `Editor`: 编辑器相关组件 <!-- 编辑器核心及配套功能组件 -->
  - `BookShelf`: 书架管理组件 <!-- 书籍展示与管理相关组件 -->
- `src/stores`: Pinia 状态仓库 <!-- 存放全局状态管理逻辑 -->
  - `editor.js`: 编辑器核心状态 <!-- 管理当前编辑文件、内容、字数统计等 -->
  - `jail.js`: 专注模式状态 <!-- 管理专注模式的目标与进度 -->
- `src/utils`: 工具函数 <!-- 存放通用的 JavaScript 工具函数 -->
- `src/composables`: 组合式函数 <!-- 存放可复用的 Vue 组合式逻辑 -->
- `src/assets`: 静态资源 <!-- 存放图片、图标、音效等静态文件 -->

## 💡 核心功能实现
- **编辑器面板 ([EditorPanel.vue](file:///c:/Users/FN\Desktop/youziwrite/src/renderer/src/components/Editor/EditorPanel.vue))**: 
  - 集成了 TipTap 编辑器 <!-- 实现核心写作功能 -->
  - 提供右键菜单功能（一键排版、全选、前往顶部/底部等） <!-- 增强编辑体验 -->
  - **分屏视图功能**：支持水平切分和垂直切分视图，方便对比创作 <!-- 实现多视图同步编辑 -->
  - 实时字数统计与码字速度计算 <!-- 辅助作者掌握进度 -->
  - 码字音效支持 <!-- 增强写作氛围感 -->
  - **对白高亮增强**：支持为不同符号对白自定义独立颜色，并支持一键重置 <!-- 提供个性化高亮方案 -->
  - **人物档案增强**：默认使用 #e198b8 作为标记色，支持快速识别 <!-- 优化角色管理视觉效果 -->
- **搜索与替换 ([SearchPanel.vue](file:///c:/Users/FN\Desktop/youziwrite/src/renderer/src/components/Editor/SearchPanel.vue))**: 
  - 支持全文搜索与批量替换 <!-- 实现高效的内容查找与修改 -->
- **专注模式**: 
  - 锁定写作界面，完成目标前限制退出 <!-- 帮助作者集中注意力 -->
- **更多设置 ([MoreSettingsDialog.vue](file:///c:/Users/FN\Desktop/youziwrite/src/renderer/src/components/Editor/MoreSettingsDialog.vue))**:
  - 优化布局：排版设置按钮固定顶部，对白高亮按钮固定底部 <!-- 提升设置操作便捷性 -->
  - 精细化控制：对白符号可独立开启/关闭自定义配色 <!-- 提供更灵活的视觉配置 -->

## 🛠️ 开发说明
- 遵循 Vue 3 最佳实践 <!-- 确保代码质量与可维护性 -->
- 使用 `script setup` 语法糖 <!-- 提高开发效率与代码简洁度 -->
- 所有 UI 交互均适配暗色模式 <!-- 提供良好的视觉体验 -->
