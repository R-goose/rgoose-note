/**
 * 自定义笔记模板 DAO
 */

const { getDb } = require('../db/connection')
const { safeParse, safeStringify } = require('../common/utils')

function deserialize(row) {
  if (!row) return null
  return {
    ...row,
    blocks: safeParse(row.blocks, []),
    connections: safeParse(row.connections, []),
    isBuiltin: !!row.isBuiltin
  }
}

module.exports = {
  list() {
    const db = getDb()
    return db.prepare('SELECT * FROM templates ORDER BY COALESCE(sort, createdAt)')
      .all().map(deserialize)
  },

  getById(id) {
    const db = getDb()
    return deserialize(db.prepare('SELECT * FROM templates WHERE id = ?').get(id))
  },

  getByName(name, excludeId) {
    const db = getDb()
    if (excludeId) {
      return deserialize(db.prepare('SELECT * FROM templates WHERE name = ? AND id != ?').get(name, excludeId))
    }
    return deserialize(db.prepare('SELECT * FROM templates WHERE name = ?').get(name))
  },

  insert(t) {
    const db = getDb()
    db.prepare(`
      INSERT INTO templates (id, name, desc, icon, blocks, connections, isBuiltin, sort, createdAt, updatedAt)
      VALUES (@id, @name, @desc, @icon, @blocks, @connections, @isBuiltin, @sort, @createdAt, @updatedAt)
    `).run({
      id: t.id,
      name: t.name,
      desc: t.desc || '',
      icon: t.icon || null,
      blocks: safeStringify(t.blocks),
      connections: safeStringify(t.connections),
      isBuiltin: t.isBuiltin ? 1 : 0,
      sort: t.sort ?? null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    })
    return this.getById(t.id)
  },

  update(id, t) {
    const db = getDb()
    const existing = this.getById(id)
    if (!existing) return null
    const merged = { ...existing, ...t, id }
    db.prepare(`
      UPDATE templates SET
        name = @name,
        desc = @desc,
        icon = @icon,
        blocks = @blocks,
        connections = @connections,
        isBuiltin = @isBuiltin,
        sort = @sort,
        updatedAt = @updatedAt
      WHERE id = @id
    `).run({
      id,
      name: merged.name,
      desc: merged.desc || '',
      icon: merged.icon || null,
      blocks: safeStringify(merged.blocks),
      connections: safeStringify(merged.connections),
      isBuiltin: merged.isBuiltin ? 1 : 0,
      sort: merged.sort ?? null,
      updatedAt: merged.updatedAt
    })
    return this.getById(id)
  },

  delete(id) {
    const db = getDb()
    return db.prepare('DELETE FROM templates WHERE id = ?').run(id).changes
  },

  listAll() {
    const db = getDb()
    return db.prepare('SELECT * FROM templates').all().map(deserialize)
  },

  listSince(since) {
    const db = getDb()
    return db.prepare('SELECT * FROM templates WHERE updatedAt > ?')
      .all(since).map(deserialize)
  }
}