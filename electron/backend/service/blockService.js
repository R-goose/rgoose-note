/**
 * 块业务：CRUD、批量更新、删除时清理关联连线
 * 对照 Java BlockService.java
 */

const blockDao = require('../dao/blockDao')
const connectionDao = require('../dao/connectionDao')
const noteDao = require('../dao/noteDao')
const { getDb } = require('../db/connection')
const { now } = require('../common/utils')

/** 触碰父笔记的 updatedAt，使增量同步能感知 block 变更 */
function touchNote(noteId) {
  if (!noteId) return
  const db = getDb()
  db.prepare('UPDATE notes SET updatedAt = ? WHERE id = ?').run(now(), noteId)
}

module.exports = {
  list(noteId) {
    return blockDao.listByNote(noteId)
  },

  create(noteId, block) {
    const ts = now()
    const db = getDb()
    const tx = db.transaction(() => {
      const result = blockDao.insert({
        ...block,
        noteId,
        createdAt: ts,
        updatedAt: ts
      })
      touchNote(noteId)
      return result
    })
    return tx()
  },

  update(noteId, blockId, block) {
    const db = getDb()
    const tx = db.transaction(() => {
      const result = blockDao.update(blockId, {
        ...block,
        noteId,
        updatedAt: now()
      })
      touchNote(noteId)
      return result
    })
    return tx()
  },

  /** 删除块 + 删除关联连线 */
  delete(noteId, blockId) {
    const db = getDb()
    const tx = db.transaction(() => {
      blockDao.delete(blockId)
      connectionDao.deleteByBlock(noteId, blockId)
      touchNote(noteId)
    })
    tx()
  },

  /** 批量更新（画布拖拽场景） */
  batchUpdate(noteId, blocks) {
    const db = getDb()
    const ts = now()
    const tx = db.transaction(() => {
      for (const block of blocks) {
        blockDao.update(block.id, { ...block, noteId, updatedAt: ts })
      }
      touchNote(noteId)
    })
    tx()
  }
}
