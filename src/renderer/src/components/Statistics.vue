<template>
  <div class="statistics-container p-6 overflow-y-auto w-full h-full"> <!-- 统计容器 -->
    <div class="grid grid-cols-12 gap-6"> <!-- 12列栅格布局 -->
      
      <!-- 左侧：日历和统计卡片 -->
      <div class="col-span-6 space-y-6"> <!-- 左侧占6列 -->
        
        <!-- 日历组件 -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4"> <!-- 日历背景容器 -->
          <el-calendar v-model="selectedDate"> <!-- Element Plus 日历 -->
            <template #header="{ date }"> <!-- 自定义头部 -->
              <div class="flex items-center justify-between w-full px-2"> <!-- 头部容器 -->
                <button @click="prevMonth" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"> <!-- 上个月按钮 -->
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <!-- 左箭头图标 -->
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /> <!-- 图标路径 -->
                  </svg> <!-- 图标结束 -->
                </button> <!-- 按钮结束 -->
                <span class="text-lg font-bold">{{ formatDate(date) }}</span> <!-- 当前年月显示 -->
                <button @click="nextMonth" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"> <!-- 下个月按钮 -->
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <!-- 右箭头图标 -->
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /> <!-- 图标路径 -->
                  </svg> <!-- 图标结束 -->
                </button> <!-- 按钮结束 -->
              </div> <!-- 容器结束 -->
            </template> <!-- 模板结束 -->
            <template #date-cell="{ data }"> <!-- 自定义日期单元格 -->
              <div class="flex flex-col items-center justify-center h-full relative"> <!-- 单元格容器 -->
                <div class="date-content-wrapper flex flex-col items-center justify-center" :class="{ 'is-selected': data.isSelected, 'has-words': getDailyWords(data.day) > 0 }"> <!-- 统一内容容器 -->
                  <span class="date-number" :class="{ 'text-accent font-bold': isToday(data.day) && !data.isSelected }"> <!-- 日期数字 -->
                    {{ data.day.split('-').slice(2).join('') }} <!-- 截取日期部分 -->
                  </span> <!-- 数字结束 -->
                  <span class="date-words"> <!-- 字数显示 -->
                    {{ getDailyWords(data.day) }} <!-- 字数内容 -->
                  </span> <!-- 显示结束 -->
                  <div v-if="isToday(data.day) && !data.isSelected" class="today-indicator"></div> <!-- 今日小圆点 -->
                </div> <!-- 容器结束 -->
              </div> <!-- 容器结束 -->
            </template> <!-- 模板结束 -->
          </el-calendar> <!-- 日历结束 -->
          <div class="mt-4 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl text-center text-xs text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis"> <!-- 底部提示栏 -->
            【 {{ dayjs(selectedDate).format('YYYY年M月D日') }} 】 
            <template v-if="getDailyWords(dayjs(selectedDate).format('YYYY-MM-DD')) > 0"> <!-- 如果当日有码字 -->
              码字{{ getDailyWords(dayjs(selectedDate).format('YYYY-MM-DD')) }}字，时长{{ formatDurationZh(getDailyDuration(dayjs(selectedDate).format('YYYY-MM-DD'))) }} <!-- 显示字数和时长 -->
            </template> <!-- 判断结束 -->
            <template v-else> <!-- 如果当日无码字 -->
              尚未码字，加油哦~ <!-- 显示鼓励话语 -->
            </template> <!-- 判断结束 -->
          </div> <!-- 提示栏结束 -->
        </div> <!-- 容器结束 -->

        <!-- 汇总统计卡片 -->
        <div class="grid grid-cols-2 gap-4"> <!-- 2列汇总卡片网格 -->
          <div v-for="card in summaryCards" :key="card.title" class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between min-h-[110px]"> <!-- 汇总卡片 -->
            <div class="flex items-center gap-2 mb-1.5"> <!-- 卡片头部 -->
              <span class="text-sm font-bold text-accent">{{ card.title }}</span> <!-- 卡片标题 -->
            </div> <!-- 头部结束 -->
            <div class="space-y-1"> <!-- 数据列表 -->
              <div class="flex items-center text-[12px]"> <!-- 字数项 -->
                <span class="text-gray-400 w-10 shrink-0">字数:</span> <!-- 标签 -->
                <span class="font-bold flex-1 text-right truncate">{{ card.words }} <span class="font-normal text-gray-400 ml-0.5">字</span></span> <!-- 数值 -->
              </div> <!-- 项结束 -->
              <div class="flex items-center text-[12px]"> <!-- 时长项 -->
                <span class="text-gray-400 w-10 shrink-0">时长:</span> <!-- 标签 -->
                <span class="font-bold flex-1 text-right truncate">{{ card.duration }}</span> <!-- 数值 -->
              </div> <!-- 项结束 -->
              <div class="flex items-center text-[12px]"> <!-- 速度项 -->
                <span class="text-gray-400 w-10 shrink-0">速度:</span> <!-- 标签 -->
                <span class="font-bold flex-1 text-right truncate">{{ card.speed }} <span class="font-normal text-gray-400 ml-0.5 text-[10px]">字/时</span></span> <!-- 数值 -->
              </div> <!-- 项结束 -->
            </div> <!-- 列表结束 -->
          </div> <!-- 卡片结束 -->
        </div> <!-- 网格结束 -->

        <!-- 专项统计卡片 -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"> <!-- 专项统计容器 -->
          <div class="grid grid-cols-3 gap-4"> <!-- 3列专项网格 -->
            <div v-for="stat in specificStats" :key="stat.label" class="flex flex-col items-start overflow-hidden"> <!-- 专项项 -->
              <div class="text-accent text-[10px] font-bold mb-2 truncate w-full">{{ stat.label }}</div> <!-- 标签 -->
              <div class="flex items-baseline gap-0.5 w-full overflow-hidden"> <!-- 数值容器 -->
                <span class="text-xl font-bold tracking-tight truncate">{{ stat.value }}</span> <!-- 数值 -->
                <span class="text-[10px] text-gray-400 font-medium shrink-0">{{ stat.unit }}</span> <!-- 单位 -->
              </div> <!-- 容器结束 -->
            </div> <!-- 项结束 -->
          </div> <!-- 网格结束 -->
        </div> <!-- 容器结束 -->

        <!-- 累计统计卡片 -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"> <!-- 累计统计容器 -->
          <div class="grid grid-cols-2 gap-6"> <!-- 2列累计网格 -->
            <div v-for="stat in cumulativeStats" :key="stat.label" class="flex flex-col items-start px-2 overflow-hidden"> <!-- 累计项 -->
              <div class="text-accent text-[10px] font-bold mb-2 truncate w-full">{{ stat.label }}</div> <!-- 标签 -->
              <div class="flex items-baseline gap-0.5 w-full overflow-hidden"> <!-- 数值容器 -->
                <span class="text-2xl font-bold tracking-tight truncate">{{ stat.value }}</span> <!-- 数值 -->
                <span class="text-[10px] text-gray-400 font-medium shrink-0">{{ stat.unit }}</span> <!-- 单位 -->
              </div> <!-- 容器结束 -->
            </div> <!-- 项结束 -->
          </div> <!-- 网格结束 -->
        </div> <!-- 容器结束 -->

      </div> <!-- 左侧结束 -->

      <!-- 右侧：图表统计 -->
      <div class="col-span-6 space-y-6"> <!-- 右侧占6列 -->
        
        <!-- 时长统计图表 -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col h-[400px]"> <!-- 图表容器 -->
          <div class="flex items-center justify-between mb-4"> <!-- 图表头部 -->
            <h3 class="text-lg font-bold">时长统计</h3> <!-- 标题 -->
            <div class="flex gap-4"> <!-- 切换按钮容器 -->
              <button 
                @click="durationRange = 'week'" 
                :class="durationRange === 'week' ? 'text-black dark:text-white font-bold' : 'text-gray-400'"
                class="text-sm transition-colors"
              >本周</button> <!-- 本周切换 -->
              <button 
                @click="durationRange = 'month'" 
                :class="durationRange === 'month' ? 'text-black dark:text-white font-bold' : 'text-gray-400'"
                class="text-sm transition-colors"
              >本月</button> <!-- 本月切换 -->
            </div> <!-- 容器结束 -->
          </div> <!-- 头部结束 -->
          <div ref="durationChartRef" class="flex-1 w-full"></div> <!-- ECharts 挂载点 -->
        </div> <!-- 容器结束 -->

        <!-- 字数统计图表 -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col h-[400px]"> <!-- 图表容器 -->
          <div class="flex items-center justify-between mb-4"> <!-- 图表头部 -->
            <h3 class="text-lg font-bold">字数统计</h3> <!-- 标题 -->
            <div class="flex gap-4"> <!-- 切换按钮容器 -->
              <button 
                @click="wordsRange = 'week'" 
                :class="wordsRange === 'week' ? 'text-black dark:text-white font-bold' : 'text-gray-400'"
                class="text-sm transition-colors"
              >本周</button> <!-- 本周切换 -->
              <button 
                @click="wordsRange = 'month'" 
                :class="wordsRange === 'month' ? 'text-black dark:text-white font-bold' : 'text-gray-400'"
                class="text-sm transition-colors"
              >本月</button> <!-- 本月切换 -->
            </div> <!-- 容器结束 -->
          </div> <!-- 头部结束 -->
          <div ref="wordsChartRef" class="flex-1 w-full"></div> <!-- ECharts 挂载点 -->
        </div> <!-- 容器结束 -->

      </div> <!-- 右侧结束 -->

    </div> <!-- 网格结束 -->
  </div> <!-- 容器结束 -->
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue' // 导入 Vue 核心 API
import * as echarts from 'echarts' // 导入 ECharts
import dayjs from 'dayjs' // 导入 dayjs

