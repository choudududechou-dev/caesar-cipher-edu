<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import WelcomePage from './WelcomePage.vue'
import GameLevel from './GameLevel.vue'
import SettlementPage from './SettlementPage.vue'
import { levels } from '@/data/levels'
import FloatingCipherDisk from '@/components/common/FloatingCipherDisk.vue'

const currentBg = computed(() => {
  if (gameState.value === 'welcome') return '/images/bg-quanzhou.png'
  if (gameState.value === 'playing' || gameState.value === 'settlement') {
    return levels[currentLevelIndex.value]?.bgImage || ''
  }
  return ''
})



// --- Game state machine ---
type GameState = 'login' | 'welcome' | 'playing' | 'settlement'
const gameState = ref<GameState>('login')
const currentStudent = ref('')
const currentSession = ref('')
const currentLevelIndex = ref(0)
// 始终显示5站，初始0星，取最高分，记录历史
const levelResults = ref<Array<{ stationName: string; stars: number; history: number[] }>>(
  levels.map(l => ({ stationName: l.stationName, stars: 0, history: [] }))
)
const isTransitioning = ref(false)

// Sidebar image height adjustment
const sidebarRef = ref<HTMLElement | null>(null)
const imagesLoaded = ref<Set<number>>(new Set())

function resizeSidebarImages(retry = 3) {
  if (!sidebarRef.value) return
  const imgs = sidebarRef.value.querySelectorAll<HTMLImageElement>('.sidebar-img')
  let allDone = true
  let hasNewImages = false
  
  imgs.forEach((img, index) => {
    if (!imagesLoaded.value.has(index)) {
      hasNewImages = true
      const wrapper = img.parentElement
      if (!wrapper) return
      wrapper.style.height = 'auto'
      img.style.height = 'auto'
    }
  })
  
  if (!hasNewImages) return
  
  requestAnimationFrame(() => {
    imgs.forEach((img, index) => {
      if (imagesLoaded.value.has(index)) return
      const wrapper = img.parentElement
      if (!wrapper) return
      const h = img.clientHeight
      if (h > 0) {
        wrapper.style.height = (h * 1.3) + 'px'
        img.style.height = '100%'
        imagesLoaded.value.add(index)
      } else {
        allDone = false
      }
    })
    if (!allDone && retry > 0) {
      setTimeout(() => resizeSidebarImages(retry - 1), 200)
    }
  })
}

watch([gameState, currentLevelIndex], () => {
  // Multiple attempts with increasing delays to handle image loading across state changes
  setTimeout(() => resizeSidebarImages(5), 100)
  setTimeout(() => resizeSidebarImages(3), 500)
})

function startGame() {
  sessionStorage.removeItem('caesar-game-answers')
  gameState.value = 'welcome'
}

async function beginLevels() {
  // 记录学习开始（用于教师端"已完成学习"判定）
  if (currentSession.value && currentStudent.value) {
    try {
      await fetch('/api/progress/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.value,
          studentName: currentStudent.value,
          finished: false,
        })
      })
    } catch {}
  }
  currentLevelIndex.value = 0
  gameState.value = 'playing'
}

async function submitProgress(levelIndex: number, stationName: string, stars: number, correctCount: number, totalCount: number) {
  if (!currentSession.value || !currentStudent.value) return
  
  try {
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: currentSession.value,
        studentName: currentStudent.value,
        levelIndex,
        stationName,
        correctCount,
        totalCount,
        coins: stars
      })
    })
  } catch (err) {
    console.error('提交进度失败:', err)
  }
}

async function onLevelComplete(stars: number, correctCount = 0, totalCount = 0) {
  const level = levels[currentLevelIndex.value]
  // 取最高分，追加历史记录
  const idx = currentLevelIndex.value
  const cur = levelResults.value[idx]
  cur.history.push(stars)
  if (stars > cur.stars) {
    cur.stars = stars
  }

  // 提交进度到服务器
  await submitProgress(currentLevelIndex.value, level.stationName, stars, correctCount, totalCount)
  
  if (currentLevelIndex.value < levels.length - 1) {
    isTransitioning.value = true
    setTimeout(() => {
      currentLevelIndex.value++
      isTransitioning.value = false
    }, 300)
  } else {
    // 学习结束，记录会话
    const totalCoins = levelResults.value.reduce((sum, r) => sum + r.stars, 0)
    try {
      await fetch('/api/progress/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.value,
          studentName: currentStudent.value,
          finished: true,
          totalCoins,
          finishedLevels: levels.length
        })
      })
    } catch (err) {
      console.error('记录学习会话失败:', err)
    }
    
    isTransitioning.value = true
    setTimeout(() => {
      gameState.value = 'settlement'
      isTransitioning.value = false
    }, 300)
  }
}

