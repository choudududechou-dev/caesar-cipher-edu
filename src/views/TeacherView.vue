<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// --- Statistics state ---
const statsData = ref<{
  exercises: { total: number; basic: number; challenge: number }
  contests: number
  learningRecords: number
} | null>(null)

const activityStats = ref<Array<{ activity_type: string; count: number }>>([])

const maxActivityCount = computed(() => {
  if (activityStats.value.length === 0) return 1
  return Math.max(...activityStats.value.map(a => a.count))
})

async function loadStats() {
  try {
    const res = await fetch('/api/stats/overview')
    if (res.ok) {
      statsData.value = await res.json()
    }
  } catch { /* noop */ }
}

async function loadActivityStats() {
  try {
    const res = await fetch('/api/stats/exercises')
    if (res.ok) {
      const data = await res.json()
      activityStats.value = data.activityStats || []
    }
  } catch { /* noop */ }
}

// --- Class list state ---
const classList = ref<Array<{
  id: number
  code: string
  status: string
  created_at: string
  total: number
  signed: number
}>>([])

async function loadClassList() {
  try {
    const r = await fetch('/api/session')
    if (r.ok) {
      const d = await r.json()
      classList.value = d.sessions || []
    }
  } catch { /* noop */ }
}

function selectClass(session: { code: string }) {
  monitorCode.value = session.code
  createdCode.value = session.code
  startMonitor()
}

async function deleteClass(id: number) {
  if (!confirm('确定删除该班级吗？此操作不可恢复。')) return
  try {
    const r = await fetch(`/api/session/${id}`, { method: 'DELETE' })
    if (r.ok) {
      if (monitorCode.value) {
        const stillExists = classList.value.find(c => c.id === id && c.code === monitorCode.value)
        if (stillExists) { stopMonitor(); monitorCode.value = ''; createdCode.value = '' }
      }
      await loadClassList()
    } else {
      const err = await r.json()
      alert(err.error || '删除失败')
    }
  } catch (e: any) {
    alert(e.message || '删除失败')
  }
}

function enterClass(code: string) {
  router.push({ name: 'admin', query: { class: code } })
}

// --- Create session state ---
const classCode = ref('')
const classCodeError = ref('')
const nameInput = ref('')
const parsedNames = ref<string[]>([])
const creating = ref(false)
const createdCode = ref('')
const createError = ref('')

// --- Grouping state ---
const groupCount = ref(2)
const groups = ref<string[][]>([])

function validateClassCode(): boolean {
  const val = classCode.value.trim()
  if (!val) {
    classCodeError.value = ''
    return true // optional, but if provided must be valid
  }
  if (!/^\d{3}$/.test(val)) {
    classCodeError.value = '班级号必须为3位数字（如101、201、302）'
    return false
  }
  classCodeError.value = ''
  return true
}

function parseNames() {
  parsedNames.value = nameInput.value
    .split('\n')
    .map(n => n.trim())
    .filter(n => n.length > 0)
  groups.value = []
}

function clearNames() {
  nameInput.value = ''
  parsedNames.value = []
  groups.value = []
  createError.value = ''
  createdCode.value = ''
}

function sequentialGroup() {
  if (parsedNames.value.length === 0) return
  const n = Math.max(1, Math.min(groupCount.value, parsedNames.value.length))
  const result: string[][] = Array.from({ length: n }, () => [])
  parsedNames.value.forEach((name, i) => {
    result[i % n].push(name)
  })
  groups.value = result
}

function randomGroup() {
  if (parsedNames.value.length === 0) return
  const n = Math.max(1, Math.min(groupCount.value, parsedNames.value.length))
  const shuffled = [...parsedNames.value].sort(() => Math.random() - 0.5)
  const result: string[][] = Array.from({ length: n }, () => [])
  shuffled.forEach((name, i) => {
    result[i % n].push(name)
  })
  groups.value = result
}

function clearGroups() {
  groups.value = []
}

// --- Drag and drop between groups ---
const dragStudent = ref<{ fromGroup: number; studentIndex: number; studentName: string } | null>(null)

