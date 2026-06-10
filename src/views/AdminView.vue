<template>
  <div class="admin-page">
    <header class="admin-header">
      <h1>教师管理后台</h1>
      <p class="subtitle">凯撒密码教学平台 · 本地管理</p>
    </header>

    <router-link to="/teacher" class="back-link">← 返回教师端</router-link>

    <nav class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-btn', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </nav>

    <!-- ==================== 班级数据一览 ==================== -->
    <section v-if="activeTab === 'class-overview'" class="tab-content">
      <div class="section-header">
        <h2>班级数据一览</h2>
        <span v-if="currentClassCode" class="class-badge">班级号：{{ currentClassCode }}</span>
      </div>
      <div v-if="!currentClassCode" class="empty-state">
        <p>请从教师端班级列表点击"进入班级"查看数据</p>
      </div>
      <div v-else>
        <!-- 实时刷新提示 -->
        <div class="refresh-hint">
          <span class="refresh-icon" :class="{ spinning: isRefreshing }">🔄</span>
          <span>数据实时更新中</span>
          <span class="last-update">上次更新：{{ lastUpdateTime }}</span>
        </div>

        <!-- 核心数据卡片 -->
        <div class="class-stats-grid">
          <div class="class-stat-card">
            <span class="stat-icon">👥</span>
            <span class="stat-number">{{ classData.signedInStudents }}/{{ classData.totalStudents }}</span>
            <span class="stat-label">已签到/总人数</span>
          </div>
          <div class="class-stat-card">
            <span class="stat-icon">✅</span>
            <span class="stat-number">{{ classData.completedStudents }}</span>
            <span class="stat-label">已完成学习</span>
          </div>
          <div class="class-stat-card">
            <span class="stat-icon">📊</span>
            <span class="stat-number">{{ classData.avgScore }}%</span>
            <span class="stat-label">平均正确率</span>
          </div>
          <div class="class-stat-card">
            <span class="stat-icon">🪙</span>
            <span class="stat-number">{{ classData.totalCoins }}</span>
            <span class="stat-label">总金币数</span>
          </div>
        </div>

        <!-- 完成进度条 -->
        <div class="progress-section">
          <h3>📈 学习完成进度</h3>
          <div class="progress-bar-container">
            <div 
              class="progress-bar-fill" 
              :style="{ width: completionRate + '%' }"
            ></div>
          </div>
          <div class="progress-text">{{ completionRate.toFixed(1) }}% 的学生已完成学习</div>
        </div>

        <!-- 各站完成情况 -->
        <div class="stations-section">
          <h3>🚢 各站点完成情况</h3>
          <div v-if="classData.stations.length === 0" class="empty-state small">暂无数据</div>
          <div v-else class="stations-grid">
            <div v-for="(station, idx) in classData.stations" :key="idx" class="station-card">
              <span class="station-icon">{{ stationIcons[idx] || '📍' }}</span>
              <span class="station-name">{{ station.name }}</span>
              <div class="station-progress">
                <div 
                  class="station-progress-bar" 
                  :style="{ width: station.completionRate + '%' }"
                ></div>
              </div>
              <span class="station-rate">{{ station.completionRate }}%</span>
            </div>
          </div>
        </div>

        <!-- 学生排行榜 -->
        <div class="ranking-section">
          <div class="ranking-header">
            <h3>🏆 学生金币排行榜</h3>
            <button 
              v-if="classData.ranking.length > 5"
              class="btn-secondary"
              @click="showFullRanking = true"
            >查看完整排名 →</button>
          </div>
          <div v-if="classData.ranking.length === 0" class="empty-state">暂无数据</div>
          <div v-else class="ranking-list">
            <div 
              v-for="(student, idx) in classData.ranking.slice(0, 5)" 
              :key="idx" 
              class="ranking-item"
            >
              <span class="rank-badge" :class="'rank-' + (idx + 1)">
                {{ idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1 }}
              </span>
              <span class="student-name">{{ student.name }}</span>
              <span class="student-coins">🪙 {{ student.coins }}</span>
              <span class="student-level">通关：{{ student.level }}站</span>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ==================== 教学内容 ==================== -->
    <section v-if="activeTab === 'content'" class="tab-content">
      <h2>教学内容编辑</h2>
      <div v-for="section in contentSections" :key="section.key" class="content-card">
        <h3>{{ section.label }}</h3>
        <textarea
          v-model="contentData[section.key]"
          :rows="section.rows || 10"
          class="content-textarea"
          :placeholder="`编辑${section.label}内容…`"
        ></textarea>
        <div class="card-actions">
          <span v-if="contentSaveStatus[section.key]" class="save-status">{{ contentSaveStatus[section.key] }}</span>
          <button class="btn btn-primary" @click="saveContent(section.key)">保存</button>
        </div>
      </div>
    </section>

    <!-- ==================== 练习管理 ==================== -->
    <section v-if="activeTab === 'exercises'" class="tab-content">
      <div class="section-header">
        <h2>练习管理</h2>
        <button class="btn btn-primary" @click="openExerciseModal()">+ 新增练习</button>
      </div>

      <div class="filter-bar">
        <label>站点：
          <select v-model="exerciseLevelFilter" @change="loadExercises">
            <option value="all">全部站点</option>
            <option value="0">第一站·泉州港</option>
            <option value="1">第二站·广州驿</option>
            <option value="2">第三站·交趾驿</option>
            <option value="3">第四站·马六甲驿</option>
            <option value="4">第五站·波斯湾</option>
          </select>
        </label>
        <label>类型：
          <select v-model="exerciseFilter" @change="loadExercises">
            <option value="all">全部</option>
            <option value="basic">基础练习</option>
            <option value="challenge">挑战练习</option>
          </select>
        </label>
      </div>

      <div v-if="exercisesLoading" class="empty-state">加载中…</div>
      <div v-else-if="exercises.length === 0" class="empty-state">暂无练习数据</div>
      <div v-else class="exercise-list">
        <div v-for="ex in exercises" :key="ex.id" class="content-card exercise-card">
          <div class="exercise-info">
            <span class="type-badge" :class="ex.type">{{ ex.type === 'challenge' ? '挑战' : '基础' }}</span>
            <strong>{{ ex.question }}</strong>
            <span class="answer-hint">答案：{{ ex.answer }}</span>
          </div>
          <div class="exercise-info" style="margin-top:4px;">
            <span class="tags">
              <span v-for="t in parseTags(ex.tags)" :key="t" class="tag">{{ t }}</span>
            </span>
            <span style="font-size:12px;color:var(--qz-stone);margin-left:8px;">难度：{{ '⭐'.repeat(ex.difficulty || 1) }}</span>
          </div>
          <div class="exercise-actions">
            <button class="btn btn-small" @click="openExerciseModal(ex)">编辑</button>
            <button class="btn btn-small btn-danger" @click="deleteExercise(ex.id)">删除</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 竞赛管理 ==================== -->
    <section v-if="activeTab === 'contests'" class="tab-content">
      <div class="section-header">
        <h2>竞赛管理</h2>
        <button class="btn btn-primary" @click="openContestModal()">+ 创建竞赛</button>
      </div>

      <div v-if="contests.length === 0" class="empty-state">暂无竞赛记录</div>
      <div v-else class="contest-list">
        <div v-for="c in contests" :key="c.id" class="content-card">
          <div class="exercise-info">
            <span class="status-badge" :class="c.status">{{ c.status === 'waiting' ? '等待中' : c.status === 'active' ? '进行中' : '已结束' }}</span>
            <strong>{{ c.room_name }}</strong>
            <span class="contest-meta">房间码：{{ c.room_code }} | 题目数：{{ JSON.parse(c.questions || '[]').length }}</span>
          </div>
          <div class="exercise-actions">
            <button class="btn btn-small btn-outline" @click="copyRoomCode(c.room_code)">📋 复制房间码</button>
            <button
              v-if="c.status !== 'finished'"
              class="btn btn-small btn-warning"
              @click="stopContest(c.id)"
            >
              🛑 停止加入
            </button>
            <button class="btn btn-small btn-danger" @click="deleteContest(c.id)">🗑 删除</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 媒体管理 ==================== -->
    <section v-if="activeTab === 'media'" class="tab-content">
      <div class="section-header">
        <h2>媒体管理</h2>
        <button class="btn btn-primary" @click="openMediaModal()">+ 添加媒体</button>
      </div>

      <div v-if="mediaList.length === 0" class="empty-state">暂无媒体资源</div>
      <div v-else class="media-list">
        <div v-for="m in mediaList" :key="m.id" class="media-card">
          <span class="media-type">🎬</span>
          <span class="media-desc">{{ m.title }}</span>
          <span v-if="m.station_index != null" class="tag">第{{ m.station_index + 1 }}站</span>
          <a :href="m.url" target="_blank" class="media-link">🔗 查看</a>
          <span style="font-size:12px;color:var(--qz-stone);">{{ m.source || 'upload' }}</span>
          <button class="btn btn-small btn-danger" @click="deleteMedia(m.id)">删除</button>
        </div>
      </div>
    </section>



    <!-- ===== Exercise Modal ===== -->
    <div v-if="showExerciseModal" class="modal-overlay" @click.self="showExerciseModal = false">
      <div class="modal">
        <h3>{{ editingExercise ? '编辑练习' : '新增练习' }}</h3>
        <label class="form-label">类型</label>
        <select v-model="exerciseForm.type" class="input">
          <option value="basic">基础练习</option>
          <option value="challenge">挑战练习</option>
        </select>
        <label class="form-label">明文（待加密的英文单词）</label>
        <input v-model="exerciseForm.plaintext" class="input" placeholder="如：HELLO" @input="genAnswer" />
        <label class="form-label">偏移量 (1-25)</label>
        <input v-model.number="exerciseForm.shift" type="number" min="1" max="25" class="input" placeholder="如：3" @input="genAnswer" />
        <label class="form-label">密文（自动生成）</label>
        <input :value="exerciseForm.answer" class="input" readonly placeholder="自动根据明文+偏移量计算" />
        <label class="form-label">题目描述</label>
        <input v-model="exerciseForm.question" class="input" placeholder="如：用偏移量3加密单词HELLO" />
        <label class="form-label">提示</label>
        <input v-model="exerciseForm.hint" class="input" placeholder="提示信息" />
        <label class="form-label">添加到站点</label>
        <select v-model="exerciseForm.level_index" class="input">
          <option :value="null">不指定（通用题库）</option>
          <option :value="0">第一站·泉州港</option>
          <option :value="1">第二站·广州驿</option>
          <option :value="2">第三站·交趾驿</option>
          <option :value="3">第四站·马六甲驿</option>
          <option :value="4">第五站·波斯湾</option>
        </select>
        <label class="form-label">难度 (1-5)</label>
        <input v-model.number="exerciseForm.difficulty" type="number" min="1" max="5" class="input" />
        <label class="form-label">标签（逗号分隔）</label>
        <input v-model="exerciseForm.tagsStr" class="input" placeholder="如：泉州,海丝,挑战" />
        <div class="modal-actions">
          <button class="btn" @click="showExerciseModal = false">取消</button>
          <button class="btn btn-primary" @click="saveExercise">保存</button>
        </div>
      </div>
    </div>

    <!-- ===== Contest Modal ===== -->
    <div v-if="showContestModal" class="modal-overlay" @click.self="showContestModal = false">
      <div class="modal">
        <h3>创建竞赛房间</h3>
        <label class="form-label">房间名称</label>
        <input v-model="contestForm.roomName" class="input" placeholder="如：密码挑战赛第1轮" />
        <label class="form-label">选择题目（可多选）</label>
        <div class="exercise-checklist">
          <label v-for="ex in allExercises" :key="ex.id" class="check-item">
            <input type="checkbox" :value="ex.id" v-model="contestForm.questionIds" />
            <span>[{{ ex.type === 'challenge' ? '挑战' : '基础' }}] {{ ex.question }}</span>
          </label>
        </div>
        <div class="modal-actions">
          <button class="btn" @click="showContestModal = false">取消</button>
          <button class="btn btn-primary" @click="createContest">创建</button>
        </div>
      </div>
    </div>

    <!-- ===== Media Modal ===== -->
    <div v-if="showMediaModal" class="modal-overlay" @click.self="showMediaModal = false">
      <div class="modal">
        <h3>上传视频</h3>
        <label class="form-label">标题</label>
        <input v-model="mediaForm.title" class="input" placeholder="视频标题" />
        <label class="form-label">选择视频文件（仅支持 mp4/webm/avi）</label>
        <input type="file" ref="mediaFileInput" accept="video/*" class="input" @change="onMediaFileChange" />
        <p v-if="mediaForm.fileName" style="font-size:13px;color:var(--qz-stone);margin-top:4px;">已选：{{ mediaForm.fileName }}</p>
        <label class="form-label">插入到站点</label>
        <select v-model="mediaForm.station_index" class="input">
          <option :value="null">不指定（仅保存到媒体库）</option>
          <option :value="0">第一站·泉州港</option>
          <option :value="1">第二站·广州驿</option>
          <option :value="2">第三站·交趾驿</option>
          <option :value="3">第四站·马六甲驿</option>
          <option :value="4">第五站·波斯湾</option>
        </select>
        <div class="modal-actions">
          <button class="btn" @click="showMediaModal = false">取消</button>
          <button class="btn btn-primary" @click="saveMedia" :disabled="mediaUploading">
            {{ mediaUploading ? '上传中...' : '上传' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 完整排名弹窗 -->
    <div v-if="showFullRanking" class="modal-overlay" @click.self="showFullRanking = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>🏆 班级金币完整排名</h3>
          <button class="modal-close" @click="showFullRanking = false">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="classData.ranking.length === 0" class="empty-state">暂无学生数据</div>
          <div v-else class="full-ranking-list">
            <div 
              v-for="(student, idx) in classData.ranking" 
              :key="idx" 
              class="ranking-item"
            >
              <span class="rank-badge" :class="'rank-' + (idx + 1)">
                {{ idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1 }}
              </span>
              <span class="student-name">{{ student.name }}</span>
              <span class="student-coins">🪙 {{ student.coins }}</span>
              <span class="student-level">通关：{{ student.level }}站</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="toast" v-if="toastMsg" :class="toastType">{{ toastMsg }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const currentClassCode = ref((route.query.class as string) || '')

// Watch for class code changes from URL
watch(
  () => route.query.class as string,
  (newClass, oldClass) => {
    if (newClass !== oldClass) {
      // 彻底清空旧数据
      Object.assign(classData, createDefaultStats())
      classDataMap.delete(oldClass || '')
    }
    currentClassCode.value = newClass || ''
    if (newClass) loadClassData()
  }
)

function resetClassData() {
  Object.assign(classData, createDefaultStats())
}

// --- Tabs ---
const tabs = [
  { key: 'class-overview', label: '📋 班级数据' },
  { key: 'content', label: '📚 内容管理' },
  { key: 'exercises', label: '✏️ 练习管理' },
  { key: 'media', label: '🎬 媒体管理' },
]
const activeTab = ref(currentClassCode.value ? 'class-overview' : 'content')

// --- Toast ---
const toastMsg = ref('')
const toastType = ref('success')
function showToast(msg: string, type: 'success' | 'error' = 'success') {
  toastMsg.value = msg; toastType.value = type
  setTimeout(() => { toastMsg.value = '' }, 2500)
}

// --- Class Data ---
const showFullRanking = ref(false)
const isRefreshing = ref(false)
const lastUpdateTime = ref('--:--:--')
const stationIcons = ['🏮', '🏯', '🏛', '🕌', '🏰']

interface StationData {
  name: string
  completionRate: number
}

interface RankingItem {
  name: string
  coins: number
  level: number
}

interface ClassStats {
  signedInStudents: number
  totalStudents: number
  completedStudents: number
  avgScore: number
  totalCoins: number
  stations: StationData[]
  ranking: RankingItem[]
}

// 使用 Map 存储不同班级的数据，实现班级隔离
const classDataMap = new Map<string, ClassStats>()

function createDefaultStats(): ClassStats {
  return {
    signedInStudents: 0,
    totalStudents: 0,
    completedStudents: 0,
    avgScore: 0,
    totalCoins: 0,
    stations: [],
    ranking: [],
  }
}

// 当前显示的班级数据
const classData = reactive<ClassStats>(createDefaultStats())

const completionRate = computed(() => {
  if (classData.totalStudents === 0) return 0
  return (classData.completedStudents / classData.totalStudents) * 100
})



async function loadClassData() {
  const classCode = currentClassCode.value
  if (!classCode) return
  // 竞态保护：如果 URL 已切到别的班级，跳过旧请求
  if (classCode !== (route.query.class as string || '')) return
  
  isRefreshing.value = true
  try {
    const r = await fetch(`/api/class/${classCode}/stats`)
    
    const stats: ClassStats = {
      signedInStudents: 0,
      totalStudents: 0,
      completedStudents: 0,
      avgScore: 0,
      totalCoins: 0,
      stations: [],
      ranking: [],
    }

    if (r.ok) {
      const d = await r.json()
      // 安全提取数值（兼容旧API返回 raw object 的情况）
      const getNum = (v: any) => typeof v === 'number' ? v : (v?.c || v?.total || 0)
      stats.signedInStudents = getNum(d.signedInStudents)
      stats.totalStudents = getNum(d.totalStudents)
      stats.completedStudents = getNum(d.completedStudents)
      stats.avgScore = getNum(d.avgScore)
      stats.totalCoins = getNum(d.totalCoins)
      stats.stations = Array.isArray(d.stations) ? d.stations : []
      stats.ranking = Array.isArray(d.ranking) ? d.ranking : []
    }

    // 先重置再赋值，防止跨班级数据残留
    Object.assign(classData, createDefaultStats())
    Object.assign(classData, stats)
    
    // 保存到Map中实现隔离
    classDataMap.set(classCode, stats)
    
    // 更新当前显示的数据
    Object.assign(classData, stats)
    
    const now = new Date()
    lastUpdateTime.value = now.toLocaleTimeString('zh-CN')
  } catch (err) {
    console.error('加载班级数据失败:', err)
  } finally {
    isRefreshing.value = false
  }
}

let refreshTimer: number | null = null

function startRefreshTimer() {
  refreshTimer = window.setInterval(loadClassData, 5000)
}

function stopRefreshTimer() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

function parseTags(tags: string): string[] {
  try { return JSON.parse(tags) } catch { return [] }
}

// =================== 教学内容 ===================
const contentSections = [
  { key: 'station-1', label: '🏮 第一站·泉州港 — 情境导入文本', rows: 10 },
  { key: 'station-2', label: '🏯 第二站·广州驿 — 情境导入文本', rows: 10 },
  { key: 'station-3', label: '🏛 第三站·交趾驿 — 情境导入文本', rows: 10 },
  { key: 'station-4', label: '🕌 第四站·马六甲驿 — 情境导入文本', rows: 12 },
  { key: 'station-5', label: '🏰 第五站·波斯湾 — 情境导入文本', rows: 10 },
]

const defaultContent: Record<string, string> = {
  'station-1': `<p>同学，欢迎你登录1号商船，我是本次出海的密信大使。在很早以前，聪明的古人早就有了保密绝招，比如虎符阴符、字验、蜡书、拆字、隐字术等，这些方法保护着我们海上丝绸之路的成功航行和贸易。但是听说，你们二十一世纪的数字加密技术更加便捷和安全，而这些技术源自于一种叫凯撒密码的演变，这么神奇的加密方法，让我们一起来探索一下吧。</p>
<p>密信大使在泉州港的灯塔下，拿出一张纸，上面写着：<strong>HELLO → KHOOR</strong></p>`,

  'station-2': `<p>泉州商队在广州驿停靠补给。商队要抓紧写一封密信在下一站给交趾译，同时还收到了一封广州驿的密信，商队密信大使邀请你使用刚刚学到的凯撒密码进行加密和解密，来试一试吧。</p>`,

  'station-3': `<p>商队抵达交趾（今越南）。这里的港口官员不懂英文，泉州商队一直以来都用中文和他们打交道。师傅犯难了："凯撒密码加密的是英文字母，可我们的交易清单和航路报告全都是中文——中文没有字母表，怎么移位？"</p>`,

  'station-4': `<p>马六甲是海上丝绸之路最大的中转港——阿拉伯人的香料、印度的宝石、波斯的挂毯、中国的瓷器在这里交汇。商队师傅带你走进万国商馆，指着墙上挂着的各种密码文物，说："每个文明都有自己的加密绝活，来，我带你开开眼界！"</p>
<p>在答题之前，先来看看从古至今的密码技术发展史吧——点击每个节点查看详细介绍。</p>
<div class="video-preview-container">
  <video class="level-video" controls autoplay muted preload="metadata">
    <source src="/videos/人类的加密历史.mp4" type="video/mp4">
    您的浏览器不支持视频播放
  </video>
</div>`,

  'station-5': `<p>历经万里航行，商队终于抵达波斯湾——海上丝绸之路的终点。商队总长亲自迎接你，但他说："最后一个考验——你要通过总部的安全考核，证明你不仅会用加密技术，更懂得什么时候该用、什么时候该防。密信使的真正使命，不是加密本身，而是守护。"</p>`,
}

const contentData = reactive<Record<string, string>>({})
const contentSaveStatus = reactive<Record<string, string>>({})
// Init reactive keys
contentSections.forEach(s => { contentData[s.key] = ''; contentSaveStatus[s.key] = '' })

async function loadContent(section: string) {
  try {
    const r = await fetch(`/api/content/${section}`)
    if (r.ok) {
      const d = await r.json()
      contentData[section] = (d.body && d.body.trim()) ? d.body : (defaultContent[section] || '')
    } else {
      contentData[section] = defaultContent[section] || ''
    }
  } catch {
    contentData[section] = defaultContent[section] || ''
  }
}
async function saveContent(section: string) {
  try {
    contentSaveStatus[section] = '保存中…'
    const r = await fetch(`/api/content/${section}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: section, body: contentData[section], media_urls: [], sort_order: 1 }),
    })
    if (r.ok) {
      contentSaveStatus[section] = '已保存'
      setTimeout(() => { contentSaveStatus[section] = '' }, 2000)
      showToast('保存成功')
    } else {
      contentSaveStatus[section] = '保存失败'
      showToast('保存失败', 'error')
    }
  } catch {
    contentSaveStatus[section] = '保存失败'
    showToast('保存失败', 'error')
  }
}

// =================== 练习管理 ===================
const exercises = ref<any[]>([])
const exercisesLoading = ref(false)
const exerciseFilter = ref('all')
const exerciseLevelFilter = ref('all')
const exerciseTagFilter = ref('')

async function loadExercises() {
  exercisesLoading.value = true
  try {
    let url = `/api/exercises?type=${exerciseFilter.value}`
    if (exerciseLevelFilter.value !== 'all') url += `&level=${exerciseLevelFilter.value}`
    if (exerciseTagFilter.value) url += `&tag=${exerciseTagFilter.value}`
    const r = await fetch(url)
    if (r.ok) {
      const d = await r.json()
      exercises.value = d.exercises
    }
  } catch { /* noop */ }
  finally { exercisesLoading.value = false }
}

const showExerciseModal = ref(false)
const editingExercise = ref<any>(null)
// --- Caesar cipher helpers ---
function caesarEncrypt(text: string, shift: number): string {
  if (!text || !shift) return ''
  const s = ((shift % 26) + 26) % 26
  return text.split('').map(ch => {
    const code = ch.charCodeAt(0)
    if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + s) % 26) + 65)
    if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + s) % 26) + 97)
    return ch
  }).join('')
}

const exerciseForm = reactive({
  type: 'basic', plaintext: '', shift: 3, question: '', answer: '', hint: '',
  difficulty: 1, tagsStr: '', level_index: null as number | null,
})

function genAnswer() {
  if (exerciseForm.plaintext && exerciseForm.shift) {
    exerciseForm.answer = caesarEncrypt(exerciseForm.plaintext.toUpperCase(), exerciseForm.shift)
    if (!exerciseForm.question) {
      exerciseForm.question = `用偏移量${exerciseForm.shift}加密单词"${exerciseForm.plaintext.toUpperCase()}"`
    }
  }
}

function openExerciseModal(ex?: any) {
  if (ex) {
    editingExercise.value = ex
    exerciseForm.type = ex.type
    exerciseForm.question = ex.question
    exerciseForm.answer = ex.answer
    exerciseForm.plaintext = ''
    exerciseForm.shift = 3
    exerciseForm.hint = ex.hint || ''
    exerciseForm.difficulty = ex.difficulty || 1
    exerciseForm.tagsStr = parseTags(ex.tags).join(',')
    exerciseForm.level_index = ex.level_index ?? null
  } else {
    editingExercise.value = null
    exerciseForm.type = 'basic'
    exerciseForm.plaintext = ''
    exerciseForm.shift = 3
    exerciseForm.question = ''
    exerciseForm.answer = ''
    exerciseForm.hint = ''
    exerciseForm.difficulty = 1
    exerciseForm.tagsStr = ''
    exerciseForm.level_index = null
  }
  showExerciseModal.value = true
}

async function saveExercise() {
  const body: any = {
    type: exerciseForm.type,
    question: exerciseForm.question,
    answer: exerciseForm.answer,
    hint: exerciseForm.hint,
    difficulty: exerciseForm.difficulty,
    tags: exerciseForm.tagsStr.split(',').map(t => t.trim()).filter(t => t),
    level_index: exerciseForm.level_index,
  }
  try {
    let r: Response
    if (editingExercise.value) {
      r = await fetch(`/api/exercises/${editingExercise.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } else {
      r = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }
    if (r.ok) {
      showToast(editingExercise.value ? '练习已更新' : '练习已创建')
      showExerciseModal.value = false
      loadExercises()
    } else {
      const err = await r.json()
      showToast(err.error || '操作失败', 'error')
    }
  } catch (e: any) {
    showToast(e.message || '操作失败', 'error')
  }
}

async function deleteExercise(id: number) {
  if (!confirm('确定删除该练习吗？')) return
  try {
    const r = await fetch(`/api/exercises/${id}`, { method: 'DELETE' })
    if (r.ok) {
      showToast('练习已删除')
      loadExercises()
    } else {
      showToast('删除失败', 'error')
    }
  } catch {
    showToast('删除失败', 'error')
  }
}

// =================== 竞赛管理 ===================
const contests = ref<any[]>([])
const showContestModal = ref(false)
const allExercises = ref<any[]>([])
const contestForm = reactive({ roomName: '', questionIds: [] as number[] })

async function loadContests() {
  try {
    const r = await fetch('/api/contest')
    if (r.ok) {
      const d = await r.json()
      contests.value = d.contests
    }
  } catch { /* noop */ }
}

async function openContestModal() {
  contestForm.roomName = ''
  contestForm.questionIds = []
  try {
    const r = await fetch('/api/exercises?type=all')
    if (r.ok) {
      const d = await r.json()
      allExercises.value = d.exercises
    }
  } catch { /* noop */ }
  showContestModal.value = true
}

async function createContest() {
  try {
    const r = await fetch('/api/contest/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName: contestForm.roomName || '密码挑战赛',
        questionIds: contestForm.questionIds,
      }),
    })
    if (r.ok) {
      const d = await r.json()
      showToast(`竞赛房间已创建，房间码：${d.roomCode}`)
      showContestModal.value = false
      loadContests()
    } else {
      const err = await r.json()
      showToast(err.error || '创建失败', 'error')
    }
  } catch (e: any) {
    showToast(e.message || '创建失败', 'error')
  }
}

async function copyRoomCode(code: string) {
  try {
    await navigator.clipboard.writeText(code)
    showToast(`房间码 ${code} 已复制到剪贴板`)
  } catch {
    showToast('复制失败，请手动复制', 'error')
  }
}

async function stopContest(id: number) {
  if (!confirm('确定停止该竞赛的加入吗？停止后学生将无法再加入。')) return
  try {
    const r = await fetch(`/api/contest/${id}/stop`, { method: 'POST' })
    if (r.ok) {
      showToast('已停止加入')
      loadContests()
    } else {
      const err = await r.json()
      showToast(err.error || '操作失败', 'error')
    }
  } catch (e: any) {
    showToast(e.message || '操作失败', 'error')
  }
}

async function deleteContest(id: number) {
  if (!confirm('确定删除该竞赛吗？此操作不可恢复。')) return
  try {
    const r = await fetch(`/api/contest/${id}`, { method: 'DELETE' })
    if (r.ok) {
      showToast('竞赛已删除')
      loadContests()
    } else {
      const err = await r.json()
      showToast(err.error || '删除失败', 'error')
    }
  } catch (e: any) {
    showToast(e.message || '删除失败', 'error')
  }
}

// =================== 媒体管理 ===================
const mediaList = ref<any[]>([])
const showMediaModal = ref(false)
const mediaUploading = ref(false)
const mediaFileInput = ref<HTMLInputElement | null>(null)
const mediaForm = reactive({
  title: '', fileName: '', station_index: null as number | null,
})

async function loadMedia() {
  try {
    const r = await fetch('/api/media')
    if (r.ok) {
      const d = await r.json()
      mediaList.value = d.media
    }
  } catch { /* noop */ }
}

function onMediaFileChange() {
  const file = mediaFileInput.value?.files?.[0]
  if (file) {
    mediaForm.fileName = file.name
    if (!mediaForm.title) mediaForm.title = file.name.replace(/\.[^.]+$/, '')
  }
}

function openMediaModal() {
  mediaForm.title = ''
  mediaForm.fileName = ''
  mediaForm.station_index = null
  if (mediaFileInput.value) mediaFileInput.value.value = ''
  showMediaModal.value = true
}

async function saveMedia() {
  const file = mediaFileInput.value?.files?.[0]
  if (!file) { showToast('请选择视频文件', 'error'); return }

  mediaUploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', mediaForm.title || file.name)
    if (mediaForm.station_index != null) fd.append('station_index', String(mediaForm.station_index))

    const r = await fetch('/api/media/upload', { method: 'POST', body: fd })
    if (r.ok) {
      showToast('视频已上传')
      showMediaModal.value = false
      loadMedia()
    } else {
      const err = await r.json()
      showToast(err.error || '上传失败', 'error')
    }
  } catch (e: any) {
    showToast(e.message || '上传失败', 'error')
  } finally {
    mediaUploading.value = false
  }
}

