<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Level } from '@/data/levels'
import CryptoTimeline from '@/components/timeline/CryptoTimeline.vue'
import Sim2FA from '@/components/modern/Sim2FA.vue'
import CaptchaDemo from '@/components/modern/CaptchaDemo.vue'

const props = defineProps<{ level: Level }>()
const emit = defineEmits<{ complete: [stars: number, correctCount: number, totalCount: number] }>()

// 动态加载后端练习（管理员添加的）
const dynamicExercises = ref<Task[]>([])
async function loadDynamicExercises() {
  try {
    const r = await fetch(`/api/exercises?level=${props.level.id - 1}`)
    if (r.ok) {
      const d = await r.json()
      dynamicExercises.value = (d.exercises || []).map((ex: any) => ({
        id: 100 + ex.id,
        type: ex.type === 'challenge' ? 'writing' : 'fill',
        question: ex.question,
        correctAnswer: ex.answer,
        hint: ex.hint || '',
        subjective: ex.type === 'challenge',
      }))
    }
  } catch { dynamicExercises.value = [] }
}
loadDynamicExercises()

const allTasks = computed(() => [...props.level.tasks, ...dynamicExercises.value])

const STORAGE_KEY = 'caesar-game-answers'

// Answer state - load from sessionStorage on mount
const answers = ref<Record<string | number, string>>({})
const multiSelect = ref<Record<number, string[]>>({})

// Flowchart iframe 结果存储
const fcResults = ref<Record<number, { correct: boolean; correctCount?: number; total?: number }>>({})

function onFcIframeLoad(_taskId: number) {
  // iframe 已加载，监听其 postMessage
}
// 全局监听 flowchart iframe 的消息
if (typeof window !== 'undefined') {
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'flowchart-result') {
      // 找到对应的 task id（通过 iframe id 匹配）
      const iframes = document.querySelectorAll('.flowchart-iframe')
      iframes.forEach((iframe: Element, idx: number) => {
        if ((iframe as HTMLIFrameElement).contentWindow === e.source) {
          // 用 idx+1 或其他方式映射 taskId — 简化处理，存到第一个 flowchart task
          fcResults.value[idx] = e.data
        }
      })
    }
  })
}

// Flowchart ordering state（保留用于初始化随机顺序）
const flowchartOrder = ref<Record<number, number[]>>({})

// Ensure all task answer keys exist (prevents v-model binding to undefined)
const initAnswers: Record<string, string> = {}
allTasks.value.forEach(t => {
  if (t.type === 'match' || t.type === 'writing') {
    initAnswers[t.id] = (answers.value[t.id] && answers.value[t.id] !== '') ? answers.value[t.id] : ''
  }
  if (t.type === 'multiChoice') {
    multiSelect.value[t.id] = multiSelect.value[t.id] || []
  }
  if (t.type === 'flowchart') {
    const count = (t.options || []).length
    if (!flowchartOrder.value[t.id]) {
      flowchartOrder.value[t.id] = [...Array(count).keys()].sort(() => Math.random() - 0.5)
    }
    if (!fcResults.value[t.id]) fcResults.value[t.id] = { correct: false }
  }
})
// Apply pre-initialized keys to trigger Vue reactivity
if (Object.keys(initAnswers).length > 0) {
  answers.value = { ...answers.value, ...initAnswers }
}

// Submission state - 定义在前面以便 watch 使用
const submitted = ref(false)
const stars = ref(0)
const graded = ref<Record<number, { correct: boolean; feedback: string }>>({})

// Load persisted answers from sessionStorage
function loadAnswers() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      if (data.answers) Object.assign(answers.value, data.answers)
      if (data.multiSelect) Object.assign(multiSelect.value, data.multiSelect)
      if (data.flowchartOrder) Object.assign(flowchartOrder.value, data.flowchartOrder)
      if (data.fcResults) Object.assign(fcResults.value, data.fcResults)
      // 加载当前关卡的提交状态
      const levelKey = `level_${props.level.id}`
      if (data[levelKey]) {
        submitted.value = data[levelKey].submitted || false
        stars.value = data[levelKey].stars || 0
        if (data[levelKey].graded) {
          graded.value = data[levelKey].graded
        }
      }
    }
  } catch { /* ignore */ }
}
function saveAnswers() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    let data = saved ? JSON.parse(saved) : {}
    data.answers = answers.value
    data.multiSelect = multiSelect.value
    data.flowchartOrder = flowchartOrder.value
    data.fcResults = fcResults.value
    // 保存当前关卡的提交状态
    const levelKey = `level_${props.level.id}`
    data[levelKey] = {
      submitted: submitted.value,
      stars: stars.value,
      graded: graded.value
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}
onMounted(() => {
  loadAnswers()
  // 每关进入时滚到顶部
  window.scrollTo(0, 0)
  setTimeout(() => window.scrollTo(0, 0), 100)
})
watch([answers, multiSelect, flowchartOrder, fcResults], saveAnswers, { deep: true })
watch(submitted, saveAnswers)

