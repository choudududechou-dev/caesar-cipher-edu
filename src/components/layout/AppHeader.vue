<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const modeLabel = computed(() => {
  if (route.path === '/teacher') return '👨‍🏫 教师端'
  if (route.path === '/student') return '👩‍🎓 学生端'
  if (route.path === '/admin') return '⚙ 管理端'
  return '👨‍🏫 教师端'
})
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <span class="mode-tag">{{ modeLabel }}</span>
    </div>

    <div class="header-center">
      <span class="logo-icon">🔐</span>
      <div class="header-title">
        <h1 class="main-title">探秘凯撒密码</h1>
        <span class="sub-title">从古罗马到数字时代的加密之旅</span>
      </div>
    </div>

    <div class="header-right"></div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
  background: linear-gradient(135deg, var(--qz-dark) 0%, #3D3D3D 100%);
  color: var(--text-light);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 100;
  flex-shrink: 0;
}
.header-left {
  width: 100px;
}
.mode-tag {
  font-size: 0.78rem;
  color: var(--qz-stone-light);
  padding: 4px 10px;
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
}
.header-center {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo-icon {
  font-size: 1.6rem;
}
.header-title {
  text-align: center;
}
.main-title {
  font-size: 1.2rem;
  color: white;
  line-height: 1.2;
  margin: 0;
}
.sub-title {
  font-size: 0.65rem;
  color: var(--qz-stone);
  display: block;
}
.header-right {
  width: 100px;
}
</style>
