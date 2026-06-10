<template>
  <div class="caesar-disk-container">
    <div class="disk-header">
      <span class="disk-title">🔐 凯撒密码盘</span>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>
    
    <div class="disk-body">
      <div class="cipher-disk">
        <div class="outer-ring">
          <span v-for="(letter, idx) in alphabet" :key="'outer-'+idx" 
            class="outer-letter" :style="{ transform: `rotate(${idx * 13.846}deg)` }">
            {{ letter }}
          </span>
        </div>
        
        <div class="inner-ring" :style="{ transform: `rotate(${innerRotation}deg)` }">
          <span v-for="(letter, idx) in alphabet" :key="'inner-'+idx" 
            class="inner-letter" :style="{ transform: `rotate(${-idx * 13.846}deg)` }">
            {{ letter }}
          </span>
        </div>
        
        <div class="center-marker">
          <div class="marker-line"></div>
          <div class="marker-text">A→{{ shiftedA }}</div>
        </div>
      </div>
      
      <div class="disk-controls">
        <div class="shift-info">
          <span class="shift-label">当前位移：</span>
          <span class="shift-value">{{ shift }} 位</span>
        </div>
        
        <div class="control-buttons">
          <button class="control-btn" @click="shiftLeft">← 左移</button>
          <button class="control-btn reset-btn" @click="resetShift">重置</button>
          <button class="control-btn" @click="shiftRight">右移 →</button>
        </div>
        
        <div class="manual-input">
          <input type="range" v-model="shift" min="0" max="25" class="shift-slider" />
          <input type="number" v-model.number="shift" min="0" max="25" class="shift-input" />
        </div>
      </div>
      
      <div class="example-section">
        <div class="example-row">
          <span class="example-label">加密示例：</span>
          <input type="text" v-model="plaintext" class="example-input" placeholder="输入明文" />
          <span class="arrow">→</span>
          <span class="ciphertext">{{ encrypt(plaintext) }}</span>
        </div>
        <div class="example-row">
          <span class="example-label">解密示例：</span>
          <input type="text" v-model="cipherInput" class="example-input" placeholder="输入密文" />
          <span class="arrow">→</span>
          <span class="plaintext">{{ decrypt(cipherInput) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const shift = ref(3)
const plaintext = ref('HELLO')
const cipherInput = ref('KHOOR')

const innerRotation = computed(() => -shift.value * 13.846)

const shiftedA = computed(() => {
  const idx = (0 + shift.value) % 26
  return alphabet[idx]
})

function shiftLeft() {
  shift.value = (shift.value - 1 + 26) % 26
}

function shiftRight() {
  shift.value = (shift.value + 1) % 26
}

function resetShift() {
  shift.value = 3
}

function encrypt(text: string): string {
  return text.toUpperCase().split('').map(char => {
    const idx = alphabet.indexOf(char)
    if (idx === -1) return char
    return alphabet[(idx + shift.value) % 26]
  }).join('')
}

function decrypt(text: string): string {
  return text.toUpperCase().split('').map(char => {
    const idx = alphabet.indexOf(char)
    if (idx === -1) return char
    return alphabet[(idx - shift.value + 26) % 26]
  }).join('')
}

defineEmits(['close'])
</script>

<style scoped>
.caesar-disk-container {
  background: linear-gradient(135deg, #FFF8F0, #F5EEE6);
  border-radius: 16px;
  border: 2px solid var(--qz-red, #C45B3C);
  overflow: hidden;
  width: 520px;
}

.disk-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: linear-gradient(135deg, var(--qz-red, #C45B3C), #a8322a);
  color: white;
}

.disk-title {
  font-size: 1rem;
  font-weight: 600;
}

.close-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.disk-body {
  padding: 16px;
}

.cipher-disk {
  position: relative;
  width: 280px;
  height: 280px;
  margin: 0 auto;
}

.outer-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid var(--qz-red, #C45B3C);
  background: white;
}

.outer-letter {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24px;
  height: 24px;
  margin-left: -12px;
  margin-top: -12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--qz-red, #C45B3C);
  transform-origin: center center;
}

.outer-letter:nth-child(1) { transform: rotate(0deg) translateY(-128px); }
.outer-letter:nth-child(2) { transform: rotate(13.846deg) translateY(-128px); }
.outer-letter:nth-child(3) { transform: rotate(27.692deg) translateY(-128px); }
.outer-letter:nth-child(4) { transform: rotate(41.538deg) translateY(-128px); }
.outer-letter:nth-child(5) { transform: rotate(55.384deg) translateY(-128px); }
.outer-letter:nth-child(6) { transform: rotate(69.23deg) translateY(-128px); }
.outer-letter:nth-child(7) { transform: rotate(83.076deg) translateY(-128px); }
.outer-letter:nth-child(8) { transform: rotate(96.923deg) translateY(-128px); }
.outer-letter:nth-child(9) { transform: rotate(110.769deg) translateY(-128px); }
.outer-letter:nth-child(10) { transform: rotate(124.615deg) translateY(-128px); }
.outer-letter:nth-child(11) { transform: rotate(138.461deg) translateY(-128px); }
.outer-letter:nth-child(12) { transform: rotate(152.307deg) translateY(-128px); }
.outer-letter:nth-child(13) { transform: rotate(166.153deg) translateY(-128px); }
.outer-letter:nth-child(14) { transform: rotate(180deg) translateY(-128px); }
.outer-letter:nth-child(15) { transform: rotate(193.846deg) translateY(-128px); }
.outer-letter:nth-child(16) { transform: rotate(207.692deg) translateY(-128px); }
.outer-letter:nth-child(17) { transform: rotate(221.538deg) translateY(-128px); }
.outer-letter:nth-child(18) { transform: rotate(235.384deg) translateY(-128px); }
.outer-letter:nth-child(19) { transform: rotate(249.23deg) translateY(-128px); }
.outer-letter:nth-child(20) { transform: rotate(263.076deg) translateY(-128px); }
.outer-letter:nth-child(21) { transform: rotate(276.923deg) translateY(-128px); }
.outer-letter:nth-child(22) { transform: rotate(290.769deg) translateY(-128px); }
.outer-letter:nth-child(23) { transform: rotate(304.615deg) translateY(-128px); }
.outer-letter:nth-child(24) { transform: rotate(318.461deg) translateY(-128px); }
.outer-letter:nth-child(25) { transform: rotate(332.307deg) translateY(-128px); }
.outer-letter:nth-child(26) { transform: rotate(346.153deg) translateY(-128px); }

.inner-ring {
  position: absolute;
  top: 50px;
  left: 50px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  border: 3px solid #4CAF50;
  background: #E8F5E9;
  transition: transform 0.3s ease;
}

.inner-letter {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin-left: -10px;
  margin-top: -10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  color: #2E7D32;
  transform-origin: center center;
}

.inner-letter:nth-child(1) { transform: rotate(0deg) translateY(-80px); }
.inner-letter:nth-child(2) { transform: rotate(13.846deg) translateY(-80px); }
.inner-letter:nth-child(3) { transform: rotate(27.692deg) translateY(-80px); }
.inner-letter:nth-child(4) { transform: rotate(41.538deg) translateY(-80px); }
.inner-letter:nth-child(5) { transform: rotate(55.384deg) translateY(-80px); }
.inner-letter:nth-child(6) { transform: rotate(69.23deg) translateY(-80px); }
.inner-letter:nth-child(7) { transform: rotate(83.076deg) translateY(-80px); }
.inner-letter:nth-child(8) { transform: rotate(96.923deg) translateY(-80px); }
.inner-letter:nth-child(9) { transform: rotate(110.769deg) translateY(-80px); }
.inner-letter:nth-child(10) { transform: rotate(124.615deg) translateY(-80px); }
.inner-letter:nth-child(11) { transform: rotate(138.461deg) translateY(-80px); }
.inner-letter:nth-child(12) { transform: rotate(152.307deg) translateY(-80px); }
.inner-letter:nth-child(13) { transform: rotate(166.153deg) translateY(-80px); }
.inner-letter:nth-child(14) { transform: rotate(180deg) translateY(-80px); }
.inner-letter:nth-child(15) { transform: rotate(193.846deg) translateY(-80px); }
.inner-letter:nth-child(16) { transform: rotate(207.692deg) translateY(-80px); }
.inner-letter:nth-child(17) { transform: rotate(221.538deg) translateY(-80px); }
.inner-letter:nth-child(18) { transform: rotate(235.384deg) translateY(-80px); }
.inner-letter:nth-child(19) { transform: rotate(249.23deg) translateY(-80px); }
.inner-letter:nth-child(20) { transform: rotate(263.076deg) translateY(-80px); }
.inner-letter:nth-child(21) { transform: rotate(276.923deg) translateY(-80px); }
.inner-letter:nth-child(22) { transform: rotate(290.769deg) translateY(-80px); }
.inner-letter:nth-child(23) { transform: rotate(304.615deg) translateY(-80px); }
.inner-letter:nth-child(24) { transform: rotate(318.461deg) translateY(-80px); }
.inner-letter:nth-child(25) { transform: rotate(332.307deg) translateY(-80px); }
.inner-letter:nth-child(26) { transform: rotate(346.153deg) translateY(-80px); }

.center-marker {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.marker-line {
  width: 3px;
  height: 20px;
  background: var(--qz-red, #C45B3C);
  margin: 0 auto;
  border-radius: 2px;
}

.marker-text {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--qz-red, #C45B3C);
  margin-top: 4px;
}

.disk-controls {
  margin-top: 16px;
  text-align: center;
}

.shift-info {
  margin-bottom: 12px;
}

.shift-label {
  font-size: 0.9rem;
  color: var(--qz-stone);
}

.shift-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--qz-red);
}

.control-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 12px;
}

.control-btn {
  padding: 8px 18px;
  border: 1px solid #d4cbc0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  font-family: inherit;
  transition: all 0.2s;
}

.control-btn:hover {
  border-color: var(--qz-red);
  color: var(--qz-red);
}

.reset-btn {
  background: var(--qz-red);
  color: white;
  border-color: var(--qz-red);
}

.reset-btn:hover {
  background: #a8322a;
  color: white;
}

.manual-input {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.shift-slider {
  width: 150px;
  cursor: pointer;
}

.shift-input {
  width: 50px;
  padding: 6px;
  border: 1px solid #d4cbc0;
  border-radius: 6px;
  text-align: center;
  font-size: 0.9rem;
}

.example-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #d4cbc0;
}

.example-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
}

.example-row:last-child {
  margin-bottom: 0;
}

.example-label {
  font-size: 0.85rem;
  color: var(--qz-stone);
  min-width: 70px;
}

.example-input {
  padding: 6px 10px;
  border: 1px solid #d4cbc0;
  border-radius: 6px;
  font-size: 0.9rem;
  width: 120px;
  text-transform: uppercase;
}

.arrow {
  color: var(--qz-red);
  font-weight: 700;
}

.ciphertext, .plaintext {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--qz-red);
  min-width: 120px;
  text-align: center;
}

.plaintext {
  color: #2E7D32;
}
</style>