<template>
  <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80">
    <div ref="chartRef" class="w-full transition-all duration-300" :style="{ height: height }"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

defineProps({
  height: {
    type: String,
    default: '200px'
  }
})

const chartRef = ref(null)
let chart = null

// 获取最近30天的日期数组
function getLast30Days() {
  const dates = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
}

// 初始化图表
function initChart() {
  if (!chartRef.value) return

  chart = echarts.init(chartRef.value)
  const dates = getLast30Days()

  // 设置现代化图表配置
  const option = {
    title: {
      text: '最近30天净增字数统计',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 16,
        fontWeight: 600,
        color: '#374151'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#374151'
      },
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(99, 102, 241, 0.1)'
        }
      },
      formatter: (params) => {
        const data = params[0]
        const value = data.value
        const sign = value >= 0 ? '+' : ''
        return `<div class="font-medium">${data.name}</div><div class="text-sm text-gray-600">${data.seriesName}：<span class="font-semibold text-primary-600">${sign}${value}字</span></div>`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '5%',
      top: '18%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 12,
        formatter: (value) => value.slice(5) // 只显示月-日
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      name: '字数',
      nameTextStyle: {
        color: '#6b7280',
        fontSize: 12
      },
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          color: '#f3f4f6',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '日净增字数',
        type: 'bar',
        data: new Array(30).fill(0),
        barWidth: '60%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#818cf8' },
            { offset: 1, color: '#6366f1' }
          ]),
          borderRadius: [6, 6, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#a5b4fc' },
              { offset: 1, color: '#818cf8' }
            ])
          }
        }
      }
    ]
  }

  chart.setOption(option)

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
}

// 更新图表数据
async function updateChartData() {
  if (!chart) return

  try {
    // 获取所有书籍的每日净增字数统计
    const result = await window.electron.getAllBooksDailyStats()
    // console.log('获取图表数据结果:', result) // 调试日志
    if (result.success) {
      const dates = getLast30Days()
      const netWordsData = dates.map((date) => {
        let totalNetWords = 0
        // 累加所有书籍在该日期的净增字数
        Object.values(result.data).forEach((bookStats) => {
          if (bookStats[date]) {
            totalNetWords += bookStats[date].netWords || 0
          }
        })
        return totalNetWords
      })

      // console.log('图表数据:', netWordsData) // 调试日志

      chart.setOption({
        series: [
          {
            name: '日净增字数',
            data: netWordsData
          }
        ]
      })
    }
  } catch (error) {
    console.error('获取码字统计数据失败:', error)
  }
}

// 处理窗口大小变化
function handleResize() {
  chart && chart.resize()
}

// 暴露更新方法
defineExpose({
  updateData: updateChartData
})

onMounted(() => {
  // console.log('WordCountChart 组件已挂载') // 调试日志
  // 延迟初始化，确保 DOM 已完全渲染
  setTimeout(() => {
    initChart()
    updateChartData()
  }, 100)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart && chart.dispose()
})
</script>


<style lang="scss" scoped>
/* 样式已通过内联 style 绑定 */
</style>

