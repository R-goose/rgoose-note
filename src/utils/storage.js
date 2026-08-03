/**
 * 本地存储工具
 * 
 * v2.0 数据存储已迁移到后端（MySQL via API）
 * 本文件保留以下用途：
 * - localStorage 偏好设置（loadFromStorage / saveToStorage）
 * - JSON 导入导出（exportAsJSON / importFromJSON）
 * - 数据合并（mergeData）
 *
 * 已废弃（保留空壳避免编译错误，实际不再使用）：
 * - loadFromStore / saveToStore / migrateIfNeeded — 数据 I/O 已由 API 层接管
 */
import { syncApi } from '@/api/sync'

const STORAGE_KEY = 'rgoose_note_data'
const LAST_SYNC_KEY = 'rgoose_note_last_sync'

// ==================== localStorage 偏好（保留） ====================

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
    const isQuota = e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014)
    console.error('Failed to save to storage:', e)
    return { ok: false, reason: isQuota ? 'quota' : 'unknown', error: e }
  }
}

export function getLastSyncTime() {
  const time = localStorage.getItem(LAST_SYNC_KEY)
  return time ? parseInt(time, 10) : 0
}

// ==================== 已废弃的数据 I/O（保留空壳） ====================

/** @deprecated v2.0 数据加载由 store.init() → syncApi.pull() 接管 */
export async function loadFromStore() {
  console.warn('[deprecated] loadFromStore 已废弃，数据加载由 store.init() 接管')
  try {
    return await syncApi.pull(0)
  } catch {
    return null
  }
}

/** @deprecated v2.0 数据保存由 store 写操作 → API 接管 */
export async function saveToStore(data) {
  console.warn('[deprecated] saveToStore 已废弃，数据保存由 store 写操作接管')
  try {
    await syncApi.importAll(data)
    return { ok: true }
  } catch (e) {
    console.error('saveToStore failed:', e)
    return { ok: false, reason: 'api' }
  }
}

/** @deprecated v2.0 无迁移需求 */
export async function migrateIfNeeded() {
  return false
}

export async function clearStore() {
  // 清空 localStorage 残留数据
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(LAST_SYNC_KEY)
}

export function clearStorage() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(LAST_SYNC_KEY)
}

export async function getStorageInfo() {
  return { type: 'cloud', backend: 'MySQL via Spring Boot API' }
}

// ==================== JSON 导入导出（保留） ====================

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

// ==================== 数据合并 LWW（保留） ====================

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
