/**
 * 数据同步/导入/清空业务
 * 对照 Java SyncService.java
 */

const folderDao = require('../dao/folderDao')
const noteDao = require('../dao/noteDao')
const blockDao = require('../dao/blockDao')
const connectionDao = require('../dao/connectionDao')
const planDao = require('../dao/planDao')
const tagDao = require('../dao/tagDao')
const { getDb } = require('../db/connection')
const { now } = require('../common/utils')

module.exports = {
  /** 增量/全量拉取。since <= 0 表示全量 */
  pull(since = 0) {
    const incremental = since > 0
    // 全量场景只返回未软删数据；增量场景返回所有变更（含 tombstone，供客户端同步删除）
    const folders = incremental ? folderDao.listSince(since)    : folderDao.listAll().filter(f => !f.deleted)
    const notes   = incremental ? noteDao.listSince(since)      : noteDao.listAll().filter(n => !n.deleted)
    const plans   = incremental ? planDao.listSince(since)      : planDao.listAll()
    const tags    = incremental ? tagDao.listSince(since)       : tagDao.listAll()

    // blocks/connections 是子资源，无独立 since；增量时按 noteId 反查
    let blocks, connections
    if (incremental) {
      const noteIds = notes.map(n => n.id)
      if (noteIds.length === 0) {
        blocks = []
        connections = []
      } else {
        blocks = blockDao.listByNoteIds(noteIds)
        connections = connectionDao.listByNoteIds(noteIds)
      }
    } else {
      // 全量时按未删除 note 过滤，避免返回孤儿 block
      const validNoteIds = new Set(notes.map(n => n.id))
      blocks = blockDao.listAll().filter(b => validNoteIds.has(b.noteId))
      connections = connectionDao.listAll().filter(c => validNoteIds.has(c.noteId))
    }

    return { serverTime: now(), folders, notes, plans, tags, blocks, connections }
  },

  /** 数据导入，按 updatedAt LWW 合并 */
  importAll(data) {
    const db = getDb()
    const tx = db.transaction(() => {
      mergeAll(folderDao, data.folders)
      mergeAll(noteDao, data.notes)
      mergeAll(planDao, data.plans)
      mergeAll(tagDao, data.tags)
    })
    tx()
  },

  /** 清空全部业务数据（物理删除） */
  clearAll() {
    const db = getDb()
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM connections').run()
      db.prepare('DELETE FROM blocks').run()
      db.prepare('DELETE FROM notes').run()
      db.prepare('DELETE FROM plans').run()
      db.prepare('DELETE FROM tags').run()
      db.prepare('DELETE FROM folders').run()
    })
    tx()
  }
}

/** 通用 LWW 合并：不存在则 insert，存在则 updatedAt 比较 */
function mergeAll(dao, list) {
  if (!Array.isArray(list)) return
  for (const incoming of list) {
    const existing = dao.getById(incoming.id)
    if (!existing) {
      dao.insert(incoming)
    } else if (incoming.updatedAt >= existing.updatedAt) {
      dao.update(incoming.id, incoming)
    }
  }
}
