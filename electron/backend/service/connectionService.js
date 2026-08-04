/**
 * 连线业务：CRUD、双向去重
 * 对照 Java ConnectionService.java
 */

const connectionDao = require('../dao/connectionDao')
const { getDb } = require('../db/connection')
const { uuid, now } = require('../common/utils')

/** 触碰父笔记的 updatedAt，使增量同步能感知 connection 变更 */
function touchNote(noteId) {
  if (!noteId) return
  const db = getDb()
  db.prepare('UPDATE notes SET updatedAt = ? WHERE id = ?').run(now(), noteId)
}

module.exports = {
  list(noteId) {
    return connectionDao.listByNote(noteId)
  },

  /** 新建连线，双向去重 */
  create(noteId, conn) {
    const existing = connectionDao.getByFromTo(noteId, conn.from, conn.to)
    if (existing) return existing

    const result = connectionDao.insert({
      ...conn,
      id: conn.id || uuid(),
      noteId,
      createdAt: now()
    })
    touchNote(noteId)
    return result
  },

  update(noteId, connId, conn) {
    const result = connectionDao.update(connId, { ...conn, noteId })
    touchNote(noteId)
    return result
  },

  delete(noteId, connId) {
    connectionDao.delete(connId)
    touchNote(noteId)
  }
}
