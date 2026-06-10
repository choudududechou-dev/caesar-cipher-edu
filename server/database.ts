import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', 'data', 'caesar-cipher.db')

let db: Database.Database

export function getDatabase(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function initDatabase(): void {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Checkpoint any unmerged WAL data from previous runs
  try {
    db.pragma('wal_checkpoint(RESTART)')
  } catch {
    // If checkpoint fails (e.g., corrupted WAL), the WAL will be ignored by SQLite
    console.warn('⚠ WAL checkpoint failed — if sessions are missing, delete data/caesar-cipher.db-wal and data/caesar-cipher.db-shm')
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      body TEXT DEFAULT '',
      media_urls TEXT DEFAULT '[]',
      sort_order INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL DEFAULT 'basic',
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      hint TEXT DEFAULT '',
      difficulty INTEGER DEFAULT 1,
      tags TEXT DEFAULT '[]',
      word_length INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_code TEXT UNIQUE NOT NULL,
      room_name TEXT NOT NULL,
      status TEXT DEFAULT 'waiting',
      questions TEXT DEFAULT '[]',
      current_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contest_id INTEGER NOT NULL REFERENCES contests(id),
      nickname TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      attempts INTEGER DEFAULT 0,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER NOT NULL REFERENCES participants(id),
      question_index INTEGER NOT NULL,
      answer TEXT NOT NULL,
      is_correct INTEGER DEFAULT 0,
      attempt_number INTEGER DEFAULT 1,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS learning_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      activity_data TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

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

    CREATE TABLE IF NOT EXISTS student_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      level_index INTEGER NOT NULL,
      station_name TEXT NOT NULL,
      correct_count INTEGER NOT NULL DEFAULT 0,
      total_count INTEGER NOT NULL DEFAULT 0,
      coins INTEGER NOT NULL DEFAULT 0,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(session_id, student_name, level_index)
    );

    CREATE TABLE IF NOT EXISTS student_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      finished_at DATETIME,
      total_coins INTEGER DEFAULT 0,
      finished_levels INTEGER DEFAULT 0
    );
  `)

  // Seed default content if empty
  const count = db.prepare('SELECT COUNT(*) as c FROM content').get() as { c: number }
  if (count.c === 0) {
    seedContent()
  }

  // Seed default exercises if empty
  const exCount = db.prepare('SELECT COUNT(*) as c FROM exercises').get() as { c: number }
  if (exCount.c === 0) {
    seedExercises()
  }

  console.log('✅ Database initialized at ' + DB_PATH)
}

function seedContent(): void {
  const insert = db.prepare(
    'INSERT INTO content (section, title, body, media_urls, sort_order) VALUES (?, ?, ?, ?, ?)'
  )

  const defaultContent = [
    ['intro', '情境导入：刺桐港的密信',
      '<p>宋元时期，泉州（古称刺桐）是世界上最繁华的港口之一。满载丝绸、瓷器的商船从这里出发，驶向遥远的亚历山大港。船队需要传递机密信息——货物清单、航线、价格——这些绝不能落入海盗和竞争对手之手。</p><p>如果你是船长，如何确保你的信息只有远方的伙伴能看懂？</p>',
      '[]', 1],
    ['timeline', '密码进化史',
      '<p>从古罗马的凯撒密码，到现代的量子加密，人类保护信息的智慧不断进化。</p>',
      '[]', 2],
    ['modern', '现代密码应用',
      '<p>今天，密码已经渗透到我们生活的方方面面。从手机解锁到网上支付，加密技术守护着我们的数字生活。</p>',
      '[]', 3],
  ]

  for (const c of defaultContent) {
    insert.run(...c)
  }
}

function seedExercises(): void {
  const insert = db.prepare(
    'INSERT INTO exercises (type, question, answer, hint, difficulty, tags, word_length) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )

  const defaultExercises = [
    ['basic', '用偏移量3加密单词"HELLO"', 'KHOOR', '每个字母向后移动3位：H→K, E→H, L→O, L→O, O→R', 1, '["basic"]', null],
    ['basic', '用偏移量5加密单词"CAESAR"', 'HFJXFW', '每个字母向后移动5位', 1, '["basic"]', null],
    ['basic', '解密偏移量3的密文"KHOOR"，还原明文', 'HELLO', '每个字母向前移动3位', 1, '["basic"]', null],
    ['basic', '偏移量7加密"COMPUTER"', 'JVTWBYL', '注意：C→J, O→V, M→T...', 2, '["basic"]', null],
    ['challenge', '密文"FDW"，偏移量未知，请破解（提示：常见英语单词）', 'CAT', '一个常见的英语单词', 2, '["challenge"]', 3],
    ['challenge', '密文"HSK"，偏移量未知，请破解（提示：常见英语单词）', 'DOG', '一个常见的英语单词', 2, '["challenge"]', 3],
    ['challenge', '密文"XZS"，偏移量未知，请破解（提示：常见英语单词）', 'SUN', '一个常见的英语单词', 2, '["challenge"]', 3],
    ['challenge', '密文"ILVK"，偏移量未知，请破解（提示：常见英语单词）', 'FISH', '一个常见的英语单词', 2, '["challenge"]', 4],
    ['challenge', '密文"UVCT"，偏移量未知，请破解（提示：常见英语单词）', 'STAR', '一个常见的英语单词', 2, '["challenge"]', 4],
  ]

  for (const e of defaultExercises) {
    insert.run(...e)
  }
}

export { db }
