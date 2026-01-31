<template> <!-- 模板部分开始 -->
  <div class="map-toolbar"> <!-- 地图工具栏主容器 -->
    <!-- 选择工具组：包含移动和选框工具 -->
    <el-tooltip content="移动 (H)" placement="bottom" :show-after="100"> <!-- 移动工具的文字提示，设置 100ms 延迟防止快速划过触发 -->
      <div
        :class="['tool-btn', modelValue === 'move' ? 'active' : '']"
        @click="handleToolSelect('move')"
      > <!-- 移动工具按钮区域 -->
        <SvgIcon name="hand" :size="iconSize" /> <!-- 显示手形图标 -->
      </div> <!-- 按钮区域结束 -->
    </el-tooltip> <!-- 提示组件结束 -->
    <el-tooltip content="选框 (V)" placement="bottom" :show-after="100"> <!-- 选框工具的文字提示，设置 100ms 延迟 -->
      <div
        :class="['tool-btn', modelValue === 'select' ? 'active' : '']"
        @click="handleToolSelect('select')"
      > <!-- 选框工具按钮区域 -->
        <SvgIcon name="xuanze" :size="iconSize" /> <!-- 显示选择图标 -->
      </div> <!-- 按钮区域结束 -->
    </el-tooltip> <!-- 提示组件结束 -->
    <el-divider direction="vertical" /> <!-- 工具组之间的垂直分割线 -->

    <!-- 绘图工具组：包含背景、画笔、橡皮擦、形状、油漆桶和文字工具 -->
    <el-tooltip content="背景 (G)" placement="bottom" :show-after="100"> <!-- 背景工具的文字提示 -->
      <div
        :class="['tool-btn', modelValue === 'background' ? 'active' : '']"
        @click="handleToolSelect('background')"
      > <!-- 背景工具按钮区域 -->
        <SvgIcon name="background" :size="iconSize" /> <!-- 显示背景图标 -->
      </div> <!-- 按钮区域结束 -->
    </el-tooltip> <!-- 提示组件结束 -->
    <el-tooltip content="画笔 (P)" placement="bottom" :show-after="100"> <!-- 画笔工具的文字提示 -->
      <div
        :class="['tool-btn', modelValue === 'pencil' ? 'active' : '']"
        @click="handleToolSelect('pencil')"
      > <!-- 画笔工具按钮区域 -->
        <SvgIcon name="pencil" :size="iconSize" /> <!-- 显示画笔图标 -->
      </div> <!-- 按钮区域结束 -->
    </el-tooltip> <!-- 提示组件结束 -->
    <el-tooltip content="橡皮擦 (E)" placement="bottom" :show-after="100"> <!-- 橡皮擦工具的文字提示 -->
      <div
        :class="['tool-btn', modelValue === 'eraser' ? 'active' : '']"
        @click="handleToolSelect('eraser')"
      > <!-- 橡皮擦工具按钮区域 -->
        <SvgIcon name="eraser" :size="iconSize" /> <!-- 显示橡皮擦图标 -->
      </div> <!-- 按钮区域结束 -->
    </el-tooltip> <!-- 提示组件结束 -->
    <div class="shape-tool-btn-wrapper"> <!-- 形状工具及其弹出面板的包装容器 -->
      <el-tooltip content="形状 (S)" placement="bottom" :show-after="100"> <!-- 形状工具的文字提示 -->
        <div
          :class="['tool-btn', modelValue === 'shape' ? 'active' : '']"
          @click.stop="handleShapeToolClick"
        > <!-- 形状工具按钮区域 -->
          <SvgIcon :name="currentShapeIcon" :size="iconSize" /> <!-- 显示当前选中的形状图标 -->
        </div> <!-- 按钮区域结束 -->
      </el-tooltip> <!-- 提示组件结束 -->
      <ShapeToolPanel
        :model-value="shapeToolType"
        :visible="shapeToolPanelVisible"
        @update:model-value="handleShapeTypeChange"
        @update:visible="shapeToolPanelVisible = $event"
      /> <!-- 形状选择弹出面板组件 -->
    </div> <!-- 包装容器结束 -->
    <el-tooltip content="油漆桶 (B)" placement="bottom" :show-after="100"> <!-- 油漆桶工具的文字提示 -->
      <div
        :class="['tool-btn', modelValue === 'bucket' ? 'active' : '']"
        @click="handleToolSelect('bucket')"
      > <!-- 油漆桶工具按钮区域 -->
        <SvgIcon name="bucket" :size="iconSize" /> <!-- 显示油漆桶图标 -->
      </div> <!-- 按钮区域结束 -->
    </el-tooltip> <!-- 提示组件结束 -->
    <el-tooltip content="文字 (T)" placement="bottom" :show-after="100"> <!-- 文字工具的文字提示 -->
      <div
        :class="['tool-btn', modelValue === 'text' ? 'active' : '']"
        @click="handleToolSelect('text')"
      > <!-- 文字工具按钮区域 -->
        <SvgIcon name="text" :size="iconSize" /> <!-- 显示文字图标 -->
      </div> <!-- 按钮区域结束 -->
    </el-tooltip> <!-- 提示组件结束 -->

    <!-- 资源工具：包含资源库管理 -->
    <div class="resource-tool-btn-wrapper"> <!-- 资源工具及其弹出面板的包装容器 -->
      <el-tooltip content="资源 (R)" placement="bottom" :show-after="100"> <!-- 资源工具的文字提示 -->
        <div
          :class="['tool-btn', resourcePanelVisible ? 'active' : '']"
          @click.stop="handleResourceToolClick"
        > <!-- 资源工具按钮区域 -->
          <SvgIcon name="resource" :size="iconSize" /> <!-- 显示资源图标 -->
        </div> <!-- 按钮区域结束 -->
      </el-tooltip> <!-- 提示组件结束 -->
      <ResourceToolPanel
        :visible="resourcePanelVisible"
        @resource-select="handleResourceSelect"
        @resource-mousedown="handleResourceMouseDown"
        @update:visible="resourcePanelVisible = $event"
      /> <!-- 资源库选择弹出面板组件 -->
    </div> <!-- 包装容器结束 -->

    <!-- 使用说明：描述功能作用及快捷键 -->
    <el-tooltip content="使用说明" placement="bottom" :show-after="100"> <!-- 帮助提示 -->
      <div class="tool-btn" @click="helpDialogVisible = true"> <!-- 点击打开说明弹窗 -->
        <el-icon :size="iconSize"><QuestionFilled /></el-icon> <!-- 使用 Element Plus 的问号图标 -->
      </div> <!-- 按钮结束 -->
    </el-tooltip> <!-- 提示结束 -->

    <el-divider direction="vertical" /> <!-- 绘图工具与操作工具之间的垂直分割线 -->

    <!-- 操作工具组：包含清空和保存操作 -->
    <el-tooltip content="清空画板" placement="bottom" :show-after="100"> <!-- 清空功能提示 -->
      <div class="tool-btn" @click="handleClear"> <!-- 清空画板按钮 -->
        <SvgIcon name="clear" :size="iconSize" /> <!-- 显示清空图标 -->
      </div> <!-- 按钮结束 -->
    </el-tooltip> <!-- 提示结束 -->
    <el-divider direction="vertical" /> <!-- 分割线 -->
    <el-tooltip content="保存" placement="bottom" :show-after="100"> <!-- 保存功能提示 -->
      <div class="tool-btn" @click="handleSaveMap"> <!-- 保存地图按钮 -->
        <SvgIcon name="save" :size="iconSize" /> <!-- 显示保存图标 -->
      </div> <!-- 按钮结束 -->
    </el-tooltip> <!-- 提示结束 -->

    <!-- 地图功能使用说明弹窗 -->
    <el-dialog
      v-model="helpDialogVisible"
      title="地图功能使用说明"
      width="600px"
      append-to-body
      class="help-dialog"
    > <!-- 帮助说明弹窗 -->
      <div class="help-content"> <!-- 说明内容容器 -->
        <section class="help-section"> <!-- 功能介绍区块 -->
          <h3>🎨 工具介绍</h3> <!-- 区块标题 -->
          <ul> <!-- 功能列表 -->
            <li><strong>选择 (V):</strong> 选中元素后可进行移动、缩放和旋转。</li> <!-- 选择工具说明 -->
            <li><strong>移动 (H):</strong> 拖拽画布以查看不同区域。</li> <!-- 移动工具说明 -->
            <li><strong>背景 (G):</strong> 更改地图底色。</li> <!-- 背景工具说明 -->
            <li><strong>画笔 (P):</strong> 自由绘制线条。</li> <!-- 画笔工具说明 -->
            <li><strong>橡皮擦 (E):</strong> 擦除已绘制的内容。</li> <!-- 橡皮擦说明 -->
            <li><strong>形状 (S):</strong> 绘制直线、矩形、圆形、星形等。</li> <!-- 形状说明 -->
            <li><strong>油漆桶 (B):</strong> 点击闭合区域进行颜色填充。</li> <!-- 油漆桶说明 -->
            <li><strong>文字 (T):</strong> 点击画布添加文字，双击可编辑。</li> <!-- 文字说明 -->
            <li><strong>资源 (R):</strong> 内置图标素材，支持导入本地 JPG/PNG/WebP 图片。</li> <!-- 资源说明 -->
          </ul> <!-- 列表结束 -->
        </section> <!-- 区块结束 -->

        <section class="help-section"> <!-- 快捷操作区块 -->
          <h3>⌨️ 快捷键与技巧</h3> <!-- 区块标题 -->
          <ul> <!-- 快捷键列表 -->
            <li><strong>空格键 (Space):</strong> 按住可临时切换为移动工具。</li> <!-- 空格键说明 -->
            <li><strong>Shift 键:</strong> 调整资源或图片大小时，按住可锁定纵横比。</li> <!-- Shift键说明 -->
            <li><strong>Ctrl + Z / Y:</strong> 撤销与重做操作。</li> <!-- 撤销重做说明 -->
            <li><strong>鼠标滚轮:</strong> 缩放画布视图。</li> <!-- 滚轮说明 -->
            <li><strong>Shift + 滚轮:</strong> 左右平移画布。</li> <!-- 水平平移说明 -->
            <li><strong>资源导入:</strong> 在资源面板点击“导入图片”可添加本地素材。</li> <!-- 导入说明 -->
          </ul> <!-- 列表结束 -->
        </section> <!-- 区块结束 -->
      </div> <!-- 内容容器结束 -->
      <template #footer> <!-- 弹窗底部 -->
        <el-button type="primary" @click="helpDialogVisible = false">知道了</el-button> <!-- 关闭按钮 -->
      </template> <!-- 底部结束 -->
    </el-dialog> <!-- 弹窗结束 -->
  </div> <!-- 工具栏容器结束 -->
