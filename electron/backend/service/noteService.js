/**
 * 笔记业务：条件查询、详情组装、深拷贝复制
 * 对照 Java NoteService.java
 */

const noteDao = require('../dao/noteDao')
const blockDao = require('../dao/blockDao')
const connectionDao = require('../dao/connectionDao')
const { getDb } = require('../db/connection')
const { uuid, now } = require('../common/utils')
const { notFound } = require('../common/errors')

function requireNote(id) {
  const note = noteDao.getById(id)
  if (!note || note.deleted) throw notFound('笔记不存在')
  return note
}

module.exports = {
  list(params) {
    return noteDao.list(params)
  },

  get(id) {
    const note = requireNote(id)
    return {
      ...note,
      blocks: blockDao.listByNote(id),
      connections: connectionDao.listByNote(id)
    }
  },

  create(note) {
    const ts = now()
    return noteDao.insert({ ...note, createdAt: ts, updatedAt: ts })
  },

  update(id, note) {
    requireNote(id)
    return noteDao.update(id, { ...note, updatedAt: now() })
  },

  /** 仅更新标签 */
  updateTags(id, tags) {
    requireNote(id)
    return noteDao.updateTags(id, tags)
  },

  /** 软删笔记（保留 blocks/connections，回收站可完整恢复） */
  delete(id) {
    noteDao.softDelete(id)
  },

  /** 从回收站恢复笔记 */
  restore(id) {
    const note = noteDao.getById(id)
    if (!note || !note.deleted) throw notFound('回收站中不存在该笔记')
    noteDao.restore(id)
    return noteDao.getById(id)
  },

  /** 彻底删除笔记 + 关联 blocks/connections（事务） */
  hardDelete(id) {
    const db = getDb()
    const tx = db.transaction(() => {
      noteDao.hardDelete(id)
      blockDao.deleteByNote(id)
      connectionDao.deleteByNote(id)
    })
    tx()
  },

  /** 深拷贝：复制 note + blocks + connections，重新生成 ID 并映射 from/to */
  duplicate(id) {
    const source = requireNote(id)
    const db = getDb()
    const ts = now()

    return db.transaction(() => {
      const newNoteId = uuid()
      const copy = noteDao.insert({
        ...source,
        id: newNoteId,
        title: source.title + ' (副本)',
        createdAt: ts,
        updatedAt: ts
      })

      // 复制 blocks，建立 oldId -> newId 映射
      const blocks = blockDao.listByNote(id)
      const idMap = {}
      for (const block of blocks) {
        const newBlockId = uuid()
        idMap[block.id] = newBlockId
        blockDao.insert({
          ...block,
          id: newBlockId,
          noteId: newNoteId,
          createdAt: ts,
          updatedAt: ts
        })
      }

      // 复制 connections，映射 from/to
      const conns = connectionDao.listByNote(id)
      for (const conn of conns) {
        connectionDao.insert({
          ...conn,
          id: uuid(),
          noteId: newNoteId,
          from: idMap[conn.from] || conn.from,
          to: idMap[conn.to] || conn.to,
          createdAt: ts
        })
      }

      // 返回完整副本（含 blocks/connections），前端 duplicateNote 依赖此结构替换本地
      return {
        ...copy,
        blocks: blockDao.listByNote(newNoteId),
        connections: connectionDao.listByNote(newNoteId)
      }
    })()
  },

  listAll() {
    return noteDao.listAll()
  }
}
