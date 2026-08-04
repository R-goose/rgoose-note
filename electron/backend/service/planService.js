/**
 * 计划业务：CRUD、切换完成状态
 * 对照 Java PlanService.java
 */

const planDao = require('../dao/planDao')
const { now } = require('../common/utils')
const { notFound } = require('../common/errors')

function requirePlan(id) {
  const plan = planDao.getById(id)
  if (!plan) throw notFound('计划不存在')
  return plan
}

module.exports = {
  list(params) {
    return planDao.list(params)
  },

  get(id) {
    return requirePlan(id)
  },

  create(plan) {
    const ts = now()
    return planDao.insert({ ...plan, createdAt: ts, updatedAt: ts })
  },

  update(id, plan) {
    requirePlan(id)
    return planDao.update(id, { ...plan, updatedAt: now() })
  },

  delete(id) {
    planDao.delete(id)
  },

  /** 切换完成状态 */
  toggleComplete(id) {
    const plan = requirePlan(id)
    return planDao.update(id, {
      ...plan,
      completed: !plan.completed,
      updatedAt: now()
    })
  },

  listAll() {
    return planDao.listAll()
  }
}
