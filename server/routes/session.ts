import { Router, Request, Response } from 'express'
import { getDatabase } from '../database'

const router = Router()

// Generate random 6-character alphanumeric code
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// Ensure session tables exist
function ensureSessionTables(): void {
  const db = getDatabase()
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      password TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS session_students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES sessions(id),
      name TEXT NOT NULL,
      signed_in INTEGER DEFAULT 0,
      signed_at DATETIME
    );
  `)
}

// POST /api/session/create
router.post('/create', (req: Request, res: Response) => {
  try {
    ensureSessionTables()
    const db = getDatabase()

    const { password, classCode, studentNames } = req.body as {
      password?: string
      classCode?: string
      studentNames: string[]
    }

    if (!studentNames || !Array.isArray(studentNames) || studentNames.length === 0) {
      res.status(400).json({ error: 'studentNames must be a non-empty array' })
      return
    }

    // Use provided classCode if valid (3 digits), otherwise generate random code
    let code: string
    if (classCode && /^\d{3}$/.test(classCode.trim())) {
      code = classCode.trim()
      // Check for uniqueness of the 3-digit code
      if (db.prepare('SELECT id FROM sessions WHERE code = ?').get(code)) {
        res.status(409).json({ error: '该班级号已有活跃课堂，请先结束旧课堂或使用其他班级号' })
        return
      }
    } else {
      code = generateCode()
      let attempts = 0
      while (db.prepare('SELECT id FROM sessions WHERE code = ?').get(code) && attempts < 20) {
        code = generateCode()
        attempts++
      }
    }

    // Insert session
    const result = db.prepare(
      'INSERT INTO sessions (code, password, status) VALUES (?, ?, ?)'
    ).run(code, password || null, 'active')

    const sessionId = result.lastInsertRowid as number

    // Insert students
    const insertStudent = db.prepare(
      'INSERT INTO session_students (session_id, name, signed_in) VALUES (?, ?, 0)'
    )

    const insertMany = db.transaction((names: string[]) => {
      for (const name of names) {
        const trimmed = name.trim()
        if (trimmed) {
          insertStudent.run(sessionId, trimmed)
        }
      }
    })

    insertMany(studentNames)

    res.json({ code, sessionId })
  } catch (err: any) {
    console.error('Error creating session:', err)
    res.status(500).json({ error: 'Failed to create session', message: err.message })
  }
})

// GET /api/session (list all sessions — teacher class list)
router.get('/', (_req: Request, res: Response) => {
  try {
    ensureSessionTables()
    const db = getDatabase()

    const sessions = db.prepare(`
      SELECT s.id, s.code, s.status, s.created_at,
        (SELECT COUNT(*) FROM session_students WHERE session_id = s.id) as total,
        (SELECT COUNT(*) FROM session_students WHERE session_id = s.id AND signed_in = 1) as signed
      FROM sessions s
      ORDER BY s.created_at DESC
    `).all()

    res.json({ sessions })
  } catch (err: any) {
    console.error('Error listing sessions:', err)
    res.status(500).json({ error: 'Failed to list sessions', message: err.message })
  }
})

// DELETE /api/session/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDatabase()
    const id = Number(req.params.id)
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid session id' })
      return
    }
    const session = db.prepare('SELECT id, code FROM sessions WHERE id = ?').get(id) as any
    if (!session) {
      res.status(404).json({ error: 'Session not found' })
      return
    }
    const code = session.code
    db.prepare('DELETE FROM session_students WHERE session_id = ?').run(id)
    db.prepare('DELETE FROM student_progress WHERE session_id = ?').run(code)
    db.prepare('DELETE FROM student_sessions WHERE session_id = ?').run(code)
    db.prepare('DELETE FROM sessions WHERE id = ?').run(id)
    res.json({ message: 'Session deleted' })
  } catch (err: any) {
    console.error('Error deleting session:', err)
    res.status(500).json({ error: 'Failed to delete session', message: err.message })
  }
})

// GET /api/session/:code
router.get('/:code', (req: Request, res: Response) => {
  try {
    ensureSessionTables()
    const db = getDatabase()

    const session = db.prepare(
      'SELECT id, code, status, created_at FROM sessions WHERE code = ?'
    ).get(req.params.code) as any

    if (!session) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    const students = db.prepare(
      'SELECT id, name, signed_in, signed_at FROM session_students WHERE session_id = ? ORDER BY id'
    ).all(session.id) as any[]

    res.json({
      session: {
        code: session.code,
        status: session.status,
        created_at: session.created_at,
      },
      students: students.map((s: any) => ({
        id: s.id,
        name: s.name,
        signed_in: !!s.signed_in,
        signed_at: s.signed_at,
      })),
    })
  } catch (err: any) {
    console.error('Error getting session:', err)
    res.status(500).json({ error: 'Failed to get session', message: err.message })
  }
})

// POST /api/session/:code/signin
router.post('/:code/signin', (req: Request, res: Response) => {
  try {
    ensureSessionTables()
    const db = getDatabase()

    const { studentId } = req.body as { studentId: number }

    const session = db.prepare(
      'SELECT id, status FROM sessions WHERE code = ?'
    ).get(req.params.code) as any

    if (!session) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    if (session.status === 'locked') {
      res.status(400).json({ error: '签到已锁定，无法再签到' })
      return
    }

    const student = db.prepare(
      'SELECT id, name, signed_in FROM session_students WHERE id = ? AND session_id = ?'
    ).get(studentId, session.id) as any

    if (!student) {
      res.status(404).json({ error: 'Student not found in this session' })
      return
    }

    if (student.signed_in) {
      res.status(400).json({ error: '该学生已签到', alreadySignedIn: true })
      return
    }

    db.prepare(
      'UPDATE session_students SET signed_in = 1, signed_at = datetime(\'now\') WHERE id = ?'
    ).run(studentId)

    res.json({ success: true, name: student.name })
  } catch (err: any) {
    console.error('Error signing in:', err)
    res.status(500).json({ error: 'Failed to sign in', message: err.message })
  }
})

// POST /api/session/:code/unsign
router.post('/:code/unsign', (req: Request, res: Response) => {
  try {
    ensureSessionTables()
    const db = getDatabase()

    const { studentId } = req.body as { studentId: number }

    const session = db.prepare(
      'SELECT id, status FROM sessions WHERE code = ?'
    ).get(req.params.code) as any

    if (!session) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    const student = db.prepare(
      'SELECT id FROM session_students WHERE id = ? AND session_id = ?'
    ).get(studentId, session.id) as any

    if (!student) {
      res.status(404).json({ error: 'Student not found in this session' })
      return
    }

    db.prepare(
      'UPDATE session_students SET signed_in = 0, signed_at = NULL WHERE id = ?'
    ).run(studentId)

    res.json({ success: true })
  } catch (err: any) {
    console.error('Error un-signing:', err)
    res.status(500).json({ error: 'Failed to unsign', message: err.message })
  }
})

// POST /api/session/:code/lock
router.post('/:code/lock', (req: Request, res: Response) => {
  try {
    ensureSessionTables()
    const db = getDatabase()

    const session = db.prepare(
      'SELECT id FROM sessions WHERE code = ?'
    ).get(req.params.code) as any

    if (!session) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    db.prepare(
      'UPDATE sessions SET status = ? WHERE code = ?'
    ).run('locked', req.params.code)

    res.json({ success: true })
  } catch (err: any) {
    console.error('Error locking session:', err)
    res.status(500).json({ error: 'Failed to lock session', message: err.message })
  }
})

export default router
