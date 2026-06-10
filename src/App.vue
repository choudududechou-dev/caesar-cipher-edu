<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'

const route = useRoute()

const isStudentPage = computed(() => route.path === '/student')
</script>

<template>
  <div class="app-layout">
    <AppHeader />
    <div class="app-body">
      <main class="app-main" :class="{ 'student-mode': isStudentPage }">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}
.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.app-main {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  background: var(--bg-main);
}
.app-main.student-mode {
  padding: 0;
  overflow: hidden;
}
</style>
