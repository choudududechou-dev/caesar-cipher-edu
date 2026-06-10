import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useContestStore = defineStore('contest', () => {
  const roomCode = ref('')
  const participantId = ref<number | null>(null)
  const nickname = ref('')
  const score = ref(0)
  const attempts = ref(0)
  const currentQuestionIndex = ref(0)
  const totalQuestions = ref(0)
  const contestStatus = ref<'idle' | 'joined' | 'active' | 'finished'>('idle')
  const ranking = ref<any[]>([])
  const feedback = ref('')
  const attemptsLeft = ref(3)

  const isJoined = computed(() => contestStatus.value !== 'idle')

  function reset() {
    roomCode.value = ''
    participantId.value = null
    nickname.value = ''
    score.value = 0
    attempts.value = 0
    currentQuestionIndex.value = 0
    totalQuestions.value = 0
    contestStatus.value = 'idle'
    ranking.value = []
    feedback.value = ''
    attemptsLeft.value = 3
  }

  return {
    roomCode, participantId, nickname, score, attempts,
    currentQuestionIndex, totalQuestions, contestStatus, ranking,
    feedback, attemptsLeft, isJoined,
    reset,
  }
})
