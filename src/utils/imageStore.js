/**
 * 媒体文件存储工具
 * 
 * v2.0 改为后端 HTTP 方案：
 * - saveImage: dataUrl → POST /api/images → ref
 * - resolveImageUrl: ref → 纯字符串拼接 /api/images/{ref}（无异步）
 * - 删除了 IndexedDB 全部封装
 */
import { imagesApi } from '@/api/images'

/**
 * 保存 dataUrl 到后端，返回 ref
 */
export async function saveImage(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return dataUrl
  if (!/^data:(image|audio|video)\//.test(dataUrl)) return dataUrl

  try {
    return await imagesApi.uploadFromDataUrl(dataUrl)
  } catch (err) {
    console.error('saveImage failed:', err)
    return dataUrl
  }
}

/**
 * 将 ref 解析为可用的 URL（纯字符串拼接，无需网络请求）
 * 后端直接通过 GET /api/images/{ref} 返回图片
 */
export function resolveImageUrl(relativePath) {
  if (!relativePath || typeof relativePath !== 'string') return relativePath
  // 已经是完整 URL（data:、http、blob:）或本地路径，直接返回
  if (relativePath.startsWith('data:') || relativePath.startsWith('http') || relativePath.startsWith('blob:')) {
    return relativePath
  }
  if (relativePath.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(relativePath)) {
    return relativePath
  }
  // 不是 ref 格式，原样返回
  if (!relativePath.startsWith('img_') && !relativePath.startsWith('media_')) return relativePath
  // 拼接后端 URL
  return imagesApi.url(relativePath)
}

/**
 * 同步版本（与异步版行为一致，都是纯字符串拼接）
 */
export function resolveImageUrlSync(relativePath) {
  return resolveImageUrl(relativePath)
}

/**
 * 预加载图片（现在只需让浏览器缓存预热）
 */
export async function preloadImages(relativePaths) {
  const valid = relativePaths.filter(p => p && typeof p === 'string' && (p.startsWith('img_') || p.startsWith('media_')))
  // 触发浏览器下载缓存
  await Promise.all(valid.map(p => {
    const url = resolveImageUrl(p)
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = resolve
      img.onerror = resolve
      img.src = url
    })
  }))
}

/**
 * 删除图片
 */
export async function deleteImage(relativePath) {
  if (!relativePath || (!relativePath.startsWith('img_') && !relativePath.startsWith('media_'))) return
  try {
    await imagesApi.delete(relativePath)
  } catch (err) {
    console.error('deleteImage failed:', err)
  }
}

/**
 * 获取所有图片 ref（孤儿清理用）
 */
export async function getAllImageRefs() {
  try {
    return await imagesApi.listRefs()
  } catch (err) {
    console.error('getAllImageRefs failed:', err)
    return []
  }
}

/**
 * 判断值是否为图片引用
 */
export function isImageRef(value) {
  return typeof value === 'string' && (value.startsWith('img_') || value.startsWith('media_'))
}

/**
 * 将 ref 转为 dataUrl（导出时用）
 */
export async function getImageAsDataUrl(relativePath) {
  if (!relativePath || (!relativePath.startsWith('img_') && !relativePath.startsWith('media_'))) return relativePath
  try {
    const blob = await imagesApi.download(relativePath)
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.error('getImageAsDataUrl failed:', err)
    return null
  }
}

/**
 * 导入图片（从 dataUrl 保存，返回新 ref）
 */
export async function importImageBundle(fileName, dataUrl) {
  if (!fileName || !dataUrl) return null
  try {
    return await imagesApi.uploadFromDataUrl(dataUrl)
  } catch (err) {
    console.error('importImageBundle failed:', err)
    return null
  }
}

/**
 * 从数据中收集所有图片 ref（用于导出/备份）
 */
export function collectImageRefsFromData(data) {
  const refs = new Set()
  if (!data?.notes) return refs
  for (const note of data.notes) {
    if (!note.blocks) continue
    for (const block of note.blocks) {
      if (block.type === 'image' && isImageRef(block.imageUrl)) {
        refs.add(block.imageUrl)
      }
      if ((block.type === 'audio' || block.type === 'video') && isImageRef(block.mediaUrl)) {
        refs.add(block.mediaUrl)
      }
      if (block.type === 'gallery' && Array.isArray(block.images)) {
        block.images.forEach(img => { if (isImageRef(img)) refs.add(img) })
      }
    }
  }
  return refs
}

/**
 * 构建 ref → dataUrl 的映射（导出时用）
 */
export async function buildImageBundle(refs) {
  const bundle = {}
  for (const ref of refs) {
    const dataUrl = await getImageAsDataUrl(ref)
    if (dataUrl) bundle[ref] = dataUrl
  }
  return bundle
}

/**
 * 恢复图片包（导入时用）
 */
export async function restoreImageBundle(bundle, oldToNewMap) {
  for (const [oldRef, dataUrl] of Object.entries(bundle)) {
    const newRef = await importImageBundle(oldRef, dataUrl)
    if (newRef && newRef !== oldRef) {
      oldToNewMap[oldRef] = newRef
    } else {
      oldToNewMap[oldRef] = oldRef
    }
  }
}

/**
 * 重映射数据中的图片引用（导入时用）
 */
export function remapImageRefsInData(data, refMap) {
  if (!data?.notes || Object.keys(refMap).length === 0) return data
  for (const note of data.notes) {
    if (!note.blocks) continue
    for (const block of note.blocks) {
      if (block.type === 'image' && refMap[block.imageUrl]) {
        block.imageUrl = refMap[block.imageUrl]
      }
      if ((block.type === 'audio' || block.type === 'video') && refMap[block.mediaUrl]) {
        block.mediaUrl = refMap[block.mediaUrl]
      }
      if (block.type === 'gallery' && Array.isArray(block.images)) {
        block.images = block.images.map(img => refMap[img] || img)
      }
    }
  }
  return data
}
