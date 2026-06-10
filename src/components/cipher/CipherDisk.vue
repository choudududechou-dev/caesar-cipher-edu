<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const OUTER_R = 180
const INNER_R = 130
const LETTER_R = 155
const INNER_LETTER_R = 105
const CENTER = 200

const shift = ref(3)
const inputText = ref('')
const outputText = ref('')
const mode = ref<'encode' | 'decode'>('encode')
const isDragging = ref(false)
const mapping = ref<Record<string, string>>({})

// SVG element ref
const svgRef = ref<SVGSVGElement | null>(null)

// Compute inner disk rotation angle (negative = clockwise from user perspective in SVG)
const rotation = computed(() => -shift.value * (360 / 26))

// Generate outer circle letters (A-Z, black, all upright)
function outerLetters() {
  const letters = []
  for (let i = 0; i < 26; i++) {
    const angle = (i * 360) / 26 - 90
    const rad = (angle * Math.PI) / 180
    const x = CENTER + LETTER_R * Math.cos(rad)
    const y = CENTER + LETTER_R * Math.sin(rad)
    letters.push({
      letter: ALPHABET[i],
      x, y,
      isSpecial: false,
    })
  }
  return letters
}

// Generate inner circle letters (all upright, A in red)
function innerLetters() {
  const letters = []
  for (let i = 0; i < 26; i++) {
    const angle = (i * 360) / 26 - 90
    const rad = (angle * Math.PI) / 180
    const x = CENTER + INNER_LETTER_R * Math.cos(rad)
    const y = CENTER + INNER_LETTER_R * Math.sin(rad)
    const letterIndex = (i + shift.value) % 26
    letters.push({
      letter: ALPHABET[letterIndex],
      x, y,
      isRed: letterIndex === 0, // The letter 'A' is always red
    })
  }
  return letters
}

function updateMapping() {
  const map: Record<string, string> = {}
  for (let i = 0; i < 26; i++) {
    map[ALPHABET[i]] = ALPHABET[(i + shift.value) % 26]
  }
  mapping.value = map
}

function handleCipher() {
  const text = inputText.value.toUpperCase()
  if (!text) {
    outputText.value = ''
    return
  }
  let result = ''
  for (const ch of text) {
    const idx = ALPHABET.indexOf(ch)
    if (idx === -1) {
      result += ch
    } else {
      if (mode.value === 'encode') {
        result += ALPHABET[(idx + shift.value) % 26]
      } else {
        result += ALPHABET[(idx - shift.value + 26) % 26]
      }
    }
  }
  outputText.value = result
  updateMapping()
}

function onMouseDown(_e: MouseEvent) {
  if (!svgRef.value) return
  isDragging.value = true
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value || !svgRef.value) return
  const rect = svgRef.value.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI)
  // Convert to shift value (0-25)
  const normalizedAngle = ((angle + 90) % 360 + 360) % 360
  const newShift = Math.round((normalizedAngle / 360) * 26) % 26
  if (newShift !== shift.value) {
    shift.value = newShift
    updateMapping()
  }
}

function onMouseUp() {
  isDragging.value = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}

function onWheel(e: WheelEvent) {
  e.preventDefault()
  if (e.deltaY > 0) {
    shift.value = (shift.value + 1) % 26
  } else {
    shift.value = (shift.value - 1 + 26) % 26
  }
  updateMapping()
}

function setShift(k: number) {
  shift.value = ((k % 26) + 26) % 26
  updateMapping()
}

onMounted(() => {
  updateMapping()
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})
</script>

