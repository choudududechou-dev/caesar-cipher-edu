/**
 * seed-quanzhou.ts
 *
 * Reads public/data/quanzhou-sites.json and seeds the database with
 * Quanzhou-themed Caesar-cipher challenge exercises.
 *
 * For each site:
 *  - Picks a random shift (1–25)
 *  - Encrypts the English name
 *  - Creates a challenge exercise where the student must decrypt
 *
 * Usage:
 *   npx tsx server/seed-quanzhou.ts
 */

import Database from 'better-sqlite3'
import * as fs from 'fs'
import * as path from 'path'

// --------------- Caesar cipher helpers ---------------

function shiftChar(ch: string, shift: number): string {
  const code = ch.charCodeAt(0)
  if (code >= 65 && code <= 90) {
    return String.fromCharCode(((code - 65 + shift) % 26 + 26) % 26 + 65)
  }
  if (code >= 97 && code <= 122) {
    return String.fromCharCode(((code - 97 + shift) % 26 + 26) % 26 + 97)
  }
  return ch
}

function encrypt(text: string, shift: number): string {
  return text
    .split('')
    .map((ch) => shiftChar(ch, shift))
    .join('')
}

// --------------- Load sites ---------------

interface QuanzhouSite {
  name: string
  englishName?: string
  english?: string
  description?: string
  category?: string
  tags?: string[]
}

function loadSites(): QuanzhouSite[] {
  const jsonPath = path.resolve(__dirname, '..', 'public', 'data', 'quanzhou-sites.json')
  if (!fs.existsSync(jsonPath)) {
    console.warn(`⚠  Sites file not found: ${jsonPath}`)
    console.warn('   Using built-in fallback site list.')
    return getFallbackSites()
  }
  const raw = fs.readFileSync(jsonPath, 'utf-8')
  return JSON.parse(raw)
}

function getFallbackSites(): QuanzhouSite[] {
  // Built-in fallback: 22 UNESCO World Heritage "Quanzhou: Emporium of the World"
  return [
    { name: '开元寺', englishName: 'Kaiyuan Temple', category: '宗教', tags: ['海丝', '佛教', '地标'] },
    { name: '清净寺', englishName: 'Qingjing Mosque', category: '宗教', tags: ['海丝', '伊斯兰教'] },
    { name: '天后宫', englishName: 'Tianhou Temple', category: '宗教', tags: ['海丝', '妈祖', '信仰'] },
    { name: '泉州府文庙', englishName: 'Confucius Temple', category: '文教', tags: ['儒学', '科举'] },
    { name: '老君岩', englishName: 'Lao Tzu Rock Statue', category: '宗教', tags: ['道教', '地标', '清源山'] },
    { name: '伊斯兰教圣墓', englishName: 'Islamic Holy Tombs', category: '宗教', tags: ['海丝', '伊斯兰教'] },
    { name: '九日山摩崖石刻', englishName: 'Jiuri Mountain Carvings', category: '文化', tags: ['海丝', '石刻'] },
    { name: '真武庙', englishName: 'Zhenwu Temple', category: '宗教', tags: ['海丝', '道教'] },
    { name: '洛阳桥', englishName: 'Luoyang Bridge', category: '建筑', tags: ['海丝', '古桥', '地标'] },
    { name: '安平桥', englishName: 'Anping Bridge', category: '建筑', tags: ['海丝', '古桥'] },
    { name: '草庵摩尼教遗址', englishName: 'Caoan Manichaean Temple', category: '宗教', tags: ['海丝', '摩尼教'] },
    { name: '磁灶窑址', englishName: 'Cizao Kilns', category: '工艺', tags: ['海丝', '陶瓷'] },
    { name: '德化窑址', englishName: 'Dehua Kilns', category: '工艺', tags: ['海丝', '陶瓷', '白瓷'] },
    { name: '石湖码头', englishName: 'Shihu Dock', category: '交通', tags: ['海丝', '港口'] },
    { name: '江口码头', englishName: 'Jiangkou Dock', category: '交通', tags: ['海丝', '港口'] },
    { name: '六胜塔', englishName: 'Liusheng Pagoda', category: '建筑', tags: ['海丝', '航标'] },
    { name: '万寿塔', englishName: 'Wanshou Pagoda', category: '建筑', tags: ['海丝', '航标'] },
    { name: '顺济桥遗址', englishName: 'Shunji Bridge Ruins', category: '建筑', tags: ['海丝', '古桥'] },
    { name: '市舶司遗址', englishName: 'Maritime Trade Office', category: '行政', tags: ['海丝', '贸易'] },
    { name: '南外宗正司遗址', englishName: 'Southern Imperial Clan Office', category: '行政', tags: ['海丝', '宋元'] },
    { name: '天后宫德济门遗址', englishName: 'Deji Gate Ruins', category: '建筑', tags: ['海丝', '城门'] },
    { name: '泉州海外交通史博物馆', englishName: 'Maritime Museum', category: '文教', tags: ['海丝', '博物馆'] },
  ]
}

// --------------- Seed logic ---------------

function seed(db: Database.Database) {
  console.log('🌊 Seeding Quanzhou-themed Caesar cipher exercises…\n')

  const sites = loadSites()
  let inserted = 0

  const insert = db.prepare(`
    INSERT OR IGNORE INTO exercises (question, answer, hint, type, tags, shift)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  // Also try an alternative schema without the 'shift' column
  let hasShiftColumn = true
  try {
    db.prepare(`SELECT shift FROM exercises LIMIT 0`).all()
  } catch {
    hasShiftColumn = false
  }

  for (const site of sites) {
    const englishName = site.englishName || site.english
    if (!englishName) {
      console.warn(`  ⚠  Skipping "${site.name}" — no English name found`)
      continue
    }

    const shift = Math.floor(Math.random() * 25) + 1 // 1–25
    const encrypted = encrypt(englishName, shift)

    // Question asks student to decrypt a famous Quanzhou site's English name
    const question = `🔐 挑战：下面这段密文是泉州一处世界遗产的英文名称，请解密它（凯撒密码，偏移量未知）：
"${encrypted}"
提示：这是"${site.name}"的英文名。`

    const hint = `${site.name}的英文名是 ${englishName}（${englishName.length} 个字符，不含空格${englishName.length}个字符）。试着判断偏移量！`
    const tags = JSON.stringify([...(site.tags || []), '泉州', '挑战'])

    try {
      if (hasShiftColumn) {
        insert.run(question, englishName, hint, 'challenge', tags, shift)
      } else {
        // Fallback: insert without shift column
        db.prepare(`
          INSERT OR IGNORE INTO exercises (question, answer, hint, type, tags)
          VALUES (?, ?, ?, ?, ?)
        `).run(question, englishName, hint, 'challenge', tags)
      }
      inserted++
      console.log(`  ✅ ${site.name}  →  shift=${shift}  "${encrypted}"`)
    } catch (err: any) {
      console.warn(`  ❌ ${site.name}: ${err.message}`)
    }
  }

  console.log(`\n📊  Inserted ${inserted} Quanzhou-themed challenge exercises.`)
}

// --------------- Entry point ---------------

function main() {
  const dbPath = path.resolve(__dirname, '..', 'data', 'caesar-cipher.db')
  console.log(`📂 Database: ${dbPath}`)

  const db = new Database(dbPath)

  // Enable WAL mode for concurrent access
  db.pragma('journal_mode = WAL')

  // Ensure exercises table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      hint TEXT,
      type TEXT DEFAULT 'basic',
      tags TEXT DEFAULT '[]',
      shift INTEGER,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `)

  seed(db)
  db.close()
  console.log('\n✨ Done!')
}

main()