function onDragStart(event: DragEvent, groupIndex: number, studentIndex: number) {
  const studentName = groups.value[groupIndex][studentIndex]
  dragStudent.value = { fromGroup: groupIndex, studentIndex, studentName }
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', studentName)
  }
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function onDropToGroup(event: DragEvent, toGroupIndex: number) {
  event.preventDefault()
  if (!dragStudent.value) return
  const { fromGroup, studentIndex } = dragStudent.value
  if (fromGroup === toGroupIndex) {
    dragStudent.value = null
    return
  }
  // Remove from source group
  const [moved] = groups.value[fromGroup].splice(studentIndex, 1)
  // Add to target group
  groups.value[toGroupIndex].push(moved)
  dragStudent.value = null
}

async function createSession() {
  if (parsedNames.value.length === 0) {
    createError.value = '请先导入学生名单'
    return
  }
  if (!validateClassCode()) return
  creating.value = true
  createError.value = ''
  try {
    const body: any = { studentNames: parsedNames.value }
    if (classCode.value.trim()) {
      body.classCode = classCode.value.trim()
    }
    const res = await fetch('/api/session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || '创建失败')
    }
    const data = await res.json()
    createdCode.value = classCode.value.trim() || data.code
    // Refresh class list
    await loadClassList()
    // Start polling this session
    monitorCode.value = data.code
    startMonitor()
  } catch (e: any) {
    createError.value = e.message || '创建失败'
  } finally {
    creating.value = false
  }
}

// --- Monitor state ---
const monitorCode = ref('')
const monitorStatus = ref('')
const monitorStudents = ref<Array<{
  id: number
  name: string
  signed_in: boolean
  signed_at: string | null
}>>([])
const monitorError = ref('')
const unSigningId = ref<number | null>(null)
let pollTimer: ReturnType<typeof setInterval> | null = null

async function fetchSession() {
  if (!monitorCode.value) return
  try {
    const res = await fetch(`/api/session/${monitorCode.value}`)
    if (!res.ok) {
      const err = await res.json()
      monitorError.value = err.error || '获取课堂信息失败'
      return
    }
    const data = await res.json()
    monitorError.value = ''
    monitorStatus.value = data.session.status
    monitorStudents.value = data.students
  } catch (e: any) {
    monitorError.value = e.message || '网络错误'
  }
}

function startMonitor() {
  stopMonitor()
  fetchSession()
  pollTimer = setInterval(fetchSession, 3000)
}

function stopMonitor() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

onMounted(() => {
  loadClassList()
  loadStats()
  loadActivityStats()
})

onUnmounted(() => {
  stopMonitor()
})

async function unsignStudent(studentId: number) {
  unSigningId.value = studentId
  try {
    const res = await fetch(`/api/session/${monitorCode.value}/unsign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || '撤销失败')
    }
    await fetchSession()
  } catch (e: any) {
    alert(e.message || '撤销失败')
  } finally {
    unSigningId.value = null
  }
}

async function lockSession() {
  if (!confirm('确定锁定签到吗？锁定后学生将无法再签到。')) return
  try {
    const res = await fetch(`/api/session/${monitorCode.value}/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || '锁定失败')
    }
    monitorStatus.value = 'locked'
    await fetchSession()
  } catch (e: any) {
    alert(e.message || '锁定失败')
  }
}

const signedInCount = () => monitorStudents.value.filter(s => s.signed_in).length
</script>

