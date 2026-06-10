import { Router } from 'express'
import { getDatabase } from '../database'

const router = Router()

// GET /api/stats/overview
router.get('/overview', (_req, res) => {
  const db = getDatabase()

  const totalExercises = (db.prepare('SELECT COUNT(*) as c FROM exercises').get() as any).c
  const totalBasic = (db.prepare("SELECT COUNT(*) as c FROM exercises WHERE type='basic'").get() as any).c
  const totalChallenge = (db.prepare("SELECT COUNT(*) as c FROM exercises WHERE type='challenge'").get() as any).c
  const totalContests = (db.prepare('SELECT COUNT(*) as c FROM contests').get() as any).c
  const totalRecords = (db.prepare('SELECT COUNT(*) as c FROM learning_records').get() as any).c

  res.json({
    exercises: { total: totalExercises, basic: totalBasic, challenge: totalChallenge },
    contests: totalContests,
    learningRecords: totalRecords,
  })
})

// GET /api/stats/exercises
router.get('/exercises', (_req, res) => {
  const db = getDatabase()

  // Activity type breakdown
  const activityStats = db.prepare(`
    SELECT activity_type, COUNT(*) as count
    FROM learning_records
    GROUP BY activity_type
    ORDER BY count DESC
  `).all()

  // Recent records
  const recent = db.prepare(
    'SELECT * FROM learning_records ORDER BY created_at DESC LIMIT 50'
  ).all()

  res.json({ activityStats, recentRecords: recent })
})

// POST /api/stats/record (log a learning activity)
router.post('/record', (req, res) => {
  const db = getDatabase()
  const { sessionId, activityType, activityData } = req.body

  db.prepare(
    'INSERT INTO learning_records (session_id, activity_type, activity_data) VALUES (?, ?, ?)'
  ).run(sessionId || 'anonymous', activityType, JSON.stringify(activityData || {}))

  res.json({ message: 'Record logged' })
})

export default router
