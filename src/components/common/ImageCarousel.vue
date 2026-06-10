<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  images: Array<{ url: string; caption: string }>
  interval?: number
}>()

const currentIndex = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function startTimer() {
  stopTimer()
  timer = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % props.images.length
  }, props.interval || 3000)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function goTo(index: number) {
  currentIndex.value = index
  startTimer()
}

onMounted(startTimer)
onUnmounted(stopTimer)
</script>

<template>
  <div class="carousel" @mouseenter="stopTimer" @mouseleave="startTimer">
    <div class="carousel-viewport">
      <div
        v-for="(img, i) in images"
        :key="i"
        class="carousel-slide"
        :class="{ active: i === currentIndex }"
      >
        <div class="slide-placeholder">
          <span class="slide-emoji">{{ img.url }}</span>
        </div>
        <p class="slide-caption">{{ img.caption }}</p>
      </div>
    </div>
    <div class="carousel-dots">
      <button
        v-for="(_, i) in images"
        :key="i"
        class="dot-btn"
        :class="{ active: i === currentIndex }"
        @click="goTo(i)"
      />
    </div>
  </div>
</template>

<style scoped>
.carousel {
  position: relative;
  max-width: 600px;
  overflow: hidden;
}
.carousel-viewport {
  position: relative;
  min-height: 200px;
}
.carousel-slide {
  display: none;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
}
.carousel-slide.active {
  display: flex;
  animation: fadeIn 0.5s ease;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.slide-placeholder {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--qz-stone-light);
  border-radius: var(--radius-md);
}
.slide-emoji {
  font-size: 3rem;
}
.slide-caption {
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
}
.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 8px;
}
.dot-btn {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--qz-red);
  background: transparent;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s;
}
.dot-btn.active {
  background: var(--qz-red);
}
</style>
