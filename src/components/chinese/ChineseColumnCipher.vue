<script setup lang="ts">
import { ref, computed, watch } from 'vue'

function cleanText(text: string): string {
  return text.replace(/[^一-鿿]/g, '')
}

const inputText = ref('')
const numRows = ref(6)
const numCols = ref(6)
const shiftAmount = ref(3)
const columnPreset = ref<'odd' | 'even' | 'all' | 'custom'>('odd')
const customColumns = ref<Set<number>>(new Set())
const mode = ref<'encrypt' | 'decrypt'>('encrypt')
const showResult = ref(false)
const shiftMode = ref<'column' | 'row'>('column')
const rowPreset = ref<'odd' | 'even' | 'all' | 'custom'>('odd')
const customRows = ref<Set<number>>(new Set())
const copyBtnText = ref('📋 复制密文')

const cleanedText = computed(() => cleanText(inputText.value))

const colIndices = computed(() => Array.from({ length: numCols.value }, (_, i) => i + 1))
const rowIndices = computed(() => Array.from({ length: numRows.value }, (_, i) => i + 1))

const selectedColumns = computed(() => {
  const cols = new Set<number>()
  if (columnPreset.value === 'all') {
    for (let i = 1; i <= numCols.value; i++) cols.add(i)
  } else if (columnPreset.value === 'odd') {
    for (let i = 1; i <= numCols.value; i += 2) cols.add(i)
  } else if (columnPreset.value === 'even') {
    for (let i = 2; i <= numCols.value; i += 2) cols.add(i)
  } else {
    customColumns.value.forEach(c => cols.add(c))
  }
  return cols
})

const selectedRows = computed(() => {
  const rows = new Set<number>()
  if (rowPreset.value === 'all') {
    for (let i = 1; i <= numRows.value; i++) rows.add(i)
  } else if (rowPreset.value === 'odd') {
    for (let i = 1; i <= numRows.value; i += 2) rows.add(i)
  } else if (rowPreset.value === 'even') {
    for (let i = 2; i <= numRows.value; i += 2) rows.add(i)
  } else {
    customRows.value.forEach(r => rows.add(r))
  }
  return rows
})

const maxShift = computed(() => {
  if (shiftMode.value === 'row') return Math.max(1, numCols.value - 1)
  return Math.max(1, numRows.value - 1)
})

const originalGrid = computed(() => {
  const grid: string[][] = []
  const chars = cleanedText.value.split('')
  let idx = 0
  for (let r = 0; r < numRows.value; r++) {
    const row: string[] = []
    for (let c = 0; c < numCols.value; c++) {
      row.push(idx < chars.length ? chars[idx] : '')
      idx++
    }
    grid.push(row)
  }
  return grid
})

const resultGrid = computed(() => {
  const grid = originalGrid.value.map(row => [...row])

  if (shiftMode.value === 'column') {
    const selCols = selectedColumns.value
    const k = shiftAmount.value % numRows.value
    if (k === 0 || selCols.size === 0) return grid

    for (const col of selCols) {
      const colIdx = col - 1
      const colData: string[] = []
      for (let r = 0; r < numRows.value; r++) {
        colData.push(grid[r][colIdx])
      }
      const effectiveShift = mode.value === 'encrypt'
        ? k
        : (numRows.value - k) % numRows.value
      const shifted: string[] = []
      for (let r = 0; r < numRows.value; r++) {
        const sourceRow = (r - effectiveShift + numRows.value) % numRows.value
        shifted.push(colData[sourceRow])
      }
      for (let r = 0; r < numRows.value; r++) {
        grid[r][colIdx] = shifted[r]
      }
    }
  } else {
    // Row shift mode: shift selected rows RIGHT (encrypt) / LEFT (decrypt)
    const selRows = selectedRows.value
    const k = shiftAmount.value % numCols.value
    if (k === 0 || selRows.size === 0) return grid

    for (const row of selRows) {
      const rowIdx = row - 1
      const rowData = [...grid[rowIdx]]
      const effectiveShift = mode.value === 'encrypt'
        ? k
        : (numCols.value - k) % numCols.value
      const shifted: string[] = []
      for (let c = 0; c < numCols.value; c++) {
        const sourceCol = (c - effectiveShift + numCols.value) % numCols.value
        shifted.push(rowData[sourceCol])
      }
      grid[rowIdx] = shifted
    }
  }
  return grid
})

