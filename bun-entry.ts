// Bun standalone entry — 编译为单文件 EXE
// 预加载 dist/ 到内存，启动 Express 服务器

import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { exec } from 'child_process'

const PORT = 3001

// 编译后用 EXE 所在目录（process.cwd()），开发时用项目根目录
const baseDir = process.cwd()
const distDir = join(baseDir, 'dist')

// 预加载所有静态文件到内存
const staticFiles = new Map<string, { data: Buffer; mime: string }>()

function preloadDir(dir: string, base: string = '') {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const key = base + '/' + entry
    if (statSync(fullPath).isDirectory()) {
      preloadDir(fullPath, key)
    } else {
      const ext = extname(entry).toLowerCase()
      const mimeTypes: Record<string, string> = {
        '.html': 'text/html', '.js': 'application/javascript',
        '.css': 'text/css', '.json': 'application/json',
        '.png': 'image/png', '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml', '.mp4': 'video/mp4',
        '.webm': 'video/webm', '.ico': 'image/x-icon',
        '.woff2': 'font/woff2', '.woff': 'font/woff',
      }
      staticFiles.set(key, { data: readFileSync(fullPath), mime: mimeTypes[ext] || 'application/octet-stream' })
    }
  }
}

preloadDir(distDir)
// 暴露给 Express 的内存文件服务中间件
;(globalThis as any).__staticFiles = staticFiles
console.log(`📦 预加载 ${staticFiles.size} 个静态文件`)

// 启动服务器
async function start() {
  const { default: app } = await import('./server/index')

  // 自动打开浏览器
  const url = `http://localhost:${PORT}/#/student`
  const platform = process.platform
  const cmd = platform === 'win32' ? `start "" "${url}"` : platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`
  setTimeout(() => exec(cmd), 1000)
}

start()
