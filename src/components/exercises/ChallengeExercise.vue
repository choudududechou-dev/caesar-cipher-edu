<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface Challenge {
  id: number
  question: string
  answer: string
  hint: string
  difficulty: number
  word_length: number
}

const challenges = ref<Challenge[]>([])
const currentIndex = ref(0)
const userAnswer = ref('')
const feedback = ref('')
const isCorrect = ref<boolean | null>(null)
const showHint = ref(false)
const attemptsUsed = ref(0)
const maxAttempts = 3
const showAnswer = ref(false)
const isLocked = ref(false)

const currentChallenge = computed(() => challenges.value[currentIndex.value] || null)
const attemptsLeft = computed(() => maxAttempts - attemptsUsed.value)

onMounted(async () => {
  try {
    const res = await fetch('/api/exercises?type=challenge')
    const data = await res.json()
    challenges.value = data.exercises || []
  } catch (e) {
    console.error('Failed to load challenges:', e)
  }
})

async function submitAnswer() {
  if (!currentChallenge.value || !userAnswer.value.trim() || isLocked.value) return

  attemptsUsed.value++

  try {
    const res = await fetch('/api/exercises/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentChallenge.value.id, answer: userAnswer.value }),
    })
    const data = await res.json()
    isCorrect.value = data.correct

    if (data.correct) {
      feedback.value = data.feedback
      isLocked.value = true
    } else if (attemptsUsed.value >= maxAttempts) {
      feedback.value = '❌ 回答错误，请再试一次！'
      isLocked.value = true
      showAnswer.value = true
    } else {
      feedback.value = '❌ 回答错误，请再试一次！'
    }
  } catch (e) {
    feedback.value = '❌ 提交失败，请检查网络连接'
  }
}

function revealAnswer() {
  showAnswer.value = true
  isLocked.value = true
}

function resetChallenge() {
  userAnswer.value = ''
  feedback.value = ''
  isCorrect.value = null
  showHint.value = false
  attemptsUsed.value = 0
  showAnswer.value = false
  isLocked.value = false
}

function nextChallenge() {
  currentIndex.value = Math.min(currentIndex.value + 1, challenges.value.length - 1)
  resetChallenge()
}

function prevChallenge() {
  currentIndex.value = Math.max(currentIndex.value - 1, 0)
  resetChallenge()
}

function toggleHint() {
  showHint.value = !showHint.value
}
</script>

<template>
  <div class="challenge-exercise">
    <div v-if="challenges.length === 0" class="loading">加载挑战题中...</div>
    <div v-else-if="currentChallenge" class="challenge-card card">
      <div class="challenge-header">
        <span class="challenge-num">挑战 {{ currentIndex + 1 }} / {{ challenges.length }}</span>
        <span class="difficulty" :class="'diff-' + currentChallenge.difficulty">
          {{ '⭐'.repeat(currentChallenge.difficulty) }}
        </span>
      </div>

      <div class="attempts-bar">
        <div class="attempts-info">
          剩余尝试次数：
          <span class="attempts-count" :class="{ low: attemptsLeft <= 1 }">{{ attemptsLeft }}</span>
          / {{ maxAttempts }}
        </div>
        <div class="attempts-dots">
          <span v-for="i in maxAttempts" :key="i" class="dot" :class="{ used: i <= attemptsUsed }" />
        </div>
      </div>

      <div class="challenge-question">
        <h4>{{ currentChallenge.question }}</h4>
        <p class="word-length-hint" v-if="currentChallenge.word_length">
          提示：答案是一个 {{ currentChallenge.word_length }} 个字母的英文单词
        </p>
      </div>

      <div class="challenge-input">
        <input
          v-model="userAnswer"
          type="text"
          placeholder="输入你的答案（不含空格）..."
          @keyup.enter="submitAnswer"
          :disabled="isLocked"
        />
        <button class="btn btn-primary" @click="submitAnswer" :disabled="isLocked || !userAnswer.trim()">
          提交（{{ attemptsLeft }}次剩余）
        </button>
        <button class="btn btn-secondary" @click="toggleHint">
          {{ showHint ? '隐藏提示' : '💡 提示' }}
        </button>
        <button
          v-if="!isCorrect && !isLocked"
          class="btn btn-outline"
          @click="revealAnswer"
        >
          🔑 显示答案
        </button>
      </div>

      <div v-if="showHint && currentChallenge.hint" class="hint-box">
        {{ currentChallenge.hint }}
      </div>

      <div v-if="feedback" class="feedback" :class="{ correct: isCorrect, wrong: isCorrect === false }">
        {{ feedback }}
      </div>

      <div v-if="showAnswer" class="answer-reveal">
        🔑 正确答案：<strong>{{ currentChallenge.answer }}</strong>
      </div>

      <div class="challenge-nav">
        <button class="btn btn-secondary" @click="prevChallenge" :disabled="currentIndex === 0">◀ 上一题</button>
        <button v-if="isLocked" class="btn btn-outline" @click="resetChallenge">🔄 重新挑战本题</button>
        <button class="btn btn-primary" @click="nextChallenge" :disabled="currentIndex >= challenges.length - 1">下一题 ▶</button>
      </div>
    </div>
    <div v-else class="empty">暂无挑战题</div>
  </div>
</template>

<style scoped>
.challenge-exercise {
  padding: 16px 0;
}
.loading, .empty {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}
.challenge-card {
  max-width: 650px;
}
.challenge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.challenge-num {
  font-weight: 600;
  color: var(--qz-blue);
}
.attempts-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: var(--qz-stone-light);
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
}
.attempts-info {
  font-size: 0.9rem;
}
.attempts-count {
  font-weight: 700;
  color: var(--qz-red);
  font-size: 1.1rem;
}
.attempts-count.low {
  color: var(--error);
  animation: pulse 0.5s infinite alternate;
}
@keyframes pulse {
  from { opacity: 1; }
  to { opacity: 0.5; }
}
.attempts-dots {
  display: flex;
  gap: 6px;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--qz-stone);
  transition: background 0.3s;
}
.dot.used {
  background: var(--qz-red);
}
.challenge-question {
  margin-bottom: 16px;
}
.challenge-question h4 {
  font-size: 1.1rem;
  line-height: 1.8;
}
.word-length-hint {
  font-size: 0.85rem;
  color: var(--qz-blue);
  margin-top: 4px;
}
.challenge-input {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.challenge-input input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
}
.challenge-input input:focus {
  outline: none;
  border-color: var(--qz-red);
}
.hint-box {
  padding: 12px 16px;
  background: #FFF8E1;
  border-left: 4px solid var(--warning);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  margin-bottom: 12px;
}
.feedback {
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  margin-bottom: 12px;
}
.feedback.correct {
  background: #E8F5E9;
  color: var(--success);
  border-left: 4px solid var(--success);
}
.feedback.wrong {
  background: #FFF0EB;
  color: var(--error);
  border-left: 4px solid var(--error);
}
.answer-reveal {
  padding: 12px 16px;
  background: #E3F2FD;
  border-radius: var(--radius-sm);
  border-left: 4px solid var(--qz-blue);
  font-size: 0.9rem;
  margin-bottom: 12px;
}
.answer-reveal strong {
  font-family: 'Courier New', monospace;
  color: var(--qz-blue);
  font-size: 1rem;
}
.challenge-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
</style>
