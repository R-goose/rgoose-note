/**
 * 标签业务：名称唯一校验、删除时清理各资源 tags JSON 列
 * 对照 Java TagService.java
 */

const tagDao = require('../dao/tagDao')
const noteDao = require('../dao/noteDao')
const folderDao = require('../dao/folderDao')
const planDao = require('../dao/planDao')
const { getDb } = require('../db/connection')
const { now } = require('../common/utils')
const { notFound, conflict } = require('../common/errors')

function requireTag(id) {
  const tag = tagDao.getById(id)
  if (!tag) throw notFound('标签不存在')
  return tag
}

function checkNameUnique(name, excludeId) {
  const existing = tagDao.getByName(name, excludeId)
  if (existing) throw conflict('标签名已存在')
}

module.exports = {
  list() {
    return tagDao.list()
  },

  get(id) {
    return requireTag(id)
  },

  create(tag) {
    checkNameUnique(tag.name, null)
    const ts = now()
    return tagDao.insert({ ...tag, createdAt: ts, updatedAt: ts })
  },

  update(id, tag) {
    requireTag(id)
    checkNameUnique(tag.name, id)
    return tagDao.update(id, { ...tag, updatedAt: now() })
  },

  /** 删除标签 + 从 notes/folders/plans 的 tags 列中移除该 tagId */
  delete(id) {
    const db = getDb()
    const tx = db.transaction(() => {
      tagDao.delete(id)
      removeFromNotes(id)
      removeFromFolders(id)
      removeFromPlans(id)
    })
    tx()
  },

  listAll() {
    return tagDao.listAll()
  }
}

function removeFromNotes(tagId) {
  // SQLite 无 JSON_CONTAINS，用 json_each 扫描
  const notes = noteDao.listAll()
  for (const note of notes) {
    if (Array.isArray(note.tags) && note.tags.includes(tagId)) {
      const newTags = note.tags.filter(t => t !== tagId)
      noteDao.update(note.id, { ...note, tags: newTags, updatedAt: now() })
    }
  }
}

function removeFromFolders(tagId) {
  const folders = folderDao.listAll()
  for (const folder of folders) {
    if (Array.isArray(folder.tags) && folder.tags.includes(tagId)) {
      const newTags = folder.tags.filter(t => t !== tagId)
      folderDao.update(folder.id, { ...folder, tags: newTags, updatedAt: now() })
    }
  }
}

function removeFromPlans(tagId) {
  const plans = planDao.listAll()
  for (const plan of plans) {
    if (Array.isArray(plan.tags) && plan.tags.includes(tagId)) {
      const newTags = plan.tags.filter(t => t !== tagId)
      planDao.update(plan.id, { ...plan, tags: newTags, updatedAt: now() })
    }
  }
}