function restartGame() {
  // 清作答缓存但保留历史最高分
  sessionStorage.removeItem('caesar-game-answers')
  currentLevelIndex.value = 0
  gameState.value = 'playing'
}

function goToLevel(index: number) {
  if (gameState.value !== 'login') {
    isTransitioning.value = true
    setTimeout(() => {
      currentLevelIndex.value = index
      gameState.value = 'playing'
      isTransitioning.value = false
    }, 300)
  }
}

const classCode = ref('')
const loading = ref(false)
const error = ref('')

const sessionInfo = ref<{
  code: string
  status: string
  created_at: string
} | null>(null)
const students = ref<Array<{
  id: number
  name: string
  signed_in: boolean
  signed_at: string | null
}>>([])

const signingInId = ref<number | null>(null)
const signedInName = ref('')
const signinError = ref('')

async function lookupRoom() {
  const code = classCode.value.trim()
  if (!code) {
    error.value = '请输入班级号'
    return
  }
  if (!/^\d{3}$/.test(code)) {
    error.value = '请输入3位数字班级号'
    return
  }
  loading.value = true
  error.value = ''
  sessionInfo.value = null
  students.value = []

  try {
    const res = await fetch(`/api/session/${code}`)
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || '班级号无效')
    }
    const data = await res.json()
    sessionInfo.value = data.session
    students.value = data.students
  } catch (e: any) {
    error.value = e.message || '无法查找班级，请检查班级号'
  } finally {
    loading.value = false
  }
}

