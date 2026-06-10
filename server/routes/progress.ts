import { Router } from 'express'
import { getDatabase } from '../database'

const router = Router()

// POST /api/progress - 提交学生答题结果
router.post('/', (req, res) => {
  const db = getDatabase()
  const { sessionId, studentName, levelIndex, stationName, correctCount, totalCount, coins } = req.body

  if (!sessionId || !studentName || levelIndex === undefined) {
    res.status(400).json({ error: '缺少必要参数' })
    return
  }

  try {
    // 使用 UPSERT 语法插入或更新记录
    db.prepare(`
      INSERT INTO student_progress (session_id, student_name, level_index, station_name, correct_count, total_count, coins)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id, student_name, level_index)
      DO UPDATE SET
        correct_count = MAX(correct_count, excluded.correct_count),
        total_count = MAX(total_count, excluded.total_count),
        coins = MAX(coins, excluded.coins),
        completed_at = CURRENT_TIMESTAMP
    `).run(sessionId, studentName, levelIndex, stationName || '', correctCount || 0, totalCount || 0, coins || 0)

    res.json({ message: '进度已保存' })
  } catch (err: any) {
    console.error('保存进度失败:', err)
    res.status(500).json({ error: '保存进度失败', message: err.message })
  }
})

// POST /api/progress/session - 记录学生开始/结束学习
router.post('/session', (req, res) => {
  const db = getDatabase()
  const { sessionId, studentName, finished, totalCoins, finishedLevels } = req.body

  if (!sessionId || !studentName) {
    res.status(400).json({ error: '缺少必要参数' })
    return
  }

  try {
    if (finished) {
      // 更新结束时间
      db.prepare(`
        UPDATE student_sessions 
        SET finished_at = CURRENT_TIMESTAMP, total_coins = ?, finished_levels = ?
        WHERE session_id = ? AND student_name = ? AND finished_at IS NULL
      `).run(totalCoins || 0, finishedLevels || 0, sessionId, studentName)
    } else {
      // 插入新记录
      db.prepare(`
        INSERT INTO student_sessions (session_id, student_name)
        VALUES (?, ?)
      `).run(sessionId, studentName)
    }

    res.json({ message: '学习会话已记录' })
  } catch (err: any) {
    console.error('记录学习会话失败:', err)
    res.status(500).json({ error: '记录失败', message: err.message })
  }
})

// GET /api/class/:code/stats - 获取班级统计数据
router.get('/:code/stats', (req, res) => {
  const db = getDatabase()
  const classCode = req.params.code

  try {
    // 获取班级信息（包括 session id）
    const sessionInfo = db.prepare(`
      SELECT * FROM sessions WHERE code = ?
    `).get(classCode) as any

    if (!sessionInfo) {
      res.status(404).json({ error: '班级不存在' })
      return
    }

    const sessionId = sessionInfo.id

    // 班级总人数（所有学生）
    const totalCountResult = db.prepare(`
      SELECT COUNT(*) as c FROM session_students WHERE session_id = ?
    `).get(sessionId) as any
    const totalStudents = totalCountResult?.c || 0

    // 已签到人数
    const signedInResult = db.prepare(`
      SELECT COUNT(*) as c FROM session_students WHERE session_id = ? AND signed_in = 1
    `).get(sessionId) as any
    const signedInStudents = signedInResult?.c || 0

    // 已完成学习的学生数
    const completedResult = db.prepare(`
      SELECT COUNT(DISTINCT student_name) as c
      FROM student_sessions
      WHERE session_id = ? AND finished_at IS NOT NULL
    `).get(classCode) as any

    // 获取各站点完成情况
    const stations = db.prepare(`
      SELECT 
        station_name as name,
        COUNT(DISTINCT student_name) as completions,
        AVG(CAST(coins AS FLOAT)) as avgCoins
      FROM student_progress
      WHERE session_id = ?
      GROUP BY station_name
      ORDER BY level_index
    `).all(classCode) as any[]

    // 补全所有5站（即使无数据也显示）
    const allStationNames = ['泉州港','广州驿','交趾驿','马六甲驿','波斯湾']
    const stationsWithRate = allStationNames.map(name => {
      const found = stations.find((s: any) => s.name === name)
      return {
        name,
        completionRate: totalStudents > 0 && found
          ? Math.round((found.completions / totalStudents) * 100)
          : 0
      }
    })

    // 获取学生排行榜（按最高总分排序）
    const ranking = db.prepare(`
      SELECT
        student_name as name,
        SUM(coins) as coins,
        COUNT(DISTINCT level_index) as level
      FROM student_progress
      WHERE session_id = ?
      GROUP BY student_name
      ORDER BY SUM(coins) DESC, level DESC
      LIMIT 20
    `).all(classCode) as any[]

    // 计算平均正确率
    const avgScoreResult = db.prepare(`
      SELECT AVG(CAST(correct_count AS FLOAT) / NULLIF(total_count, 0) * 100) as avg
      FROM student_progress
      WHERE session_id = ? AND total_count > 0
    `).get(classCode) as any

    // 计算总金币数
    const totalCoinsResult = db.prepare(`
      SELECT COALESCE(SUM(coins), 0) as total
      FROM student_progress
      WHERE session_id = ?
    `).get(classCode) as any

    res.json({
      signedInStudents,
      totalStudents,
      completedStudents: completedResult?.c || 0,
      avgScore: avgScoreResult?.avg ? Math.round(avgScoreResult.avg * 10) / 10 : 0,
      totalCoins: totalCoinsResult?.total || 0,
      stations: stationsWithRate,
      ranking: ranking.map((r: any) => ({
        name: r.name,
        coins: r.coins || 0,
        level: r.level || 0
      }))
    })
  } catch (err: any) {
    console.error('获取班级统计失败:', err)
    res.status(500).json({ error: '获取统计数据失败', message: err.message })
  }
})

// GET /api/class/:code/students - 获取班级学生列表和学习进度
router.get('/:code/students', (req, res) => {
  const db = getDatabase()
  const classCode = req.params.code

  try {
    // 获取班级学生及其进度
    const students = db.prepare(`
      SELECT 
        ss.name,
        ss.signed_in,
        ss.signed_at,
        COALESCE(SUM(sp.coins), 0) as total_coins,
        COUNT(DISTINCT sp.level_index) as completed_levels,
        MAX(sp.completed_at) as last_activity
      FROM session_students ss
      LEFT JOIN student_progress sp ON ss.name = sp.student_name AND sp.session_id = ?
      WHERE ss.session_id = (SELECT id FROM sessions WHERE code = ?)
      GROUP BY ss.name
      ORDER BY total_coins DESC, completed_levels DESC
    `).all(classCode, classCode) as any[]

    res.json({ students })
  } catch (err: any) {
    console.error('获取学生列表失败:', err)
    res.status(500).json({ error: '获取学生列表失败', message: err.message })
  }
})

export default router
