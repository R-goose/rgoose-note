/**
 * 计划/待办 DAO
 */

const { getDb } = require('../db/connection')
const { safeParse, safeStringify } = require('../common/utils')

function deserialize(row) {
  if (!row) return null
  return {
    ...row,
    reminder: safeParse(row.reminder, null),
    tags: safeParse(row.tags, []),
    completed: !!row.completed
  }
}

module.exports = {
  list({ completed, dueBefore, dueAfter } = {}) {
    const db = getDb()
    let sql = 'SELECT * FROM plans WHERE 1=1'
    const params = []
    if (completed != null) {
      sql += ' AND completed = ?'
      params.push(completed ? 1 : 0)
    }
    if (dueBefore != null) {
      sql += ' AND dueDate <= ?'
      params.push(dueBefore)
    }
    if (dueAfter != null) {
      sql += ' AND dueDate >= ?'
      params.push(dueAfter)
    }
    sql += ' ORDER BY COALESCE(dueDate, createdAt)'
    return db.prepare(sql).all(...params).map(deserialize)
  },

  getById(id) {
    const db = getDb()
    return deserialize(db.prepare('SELECT * FROM plans WHERE id = ?').get(id))
  },

  insert(plan) {
    const db = getDb()
    db.prepare(`
      INSERT INTO plans (
        id, title, description, dueDate, reminder, completed, priority, tags,
        noteId, blockId, createdAt, updatedAt
      ) VALUES (
        @id, @title, @description, @dueDate, @reminder, @completed, @priority, @tags,
        @noteId, @blockId, @createdAt, @updatedAt
      )
    `).run({
      id: plan.id,
      title: plan.title,
      description: plan.description ?? null,
      dueDate: plan.dueDate ?? null,
      reminder: plan.reminder != null ? safeStringify(plan.reminder) : null,
      completed: plan.completed ? 1 : 0,
      priority: plan.priority || 'normal',
      tags: safeStringify(plan.tags || []),
      noteId: plan.noteId || null,
      blockId: plan.blockId || null,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    })
    return this.getById(plan.id)
  },

  update(id, plan) {
    const db = getDb()
    db.prepare(`
      UPDATE plans SET
        title = @title,
        description = @description,
        dueDate = @dueDate,
        reminder = @reminder,
        completed = @completed,
        priority = @priority,
        tags = @tags,
        noteId = @noteId,
        blockId = @blockId,
        updatedAt = @updatedAt
      WHERE id = @id
    `).run({
      id,
      title: plan.title,
      description: plan.description ?? null,
      dueDate: plan.dueDate ?? null,
      reminder: plan.reminder != null ? safeStringify(plan.reminder) : null,
      completed: plan.completed ? 1 : 0,
      priority: plan.priority || 'normal',
      tags: safeStringify(plan.tags || []),
      noteId: plan.noteId || null,
      blockId: plan.blockId || null,
      updatedAt: plan.updatedAt
    })
    return this.getById(id)
  },

  delete(id) {
    const db = getDb()
    return db.prepare('DELETE FROM plans WHERE id = ?').run(id).changes
  },

  listAll() {
    const db = getDb()
    return db.prepare('SELECT * FROM plans').all().map(deserialize)
  },

  listSince(since) {
    const db = getDb()
    return db.prepare('SELECT * FROM plans WHERE updatedAt > ?')
      .all(since).map(deserialize)
  }
}
