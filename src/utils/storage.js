const STORAGE_KEY = 'rgoose_note_data'
const LAST_SYNC_KEY = 'rgoose_note_last_sync'

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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    localStorage.setItem(LAST_SYNC_KEY, String(Date.now()))
    return true
  } catch (e) {
    console.error('Failed to save to storage:', e)
    return false
  }
}

export function getLastSyncTime() {
  const time = localStorage.getItem(LAST_SYNC_KEY)
  return time ? parseInt(time, 10) : 0
}

export function clearStorage() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(LAST_SYNC_KEY)
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
  
  const merged = {
    notes: [...localData.notes],
    plans: [...localData.plans],
    updatedAt: Math.max(localData.updatedAt || 0, remoteData.updatedAt || 0)
  }
  
  const localNoteMap = new Map(localData.notes.map(n => [n.id, n]))
  remoteData.notes.forEach(remoteNote => {
    const localNote = localNoteMap.get(remoteNote.id)
    if (!localNote || remoteNote.updatedAt > localNote.updatedAt) {
      const idx = merged.notes.findIndex(n => n.id === remoteNote.id)
      if (idx >= 0) {
        merged.notes[idx] = remoteNote
      } else {
        merged.notes.push(remoteNote)
      }
    }
  })
  
  const localPlanMap = new Map(localData.plans.map(p => [p.id, p]))
  remoteData.plans.forEach(remotePlan => {
    const localPlan = localPlanMap.get(remotePlan.id)
    if (!localPlan || remotePlan.updatedAt > localPlan.updatedAt) {
      const idx = merged.plans.findIndex(p => p.id === remotePlan.id)
      if (idx >= 0) {
        merged.plans[idx] = remotePlan
      } else {
        merged.plans.push(remotePlan)
      }
    }
  })
  
  return merged
}
