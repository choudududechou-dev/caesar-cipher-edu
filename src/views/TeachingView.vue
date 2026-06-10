<script setup lang="ts">
import { useTeachingStore } from '@/stores/teaching'
import { ref, computed, onMounted } from 'vue'
import VideoEmbed from '@/components/common/VideoEmbed.vue'
import ImageCarousel from '@/components/common/ImageCarousel.vue'
import CipherFlowchart from '@/components/cipher/CipherFlowchart.vue'

import StripCipher from '@/components/cipher/StripCipher.vue'
import ExercisePanel from '@/components/exercises/ExercisePanel.vue'
import CryptoTimeline from '@/components/timeline/CryptoTimeline.vue'
import Sim2FA from '@/components/modern/Sim2FA.vue'
import CaptchaDemo from '@/components/modern/CaptchaDemo.vue'
import ContestRoom from '@/components/contest/ContestRoom.vue'
import MindMap from '@/components/mindmap/MindMap.vue'

const store = useTeachingStore()

const currentComponent = computed(() => {
  const map: Record<string, any> = {
    'intro': 'intro-section',
    'life-password': 'life-password-section',
    'principle': 'principle-section',
    'cipher-disk': 'cipher-disk-section',
    'strip-cipher': 'strip-cipher-section',
    'exercises': 'exercises-section',
    'evolution': 'evolution-section',
    'contest': 'contest-section',
    'review': 'review-section',
  }
  return map[store.currentSection] || 'intro-section'
})

// --- Dynamic content from API ---
const sectionsWithContent = ['intro','life-password','principle','cipher-disk','strip-cipher','exercises','evolution','review']
const contentMap = ref<Record<string, string>>({})

async function loadAllContent() {
  for (const key of sectionsWithContent) {
    try {
      const r = await fetch(`/api/content/${key}`)
      if (r.ok) {
        const d = await r.json()
        contentMap.value[key] = d.body || ''
      }
    } catch { /* keep default */ }
  }
}
onMounted(loadAllContent)

function htmlOf(key: string): string {
  return contentMap.value[key] || ''
}

const lifePasswordImages = [
  { url: '📱', caption: '手机解锁密码——保护个人隐私' },
  { url: '💳', caption: '微信/支付宝支付——资金安全' },
  { url: '📶', caption: 'WiFi密码——网络安全' },
  { url: '📦', caption: '快递取件码——物品安全' },
  { url: '🏦', caption: '银行卡密码——财产安全' },
]
</script>

