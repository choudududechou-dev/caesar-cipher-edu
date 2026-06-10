<script setup lang="ts">
import { ref } from 'vue'
import ContestRank from './ContestRank.vue'
import FloatingCipherDisk from '@/components/common/FloatingCipherDisk.vue'

const roomCode = ref('')
const roomName = ref('')
const nickname = ref('')
const participantId = ref<number | null>(null)
const joined = ref(false)
const questions = ref<any[]>([])
const currentQIndex = ref(0)
const userAnswer = ref('')
const feedback = ref('')
const attemptsUsed = ref(0)
const maxAttempts = 3
const score = ref(0)
const showRanking = ref(false)
const error = ref('')

async function joinRoom() {
  if (!roomCode.value || !nickname.value) return
  try {
    // Join
    const res = await fetch('/api/contest/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode: roomCode.value, nickname: nickname.value }),
    })
    const data = await res.json()
    if (data.error) {
      error.value = data.error
      return
    }
    participantId.value = data.participantId

    // Get status to load questions
    const statusRes = await fetch(`/api/contest/status?roomCode=${roomCode.value}`)
    const statusData = await statusRes.json()
    questions.value = statusData.questions || []
    joined.value = true
    error.value = ''
  } catch (e) {
    error.value = '加入房间失败，请检查房间号'
  }
}

async function submitAnswer() {
  if (!userAnswer.value.trim() || attemptsUsed.value >= maxAttempts) return

  attemptsUsed.value++
  try {
    const res = await fetch('/api/contest/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId: participantId.value,
        roomCode: roomCode.value,
        questionIndex: currentQIndex.value,
        answer: userAnswer.value,
      }),
    })
    const data = await res.json()
    feedback.value = data.feedback

    const qDone = currentQIndex.value >= questions.value.length - 1
    const exhausted = attemptsUsed.value >= maxAttempts

    if (data.correct) {
      score.value++
      setTimeout(() => {
        if (!qDone) { nextQuestion() } else { showRanking.value = true }
      }, 1500)
    } else if (qDone && exhausted) {
      setTimeout(() => { showRanking.value = true }, 1500)
    }
  } catch (e) {
    feedback.value = '❌ 提交失败'
  }
}

function nextQuestion() {
  currentQIndex.value++
  userAnswer.value = ''
  feedback.value = ''
  attemptsUsed.value = 0
}

function reset() {
  joined.value = false
  roomCode.value = ''
  nickname.value = ''
  participantId.value = null
  questions.value = []
  currentQIndex.value = 0
  userAnswer.value = ''
  feedback.value = ''
  attemptsUsed.value = 0
  score.value = 0
  showRanking.value = false
  error.value = ''
}
</script>

<template>
  <div class="contest-room">
    <!-- Lobby -->
    <div v-if="!joined" class="contest-lobby">
      <h3>🏆 密码挑战赛</h3>
      <p class="lobby-desc">输入老师分享的房间号，与同学们比拼解密能力！</p>

      <div class="lobby-actions">
        <div class="lobby-card card">
          <h4>🚪 加入房间</h4>
          <div class="field">
            <label>房间号</label>
            <input v-model="roomCode" type="text" placeholder="输入3位房间号..." maxlength="3" />
          </div>
          <div class="field">
            <label>你的昵称</label>
            <input v-model="nickname" type="text" placeholder="输入昵称..." @keyup.enter="joinRoom" />
          </div>
          <button class="btn btn-primary" @click="joinRoom" :disabled="!roomCode || !nickname">
            加入房间
          </button>
        </div>
      </div>

      <div v-if="error" class="error-msg">{{ error }}</div>
    </div>

    <!-- Active Contest -->
    <div v-else-if="!showRanking" class="contest-active">
      <div class="contest-header">
        <h3>🏆 {{ roomName }}</h3>
        <span class="room-badge">房间号：{{ roomCode }}</span>
        <span class="score-badge">得分：{{ score }}</span>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: ((currentQIndex) / questions.length * 100) + '%' }" />
        <span>题目 {{ currentQIndex + 1 }} / {{ questions.length }}</span>
      </div>

      <div class="question-card card" v-if="questions[currentQIndex]">
        <div class="question-text">{{ questions[currentQIndex].question }}</div>
        <div class="attempts-info">
          剩余尝试：{{ maxAttempts - attemptsUsed }} / {{ maxAttempts }}
        </div>

        <div class="answer-row">
          <input v-model="userAnswer" type="text" placeholder="输入答案..."
            @keyup.enter="submitAnswer" :disabled="attemptsUsed >= maxAttempts" />
          <button class="btn btn-primary" @click="submitAnswer"
            :disabled="!userAnswer.trim() || attemptsUsed >= maxAttempts">
            提交
          </button>
        </div>

        <div v-if="feedback" class="feedback" :class="{ correct: feedback.includes('✅'), wrong: feedback.includes('❌') }">
          {{ feedback }}
        </div>
      </div>

      <div class="contest-actions">
        <button class="btn btn-secondary" @click="reset">退出竞赛</button>
        <button class="btn btn-outline" @click="showRanking = true">🏆 查看排行榜</button>
      </div>

      <FloatingCipherDisk />
    </div>

    <!-- Ranking -->
    <ContestRank v-else :room-code="roomCode" @back="showRanking = false" />
  </div>
</template>

<style scoped>
.contest-room { padding: 16px 0; max-width: 700px; }
.lobby-desc { color: var(--text-secondary); margin-bottom: 20px; }
.lobby-actions { display: flex; gap: 16px; justify-content: center; }
.lobby-card { max-width: 360px; width: 100%; display: flex; flex-direction: column; gap: 12px; }
.lobby-card h4 { font-size: 1rem; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field label { font-size: 0.8rem; color: var(--text-secondary); }
.field input {
  padding: 8px 12px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
}
.field input:focus { outline: none; border-color: var(--qz-red); }
.room-code-display {
  padding: 12px;
  background: var(--qz-stone-light);
  border-radius: var(--radius-sm);
  text-align: center;
}
.room-code-display strong { font-size: 1.4rem; color: var(--qz-red); letter-spacing: 3px; }
.share-hint { font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px; }
.error-msg { padding: 10px; background: #FFF0EB; color: var(--error); border-radius: var(--radius-sm); margin-top: 12px; }
.contest-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.room-badge { padding: 4px 12px; background: var(--qz-stone-light); border-radius: 16px; font-size: 0.85rem; }
.score-badge { padding: 4px 12px; background: var(--qz-red); color: white; border-radius: 16px; font-size: 0.85rem; }
.progress-bar {
  height: 24px;
  background: var(--qz-stone-light);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}
.progress-fill {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  background: var(--qz-red);
  transition: width 0.5s;
}
.question-card { margin-bottom: 16px; }
.question-text { font-size: 1.1rem; font-weight: 500; margin-bottom: 12px; line-height: 1.8; }
.attempts-info { font-size: 0.85rem; color: var(--warning); margin-bottom: 12px; }
.answer-row { display: flex; gap: 8px; margin-bottom: 12px; }
.answer-row input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
}
.answer-row input:focus { outline: none; border-color: var(--qz-red); }
.feedback {
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
}
.feedback.correct { background: #E8F5E9; color: var(--success); }
.feedback.wrong { background: #FFF0EB; color: var(--error); }
.contest-actions { display: flex; gap: 8px; margin-top: 12px; }
</style>
