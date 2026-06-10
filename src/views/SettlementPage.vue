<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  results: Array<{ stationName: string; stars: number; history?: number[] }>
}>()
const emit = defineEmits<{ navigate: [index: number]; restart: [] }>()

const expandedStation = ref(-1)
function toggleExpand(idx: number) {
  expandedStation.value = expandedStation.value === idx ? -1 : idx
}

const totalCoins = props.results.reduce((s, r) => s + r.stars, 0)
const allPassed = props.results.every(r => r.stars >= 1)
const visible = ref(false)
const trophyVisible = ref(false)
const coins = ref<Array<{ id: number; x: number; y: number; rotation: number; scale: number; delay: number }>>([])
const coinsFallen = ref(false)

interface Coin {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  rotationSpeed: number
  scale: number
  settled: boolean
}

const physicsCoins = ref<Coin[]>([])
let animationFrame: number | null = null

function initCoins() {
  const coinCount = totalCoins
  physicsCoins.value = Array.from({ length: coinCount }, (_, i) => ({
    id: i,
    x: Math.random() * 200 - 100,
    y: -100 - Math.random() * 200,
    vx: (Math.random() - 0.5) * 8,
    vy: Math.random() * 2 + 1,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 12,
    scale: 0.7 + Math.random() * 0.5,
    settled: false
  }))
}

function animate() {
  const gravity = 0.5
  const bounce = 0.6
  const friction = 0.98
  const groundY = 80
  
  let allSettled = true
  
  physicsCoins.value.forEach(coin => {
    if (!coin.settled) {
      allSettled = false
      
      coin.vy += gravity
      coin.x += coin.vx
      coin.y += coin.vy
      coin.vx *= friction
      coin.vy *= friction
      coin.rotation += coin.rotationSpeed
      
      if (coin.y >= groundY) {
        coin.y = groundY
        coin.vy = -coin.vy * bounce
        coin.vx *= bounce
        
        if (Math.abs(coin.vy) < 0.5 && Math.abs(coin.vx) < 0.3) {
          coin.settled = true
          coin.vy = 0
          coin.vx = 0
        }
      }
    }
  })
  
  coins.value = physicsCoins.value.map(c => ({
    id: c.id,
    x: c.x,
    y: c.y,
    rotation: c.rotation,
    scale: c.scale,
    delay: c.id * 50
  }))
  
  if (!allSettled) {
    animationFrame = requestAnimationFrame(animate)
  } else {
    coinsFallen.value = true
  }
}

onMounted(() => {
  setTimeout(() => { visible.value = true }, 100)
  setTimeout(() => { trophyVisible.value = true }, 800)
  setTimeout(() => {
    initCoins()
    animate()
  }, 1200)
})

onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
})

const stationIcons: Record<string, string> = {
  '泉州港': '🏮',
  '广州驿': '🏯',
  '交趾驿': '🏛',
  '马六甲驿': '🕌',
  '波斯湾': '🏰',
}
</script>