<template>
  <div class="teaching-view">
    <!-- Left Sidebar Navigation -->
    <aside class="section-sidebar">
      <div class="sidebar-title">📖 教学环节</div>
      <div
        v-for="(s, i) in store.sections"
        :key="s.id"
        class="sidebar-item"
        :class="{ active: store.currentSection === s.id }"
        @click="store.setSection(s.id)"
      >
        <img
          :src="`/images/nav-${['quanzhou','guangzhou','jiaozhi','malai','bosi'][i] || 'quanzhou'}.png`"
          :alt="s.title"
          class="sidebar-img"
        />
      </div>
    </aside>

    <!-- Main Content -->
    <main class="section-main">

    <!-- ===== 1. 情境导入 ===== -->
    <section v-if="currentComponent === 'intro-section'" class="teaching-section">
      <div class="section-header">
        <h2>🏮 情境导入：刺桐港的密信</h2>
        <span class="section-time">⏱ 约5分钟</span>
      </div>

      <VideoEmbed
        title="泉州海丝贸易与信息传递"
        placeholder="宋元刺桐港商船出海场景"
      />

      <div v-if="htmlOf('intro')" class="content-block" v-html="htmlOf('intro')"></div>
      <div v-else class="content-block">
        <p>宋元时期，泉州（古称<strong>刺桐港</strong>）是世界上最繁华的港口之一，被誉为"东方第一大港"。</p>
        <p>满载丝绸、瓷器的商船从这里出发，沿着<strong>海上丝绸之路</strong>驶向遥远的阿拉伯、波斯和东非。</p>
        <p>船队需要传递<strong>机密信息</strong>——货物清单、航线计划、贸易价格——这些信息如果落入海盗或竞争对手之手，将带来巨大损失。</p>
      </div>

      <div class="think-box">
        <h4>🤔 想一想</h4>
        <p>如果你是船长，在无法亲自见面的情况下，如何确保传递的信息<strong>只有你的贸易伙伴能看懂</strong>，而其他人即使拿到了也看不懂？</p>
      </div>

      <div class="qz-banner">
        <span class="qz-icon">🏮</span>
        <div>
          <strong>泉州·刺桐港</strong>
          <p>宋元中国的世界海洋商贸中心——2021年列入联合国教科文组织世界遗产名录，共22处遗产点。</p>
        </div>
      </div>
    </section>

    <!-- ===== 2. 生活中的密码 ===== -->
    <section v-if="currentComponent === 'life-password-section'" class="teaching-section">
      <div class="section-header">
        <h2>🔍 生活中的密码</h2>
        <span class="section-time">⏱ 约3分钟</span>
      </div>

      <ImageCarousel :images="lifePasswordImages" :interval="2500" />

      <div v-if="htmlOf('life-password')" class="content-block" v-html="htmlOf('life-password')"></div>
      <div v-else class="content-block">
        <p>密码在我们的生活中<strong>无处不在</strong>：</p>
        <ul>
          <li>📱 <strong>手机解锁</strong>——保护个人隐私</li>
          <li>💳 <strong>微信/支付宝支付</strong>——保护资金安全</li>
          <li>📶 <strong>WiFi密码</strong>——保护网络安全</li>
          <li>📦 <strong>快递取件码</strong>——确保物品不被冒领</li>
          <li>🎮 <strong>游戏账号密码</strong>——保护虚拟财产</li>
        </ul>
      </div>

      <div class="think-box">
        <h4>🤔 想一想</h4>
        <p>这些"密码"有什么共同点？密码的<strong>本质</strong>是什么？</p>
        <p class="answer-hint">→ 密码的本质：<strong>将信息从一种形式转换为另一种形式</strong>，使得只有知道转换规则的人才能还原信息。</p>
      </div>
    </section>

    <!-- ===== 3. 凯撒密码原理 ===== -->
    <section v-if="currentComponent === 'principle-section'" class="teaching-section">
      <div class="section-header">
        <h2>📐 凯撒密码的原理</h2>
        <span class="section-time">⏱ 约5分钟</span>
      </div>

      <div v-if="htmlOf('principle')" class="content-block" v-html="htmlOf('principle')"></div>
      <div v-else class="content-block">
        <h3>什么是凯撒密码？</h3>
        <p>凯撒密码（Caesar Cipher）是<strong>最古老</strong>的加密方法之一，由古罗马的<strong>凯撒大帝</strong>发明，用于传递军事机密。</p>
        <p>它的原理很简单：将字母表中的每个字母，按照固定的位数<strong>向后移动</strong>。</p>
      </div>

      <div class="example-box">
        <h4>📝 举例（偏移量 k=3）</h4>
        <div class="cipher-demo">
          <div class="demo-row">
            <span class="demo-label">明文（原文）：</span>
            <span class="demo-letters">A B C D E F G H I J K L M N O P Q R S T U V W X Y Z</span>
          </div>
          <div class="demo-row">
            <span class="demo-label">密文（加密后）：</span>
            <span class="demo-letters encrypted">D E F G H I J K L M N O P Q R S T U V W X Y Z A B C</span>
          </div>
        </div>
        <p class="demo-note">A→D, B→E, C→F, ..., X→A, Y→B, Z→C</p>
      </div>

      <CipherFlowchart />

      <div class="qz-banner qz-banner-light" style="background: #FFF0EB;">
        <span class="qz-icon">🧱</span>
        <div>
          <strong>闽南建筑"出砖入石"</strong>
          <p>泉州古建筑中砖石交错排列——明文到密文的一一对应，就像砖石交错形成的独特图案！</p>
        </div>
      </div>
    </section>

    <!-- ===== 4. 凯撒密码盘交互 ===== -->
    <section v-if="currentComponent === 'cipher-disk-section'" class="teaching-section">
      <div class="section-header">
        <h2>🎯 动手探究：凯撒密码盘</h2>
        <span class="section-time">⏱ 约8分钟</span>
      </div>

      <div v-if="htmlOf('cipher-disk')" class="content-block" v-html="htmlOf('cipher-disk')"></div>
      <div v-else class="content-block">
        <p>现在，请操作下方密码盘：<strong>拖动内圈旋转</strong>来改变偏移量，观察字母对应关系的变化！</p>
        <ul>
          <li>🔴 内圈字母A为<strong>红色</strong>，作为参照标记</li>
          <li>🖱 <strong>拖拽内圈旋转</strong> / 滚轮 / 拖动滑块来改变偏移量</li>
          <li>⌨ 在输入框中输入文字，观察实时加密/解密结果</li>
        </ul>
      </div>

      <div class="iframe-disk-wrapper">
        <iframe
          src="/embed/caesar-disk.html"
          class="cipher-disk-iframe"
          title="凯撒密码盘"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      <div class="think-box">
        <h4>🤔 探究任务</h4>
        <ol>
          <li>偏移量k=3时，你的名字首字母会被加密成什么？</li>
          <li>如果k=26，加密结果是什么？（提示：26 mod 26 = 0）</li>
          <li>加密和解密有什么关系？</li>
        </ol>
      </div>
    </section>

    <!-- ===== 5. 纸条式密码盘 ===== -->
    <section v-if="currentComponent === 'strip-cipher-section'" class="teaching-section">
      <div class="section-header">
        <h2>📏 纸条式凯撒密码</h2>
        <span class="section-time">⏱ 约6分钟</span>
      </div>

      <div v-if="htmlOf('strip-cipher')" class="content-block" v-html="htmlOf('strip-cipher')"></div>
      <div v-else class="content-block">
        <p>这是另一种理解凯撒密码的方式——<strong>纸条式密码</strong>：</p>
        <ul>
          <li>上面一行是固定不动的字母表</li>
          <li>下面一行可以<strong>左右拖动</strong>，两端循环显示</li>
          <li>将鼠标悬停在字母上查看对应关系</li>
        </ul>
      </div>

      <StripCipher />

      <div class="think-box">
        <h4>🤔 对比思考</h4>
        <p>密码盘（圆形）和纸条式（直线形）哪种方式你更喜欢？它们各有什么优缺点？</p>
      </div>
    </section>

    <!-- ===== 6. 加密解密实战 ===== -->
    <section v-if="currentComponent === 'exercises-section'" class="teaching-section">
      <div class="section-header">
        <h2>✏️ 加密解密实战</h2>
        <span class="section-time">⏱ 约5分钟</span>
      </div>

      <div v-if="htmlOf('exercises')" class="content-block" v-html="htmlOf('exercises')"></div>
      <div v-else class="content-block">
        <p>选择不同的练习模式，检验你的学习成果！</p>
      </div>

      <ExercisePanel />

      <div class="bruteforce-info">
        <h4>🔓 暴力破解（知识拓展）</h4>
        <p>如果不知道偏移量k，我们可以尝试<strong>穷举所有可能</strong>（k=1到25），找出有意义的明文。因为英文字母只有26个，偏移量最多只有25种可能，计算机可以在瞬间完成。</p>
        <p>这就是为什么凯撒密码在现代<strong>不够安全</strong>——密钥空间太小！但这正是密码学的起点。</p>
      </div>
    </section>

    <!-- ===== 7. 密码进化与现代应用 ===== -->
    <section v-if="currentComponent === 'evolution-section'" class="teaching-section">
      <div class="section-header">
        <h2>📈 密码进化史 & 现代应用</h2>
        <span class="section-time">⏱ 约8分钟</span>
      </div>

      <div v-if="htmlOf('evolution')" class="content-block" v-html="htmlOf('evolution')"></div>
      <div v-else class="content-block">
        <p>凯撒密码只是密码学的<strong>起点</strong>。两千多年来，人类保护信息的智慧一直在进化。</p>
      </div>

      <CryptoTimeline />

      <div class="divider" />

      <div class="content-block">
        <h3>🔐 现代密码的两大方向</h3>
        <div class="compare-cards">
          <div class="compare-card card">
            <h4>内容加密</h4>
            <p>像凯撒密码一样，直接对<strong>信息本身</strong>进行加密转换。</p>
            <p class="example">例子：AES文件加密、加密聊天</p>
          </div>
          <div class="compare-card card">
            <h4>访问权限加密</h4>
            <p>信息本身不加密，但验证<strong>你是谁</strong>，只有通过验证的人才能访问。</p>
            <p class="example">例子：手机密码、人脸识别</p>
          </div>
        </div>
      </div>

      <div class="divider" />

      <h3>📱 二次验证（2FA）模拟体验</h3>
      <Sim2FA />

      <div class="divider" />

      <h3>🤖 真人验证（CAPTCHA）体验</h3>
      <CaptchaDemo />
    </section>

    <!-- ===== 8. 密码挑战赛 ===== -->
    <section v-if="currentComponent === 'contest-section'" class="teaching-section">
      <div class="section-header">
        <h2>🏆 密码挑战赛</h2>
        <span class="section-time">⏱ 约5分钟</span>
      </div>

      <div class="content-block">
        <p>输入老师分享的房间号，与同学们比拼解密能力！</p>
      </div>

      <ContestRoom />
    </section>

    <!-- ===== 9. 知识回顾 ===== -->
    <section v-if="currentComponent === 'review-section'" class="teaching-section">
      <div class="section-header">
        <h2>🧠 知识回顾</h2>
        <span class="section-time">⏱ 约3分钟</span>
      </div>

      <MindMap />

      <div class="summary-box">
        <h4>📝 今天你学到了什么？</h4>
        <p>请用1-2句话总结你今天最大的收获：</p>
        <textarea class="summary-input" placeholder="我今天学到了..."></textarea>
      </div>

      <div v-if="htmlOf('review')" class="qz-banner" v-html="htmlOf('review')"></div>
      <div v-else class="qz-banner">
        <span class="qz-icon">⛵</span>
        <div>
          <strong>从刺桐港到数字时代</strong>
          <p>两千年前，凯撒用密码保护军事机密；一千年前，泉州商人用智慧保护贸易信息；今天，密码守护着我们的数字生活。加密技术是人类保护信息的智慧结晶，也是计算思维的重要体现。</p>
        </div>
      </div>
    </section>
    </main>
  </div>