const resultText = computed(() => {
  return resultGrid.value.map(row => row.join('')).join('')
})

function isColumnSelected(col: number): boolean {
  return selectedColumns.value.has(col)
}

function isRowSelected(row: number): boolean {
  return selectedRows.value.has(row)
}

function toggleCustomColumn(col: number) {
  const next = new Set(customColumns.value)
  if (next.has(col)) {
    next.delete(col)
  } else {
    next.add(col)
  }
  customColumns.value = next
}

function toggleCustomRow(row: number) {
  const next = new Set(customRows.value)
  if (next.has(row)) {
    next.delete(row)
  } else {
    next.add(row)
  }
  customRows.value = next
}

watch(columnPreset, (val) => {
  if (val === 'custom' && customColumns.value.size === 0) {
    const defaultSet = new Set<number>()
    for (let i = 1; i <= numCols.value; i += 2) defaultSet.add(i)
    customColumns.value = defaultSet
  }
})

watch(rowPreset, (val) => {
  if (val === 'custom' && customRows.value.size === 0) {
    const defaultSet = new Set<number>()
    for (let i = 1; i <= numRows.value; i += 2) defaultSet.add(i)
    customRows.value = defaultSet
  }
})

function handleEncrypt() {
  mode.value = 'encrypt'
  showResult.value = true
  copyBtnText.value = '📋 复制密文'
}

function handleDecrypt() {
  mode.value = 'decrypt'
  showResult.value = true
  copyBtnText.value = '📋 复制明文'
}

function handleReset() {
  showResult.value = false
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(resultText.value)
    copyBtnText.value = '✅ 已复制'
    setTimeout(() => {
      copyBtnText.value = mode.value === 'encrypt' ? '📋 复制密文' : '📋 复制明文'
    }, 2000)
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = resultText.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copyBtnText.value = '✅ 已复制'
    setTimeout(() => {
      copyBtnText.value = mode.value === 'encrypt' ? '📋 复制密文' : '📋 复制明文'
    }, 2000)
  }
}

const presetLabels: { key: 'odd' | 'even' | 'all' | 'custom'; label: string }[] = [
  { key: 'odd', label: '奇数列' },
  { key: 'even', label: '偶数列' },
  { key: 'all', label: '全部列' },
  { key: 'custom', label: '自定义' },
]

const rowPresetLabels: { key: 'odd' | 'even' | 'all' | 'custom'; label: string }[] = [
  { key: 'odd', label: '奇数行' },
  { key: 'even', label: '偶数行' },
  { key: 'all', label: '全部行' },
  { key: 'custom', label: '自定义' },
]
</script>