// Strip cipher state
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const stripShift = ref(3)
const stripOffset = ref(0)
let stripDragging = false
let stripStartX = 0
let stripStartOffset = 0

// Chinese grid tool state
const gridText = ref('爱拼才会赢三分天注定七分靠打拼')
const gridRows = ref(4)
const gridCols = ref(4)
const gridRule = ref('odd-col')
const gridShift = ref(1)
const gridDirection = ref('down')
const customRows = ref<number[]>([])
const customCols = ref<number[]>([])

const isColumnRule = computed(() => {
  return gridRule.value === 'odd-col' || gridRule.value === 'even-col'
})

const isRowRule = computed(() => {
  return gridRule.value === 'odd-row' || gridRule.value === 'even-row'
})

const gridMaxShift = computed(() => {
  if (isColumnRule.value) {
    return gridRows.value - 1
  } else {
    return gridCols.value - 1
  }
})

function updateDirectionForRule() {
  if (isColumnRule.value && !['down', 'up'].includes(gridDirection.value)) {
    gridDirection.value = 'down'
  } else if (isRowRule.value && !['left', 'right'].includes(gridDirection.value)) {
    gridDirection.value = 'right'
  }
}

function toggleCustomRow(row: number) {
  const idx = customRows.value.indexOf(row)
  if (idx === -1) {
    customRows.value.push(row)
  } else {
    customRows.value.splice(idx, 1)
  }
}

function toggleCustomCol(col: number) {
  const idx = customCols.value.indexOf(col)
  if (idx === -1) {
    customCols.value.push(col)
  } else {
    customCols.value.splice(idx, 1)
  }
}

function startStripDrag(e: MouseEvent | TouchEvent) {
  stripDragging = true
  const ev = 'touches' in e ? e.touches[0] : e
  stripStartX = ev.clientX
  stripStartOffset = stripOffset.value
}
function onStripDrag(e: MouseEvent | TouchEvent) {
  if (!stripDragging) return
  const ev = 'touches' in e ? e.touches[0] : e
  const dx = ev.clientX - stripStartX
  const cellWidth = 28
  const newShift = Math.round((stripStartOffset + dx) / cellWidth)
  stripOffset.value = newShift * cellWidth
  stripShift.value = ((newShift % 26) + 26) % 26
}
function endStripDrag() {
  stripDragging = false
  stripOffset.value = 0
}

// Chinese grid encryption function
function getEncryptedChar(row: number, col: number): string | undefined {
  const totalCells = gridRows.value * gridCols.value
  const baseIdx = (row - 1) * gridCols.value + (col - 1)
  
  const shouldShift = checkShouldShift(row, col)
  
  if (shouldShift) {
    let sourceRow = row
    let sourceCol = col
    
    switch (gridDirection.value) {
      case 'down':
        // 下移：当前位置显示的是从上方shift步位置来的字符
        sourceRow = ((row - 1 - gridShift.value + gridRows.value) % gridRows.value) + 1
        break
      case 'up':
        // 上移：当前位置显示的是从下方shift步位置来的字符
        sourceRow = ((row - 1 + gridShift.value) % gridRows.value) + 1
        break
      case 'right':
        // 右移：当前位置显示的是从左侧shift步位置来的字符
        sourceCol = ((col - 1 - gridShift.value + gridCols.value) % gridCols.value) + 1
        break
      case 'left':
        // 左移：当前位置显示的是从右侧shift步位置来的字符
        sourceCol = ((col - 1 + gridShift.value) % gridCols.value) + 1
        break
    }
    
    const sourceIdx = (sourceRow - 1) * gridCols.value + (sourceCol - 1)
    return gridText.value[sourceIdx] || gridText.value[sourceIdx % totalCells]
  } else {
    return gridText.value[baseIdx]
  }
}

function checkShouldShift(row: number, col: number): boolean {
  switch (gridRule.value) {
    case 'odd-col':
      return col % 2 === 1
    case 'even-col':
      return col % 2 === 0
    case 'odd-row':
      return row % 2 === 1
    case 'even-row':
      return row % 2 === 0
    case 'custom':
      return customRows.value.includes(row) || customCols.value.includes(col)
    default:
      return false
  }
}

function isEncryptedCell(row: number, col: number): boolean {
  return checkShouldShift(row, col)
}

function getRuleDescription(): string {
  switch (gridRule.value) {
    case 'odd-col': return '奇数列'
    case 'even-col': return '偶数列'
    case 'odd-row': return '奇数行'
    case 'even-row': return '偶数行'
    case 'custom': {
      const parts: string[] = []
      if (customRows.value.length > 0) {
        parts.push('行:' + customRows.value.join(','))
      }
      if (customCols.value.length > 0) {
        parts.push('列:' + customCols.value.join(','))
      }
      return parts.length > 0 ? parts.join('+') : '自定义'
    }
    default: return ''
  }
}