<template>
  <div class="settlement-page" :class="{ visible }">
    <!-- Falling Coins Container -->
    <div class="coins-container">
      <div
        v-for="coin in coins"
        :key="coin.id"
        class="falling-coin"
        :style="{
          '--x': coin.x + 'px',
          '--y': coin.y + 'px',
          '--rotation': coin.rotation + 'deg',
          '--scale': coin.scale
        }"
      >
        🪙
      </div>
    </div>

    <!-- Trophy -->
    <div class="trophy-area" :class="{ visible: trophyVisible }">
      <div class="trophy">🏆</div>
      <div class="trophy-glow"></div>
    </div>

    <!-- Title -->
    <h1 class="settlement-title">📜 航海日志 · 五站结算</h1>
    <p class="congrats-text">
      {{ allPassed ? '恭喜你完成了海上丝绸之路的密信守护之旅！' : '你已经完成了所有关卡的挑战！' }}
    </p>

    <!-- Coins Summary -->
    <div class="coins-total" :class="{ fallen: coinsFallen }">
      <div class="coins-display">
        <span v-for="i in 25" :key="i" :class="['coin-emoji', i <= totalCoins ? '' : 'empty']">🪙</span>
      </div>
      <span class="total-text">{{ totalCoins }} / 25 枚金币</span>
    </div>

    <!-- Log Table -->
    <div class="log-table">
      <div v-for="(r, i) in results" :key="i" class="log-group">
        <div
          class="log-row"
          :style="{ animationDelay: (0.3 + i * 0.15) + 's' }"
          @click="toggleExpand(i)"
          title="点击查看历史记录"
        >
          <span class="log-icon">{{ stationIcons[r.stationName] || '📍' }}</span>
          <span class="log-station">{{ r.stationName }}</span>
          <span class="log-best" v-if="r.history && r.history.length > 1">最高</span>
          <span class="log-coins">
            <span v-for="j in r.stars" :key="j" class="coin-emoji small">🪙</span>
          </span>
          <span class="log-check">✅</span>
          <span class="log-arrow" :class="{ open: expandedStation === i }">▶</span>
        </div>
        <!-- 历史记录展开 -->
        <div v-if="expandedStation === i && r.history && r.history.length > 0" class="log-history">
          <div class="history-title">📋 作答记录（取最高分）</div>
          <div v-for="(score, hi) in r.history" :key="hi" class="history-row">
            <span class="history-num">第{{ hi + 1 }}次</span>
            <span class="history-stars">
              <span v-for="j in score" :key="j" class="coin-emoji small">🪙</span>
              <span v-if="score === 0" style="color:#ccc">0 星</span>
            </span>
            <span v-if="score === Math.max(...(r.history || [0]))" class="history-best">🏆 最高</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 重新作答 + 跳转按钮 -->
    <div class="settlement-actions">
      <button class="restart-btn" @click="emit('restart')">🔄 重新作答</button>
      <p class="restart-hint">重新作答不会清空历史记录，系统将保留最高分</p>
    </div>

    <!-- Award -->
    <div class="award-card" :class="{ visible: trophyVisible }">
      <div class="award-seal">📜</div>
      <div class="award-content">
        <div class="award-label">商队总长授予</div>
        <div class="award-title">海上丝路密信使</div>
        <div class="award-subtitle">{{ props.results[0]?.stationName ? '五站通关，密信守护使命达成' : '密信守护者' }}</div>
      </div>
    </div>

    <!-- Final Quote -->
    <blockquote class="final-quote">
      "千年来烽火台倒了，密码棒朽了，凯撒密码也早就被破解了——但人类想要安全地传递信息的心，从来没有变过。你今天学会的，是这份传承了几千年的安全智慧。"
    </blockquote>

  </div>
</template>

<style scoped>
.settlement-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 32px 24px 64px;
  text-align: center;
  opacity: 0;
  transition: opacity 0.8s;
  position: relative;
}
.settlement-page.visible { opacity: 1; }

/* Falling Coins */
.coins-container {
  position: absolute;
  top: 0;
  left: 50%;
  width: 300px;
  height: 200px;
  transform: translateX(-50%);
  pointer-events: none;
  overflow: visible;
}
.falling-coin {
  position: absolute;
  left: 50%;
  top: 0;
  font-size: 1.8rem;
  transform: translate(calc(-50% + var(--x)), var(--y)) rotate(var(--rotation)) scale(var(--scale));
  transition: transform 0.05s linear;
  filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.2));
}

/* Trophy */
.trophy-area {
  position: relative;
  display: inline-block;
  margin-bottom: 8px;
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}
.trophy-area.visible {
  opacity: 1;
  transform: scale(1);
}
.trophy {
  font-size: 5rem;
  animation: bounce 2s ease-in-out infinite;
  position: relative;
  z-index: 1;
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.trophy-glow {
  position: absolute;
  top: 50%; left: 50%;
  width: 120px; height: 120px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(230, 180, 34, 0.3), transparent 70%);
  border-radius: 50%;
  animation: glowPulse 2s ease-in-out infinite;
}
@keyframes glowPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.8; }
}

