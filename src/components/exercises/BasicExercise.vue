<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface Exercise {
  id: number
  question: string
  answer: string
  hint: string
  difficulty: number
  type: string
}

const exercises = ref<Exercise[]>([])
const currentIndex = ref(0)
const userAnswer = ref('')
const feedback = ref('')
const isCorrect = ref<boolean | null>(null)
const showHint = ref(false)
const attempts = ref(0)
const showCorrectAnswer = ref(false)

const currentExercise = computed(() => exercises.value[currentIndex.value] || null)

onMounted(async () => {
  try {
    const res = await fetch('/api/exercises?type=basic')
    const data = await res.json()
    exercises.value = data.exercises || []
  } catch (e) {
    console.error('Failed to load exercises:', e)
  }
})

async function checkAnswer() {
  if (!currentExercise.value || !userAnswer.value.trim()) return

  attempts.value++
  try {
    const res = await fetch('/api/exercises/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentExercise.value.id, answer: userAnswer.value }),
    })
    const data = await res.json()
    isCorrect.value = data.correct
    if (data.correct) {
      feedback.value = data.feedback
    } else {
      if (attempts.value >= 3) {
        showCorrectAnswer.value = true
        feedback.value = `❌ 回答错误。正确答案是：${currentExercise.value.answer}`
      } else {
        feedback.value = '❌ 回答错误，请再试一次！'
      }
    }
  } catch (e) {
    feedback.value = '❌ 提交失败，请检查网络连接'
  }
}

function revealAnswer() {
  showCorrectAnswer.value = true
  if (currentExercise.value) {
    feedback.value = `正确答案是：${currentExercise.value.answer}`
  }
}

function nextExercise() {
  currentIndex.value = Math.min(currentIndex.value + 1, exercises.value.length - 1)
  userAnswer.value = ''
  feedback.value = ''
  isCorrect.value = null
  showHint.value = false
  attempts.value = 0
  showCorrectAnswer.value = false
}

function prevExercise() {
  currentIndex.value = Math.max(currentIndex.value - 1, 0)
  userAnswer.value = ''
  feedback.value = ''
  isCorrect.value = null
  showHint.value = false
  attempts.value = 0
  showCorrectAnswer.value = false
}

async function toggleHint() {
  showHint.value = !showHint.value
  if (showHint.value && currentExercise.value) {
    // Hint is already in the exercise data from the server
  }
}
</script>

<template>
  <div class="basic-exercise">
    <div v-if="exercises.length === 0" class="loading">加载练习题中...</div>
    <div v-else-if="currentExercise" class="exercise-card card">
      <div class="exercise-header">
        <span class="exercise-num">第 {{ currentIndex + 1 }} / {{ exercises.length }} 题</span>
        <span class="difficulty" :class="'diff-' + currentExercise.difficulty">
          {{ '⭐'.repeat(currentExercise.difficulty) }}
        </span>
      </div>
      <div class="exercise-question">
        <h4>{{ currentExercise.question }}</h4>
      </div>
      <div class="exercise-input">
        <input
          v-model="userAnswer"
          type="text"
          placeholder="输入你的答案..."
          @keyup.enter="checkAnswer"
          :disabled="isCorrect === true || showCorrectAnswer"
        />
        <button class="btn btn-primary" @click="checkAnswer" :disabled="isCorrect === true || showCorrectAnswer || !userAnswer.trim()">
          提交验证
        </button>
        <button class="btn btn-secondary" @click="revealAnswer" v-if="isCorrect === false && !showCorrectAnswer">
          💡 显示答案
        </button>
        <button class="btn btn-secondary" @click="toggleHint" v-if="!showCorrectAnswer || isCorrect === true">
          {{ showHint ? '隐藏提示' : '💡 提示' }}
        </button>
      </div>
      <div v-if="attempts > 0 && isCorrect !== true" class="attempts-info">
        已尝试：{{ attempts }} / 3 次
      </div>
      <div v-if="showHint && currentExercise.hint" class="hint-box">
        {{ currentExercise.hint }}
      </div>
      <div v-if="feedback" class="feedback" :class="{ correct: isCorrect, wrong: isCorrect === false }">
        {{ feedback }}
      </div>
      <div class="exercise-nav">
        <button class="btn btn-secondary" @click="prevExercise" :disabled="currentIndex === 0">
          ◀ 上一题
        </button>
        <button class="btn btn-primary" @click="nextExercise" :disabled="currentIndex >= exercises.length - 1">
          下一题 ▶
        </button>
      </div>
    </div>
    <div v-else class="empty">暂无练习题</div>
  </div>
</template>

<style scoped>
.basic-exercise {
  padding: 16px 0;
}
.loading, .empty {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}
.exercise-card {
  max-width: 650px;
}
.exercise-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.exercise-num {
  font-weight: 600;
  color: var(--qz-blue);
}
.exercise-question h4 {
  font-size: 1.1rem;
  margin-bottom: 16px;
  line-height: 1.8;
}
.exercise-input {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.exercise-input input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
}
.exercise-input input:focus {
  outline: none;
  border-color: var(--qz-red);
}
.attempts-info {
  font-size: 0.85rem;
  color: var(--warning);
  margin-bottom: 8px;
  text-align: center;
}
.hint-box {
  padding: 12px 16px;
  background: #FFF8E1;
  border-left: 4px solid var(--warning);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  color: var(--text-primary);
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
.exercise-nav {
  display: flex;
  justify-content: space-between;
}
</style>
