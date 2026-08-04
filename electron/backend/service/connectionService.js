/**
 * 连线业务：CRUD、双向去重
 * 对照 Java ConnectionService.java
 */

const connectionDao = require('../dao/connectionDao')
const { uuid, now } = require('../common/utils')

module.exports = {
  list(noteId) {
    return connectionDao.listByNote(noteId)
  },

  /** 新建连线，双向去重 */
  create(noteId, conn) {
    const existing = connectionDao.getByFromTo(noteId, conn.from, conn.to)
    if (existing) return existing

    return connectionDao.insert({
      ...conn,
      id: conn.id || uuid(),
      noteId,
      createdAt: now()
    })
  },

  update(noteId, connId, conn) {
    return connectionDao.update(connId, { ...conn, noteId })
  },

  delete(noteId, connId) {
    connectionDao.delete(connId)
  }
}