<template>
  <div class="teacher-view">
    <div class="view-header">
      <h1 class="view-title">🏫 教师管理</h1>
      <div class="header-links">
        <router-link to="/admin" class="header-link">📚 内容管理</router-link>
      </div>
    </div>

    <!-- Statistics Overview -->
    <section v-if="statsData" class="card stats-section">
      <h2 class="section-title">📊 数据统计</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-content">
            <div class="stat-value">{{ statsData.exercises.total }}</div>
            <div class="stat-label">练习题总数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <div class="stat-value">{{ statsData.exercises.basic }}</div>
            <div class="stat-label">基础练习</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⚡</div>
          <div class="stat-content">
            <div class="stat-value">{{ statsData.exercises.challenge }}</div>
            <div class="stat-label">挑战练习</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-value">{{ classList.length }}</div>
            <div class="stat-label">创建班级数</div>
          </div>
        </div>
      </div>

      <!-- Activity Breakdown -->
      <div v-if="activityStats.length > 0" class="activity-section">
        <h3 class="activity-title">📋 活动类型分布</h3>
        <div class="activity-chart">
          <div
            v-for="activity in activityStats"
            :key="activity.activity_type"
            class="activity-bar-item"
          >
            <span class="activity-label">{{ activity.activity_type || '其他' }}</span>
            <div class="activity-bar-wrapper">
              <div
                class="activity-bar"
                :style="{ width: `${(activity.count / maxActivityCount * 100)}%` }"
              ></div>
            </div>
            <span class="activity-count">{{ activity.count }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Class List -->
    <section v-if="classList.length > 0" class="card class-list-section">
      <h2 class="section-title">📋 已创建班级</h2>
      <div class="class-list-grid">
        <div
          v-for="c in classList"
          :key="c.id"
          class="class-card"
          :class="{ active: monitorCode === c.code }"
        >
          <div class="class-code" @click="selectClass(c)">{{ c.code }}</div>
          <div class="class-stats" @click="selectClass(c)">
            <span>👥 {{ c.signed }}/{{ c.total }} 已签到</span>
            <span class="class-status" :class="c.status">
              {{ c.status === 'locked' ? '🔒 已锁定' : '🟢 签到中' }}
            </span>
          </div>
          <div class="class-time" @click="selectClass(c)">{{ c.created_at }}</div>
          <div class="class-card-actions">
            <button class="btn btn-small btn-outline" @click.stop="enterClass(c.code)">📋 进入班级</button>
            <button class="btn btn-small btn-danger" @click.stop="deleteClass(c.id)">🗑 删除</button>
          </div>
        </div>
      </div>
    </section>

    <div class="two-col">
      <!-- Left: Create Session -->
      <section class="card section-card">
        <h2 class="section-title">📝 创建课堂</h2>

        <div class="form-group">
          <label class="form-label">年级班级（选填，3位数字）</label>
          <input
            v-model="classCode"
            type="text"
            class="form-input"
            placeholder="如：101、201、302"
            maxlength="3"
            @blur="validateClassCode"
            @input="classCodeError = ''"
          />
          <p v-if="classCodeError" class="inline-error">{{ classCodeError }}</p>
        </div>

        <div class="form-group">
          <label class="form-label">学生名单</label>
          <textarea
            v-model="nameInput"
            class="form-textarea"
            rows="6"
            placeholder="每行一个学生姓名，例如：&#10;张三&#10;李四&#10;王五"
          ></textarea>
        </div>

        <div class="btn-row">
          <button class="btn btn-secondary" @click="parseNames" :disabled="!nameInput.trim()">
            📋 导入名单
          </button>
          <button class="btn btn-ghost" @click="clearNames" :disabled="!parsedNames.length && !nameInput.trim()">
            🗑 清空
          </button>
        </div>

        <!-- Name preview & Grouping -->
        <div v-if="parsedNames.length > 0" class="name-preview">
          <h4 class="preview-label">已导入 {{ parsedNames.length }} 名学生：</h4>
          <div class="name-tags">
            <span v-for="(name, i) in parsedNames" :key="i" class="name-tag">{{ name }}</span>
          </div>

          <!-- Grouping controls -->
          <div class="grouping-section">
            <h4 class="preview-label">📦 分组设置</h4>
            <div class="group-controls">
              <label class="group-count-label">
                分组数：
                <input
                  v-model.number="groupCount"
                  type="number"
                  class="group-count-input"
                  min="1"
                  :max="parsedNames.length"
                />
              </label>
              <button class="btn btn-sm btn-outline" @click="randomGroup">🎲 随机分组</button>
              <button class="btn btn-sm btn-outline" @click="sequentialGroup">📋 按顺序分组</button>
              <button class="btn btn-sm btn-ghost" @click="clearGroups" :disabled="!groups.length">🗑 清空分组</button>
            </div>
          </div>

          <!-- Group visualization -->
          <div v-if="groups.length > 0" class="groups-display">
            <div
              v-for="(group, gi) in groups"
              :key="gi"
              class="group-card"
              @dragover="onDragOver"
              @drop="onDropToGroup($event, gi)"
            >
              <h5 class="group-title">第{{ gi + 1 }}组 ({{ group.length }}人)</h5>
              <div class="group-members">
                <span
                  v-for="(name, ni) in group"
                  :key="ni"
                  class="name-tag group-tag"
                  draggable="true"
                  @dragstart="onDragStart($event, gi, ni)"
                >{{ name }}</span>
              </div>
            </div>
          </div>

          <button class="btn btn-primary" @click="createSession" :disabled="creating">
            {{ creating ? '创建中...' : '🏁 创建课堂' }}
          </button>
        </div>

        <p v-if="createError" class="error-msg">{{ createError }}</p>

        <div v-if="createdCode" class="code-display-box">
          <h4>✅ 课堂已创建</h4>
          <div class="room-code">{{ createdCode }}</div>
          <p class="code-hint">班级号 {{ createdCode }}，请分享给学生用于签到</p>
        </div>
      </section>

      <!-- Right: Sign-in Monitor -->
      <section class="card section-card">
        <h2 class="section-title">📊 签到监控</h2>

        <div v-if="!monitorCode" class="empty-state">
          <p>创建课堂后，签到监控将在此显示</p>
        </div>

        <div v-else class="monitor-panel">
          <div class="monitor-header">
            <div class="monitor-code-box">
              <span class="monitor-label">班级号</span>
              <span class="monitor-code-value">{{ createdCode }}</span>
            </div>
            <div class="monitor-stats">
              <span class="stat-badge signed">
                ✅ 已签到：{{ signedInCount() }} / {{ monitorStudents.length }}
              </span>
              <span
                class="stat-badge"
                :class="monitorStatus === 'locked' ? 'locked-badge' : 'active-badge'"
              >
                {{ monitorStatus === 'locked' ? '🔒 已锁定' : '🟢 签到中' }}
              </span>
            </div>
          </div>

          <div class="monitor-actions">
            <button
              class="btn btn-outline"
              @click="lockSession"
              :disabled="monitorStatus === 'locked'"
            >
              🔒 锁定签到
            </button>
          </div>

          <p v-if="monitorError" class="error-msg">{{ monitorError }}</p>

          <div class="student-grid">
            <div
              v-for="student in monitorStudents"
              :key="student.id"
              class="student-card"
              :class="{
                'signed-in': student.signed_in,
                'not-signed': !student.signed_in,
              }"
            >
              <div class="student-name">{{ student.name }}</div>
              <div class="student-status">
                <template v-if="student.signed_in">
                  <span class="status-icon">✅</span>
                  <span class="status-text">已签到</span>
                  <button
                    class="btn-unsign"
                    @click="unsignStudent(student.id)"
                    :disabled="unSigningId === student.id"
                  >
                    {{ unSigningId === student.id ? '...' : '撤销签到' }}
                  </button>
                </template>
                <template v-else>
                  <span class="status-icon">⏳</span>
                  <span class="status-text">未签到</span>
                </template>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.teacher-view {
  padding: 0 24px;
}

