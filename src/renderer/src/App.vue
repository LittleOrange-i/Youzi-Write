<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style lang="scss">
/* 全局样式：Element Plus 组件在暗色模式下的适配 */
:deep(.el-input__wrapper) {
  background-color: var(--bg-soft);
  box-shadow: 0 0 0 1px var(--border-color) inset;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--border-color-soft) inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}

:deep(.el-input__inner) {
  color: var(--text-base);
}

:deep(.el-input__inner::placeholder) {
  color: var(--text-gray-light);
}

:deep(.el-select .el-input.is-disabled .el-input__wrapper) {
  background-color: var(--bg-mute);
}

:deep(.el-textarea__inner) {
  background-color: var(--bg-soft);
  color: var(--text-base);
  border-color: var(--border-color);
}

:deep(.el-textarea__inner::placeholder) {
  color: var(--text-gray-light);
}

/* 选择器下拉菜单 */
:deep(.el-select-dropdown) {
  background-color: var(--bg-soft);
  border-color: var(--border-color);
}

:deep(.el-select-dropdown__item) {
  color: var(--text-base);
}

:deep(.el-select-dropdown__item:hover) {
  background-color: var(--bg-mute);
}

:deep(.el-select-dropdown__item.selected) {
  color: #409eff;
  background-color: var(--bg-mute);
}

/* 弹出框 */
:deep(.el-dialog) {
  background-color: var(--bg-soft);
  border: 1px solid var(--border-color);
}

:deep(.el-dialog__title) {
  color: var(--text-base);
}

:deep(.el-dialog__body) {
  color: var(--text-base);
}

/* 按钮 */
:deep(.el-button) {
  border-color: var(--border-color);
}

:deep(.el-button:hover) {
  border-color: var(--border-color-soft);
}

/* Popover */
:deep(.el-popover) {
  background-color: var(--bg-soft);
  border-color: var(--border-color);
}

:deep(.el-popover__title) {
  color: var(--text-base);
}

/* 树形控件 */
:deep(.el-tree) {
  background-color: transparent;
  color: var(--text-base);
}

:deep(.el-tree-node__content:hover) {
  background-color: var(--bg-mute);
}

:deep(.el-tree-node:focus > .el-tree-node__content) {
  background-color: var(--bg-mute);
}

/* 开关 */
:deep(.el-switch__label) {
  color: var(--text-base);
}
</style>
