/**
 * SQLite 连接管理（单例）
 * WAL 模式提升并发读写性能；NORMAL 同步级别平衡性能与安全
 */

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

let db = null

function getDb(dataDir) {
  if (db) return db

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  const dbPath = path.join(dataDir, 'rgoose.db')
  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('synchronous = NORMAL')

  return db
}

function closeDb() {
  if (db) {
    try { db.pragma('optimize') } catch (_) {}
    db.close()
    db = null
  }
}

/** 触发 WAL checkpoint，把 WAL 数据合并到主 db 文件 */
function checkpoint() {
  if (db) {
    try { db.pragma('wal_checkpoint(TRUNCATE)') } catch (_) {}
  }
}

module.exports = { getDb, closeDb, checkpoint }
