/**
 * 笔记 API
 */
import { http } from './client'

export const notesApi = {
  /** 笔记列表 */
  list(params = {}) {
    return http.get('/notes', params)
  },

  /** 笔记详情（含 blocks、connections） */
  get(id) {
    return http.get(`/notes/${id}`)
  },

  /** 新建笔记 */
  create(note) {
    return http.post('/notes', note)
  },

  /** 更新笔记 */
  update(id, note) {
    return http.put(`/notes/${id}`, note)
  },

  /** 仅更新标签 */
  updateTags(id, tags) {
    return http.patch(`/notes/${id}/tags`, { tags })
  },

  /** 删除笔记（软删除） */
  delete(id) {
    return http.del(`/notes/${id}`)
  },

  /** 从回收站恢复笔记 */
  restore(id) {
    return http.post(`/notes/${id}/restore`)
  },

  /** 彻底删除笔记（不可恢复） */
  hardDelete(id) {
    return http.del(`/notes/${id}/hard`)
  },

  /** 复制笔记（深拷贝块与连线） */
  duplicate(id) {
    return http.post(`/notes/${id}/duplicate`)
  },

  /** 获取全部笔记（同步用，不含 blocks/connections） */
  listAll() {
    return http.get('/notes/all')
  }
}
