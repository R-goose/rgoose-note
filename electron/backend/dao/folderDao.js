/**
 * 文件夹 DAO
 * 列名全部 camelCase，对齐前端 Folder
 */

const { getDb } = require('../db/connection')
const { safeParse, safeStringify } = require('../common/utils')

function deserialize(row) {
  if (!row) return null
  return {
    ...row,
    tags: safeParse(row.tags, []),
    isSystem: !!row.isSystem,
    deleted: !!row.deleted
  }
}

module.exports = {
  /** 列表查询。parentId 为 null/undefined 查根级 */
  list(parentId) {
    const db = getDb()
    let sql = 'SELECT * FROM folders WHERE deleted = 0'
    const params = []
    if (parentId == null || parentId === '') {
      sql += ' AND parentId IS NULL'
    } else {
      sql += ' AND parentId = ?'
      params.push(parentId)
    }
    sql += ' ORDER BY updatedAt DESC'
    return db.prepare(sql).all(...params).map(deserialize)
  },

  getById(id) {
    const db = getDb()
    return deserialize(db.prepare('SELECT * FROM folders WHERE id = ?').get(id))
  },

  getByName(name, excludeId) {
    const db = getDb()
    if (excludeId) {
      return deserialize(db.prepare('SELECT * FROM folders WHERE name = ? AND id != ? AND deleted = 0').get(name, excludeId))
    }
    return deserialize(db.prepare('SELECT * FROM folders WHERE name = ? AND deleted = 0').get(name))
  },

  insert(folder) {
    const db = getDb()
    db.prepare(`
      INSERT INTO folders (id, name, parentId, tags, isSystem, createdAt, updatedAt, deleted)
      VALUES (@id, @name, @parentId, @tags, @isSystem, @createdAt, @updatedAt, @deleted)
    `).run({
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId || null,
      tags: safeStringify(folder.tags || []),
      isSystem: folder.isSystem ? 1 : 0,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      deleted: folder.deleted ? 1 : 0
    })
    return this.getById(folder.id)
  },

  update(id, folder) {
    const db = getDb()
    const existing = this.getById(id)
    if (!existing) return null
    const merged = { ...existing, ...folder, id }
    db.prepare(`
      UPDATE folders SET
        name = @name,
        parentId = @parentId,
        tags = @tags,
        isSystem = @isSystem,
        deleted = @deleted,
        updatedAt = @updatedAt
      WHERE id = @id
    `).run({
      id,
      name: merged.name,
      parentId: merged.parentId || null,
      tags: safeStringify(merged.tags || []),
      isSystem: merged.isSystem ? 1 : 0,
      deleted: merged.deleted ? 1 : 0,
      updatedAt: merged.updatedAt
    })
    return this.getById(id)
  },

  softDelete(id) {
    const db = getDb()
    return db.prepare('UPDATE folders SET deleted = 1, updatedAt = ? WHERE id = ?')
      .run(Date.now(), id).changes
  },

  hardDelete(id) {
    const db = getDb()
    return db.prepare('DELETE FROM folders WHERE id = ?').run(id).changes
  },

  listAll() {
    const db = getDb()
    return db.prepare('SELECT * FROM folders').all().map(deserialize)
  },

  listSince(since) {
    const db = getDb()
    return db.prepare('SELECT * FROM folders WHERE updatedAt > ?')
      .all(since).map(deserialize)
  }
}
