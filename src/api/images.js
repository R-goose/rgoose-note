/**
 * 媒体文件 API
 */
import { request, http } from './client'

export const imagesApi = {
  /**
   * 上传文件（multipart/form-data）
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
   * 获取图片下载 URL（纯字符串拼接，无需网络请求）
   * @param {string} ref
   * @returns {string} URL
   */
  url(ref) {
    return `/api/images/${ref}`
  },

  /** 下载图片为 Blob */
  async download(ref) {
    const resp = await request(`/images/${ref}`)
    return resp.blob()
  },

  /** 删除图片 */
  delete(ref) {
    return http.del(`/images/${encodeURIComponent(ref)}`)
  },

  /** 列出全部 ref（孤儿清理用） */
  listRefs() {
    return http.get('/images')
  }
}
