import { Router } from 'express'
import { getDatabase } from '../database'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const router = Router()

// 配置 multer 存储
const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext
    cb(null, name)
  }
})
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true)
    else cb(new Error('只支持上传视频文件'))
  },
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB
})

// GET /api/media
router.get('/', (_req, res) => {
  const db = getDatabase()
  try { db.exec('ALTER TABLE media ADD COLUMN station_index INTEGER DEFAULT NULL') } catch {}
  try { db.exec('ALTER TABLE media ADD COLUMN file_path TEXT DEFAULT NULL') } catch {}

  const media = db.prepare('SELECT * FROM media ORDER BY created_at DESC').all()
  res.json({ media })
})

// POST /api/media/upload (本地上传视频)
router.post('/upload', upload.single('file'), (req, res) => {
  const db = getDatabase()
  try { db.exec('ALTER TABLE media ADD COLUMN station_index INTEGER DEFAULT NULL') } catch {}
  try { db.exec('ALTER TABLE media ADD COLUMN file_path TEXT DEFAULT NULL') } catch {}

  const file = req.file
  if (!file) return res.status(400).json({ error: '未选择文件' })

  const { title, station_index } = req.body
  const url = '/uploads/' + file.filename

  const result = db.prepare(
    'INSERT INTO media (title, url, type, file_path, station_index, source) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    title || file.originalname,
    url,
    'video',
    file.path,
    station_index != null ? Number(station_index) : null,
    'upload'
  )

  res.json({ id: result.lastInsertRowid, url, message: '视频已上传' })
})

// POST /api/media (URL方式添加)
router.post('/', (req, res) => {
  const db = getDatabase()
  try { db.exec('ALTER TABLE media ADD COLUMN station_index INTEGER DEFAULT NULL') } catch {}
  try { db.exec('ALTER TABLE media ADD COLUMN file_path TEXT DEFAULT NULL') } catch {}

  const { title, url, type, station_index } = req.body
  if (!title || !url) return res.status(400).json({ error: 'Missing title or url' })

  const result = db.prepare(
    'INSERT INTO media (title, url, type, station_index, source) VALUES (?, ?, ?, ?, ?)'
  ).run(title, url, type || 'video', station_index != null ? Number(station_index) : null, 'url')

  res.json({ id: result.lastInsertRowid, message: 'Media added' })
})

// PUT /api/media/:id
router.put('/:id', (req, res) => {
  const db = getDatabase()
  const { title, station_index } = req.body
  db.prepare('UPDATE media SET title=?, station_index=? WHERE id=?')
    .run(title, station_index != null ? Number(station_index) : null, req.params.id)
  res.json({ message: 'Media updated' })
})

// DELETE /api/media/:id
router.delete('/:id', (req, res) => {
  const db = getDatabase()
  const media = db.prepare('SELECT file_path FROM media WHERE id = ?').get(req.params.id) as any
  if (media?.file_path) {
    try { fs.unlinkSync(media.file_path) } catch {}
  }
  db.prepare('DELETE FROM media WHERE id = ?').run(req.params.id)
  res.json({ message: 'Media deleted' })
})

export default router