</template> <!-- 模板部分结束 -->

<script setup> // 脚本部分开始
import { ref, watch, computed } from 'vue' // 导入 Vue 核心 API
import { QuestionFilled } from '@element-plus/icons-vue' // 导入 Element Plus 问号图标
import ShapeToolPanel from './ShapeToolPanel.vue' // 导入形状面板组件
import ResourceToolPanel from './ResourceToolPanel.vue' // 导入资源面板组件

const props = defineProps({ // 定义组件接收的属性
  modelValue: { // 当前选中的主工具名
    type: String, // 字符串类型
    required: true // 必填属性
  }, // modelValue 属性结束
  shapeToolType: { // 当前选中的形状子类型
    type: String, // 字符串类型
    default: 'rect' // 默认选中矩形
  }, // shapeToolType 属性结束
  shapeToolRoundness: { // 形状的圆角属性
    type: String, // 字符串类型
    default: 'round' // 默认使用圆角
  } // shapeToolRoundness 属性结束
}) // props 定义结束

const iconSize = 18 // 定义工具栏图标的统一尺寸

const emit = defineEmits([ // 定义组件可触发的事件
  'update:modelValue', // 更新当前选中工具
  'clear', // 清空画布事件
  'resource-select', // 选择资源事件
  'resource-mousedown', // 资源按下事件
  'save-map', // 保存地图事件
  'shape-type-change', // 形状类型变更事件
  'roundness-change' // 圆角设置变更事件
]) // emit 定义结束