// 状态定义
const selectedDate = ref(new Date()) // 当前选中的日期
const durationRange = ref('week') // 时长统计范围
const wordsRange = ref('week') // 字数统计范围
const durationChartRef = ref(null) // 时长图表引用
const wordsChartRef = ref(null) // 字数图表引用
let durationChart = null // 时长图表实例
let wordsChart = null // 字数图表实例

// 汇总统计卡片数据
const summaryCards = ref([
  { title: '今日', words: 0, duration: '0:00:00', speed: 0, key: 'today' }, // 今日统计卡片
  { title: '昨日', words: 0, duration: '0:00:00', speed: 0, key: 'yesterday' }, // 昨日统计卡片
  { title: '本周', words: 0, duration: '0:00:00', speed: 0, key: 'week' }, // 本周统计卡片
  { title: '本月', words: 0, duration: '0:00:00', speed: 0, key: 'month' }  // 本月统计卡片
]) // 汇总卡片列表

// 专项统计数据
const specificStats = ref([
  { label: '单日最多码字', value: 0, unit: '字' }, // 最高纪录字数
  { label: '对应码字时长', value: '0时0分', unit: '' }, // 最高纪录当日时长
  { label: '对应码字速度', value: 0, unit: '字 / 时' } // 最高纪录当日速度
]) // 专项统计列表