async function signIn(studentId: number, name: string) {
  signingInId.value = studentId
  signinError.value = ''
  try {
    const res = await fetch(`/api/session/${sessionInfo.value!.code}/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || '签到失败')
    }
    const data = await res.json()
    signedInName.value = data.name
    // Mark as signed in locally
    const s = students.value.find(st => st.id === studentId)
    if (s) {
      s.signed_in = true
    }
    // Switch to welcome page after short delay
    currentStudent.value = name
    currentSession.value = sessionInfo.value!.code
    setTimeout(() => {
      startGame()
    }, 800)
  } catch (e: any) {
    signinError.value = e.message || '签到失败'
  } finally {
    signingInId.value = null
  }
}
</script>

<template>
  <!-- Game Mode (welcome / playing / settlement) -->
  <div v-if="gameState !== 'login'" class="game-layout" :style="currentBg ? { backgroundImage: `url(${currentBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } : {}">
    <!-- Top bar: student info + progress -->
    <div class="game-top-bar">
      <span class="bar-student">👤 {{ currentStudent }} | 班级：{{ currentSession }}</span>
      <span v-if="gameState === 'playing'" class="bar-progress">第 {{ currentLevelIndex + 1 }} / {{ levels.length }} 关</span>
    </div>

    <!-- Body: sidebar + content -->
    <div class="game-body">
      <aside ref="sidebarRef" class="game-sidebar">
        <div class="sidebar-title">
          🗺️ 海上丝路密码探究导航地图
        </div>
        <div class="sidebar-map-container">
          <img
            src="/images/nav-full-map.png"
            alt="海上丝路导航地图"
            class="sidebar-map"
          />
          <div class="map-markers">
            <div
              v-for="(_, i) in levels"
              :key="i"
              :class="['map-marker', { active: (gameState === 'playing' || gameState === 'settlement') && i <= currentLevelIndex, current: gameState === 'playing' && i === currentLevelIndex }]"
              :title="levels[i].stationName"
              @click="goToLevel(i)"
            />
          </div>
        </div>
      </aside>
      <main class="game-content" :class="{ transitioning: isTransitioning }">
        <div class="bg-transition-layer" :style="{ backgroundImage: `url(${currentBg})` }"></div>
        <div class="page-container">
          <Transition name="fade-slide">
            <WelcomePage v-if="gameState === 'welcome'" :key="'welcome'" :student-name="currentStudent" @start="beginLevels" />
            <GameLevel v-else-if="gameState === 'playing'" :key="`level-${currentLevelIndex}`" :level="levels[currentLevelIndex]" @complete="(stars, correct, total) => onLevelComplete(stars, correct, total)" />
            <SettlementPage v-else-if="gameState === 'settlement'" :key="'settlement'" :results="levelResults" @navigate="goToLevel" @restart="restartGame" />
          </Transition>
        </div>
      </main>
    </div>
    <FloatingCipherDisk />
  </div>

  <!-- Sign-in Mode -->
  <div v-else class="student-view">
    <!-- Header -->
    <div class="view-header">
      <h1 class="view-title">🎒 学生签到</h1>
    </div>

    <!-- Class code entry -->
    <div class="card entry-card">
      <h2 class="section-title">🔑 输入班级</h2>
      <p class="entry-desc">请向老师获取班级号，输入后加入课堂</p>
      <div class="code-input-row">
        <input
          v-model="classCode"
          type="text"
          class="code-input"
          placeholder="输入3位班级号（如101）"
          maxlength="3"
          @keyup.enter="lookupRoom"
        />
        <button class="btn btn-primary" @click="lookupRoom" :disabled="loading || !classCode.trim()">
          {{ loading ? '查找中...' : '🔍 查找班级' }}
        </button>
      </div>
      <p v-if="error" class="error-msg">{{ error }}</p>
    </div>

    <!-- Session info + Student grid -->
    <div v-if="sessionInfo" class="card students-card">
      <div class="session-header">
        <div class="session-info">
          <h3>班级：<span class="code-highlight">{{ sessionInfo.code }}</span></h3>
          <span
            class="session-status"
            :class="sessionInfo.status === 'locked' ? 'locked' : 'active'"
          >
            {{ sessionInfo.status === 'locked' ? '🔒 已锁定' : '🟢 签到中' }}
          </span>
        </div>
        <p class="instruction" v-if="sessionInfo.status !== 'locked'">
          点击你的名字完成签到
        </p>
        <p class="instruction locked-instruction" v-else>
          签到已锁定，无法再签到
        </p>
      </div>

      <p v-if="signinError" class="error-msg">{{ signinError }}</p>

      <div v-if="signedInName" class="success-banner">
        ✅ {{ signedInName }} 签到成功！正在进入课堂...
      </div>

      <div class="student-grid">
        <div
          v-for="student in students"
          :key="student.id"
          class="student-card"
          :class="{
            'signed-in': student.signed_in,
            'not-signed': !student.signed_in,
          }"
          @click="!student.signed_in && sessionInfo!.status !== 'locked' && signIn(student.id, student.name)"
        >
          <div class="student-avatar">
            {{ student.name.charAt(0) }}
          </div>
          <div class="student-info">
            <div class="student-name">{{ student.name }}</div>
            <div class="student-status">
              <template v-if="signingInId === student.id">
                <span class="status-hint">⏳ 签到中...</span>
              </template>
              <template v-else-if="student.signed_in">
                <span class="status-hint signed">✅ 已签到</span>
              </template>
              <template v-else>
                <span class="status-hint" :class="{ locked: sessionInfo!.status === 'locked' }">
                  {{ sessionInfo!.status === 'locked' ? '🔒 已锁定' : '👆 点击签到' }}
                </span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Game layout */
.game-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.game-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 24px;
  border-bottom: 1px solid var(--border-color);
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(4px);
  z-index: 10;
  flex-shrink: 0;
}
.bar-student {
  font-size: 0.85rem;
  color: var(--qz-red);
  font-weight: 600;
}
.bar-progress {
  font-size: 0.8rem;
  color: var(--qz-stone);
  background: var(--qz-stone-light, #f5f0eb);
  padding: 3px 12px;
  border-radius: 12px;
}

/* Game body: sidebar + content */
.game-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.game-sidebar {
  width: 320px;
  min-width: 320px;
  background: rgba(245, 240, 235, 0.85);
  backdrop-filter: blur(8px);
  border-right: 2px solid var(--qz-stone, #d4cbc0);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 12px;
}
.sidebar-title {
  text-align: center;
  font-size: 26px;
  font-weight: 700;
  color: var(--qz-red);
  padding: 14px 10px;
  margin-bottom: 10px;
  background: rgba(196, 58, 49, 0.08);
  border-radius: 10px;
  border: 1px solid rgba(196, 58, 49, 0.2);
}
.sidebar-map-container {
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}
.sidebar-map {
  width: 100%;
  height: auto;
  display: block;
  cursor: pointer;
  opacity: 1;
  transition: all 0.3s ease;
}
.map-markers {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}
.map-marker {
  position: absolute;
  width: 16px;
  height: 16px;
  background: var(--qz-red);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.2s ease;
  box-shadow: 0 0 0 3px rgba(255,255,255,0.95);
}
.map-marker:hover {
  transform: translate(-50%, -50%) scale(1.4);
  box-shadow: 0 0 0 5px rgba(255,255,255,0.95);
}
.map-marker.active {
  background: #2e7d32;
  box-shadow: 0 0 0 5px rgba(46, 125, 50, 0.4);
  transform: translate(-50%, -50%) scale(1.2);
}
.map-marker:nth-child(1) { top: 18.5%; left: 41.5%; }
.map-marker:nth-child(2) { top: 35.5%; left: 50.5%; }
.map-marker:nth-child(3) { top: 52.5%; left: 56.5%; }
.map-marker:nth-child(4) { top: 71.5%; left: 58.5%; }
.map-marker:nth-child(5) { top: 88.5%; left: 36.5%; }
.game-content {
  flex: 1;
  overflow-y: auto;
  min-width: 0;
  background-color: #f5f0eb;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  position: relative;
}
.game-content::before {
  content: '';
  position: fixed;
  top: 0;
  left: 320px;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.68);
  backdrop-filter: blur(3px);
  z-index: 1;
  pointer-events: none;
}
.page-container {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  padding: 20px;
}

.bg-transition-layer {
  position: fixed;
  top: 0;
  left: 320px;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
  transition: opacity 0.4s ease-in-out, transform 0.4s ease-in-out;
}

.game-content.transitioning .bg-transition-layer {
  opacity: 0.8;
  transform: scale(1.02);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.student-view {
  padding: 0 24px;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.view-title {
  margin: 0;
  color: var(--qz-dark);
}

.header-links {
  display: flex;
  gap: 12px;
}

.header-link {
  padding: 6px 16px;
  background: var(--qz-stone-light);
  border-radius: var(--radius-sm);
  color: var(--qz-dark);
  font-size: 0.85rem;
  text-decoration: none;
  transition: all 0.2s;
}

.header-link:hover {
  background: var(--qz-stone);
  color: var(--qz-red);
}

/* Entry card */
.entry-card {
  max-width: 460px;
  margin: 0 auto 24px;
  text-align: center;
}

.section-title {
  margin-bottom: 8px;
  color: var(--qz-red);
  font-size: 1.2rem;
}

.entry-desc {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.code-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 auto;
}

.code-input {
  flex: 1;
  padding: 14px 18px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 1.3rem;
  font-family: 'Courier New', monospace;
  font-weight: 700;
  letter-spacing: 4px;
  text-align: center;
  transition: border-color 0.2s;
}

.code-input:focus {
  outline: none;
  border-color: var(--qz-red);
}

.code-input::placeholder {
  font-size: 0.85rem;
  font-weight: 400;
  letter-spacing: 1px;
}

/* Session header */
.students-card {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.session-header {
  margin-bottom: 20px;
  text-align: center;
}

.session-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.session-info h3 {
  margin: 0;
}

.code-highlight {
  color: var(--qz-red);
  font-family: 'Courier New', monospace;
  letter-spacing: 4px;
}

.session-status {
  padding: 2px 12px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
}

.session-status.active {
  background: #E3F2FD;
  color: var(--qz-blue);
}

.session-status.locked {
  background: #FFF3E0;
  color: var(--warning);
}

.instruction {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.locked-instruction {
  color: var(--warning);
}

/* Success banner */
.success-banner {
  margin-bottom: 16px;
  padding: 12px 20px;
  background: #E8F5E9;
  border: 2px solid var(--success);
  border-radius: var(--radius-md);
  text-align: center;
  color: var(--success);
  font-weight: 600;
}

/* Student grid */
.student-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.student-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  border: 2px solid var(--border-color);
  background: var(--qz-stone-light);
  transition: all 0.2s;
  cursor: default;
}

.student-card.not-signed {
  cursor: pointer;
}

.student-card.not-signed:hover {
  border-color: var(--qz-red);
  background: white;
  transform: scale(1.03);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.student-card.signed-in {
  background: #E8F5E9;
  border-color: var(--success);
  opacity: 0.8;
  cursor: default;
}

.student-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--qz-red);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.signed-in .student-avatar {
  background: var(--success);
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.student-name {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--qz-dark);
  line-height: 1.3;
}

.signed-in .student-name {
  color: var(--success);
}

.status-hint {
  font-size: 0.7rem;
  color: var(--qz-stone);
}

.status-hint.signed {
  color: var(--success);
}

.status-hint.locked {
  color: var(--qz-stone-dark);
}

/* Error */
.error-msg {
  color: var(--error);
  font-size: 0.9rem;
  margin-top: 8px;
  text-align: center;
}
</style>
