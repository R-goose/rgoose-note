import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generateId, getTimestamp, deepClone } from '@/utils'
import { loadFromStorage, saveToStorage, getLastSyncTime } from '@/utils/storage'

export const useNoteStore = defineStore('note', () => {
  const notes = ref([])
  const folders = ref([])
  const currentNoteId = ref(null)
  const currentFolderId = ref(null)
  const lastFolderId = ref(null)
  const lastSyncTime = ref(0)

  const currentNote = computed(() => {
    return notes.value.find(n => n.id === currentNoteId.value && !n.deleted) || null
  })

  const sortedNotes = computed(() => {
    let list = notes.value.filter(n => !n.deleted)
    if (currentFolderId.value) {
      const allChildIds = getAllChildFolderIds(currentFolderId.value)
      const allFolderIds = [currentFolderId.value, ...allChildIds]
      list = list.filter(n => allFolderIds.includes(n.folderId))
    }
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt)
  })

  const currentFolderNotes = computed(() => sortedNotes.value)

  const allSortedNotes = computed(() => {
    return [...notes.value.filter(n => !n.deleted)].sort((a, b) => b.updatedAt - a.updatedAt)
  })

  const sortedFolders = computed(() => {
    const sorted = [...folders.value.filter(f => !f.deleted)].sort((a, b) => a.createdAt - b.createdAt)
    const rootFolders = sorted.filter(f => !f.parentId)
    const childFolders = sorted.filter(f => f.parentId)
    childFolders.sort((a, b) => {
      const aIdx = rootFolders.findIndex(f => f.id === a.parentId)
      const bIdx = rootFolders.findIndex(f => f.id === b.parentId)
      return aIdx - bIdx
    })
    return [...rootFolders, ...childFolders]
  })

  const rootFolders = computed(() => {
    return folders.value.filter(f => !f.parentId && !f.deleted).sort((a, b) => a.createdAt - b.createdAt)
  })

  function getChildFolders(parentId) {
    return folders.value.filter(f => f.parentId === parentId && !f.deleted).sort((a, b) => a.createdAt - b.createdAt)
  }

  function getFolderNoteCount(folderId) {
    return notes.value.filter(n => n.folderId === folderId && !n.deleted).length
  }

  function getChildFolderCount(folderId) {
    return folders.value.filter(f => f.parentId === folderId && !f.deleted).length
  }

  function init() {
    const data = loadFromStorage()
    if (data && data.notes) {
      notes.value = data.notes
    }
    if (data && data.folders) {
      folders.value = data.folders
    }
    lastSyncTime.value = getLastSyncTime()
  }

  function persist() {
    const data = {
      notes: notes.value,
      folders: folders.value,
      plans: loadFromStorage()?.plans || [],
      updatedAt: getTimestamp()
    }
    saveToStorage(data)
    lastSyncTime.value = getLastSyncTime()
  }

  function createFolder(name = '新文件夹', parentId = null) {
    const now = getTimestamp()
    const folder = {
      id: generateId(),
      name,
      parentId,
      createdAt: now,
      updatedAt: now
    }
    folders.value.push(folder)
    persist()
    return folder
  }

  function isFolderNameDuplicate(name, parentId = null, excludeId = null) {
    const trimmedName = name.trim()
    if (!trimmedName) return false

    const sameParentDuplicate = folders.value.some(f =>
      !f.deleted &&
      f.name === trimmedName &&
      f.parentId === parentId &&
      f.id !== excludeId
    )

    if (sameParentDuplicate) return true

    if (parentId) {
      const parentFolder = folders.value.find(f => f.id === parentId)
      if (parentFolder && !parentFolder.deleted && parentFolder.name === trimmedName) {
        return true
      }
    }

    return false
  }

  function renameFolder(folderId, name) {
    const folder = folders.value.find(f => f.id === folderId)
    if (folder) {
      folder.name = name
      folder.updatedAt = getTimestamp()
      persist()
    }
  }

  function deleteFolder(folderId) {
    const folder = folders.value.find(f => f.id === folderId)
    if (!folder) return

    const parentId = folder.parentId
    const now = getTimestamp()

    const allChildFolderIds = getAllChildFolderIds(folderId)
    const allFolderIds = [folderId, ...allChildFolderIds]

    allFolderIds.forEach(id => {
      const f = folders.value.find(item => item.id === id)
      if (f) {
        f.deleted = true
        f.updatedAt = now
      }
    })

    notes.value.forEach(note => {
      if (allFolderIds.includes(note.folderId)) {
        note.deleted = true
        note.updatedAt = now
      }
    })

    if (currentFolderId.value === folderId || allFolderIds.includes(currentFolderId.value)) {
      currentFolderId.value = parentId
    }

    persist()
  }
  
  function getAllChildFolderIds(parentId) {
    const result = []
    const children = folders.value.filter(f => f.parentId === parentId && !f.deleted)
    children.forEach(child => {
      result.push(child.id)
      result.push(...getAllChildFolderIds(child.id))
    })
    return result
  }
  
  function getFolderPath(folderId) {
    if (!folderId) return []
    const path = []
    let currentId = folderId
    while (currentId) {
      const folder = folders.value.find(f => f.id === currentId)
      if (!folder || folder.deleted) break
      path.unshift(folder.name)
      currentId = folder.parentId
    }
    return path
  }
  
  function getFolderPathString(folderId, separator = ' / ') {
    const path = getFolderPath(folderId)
    return path.join(separator)
  }

  function setCurrentFolder(folderId) {
    currentFolderId.value = folderId
  }
  
  function saveCurrentFolder() {
    lastFolderId.value = currentFolderId.value
    currentFolderId.value = null
  }
  
  function restoreLastFolder() {
    if (lastFolderId.value) {
      const folder = folders.value.find(f => f.id === lastFolderId.value)
      if (folder) {
        currentFolderId.value = lastFolderId.value
      }
    }
  }

  function moveNoteToFolder(noteId, folderId) {
    const note = notes.value.find(n => n.id === noteId)
    if (note) {
      note.folderId = folderId || null
      note.updatedAt = getTimestamp()
      persist()
    }
  }

  function createNote(title = '新笔记', folderId = null) {
    const now = getTimestamp()
    const note = {
      id: generateId(),
      title,
      folderId: folderId || currentFolderId.value || null,
      blocks: [],
      connections: [],
      canvasConfig: {
        zoom: 1,
        offsetX: 0,
        offsetY: 0
      },
      createdAt: now,
      updatedAt: now
    }
    notes.value.unshift(note)
    persist()
    return note
  }

  function deleteNote(id) {
    const note = notes.value.find(n => n.id === id)
    if (note) {
      note.deleted = true
      note.updatedAt = getTimestamp()
      if (currentNoteId.value === id) {
        currentNoteId.value = null
      }
      persist()
    }
  }

  function updateNote(id, updates) {
    const note = notes.value.find(n => n.id === id)
    if (note) {
      Object.assign(note, updates, { updatedAt: getTimestamp() })
      persist()
    }
  }

  function setCurrentNote(id) {
    currentNoteId.value = id
  }

  function duplicateNote(id) {
    const note = notes.value.find(n => n.id === id)
    if (note) {
      const newNote = deepClone(note)
      newNote.id = generateId()
      newNote.title = `${note.title} (副本)`
      newNote.createdAt = getTimestamp()
      newNote.updatedAt = getTimestamp()
      notes.value.unshift(newNote)
      persist()
      return newNote
    }
    return null
  }

  function searchNotes(keyword) {
    if (!keyword) return sortedNotes.value
    const lower = keyword.toLowerCase()
    return notes.value.filter(n => !n.deleted && (
      (n.title || '').toLowerCase().includes(lower) ||
      n.blocks.some(b => (b.content || '').toLowerCase().includes(lower))
    )).sort((a, b) => b.updatedAt - a.updatedAt)
  }

  function addBlock(noteId, blockData) {
    const note = notes.value.find(n => n.id === noteId)
    if (note) {
      const block = {
        id: generateId(),
        type: 'text',
        content: '',
        x: blockData?.x || 100,
        y: blockData?.y || 100,
        width: 240,
        minHeight: 60,
        color: 'white',
        ...blockData,
        createdAt: getTimestamp(),
        updatedAt: getTimestamp()
      }
      note.blocks.push(block)
      note.updatedAt = getTimestamp()
      persist()
      return block
    }
    return null
  }

  function updateBlock(noteId, blockId, updates) {
    const note = notes.value.find(n => n.id === noteId)
    if (note) {
      const block = note.blocks.find(b => b.id === blockId)
      if (block) {
        Object.assign(block, updates, { updatedAt: getTimestamp() })
        note.updatedAt = getTimestamp()
        persist()
      }
    }
  }

  function deleteBlock(noteId, blockId) {
    const note = notes.value.find(n => n.id === noteId)
    if (note) {
      const idx = note.blocks.findIndex(b => b.id === blockId)
      if (idx >= 0) {
        note.blocks.splice(idx, 1)
        note.connections = note.connections.filter(
          c => c.from !== blockId && c.to !== blockId
        )
        note.updatedAt = getTimestamp()
        persist()
      }
    }
  }

  function addConnection(noteId, from, to, shape = 'straight', overrides = {}) {
    const note = notes.value.find(n => n.id === noteId)
    if (note) {
      const exists = note.connections.some(
        c => (c.from === from && c.to === to) || (c.from === to && c.to === from)
      )
      if (exists) return null

      const connection = {
        id: generateId(),
        from,
        to,
        shape,
        dash: 'solid',
        arrow: 'standard',
        dir: 'forward',
        color: '#6bbd8f',
        width: '2',
        createdAt: getTimestamp(),
        ...overrides
      }
      note.connections.push(connection)
      note.updatedAt = getTimestamp()
      persist()
      return connection
    }
    return null
  }

  function updateConnection(noteId, connectionId, updates) {
    const note = notes.value.find(n => n.id === noteId)
    if (note) {
      const conn = note.connections.find(c => c.id === connectionId)
      if (conn) {
        Object.assign(conn, updates)
        note.updatedAt = getTimestamp()
        persist()
      }
    }
  }

  function deleteConnection(noteId, connectionId) {
    const note = notes.value.find(n => n.id === noteId)
    if (note) {
      const idx = note.connections.findIndex(c => c.id === connectionId)
      if (idx >= 0) {
        note.connections.splice(idx, 1)
        note.updatedAt = getTimestamp()
        persist()
      }
    }
  }

  function updateCanvasConfig(noteId, config) {
    const note = notes.value.find(n => n.id === noteId)
    if (note) {
      Object.assign(note.canvasConfig, config)
      note.updatedAt = getTimestamp()
      persist()
    }
  }

  function replaceAll(newNotes) {
    notes.value = newNotes
    persist()
  }

  function replaceAllFolders(newFolders) {
    folders.value = newFolders
    persist()
  }

  function restoreNoteBlocks(noteId, blocks) {
    const note = notes.value.find(n => n.id === noteId)
    if (note) {
      note.blocks = blocks
      note.updatedAt = getTimestamp()
      persist()
    }
  }

  return {
    notes,
    folders,
    currentNoteId,
    currentFolderId,
    currentNote,
    sortedNotes,
    currentFolderNotes,
    allSortedNotes,
    sortedFolders,
    lastSyncTime,
    init,
    persist,
    createFolder,
    isFolderNameDuplicate,
    renameFolder,
    deleteFolder,
    setCurrentFolder,
    saveCurrentFolder,
    restoreLastFolder,
    moveNoteToFolder,
    createNote,
    deleteNote,
    updateNote,
    setCurrentNote,
    duplicateNote,
    searchNotes,
    addBlock,
    updateBlock,
    deleteBlock,
    addConnection,
    updateConnection,
    deleteConnection,
    updateCanvasConfig,
    replaceAll,
    replaceAllFolders,
    restoreNoteBlocks,
    getChildFolders,
    getChildFolderCount,
    getFolderNoteCount,
    rootFolders,
    getFolderPath,
    getFolderPathString
  }
})
