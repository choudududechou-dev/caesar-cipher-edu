<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{ roomCode: string }>()
const emit = defineEmits(['back'])

const ranking = ref<any[]>([])
const roomName = ref('')
const loading = ref(true)
let pollTimer: ReturnType<typeof setInterval> | null = null

async function loadRanking() {
  try {
    const res = await fetch(`/api/contest/ranking?roomCode=${props.roomCode}`)
    const data = await res.json()
    ranking.value = data.ranking || []
    roomName.value = data.roomName || ''
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function startPolling() {
  stopPolling()
  loadRanking()
  pollTimer = setInterval(loadRanking, 5000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

onMounted(startPolling)
onUnmounted(stopPolling)

const medals = ['🥇', '🥈', '🥉']

function formatTime(ts: string | null): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('zh-CN')
}
</script>

<template>
  <div class="contest-rank">
    <h3>🏆 竞赛排名</h3>
    <p class="room-info">{{ roomName }}（{{ roomCode }}）</p>

    <div v-if="loading" class="loading">加载排名中...</div>

    <div v-else-if="ranking.length === 0" class="empty">暂无排名数据</div>

    <div v-else class="rank-list">
      <div v-for="(item, i) in ranking" :key="i" class="rank-item" :class="{ 'top-3': i < 3 }">
        <div class="rank-main">
          <span class="rank-pos">{{ i < 3 ? medals[i] : `#${i + 1}` }}</span>
          <div class="rank-body">
            <div class="rank-name-row">
              <span class="rank-name">{{ item.nickname }}</span>
              <span class="rank-score">{{ item.score }}分</span>
            </div>
            <div class="rank-meta">
              <span class="rank-time">🕐 {{ formatTime(item.finishedAt || item.created_at) }}</span>
              <span class="rank-attempts">尝试 {{ item.totalAttempts || item.attempts || 0 }} 次</span>
            </div>
            <div v-if="item.details && item.details.length" class="rank-details">
              <span v-for="(d, di) in item.details" :key="di" class="q-badge" :class="{ correct: d.correct, wrong: !d.correct && d.attempts > 0, pending: !d.correct && (!d.attempts || d.attempts === 0) }">
                Q{{ Number(di) + 1 }}{{ d.correct ? '✅' : d.attempts > 0 ? '❌' : '⏳' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="rank-actions">
      <button class="btn btn-secondary" @click="loadRanking">🔄 刷新排名</button>
      <button class="btn btn-outline" @click="emit('back')">◀ 返回竞赛</button>
    </div>
  </div>
</template>

<style scoped>
.contest-rank { padding: 16px 0; max-width: 650px; }
.room-info { color: var(--text-secondary); margin-bottom: 16px; }
.loading, .empty { text-align: center; padding: 40px; color: var(--text-secondary); }
.rank-list { display: flex; flex-direction: column; gap: 8px; }
.rank-item {
  display: flex;
  padding: 14px 16px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: all 0.2s;
}
.rank-item.top-3 {
  border-color: var(--qz-gold);
  background: linear-gradient(135deg, #FFFDE7, white);
}
.rank-main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
}
.rank-pos { font-size: 1.3rem; width: 36px; text-align: center; flex-shrink: 0; }
.rank-body { flex: 1; min-width: 0; }
.rank-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.rank-name { font-weight: 500; }
.rank-score { font-weight: 700; color: var(--qz-red); }
.rank-meta {
  display: flex;
  gap: 16px;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.rank-details {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}
.q-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}
.q-badge.correct { background: #E8F5E9; color: var(--success); }
.q-badge.wrong { background: #FFF0EB; color: var(--error); }
.q-badge.pending { background: var(--qz-stone-light); color: var(--qz-stone); }
.rank-actions {
  display: flex;
  gap: 8px;
  margin-top: 20px;
  justify-content: center;
}
.btn-outline {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-outline:hover {
  border-color: var(--qz-red);
  color: var(--qz-red);
}
</style>
