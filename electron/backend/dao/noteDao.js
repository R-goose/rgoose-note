/**
 * 笔记 DAO
 * 列名全部 camelCase，对齐前端 Note
 */

const { getDb } = require('../db/connection')
const { safeParse, safeStringify } = require('../common/utils')

function deserialize(row) {
  if (!row) return null
  return {
    ...row,
    tags: safeParse(row.tags, []),
    canvasConfig: safeParse(row.canvasConfig, null),
    deleted: !!row.deleted
  }
}

module.exports = {
  /** 列表查询（条件可选） */
  list({ folderId, keyword, tagId } = {}) {
    const db = getDb()
    let sql = 'SELECT * FROM notes WHERE deleted = 0'
    const params = []

    if (folderId) {
      sql += ' AND folderId = ?'
      params.push(folderId)
    }
    if (keyword) {
      sql += ' AND title LIKE ?'
      params.push(`%${keyword}%`)
    }
    if (tagId) {
      sql += ' AND EXISTS (SELECT 1 FROM json_each(tags) WHERE value = ?)'
      params.push(tagId)
    }
    sql += ' ORDER BY updatedAt DESC'

    return db.prepare(sql).all(...params).map(deserialize)
  },

  getById(id) {
    const db = getDb()
    return deserialize(db.prepare('SELECT * FROM notes WHERE id = ?').get(id))
  },

  insert(note) {
    const db = getDb()
    db.prepare(`
      INSERT INTO notes (id, title, folderId, tags, canvasConfig, createdAt, updatedAt, deleted)
      VALUES (@id, @title, @folderId, @tags, @canvasConfig, @createdAt, @updatedAt, @deleted)
    `).run({
      id: note.id,
      title: note.title || '',
      folderId: note.folderId || null,
      tags: safeStringify(note.tags || []),
      canvasConfig: note.canvasConfig != null ? safeStringify(note.canvasConfig) : null,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      deleted: note.deleted ? 1 : 0
    })
    return this.getById(note.id)
  },

  update(id, note) {
    const db = getDb()
    const existing = this.getById(id)
    if (!existing) return null
    const merged = { ...existing, ...note, id }
    db.prepare(`
      UPDATE notes SET
        title = @title,
        folderId = @folderId,
        tags = @tags,
        canvasConfig = @canvasConfig,
        deleted = @deleted,
        updatedAt = @updatedAt
      WHERE id = @id
    `).run({
      id,
      title: merged.title || '',
      folderId: merged.folderId || null,
      tags: safeStringify(merged.tags || []),
      canvasConfig: merged.canvasConfig != null ? safeStringify(merged.canvasConfig) : null,
      deleted: merged.deleted ? 1 : 0,
      updatedAt: merged.updatedAt
    })
    return this.getById(id)
  },

  softDelete(id) {
    const db = getDb()
    return db.prepare('UPDATE notes SET deleted = 1, updatedAt = ? WHERE id = ?')
      .run(Date.now(), id).changes
  },

  hardDelete(id) {
    const db = getDb()
    return db.prepare('DELETE FROM notes WHERE id = ?').run(id).changes
  },

  listAll() {
    const db = getDb()
    return db.prepare('SELECT * FROM notes').all().map(deserialize)
  },

  listSince(since) {
    const db = getDb()
    return db.prepare('SELECT * FROM notes WHERE updatedAt > ?')
      .all(since).map(deserialize)
  }
}
