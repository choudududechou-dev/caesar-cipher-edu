<script setup lang="ts">
defineProps<{ studentName: string }>()
const emit = defineEmits<{ start: [] }>()
</script>

<template>
  <div class="welcome-page">
    <div class="welcome-scroll">
      <div class="scroll-header">
        <span class="scroll-seal">🔐</span>
        <h1 class="welcome-title">密信大使的召唤</h1>
      </div>

      <div class="greeting">
        <span class="greeting-icon">👋</span>
        <p>欢迎你，<strong class="student-name">{{ studentName }}</strong>！</p>
      </div>

      <div class="context-text">
        <p>宋元时期，泉州（古称<strong>刺桐</strong>）是世界上最繁华的港口之一。满载丝绸、瓷器、香料的商船从这里出发，驶向遥远的波斯湾。</p>
      </div>

      <div class="guide-text">
        <p>今天，你将坐着时光机来到宋元时期的商船上，从泉州港出发一路上要经过四个重要驿站——<strong>广州驿、交趾驿、马六甲驿、波斯湾驿</strong>。在这次特殊的航海之旅上，密信大使会带你学习一种古老的加密方法。学会加密，守护商队，准备好了吗？让我们一起扬帆起航！</p>
      </div>

      <div class="route-map">
        <div class="route-stops">
          <span class="stop">🏮 泉州港</span>
          <span class="route-arrow">→</span>
          <span class="stop">🏯 广州驿</span>
          <span class="route-arrow">→</span>
          <span class="stop">🏛 交趾驿</span>
          <span class="route-arrow">→</span>
          <span class="stop">🕌 马六甲驿</span>
          <span class="route-arrow">→</span>
          <span class="stop">🏰 波斯湾</span>
        </div>
      </div>

      <button class="start-btn" @click="emit('start')">
        <span class="btn-text">⛵ 扬帆起航</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.welcome-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}

.welcome-scroll {
  background: linear-gradient(180deg, #FEF9F0 0%, #FDF5E6 50%, #FEF9F0 100%);
  border: 2px solid #d4c0a0;
  border-radius: 16px;
  padding: 40px 32px;
  box-shadow: 0 4px 20px rgba(139, 90, 43, 0.12), inset 0 0 60px rgba(212, 192, 160, 0.15);
  position: relative;
}
.welcome-scroll::before, .welcome-scroll::after {
  content: '';
  position: absolute;
  left: 20px; right: 20px;
  height: 2px;
  background: repeating-linear-gradient(90deg, #c4a87c 0px, #c4a87c 4px, transparent 4px, transparent 8px);
}
.welcome-scroll::before { top: 14px; }
.welcome-scroll::after { bottom: 14px; }

.scroll-header {
  text-align: center;
  margin-bottom: 24px;
}
.scroll-seal {
  font-size: 2.4rem;
  display: block;
  margin-bottom: 8px;
}
.welcome-title {
  font-size: 1.6rem;
  color: #5a2e1f;
  margin: 0;
}

.greeting {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 12px 18px;
  background: rgba(196, 58, 49, 0.08);
  border-radius: 10px;
  font-size: 1.05rem;
}
.greeting-icon { font-size: 1.5rem; }
.greeting p { margin: 0; color: var(--qz-dark, #3b3b3b); }
.student-name { color: var(--qz-red, #c43a31); font-size: 1.1rem; }

.guide-text {
  margin-bottom: 16px;
  padding: 16px 18px;
  background: rgba(196, 58, 49, 0.04);
  border-left: 3px solid var(--qz-red, #c43a31);
  border-radius: 0 8px 8px 0;
  font-style: italic;
  color: #4a3020;
}
.guide-text p {
  margin: 0 0 8px;
  line-height: 1.9;
  font-size: 0.95rem;
}
.guide-text p:last-child { margin-bottom: 0; }

.context-text {
  margin-bottom: 20px;
}
.context-text p {
  margin: 0 0 8px;
  line-height: 1.8;
  font-size: 0.9rem;
  color: #6b5a4a;
}

.route-map {
  margin-bottom: 28px;
  padding: 16px;
  background: rgba(212, 192, 160, 0.2);
  border-radius: 10px;
  text-align: center;
}
.route-stops {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 0.85rem;
}
.stop {
  padding: 4px 10px;
  background: white;
  border-radius: 12px;
  font-weight: 600;
  color: var(--qz-dark);
}
.route-arrow {
  color: var(--qz-red);
  font-weight: 700;
  font-size: 0.9rem;
}

.start-btn {
  display: block;
  margin: 0 auto;
  padding: 16px 48px;
  background: linear-gradient(135deg, var(--qz-red, #c43a31), #a8322a);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1.25rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  font-family: inherit;
  box-shadow: 0 4px 14px rgba(196, 58, 49, 0.35);
}
.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(196, 58, 49, 0.5);
}
.start-btn:active { transform: translateY(0); }
.btn-text { letter-spacing: 2px; }
</style>
