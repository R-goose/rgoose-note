/**
 * 连线 API（嵌套在笔记下）
 */
import { http } from './client'

export const connectionsApi = {
  /** 笔记下的全部连线 */
  list(noteId) {
    return http.get(`/notes/${noteId}/connections`)
  },

  /** 新建连线（后端去重校验） */
  create(noteId, conn) {
    return http.post(`/notes/${noteId}/connections`, conn)
  },

  /** 更新连线 */
  update(noteId, connId, conn) {
    return http.put(`/notes/${noteId}/connections/${connId}`, conn)
  },

  /** 删除连线 */
  delete(noteId, connId) {
    return http.del(`/notes/${noteId}/connections/${connId}`)
  }
}
