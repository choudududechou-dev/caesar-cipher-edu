<script setup lang="ts">
import { ref } from 'vue'

interface TimelineNode {
  id: string
  year: string
  title: string
  description: string
  icon: string
  detail: string
}

const nodes = ref<TimelineNode[]>([
  {
    id: 'caesar',
    year: '约公元前100年',
    title: '凯撒密码',
    description: '古罗马凯撒大帝用于军事通信的替换密码。每个字母按字母表向后移动固定位数。',
    icon: '🏛️',
    detail: '凯撒密码是最早的军事密码之一。凯撒大帝将机密军令中的每个字母向后移动3位，即使信使被俘，敌人也无法读懂内容。数学表达为 E(x) = (x + k) mod 26。虽然简单，但开创了密码学的先河。<br><img src="https://neeko-copilot.bytedance.net/api/text2image?prompt=ancient%20roman%20caesar%20cipher%20military%20scroll&size=landscape_4_3" alt="凯撒密码" class="timeline-image" />',
  },
  {
    id: 'vigenere',
    year: '1586年',
    title: '维吉尼亚密码',
    description: '法国外交官维吉尼亚发明，使用关键词控制多重凯撒位移，一度被认为是不可破解的密码。',
    icon: '📜',
    detail: '维吉尼亚密码使用一个关键词来决定每个字母的偏移量。例如关键词为"KEY"，则第一个字母用K的偏移量，第二个用E的偏移量，第三个用Y的偏移量，循环往复。这使得频率分析变得困难，在300多年间被认为是"不可破译的密码"。<br><img src="https://neeko-copilot.bytedance.net/api/text2image?prompt=vintage%20vigenere%20cipher%20secret%20code&size=landscape_4_3" alt="维吉尼亚密码" class="timeline-image" />',
  },
  {
    id: 'haomi',
    year: '1930年代',
    title: '豪密（周恩来密码）',
    description: '中国共产党在革命战争时期使用的密码体系，由周恩来主导设计，为中国革命胜利做出重要贡献。',
    icon: '⭐',
    detail: '"豪密"得名于周恩来化名"伍豪"。这是中国共产党自主研发的密码体系，采用双层加密技术：先对汉字进行编码，再进行移位变换。豪密在抗日战争和解放战争中发挥了至关重要的作用，保障了党的秘密通信安全，是中国密码学史上的重要里程碑。<br><img src="https://neeko-copilot.bytedance.net/api/text2image?prompt=chinese%20secret%20code%20cipher%20document&size=landscape_4_3" alt="豪密" class="timeline-image" />',
  },
  {
    id: 'enigma',
    year: '1918-1945年',
    title: '恩尼格玛密码机',
    description: '二战期间德军使用的机械式密码机，通过转子和插线板的组合实现极其复杂的加密。',
    icon: '⚙️',
    detail: '恩尼格玛密码机使用3-4个可旋转的转子和一个插线板，每天更换密钥设置，产生数以亿计的加密组合。德军认为它是不可破解的。然而，英国数学家图灵领导的团队在布莱切利庄园成功破解了恩尼格玛，极大地缩短了二战进程，据估计挽救了数百万人的生命。<br><img src="https://neeko-copilot.bytedance.net/api/text2image?prompt=enigma%20machine%20world%20war%20ii&size=landscape_4_3" alt="恩尼格玛密码机" class="timeline-image" />',
  },
  {
    id: 'des',
    year: '1977年',
    title: 'DES数据加密标准',
    description: '第一个计算机时代的标准化对称加密算法，使用56位密钥对数据进行加密。',
    icon: '💻',
    detail: 'DES（数据加密标准）由IBM开发，被美国政府采纳为国家标准。它使用56位密钥对64位数据块进行16轮加密变换。在1990年代，随着计算能力的提升，56位密钥已可通过暴力破解攻破，被AES取代。<br><img src="https://neeko-copilot.bytedance.net/api/text2image?prompt=data%20encryption%20algorithm%20binary%20code&size=landscape_4_3" alt="DES数据加密标准" class="timeline-image" />',
  },
  {
    id: 'rsa',
    year: '1977年',
    title: 'RSA非对称加密',
    description: '里夫斯特、沙米尔、阿德莱曼三人发明的公钥加密算法，奠定了现代互联网安全的基础。',
    icon: '🔐',
    detail: 'RSA的核心思想是使用一对密钥：公钥（公开）用于加密，私钥（保密）用于解密。基于大数分解的数学难题——两个大质数相乘容易，但将乘积分解回原来的质数极为困难。RSA使陌生人之间也能安全通信，是HTTPS、数字签名等技术的基础。<br><img src="https://neeko-copilot.bytedance.net/api/text2image?prompt=rsa%20encryption%20digital%20security&size=landscape_4_3" alt="RSA非对称加密" class="timeline-image" />',
  },
  {
    id: 'aes',
    year: '2001年',
    title: 'AES高级加密标准',
    description: '取代DES的新一代对称加密标准，支持128/192/256位密钥，广泛应用于WiFi、文件加密等。',
    icon: '🛡️',
    detail: 'AES（高级加密标准）通过公开竞赛选出，最终采用比利时密码学家设计的Rijndael算法。AES使用128/192/256位密钥，安全性极高，即使使用世界上最强大的超级计算机，暴力破解也需要数十亿年。你家里的WiFi密码就是用AES加密的。<br><img src="https://neeko-copilot.bytedance.net/api/text2image?prompt=aes%20encryption%20wifi%20security&size=landscape_4_3" alt="AES高级加密标准" class="timeline-image" />',
  },
  {
    id: 'https',
    year: '1994年至今',
    title: 'HTTPS加密协议',
    description: '保护互联网通信的加密协议。浏览器地址栏的🔒图标表示连接已加密，数据在传输过程中无法被窃听。',
    icon: '🌐',
    detail: 'HTTPS = HTTP + TLS（传输层安全协议）。它综合运用了对称加密（AES）和非对称加密（RSA/ECC）的优势：先用非对称加密安全交换一个临时的对称密钥，再用对称加密高效传输数据。当你网购、登录银行时，HTTPS保护着你的密码和交易信息不被窃取。<br><img src="https://neeko-copilot.bytedance.net/api/text2image?prompt=https%20secure%20internet%20padlock%20browser&size=landscape_4_3" alt="HTTPS加密协议" class="timeline-image" />',
  },
])