// 累计统计数据
const cumulativeStats = ref([
  { label: '累计总码字', value: 0, unit: '字' }, // 累计总字数
  { label: '码字总时长', value: '0时0分', unit: '' } // 累计总时长
]) // 累计统计列表

// 统计原始数据
const allStats = ref({}) // 所有书籍的原始统计数据

// 格式化时长 (时:分:秒)
const formatDuration = (seconds) => {
  if (!seconds) return '0:00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// 格式化时长 (中文)
const formatDurationZh = (seconds) => {
  if (!seconds) return '0时0分'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) {
    return `${h}时${m}分`
  }
  return `${m}分钟`
}

// 获取指定日期的总字数
const getDailyWords = (day) => {
  let words = 0 // 初始化计数
  Object.values(allStats.value).forEach(bookStats => { // 遍历所有书
    if (bookStats[day]) { // 如果该书该日有记录
      words += bookStats[day].netWords || 0 // 累加字数
    }
  })
  return words // 返回结果
} // 函数结束

// 获取指定日期的总时长
const getDailyDuration = (day) => {
  let duration = 0 // 初始化计数
  Object.values(allStats.value).forEach(bookStats => { // 遍历所有书
    if (bookStats[day]) { // 如果该书该日有记录
      duration += bookStats[day].duration || 0 // 累加时长
    }
  })
  return duration // 返回结果
} // 函数结束

// 加载统计数据
const loadData = async () => {
  try { // 异常处理
    const result = await window.electron.getAllBooksDailyStats() // 获取所有书籍统计数据
    if (result.success) { // 如果获取成功
      allStats.value = result.data || {} // 保存数据到状态中
      calculateStats() // 执行汇总数据计算
      updateCharts() // 执行图表数据更新
    }
  } catch (error) { // 捕获异常
    console.error('加载统计数据失败:', error) // 打印错误详情
  }
} // 函数结束