<template>
  <div class="column-cipher-container">
    <!-- Text Input -->
    <div class="io-section">
      <label class="io-label">输入中文文本（不含标点符号）</label>
      <textarea
        v-model="inputText"
        class="text-input"
        placeholder="例如：计算机的能力主要依赖极高的算力巨量的数据以及人类积累起来的丰富算法"
        rows="3"
      ></textarea>
      <div class="char-count">
        有效字符数：<strong>{{ cleanedText.length }}</strong>
        <template v-if="cleanedText.length > 0">
          &nbsp;|&nbsp; 网格容量：<strong>{{ numRows * numCols }}</strong>
          <span v-if="cleanedText.length > numRows * numCols" class="warning-text">
            （超出 {{ cleanedText.length - numRows * numCols }} 字）
          </span>
          <span v-else-if="cleanedText.length < numRows * numCols" class="info-text">
            （剩余 {{ numRows * numCols - cleanedText.length }} 格）
          </span>
          <span v-else class="success-text">（刚好填满）</span>
        </template>
      </div>
    </div>

    <!-- Grid Dimensions -->
    <div class="control-group">
      <span class="control-label">网格尺寸</span>
      <div class="dimension-controls">
        <div class="dim-input">
          <label>行数</label>
          <input v-model.number="numRows" type="number" min="3" max="8" class="num-input" />
        </div>
        <span class="dim-sep">×</span>
        <div class="dim-input">
          <label>列数</label>
          <input v-model.number="numCols" type="number" min="3" max="8" class="num-input" />
        </div>
      </div>
    </div>

    <!-- Shift Mode Toggle -->
    <div class="control-group">
      <span class="control-label">移位模式</span>
      <div class="preset-buttons">
        <button
          :class="['btn btn-sm', shiftMode === 'column' ? 'btn-primary' : 'btn-outline']"
          @click="shiftMode = 'column'"
        >
          📊 列移位
        </button>
        <button
          :class="['btn btn-sm', shiftMode === 'row' ? 'btn-primary' : 'btn-outline']"
          @click="shiftMode = 'row'"
        >
          📏 行移位
        </button>
      </div>
    </div>

    <!-- Column / Row Selection -->
    <div class="control-group">
      <span class="control-label">{{ shiftMode === 'column' ? '选择列' : '选择行' }}</span>
      <div class="preset-buttons">
        <template v-if="shiftMode === 'column'">
          <button
            v-for="preset in presetLabels"
            :key="preset.key"
            :class="['btn btn-sm', columnPreset === preset.key ? 'btn-primary' : 'btn-outline']"
            @click="columnPreset = preset.key"
          >
            {{ preset.label }}
          </button>
        </template>
        <template v-else>
          <button
            v-for="preset in rowPresetLabels"
            :key="preset.key"
            :class="['btn btn-sm', rowPreset === preset.key ? 'btn-primary' : 'btn-outline']"
            @click="rowPreset = preset.key"
          >
            {{ preset.label }}
          </button>
        </template>
      </div>
      <div v-if="shiftMode === 'column' && columnPreset === 'custom'" class="custom-columns">
        <label
          v-for="col in colIndices"
          :key="'cc-'+col"
          :class="['column-checkbox', { active: customColumns.has(col) }]"
          @click="toggleCustomColumn(col)"
        >
          {{ col }}
        </label>
      </div>
      <div v-if="shiftMode === 'row' && rowPreset === 'custom'" class="custom-columns">
        <label
          v-for="row in rowIndices"
          :key="'cr-'+row"
          :class="['column-checkbox', { active: customRows.has(row) }]"
          @click="toggleCustomRow(row)"
        >
          {{ row }}
        </label>
      </div>
    </div>

    <!-- Shift Amount -->
    <div class="control-group">
      <span class="control-label">移位方式：{{ shiftMode === 'column' ? '下移' : '右移' }}</span>
      <div class="shift-control">
        <input
          v-model.number="shiftAmount"
          type="range"
          :min="1"
          :max="maxShift"
          class="shift-slider"
        />
        <span class="shift-value">{{ shiftAmount }} {{ shiftMode === 'column' ? '行' : '列' }}</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="action-buttons">
      <button class="btn btn-primary" @click="handleEncrypt" :disabled="cleanedText.length === 0">
        🔒 加密
      </button>
      <button class="btn btn-primary" @click="handleDecrypt" :disabled="cleanedText.length === 0">
        🔓 解密
      </button>
      <button v-if="showResult" class="btn btn-secondary" @click="handleReset">
        ↺ 重置
      </button>
    </div>

    <!-- Grid Display -->
    <div v-if="showResult" class="grids-container">
      <div class="grid-panel">
        <h4 class="grid-title">
          {{ mode === 'encrypt' ? '📝 原文网格' : '📝 密文网格' }}
        </h4>
        <div
          class="cipher-grid"
          :style="{ gridTemplateColumns: `auto repeat(${numCols}, 1fr)` }"
        >
          <!-- Header row -->
          <div class="grid-header corner-cell"></div>
          <div
            v-for="col in colIndices"
            :key="'oh-'+col"
            :class="['grid-header', 'col-header', { 'col-selected': shiftMode === 'column' && isColumnSelected(col) }]"
          >
            {{ col }}
          </div>
          <!-- Data rows -->
          <template v-for="row in rowIndices" :key="'or-'+row">
            <div :class="['grid-header', 'row-header', { 'row-selected': shiftMode === 'row' && isRowSelected(row) }]">{{ row }}</div>
            <div
              v-for="col in colIndices"
              :key="'oc-'+row+'-'+col"
              :class="[
                'grid-cell',
                {
                  'col-selected': shiftMode === 'column' && isColumnSelected(col),
                  'row-selected': shiftMode === 'row' && isRowSelected(row),
                  empty: !originalGrid[row-1][col-1]
                }
              ]"
            >
              {{ originalGrid[row - 1][col - 1] || '·' }}
            </div>
          </template>
        </div>
      </div>

      <div class="grid-arrow">→</div>

      <div class="grid-panel">
        <h4 class="grid-title">
          {{ mode === 'encrypt' ? '🔐 加密后网格' : '🔓 解密后网格' }}
        </h4>
        <div
          class="cipher-grid"
          :style="{ gridTemplateColumns: `auto repeat(${numCols}, 1fr)` }"
        >
          <div class="grid-header corner-cell"></div>
          <div
            v-for="col in colIndices"
            :key="'rh-'+col"
            :class="['grid-header', 'col-header', { 'col-selected': shiftMode === 'column' && isColumnSelected(col) }]"
          >
            {{ col }}
          </div>
          <template v-for="row in rowIndices" :key="'rr-'+row">
            <div :class="['grid-header', 'row-header', { 'row-selected': shiftMode === 'row' && isRowSelected(row) }]">{{ row }}</div>
            <div
              v-for="col in colIndices"
              :key="'rc-'+row+'-'+col"
              :class="[
                'grid-cell',
                {
                  'col-selected': shiftMode === 'column' && isColumnSelected(col),
                  'row-selected': shiftMode === 'row' && isRowSelected(row),
                  'cell-changed': (
                    (shiftMode === 'column' && isColumnSelected(col))
                    || (shiftMode === 'row' && isRowSelected(row))
                  ) && originalGrid[row-1][col-1] !== resultGrid[row-1][col-1],
                  empty: !resultGrid[row-1][col-1]
                }
              ]"
            >
              {{ resultGrid[row - 1][col - 1] || '·' }}
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Result Text -->
    <div v-if="showResult" class="result-section">
      <div class="result-header">
        <h4>
          {{ mode === 'encrypt' ? '🔐 加密结果' : '🔓 解密结果' }}
        </h4>
        <button class="btn btn-sm btn-copy" @click="handleCopy">
          {{ copyBtnText }}
        </button>
      </div>
      <div class="result-text">{{ resultText || '（无内容）' }}</div>
    </div>

    <!-- Explanation -->
    <div v-if="showResult" class="explanation-box">
      <p>
        <strong>原理说明：</strong>
        <template v-if="mode === 'encrypt'">将明文逐行填入网格，然后对选中的{{ shiftMode === 'column' ? '列' : '行' }}</template>
        <template v-else>将密文逐行填入网格，然后对选中的{{ shiftMode === 'column' ? '列' : '行' }}</template>
        <strong>
          <template v-if="shiftMode === 'column'">
            <template v-if="columnPreset === 'odd'">奇数列</template>
            <template v-else-if="columnPreset === 'even'">偶数列</template>
            <template v-else-if="columnPreset === 'all'">全部列</template>
            <template v-else>自定义列</template>
          </template>
          <template v-else>
            <template v-if="rowPreset === 'odd'">奇数行</template>
            <template v-else-if="rowPreset === 'even'">偶数行</template>
            <template v-else-if="rowPreset === 'all'">全部行</template>
            <template v-else>自定义行</template>
          </template>
        </strong>
        （第
        <template v-if="shiftMode === 'column'">
          <template v-for="(col, idx) in [...selectedColumns].sort((a,b) => a-b)" :key="'exp-col-'+col">
            {{ idx > 0 ? '、' : '' }}{{ col }}
          </template>
          列）
        </template>
        <template v-else>
          <template v-for="(row, idx) in [...selectedRows].sort((a,b) => a-b)" :key="'exp-row-'+row">
            {{ idx > 0 ? '、' : '' }}{{ row }}
          </template>
          行）
        </template>
        <template v-if="mode === 'encrypt'">
          <template v-if="shiftMode === 'column'">向下循环移位</template>
          <template v-else>向右循环移位</template>
        </template>
        <template v-else>
          <template v-if="shiftMode === 'column'">向上循环移位</template>
          <template v-else>向左循环移位</template>
        </template>
        <strong>{{ shiftAmount }} {{ shiftMode === 'column' ? '行' : '列' }}</strong>。
        <template v-if="mode === 'encrypt'">最后按行序读取，得到密文。</template>
        <template v-else>最后按行序读取，得到明文。</template>
      </p>
    </div>
  </div>
