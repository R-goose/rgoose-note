/**
 * 媒体文件业务：磁盘文件 + 元数据表
 * 对照 Java ImageService.java
 *
 * 注意：storageDir 由 config.dataDir 决定，文件存于 ${dataDir}/images/
 */

const fs = require('fs')
const path = require('path')
const imageDao = require('../dao/imageDao')
const config = require('../config')
const { now } = require('../common/utils')
const { notFound, badRequest } = require('../common/errors')

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'])
const MEDIA_EXTS = new Set(['mp3', 'wav', 'mp4', 'webm'])
const ALLOWED_EXTS = new Set([...IMAGE_EXTS, ...MEDIA_EXTS])

function getImagesDir() {
  return path.join(config.dataDir, 'images')
}

function ensureImagesDir() {
  const dir = getImagesDir()
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function extractExtension(originalName, mimeType) {
  if (originalName && originalName.includes('.')) {
    const ext = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase()
    if (ALLOWED_EXTS.has(ext)) return ext
  }
  if (!mimeType) return ''
  const map = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'video/mp4': 'mp4',
    'video/webm': 'webm'
  }
  return map[mimeType] || ''
}

function generateRef(mimeType, originalName) {
  const ext = extractExtension(originalName, mimeType)
  if (!ALLOWED_EXTS.has(ext)) throw badRequest('不支持的文件类型: ' + ext)
  const ts = Date.now()
  const rand = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
  const prefix = IMAGE_EXTS.has(ext) ? 'img_' : 'media_'
  return `${prefix}${ts}_${rand}.${ext}`
}

function saveBytes(data, mimeType, originalName) {
  const ref = generateRef(mimeType, originalName)
  ensureImagesDir()
  const filePath = path.join(getImagesDir(), ref)
  fs.writeFileSync(filePath, data)

  imageDao.insert({
    id: ref,
    fileName: ref,
    mimeType: mimeType || 'application/octet-stream',
    sizeBytes: data.length,
    storagePath: 'images/' + ref,
    createdAt: now()
  })
  return ref
}

module.exports = {
  /** 上传文件（Buffer 形式），返回 ref */
  upload(file) {
    // file: { buffer, originalname, mimetype }
    const data = file.buffer || file.data
    return saveBytes(data, file.mimetype || file.mimeType, file.originalname || file.name)
  },

  /** 从 dataUrl 保存（导入场景），返回 ref */
  saveFromDataUrl(dataUrl, fileName) {
    const commaIdx = dataUrl.indexOf(',')
    if (commaIdx < 0) throw badRequest('无效的 dataUrl')
    const meta = dataUrl.substring(0, commaIdx)
    const base64 = dataUrl.substring(commaIdx + 1)
    const semicolon = meta.indexOf(';')
    const mimeType = semicolon > 0 ? meta.substring(5, semicolon) : meta.substring(5)
    const data = Buffer.from(base64, 'base64')
    return saveBytes(data, mimeType, fileName)
  },

  /** 下载文件，返回 { buffer, mimeType } */
  download(ref) {
    const image = imageDao.getById(ref)
    if (!image) throw notFound('文件不存在')
    const filePath = path.join(config.dataDir, image.storagePath)
    if (!fs.existsSync(filePath)) throw notFound('文件不存在')
    return {
      buffer: fs.readFileSync(filePath),
      mimeType: image.mimeType
    }
  },

  /** 删除文件 + 元数据 */
  delete(ref) {
    const image = imageDao.getById(ref)
    if (!image) return
    try {
      const filePath = path.join(config.dataDir, image.storagePath)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    } catch (e) {
      console.warn('[imageService] 删除文件失败:', ref, e.message)
    }
    imageDao.delete(ref)
  },

  /** 列出全部 ref（孤儿清理） */
  listRefs() {
    return imageDao.listRefs()
  },

  /** 列出全部图片元数据 */
  listAll() {
    return imageDao.listAll()
  },

  /** 清空全部图片（磁盘文件 + 元数据表），返回删除的文件数 */
  clearAll() {
    const images = imageDao.listAll()
    let deleted = 0
    for (const img of images) {
      try {
        const filePath = path.join(config.dataDir, img.storagePath)
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      } catch (e) {
        console.warn('[imageService] 清理文件失败:', img.id, e.message)
      }
      imageDao.delete(img.id)
      deleted++
    }
    return deleted
  }
}
