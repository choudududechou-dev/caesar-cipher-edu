<script setup lang="ts">
import { useTeachingStore } from '@/stores/teaching'

const store = useTeachingStore()
</script>

<template>
  <nav class="teaching-nav">
    <ul class="nav-list">
      <li
        v-for="section in store.sections"
        :key="section.id"
        class="nav-item"
        :class="{ active: store.currentSection === section.id }"
        @click="store.setSection(section.id)"
      >
        <span class="nav-dot" />
        <span class="nav-title">{{ section.title }}</span>
        <span class="nav-time">{{ section.duration }}min</span>
      </li>
    </ul>
    <div class="nav-footer">
      <router-link to="/admin" class="admin-link">⚙ 教师管理</router-link>
    </div>
  </nav>
</template>

<style scoped>
.teaching-nav {
  width: 200px;
  background: var(--qz-dark);
  color: var(--text-light);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  user-select: none;
}
.nav-list {
  list-style: none;
  padding: 12px 0;
  flex: 1;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
  font-size: 0.85rem;
}
.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
}
.nav-item.active {
  background: rgba(196, 91, 60, 0.25);
  border-left-color: var(--qz-red);
}
.nav-item.active .nav-dot {
  background: var(--qz-red);
}
.nav-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--qz-stone-dark);
  flex-shrink: 0;
  transition: background 0.2s;
}
.nav-title {
  flex: 1;
}
.nav-time {
  font-size: 0.7rem;
  color: var(--qz-stone-dark);
  flex-shrink: 0;
}
.nav-item.active .nav-time {
  color: var(--qz-red-light);
}
.nav-footer {
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.admin-link {
  color: var(--qz-stone-dark);
  font-size: 0.8rem;
  text-decoration: none;
  transition: color 0.2s;
}
.admin-link:hover {
  color: var(--qz-red-light);
}
</style>
