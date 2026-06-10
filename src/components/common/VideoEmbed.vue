<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  src?: string
  title?: string
  placeholder?: string
}>()

const hasVideo = computed(() => !!props.src)
</script>

<template>
  <div class="video-embed">
    <div v-if="hasVideo" class="video-wrapper">
      <video
        v-if="src"
        :src="src"
        controls
        class="video-player"
        :title="title"
      >
        您的浏览器不支持视频播放
      </video>
    </div>
    <div v-else class="video-placeholder">
      <div class="placeholder-content">
        <span class="placeholder-icon">🎬</span>
        <p>{{ placeholder || '视频资源加载中...' }}</p>
        <p v-if="title" class="placeholder-title">{{ title }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-embed {
  max-width: 700px;
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.video-wrapper {
  position: relative;
}
.video-player {
  width: 100%;
  border-radius: var(--radius-lg);
}
.video-placeholder {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--qz-dark), #3D3D3D);
  border-radius: var(--radius-lg);
  padding: 40px;
}
.placeholder-content {
  text-align: center;
  color: var(--qz-stone-light);
}
.placeholder-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 12px;
}
.placeholder-title {
  font-size: 0.85rem;
  margin-top: 4px;
  opacity: 0.7;
}
</style>
