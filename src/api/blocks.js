/**
 * 画布块 API（嵌套在笔记下）
 */
import { http } from './client'

export const blocksApi = {
  /** 笔记下的全部块 */
  list(noteId) {
    return http.get(`/notes/${noteId}/blocks`)
  },

  /** 新建块 */
  create(noteId, block) {
    return http.post(`/notes/${noteId}/blocks`, block)
  },

  /** 更新块 */
  update(noteId, blockId, block) {
    return http.put(`/notes/${noteId}/blocks/${blockId}`, block)
  },

  /** 删除块（同时清理相关连线） */
  delete(noteId, blockId) {
    return http.del(`/notes/${noteId}/blocks/${blockId}`)
  },

  /** 批量更新块（拖拽多块时用） */
  batch(noteId, blocks) {
    return http.post(`/notes/${noteId}/blocks/batch`, blocks)
  }
}