const resourcePanelVisible = ref(false) // 定义资源面板的可见性响应式变量
const shapeToolPanelVisible = ref(false) // 定义形状面板的可见性响应式变量
const helpDialogVisible = ref(false) // 定义帮助说明弹窗的可见性变量

const shapeIconMap = { // 定义形状类型到图标名称的映射对象
  line: 'line', // 直线映射
  circle: 'circle', // 圆形映射
  rect: 'rect', // 矩形映射
  'rounded-rect': 'rounded-rect', // 圆角矩形映射
  star: 'star', // 星形映射
  arrow: 'right-arrow' // 箭头映射
} // 映射对象结束

const currentShapeIcon = computed(() => { // 计算当前应该显示的形状图标
  return shapeIconMap[props.shapeToolType] || 'polygon' // 返回对应图标，默认显示多边形
}) // 计算属性结束

watch( // 监听主工具的变化
  () => props.modelValue, // 监听目标：props.modelValue
  (newTool) => { // 变化回调函数
    if (newTool !== 'shape') { // 如果切换到非形状工具
      shapeToolPanelVisible.value = false // 自动关闭形状面板
    } // 判断结束
    if (newTool !== 'resource') { // 如果切换到非资源工具
      resourcePanelVisible.value = false // 自动关闭资源面板
    } // 判断结束
  } // 回调结束
) // watch 结束

function handleToolSelect(tool) { // 处理普通工具选择的函数
  emit('update:modelValue', tool) // 向上触发更新选中工具事件
} // 函数结束

function handleShapeToolClick() { // 处理形状工具点击的函数
  emit('update:modelValue', 'shape') // 切换当前工具为形状
  shapeToolPanelVisible.value = !shapeToolPanelVisible.value // 切换形状面板的显示状态
} // 函数结束