function getDirectionDescription(): string {
  switch (gridDirection.value) {
    case 'down': return '下移'
    case 'up': return '上移'
    case 'right': return '右移'
    case 'left': return '左移'
    default: return ''
  }
}

// Fill-in helpers
function countFillInputs(question: string): number {
  return (question.match(/<input-placeholder>/g) || []).length
}

function toggleMulti(id: number, opt: string) {
  if (!multiSelect.value[id]) multiSelect.value[id] = []
  const idx = multiSelect.value[id].indexOf(opt)
  if (idx >= 0) multiSelect.value[id].splice(idx, 1)
  else multiSelect.value[id].push(opt)
}

function setMatchAnswer(taskId: number, pairIndex: number, value: string) {
  const parts = (answers.value[taskId] || ',,,').split(',')
  while (parts.length < 4) parts.push('')
  parts[pairIndex] = value
  answers.value[taskId] = parts.join(',')
}

function getMatchPairLabels(): string[] {
  return ['烽火密码', '斯巴达密码棒', '凯撒密码', '现代密码']
}

function submitLevel() {
  // Grade
  const objectiveTasks = allTasks.value.filter(t => !t.subjective)
  let correctCount = 0

  for (const task of allTasks.value) {
    if (task.subjective) {
      graded.value[task.id] = { correct: true, feedback: '已记录你的回答 ✍️' }
      continue
    }

    let isCorrect = false
    let userAns: string

    if (task.type === 'fill') {
      const inputCount = countFillInputs(task.question)
      if (inputCount > 1) {
        const parts: string[] = []
        for (let i = 0; i < inputCount; i++) {
          parts.push((answers.value[`${task.id}_${i}`] || '').trim().toUpperCase())
        }
        userAns = parts.join(',')
      } else {
        userAns = (answers.value[String(task.id)] || '').trim().toUpperCase()
      }
    } else {
      userAns = (answers.value[task.id] || '')
    }

    if (task.type === 'flowchart') {
      // 从 iframe 获取结果
      const fcIdx = allTasks.value.filter(t => t.type === 'flowchart').indexOf(task)
      const result = fcResults.value[fcIdx]
      if (result?.correct) {
        isCorrect = true
        graded.value[task.id] = { correct: true, feedback: '✅ 流程图已补全！' }
      } else if (result) {
        graded.value[task.id] = { correct: false, feedback: `正确率 ${result.correctCount}/${result.total}，请修改红色框` }
      } else {
        graded.value[task.id] = { correct: false, feedback: '⚠️ 请先在流程图中点击"提交判断"' }
      }
    } else if (task.type === 'modern') {
      isCorrect = true
      graded.value[task.id] = { correct: true, feedback: '✅ 已体验' }
    } else if (task.type === 'multiChoice') {
      const selected = [...(multiSelect.value[task.id] || [])]
        .map(opt => opt.trim().charAt(0))
        .sort()
        .join(',')
      const expected = (task.correctAnswer || '').split(',').map(s => s.trim()).sort().join(',')
      isCorrect = selected === expected
      if (!isCorrect) {
        graded.value[task.id] = { correct: false, feedback: `正确答案：${task.correctAnswer}` }
      } else {
        graded.value[task.id] = { correct: true, feedback: '✅ 正确' }
      }
    } else {
      isCorrect = userAns.trim().toUpperCase() === (task.correctAnswer || '').trim().toUpperCase()
      if (!isCorrect) {
        graded.value[task.id] = { correct: false, feedback: `正确答案：${task.correctAnswer}` }
      } else {
        graded.value[task.id] = { correct: true, feedback: '✅ 正确' }
      }
    }

    if (isCorrect) correctCount++
  }

  const totalObj = objectiveTasks.length || 1
  stars.value = Math.max(1, 5 - (totalObj - correctCount))
  submitted.value = true
}

function goNext() {
  const objectiveTasks = allTasks.value.filter(t => !t.subjective)
  const correctCount = Object.values(graded.value).filter(g => g.correct).length
  emit('complete', stars.value, correctCount, objectiveTasks.length)
}

// 每关进入时清空 sessionStorage 答案缓存（避免跨站点 key 冲突）
sessionStorage.removeItem('caesar-game-answers')

// Parse fill question into segments: text + input markers with keys
function parseFillQuestion(taskId: number, q: string): Array<{ text: string; isInput: boolean; fillKey?: string }> {
  const parts = q.split(/<input-placeholder>/g)
  const totalInputs = parts.length - 1
  let inputIdx = 0
  return parts.flatMap((p, i) => {
    const result: Array<{ text: string; isInput: boolean; fillKey?: string }> = [{ text: p, isInput: false }]
    if (i < parts.length - 1) {
      const key = totalInputs > 1 ? `${taskId}_${inputIdx}` : String(taskId)
      inputIdx++
      result.push({ text: '', isInput: true, fillKey: key })
    }
    return result
  }).filter(s => s.text !== '' || s.isInput)
}