/* Statistics section */
.stats-section {
  margin-bottom: 20px;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #FFF5F5 0%, #FFF0EB 100%);
  border-radius: var(--radius-md);
  border: 1px solid var(--qz-stone);
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}
.stat-icon {
  font-size: 1.8rem;
}
.stat-content {
  flex: 1;
}
.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--qz-red);
}
.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* Activity section */
.activity-section {
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}
.activity-title {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 12px;
}
.activity-chart {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.activity-bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.activity-label {
  width: 80px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.activity-bar-wrapper {
  flex: 1;
  height: 24px;
  background: var(--qz-stone-light);
  border-radius: 12px;
  overflow: hidden;
}
.activity-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--qz-red) 0%, var(--qz-red-light) 100%);
  border-radius: 12px;
  transition: width 0.5s ease;
}
.activity-count {
  width: 40px;
  text-align: right;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--qz-dark);
}

/* Class list */
.class-list-section {
  margin-bottom: 20px;
}
.class-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.class-card {
  padding: 14px 16px;
  border: 2px solid var(--qz-stone, #d4cbc0);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}
.class-card:hover {
  border-color: var(--qz-red);
  background: #FFF5F5;
}
.class-card.active {
  border-color: var(--qz-red);
  background: #FFF0EB;
}
.class-code {
  font-size: 2rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  letter-spacing: 6px;
  color: var(--qz-red);
  margin-bottom: 8px;
}
.class-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
.class-time {
  font-size: 0.75rem;
  color: var(--qz-stone);
}
.class-card-actions {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--qz-stone, #d4cbc0);
}
.btn-outline {
  padding: 4px 12px;
  background: transparent;
  border: 1px solid var(--qz-stone);
  border-radius: var(--radius-sm);
  color: var(--qz-dark);
  cursor: pointer;
  font-size: 0.8rem;
  font-family: inherit;
  transition: all 0.2s;
}
.btn-outline:hover {
  border-color: var(--qz-red);
  color: var(--qz-red);
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

/* Two column layout */
.two-col {
  display: flex;
  gap: 24px;
}

.section-card {
  flex: 1;
  min-width: 0;
}

.section-title {
  margin-bottom: 20px;
  color: var(--qz-red);
  font-size: 1.2rem;
}

/* Form */
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--qz-red);
}

.inline-error {
  color: var(--error);
  font-size: 0.8rem;
  margin-top: 4px;
}

.form-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--qz-red);
}

