import { Router } from 'express'
import { getDatabase } from '../database'
import { encrypt, decrypt } from '../services/cipherService'
import crypto from 'crypto'

const router = Router()

// GET /api/exercises?type=basic|challenge&level=0
router.get('/', (req, res) => {
  const db = getDatabase()
  const { type, tag, level } = req.query

  // Ensure level_index column exists
  try { db.exec('ALTER TABLE exercises ADD COLUMN level_index INTEGER DEFAULT NULL') } catch {}

  let sql = 'SELECT * FROM exercises WHERE 1=1'
  const params: any[] = []

  if (type && type !== 'all') {
    sql += ' AND type = ?'
    params.push(type)
  }

  if (tag) {
    sql += ' AND tags LIKE ?'
    params.push(`%${tag}%`)
  }

  if (level !== undefined && level !== 'all') {
    sql += ' AND level_index = ?'
    params.push(Number(level))
  }

  sql += ' ORDER BY level_index ASC, difficulty ASC, id ASC'
  const exercises = db.prepare(sql).all(...params)
  res.json({ exercises })
})

// GET /api/exercises/:id
router.get('/:id', (req, res) => {
  const db = getDatabase()
  const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id)
  if (!exercise) {
    return res.status(404).json({ error: 'Exercise not found' })
  }
  res.json({ exercise })
})

// POST /api/exercises/check
router.post('/check', (req, res) => {
  const { id, answer } = req.body
  if (!id || !answer) {
    return res.status(400).json({ error: 'Missing id or answer' })
  }

  const db = getDatabase()
  const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(id) as any
  if (!exercise) {
    return res.status(404).json({ error: 'Exercise not found' })
  }

  const correct = exercise.answer.toUpperCase().trim() === answer.toUpperCase().trim()
  res.json({
    correct,
    feedback: correct ? '✅ 回答正确！太棒了！' : `❌ 回答错误。正确答案是：${exercise.answer}`,
    correctAnswer: correct ? null : exercise.answer,
    exercise: {
      id: exercise.id,
      type: exercise.type,
      question: exercise.question,
    },
  })
})

// GET /api/exercises/:id/hint
router.get('/:id/hint', (req, res) => {
  const db = getDatabase()
  const exercise = db.prepare('SELECT id, hint FROM exercises WHERE id = ?').get(req.params.id) as any
  if (!exercise) {
    return res.status(404).json({ error: 'Exercise not found' })
  }
  res.json({ hint: exercise.hint || '暂无提示' })
})

// POST /api/exercises (create new exercise - teacher use)
router.post('/', (req, res) => {
  const db = getDatabase()
  try { db.exec('ALTER TABLE exercises ADD COLUMN level_index INTEGER DEFAULT NULL') } catch {}
  const { type, question, answer, hint, difficulty, tags, word_length, level_index } = req.body

  const result = db.prepare(
    'INSERT INTO exercises (type, question, answer, hint, difficulty, tags, word_length, level_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    type || 'basic',
    question,
    answer,
    hint || '',
    difficulty || 1,
    JSON.stringify(tags || []),
    word_length || null,
    level_index ?? null
  )

  res.json({ id: result.lastInsertRowid, message: 'Exercise created' })
})

// PUT /api/exercises/:id (update exercise)
router.put('/:id', (req, res) => {
  const db = getDatabase()
  try { db.exec('ALTER TABLE exercises ADD COLUMN level_index INTEGER DEFAULT NULL') } catch {}
  const { type, question, answer, hint, difficulty, tags, word_length, level_index } = req.body

  db.prepare(
    'UPDATE exercises SET type=?, question=?, answer=?, hint=?, difficulty=?, tags=?, word_length=?, level_index=? WHERE id=?'
  ).run(
    type, question, answer, hint || '', difficulty || 1, JSON.stringify(tags || []), word_length || null,
    level_index ?? null, req.params.id
  )

  res.json({ message: 'Exercise updated' })
})

// DELETE /api/exercises/:id
router.delete('/:id', (req, res) => {
  const db = getDatabase()
  db.prepare('DELETE FROM exercises WHERE id = ?').run(req.params.id)
  res.json({ message: 'Exercise deleted' })
})

export default router