</template>

<style scoped>
.teaching-view {
  display: flex;
  gap: 0;
  min-height: calc(100vh - 60px);
}

/* Section Sidebar */
.section-sidebar {
  width: 180px;
  min-width: 180px;
  background: var(--qz-stone-light, #f5f0eb);
  border-right: 1px solid var(--qz-stone, #d4cbc0);
  padding: 16px 0;
  position: sticky;
  top: 48px;
  height: fit-content;
  max-height: calc(100vh - 60px);
  overflow-y: auto;
}
.sidebar-title {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--qz-red);
  padding: 8px 16px 12px;
  border-bottom: 1px solid var(--qz-stone, #d4cbc0);
  margin-bottom: 8px;
}
.sidebar-item {
  padding: 10px 8px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
  text-align: center;
}
.sidebar-item:hover {
  background: rgba(196, 58, 49, 0.06);
}
.sidebar-item.active {
  background: rgba(196, 58, 49, 0.1);
  border-left-color: var(--qz-red);
}
.sidebar-img {
  width: 100%;
  max-width: 150px;
  height: auto;
  display: block;
  margin: 0 auto;
  border-radius: 4px;
}

/* Section Main */
.section-main {
  flex: 1;
  min-width: 0;
  padding: 16px 24px 64px;
}

/* Section */
.teaching-section {
  animation: slideIn 0.3s ease;
}
@keyframes slideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.section-header h2 {
  margin: 0;
}
.section-time {
  font-size: 0.85rem;
  color: var(--text-secondary);
  background: var(--qz-stone-light);
  padding: 4px 12px;
  border-radius: 16px;
}

/* Content */
.content-block {
  margin: 16px 0;
  line-height: 1.9;
}
.content-block h3 {
  margin-bottom: 12px;
  color: var(--qz-red);
}
.content-block p {
  margin-bottom: 8px;
}
.content-block ul, .content-block ol {
  margin-left: 20px;
  margin-bottom: 12px;
}
.content-block li {
  margin-bottom: 6px;
  line-height: 1.8;
}

/* Think Box */
.think-box {
  margin: 20px 0;
  padding: 20px 24px;
  background: linear-gradient(135deg, #FFF8E1, #FFFDE7);
  border: 2px solid var(--qz-gold);
  border-radius: var(--radius-lg);
}
.think-box h4 {
  color: var(--qz-dark);
  margin-bottom: 8px;
}
.think-box p {
  margin-bottom: 6px;
}
.think-box ol {
  margin-left: 20px;
}
.think-box .answer-hint {
  color: var(--qz-red);
  font-weight: 500;
}

/* Example Box */
.example-box {
  margin: 20px 0;
  padding: 20px 24px;
  background: white;
  border: 2px solid var(--qz-blue-light);
  border-radius: var(--radius-lg);
}
.example-box h4 {
  margin-bottom: 12px;
}
.cipher-demo {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.demo-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.demo-label {
  font-weight: 600;
  font-size: 0.9rem;
  min-width: 120px;
}
.demo-letters {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  letter-spacing: 3px;
}
.demo-letters.encrypted {
  color: var(--qz-red);
  font-weight: 700;
}
.demo-note {
  margin-top: 8px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
}

/* Quanzhou Banner */
.qz-banner {
  margin: 20px 0;
  padding: 16px 20px;
  background: linear-gradient(135deg, #3D1F14, #5A2E1F);
  color: white;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.qz-banner .qz-icon {
  font-size: 2rem;
  flex-shrink: 0;
}
.qz-banner strong {
  display: block;
  margin-bottom: 4px;
}
.qz-banner p {
  font-size: 0.85rem;
  opacity: 0.9;
  line-height: 1.6;
  margin: 0;
}
.qz-banner-light {
  color: #2C2C2C;
}
.qz-banner-light strong {
  color: #2C2C2C;
}
.qz-banner-light {
  background: #FFF0EB !important;
  color: #2C2C2C !important;
}
.qz-banner-light strong {
  color: #2C2C2C;
}
.qz-banner-light p {
  color: #2C2C2C;
  opacity: 1;
}

/* iframe cipher disk */
.iframe-disk-wrapper {
  margin: 16px 0;
  width: 100%;
  height: 620px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: #000;
}
.cipher-disk-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* Divider */
.divider {
  height: 2px;
  background: var(--qz-stone);
  margin: 32px 0;
}

/* Compare Cards */
.compare-cards {
  display: flex;
  gap: 16px;
  margin: 16px 0;
}
.compare-card {
  flex: 1;
}
.compare-card h4 {
  color: var(--qz-red);
  margin-bottom: 8px;
}
.compare-card .example {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-style: italic;
}

/* Bruteforce Info */
.bruteforce-info {
  margin: 20px 0;
  padding: 20px 24px;
  background: var(--qz-stone-light);
  border-radius: var(--radius-lg);
  border-left: 4px solid var(--qz-blue);
}
.bruteforce-info h4 {
  margin-bottom: 8px;
}
.bruteforce-info p {
  font-size: 0.9rem;
  line-height: 1.8;
}

/* Summary */
.summary-box {
  margin: 20px 0;
  padding: 20px 24px;
  background: white;
  border: 2px solid var(--qz-red);
  border-radius: var(--radius-lg);
}
.summary-box h4 {
  margin-bottom: 8px;
}
.summary-box p {
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.summary-input {
  width: 100%;
  height: 80px;
  padding: 12px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
}
.summary-input:focus {
  outline: none;
  border-color: var(--qz-red);
}
</style>
