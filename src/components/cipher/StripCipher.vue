<script setup lang="ts">
import { ref, computed } from 'vue'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const shift = ref(3)
const highlightIndex = ref<number | null>(null)

const inputText = ref('')
const outputText = ref('')
const mode = ref<'encode' | 'decode'>('encode')

function handleCipher() {
  const text = inputText.value.toUpperCase()
  if (!text) { outputText.value = ''; return }
  let result = ''
  const k = ((shift.value % 26) + 26) % 26
  for (const ch of text) {
    const idx = ALPHABET.indexOf(ch)
    if (idx === -1) { result += ch }
    else if (mode.value === 'encode') { result += ALPHABET[(idx + k) % 26] }
    else { result += ALPHABET[(idx - k + 26) % 26] }
  }
  outputText.value = result
}

function setShift(k: number) {
  shift.value = ((k % 26) + 26) % 26
}

const highlightedMapping = computed(() => {
  if (highlightIndex.value === null) return null
  return { from: ALPHABET[highlightIndex.value], to: ALPHABET[(highlightIndex.value + shift.value) % 26] }
})

// Bottom row letters: each position shows the shifted letter
const bottomRow = computed(() => {
  const k = ((shift.value % 26) + 26) % 26
  return ALPHABET.split('').map((_, i) => ALPHABET[(i + k) % 26])
})
</script>

<template>
  <div class="strip-cipher-container">
    <!-- Fixed top row -->
    <div class="strip-row top-row">
      <div class="row-tag">固定行</div>
      <div class="strip-letters">
        <div
          v-for="(letter, i) in ALPHABET"
          :key="'t'+i"
          class="letter-cell top-cell"
          :class="{ hl: highlightIndex === i }"
          @mouseenter="highlightIndex = i"
          @mouseleave="highlightIndex = null"
        >{{ letter }}</div>
      </div>
    </div>

    <!-- Shifted bottom row (visual only, no scroll) -->
    <div class="strip-row bottom-row">
      <div class="row-tag">移动行</div>
      <div class="strip-letters">
        <div
          v-for="(letter, i) in bottomRow"
          :key="'b'+i"
          class="letter-cell bottom-cell"
          :class="{ hl: highlightIndex !== null && i === (highlightIndex + shift) % 26 }"
        >{{ letter }}</div>
      </div>
    </div>

    <!-- Mapping indicator -->
    <div class="strip-indicator" v-if="highlightedMapping">
      <span class="from">{{ highlightedMapping.from }}</span>
      <span class="arrow-mapping">→</span>
      <span class="to">{{ highlightedMapping.to }}</span>
    </div>
    <div class="strip-indicator" v-else>
      <span class="placeholder">将鼠标悬停在字母上查看对应关系</span>
    </div>

    <!-- Controls -->
    <div class="strip-controls">
      <button class="btn btn-outline btn-sm" @click="setShift(shift - 1)">◀ 左移</button>
      <input type="range" min="0" max="25" :value="shift" class="shift-slider"
        @input="setShift(Number(($event.target as HTMLInputElement).value))" />
      <button class="btn btn-outline btn-sm" @click="setShift(shift + 1)">右移 ▶</button>
      <span class="shift-value">k = {{ shift }}</span>
    </div>

    <!-- I/O -->
    <div class="strip-io">
      <div class="mode-toggle">
        <button :class="['btn', mode === 'encode' ? 'btn-primary' : 'btn-secondary']" @click="mode = 'encode'">🔒 加密</button>
        <button :class="['btn', mode === 'decode' ? 'btn-primary' : 'btn-secondary']" @click="mode = 'decode'">🔓 解密</button>
      </div>
      <div class="io-row">
        <input v-model="inputText" type="text" :placeholder="mode === 'encode' ? '输入文本...' : '输入密文...'" @input="handleCipher" />
        <span class="io-arrow">→</span>
        <input :value="outputText" type="text" readonly placeholder="结果..." />
      </div>
    </div>
  </div>
</template>

<style scoped>
.strip-cipher-container {
  display: flex; flex-direction: column; gap: 10px;
  padding: 16px 0; width: 100%; max-width: 900px;
}
.strip-row {
  display: flex; align-items: center; gap: 8px;
}
.row-tag {
  font-size: 0.75rem; color: var(--text-secondary);
  width: 48px; flex-shrink: 0; text-align: right;
}
.strip-letters {
  display: flex; gap: 1px; flex-wrap: wrap;
}
.letter-cell {
  width: 30px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem; font-weight: 600;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  transition: all 0.15s;
  user-select: none; cursor: default;
}
.top-cell { background: white; color: var(--qz-dark); }
.bottom-cell { background: var(--qz-stone-light); color: var(--qz-dark); }
.letter-cell.hl {
  background: #FFF0EB; border-color: var(--qz-red); color: var(--qz-red);
  transform: scale(1.15); z-index: 2;
  box-shadow: 0 0 6px rgba(196,91,60,0.25);
}
.strip-indicator {
  text-align: center; padding: 4px; min-height: 32px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.from, .to { font-family: 'Courier New', monospace; font-size: 1.1rem; font-weight: 700; }
.from { color: var(--qz-dark); }
.to { color: #C00000; }
.arrow-mapping { color: var(--qz-red); font-size: 1rem; }
.placeholder { color: var(--qz-stone-dark); font-size: 0.8rem; }
.strip-controls {
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.shift-slider { width: 160px; accent-color: var(--qz-red); }
.shift-value { font-size: 0.95rem; font-weight: 600; color: var(--qz-red); min-width: 50px; }
.strip-io { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
.mode-toggle { display: flex; gap: 8px; }
.io-row { display: flex; align-items: center; gap: 10px; }
.io-row input {
  flex: 1; padding: 8px 12px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.95rem; font-family: 'Courier New', monospace; letter-spacing: 1px;
}
.io-row input:focus { outline: none; border-color: var(--qz-red); }
.io-row input[readonly] { background: var(--qz-stone-light); }
.io-arrow { font-size: 1.2rem; color: var(--qz-red); font-weight: bold; }
.btn-sm { padding: 4px 10px; font-size: 0.8rem; }
</style>
