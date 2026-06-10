// 独立启动脚本 —— 启动后端 + 自动打开浏览器

import { exec } from 'child_process'
import { createServer } from 'http'

const PORT = 3001
const BASE = `http://localhost:${PORT}`

// 动态导入 Express app（因为它依赖 better-sqlite3 等模块）
async function start() {
  console.log('正在启动凯撒密码教学系统...\n')

  const { default: app } = await import('./server/index.ts')

  // 自动打开浏览器
  const url = process.argv[2] === 'teacher'
    ? `${BASE}/#/teacher`
    : process.argv[2] === 'admin'
      ? `${BASE}/#/admin`
      : `${BASE}/#/student`

  const platform = process.platform
  const cmd = platform === 'win32'
    ? `start "" "${url}"`
    : platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`

  setTimeout(() => exec(cmd), 1500)
}

start().catch(err => {
  console.error('启动失败:', err)
  process.exit(1)
})
