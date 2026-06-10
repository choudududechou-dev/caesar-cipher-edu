<script setup lang="ts">
import { ref } from 'vue'
import BasicExercise from './BasicExercise.vue'
import ChallengeExercise from './ChallengeExercise.vue'
import ChineseCodeTable from '@/components/chinese/ChineseCodeTable.vue'
import ChineseColumnCipher from '@/components/chinese/ChineseColumnCipher.vue'
import FloatingCipherDisk from '@/components/common/FloatingCipherDisk.vue'

const tab = ref<'basic' | 'challenge' | 'chinese' | 'column'>('basic')
</script>

<template>
  <div class="exercise-panel">
    <div class="tab-bar">
      <button :class="['tab-btn', { active: tab === 'basic' }]" @click="tab = 'basic'">
        📝 基础练习
      </button>
      <button :class="['tab-btn', { active: tab === 'challenge' }]" @click="tab = 'challenge'">
        🏆 挑战模式
      </button>
      <button :class="['tab-btn', { active: tab === 'chinese' }]" @click="tab = 'chinese'">
        🀄 中文编码表
      </button>
      <button :class="['tab-btn', { active: tab === 'column' }]" @click="tab = 'column'">
        📐 中文列移位
      </button>
    </div>
    <div class="tab-content">
      <BasicExercise v-if="tab === 'basic'" />
      <ChallengeExercise v-else-if="tab === 'challenge'" />
      <ChineseCodeTable v-else-if="tab === 'chinese'" />
      <ChineseColumnCipher v-else />
    </div>

    <FloatingCipherDisk />
  </div>
</template>

<style scoped>
.exercise-panel {
  padding: 8px 0;
}
.tab-bar {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid var(--border-color);
  margin-bottom: 16px;
}
.tab-btn {
  padding: 8px 20px;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  color: var(--text-secondary);
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
  font-family: inherit;
}
.tab-btn:hover {
  color: var(--qz-red);
}
.tab-btn.active {
  color: var(--qz-red);
  border-bottom-color: var(--qz-red);
}
.tab-content {
  min-height: 300px;
}
</style>
