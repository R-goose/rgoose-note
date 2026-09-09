/**
 * 数据同步 API（增量拉取 + 导入导出）
 */
import { http } from './client'

export const syncApi = {
  /**
   * 增量同步：拉取服务器变更
   * @param {number} since - 毫秒时间戳，0 表示全量拉取
   * @returns {Promise<object>} { serverTime, folders, notes, tags }
   */
  pull(since = 0) {
    return http.get('/sync', { since })
  },

  /** 全量导出 */
  exportAll() {
    return http.get('/data/export')
  },

  /** 全量导入（按 updatedAt LWW 合并） */
  importAll(data) {
    return http.post('/data/import', data)
  },

  /** 清空全部业务数据 */
  clearAll() {
    return http.del('/data/all')
  }
}
