<script setup lang="ts">
const steps = [
  { id: 1, label: '输入明文', desc: '选择一段要加密的文字（仅英文字母）', icon: '📝' },
  { id: 2, label: '选择偏移量 k', desc: '确定一个1-25之间的整数作为密钥', icon: '🔑' },
  { id: 3, label: '字母替换', desc: '每个字母按字母表向后移动 k 位', icon: '🔄' },
  { id: 4, label: '循环处理', desc: '超过 Z 时回到 A 继续计数', icon: '🔁' },
  { id: 5, label: '输出密文', desc: '将所有替换后的字母组合成密文', icon: '🔒' },
]
</script>

<template>
  <div class="flowchart">
    <h3>📋 凯撒密码加密流程</h3>
    <div class="flow-steps">
      <template v-for="(step, i) in steps" :key="step.id">
        <div class="flow-step">
          <div class="step-icon">{{ step.icon }}</div>
          <div class="step-content">
            <div class="step-label">{{ step.label }}</div>
            <div class="step-desc">{{ step.desc }}</div>
          </div>
        </div>
        <div v-if="i < steps.length - 1" class="flow-arrow">↓</div>
      </template>
    </div>
    <div class="formula-box">
      <strong>数学公式：</strong>
      <code>E(x) = (x + k) mod 26</code>
      <p class="formula-desc">其中 x = 字母位置（A=0, B=1, ..., Z=25），k = 偏移量</p>
    </div>
  </div>
</template>

<style scoped>
.flowchart {
  padding: 16px 0;
}
.flowchart h3 {
  margin-bottom: 16px;
}
.flow-steps {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}
.flow-step {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  background: white;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  width: 100%;
  max-width: 500px;
}
.step-icon {
  font-size: 1.6rem;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--qz-stone-light);
  border-radius: 50%;
  flex-shrink: 0;
}
.step-content {
  flex: 1;
}
.step-label {
  font-weight: 600;
  color: var(--qz-dark);
}
.step-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 2px;
}
.flow-arrow {
  font-size: 1.4rem;
  color: var(--qz-red);
  padding: 2px 0 2px 38px;
}
.formula-box {
  margin-top: 20px;
  padding: 16px 20px;
  background: var(--qz-stone-light);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--qz-red);
}
.formula-box code {
  display: block;
  font-size: 1.3rem;
  font-family: 'Courier New', monospace;
  color: var(--qz-red);
  margin: 6px 0;
}
.formula-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
}
</style>
