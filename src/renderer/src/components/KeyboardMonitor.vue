<template>
  <div class="min-h-screen bg-background p-4 md:p-8">
    <div class="mx-auto max-w-5xl space-y-6">
      <!-- 头部 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Keyboard class="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 class="text-xl font-semibold text-foreground">
              键盘输入监听器
            </h1>
            <p class="text-sm text-muted-foreground">
              实时捕获键盘事件与中文输入法状态
            </p>
          </div>
        </div>
        <button
          @click="clearEvents"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 gap-2"
        >
          <Trash2 class="h-4 w-4" />
          清空日志
        </button>
      </div>

      <!-- 状态卡片 -->
      <div class="grid gap-4 md:grid-cols-3">
        <!-- 当前按键 -->
        <div class="rounded-xl border bg-card text-card-foreground shadow">
          <div class="flex flex-col space-y-1.5 p-6 pb-2">
            <h3 class="font-semibold leading-none tracking-tight text-sm text-muted-foreground">当前按键</h3>
          </div>
          <div class="p-6 pt-0">
            <div class="flex h-12 items-center justify-center rounded-md border border-border bg-secondary font-mono text-2xl font-bold text-foreground">
              {{ currentKey || "-" }}
            </div>
          </div>
        </div>

        <!-- 输入法状态 -->
        <div class="rounded-xl border bg-card text-card-foreground shadow">
          <div class="flex flex-col space-y-1.5 p-6 pb-2">
            <h3 class="font-semibold leading-none tracking-tight text-sm text-muted-foreground">输入法状态</h3>
          </div>
          <div class="p-6 pt-0">
            <div class="flex h-12 items-center justify-center gap-2">
              <span
                class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                :class="isComposing ? 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80' : 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80'"
              >
                {{ isComposing ? "输入中" : "未激活" }}
              </span>
              <span v-if="compositionText" class="font-mono text-lg text-primary">
                {{ compositionText }}
              </span>
            </div>
          </div>
        </div>

        <!-- 已输入内容 -->
        <div class="rounded-xl border bg-card text-card-foreground shadow">
          <div class="flex flex-col space-y-1.5 p-6 pb-2">
            <h3 class="font-semibold leading-none tracking-tight text-sm text-muted-foreground">已输入内容</h3>
          </div>
          <div class="p-6 pt-0">
            <div class="flex h-12 items-center justify-center rounded-md border border-border bg-secondary px-3 font-mono text-lg text-foreground overflow-hidden">
              <span v-if="inputValue" class="truncate w-full text-center">{{ inputValue }}</span>
              <span v-else class="text-muted-foreground">等待输入...</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="rounded-xl border bg-card text-card-foreground shadow">
        <div class="flex flex-col space-y-1.5 p-6">
          <h3 class="font-semibold leading-none tracking-tight text-sm text-muted-foreground">输入区域</h3>
        </div>
        <div class="p-6 pt-0">
          <input
            ref="inputRef"
            type="text"
            v-model="inputValue"
            @keydown="handleKeyDown"
            @keyup="handleKeyUp"
            @compositionstart="handleCompositionStart"
            @compositionupdate="handleCompositionUpdate"
            @compositionend="handleCompositionEnd"
            @input="handleInput"
            placeholder="请在此输入中文或英文..."
            class="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono text-lg"
          />
        </div>
      </div>

      <!-- 事件日志 -->
      <div class="rounded-xl border bg-card text-card-foreground shadow flex flex-col">
        <div class="flex flex-row items-center justify-between p-6 pb-2">
          <h3 class="font-semibold leading-none tracking-tight text-sm text-muted-foreground">事件日志</h3>
          <span class="inline-flex items-center rounded-md border border-transparent bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 font-mono">
            {{ events.length }} 条记录
          </span>
        </div>
        <div class="p-6 pt-0 flex-1">
          <div
            ref="logRef"
            class="h-80 overflow-y-auto rounded-lg border border-border bg-secondary p-2"
          >
            <div v-if="events.length === 0" class="flex h-full items-center justify-center text-muted-foreground">
              等待键盘事件...
            </div>
            <div v-else class="space-y-1">
              <div
                v-for="event in events"
                :key="event.id"
                class="flex items-center gap-2 rounded px-2 py-1 font-mono text-sm hover:bg-muted/50 bg-background/50"
              >
                <span class="w-24 shrink-0 text-muted-foreground text-xs">
                  {{ formatTime(event.timestamp) }}
                </span>
                <span
                  class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-32 justify-center"
                  :class="getBadgeClass(event.type)"
                >
                  {{ event.type }}
                </span>
                <span class="w-20 shrink-0 text-foreground">
                  key: <span class="text-primary font-bold">{{ event.key || "-" }}</span>
                </span>
                <span class="shrink-0 text-muted-foreground">
                  code: <span class="text-foreground">{{ event.code || "-" }}</span>
                </span>
                <span v-if="event.data" class="ml-auto text-blue-500 truncate max-w-[200px]">
                  data: {{ event.data }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 说明 -->
      <div class="rounded-xl border bg-card text-card-foreground shadow">
        <div class="flex flex-col space-y-1.5 p-6 pb-2">
          <h3 class="font-semibold leading-none tracking-tight text-sm text-muted-foreground">事件类型说明</h3>
        </div>
        <div class="p-6 pt-0">
          <div class="flex flex-wrap gap-4">
            <div v-for="(colorClass, type) in eventTypeColors" :key="type" class="flex items-center gap-2">
              <span
                class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                :class="colorClass"
              >
                {{ type }}
              </span>
              <span class="text-sm text-muted-foreground">
                {{ getEventDescription(type) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted } from 'vue'
import { Keyboard, Trash2 } from 'lucide-vue-next'

// 事件类型颜色映射
const eventTypeColors = {
  keydown: "border-transparent bg-blue-500 text-white hover:bg-blue-500/80",
  keyup: "border-transparent bg-green-500 text-white hover:bg-green-500/80",
  compositionstart: "border-transparent bg-orange-500 text-white hover:bg-orange-500/80",
  compositionupdate: "border-transparent bg-purple-500 text-white hover:bg-purple-500/80",
  compositionend: "border-transparent bg-red-500 text-white hover:bg-red-500/80",
  input: "border-transparent bg-gray-500 text-white hover:bg-gray-500/80",
}

// 状态
const events = ref([])
const inputValue = ref("")
const isComposing = ref(false)
const currentKey = ref(null)
const compositionText = ref("")
const inputRef = ref(null)
const logRef = ref(null)
let eventIdCounter = 0

// 添加事件日志
const addEvent = (type, key, code, data) => {
  const newEvent = {
    id: eventIdCounter++,
    type,
    key,
    code,
    data,
    timestamp: Date.now(),
  }
  // 保留最近 100 条记录
  if (events.value.length >= 100) {
    events.value.shift()
  }
  events.value.push(newEvent)
}

// 键盘事件处理
const handleKeyDown = (e) => {
  currentKey.value = e.key
  addEvent("keydown", e.key, e.code)
}

const handleKeyUp = (e) => {
  currentKey.value = null
  addEvent("keyup", e.key, e.code)
}

// 输入法事件处理
const handleCompositionStart = (e) => {
  isComposing.value = true
  compositionText.value = e.data
  addEvent("compositionstart", e.data || "", "", e.data)
}

const handleCompositionUpdate = (e) => {
  compositionText.value = e.data
  addEvent("compositionupdate", e.data || "", "", e.data)
}

const handleCompositionEnd = (e) => {
  isComposing.value = false
  compositionText.value = ""
  addEvent("compositionend", e.data || "", "", e.data)
}

const handleInput = (e) => {
  // inputValue 已经通过 v-model 更新
  const inputEvent = e
  if (inputEvent.data) {
    addEvent("input", inputEvent.data, "", inputEvent.data)
  }
}

// 清空日志
const clearEvents = () => {
  events.value = []
  inputValue.value = ""
  inputRef.value?.focus()
}

// 自动滚动日志
watch(
  () => events.value.length,
  async () => {
    await nextTick()
    if (logRef.value) {
      logRef.value.scrollTop = logRef.value.scrollHeight
    }
  }
)

onMounted(() => {
  inputRef.value?.focus()
})

// 工具函数
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString("zh-CN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }) + `.${String(date.getMilliseconds()).padStart(3, "0")}`
}

const getBadgeClass = (type) => {
  return eventTypeColors[type] || "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
}

const getEventDescription = (type) => {
  switch (type) {
    case "keydown": return "按键按下"
    case "keyup": return "按键释放"
    case "compositionstart": return "输入法开始"
    case "compositionupdate": return "输入法更新"
    case "compositionend": return "输入法结束"
    case "input": return "输入事件"
    default: return type
  }
}
</script>

<style scoped>
/* 模拟 shadcn/ui 的一些基础变量，如果项目中没有定义的话 */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}
</style>
