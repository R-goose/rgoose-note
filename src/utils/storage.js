const STORAGE_KEY = 'rgoose_note_data'
const LAST_SYNC_KEY = 'rgoose_note_last_sync'
const MIGRATED_KEY = 'rgoose_data_migrated_to_file'

const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron === true

export function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Failed to load from storage:', e)
  }
  return null
}

export function saveToStorage(data) {
  let json
  try {
    // 直接序列化，避免 JSON.parse(JSON.stringify()) 双重开销
    json = JSON.stringify(data)
  } catch (e) {
    console.error('Failed to serialize data:', e)
    return { ok: false, reason: 'serialize' }
  }
  try {
    localStorage.setItem(STORAGE_KEY, json)
    localStorage.setItem(LAST_SYNC_KEY, String(Date.now()))
    return { ok: true }
  } catch (e) {
    // QuotaExceededError / SecurityError 等：存储空间不足或被禁用
    const isQuota = e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014)
    console.error('Failed to save to storage:', e)
    return { ok: false, reason: isQuota ? 'quota' : 'unknown', error: e }
  }
}

export async function loadFromStore() {
  if (isElectron) {
    try {
      const data = await window.electronAPI.readDataFile()
      if (data) return data
    } catch (e) {
      console.error('Failed to read data file:', e)
    }
  }
  return loadFromStorage()
}

export async function saveToStore(data) {
  if (isElectron) {
    try {
      // electronAPI 内部会处理序列化，这里直接传原对象
      const ok = await window.electronAPI.writeDataFile(data)
      if (ok) return { ok: true }
    } catch (e) {
      console.error('Failed to write data file:', e)
    }
  }
  // 非 Electron 或文件写入失败时回退到 localStorage
  return saveToStorage(data)
}

export async function migrateIfNeeded() {
  if (!isElectron) return false
  if (localStorage.getItem(MIGRATED_KEY)) return false

  const fileData = await loadFromStore()
  const localData = loadFromStorage()

  if (localData && (!fileData || !fileData.notes?.length)) {
    await saveToStore(localData)
    console.log('[migrate] localStorage → 文件 已迁移')
  }
  localStorage.setItem(MIGRATED_KEY, '1')
  return true
}

export function getLastSyncTime() {
  const time = localStorage.getItem(LAST_SYNC_KEY)
  return time ? parseInt(time, 10) : 0
}

export async function clearStore() {
  if (isElectron) {
    try {
      await window.electronAPI.writeDataFile({ notes: [], folders: [], plans: [], updatedAt: Date.now() })
    } catch (e) {
      console.error('Failed to clear data file:', e)
    }
  }
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(LAST_SYNC_KEY)
  localStorage.removeItem(MIGRATED_KEY)
}

export function clearStorage() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(LAST_SYNC_KEY)
}

export async function getStorageInfo() {
  if (isElectron) {
    try {
      return await window.electronAPI.getStorageInfo()
    } catch (e) {
      return { type: 'electron-fallback', dataFile: '未知' }
    }
  }
  return { type: 'web', dataFile: '浏览器本地存储 (localStorage)' }
}

export function exportAsJSON(data) {
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rgoose-note-backup-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        resolve(data)
      } catch (err) {
        reject(new Error('文件格式错误'))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

export function mergeData(localData, remoteData) {
  if (!remoteData) return localData
  if (!localData) return remoteData

  const localFolders = localData.folders || []
  const remoteFolders = remoteData.folders || []
  const localNotes = localData.notes || []
  const remoteNotes = remoteData.notes || []
  const localPlans = localData.plans || []
  const remotePlans = remoteData.plans || []
  const localTags = localData.tags || []
  const remoteTags = remoteData.tags || []

  const merged = {
    folders: [...localFolders],
    notes: [...localNotes],
    plans: [...localPlans],
    tags: [...localTags],
    updatedAt: Math.max(Number(localData.updatedAt) || 0, Number(remoteData.updatedAt) || 0)
  }

  const localFolderMap = new Map(localFolders.map(f => [f.id, f]))
  remoteFolders.forEach(remoteFolder => {
    const localFolder = localFolderMap.get(remoteFolder.id)
    const remoteTs = Number(remoteFolder.updatedAt) || 0
    const localTs = Number(localFolder?.updatedAt) || 0
    if (!localFolder || remoteTs >= localTs) {
      const idx = merged.folders.findIndex(f => f.id === remoteFolder.id)
      if (idx >= 0) {
        merged.folders[idx] = remoteFolder
      } else {
        merged.folders.push(remoteFolder)
      }
    }
  })

  const localNoteMap = new Map(localNotes.map(n => [n.id, n]))
  remoteNotes.forEach(remoteNote => {
    const localNote = localNoteMap.get(remoteNote.id)
    const remoteTs = Number(remoteNote.updatedAt) || 0
    const localTs = Number(localNote?.updatedAt) || 0
    const shouldImport = !localNote ||
      remoteTs >= localTs ||
      (!remoteNote.deleted && localNote?.deleted)

    if (shouldImport) {
      const idx = merged.notes.findIndex(n => n.id === remoteNote.id)
      if (idx >= 0) {
        merged.notes[idx] = remoteNote
      } else {
        merged.notes.push(remoteNote)
      }
    }
  })

  const localPlanMap = new Map(localPlans.map(p => [p.id, p]))
  remotePlans.forEach(remotePlan => {
    const localPlan = localPlanMap.get(remotePlan.id)
    const remoteTs = Number(remotePlan.updatedAt) || 0
    const localTs = Number(localPlan?.updatedAt) || 0
    if (!localPlan || remoteTs >= localTs) {
      const idx = merged.plans.findIndex(p => p.id === remotePlan.id)
      if (idx >= 0) {
        merged.plans[idx] = remotePlan
      } else {
        merged.plans.push(remotePlan)
      }
    }
  })

  const localTagMap = new Map(localTags.map(t => [t.id, t]))
  remoteTags.forEach(remoteTag => {
    const localTag = localTagMap.get(remoteTag.id)
    const remoteTs = Number(remoteTag.updatedAt) || 0
    const localTs = Number(localTag?.updatedAt) || 0
    if (!localTag || remoteTs >= localTs) {
      const idx = merged.tags.findIndex(t => t.id === remoteTag.id)
      if (idx >= 0) {
        merged.tags[idx] = remoteTag
      } else {
        merged.tags.push(remoteTag)
      }
    }
  })

  return merged
}