</template>

<style scoped>
.column-cipher-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px 0;
}

/* Input Section */
.io-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.io-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
}
.text-input {
  width: 100%;
  padding: 12px 14px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  resize: vertical;
  box-sizing: border-box;
  line-height: 1.8;
}
.text-input:focus {
  outline: none;
  border-color: var(--qz-red);
}
.char-count {
  font-size: 0.85rem;
  color: var(--text-secondary);
}
.char-count strong {
  color: var(--qz-dark);
}
.warning-text {
  color: var(--error, #C00000);
  font-weight: 500;
}
.info-text {
  color: var(--qz-blue);
}
.success-text {
  color: var(--success, #548235);
  font-weight: 500;
}

/* Control Groups */
.control-group {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}
.control-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--qz-dark);
  min-width: 70px;
  padding-top: 6px;
}

/* Dimension Controls */
.dimension-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dim-input {
  display: flex;
  align-items: center;
  gap: 6px;
}
.dim-input label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}
.dim-sep {
  font-size: 1.2rem;
  color: var(--qz-stone-dark);
  font-weight: 600;
}
.num-input {
  width: 56px;
  padding: 6px 8px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  text-align: center;
}
.num-input:focus {
  outline: none;
  border-color: var(--qz-red);
}

/* Preset Buttons */
.preset-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.btn-sm {
  padding: 5px 14px;
  font-size: 0.85rem;
}

