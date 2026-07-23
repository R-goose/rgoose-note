const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron === true

const DB_NAME = 'rgoose-images'
const DB_STORE = 'images'
const DB_VERSION = 1

let dbPromise = null

function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function idbGet(key) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly')
    const req = tx.objectStore(DB_STORE).get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  }))
}

function idbPut(key, value) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite')
    tx.objectStore(DB_STORE).put(value, key)
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  }))
}

function idbDelete(key) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite')
    tx.objectStore(DB_STORE).delete(key)
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  }))
}

function idbKeys() {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly')
    const req = tx.objectStore(DB_STORE).getAllKeys()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  }))
}

function getExtFromDataUrl(dataUrl) {
  const m = dataUrl.match(/^data:(?:image|audio|video)\/([\w+]+);base64/)
  if (m) {
    const ext = m[1].replace('+xml', '')
    return ext === 'jpeg' ? 'jpg' : ext
  }
  return 'png'
}

export async function saveImage(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return dataUrl
  if (!/^data:(image|audio|video)\//.test(dataUrl)) return dataUrl

  const ext = getExtFromDataUrl(dataUrl)

  if (isElectron) {
    const res = await window.electronAPI.saveImage(dataUrl, ext)
    if (res?.ok) return res.path
    console.error('saveImage failed:', res?.error)
    return dataUrl
  } else {
    const isMedia = /^data:(audio|video)\//.test(dataUrl)
    const prefix = isMedia ? 'media_' : 'img_'
    const id = `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
    await idbPut(id, dataUrl)
    return id
  }
}

const _urlCache = new Map()
export async function resolveImageUrl(relativePath) {
  if (!relativePath || typeof relativePath !== 'string') return relativePath
  if (relativePath.startsWith('data:') || relativePath.startsWith('http') || relativePath.startsWith('blob:')) {
    return relativePath
  }
  if (relativePath.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(relativePath)) {
    return relativePath
  }
  if (!relativePath.startsWith('img_') && !relativePath.startsWith('media_')) return relativePath

  if (_urlCache.has(relativePath)) {
    const cached = _urlCache.get(relativePath)
    return cached
  }

  let url
  if (isElectron) {
    url = await window.electronAPI.resolveImagePath(relativePath)
  } else {
    const data = await idbGet(relativePath)
    url = data || ''
  }

  _urlCache.set(relativePath, url)
  return url
}

export function resolveImageUrlSync(relativePath) {
  if (!relativePath || typeof relativePath !== 'string') return relativePath
  if (relativePath.startsWith('data:') || relativePath.startsWith('http') || relativePath.startsWith('blob:')) {
    return relativePath
  }
  if (isElectron && relativePath.startsWith('img_')) {
    if (_urlCache.has(relativePath)) return _urlCache.get(relativePath)
    return relativePath
  }
  if (!relativePath.startsWith('img_')) return relativePath
  if (_urlCache.has(relativePath)) return _urlCache.get(relativePath)
  return ''
}

export async function preloadImages(relativePaths) {
  const valid = relativePaths.filter(p => p && typeof p === 'string' && p.startsWith('img_'))
  await Promise.all(valid.map(p => resolveImageUrl(p)))
}

export async function deleteImage(relativePath) {
  if (!relativePath || !relativePath.startsWith('img_')) return
  _urlCache.delete(relativePath)
  if (isElectron) {
    await window.electronAPI.deleteImage(relativePath)
  } else {
    await idbDelete(relativePath)
  }
}

export async function getAllImageRefs() {
  if (isElectron) {
    return await window.electronAPI.listImages()
  } else {
    return await idbKeys()
  }
}

export function isImageRef(value) {
  return typeof value === 'string' && (value.startsWith('img_') || value.startsWith('media_'))
}

export async function getImageAsDataUrl(relativePath) {
  if (!relativePath || (!relativePath.startsWith('img_') && !relativePath.startsWith('media_'))) return relativePath
  if (isElectron) {
    return await window.electronAPI.readImage(relativePath)
  } else {
    return await idbGet(relativePath)
  }
}

export async function importImageBundle(fileName, dataUrl) {
  if (!fileName || !dataUrl) return null
  const cleanName = fileName.startsWith('img_') ? fileName : `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileName.split('.').pop() || 'png'}`
  if (isElectron) {
    const ext = getExtFromDataUrl(dataUrl)
    const res = await window.electronAPI.saveImage(dataUrl, ext)
    return res?.ok ? res.path : cleanName
  } else {
    await idbPut(cleanName, dataUrl)
    return cleanName
  }
}

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

export async function buildImageBundle(refs) {
  const bundle = {}
  for (const ref of refs) {
    const dataUrl = await getImageAsDataUrl(ref)
    if (dataUrl) bundle[ref] = dataUrl
  }
  return bundle
}

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
