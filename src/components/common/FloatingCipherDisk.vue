<template>
  <div class="floating-cipher-disk">
    <!-- 密码盘按钮 -->
    <button class="float-btn" @click="showDisk = !showDisk; showStrip = false" title="凯撒密码盘">
      <span class="btn-icon">{{ showDisk ? '✕' : '🔐' }}</span>
      <span class="btn-text">{{ showDisk ? '关闭' : '密码盘' }}</span>
    </button>

    <!-- 密码条按钮 -->
    <button class="float-btn strip-btn" @click="showStrip = !showStrip; showDisk = false" title="字母密码条">
      <span class="btn-icon">{{ showStrip ? '✕' : '📏' }}</span>
      <span class="btn-text">{{ showStrip ? '关闭' : '密码条' }}</span>
    </button>

    <!-- 密码盘弹窗 -->
    <Transition name="popup">
      <div v-if="showDisk" class="popup-container">
        <div class="popup-card">
          <div class="popup-header">
            <span class="popup-title">🔐 凯撒密码盘</span>
            <button class="popup-close" @click="showDisk = false">✕</button>
          </div>
          <div class="popup-body">
            <iframe
              src="/embed/caesar-scratch.html"
              class="disk-iframe"
              title="凯撒密码盘"
              sandbox="allow-scripts allow-same-origin"
              allowfullscreen="false"
            />
          </div>
        </div>
      </div>
    </Transition>

    <!-- 密码条弹窗 -->
    <Transition name="popup">
      <div v-if="showStrip" class="popup-container">
        <div class="popup-card">
          <div class="popup-header strip-header">
            <span class="popup-title">📏 字母密码条</span>
            <button class="popup-close" @click="showStrip = false">✕</button>
          </div>
          <div class="popup-body strip-body">
            <div class="strip-label">拖动/点击下行字母表观察移位（当前偏移：<strong>{{ shift }}</strong>）</div>
            <div class="strip-table"
              @mousedown="startDrag"
              @mousemove="onDrag"
              @mouseup="endDrag"
              @mouseleave="endDrag"
              @touchstart.prevent="startDrag"
              @touchmove.prevent="onDrag"
              @touchend="endDrag"
            >
              <div class="strip-row strip-fixed">
                <span v-for="l in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')" :key="'f'+l" class="strip-cell fixed-cell">{{ l }}</span>
              </div>
              <div class="strip-row strip-draggable" :style="{ transform: `translateX(${offset}px)` }">
                <span v-for="i in 26" :key="'d'+i" class="strip-cell drag-cell">{{ alphabet[(i - 1 + shift + 26) % 26] }}</span>
              </div>
            </div>
            <div class="strip-controls">
              <button class="strip-ctrl-btn" @click="shift = (shift - 1 + 26) % 26">◀ 左移</button>
              <span class="strip-shift-val">偏移量：{{ shift }}</span>
              <button class="strip-ctrl-btn" @click="shift = (shift + 1) % 26">右移 ▶</button>
              <button class="strip-ctrl-btn" @click="shift = 3; offset = 0">重置为3</button>
            </div>
            <p class="strip-tip">💡 上排A对准下排D = 加密右移3位。解密时反过来找：在下排找字母→看上排对应字母。</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const showDisk = ref(false)
const showStrip = ref(false)

// 密码条状态
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const shift = ref(3)
const offset = ref(0)
let dragging = false
let startX = 0
let startOffset = 0

function startDrag(e: MouseEvent | TouchEvent) {
  dragging = true
  const ev = 'touches' in e ? e.touches[0] : e
  startX = ev.clientX
  startOffset = offset.value
}
function onDrag(e: MouseEvent | TouchEvent) {
  if (!dragging) return
  const ev = 'touches' in e ? e.touches[0] : e
  const dx = ev.clientX - startX
  const cellWidth = 28
  const newShift = Math.round((startOffset + dx) / cellWidth)
  offset.value = newShift * cellWidth
  shift.value = ((newShift % 26) + 26) % 26
}
function endDrag() {
  dragging = false
  offset.value = 0
}
</script>

<style scoped>
.floating-cipher-disk {
  position: fixed;
  top: 120px;
  right: 32px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.float-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 50px;
  border: 2px solid var(--qz-red, #C45B3C);
  background: rgba(255, 255, 255, 0.92);
  color: var(--qz-red);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(196, 58, 49, 0.25);
  transition: all 0.25s;
  backdrop-filter: blur(8px);
  white-space: nowrap;
}
.float-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(196, 58, 49, 0.35);
  background: rgba(255, 255, 255, 0.98);
}
.float-btn.strip-btn {
  border-color: #1565C0;
  color: #1565C0;
  box-shadow: 0 4px 16px rgba(21, 101, 192, 0.25);
}
.float-btn.strip-btn:hover {
  box-shadow: 0 6px 20px rgba(21, 101, 192, 0.35);
}
.btn-icon { font-size: 1.1rem; }
.btn-text { white-space: nowrap; }

.popup-container {
  position: absolute;
  top: 60px;
  right: 0;
  box-shadow: 0 12px 40px rgba(44, 44, 44, 0.25);
  border-radius: 16px;
  overflow: hidden;
}
.popup-card {
  width: 420px;
  background: #FFF8F0;
  border: 2px solid var(--qz-red, #C45B3C);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.popup-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px;
  background: linear-gradient(135deg, var(--qz-red, #C45B3C), #a8322a);
  color: white;
}
.popup-header.strip-header {
  background: linear-gradient(135deg, #1565C0, #0D47A1);
}
.popup-title { font-size: 1rem; font-weight: 600; }
.popup-close {
  width: 28px; height: 28px; border-radius: 50%;
  border: none; background: rgba(255,255,255,.2);
  color: white; font-size: .9rem; cursor: pointer;
}
.popup-close:hover { background: rgba(255,255,255,.3); }
.popup-body { padding: 8px; background: black; }
.disk-iframe { width: 404px; height: 480px; border: none; border-radius: 8px; }

/* 密码条 */
.strip-body {
  background: #FAFAFA;
  padding: 16px;
}
.strip-label {
  font-size: 0.9rem; color: #333; text-align: center; margin-bottom: 14px;
}
.strip-label strong { color: #1565C0; font-size: 1.1rem; }
.strip-table { overflow-x: auto; margin-bottom: 4px; }
.strip-row { display: flex; white-space: nowrap; }
.strip-cell {
  width: 28px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Courier New', monospace; font-size: 0.85rem; font-weight: 600;
  border: 1px solid #ddd; flex-shrink: 0;
}
.fixed-cell { background: #f0f0f0; color: #333; }
.drag-cell { background: #fff; color: #1565C0; cursor: grab; }
.drag-cell:active { cursor: grabbing; background: #E3F2FD; }
.strip-controls {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; margin: 12px 0;
}
.strip-ctrl-btn {
  padding: 6px 14px; border: 1px solid #bbb; border-radius: 8px;
  background: white; cursor: pointer; font-size: 0.85rem;
}
.strip-ctrl-btn:hover { border-color: #1565C0; color: #1565C0; }
.strip-shift-val { font-size: 0.95rem; font-weight: 600; color: #1565C0; min-width: 90px; text-align: center; }
.strip-tip { font-size: 0.8rem; color: #666; margin-top: 8px; text-align: center; line-height: 1.5; }

.popup-enter-active, .popup-leave-active { transition: all 0.3s ease; }
.popup-enter-from, .popup-leave-to { opacity: 0; transform: translateY(-10px); }
</style>