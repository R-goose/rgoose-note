/**
 * 自动迁移：首次启动建表 + 种子数据 + 增量补列
 * 通过 PRAGMA user_version 记录迁移版本
 */

const fs = require('fs')
const path = require('path')

const CURRENT_VER = 5

/**
 * 对已存在的 blocks 表补齐缺失列（v1 → v2）
 * CREATE TABLE IF NOT EXISTS 不会更新已存在的表结构，需用 ALTER 补齐
 */
function ensureBlockColumns(db) {
  const cols = db.prepare("PRAGMA table_info(blocks)").all().map(c => c.name)
  const additions = [
    { name: 'code',            type: 'TEXT' },
    { name: 'codeLang',        type: 'TEXT' },
    { name: 'calloutType',     type: 'TEXT' },
    { name: 'formula',         type: 'TEXT' },
    { name: 'tableData',       type: 'TEXT' },
    { name: 'tableAnalysis',   type: 'INTEGER' },
    { name: 'label',           type: 'TEXT' },
    { name: 'value',           type: 'INTEGER' },
    { name: 'mode',            type: 'TEXT' },
    { name: 'date',            type: 'INTEGER' },
    { name: 'done',            type: 'INTEGER' },
    { name: 'desc',            type: 'TEXT' },
    { name: 'linkedNoteId',    type: 'TEXT' },
    { name: 'linkedBlockId',   type: 'TEXT' },
    { name: 'linkedTextRange', type: 'TEXT' }
  ]
  for (const col of additions) {
    if (!cols.includes(col.name)) {
      // desc / date 是 SQL 保留字，必须用双引号
      db.exec(`ALTER TABLE blocks ADD COLUMN "${col.name}" ${col.type}`)
    }
  }
}

/** 对 notes 表补齐 tags / canvasConfig / pinned 列（旧库兼容） */
function ensureNoteColumns(db) {
  const cols = db.prepare("PRAGMA table_info(notes)").all().map(c => c.name)
  if (!cols.includes('tags')) {
    db.exec(`ALTER TABLE notes ADD COLUMN tags TEXT`)
  }
  if (!cols.includes('canvasConfig')) {
    db.exec(`ALTER TABLE notes ADD COLUMN canvasConfig TEXT`)
  }
  if (!cols.includes('pinned')) {
    db.exec(`ALTER TABLE notes ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0`)
  }
}

/** 对 images 表补齐 displayName + tags + contentHash 列（旧库兼容） */
function ensureImageColumns(db) {
  const cols = db.prepare("PRAGMA table_info(images)").all().map(c => c.name)
  if (!cols.includes('displayName')) {
    db.exec(`ALTER TABLE images ADD COLUMN displayName TEXT`)
  }
  if (!cols.includes('tags')) {
    db.exec(`ALTER TABLE images ADD COLUMN tags TEXT DEFAULT '[]'`)
  }
  if (!cols.includes('contentHash')) {
    db.exec(`ALTER TABLE images ADD COLUMN contentHash TEXT`)
  }
  // 对 contentHash 的索引必须在此（补列之后）创建。
  // 若放在 schema.sql 中，会对旧库中尚不存在该列的 images 表建索引而报错，
  // 导致整个 runMigrations 抛异常、后端启动失败（表现为新装应用/覆盖升级后无任何数据）。
  db.exec(`CREATE INDEX IF NOT EXISTS idx_images_hash ON images(contentHash)`)
}

/** 对已存在的 templates 表补齐 isBuiltin 列（旧库兼容） */
function ensureTemplateColumns(db) {
  const cols = db.prepare("PRAGMA table_info(templates)").all().map(c => c.name)
  if (!cols.includes('isBuiltin')) {
    db.exec(`ALTER TABLE templates ADD COLUMN isBuiltin INTEGER NOT NULL DEFAULT 0`)
  }
}

/** 对已存在的 connections 表补齐 updatedAt 列（旧库兼容） */
function ensureConnectionColumns(db) {
  const cols = db.prepare("PRAGMA table_info(connections)").all().map(c => c.name)
  if (!cols.includes('updatedAt')) {
    db.exec(`ALTER TABLE connections ADD COLUMN updatedAt INTEGER NOT NULL DEFAULT 0`)
  }
}

/**
 * 清理无效主键行（v3）
 * SQLite 的 TEXT PRIMARY KEY 允许 NULL，历史测试数据曾写入 id=NULL 的笔记，
 * 该数据流到前端会令渲染函数崩溃（白屏）。幂等操作，干净库为 no-op。
 */
function purgeInvalidRows(db) {
  db.exec(`
    DELETE FROM notes       WHERE id IS NULL OR id = '';
    DELETE FROM folders     WHERE id IS NULL OR id = '';
    DELETE FROM blocks      WHERE id IS NULL OR id = '' OR noteId IS NULL OR noteId = '';
    DELETE FROM connections WHERE id IS NULL OR id = '' OR noteId IS NULL OR noteId = '';
    DELETE FROM tags       WHERE id IS NULL OR id = '';
    DELETE FROM images      WHERE id IS NULL OR id = '';
    DELETE FROM templates   WHERE id IS NULL OR id = '';
  `)
}

function runMigrations(db) {
  // 1. 建表脚本（幂等）
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8')
  db.exec(schema)

  // 2. 对已存在的表补齐缺失列（兼容旧库）
  ensureBlockColumns(db)
  ensureNoteColumns(db)
  ensureImageColumns(db)
  ensureTemplateColumns(db)
  ensureConnectionColumns(db)

  // 3. 清理无效主键行（修复历史毒数据）
  purgeInvalidRows(db)

  // 4. 种子数据（幂等，使用 ON CONFLICT）
  const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8')
  db.exec(seed)

  // 5. 版本号记录
  const ver = db.prepare('PRAGMA user_version').get()
  if (ver.user_version < CURRENT_VER) {
    db.prepare(`PRAGMA user_version = ${CURRENT_VER}`).run()
  }
}

module.exports = { runMigrations, CURRENT_VER }
