import { Router } from 'express'
import { getDatabase } from '../database'

const router = Router()

// GET /api/content/:section
router.get('/:section', (req, res) => {
  const db = getDatabase()
  const content = db.prepare('SELECT * FROM content WHERE section = ?').get(req.params.section) as any
  if (!content) {
    return res.status(404).json({ error: 'Content not found' })
  }
  res.json({
    section: content.section,
    title: content.title,
    body: content.body,
    mediaUrls: JSON.parse(content.media_urls || '[]'),
    sortOrder: content.sort_order,
    updatedAt: content.updated_at,
  })
})

// GET /api/content (list all)
router.get('/', (_req, res) => {
  const db = getDatabase()
  const contents = db.prepare('SELECT section, title, sort_order, updated_at FROM content ORDER BY sort_order').all()
  res.json({ contents })
})

// PUT /api/content/:section
router.put('/:section', (req, res) => {
  const db = getDatabase()
  const { title, body, media_urls, sort_order } = req.body

  const existing = db.prepare('SELECT * FROM content WHERE section = ?').get(req.params.section)
  if (existing) {
    db.prepare(
      'UPDATE content SET title=?, body=?, media_urls=?, sort_order=?, updated_at=CURRENT_TIMESTAMP WHERE section=?'
    ).run(title, body, JSON.stringify(media_urls || []), sort_order, req.params.section)
    res.json({ message: 'Content updated' })
  } else {
    db.prepare(
      'INSERT INTO content (section, title, body, media_urls, sort_order) VALUES (?, ?, ?, ?, ?)'
    ).run(req.params.section, title, body, JSON.stringify(media_urls || []), sort_order || 0)
    res.json({ message: 'Content created' })
  }
})

// POST /api/content
router.post('/', (req, res) => {
  const db = getDatabase()
  const { section, title, body, media_urls, sort_order } = req.body

  if (!section || !title) {
    return res.status(400).json({ error: 'Missing section or title' })
  }

  db.prepare(
    'INSERT INTO content (section, title, body, media_urls, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).run(section, title, body || '', JSON.stringify(media_urls || []), sort_order || 0)

  res.json({ message: 'Content created' })
})

export default router
