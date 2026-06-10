// 运行时自适应：Node.js → better-sqlite3 / Bun → bun:sqlite
import path from 'path'
import fs from 'fs'

// 统一用 process.cwd()，开发/编译模式均适用
const DATA_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DATA_DIR, 'caesar-cipher.db')

let db: any

function createBetterSQLite() {
  const Database = require('better-sqlite3')
  const d = new Database(DB_PATH)
  d.pragma('journal_mode = WAL')
  d.pragma('foreign_keys = ON')
  return d
}

function createBunSQLite() {
  const { Database } = require('bun:sqlite') as any
  const d = new Database(DB_PATH)
  d.run('PRAGMA journal_mode = WAL')
  d.run('PRAGMA foreign_keys = ON')
  return d
}

function isBun(): boolean {
  return typeof (globalThis as any).Bun !== 'undefined'
}

export function getDatabase(): any {
  if (!db) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    db = isBun() ? createBunSQLite() : createBetterSQLite()
  }
  return db
}

export function initDatabase(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

  db = isBun() ? createBunSQLite() : createBetterSQLite()

  // WAL checkpoint - only for better-sqlite3
  if (!isBun()) {
    try { db.pragma('wal_checkpoint(RESTART)') } catch { console.warn('⚠ WAL checkpoint failed') }
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

  const count = db.prepare('SELECT COUNT(*) as c FROM content').get() as { c: number }
  if (count.c === 0) seedContent()

  const exCount = db.prepare('SELECT COUNT(*) as c FROM exercises').get() as { c: number }
  if (exCount.c === 0) seedExercises()

  console.log('✅ Database initialized at ' + DB_PATH)
}

function seedContent(): void {
  const insert = db.prepare('INSERT INTO content (section, title, body, media_urls, sort_order) VALUES (?, ?, ?, ?, ?)')
  const items = [
    ['intro', '情境导入：刺桐港的密信', '<p>宋元时期，泉州（古称刺桐）是世界上最繁华的港口之一…</p>', '[]', 1],
    ['timeline', '密码进化史', '<p>从古罗马的凯撒密码，到现代的量子加密…</p>', '[]', 2],
    ['modern', '现代密码应用', '<p>今天，密码已经渗透到我们生活的方方面面…</p>', '[]', 3],
  ]
  for (const c of items) insert.run(...c)
}

function seedExercises(): void {
  const insert = db.prepare('INSERT INTO exercises (type, question, answer, hint, difficulty, tags, word_length) VALUES (?, ?, ?, ?, ?, ?, ?)')
  const items = [
    ['basic', '用偏移量3加密单词"HELLO"', 'KHOOR', '每个字母向后移动3位', 1, '["basic"]', null],
    ['basic', '用偏移量5加密单词"CAESAR"', 'HFJXFW', '每个字母向后移动5位', 1, '["basic"]', null],
    ['basic', '解密偏移量3的密文"KHOOR"', 'HELLO', '每个字母向前移动3位', 1, '["basic"]', null],
    ['challenge', '密文"FDW"，偏移量未知，请破解', 'CAT', '常见英语单词', 2, '["challenge"]', 3],
    ['challenge', '密文"HSK"，偏移量未知，请破解', 'DOG', '常见英语单词', 2, '["challenge"]', 3],
  ]
  for (const e of items) insert.run(...e)
}

export { db }
