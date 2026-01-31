import { ref } from 'vue'

/**
 * 资源工具 composable
 */
export function useResourceTool({ canvasRef, elements, history, renderCanvas, getCanvasPos }) {
  const draggingResource = ref(null)
  const dragPreviewEl = ref(null)

  /**
   * 选择资源
   */
  function selectResource(resource) {
    startResourceDrag(resource, null)
  }

  /**
   * 开始拖拽资源
   */
  function startResourceDrag(resource, event) {
    // 先清理之前的拖拽状态，避免重复拖拽时状态混乱
    cleanupDragState()

    draggingResource.value = resource

    // 支持图标资源
    if (resource.icon) {
      // 创建 SVG 图标元素作为拖拽预览
      dragPreviewEl.value = document.createElement('div')
      dragPreviewEl.value.innerHTML = `<svg style="width: 40px; height: 40px;"><use xlink:href="#icon-${resource.icon}"></use></svg>`
      dragPreviewEl.value.style.position = 'fixed'
      dragPreviewEl.value.style.pointerEvents = 'none'
      dragPreviewEl.value.style.zIndex = '9999'
      dragPreviewEl.value.style.width = '40px'
      dragPreviewEl.value.style.height = '40px'
    } else {
      // 兼容旧的图片资源
      dragPreviewEl.value = document.createElement('img')
      dragPreviewEl.value.src = resource.url
      dragPreviewEl.value.style.position = 'fixed'
      dragPreviewEl.value.style.pointerEvents = 'none'
      dragPreviewEl.value.style.zIndex = '9999'
      dragPreviewEl.value.style.width = '40px'
      dragPreviewEl.value.style.height = '40px'
    }
    document.body.appendChild(dragPreviewEl.value)

    window.addEventListener('mousemove', onResourceDragMove)
    window.addEventListener('mouseup', onResourceDragEnd)
    if (event) {
      onResourceDragMove(event)
    }
  }

  /**
   * 清理拖拽状态（移除事件监听器和预览元素）
   */
  function cleanupDragState() {
    // 移除事件监听器
    window.removeEventListener('mousemove', onResourceDragMove)
    window.removeEventListener('mouseup', onResourceDragEnd)

    // 移除预览元素
    if (dragPreviewEl.value) {
      try {
        if (dragPreviewEl.value.parentNode) {
          document.body.removeChild(dragPreviewEl.value)
        }
      } catch (error) {
        // 忽略错误（元素可能已经被移除）
        console.error(error)
      }
      dragPreviewEl.value = null
    }

    // 注意：不清空 draggingResource.value，因为可能正在使用
  }

  /**
   * 拖拽资源移动
   */
  function onResourceDragMove(e) {
    if (!dragPreviewEl.value) return
    dragPreviewEl.value.style.left = e.clientX - 20 + 'px'
    dragPreviewEl.value.style.top = e.clientY - 20 + 'px'
  }

  /**
   * 拖拽资源结束
   */
  function onResourceDragEnd(e) {
    // 保存当前拖拽的资源，因为 cleanupDragState 会清理状态
    const currentResource = draggingResource.value

    // 先清理拖拽状态
    cleanupDragState()

    // 如果没有资源或画布，直接返回
    if (!currentResource || !canvasRef.value) {
      draggingResource.value = null
      return
    }

    // 检查是否在画布内释放
    const canvasRect = canvasRef.value.getBoundingClientRect()
    if (
      e.clientX >= canvasRect.left &&
      e.clientX <= canvasRect.right &&
      e.clientY >= canvasRect.top &&
      e.clientY <= canvasRect.bottom
    ) {
      // 使用 getCanvasPos 获取画布坐标
      const pos = getCanvasPos(e)
      drawResourceOnCanvas(currentResource, pos.x, pos.y)
    }

    // 清空拖拽资源引用
    draggingResource.value = null
  }

  /**
   * 资源鼠标按下事件
   */
  function onResourceMouseDown(resource, event) {
    event.preventDefault()
    startResourceDrag(resource, event)
  }

  /**
   * 在画布上绘制资源
   */
  function drawResourceOnCanvas(resource, x, y) {
    if (!canvasRef.value || !history.value) return // 基础检查

    // 在创建元素前保存状态
    history.value.saveState() // 保存历史记录

    // 计算初始尺寸
    let initialWidth = 40 // 默认宽度
    let height = 40 // 默认高度

    if (resource.isLocal && resource.width && resource.height) {
      // 如果是本地导入的图片，根据原始尺寸计算初始大小，但不超过 200px
      const maxSize = 200 // 最大尺寸限制
      if (resource.width > resource.height) {
        initialWidth = Math.min(resource.width, maxSize) // 宽度受限
        height = initialWidth / resource.aspectRatio // 根据比例计算高度
      } else {
        height = Math.min(resource.height, maxSize) // 高度受限
        initialWidth = height * resource.aspectRatio // 根据比例计算宽度
      }
    }

    // 保存资源元素（支持图标和图片两种类型）
    const resourceElement = {
      type: 'resource', // 元素类型
      name: resource.name, // 资源名称
      x: x, // x 坐标
      y: y, // y 坐标
      width: initialWidth, // 初始宽度
      height: height, // 初始高度
      id: Date.now().toString() // 生成唯一 ID
    }

    // 存储纵横比，以便后续等比例缩放
    if (resource.aspectRatio) {
      resourceElement.aspectRatio = resource.aspectRatio // 保存纵横比
    }

    // 优先使用图标，如果没有图标则使用 URL（兼容旧数据）
    if (resource.icon) {
      resourceElement.icon = resource.icon // 图标名称
    } else if (resource.url) {
      resourceElement.url = resource.url // 图片 URL 或 base64
    }

    elements.resourceElements.value.push(resourceElement) // 添加到元素列表

    // 重新渲染画布
    renderCanvas(true) // 触发重绘
  }

  return {
    draggingResource,
    dragPreviewEl,
    selectResource,
    startResourceDrag,
    onResourceDragMove,
    onResourceDragEnd,
    onResourceMouseDown,
    drawResourceOnCanvas,
    cleanupDragState // 导出清理函数，供组件卸载时调用
  }
}
