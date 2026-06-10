<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Drag slider CAPTCHA
const dragPosition = ref(0)
const dragVerified = ref(false)
const isDragging = ref(false)
const sliderTrackRef = ref<HTMLElement | null>(null)

function clampPos(pos: number): number {
  return Math.max(0, Math.min(100, pos))
}

function onDragStart(e: MouseEvent | TouchEvent) {
  if (dragVerified.value) return
  isDragging.value = true
  e.preventDefault()
}

function onDragMove(e: MouseEvent | TouchEvent) {
  if (!isDragging.value || !sliderTrackRef.value) return
  const rect = sliderTrackRef.value.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const percent = ((clientX - rect.left) / rect.width) * 100
  dragPosition.value = clampPos(percent)
}

function onDragEnd() {
  if (!isDragging.value) return
  isDragging.value = false
  if (dragPosition.value >= 95) {
    dragPosition.value = 100
    dragVerified.value = true
  } else {
    dragPosition.value = 0
  }
}

function resetDrag() {
  dragVerified.value = false
  dragPosition.value = 0
}

onMounted(() => {
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
  document.addEventListener('touchmove', onDragMove, { passive: false })
  document.addEventListener('touchend', onDragEnd)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchmove', onDragMove)
  document.removeEventListener('touchend', onDragEnd)
})

// Image selection CAPTCHA
const images = [
  { id: 1, url: '🏠', label: '房子', isTarget: true },
  { id: 2, url: '🚗', label: '汽车', isTarget: true },
  { id: 3, url: '🌲', label: '树', isTarget: false },
  { id: 4, url: '🐱', label: '猫', isTarget: false },
  { id: 5, url: '🚌', label: '公交车', isTarget: true },
  { id: 6, url: '🌸', label: '花', isTarget: false },
  { id: 7, url: '🏍️', label: '摩托车', isTarget: true },
  { id: 8, url: '📱', label: '手机', isTarget: false },
  { id: 9, url: '✈️', label: '飞机', isTarget: true },
]
const selectedImages = ref<number[]>([])
const imageVerified = ref(false)
const imagePrompt = '请选出所有交通工具'

function toggleImage(id: number) {
  if (imageVerified.value) return
  const idx = selectedImages.value.indexOf(id)
  if (idx >= 0) {
    selectedImages.value.splice(idx, 1)
  } else {
    selectedImages.value.push(id)
  }
}

function checkImages() {
  const targets = images.filter(i => i.isTarget).map(i => i.id)
  const correct = targets.every(t => selectedImages.value.includes(t)) &&
    selectedImages.value.every(s => targets.includes(s))
  imageVerified.value = correct
}

const captchaTab = ref<'slider' | 'image'>('slider')
</script>

<template>
  <div class="captcha-demo">
    <h3>🤖 真人验证（CAPTCHA）</h3>
    <p class="captcha-desc">
      CAPTCHA全称"全自动区分计算机和人类的图灵测试"。它通过一些对人类简单但对AI困难的任务来验证你是真人。
      你上网时遇到的"请拖动滑块"、"选出所有包含XX的图片"都是CAPTCHA。
    </p>

    <div class="captcha-tabs">
      <button :class="['btn', captchaTab === 'slider' ? 'btn-primary' : 'btn-secondary']"
        @click="captchaTab = 'slider'">滑动验证</button>
      <button :class="['btn', captchaTab === 'image' ? 'btn-primary' : 'btn-secondary']"
        @click="captchaTab = 'image'">图片选择</button>
    </div>

    <!-- Slider CAPTCHA -->
    <div v-if="captchaTab === 'slider'" class="captcha-card card">
      <h4>🖱 滑动验证</h4>
      <p class="captcha-instruction">请按住滑块拖动到最右侧完成验证</p>
      <div class="slider-container">
        <div
          ref="sliderTrackRef"
          class="drag-track"
          :class="{ verified: dragVerified }"
        >
          <div class="drag-fill" :style="{ width: dragPosition + '%' }" />
          <div class="drag-text" v-if="!dragVerified">
            <span class="drag-arrow" v-if="dragPosition < 95">→ 滑动完成验证 →</span>
          </div>
          <div
            ref="sliderThumbRef"
            class="drag-thumb"
            :class="{ dragging: isDragging, verified: dragVerified }"
            :style="{ left: dragPosition + '%' }"
            @mousedown="onDragStart"
            @touchstart.prevent="onDragStart"
          >
            <span v-if="dragVerified">✓</span>
            <span v-else>→</span>
          </div>
        </div>
      </div>
      <div v-if="dragVerified" class="captcha-success">
        ✅ 验证通过！你是真人！
        <button class="btn btn-outline btn-sm" style="margin-left: 12px" @click="resetDrag">重试</button>
      </div>
    </div>

    <!-- Image Selection CAPTCHA -->
    <div v-if="captchaTab === 'image'" class="captcha-card card">
      <h4>🖼 图片选择验证</h4>
      <p class="captcha-instruction">{{ imagePrompt }}</p>
      <div class="image-grid">
        <div
          v-for="img in images" :key="img.id"
          :class="['image-cell', { selected: selectedImages.includes(img.id) }]"
          @click="toggleImage(img.id)"
        >
          <span class="image-icon">{{ img.url }}</span>
          <span class="image-label">{{ img.label }}</span>
        </div>
      </div>
      <div class="captcha-actions">
        <button class="btn btn-primary" @click="checkImages" :disabled="selectedImages.length === 0">
          提交验证
        </button>
      </div>
      <div v-if="imageVerified" class="captcha-success">✅ 选择正确！你是真人！</div>
      <div v-if="imageVerified === false && selectedImages.length > 0" class="captcha-fail">
        ❌ 选择不正确，请重试
      </div>
    </div>

    <div class="captcha-info">
      <h4>🧠 CAPTCHA与AI对抗</h4>
      <p>CAPTCHA的核心思想是利用<strong>人类擅长但AI不擅长</strong>的任务来区分真人：</p>
      <ul>
        <li><strong>文字识别</strong>：扭曲的文字人类能读懂，传统OCR很难识别</li>
        <li><strong>图像理解</strong>：人类一眼能看出"哪些是交通工具"，AI需要专门训练</li>
        <li><strong>行为分析</strong>：人类的鼠标移动轨迹是不平滑的，机器人则很精确</li>
      </ul>
      <p style="margin-top: 8px;">但随着AI的进步，CAPTCHA也在不断升级，这是一场永不停止的"猫鼠游戏"。</p>
    </div>
  </div>