function handleResourceToolClick() { // 处理资源工具点击的函数
  emit('update:modelValue', 'resource') // 切换当前工具为资源
  resourcePanelVisible.value = !resourcePanelVisible.value // 切换资源面板的显示状态
} // 函数结束

function handleShapeTypeChange(type) { // 处理形状类型变更的函数
  emit('shape-type-change', type) // 向上触发形状类型改变事件
  shapeToolPanelVisible.value = false // 选择后自动关闭形状面板
} // 函数结束

function handleClear() { // 处理清空画板的函数
  emit('clear') // 向上触发清空事件
} // 函数结束

function handleResourceSelect(resource) { // 处理资源选择的函数
  emit('resource-select', resource) // 向上触发资源选中事件
} // 函数结束

function handleResourceMouseDown(resource, event) { // 处理资源按下的函数
  emit('resource-mousedown', resource, event) // 向上触发资源按下事件并传递事件对象
} // 函数结束

function handleSaveMap() { // 处理保存地图的函数
  emit('save-map') // 向上触发保存地图事件
} // 函数结束
</script> // 脚本部分结束

<style lang="scss" scoped> // 样式部分开始
.map-toolbar { // 工具栏主容器样式
  display: flex; // 使用弹性布局
  gap: 5px; // 设置子元素间距
  align-items: center; // 垂直居中对齐
  justify-content: center; // 水平居中对齐
  position: fixed; // 固定定位
  top: 8px; // 距离顶部 8 像素
  left: 50%; // 水平居中起始位置
  transform: translateX(-50%); // 水平居中偏移校正
  z-index: 1000; // 确保在最顶层显示
  width: max-content; // 宽度根据内容自适应
  padding: 5px 10px; // 设置内边距
  background: #ffffff; // 背景颜色为白色
  border-radius: 12px; // 设置大圆角
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); // 设置外阴影
  flex-wrap: wrap; // 允许内容换行

  .tool-btn { // 单个工具按钮的通用样式
    width: 32px; // 宽度 32 像素
    height: 32px; // 高度 32 像素
    cursor: pointer; // 鼠标悬浮显示手形
    border-radius: 6px; // 按钮圆角
    padding: 6px; // 按钮内边距
    color: #000; // 图标颜色为黑色
    font-size: 24px; // 字体大小 24 像素
    display: flex; // 弹性布局
    align-items: center; // 居中对齐
    justify-content: center; // 居中对齐
    border: 1px solid transparent; // 默认透明边框
    transition: all 0.3s; // 启用全属性过渡动画

    img { // 按钮内图片的样式
      width: 100%; // 宽度撑满
      height: 100%; // 高度撑满
      display: block; // 块级显示
    } // img 样式结束

    &.active, // 激活状态下的样式
    &:hover:not(.disabled) { // 悬浮状态且非禁用下的样式
      border: 1px solid var(--el-color-primary); // 显示品牌色边框
      background-color: rgba(64, 158, 255, 0.1); // 显示浅蓝色背景
    } // 状态伪类结束

    &.disabled { // 禁用状态下的样式
      opacity: 0.5; // 设置半透明
      cursor: not-allowed; // 鼠标悬浮显示禁用图标
    } // 禁用样式结束
  } // tool-btn 样式结束

  .shape-tool-btn-wrapper, // 形状工具包装器
  .resource-tool-btn-wrapper { // 资源工具包装器
    position: relative; // 设置为相对定位，作为面板弹出的参考基准
  } // 包装器样式结束
} // map-toolbar 样式结束

.help-dialog { // 帮助弹窗全局样式
  :deep(.el-dialog__body) { // 深度选择器修改弹窗主体内边距
    padding-top: 10px; // 设置顶部内边距
  } // body 样式结束

  .help-content { // 帮助内容容器
    color: #303133; // 设置主要文字颜色

    .help-section { // 帮助区块样式
      margin-bottom: 20px; // 设置区块间距

      h3 { // 区块标题样式
        margin-bottom: 12px; // 设置标题下边距
        display: flex; // 弹性布局
        align-items: center; // 垂直居中
        gap: 8px; // 图标与文字间距
        font-size: 16px; // 设置字号
        color: var(--el-color-primary); // 使用品牌色
      } // h3 样式结束

      ul { // 列表样式
        padding-left: 20px; // 设置左内边距
        margin: 0; // 清除默认外边距

        li { // 列表项样式
          margin-bottom: 8px; // 设置项间距
          line-height: 1.6; // 设置行高
          font-size: 14px; // 设置字号

          strong { // 重点文字样式
            color: #1d1d1f; // 设置更深的颜色
            margin-right: 4px; // 设置右边距
          } // strong 样式结束
        } // li 样式结束
      } // ul 样式结束
    } // help-section 样式结束
  } // help-content 样式结束
} // help-dialog 样式结束
</style> // 样式部分结束
