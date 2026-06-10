<script setup lang="ts">
import { ref } from 'vue'

const gridSide = ref(5)

const words = ref([
  '我', '们', '的', '中', '国', '爱', '学', '习', '知', '识',
  '密', '码', '信', '息', '安', '全', '海', '丝', '泉', '州',
  '刺', '桐', '港', '船', '商', '文', '字', '算', '法', '科',
  '技', '网', '络', '互', '联', '人', '工', '智', '能', '大',
  '数', '据', '云', '计', '物', '区', '块', '链', '虚', '拟',
  '现', '实', '增', '强', '移', '动', '通', '感', '器', '机',
  '语', '言', '编', '程', '软', '件', '硬', '盘', '内', '存',
  '显', '示', '键', '鼠', '标', '光', '电', '磁', '波', '芯',
  '片',
])

const inputText = ref('')
const outputText = ref('')

// Resize grid — side = sqrt(size), words array already holds 81 chars
function setGridSize(size: number) {
  gridSide.value = Math.sqrt(size)
}

function getCode(letter: string): string {
  const idx = words.value.indexOf(letter)
  if (idx === -1) return letter
  const row = Math.floor(idx / gridSide.value) + 1
  const col = (idx % gridSide.value) + 1
  return `${row}${col}`
}

function encodeChinese(text: string): string {
  return text.split('').map(ch => getCode(ch)).join(' ')
}

function decodeChinese(code: string): string {
  const parts = code.trim().split(/\s+/)
  let result = ''
  for (const part of parts) {
    if (part.length === 2) {
      const row = parseInt(part[0]) - 1
      const col = parseInt(part[1]) - 1
      if (row >= 0 && row < gridSide.value && col >= 0 && col < gridSide.value) {
        result += words.value[row * gridSide.value + col]
      } else {
        result += '?'
      }
    } else {
      result += part
    }
  }
  return result
}

function handleEncode() {
  outputText.value = encodeChinese(inputText.value)
}

function handleDecode() {
  outputText.value = decodeChinese(inputText.value)
}

const mode = ref<'encode' | 'decode'>('encode')

function handleChange() {
  if (mode.value === 'encode') handleEncode()
  else handleDecode()
}
</script>

<template>
  <div class="chinese-code-container">
    <div class="code-panel">
      <div class="grid-selector">
        <button :class="['btn', gridSide === 3 ? 'btn-primary' : 'btn-outline', 'btn-sm']" @click="setGridSize(9)">9宫格 (3×3)</button>
        <button :class="['btn', gridSide === 4 ? 'btn-primary' : 'btn-outline', 'btn-sm']" @click="setGridSize(16)">16宫格 (4×4)</button>
        <button :class="['btn', gridSide === 5 ? 'btn-primary' : 'btn-outline', 'btn-sm']" @click="setGridSize(25)">25宫格 (5×5)</button>
        <button :class="['btn', gridSide === 6 ? 'btn-primary' : 'btn-outline', 'btn-sm']" @click="setGridSize(36)">36宫格 (6×6)</button>
        <button :class="['btn', gridSide === 7 ? 'btn-primary' : 'btn-outline', 'btn-sm']" @click="setGridSize(49)">49宫格 (7×7)</button>
        <button :class="['btn', gridSide === 8 ? 'btn-primary' : 'btn-outline', 'btn-sm']" @click="setGridSize(64)">64宫格 (8×8)</button>
        <button :class="['btn', gridSide === 9 ? 'btn-primary' : 'btn-outline', 'btn-sm']" @click="setGridSize(81)">81宫格 (9×9)</button>
      </div>

      <!-- Code Grid -->
      <div class="code-grid" :style="{ gridTemplateColumns: `repeat(${gridSide + 1}, 1fr)` }">
        <!-- Header row -->
        <div class="grid-cell header-cell"></div>
        <div v-for="c in gridSide" :key="'col'+c" class="grid-cell header-cell">{{ c }}</div>
        <!-- Data rows -->
        <template v-for="r in gridSide" :key="'row'+r">
          <div class="grid-cell header-cell row-header">{{ r }}</div>
          <div v-for="c in gridSide" :key="'cell'+r+'-'+c" class="grid-cell data-cell">
            {{ words[(r - 1) * gridSide + (c - 1)] }}
          </div>
        </template>
      </div>

      <!-- I/O -->
      <div class="code-io">
        <div class="mode-toggle">
          <button :class="['btn', mode === 'encode' ? 'btn-primary' : 'btn-secondary']"
            @click="mode = 'encode'; outputText = ''">
            🔒 中文→数字编码
          </button>
          <button :class="['btn', mode === 'decode' ? 'btn-primary' : 'btn-secondary']"
            @click="mode = 'decode'; outputText = ''">
            🔓 数字→中文解码
          </button>
        </div>
        <div class="io-field">
          <label>{{ mode === 'encode' ? '输入中文' : '输入数字编码（如 12 35 41）' }}</label>
          <input v-model="inputText" type="text" :placeholder="mode === 'encode' ? '例如：泉州' : '例如：34 41 15 25'"
            @input="handleChange" />
        </div>
        <div class="io-field">
          <label>结果</label>
          <input :value="outputText" type="text" readonly placeholder="编码/解码结果..." />
        </div>
      </div>

      <div class="code-note">
        <p>💡 编码规则：每个汉字用它在表格中的<strong>（行号，列号）</strong>表示。例如第一行第一列的"我"编码为"11"。</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chinese-code-container {
  padding: 16px 0;
}
.code-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.grid-selector {
  display: flex;
  gap: 8px;
}
.code-grid {
  display: grid;
  gap: 2px;
  max-width: 350px;
}
.grid-cell {
  width: 48px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  border-radius: var(--radius-sm);
}
.header-cell {
  background: var(--qz-dark);
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
}
.row-header {
  background: var(--qz-red);
}
.data-cell {
  background: white;
  border: 1px solid var(--border-color);
  font-weight: 500;
  transition: all 0.15s;
}
.data-cell:hover {
  background: #FFF0EB;
  border-color: var(--qz-red);
  transform: scale(1.05);
}
.code-io {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 500px;
}
.mode-toggle {
  display: flex;
  gap: 8px;
}
.io-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.io-field label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
}
.io-field input {
  padding: 10px 14px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-family: 'Courier New', monospace;
}
.io-field input:focus {
  outline: none;
  border-color: var(--qz-red);
}
.io-field input[readonly] {
  background: var(--qz-stone-light);
}
.btn-sm {
  padding: 4px 12px;
  font-size: 0.85rem;
}
.code-note {
  padding: 12px 16px;
  background: var(--qz-stone-light);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  color: var(--text-secondary);
}
.code-note strong {
  color: var(--qz-red);
}
</style>