</template>

<style scoped>
.captcha-demo {
  padding: 16px 0;
  max-width: 700px;
}
.captcha-demo h3 { margin-bottom: 8px; }
.captcha-desc {
  color: var(--text-secondary);
  margin-bottom: 16px;
  line-height: 1.8;
}
.captcha-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.captcha-card { margin-bottom: 16px; }
.captcha-card h4 { margin-bottom: 8px; }
.captcha-instruction {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 16px;
}
.slider-container {
  padding: 16px 0;
}
.drag-track {
  position: relative;
  height: 46px;
  background: #E8E2DC;
  border-radius: 23px;
  overflow: hidden;
  border: 2px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}
.drag-track.verified {
  border-color: var(--success, #4CAF50);
  background: #E8F5E9;
}
.drag-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #F5E1D8, var(--qz-red, #C45B3C));
  border-radius: 23px;
  transition: width 0.05s linear;
}
.drag-text {
  position: relative;
  z-index: 1;
  pointer-events: none;
}
.drag-arrow {
  color: #999;
  font-size: 0.85rem;
  letter-spacing: 1px;
}
.drag-thumb {
  position: absolute;
  top: 2px;
  width: 42px;
  height: 38px;
  background: white;
  border: 2px solid var(--qz-red, #C45B3C);
  border-radius: 21px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  z-index: 2;
  transform: translateX(-50%);
  transition: background 0.2s, border-color 0.2s;
  font-size: 1.1rem;
  color: var(--qz-red, #C45B3C);
  font-weight: bold;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}
.drag-thumb:hover {
  background: #FFF0EB;
}
.drag-thumb.dragging {
  cursor: grabbing;
  box-shadow: 0 4px 12px rgba(196, 91, 60, 0.35);
}
.drag-thumb.verified {
  background: var(--success, #4CAF50);
  border-color: var(--success, #4CAF50);
  color: white;
  cursor: default;
}
.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}
.image-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}
.image-cell:hover { border-color: var(--qz-red); }
.image-cell.selected {
  border-color: var(--qz-red);
  background: #FFF0EB;
}
.image-icon { font-size: 2rem; }
.image-label { font-size: 0.8rem; color: var(--text-secondary); }
.captcha-actions { margin-bottom: 12px; }
.captcha-success {
  padding: 10px 14px;
  background: #E8F5E9;
  border-radius: var(--radius-sm);
  color: var(--success);
  font-size: 0.9rem;
}
.captcha-fail {
  padding: 10px 14px;
  background: #FFF0EB;
  border-radius: var(--radius-sm);
  color: var(--error);
  font-size: 0.9rem;
}
.captcha-info {
  padding: 16px 20px;
  background: var(--qz-stone-light);
  border-radius: var(--radius-md);
}
.captcha-info h4 { margin-bottom: 8px; }
.captcha-info p, .captcha-info li {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.8;
}
.captcha-info ul { margin-left: 20px; }
</style>
