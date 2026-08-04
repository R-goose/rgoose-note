/**
 * 块业务：CRUD、批量更新、删除时清理关联连线
 * 对照 Java BlockService.java
 */

const blockDao = require('../dao/blockDao')
const connectionDao = require('../dao/connectionDao')
const { getDb } = require('../db/connection')
const { now } = require('../common/utils')

module.exports = {
  list(noteId) {
    return blockDao.listByNote(noteId)
  },

  create(noteId, block) {
    const ts = now()
    return blockDao.insert({
      ...block,
      noteId,
      createdAt: ts,
      updatedAt: ts
    })
  },

  update(noteId, blockId, block) {
    return blockDao.update(blockId, {
      ...block,
      noteId,
      updatedAt: now()
    })
  },

  /** 删除块 + 删除关联连线 */
  delete(noteId, blockId) {
    const db = getDb()
    const tx = db.transaction(() => {
      blockDao.delete(blockId)
      connectionDao.deleteByBlock(noteId, blockId)
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
    })
    tx()
  }
}