const coinDisplay = computed(() => '🪙'.repeat(stars.value))
</script>

<template>
  <div class="game-level">
    <!-- Station Header -->
    <div class="station-header">
      <div class="station-badge">{{ level.stationName }}</div>
      <h2 class="level-title">{{ level.title }}</h2>
    </div>

    <!-- Intro Text -->
    <div class="intro-card" v-html="level.introText"></div>

    <!-- Tool hint -->
    <div v-if="level.toolHint" class="tool-hint">{{ level.toolHint }}</div>

    <!-- Strip cipher tool (Level 1) -->
    <div v-if="level.id === 1" class="strip-cipher-inline">
      <div class="strip-label">📏 纸条密码工具 — 拖动/点击下行字母表观察移位（偏移量：{{ stripShift }}）</div>
      <div class="strip-table"
        @mousedown="startStripDrag"
        @mousemove="onStripDrag"
        @mouseup="endStripDrag"
        @mouseleave="endStripDrag"
        @touchstart="startStripDrag"
        @touchmove="onStripDrag"
        @touchend="endStripDrag"
      >
        <div class="strip-row strip-fixed">
          <span v-for="l in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')" :key="'f'+l" class="strip-cell fixed-cell">{{ l }}</span>
        </div>
        <div class="strip-row strip-draggable" :style="{ transform: `translateX(${stripOffset}px)` }">
          <span v-for="i in 26" :key="'d'+i" class="strip-cell drag-cell">{{ alphabet[(i - 1 + stripShift) % 26] }}</span>
        </div>
      </div>
      <div class="strip-controls">
        <button class="strip-btn" @click="stripShift = (stripShift - 1 + 26) % 26">◀ 左移</button>
        <span class="strip-shift-val">偏移量：{{ stripShift }}</span>
        <button class="strip-btn" @click="stripShift = (stripShift + 1) % 26">右移 ▶</button>
        <button class="strip-btn" @click="stripShift = 3">重置为3</button>
      </div>
    </div>

    <!-- Chinese Grid Tool (Level 3) -->
    <div v-if="level.id === 3" class="chinese-grid-tool">
      <div class="grid-label">📐 中文密信加密工具 — 将文字填入方格，然后移位</div>
      <div class="grid-controls">
        <div class="grid-control-group">
          <label>输入文字：</label>
          <input v-model="gridText" type="text" class="grid-text-input" placeholder="请输入要加密的中文..." maxlength="64" />
        </div>
        <div class="grid-control-group">
          <label>方格规格：</label>
          <select v-model="gridRows" class="grid-select">
            <option :value="3">3行</option>
            <option :value="4">4行</option>
            <option :value="5">5行</option>
            <option :value="6">6行</option>
          </select>
          <span>×</span>
          <select v-model="gridCols" class="grid-select">
            <option :value="3">3列</option>
            <option :value="4">4列</option>
            <option :value="5">5列</option>
            <option :value="6">6列</option>
          </select>
          <span class="grid-cell-count">（{{ gridRows * gridCols }}个单元格）</span>
        </div>
        <div class="grid-control-group">
          <label>加密规则：</label>
          <select v-model="gridRule" class="grid-select" @change="updateDirectionForRule">
            <option value="odd-col">奇数列</option>
            <option value="even-col">偶数列</option>
            <option value="odd-row">奇数行</option>
            <option value="even-row">偶数行</option>
            <option value="custom">自定义</option>
          </select>
          <span class="shift-input-group">
            <select v-model="gridDirection" class="grid-select direction-select">
              <option v-if="isColumnRule || gridRule === 'custom'" value="down">下移</option>
              <option v-if="isColumnRule || gridRule === 'custom'" value="up">上移</option>
              <option v-if="isRowRule || gridRule === 'custom'" value="right">右移</option>
              <option v-if="isRowRule || gridRule === 'custom'" value="left">左移</option>
            </select>
            <input v-model.number="gridShift" type="number" min="1" :max="gridMaxShift" class="shift-number-input" />
            <label>位</label>
          </span>
        </div>
        <div v-if="gridRule === 'custom'" class="custom-selection">
          <div class="custom-row-select">
            <label>选择行：</label>
            <button
              v-for="row in gridRows"
              :key="'row'+row"
              :class="['custom-btn', { selected: customRows.includes(row) }]"
              @click="toggleCustomRow(row)"
            >
              第{{ row }}行
            </button>
          </div>
          <div class="custom-col-select">
            <label>选择列：</label>
            <button
              v-for="col in gridCols"
              :key="'col'+col"
              :class="['custom-btn', { selected: customCols.includes(col) }]"
              @click="toggleCustomCol(col)"
            >
              第{{ col }}列
            </button>
          </div>
        </div>
      </div>
      <div class="grid-section">
        <h4>📝 原始排列</h4>
        <div class="chinese-grid">
          <div v-for="row in gridRows" :key="'r'+row" class="chinese-grid-row">
            <span v-for="col in gridCols" :key="'c'+col" class="chinese-grid-cell">
              {{ gridText[(row-1)*gridCols + (col-1)] || '　' }}
            </span>
          </div>
        </div>
      </div>
      <div class="grid-section">
        <h4>🔒 加密后（{{ getRuleDescription() }}{{ getDirectionDescription() }}{{ gridShift }}位）</h4>
        <div class="chinese-grid encrypted-grid">
          <div v-for="row in gridRows" :key="'er'+row" class="chinese-grid-row">
            <span v-for="col in gridCols" :key="'ec'+col" class="chinese-grid-cell" :class="{ encrypted: isEncryptedCell(row, col) }">
              {{ getEncryptedChar(row, col) || '　' }}
            </span>
          </div>
        </div>
      </div>
      <p class="grid-hint">💡 原理：将明文按行填入方格，然后按约定规则（如奇数列下移）重新排列，得到密文！</p>
    </div>

    <!-- Crypto Timeline (Level 4) -->
    <div v-if="level.id === 4" class="timeline-section">
      <h3>📜 密码技术发展史</h3>
      <p class="timeline-hint">点击每个节点查看详细介绍</p>
      <CryptoTimeline />
    </div>

    <!-- Tasks -->
    <div class="tasks-area">
      <div v-for="task in allTasks" :key="task.id" class="task-card" :class="{ graded: submitted }">
        <div class="task-header">
          <span class="task-num">{{ task.id }}</span>
          <span class="task-type-tag">{{
            { fill: '✍️ 填空', choice: '📋 单选', multiChoice: '☑️ 多选', match: '🔗 连线', writing: '💬 写作', flowchart: '📊 流程图', modern: '🔐 现代加密' }[task.type] || task.type
          }}</span>
          <span v-if="task.subjective" class="subj-tag">不计分</span>
          <span v-if="submitted && graded[task.id] && graded[task.id].correct" class="task-coins">
            🪙
          </span>
        </div>

        <!-- Fill-in-blank -->
        <div v-if="task.type === 'fill'" class="task-body fill-task">
          <template v-for="(seg, si) in parseFillQuestion(task.id, task.question)" :key="si">
            <span v-if="!seg.isInput" v-html="seg.text"></span>
            <input
              v-if="seg.isInput && seg.fillKey"
              v-model="answers[seg.fillKey]"
              :disabled="submitted"
              class="fill-input"
              placeholder="输入"
              :style="{ width: '80px' }"
            />
          </template>
          <div v-if="submitted && graded[task.id]" class="grade-feedback" :class="{ correct: graded[task.id].correct, wrong: !graded[task.id].correct }">
            {{ graded[task.id].feedback }}
          </div>
        </div>

        <!-- Choice -->
        <div v-if="task.type === 'choice'" class="task-body">
          <p v-html="task.question"></p>
          <label v-for="opt in task.options" :key="opt" class="choice-option" :class="{ selected: answers[task.id] === opt }">
            <input type="radio" :name="'q' + task.id" :value="opt" v-model="answers[task.id]" :disabled="submitted" />
            <span>{{ opt }}</span>
          </label>
          <div v-if="submitted && graded[task.id]" class="grade-feedback" :class="{ correct: graded[task.id].correct, wrong: !graded[task.id].correct }">
            {{ graded[task.id].feedback }}
          </div>
        </div>

        <!-- Multi Choice -->
        <div v-if="task.type === 'multiChoice'" class="task-body">
          <p v-html="task.question"></p>
          <label v-for="opt in task.options" :key="opt" class="choice-option" :class="{ selected: multiSelect[task.id]?.includes(opt) }">
            <input type="checkbox" :value="opt" :checked="multiSelect[task.id]?.includes(opt)"
              @change="toggleMulti(task.id, opt)" :disabled="submitted" />
            <span>{{ opt }}</span>
          </label>
          <div v-if="submitted && graded[task.id]" class="grade-feedback" :class="{ correct: graded[task.id].correct, wrong: !graded[task.id].correct }">
            {{ graded[task.id].feedback }}
          </div>
        </div>

        <!-- Match -->
        <div v-if="task.type === 'match'" class="task-body match-task">
          <p>把每种密码和它的"密钥"连起来：</p>
          <div v-for="(label, mi) in getMatchPairLabels()" :key="mi" class="match-row">
            <span class="match-label">{{ label }}</span>
            <span class="match-arrow">→</span>
            <select
              :value="(answers[task.id] || ',,,').split(',')[mi] || ''"
              @change="setMatchAnswer(task.id, mi, ($event.target as HTMLSelectElement).value)"
              :disabled="submitted"
              class="match-select"
            >
              <option value="">请选择...</option>
              <option v-for="opt in task.options" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
          <div v-if="submitted && graded[task.id]" class="grade-feedback" :class="{ correct: graded[task.id].correct, wrong: !graded[task.id].correct }">
            {{ graded[task.id].feedback }}
          </div>
        </div>

        <!-- Writing -->
        <div v-if="task.type === 'writing'" class="task-body">
          <p v-html="task.question"></p>
          <textarea v-model="answers[task.id]" :disabled="submitted" class="writing-input" placeholder="写下你的想法..." rows="4"></textarea>
          <div v-if="submitted && graded[task.id]" class="grade-feedback correct">
            {{ graded[task.id].feedback }}
          </div>
        </div>

        <!-- Flowchart 拖拽作答（iframe 嵌入版） -->
        <div v-if="task.type === 'flowchart'" class="task-body flowchart-task">
          <p v-html="task.question"></p>
          <div class="flowchart-iframe-wrap">
            <iframe
              src="/embed/flowchart.html"
              class="flowchart-iframe"
              :id="'fcIframe_' + task.id"
              title="凯撒加密流程图"
              sandbox="allow-scripts allow-same-origin"
              @load="onFcIframeLoad(task.id)"
            />
          </div>
          <div v-if="submitted && graded[task.id]" class="grade-feedback" :class="{ correct: graded[task.id].correct, wrong: !graded[task.id].correct }">
            {{ graded[task.id].feedback }}
          </div>
        </div>

        <!-- Modern encryption demos -->
        <div v-if="task.type === 'modern'" class="task-body modern-task">
          <p v-html="task.question"></p>
          <div class="modern-demos">
            <div class="modern-demo-card">
              <h4>📱 手机验证码体验（2FA）</h4>
              <Sim2FA />
            </div>
            <div class="modern-demo-card">
              <h4>🤖 图片验证码体验（CAPTCHA）</h4>
              <CaptchaDemo />
            </div>
          </div>
          <div v-if="submitted && graded[task.id]" class="grade-feedback correct">{{ graded[task.id].feedback }}</div>
        </div>
      </div>
    </div>

    <!-- Submit / Result -->
    <div class="action-area">
      <template v-if="!submitted">
        <button class="submit-btn" @click="submitLevel">📝 提交答案</button>
      </template>
      <template v-else>
        <div class="result-card">
          <div class="coin-rating">{{ coinDisplay }}</div>
          <div class="coin-text">{{ stars }} / 5 枚金币</div>
          <p class="pass-message">{{ level.passMessage }}</p>
          <button class="next-btn" @click="goNext">
            {{ level.id < 5 ? '⛵ 前往下一站' : '🏆 查看结算' }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.game-level {
  max-width: 760px;
  margin: 0 auto;
  padding: 24px 20px 64px;
}

.station-header {
  text-align: center;
  margin-bottom: 20px;
}
.station-badge {
  display: inline-block;
  padding: 6px 20px;
  background: var(--qz-red, #c43a31);
  color: white;
  border-radius: 20px;
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 10px;
}
.level-title {
  font-size: 1.7rem;
  color: var(--qz-dark);
  margin: 0 0 6px;
}
.level-subtitle {
  color: var(--qz-stone, #8c7c6b);
  font-size: 1.05rem;
  margin: 0;
}

.intro-card {
  background: #FFF8F0;
  border: 1px solid #e8d5c0;
  border-radius: 14px;
  padding: 20px 24px;
  margin-bottom: 24px;
  line-height: 2;
  font-size: 1.1rem;
  color: #3d2817;
}
.intro-card :deep(p) { margin: 0 0 12px; text-indent: 2em; }
.intro-card :deep(p:last-child) { margin-bottom: 0; }
.intro-card :deep(strong) { color: var(--qz-red); font-size: 1.15rem; }
.intro-card :deep(.video-preview-container) {
  position: relative;
  max-width: 100%;
  margin: 16px 0;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
}
.intro-card :deep(.level-video) {
  display: block;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  border-radius: 10px;
}
.intro-card :deep(.video-overlay) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  opacity: 1;
  transition: opacity 0.3s;
}
.intro-card :deep(.video-preview-container:hover .video-overlay) {
  opacity: 0.8;
}
.intro-card :deep(.play-icon) {
  font-size: 3rem;
  margin-bottom: 8px;
}
.intro-card :deep(.play-text) {
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
}

.tool-hint {
  padding: 12px 18px;
  background: #E3F2FD;
  border: 1px solid #90CAF9;
  border-radius: 12px;
  font-size: 0.95rem;
  color: #1565C0;
  margin-bottom: 16px;
}

.tasks-area {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 24px;
}

.task-card {
  background: white;
  border: 1px solid #e0d5c8;
  border-radius: 14px;
  padding: 22px;
  transition: all 0.3s;
}
.task-card.graded {
  border-color: #d4c0a0;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.task-num {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  background: var(--qz-red); color: white;
  border-radius: 50%; font-size: 0.9rem; font-weight: 700;
}
.task-type-tag {
  font-size: 0.85rem;
  padding: 4px 12px;
  background: var(--qz-stone-light, #f5f0eb);
  border-radius: 12px;
  color: var(--qz-stone, #8c7c6b);
}
.subj-tag {
  font-size: 0.8rem;
  padding: 4px 10px;
  background: #E3F2FD;
  color: #1565C0;
  border-radius: 12px;
}
.task-coins {
  margin-left: auto;
  font-size: 1.3rem;
  animation: coinPop 0.3s ease;
}
@keyframes coinPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.task-body { font-size: 1.15rem; line-height: 2.1; color: #2d1f12; }
.task-body :deep(strong) { color: var(--qz-red); font-size: 1.2rem; }
.task-body :deep(p) { text-indent: 2em; margin-bottom: 14px; }

.fill-input {
  padding: 8px 12px;
  border: 2px solid #d4cbc0;
  border-radius: 8px;
  font-size: 1.1rem;
  font-family: 'Courier New', monospace;
  font-weight: 700;
  text-align: center;
  color: var(--qz-red);
  transition: border-color 0.2s;
  min-width: 100px;
}
.fill-input:focus { outline: none; border-color: var(--qz-red); }
.fill-input:disabled { background: #f5f0eb; color: #999; }

.choice-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin: 6px 0;
  border: 1px solid #e0d5c8;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.05rem;
}
.choice-option:hover { border-color: var(--qz-red); background: #FFF5F5; }
.choice-option.selected { border-color: var(--qz-red); background: rgba(196,58,49,0.06); }
.choice-option input { accent-color: var(--qz-red); width: 18px; height: 18px; }

.match-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0;
  font-size: 1.05rem;
}
.match-label {
  font-weight: 600;
  min-width: 120px;
  color: var(--qz-dark);
}
.match-arrow { color: var(--qz-red); font-weight: 700; }
.match-select {
  padding: 8px 14px;
  border: 1px solid #d4cbc0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  min-width: 200px;
}
.match-select:focus { outline: none; border-color: var(--qz-red); }

.writing-input {
  width: 100%;
  padding: 14px;
  border: 1px solid #d4cbc0;
  border-radius: 10px;
  font-size: 1.1rem;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
  margin-top: 10px;
  min-height: 120px;
}
.writing-input:focus { outline: none; border-color: var(--qz-red); }

/* Strip cipher inline */
.strip-cipher-inline {
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border: 1px solid #e0d5c8;
  border-radius: 12px;
}
.strip-label {
  font-size: 0.95rem;
  color: var(--qz-stone);
  margin-bottom: 12px;
  text-align: center;
}
.strip-table {
  overflow-x: auto;
}
.strip-row {
  display: flex;
  white-space: nowrap;
}
.strip-cell {
  width: 34px;
  height: 34px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  font-weight: 600;
  border: 1px solid #e0d5c8;
  flex-shrink: 0;
}
.fixed-cell { background: var(--qz-stone-light, #f5f0eb); color: var(--qz-dark); }
.drag-cell { background: white; color: var(--qz-red); cursor: grab; }
.drag-cell:active { cursor: grabbing; background: #FFF5F5; }
.strip-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 14px;
}
.strip-btn {
  padding: 8px 20px;
  border: 1px solid #d4cbc0;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  font-size: 0.95rem;
  font-family: inherit;
  transition: all 0.2s;
}
.strip-btn:hover { border-color: var(--qz-red); color: var(--qz-red); }
.strip-shift-val {
  font-size: 1rem;
  font-weight: 600;
  color: var(--qz-red);
  min-width: 100px;
  text-align: center;
}

/* Timeline section */
.timeline-section {
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border: 1px solid #e0d5c8;
  border-radius: 10px;
}
.timeline-section h3 { margin: 0 0 4px; color: var(--qz-dark); }
.timeline-hint { font-size: 0.8rem; color: var(--qz-stone); margin-bottom: 12px; }

/* Chinese grid tool */
.chinese-grid-tool {
  margin-bottom: 16px;
  padding: 16px;
  background: white;
  border: 1px solid #e0d5c8;
  border-radius: 12px;
}
.grid-label { 
  font-size: 0.9rem; 
  color: var(--qz-stone); 
  margin-bottom: 14px;
  font-weight: 500;
}
.grid-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #FFF8F0;
  border-radius: 8px;
}
.grid-control-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.grid-control-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--qz-dark);
}
.grid-text-input {
  flex: 1;
  min-width: 200px;
  padding: 8px 12px;
  border: 2px solid #d4cbc0;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: inherit;
  transition: border-color 0.2s;
}
.grid-text-input:focus {
  outline: none;
  border-color: var(--qz-red);
}
.grid-select {
  padding: 6px 10px;
  border: 2px solid #d4cbc0;
  border-radius: 6px;
  font-size: 0.85rem;
  font-family: inherit;
  cursor: pointer;
}
.grid-select:focus {
  outline: none;
  border-color: var(--qz-red);
}
.grid-cell-count {
  font-size: 0.8rem;
  color: var(--qz-stone);
}
.grid-section {
  margin-bottom: 14px;
}
.grid-section h4 {
  font-size: 0.85rem;
  color: var(--qz-red);
  margin: 0 0 10px;
}
.chinese-grid { 
  display: inline-flex; 
  flex-direction: column; 
  gap: 2px; 
}
.chinese-grid-row { 
  display: flex; 
  gap: 2px; 
}
.chinese-grid-cell {
  width: 48px; 
  height: 48px;
  display: flex; 
  align-items: center; 
  justify-content: center;
  border: 2px solid #d4cbc0;
  font-size: 1rem; 
  font-weight: 600;
  color: var(--qz-dark);
  background: #fefefe;
  border-radius: 6px;
  transition: all 0.2s;
}
.chinese-grid-cell.encrypted {
  background: rgba(196, 58, 49, 0.08);
  border-color: var(--qz-red);
}
.encrypted-grid .chinese-grid-cell {
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
.grid-hint { 
  font-size: 0.85rem; 
  color: var(--qz-stone); 
  line-height: 1.7;
  padding-top: 12px;
  border-top: 1px dashed #d4cbc0;
}
.shift-input-group {
  display: flex;
  align-items: center;
  gap: 6px;
}
.shift-number-input {
  width: 50px;
  padding: 6px;
  border: 2px solid #d4cbc0;
  border-radius: 6px;
  text-align: center;
  font-size: 0.9rem;
}
.shift-number-input:focus {
  outline: none;
  border-color: var(--qz-red);
}
.custom-selection {
  margin-top: 12px;
  padding: 12px;
  background: #F5F5F5;
  border-radius: 8px;
}
.custom-row-select,
.custom-col-select {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.custom-row-select:last-child,
.custom-col-select:last-child {
  margin-bottom: 0;
}
.custom-row-select label,
.custom-col-select label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--qz-dark);
}
.custom-btn {
  padding: 6px 14px;
  border: 2px solid #d4cbc0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.custom-btn:hover {
  border-color: var(--qz-red);
  color: var(--qz-red);
}
.custom-btn.selected {
  background: var(--qz-red);
  color: white;
  border-color: var(--qz-red);
}

/* Flowchart iframe 嵌入 */
.flowchart-iframe-wrap {
  margin: 16px 0;
  border-radius: 14px; overflow: hidden;
  border: 1px solid rgba(139,90,43,.12);
  background: #fdfaf5;
}
.flowchart-iframe {
  display: block; width: 100%; height: 780px;
  border: none;
}

/* Modern demos */
.modern-demos {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 12px;
}
.modern-demo-card {
  padding: 16px;
  background: white;
  border: 1px solid #e0d5c8;
  border-radius: 10px;
}
.modern-demo-card h4 {
  margin: 0 0 8px;
  font-size: 0.9rem;
  color: var(--qz-dark);
}

.grade-feedback {
  margin-top: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
}
.grade-feedback.correct { background: #E8F5E9; color: #2e7d32; }
.grade-feedback.wrong { background: #FFF0EB; color: #c62828; }

.action-area { text-align: center; }

.submit-btn {
  padding: 14px 40px;
  background: linear-gradient(135deg, var(--qz-red, #c43a31), #a8322a);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 4px 12px rgba(196, 58, 49, 0.3);
  transition: all 0.3s;
}
.submit-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(196, 58, 49, 0.45); }

.result-card {
  background: linear-gradient(135deg, #FFFDE7, #FFF8E1);
  border: 2px solid var(--qz-gold, #e6b422);
  border-radius: 14px;
  padding: 28px 24px;
  animation: popIn 0.4s ease;
}
@keyframes popIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.coin-rating {
  font-size: 2.2rem;
  letter-spacing: 4px;
  margin-bottom: 4px;
}
.coin-text {
  font-size: 1rem;
  font-weight: 600;
  color: var(--qz-dark);
  margin-bottom: 12px;
}
.pass-message {
  font-size: 0.9rem;
  color: #4a3020;
  line-height: 1.7;
  margin-bottom: 16px;
}
.next-btn {
  padding: 12px 32px;
  background: linear-gradient(135deg, #2e7d32, #1b5e20);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);
  transition: all 0.3s;
}
.next-btn:hover { transform: translateY(-2px); }
</style>