// 计算汇总数据
const calculateStats = () => {
  const today = dayjs().format('YYYY-MM-DD') // 获取今日日期字符串
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD') // 获取昨日日期字符串
  const startOfWeek = dayjs().startOf('week').format('YYYY-MM-DD') // 获取本周开始日期
  const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD') // 获取本月开始日期

  // 按日期聚合所有书籍的数据
  const dailyAggregated = {} // 存储每日汇总数据
  Object.values(allStats.value).forEach(bookStats => { // 遍历所有书
    Object.entries(bookStats).forEach(([date, stats]) => { // 遍历该书每日数据
      if (!dailyAggregated[date]) { // 如果该日期尚未记录
        dailyAggregated[date] = { words: 0, duration: 0 } // 初始化
      }
      dailyAggregated[date].words += stats.netWords || 0 // 累加字数
      dailyAggregated[date].duration += stats.duration || 0 // 累加时长
    })
  })

  let todayWords = 0 // 初始化今日总字数
  let yesterdayWords = 0 // 初始化昨日总字数
  let weekWords = 0 // 初始化本周总字数
  let monthWords = 0 // 初始化本月总字数
  let maxDailyWords = 0 // 初始化历史最高单日字数
  let maxDailyWordsDuration = 0 // 对应最高字数日期的时长
  let totalWords = 0 // 初始化累计总字数
  let totalDuration = 0 // 初始化累计总时长

  let todayDuration = 0 // 初始化今日总时长
  let yesterdayDuration = 0 // 初始化昨日总时长
  let weekDuration = 0 // 初始化本周总时长
  let monthDuration = 0 // 初始化本月总时长

  // 遍历聚合后的每日数据
  Object.entries(dailyAggregated).forEach(([date, stats]) => {
    const words = stats.words // 该日总字数
    const duration = stats.duration // 该日总时长
    
    if (date === today) {
      todayWords = words // 今日字数
      todayDuration = duration // 今日时长
    }
    if (date === yesterday) {
      yesterdayWords = words // 昨日字数
      yesterdayDuration = duration // 昨日时长
    }
    if (dayjs(date).isAfter(dayjs(startOfWeek).subtract(1, 'day'))) {
      weekWords += words // 累加本周字数
      weekDuration += duration // 累加本周时长
    }
    if (dayjs(date).isAfter(dayjs(startOfMonth).subtract(1, 'day'))) {
      monthWords += words // 累加本月字数
      monthDuration += duration // 累加本月时长
    }
    
    // 寻找历史最高单日码字纪录
    if (words > maxDailyWords) {
      maxDailyWords = words // 更新最高字数
      maxDailyWordsDuration = duration // 记录该日对应的时长
    }
    
    totalWords += words // 累加总历史字数
    totalDuration += duration // 累加总历史时长
  })

  // 速度计算辅助函数
  const calcSpeed = (w, d) => d > 60 ? Math.round(w / (d / 3600)) : 0

  // 更新汇总卡片的数据
  summaryCards.value[0].words = todayWords
  summaryCards.value[0].duration = formatDuration(todayDuration)
  summaryCards.value[0].speed = calcSpeed(todayWords, todayDuration)

  summaryCards.value[1].words = yesterdayWords
  summaryCards.value[1].duration = formatDuration(yesterdayDuration)
  summaryCards.value[1].speed = calcSpeed(yesterdayWords, yesterdayDuration)

  summaryCards.value[2].words = weekWords
  summaryCards.value[2].duration = formatDuration(weekDuration)
  summaryCards.value[2].speed = calcSpeed(weekWords, weekDuration)

  summaryCards.value[3].words = monthWords
  summaryCards.value[3].duration = formatDuration(monthDuration)
  summaryCards.value[3].speed = calcSpeed(monthWords, monthDuration)
  
  // 更新专项统计（基于最高字数纪录日）
  specificStats.value[0].value = maxDailyWords // 最高字数
  specificStats.value[1].value = formatDurationZh(maxDailyWordsDuration) // 该日时长
  specificStats.value[2].value = calcSpeed(maxDailyWords, maxDailyWordsDuration) // 该日速度

  cumulativeStats.value[0].value = totalWords // 更新历史总额
  cumulativeStats.value[1].value = formatDurationZh(totalDuration) // 更新历史总时长
} // 函数结束

