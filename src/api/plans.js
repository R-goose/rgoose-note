/**
 * 计划 API
 */
import { http } from './client'

export const plansApi = {
  /** 计划列表 */
  list(params = {}) {
    return http.get('/plans', params)
  },

  /** 计划详情 */
  get(id) {
    return http.get(`/plans/${id}`)
  },

  /** 新建计划 */
  create(plan) {
    return http.post('/plans', plan)
  },

  /** 更新计划 */
  update(id, plan) {
    return http.put(`/plans/${id}`, plan)
  },

  /** 删除计划 */
  delete(id) {
    return http.del(`/plans/${id}`)
  },

  /** 切换完成状态 */
  toggleComplete(id) {
    return http.patch(`/plans/${id}/complete`)
  },

  /** 获取全部计划（同步用） */
  listAll() {
    return http.get('/plans/all')
  }
}
