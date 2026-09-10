/**
 * 自定义笔记模板业务：名称唯一校验、CRUD
 */

const templateDao = require('../dao/templateDao')
const { now, uuid } = require('../common/utils')
const { notFound, conflict } = require('../common/errors')

function requireTemplate(id) {
  const t = templateDao.getById(id)
  if (!t) throw notFound('模板不存在')
  return t
}

function checkNameUnique(name, excludeId) {
  const existing = templateDao.getByName(name, excludeId)
  if (existing) throw conflict('模板名已存在')
}

module.exports = {
  list() {
    return templateDao.list()
  },

  get(id) {
    return requireTemplate(id)
  },

  create(t) {
    checkNameUnique(t.name, null)
    const ts = now()
    return templateDao.insert({ ...t, id: t.id || uuid(), isBuiltin: 0, createdAt: ts, updatedAt: ts })
  },

  update(id, t) {
    requireTemplate(id)
    if (t.name) checkNameUnique(t.name, id)
    return templateDao.update(id, { ...t, updatedAt: now() })
  },

  delete(id) {
    requireTemplate(id)
    return templateDao.delete(id)
  },

  listAll() {
    return templateDao.listAll()
  }
}