// 初始化 ECharts 图表
const initCharts = () => {
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#4A90E2' // 获取当前主题色
  
  // 初始化时长统计图表
  if (durationChartRef.value) { // 检查 DOM 引用
    durationChart = echarts.init(durationChartRef.value) // 创建图表实例
    const option = { // 图表配置对象
      tooltip: { // 提示框配置
        trigger: 'axis', // 坐标轴触发
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // 背景色
        borderWidth: 0, // 边框宽度
        textStyle: { color: '#333' } // 文本样式
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true }, // 布局网格
      xAxis: { // X 轴配置
        type: 'category', // 类目轴
        data: [], // 初始数据为空
        axisLine: { lineStyle: { color: '#eee' } }, // 轴线样式
        axisLabel: { color: '#999' } // 标签颜色
      },
      yAxis: { // Y 轴配置
        type: 'value', // 数值轴
        axisLabel: { color: '#999', formatter: '{value}h' }, // 标签格式化
        splitLine: { lineStyle: { type: 'dashed', color: '#f5f5f5' } } // 分隔线样式
      },
      series: [{ // 系列列表
        data: [], // 初始数据
        type: 'line', // 折线图
        smooth: true, // 平滑曲线
        symbolSize: 8, // 拐点大小
        showSymbol: false, // 默认隐藏拐点
        areaStyle: { // 区域填充样式
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: accentColor + '33' }, // 开始颜色（透明度）
            { offset: 1, color: accentColor + '00' } // 结束颜色（透明度）
          ]) 
        }, 
        itemStyle: { color: accentColor }, // 项样式（强调色）
        lineStyle: { width: 3, color: accentColor } // 线条样式（强调色）
      }]
    }
    durationChart.setOption(option) // 应用配置
  }

  // 初始化字数统计图表
  if (wordsChartRef.value) { // 检查 DOM 引用
    wordsChart = echarts.init(wordsChartRef.value) // 创建图表实例
    const option = { // 图表配置对象
      tooltip: { // 提示框配置
        trigger: 'axis', // 坐标轴触发
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // 背景色
        borderWidth: 0, // 边框宽度
        textStyle: { color: '#333' } // 文本样式
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true }, // 布局网格
      xAxis: { // X 轴配置
        type: 'category', // 类目轴
        data: [], // 初始数据为空
        axisLine: { lineStyle: { color: '#eee' } }, // 轴线样式
        axisLabel: { color: '#999' } // 标签颜色
      },
      yAxis: { // Y 轴配置
        type: 'value', // 数值轴
        axisLabel: { color: '#999', formatter: (v) => v >= 1000 ? (v / 1000) + 'k' : v }, // 标签格式化（千位k显示）
        splitLine: { lineStyle: { type: 'dashed', color: '#f5f5f5' } } // 分隔线样式
      },
      series: [{ // 系列列表
        data: [], // 初始数据
        type: 'line', // 折线图
        smooth: true, // 平滑曲线
        symbolSize: 8, // 拐点大小
        showSymbol: false, // 默认隐藏拐点
        areaStyle: { // 区域填充样式
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: accentColor + '33' }, // 开始颜色
            { offset: 1, color: accentColor + '00' } // 结束颜色
          ]) 
        }, 
        itemStyle: { color: accentColor }, // 项样式
        lineStyle: { width: 3, color: accentColor } // 线条样式
      }]
    }
    wordsChart.setOption(option) // 应用配置
  }
} // 函数结束

// 更新图表实时数据
const updateCharts = () => {
  if (!durationChart || !wordsChart) return // 实例未就绪则退出

  const days = [] // 存储 X 轴日期
  const wordData = [] // 存储 Y 轴字数
  const range = wordsRange.value === 'week' ? 7 : 30 // 获取当前选择的时间跨度

  // 从今天往前推算日期
  for (let i = range - 1; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD') // 计算具体日期
    days.push(dayjs(date).format('M/D')) // 格式化为 月/日
    wordData.push(getDailyWords(date)) // 获取该日字数
  }

  // 更新字数图表数据
  wordsChart.setOption({
    xAxis: { data: days }, // 更新 X 轴
    series: [{ data: wordData }] // 更新数据列
  })

  // 更新时长图表数据
  const durationData = [] // 存储 Y 轴时长
  for (let i = range - 1; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD') // 计算具体日期
    durationData.push(Number((getDailyDuration(date) / 3600).toFixed(2))) // 转换为小时并保留两位小数
  }

  durationChart.setOption({
    xAxis: { data: days }, // 更新 X 轴
    series: [{ data: durationData }] // 更新数据列
  })
} // 函数结束

