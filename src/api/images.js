/**
 * 媒体文件 API
 */
import { request, http, isElectron } from './client'

export const imagesApi = {
  /**
   * 上传文件（multipart/form-data）
   * - Electron 环境：自动转 base64 走 IPC
   * - 浏览器环境：走 HTTP FormData
   * @param {File|Blob} file
   * @returns {Promise<string>} ref 字符串，如 img_xxx.png
   */
  upload(file) {
    const formData = new FormData()
    formData.append('file', file)
    return request('/images', { method: 'POST', body: formData })
      .then(data => data.ref)
  },

  /**
   * 从 dataUrl 上传（兼容旧 saveImage 接口）
   * @param {string} dataUrl - base64 data URL
   * @returns {Promise<string>} ref 字符串
   */
  uploadFromDataUrl(dataUrl) {
    const ext = dataUrl.match(/^data:(?:image|audio|video)\/([\w+]+);base64/)?.[1]
      ?.replace('+xml', '').replace('jpeg', 'jpg') || 'png'
    const isMedia = /^data:(audio|video)\//.test(dataUrl)
    const prefix = isMedia ? 'media_' : 'img_'
    const fileName = `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

    // base64 → Blob → File
    const base64 = dataUrl.split(',')[1]
    const mimeMatch = dataUrl.match(/^data:([^;]+);/)
    const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
    const bytes = atob(base64)
    const arr = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
    const blob = new Blob([arr], { type: mimeType })
    const file = new File([blob], fileName, { type: mimeType })

    return this.upload(file)
  },

  /**
   * 获取图片下载 URL
   * - Electron 环境：走自定义协议 rgoose-image://ref（主进程直接返回二进制流）
   * - 浏览器环境：走 HTTP 相对路径 /api/images/{ref}（靠 vite 代理）
   * @param {string} ref
   * @returns {string} URL
   */
  url(ref) {
    if (!ref) return ref
    if (isElectron) {
      // 自定义协议：rgoose-image://host/ref
      // host 部分随意（不能为空），用 'local'
      return `rgoose-image://local/${encodeURIComponent(ref)}`
    }
    return `/api/images/${ref}`
  },

  /** 下载图片为 Blob */
  async download(ref) {
    if (isElectron) {
      // IPC 下载：返回 { buffer(base64), mimeType }
      const result = await window.electronAPI.backend('backend:images:download', ref)
      if (!result || result.code !== 0) {
        throw new Error(result?.msg || '图片下载失败')
      }
      const { buffer, mimeType } = result.data
      // base64 → Blob
      const bytes = atob(buffer)
      const arr = new Uint8Array(bytes.length)
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
      return new Blob([arr], { type: mimeType })
    }
    // HTTP 模式
    const resp = await request(`/images/${ref}`)
    return resp.blob()
  },

  /** 删除图片 */
  delete(ref) {
    return http.del(`/images/${encodeURIComponent(ref)}`)
  },

  /** 重命名素材（更新 displayName） */
  async rename(ref, displayName) {
    if (isElectron) {
      const result = await window.electronAPI.backend('backend:images:rename', { ref, displayName })
      if (!result || result.code !== 0) throw new Error(result?.msg || '重命名失败')
      return result.data
    }
    return http.patch(`/images/${encodeURIComponent(ref)}/rename`, { displayName })
  },

  /** 更新素材标签 */
  async updateTags(ref, tags) {
    if (isElectron) {
      const result = await window.electronAPI.backend('backend:images:updateTags', { ref, tags })
      if (!result || result.code !== 0) throw new Error(result?.msg || '标签更新失败')
      return result.data
    }
    return http.patch(`/images/${encodeURIComponent(ref)}/tags`, { tags })
  },

  /** 列出全部 ref 及元数据（含 displayName） */
  listAllWithMeta() {
    if (isElectron) {
      return window.electronAPI.backend('backend:images:listAllWithMeta').then(r => r.data || [])
    }
    return http.get('/images/meta')
  },

  /** 列出全部 ref（孤儿清理用） */
  listRefs() {
    return http.get('/images')
  }
}
