/**
 * 标签 API
 */
import { http } from './client'

export const tagsApi = {
  /** 标签列表 */
  list() {
    return http.get('/tags')
  },

  /** 标签详情 */
  get(id) {
    return http.get(`/tags/${id}`)
  },

  /** 新建标签（name 唯一校验） */
  create(tag) {
    return http.post('/tags', tag)
  },

  /** 更新标签 */
  update(id, tag) {
    return http.put(`/tags/${id}`, tag)
  },

  /** 删除标签 */
  delete(id) {
    return http.del(`/tags/${id}`)
  }
}
