import { Router } from 'express'
import { getDatabase } from '../database'
const router = Router()

// Generate a random 3-digit room code
function generateRoomCode(): string {
  return String(Math.floor(Math.random() * 900) + 100)
}

// GET /api/contest (list all contests)
router.get('/', (_req, res) => {
  const db = getDatabase()
  const contests = db.prepare('SELECT * FROM contests ORDER BY created_at DESC').all()
  res.json({ contests })
})

// POST /api/contest/create
router.post('/create', (req, res) => {
  const db = getDatabase()
  const { roomName, questionIds } = req.body

  // Generate unique 3-digit room code
  let roomCode = generateRoomCode()
  let attempts = 0
  while (db.prepare('SELECT id FROM contests WHERE room_code = ? AND status != ?').get(roomCode, 'finished') && attempts < 50) {
    roomCode = generateRoomCode()
    attempts++
  }

  const result = db.prepare(
    'INSERT INTO contests (room_code, room_name, questions) VALUES (?, ?, ?)'
  ).run(roomCode, roomName || '密码挑战赛', JSON.stringify(questionIds || []))

  res.json({
    roomCode,
    roomName: roomName || '密码挑战赛',
    contestId: result.lastInsertRowid,
    message: 'Contest room created',
  })
})

// POST /api/contest/join
router.post('/join', (req, res) => {
  const db = getDatabase()
  const { roomCode, nickname } = req.body

  if (!roomCode || !nickname) {
    return res.status(400).json({ error: 'Missing roomCode or nickname' })
  }

  const contest = db.prepare('SELECT * FROM contests WHERE room_code = ?').get(roomCode) as any
  if (!contest) {
    return res.status(404).json({ error: 'Contest room not found' })
  }

  if (contest.status === 'finished') {
    return res.status(400).json({ error: 'Contest already finished' })
  }

  const result = db.prepare(
    'INSERT INTO participants (contest_id, nickname) VALUES (?, ?)'
  ).run(contest.id, nickname)

  res.json({
    participantId: result.lastInsertRowid,
    roomCode,
    roomName: contest.room_name,
    message: `Joined room ${roomCode} as ${nickname}`,
  })
})

// GET /api/contest/status?roomCode=XXX
router.get('/status', (req, res) => {
  const db = getDatabase()
  const { roomCode } = req.query

  if (!roomCode) {
    return res.status(400).json({ error: 'Missing roomCode' })
  }

  const contest = db.prepare('SELECT * FROM contests WHERE room_code = ?').get(roomCode) as any
  if (!contest) {
    return res.status(404).json({ error: 'Contest room not found' })
  }

  const questionIds = JSON.parse(contest.questions)
  const questions = questionIds.length > 0
    ? db.prepare(`SELECT id, type, question, difficulty, word_length FROM exercises WHERE id IN (${questionIds.map(() => '?').join(',')})`).all(...questionIds)
    : []

  const participants = db.prepare(
    'SELECT id, nickname, score, attempts FROM participants WHERE contest_id = ? ORDER BY score DESC'
  ).all(contest.id)

  res.json({
    contest: {
      id: contest.id,
      roomCode: contest.room_code,
      roomName: contest.room_name,
      status: contest.status,
      currentIndex: contest.current_index,
      totalQuestions: questionIds.length,
    },
    questions,
    participants,
  })
})

// POST /api/contest/start
router.post('/start', (req, res) => {
  const db = getDatabase()
  const { roomCode } = req.body

  db.prepare('UPDATE contests SET status = ? WHERE room_code = ?').run('active', roomCode)
  res.json({ message: 'Contest started', status: 'active' })
})

// POST /api/contest/submit
router.post('/submit', (req, res) => {
  const db = getDatabase()
  const { participantId, roomCode, questionIndex, answer } = req.body

  const participant = db.prepare('SELECT * FROM participants WHERE id = ?').get(participantId) as any
  if (!participant) {
    return res.status(404).json({ error: 'Participant not found' })
  }

  const contest = db.prepare('SELECT * FROM contests WHERE room_code = ?').get(roomCode) as any
  if (!contest) {
    return res.status(404).json({ error: 'Contest not found' })
  }

  // Check attempt limit (max 3 per question)
  const attempts = db.prepare(
    'SELECT COUNT(*) as c FROM submissions WHERE participant_id = ? AND question_index = ?'
  ).get(participantId, questionIndex) as { c: number }

  if (attempts.c >= 3) {
    return res.status(400).json({ error: '已达到最大尝试次数（3次）' })
  }

  const questionIds = JSON.parse(contest.questions)
  const questionId = questionIds[questionIndex]
  const question = db.prepare('SELECT * FROM exercises WHERE id = ?').get(questionId) as any

  if (!question) {
    return res.status(404).json({ error: 'Question not found' })
  }

  const correct = question.answer.toUpperCase().trim() === answer.toUpperCase().trim()

  // Record submission
  db.prepare(
    'INSERT INTO submissions (participant_id, question_index, answer, is_correct, attempt_number) VALUES (?, ?, ?, ?, ?)'
  ).run(participantId, questionIndex, answer, correct ? 1 : 0, attempts.c + 1)

  // Update participant score if correct
  if (correct) {
    db.prepare('UPDATE participants SET score = score + 1, attempts = attempts + 1 WHERE id = ?').run(participantId)
  } else {
    db.prepare('UPDATE participants SET attempts = attempts + 1 WHERE id = ?').run(participantId)
  }

  res.json({
    correct,
    feedback: correct ? '✅ 回答正确！' : `❌ 回答错误。还可尝试 ${2 - attempts.c} 次。`,
    correctAnswer: correct ? null : question.answer,
    attemptsUsed: attempts.c + 1,
  })
})

// GET /api/contest/ranking?roomCode=XXX
router.get('/ranking', (req, res) => {
  const db = getDatabase()
  const { roomCode } = req.query

  const contest = db.prepare('SELECT * FROM contests WHERE room_code = ?').get(roomCode) as any
  if (!contest) {
    return res.status(404).json({ error: 'Contest room not found' })
  }

  const ranking = db.prepare(
    'SELECT nickname, score, attempts FROM participants WHERE contest_id = ? ORDER BY score DESC, attempts ASC'
  ).all(contest.id)

  res.json({ ranking, roomName: contest.room_name })
})

// DELETE /api/contest/:id
router.delete('/:id', (req, res) => {
  try {
    const db = getDatabase()
    const contest = db.prepare('SELECT id FROM contests WHERE id = ?').get(req.params.id) as any
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' })
    }
    db.prepare('DELETE FROM submissions WHERE participant_id IN (SELECT id FROM participants WHERE contest_id = ?)').run(req.params.id)
    db.prepare('DELETE FROM participants WHERE contest_id = ?').run(req.params.id)
    db.prepare('DELETE FROM contests WHERE id = ?').run(req.params.id)
    res.json({ message: 'Contest deleted' })
  } catch (err: any) {
    console.error('Error deleting contest:', err)
    res.status(500).json({ error: 'Failed to delete contest', message: err.message })
  }
})

// POST /api/contest/:id/stop
router.post('/:id/stop', (req, res) => {
  try {
    const db = getDatabase()
    const contest = db.prepare('SELECT id FROM contests WHERE id = ?').get(req.params.id) as any
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' })
    }
    db.prepare('UPDATE contests SET status = ? WHERE id = ?').run('finished', req.params.id)
    res.json({ message: 'Contest stopped', status: 'finished' })
  } catch (err: any) {
    console.error('Error stopping contest:', err)
    res.status(500).json({ error: 'Failed to stop contest', message: err.message })
  }
})

export default router