.btn-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.btn-ghost {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-ghost:hover:not(:disabled) {
  border-color: var(--qz-red);
  color: var(--qz-red);
}

.btn-ghost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 0.8rem;
}

/* Name preview */
.name-preview {
  margin-top: 8px;
}

.preview-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.name-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.name-tag {
  padding: 4px 14px;
  background: var(--qz-stone-light);
  border: 1px solid var(--qz-stone);
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--qz-dark);
}

/* Grouping section */
.grouping-section {
  margin-top: 8px;
  margin-bottom: 16px;
  padding: 14px;
  background: var(--qz-stone-light);
  border-radius: var(--radius-md);
}

.group-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.group-count-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.group-count-input {
  width: 50px;
  padding: 4px 6px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-family: inherit;
  text-align: center;
}

.group-count-input:focus {
  outline: none;
  border-color: var(--qz-red);
}

/* Group display */
.groups-display {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.group-card {
  padding: 12px 14px;
  background: white;
  border: 2px solid var(--qz-stone);
  border-radius: var(--radius-md);
  height: auto;
}

.group-title {
  margin: 0 0 8px;
  font-size: 0.85rem;
  color: var(--qz-red);
  font-weight: 600;
}

.group-members {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.group-tag {
  background: #FFF3E0;
  border-color: #FFE0B2;
  cursor: grab;
  user-select: none;
}
.group-tag:active {
  cursor: grabbing;
}
.group-card {
  position: relative;
}
.group-card.drag-over {
  border-color: var(--qz-red);
  background: #FFF5F5;
}

/* Code display */
.code-display-box {
  margin-top: 20px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #E8F5E9, #F1F8E9);
  border: 2px solid var(--success);
  border-radius: var(--radius-lg);
  text-align: center;
}

.code-display-box h4 {
  color: var(--success);
  margin-bottom: 12px;
}

.room-code {
  font-size: 2.5rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  letter-spacing: 8px;
  color: var(--qz-dark);
  background: white;
  padding: 8px 24px;
  border-radius: var(--radius-md);
  display: inline-block;
  margin-bottom: 8px;
}

.code-hint {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

/* Monitor */
.monitor-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.monitor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.monitor-code-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.monitor-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.monitor-code-value {
  font-size: 1.8rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  letter-spacing: 6px;
  color: var(--qz-red);
  background: var(--qz-stone-light);
  padding: 2px 16px;
  border-radius: var(--radius-sm);
}

.monitor-stats {
  display: flex;
  gap: 8px;
}

.stat-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
}

.stat-badge.signed {
  background: #E8F5E9;
  color: var(--success);
}

.stat-badge.active-badge {
  background: #E3F2FD;
  color: var(--qz-blue);
}

.stat-badge.locked-badge {
  background: #FFF3E0;
  color: var(--warning);
}

.monitor-actions {
  display: flex;
  gap: 8px;
}

/* Student grid */
.student-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.student-card {
  padding: 12px 14px;
  border-radius: var(--radius-md);
  border: 2px solid transparent;
  transition: all 0.2s;
}

.student-card.signed-in {
  background: #E8F5E9;
  border-color: var(--success);
}

.student-card.not-signed {
  background: var(--qz-stone-light);
  border-color: var(--qz-stone);
}

.student-name {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 4px;
}

.student-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
}

.status-icon {
  font-size: 0.75rem;
}

.status-text {
  color: var(--text-secondary);
}

.signed-in .status-text {
  color: var(--success);
}

.btn-unsign {
  margin-left: auto;
  padding: 2px 8px;
  font-size: 0.7rem;
  background: transparent;
  border: 1px solid var(--qz-red);
  color: var(--qz-red);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-unsign:hover:not(:disabled) {
  background: var(--qz-red);
  color: white;
}

.btn-unsign:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Empty */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

/* Error */
.error-msg {
  color: var(--error);
  font-size: 0.9rem;
  margin-top: 8px;
}
</style>
