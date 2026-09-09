/**
 * 自定义笔记模板 API
 */
import { http } from './client'

export const templatesApi = {
  /** 模板列表 */
  list() {
    return http.get('/templates')
  },

  /** 模板详情 */
  get(id) {
    return http.get(`/templates/${id}`)
  },

  /** 新建模板 */
  create(template) {
    return http.post('/templates', template)
  },

  /** 更新模板 */
  update(id, template) {
    return http.put(`/templates/${id}`, template)
  },

  /** 删除模板 */
  delete(id) {
    return http.del(`/templates/${id}`)
  }
}