const expandedNode = ref<string | null>(null)

function toggleNode(id: string) {
  expandedNode.value = expandedNode.value === id ? null : id
}
</script>

<template>
  <div class="timeline-container">
    <div class="timeline-intro">
      <h3>📅 密码进化史</h3>
      <p>从古代军事通信到现代互联网安全，人类保护信息的智慧一直在进化。</p>
    </div>
    <div class="timeline">
      <div class="timeline-line" />
      <div
        v-for="(node, i) in nodes"
        :key="node.id"
        class="timeline-node"
        :class="{ expanded: expandedNode === node.id, left: i % 2 === 0, right: i % 2 === 1 }"
      >
        <div class="node-dot" @click="toggleNode(node.id)">
          <span class="node-icon">{{ node.icon }}</span>
        </div>
        <div class="node-card card" @click="toggleNode(node.id)">
          <div class="node-year">{{ node.year }}</div>
          <h4 class="node-title">{{ node.title }}</h4>
          <p class="node-desc">{{ node.description }}</p>
          <div v-if="expandedNode === node.id" class="node-detail" v-html="node.detail">
          </div>
          <div class="node-expand-hint">
            {{ expandedNode === node.id ? '▲ 收起' : '▼ 展开详情' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-container {
  padding: 16px 0;
  max-width: 800px;
}
.timeline-intro {
  margin-bottom: 24px;
}
.timeline-intro h3 {
  margin-bottom: 4px;
}
.timeline-intro p {
  color: var(--text-secondary);
}
.timeline {
  position: relative;
  padding: 20px 0;
}
.timeline-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(to bottom,
    var(--qz-red), var(--qz-gold), var(--qz-blue), var(--qz-red-light),
    var(--qz-blue-light), var(--success)
  );
  transform: translateX(-50%);
}
.timeline-node {
  display: flex;
  align-items: flex-start;
  margin-bottom: 32px;
  position: relative;
}
.timeline-node.left {
  flex-direction: row;
}
.timeline-node.right {
  flex-direction: row-reverse;
}
.node-dot {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 44px;
  height: 44px;
  background: white;
  border: 3px solid var(--qz-red);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  transition: all 0.2s;
}
.node-dot:hover {
  transform: translateX(-50%) scale(1.15);
  box-shadow: 0 0 12px rgba(196, 91, 60, 0.3);
}
.node-icon {
  font-size: 1.2rem;
}
.node-card {
  width: 42%;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s;
}
.node-card:hover {
  box-shadow: var(--shadow-hover);
}
.timeline-node.left .node-card {
  margin-right: 8%;
}
.timeline-node.right .node-card {
  margin-left: 8%;
}
.node-year {
  font-size: 0.8rem;
  color: var(--qz-blue);
  font-weight: 600;
  margin-bottom: 4px;
}
.node-title {
  font-size: 1rem;
  margin-bottom: 6px;
}
.node-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.6;
}
.node-detail {
  margin-top: 12px;
  padding: 12px 16px;
  background: var(--qz-stone-light);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  line-height: 1.8;
  animation: slideDown 0.3s ease;
}
.node-detail :deep(img.timeline-image) {
  display: block;
  max-width: 100%;
  margin: 12px auto 0;
  border-radius: var(--radius-sm);
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
}
@keyframes slideDown {
  from { opacity: 0; max-height: 0; }
  to { opacity: 1; max-height: 500px; }
}
.node-expand-hint {
  margin-top: 8px;
  font-size: 0.75rem;
  color: var(--qz-red);
  text-align: right;
}
</style>