.settlement-title {
  font-size: 1.5rem;
  color: var(--qz-dark);
  margin: 16px 0 8px;
}
.congrats-text {
  color: var(--qz-stone);
  font-size: 0.95rem;
  margin-bottom: 20px;
}

.coins-total {
  margin-bottom: 24px;
  transition: all 0.5s;
}
.coins-total.fallen {
  transform: translateY(0);
}
.coins-display {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  margin-bottom: 8px;
}
.coin-emoji {
  font-size: 1.5rem;
  transition: all 0.3s;
}
.coin-emoji.empty {
  filter: grayscale(100%);
  opacity: 0.4;
}
.coin-emoji.small {
  font-size: 1rem;
}
.coin-emoji.small.empty {
  filter: grayscale(100%);
  opacity: 0.4;
}
.total-text {
  font-size: 1rem;
  font-weight: 600;
  color: var(--qz-dark);
}

/* Log Table */
.log-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 28px;
}
.log-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e0d5c8;
  border-radius: 10px;
  animation: fadeIn 0.4s ease both;
  cursor: pointer;
  transition: all 0.25s;
}
.log-row:hover {
  border-color: var(--qz-red, #c43a31);
  background: rgba(196,58,49,.04);
  transform: translateX(4px);
}
.log-arrow {
  font-size: 0.8rem;
  color: #ccc;
  transition: color 0.25s;
}
.log-row:hover .log-arrow {
  color: var(--qz-red, #c43a31);
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.log-icon { font-size: 1.2rem; }
.log-station {
  flex: 1;
  text-align: left;
  font-weight: 600;
  color: var(--qz-dark);
}
.log-coins {
  display: flex;
  gap: 2px;
}
.log-check { font-size: 1.1rem; }

/* Award */
.award-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #FFF8E1, #FFE082);
  border: 2px solid var(--qz-gold, #e6b422);
  border-radius: 14px;
  margin-bottom: 20px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s 0.5s;
}
.award-card.visible {
  opacity: 1;
  transform: translateY(0);
}
.award-seal { font-size: 2.4rem; }
.award-content { text-align: left; }
.award-label { font-size: 0.75rem; color: #8c7c6b; margin-bottom: 2px; }
.award-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #5a2e1f;
  margin-bottom: 2px;
}
.award-subtitle { font-size: 0.8rem; color: #8c7c6b; }

.final-quote {
  margin: 0 0 24px;
  padding: 16px 20px;
  background: rgba(196, 58, 49, 0.04);
  border-left: 3px solid var(--qz-red);
  border-radius: 0 8px 8px 0;
  font-style: italic;
  color: #4a3020;
  font-size: 0.9rem;
  line-height: 1.7;
  text-align: left;
}

.restart-btn {
  padding: 14px 36px;
  background: white;
  border: 2px solid var(--qz-red);
  color: var(--qz-red);
  border-radius: 50px;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.3s;
}
.restart-btn:hover {
  background: var(--qz-red);
  color: white;
}
.settlement-actions {
  margin-top: 8px;
  margin-bottom: 20px;
}
.restart-hint {
  font-size: 0.8rem; color: var(--qz-stone); margin-top: 8px;
}

/* 历史记录 */
.log-group { display: flex; flex-direction: column; }
.log-best {
  font-size: 0.7rem; background: #FFD54F; color: #5a2e1f;
  padding: 2px 8px; border-radius: 10px; font-weight: 700;
}
.log-arrow.open { transform: rotate(90deg); }
.log-history {
  background: #fdfaf5; border: 1px solid #e0d5c8; border-top: none;
  border-radius: 0 0 10px 10px; padding: 12px 16px; margin-top: -2px;
}
.history-title { font-size: 0.8rem; color: var(--qz-stone); margin-bottom: 8px; }
.history-row {
  display: flex; align-items: center; gap: 10px; padding: 4px 0;
  font-size: 0.9rem;
}
.history-num { color: var(--qz-stone); min-width: 56px; }
.history-stars { display: flex; gap: 2px; }
.history-best { font-size: 0.75rem; color: #F9A825; font-weight: 700; }
</style>