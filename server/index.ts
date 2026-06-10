import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDatabase } from './database'
import cipherRoutes from './routes/cipher'
import exerciseRoutes from './routes/exercises'
import contestRoutes from './routes/contest'
import contentRoutes from './routes/content'
import mediaRoutes from './routes/media'
import statsRoutes from './routes/stats'
import sessionRoutes from './routes/session'
import progressRoutes from './routes/progress'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Initialize database
initDatabase()

// API routes
app.use('/api/cipher', cipherRoutes)
app.use('/api/exercises', exerciseRoutes)
app.use('/api/contest', contestRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/media', mediaRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/session', sessionRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/class', progressRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Serve built frontend (production) or proxy fallback
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))
// SPA fallback: all non-API routes → index.html
app.get(/^\/(?!api\/|embed\/|uploads\/|videos\/|images\/).*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error', message: err.message || 'Unknown error' })
})

app.listen(PORT, () => {
  console.log(`\n🔐 凯撒密码教学系统 v1.0`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`  服务地址: http://localhost:${PORT}`)
  console.log(``)
  console.log(`  📱 学生端: http://localhost:${PORT}/#/student`)
  console.log(`  👨‍🏫 教师端: http://localhost:${PORT}/#/teacher`)
  console.log(`  ⚙️  管理端: http://localhost:${PORT}/#/admin`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
})

export default app
