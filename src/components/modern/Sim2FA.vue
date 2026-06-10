<script setup lang="ts">
import { ref } from 'vue'

const phone = ref('')
const codeSent = ref(false)
const mockCode = ref('')
const userCode = ref('')
const countdown = ref(0)
const verified = ref<boolean | null>(null)
const message = ref('')
let timer: ReturnType<typeof setInterval> | null = null

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function sendCode() {
  if (!phone.value || countdown.value > 0) return
  mockCode.value = generateCode()
  codeSent.value = true
  countdown.value = 60
  message.value = ''

  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (timer) clearInterval(timer)
      timer = null
    }
  }, 1000)
}

function verifyCode() {
  if (!userCode.value) return
  if (userCode.value === mockCode.value) {
    verified.value = true
    message.value = '✅ 验证成功！这就是二次验证的原理——即使别人知道你的密码，没有手机验证码也无法登录。'
    codeSent.value = false
    if (timer) clearInterval(timer)
  } else {
    verified.value = false
    message.value = '❌ 验证码错误，请重试。（提示：验证码是 ' + mockCode.value + '）'
  }
}

import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="sim-2fa">
    <h3>📱 二次验证（2FA）模拟</h3>
    <p class="fa-desc">二次验证是指在输入密码后，还需要通过其他方式（如手机验证码）再次确认身份。即使密码泄露，攻击者也因为没有你的手机而无法登录。</p>

    <div class="fa-card card">
      <div v-if="!codeSent" class="fa-step">
        <label>模拟手机号</label>
        <div class="phone-input">
          <input v-model="phone" type="text" placeholder="输入模拟手机号（如 138****8888）" />
          <button class="btn btn-primary" @click="sendCode" :disabled="!phone">发送验证码</button>
        </div>
      </div>

      <div v-else class="fa-step">
        <div class="code-sent-notice">
          ✅ 验证码已"发送"至 {{ phone }}
        </div>
        <div class="mock-code-display">
          <span class="mock-label">模拟验证码（实际场景中会通过短信发送）：</span>
          <span class="mock-code">{{ mockCode }}</span>
        </div>
        <div class="countdown" v-if="countdown > 0">
          重新发送 {{ countdown }}s
        </div>

        <div class="verify-input">
          <label>输入收到的验证码</label>
          <div class="input-row">
            <input v-model="userCode" type="text" placeholder="输入6位验证码" maxlength="6"
              @keyup.enter="verifyCode" />
            <button class="btn btn-primary" @click="verifyCode" :disabled="!userCode">验证</button>
          </div>
        </div>
      </div>

      <div v-if="message" class="fa-message" :class="{ success: verified, error: verified === false }">
        {{ message }}
      </div>
    </div>

    <div class="fa-info">
      <h4>🔍 TOTP动态密码原理</h4>
      <p>很多App（如微信、支付宝）使用TOTP（基于时间的一次性密码）：</p>
      <ol>
        <li>服务器和你的手机共享一个密钥</li>
        <li>每隔30秒，根据密钥+当前时间生成一个6位动态密码</li>
        <li>即使密码被截获，30秒后即失效</li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.sim-2fa {
  padding: 16px 0;
  max-width: 650px;
}
.sim-2fa h3 { margin-bottom: 8px; }
.fa-desc {
  color: var(--text-secondary);
  margin-bottom: 16px;
  line-height: 1.8;
}
.fa-card { padding: 24px; }
.fa-step {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.fa-step label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
}
.phone-input, .input-row {
  display: flex;
  gap: 8px;
}
.phone-input input, .input-row input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 1rem;
}
.phone-input input:focus, .input-row input:focus {
  outline: none;
  border-color: var(--qz-red);
}
.code-sent-notice {
  padding: 10px 14px;
  background: #E8F5E9;
  border-radius: var(--radius-sm);
  color: var(--success);
  font-size: 0.9rem;
}
.mock-code-display {
  padding: 16px;
  background: #FFF8E1;
  border: 2px dashed var(--warning);
  border-radius: var(--radius-md);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mock-label { font-size: 0.8rem; color: var(--text-secondary); }
.mock-code {
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: 8px;
  font-family: 'Courier New', monospace;
  color: var(--qz-red);
}
.countdown {
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.85rem;
}
.verify-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.fa-message {
  margin-top: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
}
.fa-message.success {
  background: #E8F5E9;
  color: var(--success);
  border-left: 4px solid var(--success);
}
.fa-message.error {
  background: #FFF0EB;
  color: var(--error);
  border-left: 4px solid var(--error);
}
.fa-info {
  margin-top: 20px;
  padding: 16px 20px;
  background: var(--qz-stone-light);
  border-radius: var(--radius-md);
}
.fa-info h4 { margin-bottom: 8px; }
.fa-info p { font-size: 0.9rem; color: var(--text-secondary); }
.fa-info ol { margin-left: 20px; font-size: 0.9rem; color: var(--text-secondary); }
.fa-info li { margin: 4px 0; }
</style>