async function deleteMedia(id: number) {
  if (!confirm('确定删除该媒体吗？')) return
  try {
    const r = await fetch(`/api/media/${id}`, { method: 'DELETE' })
    if (r.ok) {
      showToast('媒体已删除')
      loadMedia()
    } else {
      showToast('删除失败', 'error')
    }
  } catch {
    showToast('删除失败', 'error')
  }
}

// =================== Init ===================
onMounted(() => {
  contentSections.forEach(s => loadContent(s.key))
  loadExercises()
  loadContests()
  loadMedia()
  loadClassData()
  startRefreshTimer()
})

onUnmounted(() => {
  stopRefreshTimer()
})
</script>

<style scoped>
/* ===== Layout ===== */
.admin-page {
  padding: 24px 24px 64px;
  color: var(--qz-dark, #3b3b3b);
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}

.admin-header h1 {
  font-size: 28px;
  color: var(--qz-red, #c43a31);
  margin: 0 0 4px;
}
.subtitle { margin: 0; color: var(--qz-stone, #8c7c6b); font-size: 14px; }

.back-link {
  display: inline-block;
  margin-bottom: 12px;
  color: var(--qz-red);
  font-size: 14px;
  text-decoration: none;
  transition: opacity 0.2s;
}
.back-link:hover { opacity: 0.7; }

/* ===== Tabs ===== */
.tab-bar {
  display: flex; gap: 4px;
  margin: 20px 0;
  border-bottom: 2px solid var(--qz-stone, #8c7c6b);
  padding-bottom: 0;
  flex-wrap: wrap;
}
.tab-btn {
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: var(--qz-stone, #8c7c6b);
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  transition: all .2s;
  white-space: nowrap;
}
.tab-btn:hover { background: rgba(196, 58, 49, 0.08); }
.tab-btn.active {
  background: var(--qz-red, #c43a31);
  color: #fff;
}

/* ===== Cards ===== */
.tab-content { margin-top: 16px; }
.tab-content h2 { font-size: 20px; margin: 0 0 16px; color: var(--qz-dark, #3b3b3b); }
.content-card, .media-card {
  background: #fff;
  border: 1px solid var(--qz-stone, #d4cbc0);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

/* ===== Forms ===== */
.content-textarea {
  width: 100%;
  border: 1px solid #d4cbc0;
  border-radius: 6px;
  padding: 10px;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
}
.content-textarea:focus { outline: none; border-color: var(--qz-red, #c43a31); }
.input {
  display: block; width: 100%;
  padding: 8px 10px; margin: 4px 0 10px;
  border: 1px solid #d4cbc0; border-radius: 6px;
  font-size: 14px; box-sizing: border-box;
}
.input:focus { outline: none; border-color: var(--qz-red, #c43a31); }
.form-label {
  display: block;
  font-weight: 600;
  margin-top: 8px;
  font-size: 13px;
  color: var(--qz-dark);
}
.card-actions { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.save-status { font-size: 13px; color: var(--qz-stone, #8c7c6b); }

/* ===== Buttons ===== */
.btn {
  padding: 8px 16px; border: 1px solid #d4cbc0;
  background: #fff; border-radius: 6px;
  cursor: pointer; font-size: 14px; transition: all .2s;
}
.btn:hover { background: #f5f0eb; }
.btn-primary {
  background: var(--qz-red, #c43a31);
  color: #fff; border-color: var(--qz-red, #c43a31);
}
.btn-primary:hover { opacity: 0.9; }
.btn-danger { border-color: #d44; color: #d44; }
.btn-danger:hover { background: #d44; color: #fff; }
.btn-warning { border-color: #e6a817; color: #e6a817; }
.btn-warning:hover { background: #e6a817; color: #fff; }
.btn-small { padding: 4px 10px; font-size: 13px; }

/* ===== Section header ===== */
.section-header {
  display: flex; justify-content: space-between;
  align-items: center; margin-bottom: 16px;
}

/* ===== Filter bar ===== */
.filter-bar {
  display: flex; gap: 16px; margin-bottom: 16px;
  flex-wrap: wrap;
}
.filter-bar label { font-size: 14px; }
.filter-bar select {
  margin-left: 4px; padding: 4px 8px;
  border: 1px solid #d4cbc0; border-radius: 4px;
}

/* ===== Badges & Tags ===== */
.type-badge {
  display: inline-block; padding: 2px 8px;
  border-radius: 4px; font-size: 12px;
  margin-right: 8px; font-weight: 500;
}
.type-badge.basic { background: #e8f5e9; color: #2e7d32; }
.type-badge.challenge { background: #fff3e0; color: #e65100; }
.status-badge {
  display: inline-block; padding: 2px 8px;
  border-radius: 4px; font-size: 12px; margin-right: 8px;
}
.status-badge.waiting { background: #e3f2fd; color: #1565c0; }
.status-badge.active { background: #e8f5e9; color: #2e7d32; }
.status-badge.finished { background: #f5f5f5; color: #616161; }
.tags { display: inline-flex; gap: 4px; flex-wrap: wrap; }
.tag {
  background: #f5f0eb; color: var(--qz-stone, #8c7c6b);
  padding: 1px 6px; border-radius: 4px; font-size: 12px;
}
.answer-hint {
  font-size: 13px; color: var(--qz-stone, #8c7c6b);
  margin-left: 8px;
}

/* ===== Exercise card ===== */
.exercise-info { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.exercise-actions { margin-top: 8px; display: flex; gap: 8px; }
.contest-meta { font-size: 13px; color: var(--qz-stone, #8c7c6b); margin-left: 8px; }

/* ===== Media ===== */
.media-card { display: flex; align-items: center; gap: 12px; }
.media-type {
  background: var(--qz-red, #c43a31); color: #fff;
  padding: 2px 8px; border-radius: 4px; font-size: 12px;
  text-transform: uppercase;
}
.media-desc { flex: 1; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.media-link { color: var(--qz-red, #c43a31); font-size: 13px; }

/* ===== Modal ===== */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
}
.modal {
  background: #fff; border-radius: 12px;
  padding: 24px; width: 90%; max-width: 550px;
  max-height: 80vh; overflow-y: auto;
}
.modal h3 { margin: 0 0 16px; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }

/* ===== Exercise checklist ===== */
.exercise-checklist {
  max-height: 200px; overflow-y: auto;
  border: 1px solid #d4cbc0; border-radius: 6px;
  padding: 8px; margin: 8px 0;
}
.check-item {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 0; font-size: 13px; cursor: pointer;
}

/* ===== Stats ===== */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
.stat-card {
  background: #fff; border: 1px solid #d4cbc0;
  border-radius: 8px; padding: 24px; text-align: center;
}
.stat-number {
  font-size: 36px; font-weight: 700;
  color: var(--qz-red, #c43a31); display: block;
}
.stat-label { font-size: 14px; color: var(--qz-stone, #8c7c6b); margin-top: 4px; }

/* ===== Class overview ===== */
.class-badge {
  padding: 4px 14px;
  background: var(--qz-red, #c43a31);
  color: #fff;
  border-radius: 16px;
  font-size: 0.9rem;
  font-weight: 600;
}
.refresh-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #e8f5e9;
  border-radius: 8px;
  font-size: 14px;
  color: #2e7d32;
  margin-bottom: 16px;
}
.refresh-icon {
  font-size: 16px;
}
.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.last-update {
  margin-left: auto;
  font-size: 12px;
  color: #66bb6a;
}

/* Class Stats Grid */
.class-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.class-stat-card {
  background: #fff;
  border: 1px solid #d4cbc0;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
}
.stat-icon {
  font-size: 1.8rem;
  display: block;
  margin-bottom: 8px;
}
.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--qz-red, #c43a31);
  display: block;
}
.stat-label {
  font-size: 13px;
  color: var(--qz-stone, #8c7c6b);
  margin-top: 4px;
}

/* Progress Section */
.progress-section {
  background: #fff;
  border: 1px solid #d4cbc0;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 20px;
}
.progress-section h3 {
  margin: 0 0 12px;
  font-size: 16px;
  color: var(--qz-dark);
}
.progress-bar-container {
  height: 48px;
  background: #f5f0eb;
  border-radius: 24px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--qz-red, #c43a31), #e53935);
  border-radius: 12px;
  transition: width 0.5s ease;
}
.progress-text {
  text-align: right;
  font-size: 13px;
  color: var(--qz-stone);
  margin-top: 8px;
}

/* Stations Section */
.stations-section {
  margin-bottom: 20px;
}
.stations-section h3 {
  margin: 0 0 12px;
  font-size: 16px;
  color: var(--qz-dark);
}
.stations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}
.station-card {
  background: #fff;
  border: 1px solid #d4cbc0;
  border-radius: 10px;
  padding: 14px;
  text-align: center;
}
.station-icon {
  font-size: 1.5rem;
  display: block;
  margin-bottom: 6px;
}
.station-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--qz-dark);
  display: block;
  margin-bottom: 8px;
}
.station-progress {
  height: 12px;
  background: #f5f0eb;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 6px;
}
.station-progress-bar {
  height: 100%;
  background: var(--qz-red, #c43a31);
  border-radius: 6px;
  transition: width 0.5s ease;
}
.station-rate {
  font-size: 13px;
  font-weight: 700;
  color: var(--qz-dark);
}

/* Ranking Section */
.ranking-section {
  background: #fff;
  border: 1px solid #d4cbc0;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 20px;
}
.ranking-section h3 {
  margin: 0 0 12px;
  font-size: 16px;
  color: var(--qz-dark);
}
.ranking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.ranking-header h3 { margin: 0; }
.btn-secondary {
  padding: 6px 14px;
  background: #fff;
  border: 1px solid var(--qz-red, #c43a31);
  color: var(--qz-red, #c43a31);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.btn-secondary:hover {
  background: var(--qz-red, #c43a31);
  color: #fff;
}
.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ranking-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #faf8f5;
  border-radius: 8px;
}
.rank-badge {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: #9e9e9e;
  border-radius: 50%;
}
.rank-badge.rank-1 { background: #ffd700; color: #8b6914; }
.rank-badge.rank-2 { background: #c0c0c0; color: #4a4a4a; }
.rank-badge.rank-3 { background: #cd7f32; color: #fff; }
.student-name {
  flex: 1;
  font-weight: 600;
  color: var(--qz-dark);
}
.student-coins {
  font-size: 13px;
  color: #e6a817;
}
.student-level {
  font-size: 12px;
  color: var(--qz-stone);
}

/* Time Section */
.time-section {
  background: #fff;
  border: 1px solid #d4cbc0;
  border-radius: 10px;
  padding: 16px;
}
.time-section h3 {
  margin: 0 0 16px;
  font-size: 16px;
  color: var(--qz-dark);
}
.time-chart {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  height: 160px;
  padding: 0 8px;
}
.time-bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  flex: 1;
}
.time-bar {
  width: 28px;
  background: linear-gradient(180deg, var(--qz-red, #c43a31), #ef5350);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.5s ease;
}
.time-label {
  font-size: 11px;
  color: var(--qz-stone);
}
.time-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--qz-red, #c43a31);
}

/* ===== Modal ===== */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 150;
}
.modal-content {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 560px;
  max-height: 85vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e0d5;
}
.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--qz-dark);
}
.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #999;
  padding: 4px 8px;
}
.modal-close:hover { color: var(--qz-red, #c43a31); }
.modal-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}
.full-ranking-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ===== Empty ===== */
.empty-state { text-align: center; color: #999; padding: 40px 0; font-size: 14px; }
.empty-state.small { padding: 20px 0; font-size: 13px; }

/* ===== Toast ===== */
.toast {
  position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
  padding: 10px 24px; border-radius: 8px; font-size: 14px; z-index: 200;
  box-shadow: 0 4px 12px rgba(0,0,0,.15);
}
.toast.success { background: #2e7d32; color: #fff; }
.toast.error { background: #c62828; color: #fff; }
</style>
