/**
 * 文件夹 API
 */
import { http } from './client'

export const foldersApi = {
  /** 文件夹列表（含层级） */
  list(parentId) {
    return http.get('/folders', parentId ? { parentId } : {})
  },

  /** 文件夹详情 */
  get(id) {
    return http.get(`/folders/${id}`)
  },

  /** 新建文件夹 */
  create(folder) {
    return http.post('/folders', folder)
  },

  /** 更新文件夹 */
  update(id, folder) {
    return http.put(`/folders/${id}`, folder)
  },

  /** 删除文件夹（递归软删子文件夹及笔记） */
  delete(id) {
    return http.del(`/folders/${id}`)
  },

  /** 获取全部文件夹（同步用） */
  listAll() {
    return http.get('/folders/all')
  }
}
