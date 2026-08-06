/**
 * 标签 DAO
 */

const { getDb } = require('../db/connection')

function deserialize(row) {
  if (!row) return null
  return { ...row }
}

module.exports = {
  list() {
    const db = getDb()
    return db.prepare('SELECT * FROM tags ORDER BY COALESCE(sort, createdAt)')
      .all().map(deserialize)
  },

  getById(id) {
    const db = getDb()
    return deserialize(db.prepare('SELECT * FROM tags WHERE id = ?').get(id))
  },

  getByName(name, excludeId) {
    const db = getDb()
    if (excludeId) {
      return deserialize(db.prepare('SELECT * FROM tags WHERE name = ? AND id != ?').get(name, excludeId))
    }
    return deserialize(db.prepare('SELECT * FROM tags WHERE name = ?').get(name))
  },

  insert(tag) {
    const db = getDb()
    db.prepare(`
      INSERT INTO tags (id, name, color, sort, createdAt, updatedAt)
      VALUES (@id, @name, @color, @sort, @createdAt, @updatedAt)
    `).run({
      id: tag.id,
      name: tag.name,
      color: tag.color || '#6bbd8f',
      sort: tag.sort ?? null,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt
    })
    return this.getById(tag.id)
  },

  update(id, tag) {
    const db = getDb()
    const existing = this.getById(id)
    if (!existing) return null
    const merged = { ...existing, ...tag, id }
    db.prepare(`
      UPDATE tags SET
        name = @name,
        color = @color,
        sort = @sort,
        updatedAt = @updatedAt
      WHERE id = @id
    `).run({
      id,
      name: merged.name,
      color: merged.color || '#6bbd8f',
      sort: merged.sort ?? null,
      updatedAt: merged.updatedAt
    })
    return this.getById(id)
  },

  delete(id) {
    const db = getDb()
    return db.prepare('DELETE FROM tags WHERE id = ?').run(id).changes
  },

  listAll() {
    const db = getDb()
    return db.prepare('SELECT * FROM tags').all().map(deserialize)
  },

  listSince(since) {
    const db = getDb()
    return db.prepare('SELECT * FROM tags WHERE updatedAt > ?')
      .all(since).map(deserialize)
  }
}
