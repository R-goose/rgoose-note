/**
 * 连线 DAO
 * from / to 是 SQL 保留字，必须用双引号
 */

const { getDb } = require('../db/connection')

function deserialize(row) {
  if (!row) return null
  return { ...row }
}

module.exports = {
  listByNote(noteId) {
    const db = getDb()
    return db.prepare('SELECT * FROM connections WHERE noteId = ?')
      .all(noteId).map(deserialize)
  },

  listByNoteIds(noteIds) {
    if (!noteIds || noteIds.length === 0) return []
    const db = getDb()
    const placeholders = noteIds.map(() => '?').join(',')
    return db.prepare(`SELECT * FROM connections WHERE noteId IN (${placeholders})`)
      .all(...noteIds).map(deserialize)
  },

  getById(id) {
    const db = getDb()
    return deserialize(db.prepare('SELECT * FROM connections WHERE id = ?').get(id))
  },

  /** 双向查询：(from,to) 或 (to,from) 任一匹配即返回 */
  getByFromTo(noteId, from, to) {
    const db = getDb()
    return deserialize(db.prepare(`
      SELECT * FROM connections
      WHERE noteId = ?
        AND (("from" = ? AND "to" = ?) OR ("from" = ? AND "to" = ?))
    `).get(noteId, from, to, to, from))
  },

  insert(conn) {
    const db = getDb()
    const ts = conn.updatedAt || conn.createdAt || 0
    db.prepare(`
      INSERT INTO connections (
        id, noteId, "from", "to", fromSide, toSide, shape, dash, arrow, dir, color, width, label, createdAt, updatedAt
      ) VALUES (
        @id, @noteId, @from, @to, @fromSide, @toSide, @shape, @dash, @arrow, @dir, @color, @width, @label, @createdAt, @updatedAt
      )
    `).run({
      id: conn.id,
      noteId: conn.noteId,
      from: conn.from,
      to: conn.to,
      fromSide: conn.fromSide ?? null,
      toSide: conn.toSide ?? null,
      shape: conn.shape || 'straight',
      dash: conn.dash || 'solid',
      arrow: conn.arrow || 'standard',
      dir: conn.dir || 'forward',
      color: conn.color || '#6bbd8f',
      width: String(conn.width || '2'),
      label: conn.label ?? null,
      createdAt: conn.createdAt,
      updatedAt: ts
    })
    return this.getById(conn.id)
  },

  update(id, conn) {
    const db = getDb()
    const existing = this.getById(id)
    if (!existing) return null
    const merged = { ...existing, ...conn, id }
    db.prepare(`
      UPDATE connections SET
        "from" = @from,
        "to" = @to,
        fromSide = @fromSide,
        toSide = @toSide,
        shape = @shape,
        dash = @dash,
        arrow = @arrow,
        dir = @dir,
        color = @color,
        width = @width,
        label = @label,
        updatedAt = @updatedAt
      WHERE id = @id
    `).run({
      id,
      from: merged.from,
      to: merged.to,
      fromSide: merged.fromSide ?? null,
      toSide: merged.toSide ?? null,
      shape: merged.shape || 'straight',
      dash: merged.dash || 'solid',
      arrow: merged.arrow || 'standard',
      dir: merged.dir || 'forward',
      color: merged.color || '#6bbd8f',
      width: String(merged.width || '2'),
      label: merged.label ?? null,
      updatedAt: merged.updatedAt || 0
    })
    return this.getById(id)
  },

  delete(id) {
    const db = getDb()
    return db.prepare('DELETE FROM connections WHERE id = ?').run(id).changes
  },

  /** 删除 from 或 to 等于 blockId 的连线 */
  deleteByBlock(noteId, blockId) {
    const db = getDb()
    return db.prepare(`
      DELETE FROM connections
      WHERE noteId = ? AND ("from" = ? OR "to" = ?)
    `).run(noteId, blockId, blockId).changes
  },

  deleteByNote(noteId) {
    const db = getDb()
    return db.prepare('DELETE FROM connections WHERE noteId = ?').run(noteId).changes
  },

  listAll() {
    const db = getDb()
    return db.prepare('SELECT * FROM connections').all().map(deserialize)
  }
}
