/**
 * 媒体文件元数据 DAO
 */

const { getDb } = require('../db/connection')
const { safeParse, safeStringify } = require('../common/utils')

function deserialize(row) {
  if (!row) return null
  return {
    ...row,
    tags: safeParse(row.tags, [])
  }
}

module.exports = {
  getById(id) {
    const db = getDb()
    return deserialize(db.prepare('SELECT * FROM images WHERE id = ?').get(id))
  },

  findByContentHash(hash) {
    if (!hash) return null
    const db = getDb()
    return deserialize(db.prepare('SELECT * FROM images WHERE contentHash = ?').get(hash))
  },

  insert(image) {
    const db = getDb()
    db.prepare(`
      INSERT INTO images (id, fileName, displayName, mimeType, sizeBytes, storagePath, tags, contentHash, createdAt)
      VALUES (@id, @fileName, @displayName, @mimeType, @sizeBytes, @storagePath, @tags, @contentHash, @createdAt)
    `).run({
      id: image.id,
      fileName: image.fileName,
      displayName: image.displayName || null,
      mimeType: image.mimeType,
      sizeBytes: image.sizeBytes || 0,
      storagePath: image.storagePath,
      tags: safeStringify(image.tags || []),
      contentHash: image.contentHash || null,
      createdAt: image.createdAt
    })
    return this.getById(image.id)
  },

  updateDisplayName(id, displayName) {
    const db = getDb()
    db.prepare('UPDATE images SET displayName = ? WHERE id = ?').run(displayName, id)
    return this.getById(id)
  },

  updateTags(id, tags) {
    const db = getDb()
    db.prepare('UPDATE images SET tags = ? WHERE id = ?').run(safeStringify(tags || []), id)
    return this.getById(id)
  },

  delete(id) {
    const db = getDb()
    return db.prepare('DELETE FROM images WHERE id = ?').run(id).changes
  },

  listAll() {
    const db = getDb()
    return db.prepare('SELECT * FROM images ORDER BY createdAt DESC').all().map(deserialize)
  },

  listRefs() {
    const db = getDb()
    return db.prepare('SELECT id FROM images').all().map(r => r.id)
  }
}