/* Custom Column Checkboxes */
.custom-columns {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.column-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  background: white;
  user-select: none;
}
.column-checkbox:hover {
  border-color: var(--qz-red);
}
.column-checkbox.active {
  background: #FFF0EB;
  border-color: var(--qz-red);
  color: var(--qz-red);
  font-weight: 700;
}

/* Shift Control */
.shift-control {
  display: flex;
  align-items: center;
  gap: 12px;
}
.shift-slider {
  width: 160px;
  accent-color: var(--qz-red);
}
.shift-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--qz-red);
  min-width: 40px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 8px;
}

/* Grids Container */
.grids-container {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 8px;
}
.grid-panel {
  flex-shrink: 0;
}
.grid-title {
  margin: 0 0 10px;
  font-size: 0.95rem;
  color: var(--qz-dark);
}
.grid-arrow {
  display: flex;
  align-items: center;
  font-size: 2rem;
  color: var(--qz-red);
  padding-top: 30px;
  flex-shrink: 0;
}

/* Cipher Grid */
.cipher-grid {
  display: grid;
  gap: 2px;
}
.grid-header {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--qz-dark);
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
  min-width: 40px;
  height: 34px;
  border-radius: var(--radius-sm);
}
.corner-cell {
  min-width: 34px;
}
.col-header.col-selected {
  background: var(--qz-red);
}
.row-header {
  background: var(--qz-stone-dark);
  min-width: 34px;
}
.row-header.row-selected {
  background: var(--qz-red);
}
.grid-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s ease;
}
.grid-cell.empty {
  color: var(--qz-stone);
  font-size: 0.8rem;
}
.grid-cell.col-selected {
  background: #FFF5F0;
  border-color: var(--qz-red-light);
}
.grid-cell.row-selected {
  background: #FFF0F5;
  border-color: var(--qz-blue);
}
.grid-cell.cell-changed {
  background: #FFF0EB;
  border-color: var(--qz-red);
  color: var(--qz-red);
  font-weight: 700;
  animation: cellPop 0.4s ease;
}
@keyframes cellPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); background: var(--qz-red); color: white; }
  100% { transform: scale(1); }
}

/* Result Section */
.result-section {
  padding: 16px 20px;
  background: var(--qz-stone-light);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--qz-red);
}
.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.result-header h4 {
  margin: 0;
  color: var(--qz-dark);
}
.result-text {
  font-size: 1.1rem;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  color: var(--qz-dark);
  word-break: break-all;
  line-height: 1.8;
}
.btn-copy {
  white-space: nowrap;
  flex-shrink: 0;
  padding: 4px 12px;
  font-size: 0.85rem;
}

/* Explanation Box */
.explanation-box {
  padding: 12px 16px;
  background: #FFF8E1;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.8;
  border: 1px solid var(--qz-gold);
}
.explanation-box strong {
  color: var(--qz-red);
}
</style>