// 监听范围切换
watch([durationRange, wordsRange], () => {
  updateCharts() // 切换周/月时重新渲染图表
}) // 监听器结束

// 窗口大小改变处理
const handleResize = () => {
  durationChart?.resize() // 重绘时长图表
  wordsChart?.resize() // 重绘字数图表
} // 函数结束

// 辅助格式化
const formatDate = (date) => dayjs(date).format('YYYY年M月') // 格式化年月
const isToday = (day) => day === dayjs().format('YYYY-MM-DD') // 判断是否今日

// 日历月份切换
const prevMonth = () => {
  const date = new Date(selectedDate.value) // 获取当前日历日期
  date.setMonth(date.getMonth() - 1) // 减一个月
  selectedDate.value = date // 更新状态
} // 函数结束

const nextMonth = () => {
  const date = new Date(selectedDate.value) // 获取当前日历日期
  date.setMonth(date.getMonth() + 1) // 加一个月
  selectedDate.value = date // 更新状态
} // 函数结束

// 生命周期钩子
onMounted(() => {
  initCharts() // 组件挂载后初始化图表
  loadData() // 加载统计数据
  window.addEventListener('resize', handleResize) // 注册窗口调整监听
}) // 钩子结束

onUnmounted(() => {
  window.removeEventListener('resize', handleResize) // 组件销毁前移除监听
  durationChart?.dispose() // 释放时长图表实例
  wordsChart?.dispose() // 释放字数图表实例
}) // 钩子结束
</script>

<style lang="scss" scoped>
.statistics-container {
  background-color: var(--bg-primary); // 背景色
  
  :deep(.el-calendar) {
    --el-calendar-border: none; // 移除边框
    background-color: transparent; // 背景透明
    
    .el-calendar__header {
      border-bottom: none; // 移除头部下边框
      padding: 10px 0 20px 0; // 内边距
    }
    
    .el-calendar__body {
      padding: 0; // 移除正文内边距
      height: 340px; // 设置固定高度，防止切换月份时抖动
    }
    
    .el-calendar-table {
      height: 100%; // 表格充满容器
      table-layout: fixed; // 固定布局
      
      thead th {
        color: var(--text-gray); // 表头颜色
        font-weight: normal; // 正常字重
        padding: 8px 0; // 减小内边距
      }
      
      td {
        border: none; // 移除单元格边框
        vertical-align: middle; // 垂直居中
        
        &.is-today, &.is-selected {
          background-color: transparent !important; // 移除今日及选中的默认背景
        }
        
        .el-calendar-day {
          height: 100%; // 单元格高度充满 td
          padding: 0; // 内边距
          display: flex; // 弹性布局
          align-items: center; // 垂直居中
          justify-content: center; // 水平居中
          
          &:hover {
            background-color: var(--bg-mute); // 悬浮背景
            border-radius: 12px; // 圆角
          }
        }
      }
    }
  }

  .date-content-wrapper {
    width: 44px; // 固定宽度
    height: 44px; // 固定高度
    border-radius: 12px; // 圆角
    transition: all 0.2s ease; // 平滑过渡
    position: relative; // 相对定位
    
    .date-number {
      font-size: 14px; // 日期字号
      z-index: 1; // 确保在背景之上
    }
    
    .date-words {
      font-size: 10px; // 字数字号
      color: var(--text-gray-light, #9ca3af); // 默认灰色
      z-index: 1; // 确保在背景之上
    }

    &.has-words .date-words {
      color: var(--accent-color); // 有码字时变色
      font-weight: bold; // 加粗
    }

    &.is-selected {
      background-color: var(--accent-color); // 选中背景
      box-shadow: 0 4px 12px var(--accent-color-transparent, rgba(239, 68, 68, 0.2)); // 阴影
      
      .date-number, .date-words {
        color: white !important; // 选中时文字变白
      }
    }
  }

  .today-indicator {
    position: absolute; // 绝对定位
    bottom: 1px; // 底部偏移
    width: 4px; // 宽度
    height: 4px; // 高度
    border-radius: 9999px; // 圆角
    background-color: var(--accent-color); // 背景色
  }

  .text-accent {
    color: var(--accent-color); // 强调色
  }
}
</style>