<template>
  <div class="cipher-disk-container">
    <div class="disk-panel">
      <!-- SVG Cipher Disk -->
      <svg
        ref="svgRef"
        viewBox="0 0 400 400"
        class="cipher-svg"
        @mousedown="onMouseDown"
        @wheel="onWheel"
      >
        <!-- Outer ring background -->
        <circle cx="200" cy="200" :r="OUTER_R" fill="#F5F0EB" stroke="#C45B3C" stroke-width="3" />
        <circle cx="200" cy="200" :r="INNER_R + 2" fill="none" stroke="#D4C5B9" stroke-width="1" />

        <!-- Inner rotating disk -->
        <g :transform="`rotate(${rotation}, 200, 200)`">
          <circle cx="200" cy="200" :r="INNER_R" fill="white" stroke="#C45B3C" stroke-width="2" />
          <!-- Inner letters (rotated with disk) but each letter counter-rotated to stay upright -->
          <g v-for="(item, i) in innerLetters()" :key="'in'+i">
            <g :transform="`translate(${item.x}, ${item.y}) rotate(${-rotation})`">
              <text
                text-anchor="middle"
                dominant-baseline="central"
                :fill="item.isRed ? '#C00000' : '#2C2C2C'"
                font-size="16"
                font-weight="bold"
                font-family="Arial, sans-serif"
              >{{ item.letter }}</text>
            </g>
          </g>
        </g>

        <!-- Outer letters (fixed, always upright) -->
        <g v-for="(item, i) in outerLetters()" :key="'out'+i">
          <g :transform="`translate(${item.x}, ${item.y})`">
            <text
              text-anchor="middle"
              dominant-baseline="central"
              fill="#2C2C2C"
              font-size="17"
              font-weight="bold"
              font-family="Arial, sans-serif"
            >{{ item.letter }}</text>
          </g>
        </g>

        <!-- Center -->
        <circle cx="200" cy="200" r="30" fill="#C45B3C" />
        <circle cx="200" cy="200" r="24" fill="#A84A2E" />
        <text x="200" y="200" text-anchor="middle" dominant-baseline="central"
          fill="white" font-size="14" font-weight="bold" font-family="Arial, sans-serif">
          {{ shift }}
        </text>
      </svg>

      <!-- Controls -->
      <div class="disk-controls">
        <div class="shift-control">
          <button class="btn btn-outline btn-sm" @click="setShift(shift - 1)">◀</button>
          <span class="shift-value">偏移量 k = {{ shift }}</span>
          <button class="btn btn-outline btn-sm" @click="setShift(shift + 1)">▶</button>
        </div>
        <div class="shift-slider">
          <input type="range" min="0" max="25" :value="shift"
            @input="setShift(Number(($event.target as HTMLInputElement).value))" />
        </div>
        <p class="hint-text">💡 鼠标拖拽内圈旋转 / 滚轮调整 / 拖动滑块</p>
      </div>
    </div>

    <!-- Input/Output Panel -->
    <div class="io-panel">
      <div class="mode-toggle">
        <button :class="['btn', mode === 'encode' ? 'btn-primary' : 'btn-secondary']" @click="mode = 'encode'">
          🔒 加密
        </button>
        <button :class="['btn', mode === 'decode' ? 'btn-primary' : 'btn-secondary']" @click="mode = 'decode'">
          🔓 解密
        </button>
      </div>
      <div class="io-field">
        <label>{{ mode === 'encode' ? '输入文本' : '输入文本' }}</label>
        <input v-model="inputText" type="text"
          :placeholder="mode === 'encode' ? '请输入要加密的文本...' : '请输入要解密的文本...'"
          @input="handleCipher" />
      </div>
      <div class="io-field">
        <label>{{ mode === 'encode' ? '输出结果' : '输出结果' }}</label>
        <input :value="outputText" type="text" readonly
          :placeholder="mode === 'encode' ? '加密结果...' : '解密结果...'" />
      </div>

      <!-- Mapping table -->
      <div class="mapping-table" v-if="Object.keys(mapping).length > 0">
        <h4>字母对照表（k={{ shift }}）</h4>
        <div class="mapping-grid">
          <div v-for="(to, from) in mapping" :key="from" class="mapping-pair"
            :class="{ highlight: from === 'A' }">
            <span class="from-letter">{{ from }}</span>
            <span class="arrow">→</span>
            <span class="to-letter" :style="{ color: from === 'A' ? '#C00000' : '#2C2C2C' }">{{ to }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cipher-disk-container {
  display: flex;
  gap: 32px;
  align-items: flex-start;
  padding: 16px 0;
}
.disk-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}
.cipher-svg {
  width: 380px;
  height: 380px;
  cursor: grab;
  user-select: none;
}
.cipher-svg:active {
  cursor: grabbing;
}
.disk-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.shift-control {
  display: flex;
  align-items: center;
  gap: 12px;
}
.shift-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--qz-red);
  min-width: 120px;
  text-align: center;
}
.shift-slider {
  width: 100%;
}
.shift-slider input {
  width: 100%;
  accent-color: var(--qz-red);
}
.hint-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
}
.btn-sm {
  padding: 4px 12px;
  font-size: 0.85rem;
}
.io-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 300px;
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
  letter-spacing: 2px;
  transition: border-color 0.2s;
}
.io-field input:focus {
  outline: none;
  border-color: var(--qz-red);
}
.io-field input[readonly] {
  background: var(--qz-stone-light);
}
.mapping-table {
  margin-top: 8px;
}
.mapping-table h4 {
  font-size: 0.9rem;
  margin-bottom: 8px;
  color: var(--text-secondary);
}
.mapping-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 4px;
}
.mapping-pair {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-family: 'Courier New', monospace;
}
.mapping-pair.highlight {
  background: #FFF0EB;
  border: 1px solid var(--qz-red-light);
}
.from-letter {
  font-weight: 600;
  color: var(--qz-dark);
}
.arrow {
  color: var(--qz-stone-dark);
  font-size: 0.7rem;
}
.to-letter {
  font-weight: 600;
}
</style>
