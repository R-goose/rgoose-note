import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generateId, getTimestamp, deepClone } from '@/utils'
import { useToast } from '@/composables/useToast'
import { syncApi } from '@/api/sync'
import { foldersApi } from '@/api/folders'
import { notesApi } from '@/api/notes'
import { blocksApi } from '@/api/blocks'
import { connectionsApi } from '@/api/connections'

export const SYSTEM_ROOT_FOLDER_ID = 'system-root'

export const useNoteStore = defineStore('note', () => {
  const notes = ref([])
  const folders = ref([])
  const currentNoteId = ref(null)
  const currentFolderId = ref(null)
  const lastFolderId = ref(null)
  const lastSyncTime = ref(0)
  const saveStatus = ref('saved') // 'saved' | 'saving'
  const { error: toastError } = useToast()

  // ==================== 计算属性（只读，不改动） ====================

  const currentNote = computed(() => {
    return notes.value.find(n => n.id === currentNoteId.value && !n.deleted) || null
  })

  const sortedNotes = computed(() => {
    let list = notes.value.filter(n => !n.deleted)
    if (currentFolderId.value) {
      const allChildIds = getAllChildFolderIds(currentFolderId.value)
      const allFolderIds = [currentFolderId.value, ...allChildIds]
      // 根目录视图下，folderId 为 null 的未归类笔记也属于根目录
      const isRoot = currentFolderId.value === SYSTEM_ROOT_FOLDER_ID
      list = list.filter(n => allFolderIds.includes(n.folderId) || (isRoot && n.folderId == null))
    }
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt)
  })

  const currentFolderNotes = computed(() => sortedNotes.value)

  const allSortedNotes = computed(() => {
    return [...notes.value.filter(n => !n.deleted)].sort((a, b) => b.updatedAt - a.updatedAt)
  })

  const sortedFolders = computed(() => {
    const sorted = [...folders.value.filter(f => !f.deleted)].sort((a, b) => {
      if (a.isSystem && !b.isSystem) return -1
      if (!a.isSystem && b.isSystem) return 1
      return a.createdAt - b.createdAt
    })
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
    return folders.value.filter(f => !f.parentId && !f.deleted).sort((a, b) => {
      if (a.isSystem && !b.isSystem) return -1
      if (!a.isSystem && b.isSystem) return 1
      return a.createdAt - b.createdAt
    })
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

  // ==================== 内部辅助 ====================

  /**
   * 将 sync 返回的扁平 blocks/connections 嵌套回各自的 note
   */
  function rebuildNoteStructure(syncData) {
    const blocksByNote = new Map()
    const connsByNote = new Map()
    for (const b of syncData.blocks || []) {
      if (!blocksByNote.has(b.noteId)) blocksByNote.set(b.noteId, [])
      blocksByNote.get(b.noteId).push(b)
    }
    for (const c of syncData.connections || []) {
      if (!connsByNote.has(c.noteId)) connsByNote.set(c.noteId, [])
      connsByNote.get(c.noteId).push(c)
    }
    for (const note of syncData.notes || []) {
      note.blocks = blocksByNote.get(note.id) || []
      note.connections = connsByNote.get(note.id) || []
    }
  }

  /** 异步落库状态跟踪 */
  let pendingCount = 0
  function markSaving() {
    pendingCount++
    saveStatus.value = 'saving'
  }
  function markSaved() {
    pendingCount = Math.max(0, pendingCount - 1)
    if (pendingCount === 0) saveStatus.value = 'saved'
  }

  // ==================== 初始化 ====================

  let initPromise = null
  async function init() {
    if (initPromise) return initPromise
    initPromise = (async () => {
      try {
        const data = await syncApi.pull(0)
        rebuildNoteStructure(data)
        notes.value = data.notes || []
        folders.value = data.folders || []
        lastSyncTime.value = data.serverTime || Date.now()
      } catch (err) {
        console.error('[noteStore] 从后端加载失败:', err)
        // 降级：空数据启动
        notes.value = []
        folders.value = []
      }
      ensureTagsFields()
      await ensureSystemRootFolder()
    })()
    return initPromise
  }

  let _ensureRootPromise = null

  async function ensureSystemRootFolder() {
    // 并发锁：防止重复创建 system-root 文件夹
    if (_ensureRootPromise) return _ensureRootPromise
    _ensureRootPromise = _doEnsureSystemRootFolder()
    try {
      return await _ensureRootPromise
    } finally {
      _ensureRootPromise = null
    }
  }

  async function _doEnsureSystemRootFolder() {
    const existing = folders.value.find(f => f.id === SYSTEM_ROOT_FOLDER_ID)
    if (existing) {
      if (!existing.isSystem || existing.name !== '根目录') {
        existing.isSystem = true
        existing.name = '根目录'
        existing.parentId = null
        existing.updatedAt = getTimestamp()
        try { await foldersApi.update(existing.id, existing) } catch {}
      }
      return existing
    }
    const now = getTimestamp()
    const folder = {
      id: SYSTEM_ROOT_FOLDER_ID,
      name: '根目录',
      parentId: null,
      tags: [],
      isSystem: true,
      createdAt: now,
      updatedAt: now
    }
    folders.value.push(folder)
    try { await foldersApi.create(folder) } catch {}
    return folder
  }

  function ensureTagsFields() {
    notes.value.forEach(n => {
      if (!Array.isArray(n.tags)) n.tags = []
    })
    folders.value.forEach(f => {
      if (!Array.isArray(f.tags)) f.tags = []
    })
  }

  // ==================== 文件夹操作 ====================

  function createFolder(name = '新文件夹', parentId = null) {
    const now = getTimestamp()
    const folder = {
      id: generateId(),
      name,
      parentId,
      tags: [],
      createdAt: now,
      updatedAt: now
    }
    folders.value.push(folder)

    markSaving()
    foldersApi.create(folder)
      .catch(err => {
        console.error('创建文件夹失败:', err)
        const idx = folders.value.findIndex(f => f.id === folder.id)
        if (idx >= 0) folders.value.splice(idx, 1)
      })
      .finally(markSaved)

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
    if (!folder) return
    if (folder.isSystem) return
    folder.name = name
    folder.updatedAt = getTimestamp()

    markSaving()
    foldersApi.update(folderId, { name, updatedAt: folder.updatedAt })
      .catch(err => console.error('重命名文件夹失败:', err))
      .finally(markSaved)
  }

  function deleteFolder(folderId) {
    const folder = folders.value.find(f => f.id === folderId)
    if (!folder) return
    if (folder.isSystem) return

    const parentId = folder.parentId
    const now = getTimestamp()

    const allChildFolderIds = getAllChildFolderIds(folderId)
    const allFolderIds = [folderId, ...allChildFolderIds]

    // 备份用于回滚
    const folderBackups = new Map()
    const noteBackups = new Map()

    allFolderIds.forEach(id => {
      const f = folders.value.find(item => item.id === id)
      if (f) {
        folderBackups.set(id, { deleted: f.deleted, updatedAt: f.updatedAt })
        f.deleted = true
        f.updatedAt = now
      }
    })

    notes.value.forEach(note => {
      if (allFolderIds.includes(note.folderId)) {
        noteBackups.set(note.id, { deleted: note.deleted, updatedAt: note.updatedAt })
        note.deleted = true
        note.updatedAt = now
      }
    })

    const prevCurrentFolderId = currentFolderId.value
    if (currentFolderId.value === folderId || allFolderIds.includes(currentFolderId.value)) {
      currentFolderId.value = parentId
    }

    markSaving()
    foldersApi.delete(folderId)
      .catch(err => {
        console.error('删除文件夹失败:', err)
        // 回滚所有文件夹
        folderBackups.forEach((bak, id) => {
          const f = folders.value.find(item => item.id === id)
          if (f) { f.deleted = bak.deleted; f.updatedAt = bak.updatedAt }
        })
        // 回滚所有笔记
        noteBackups.forEach((bak, noteId) => {
          const n = notes.value.find(item => item.id === noteId)
          if (n) { n.deleted = bak.deleted; n.updatedAt = bak.updatedAt }
        })
        // 回滚 currentFolderId
        currentFolderId.value = prevCurrentFolderId
        toastError('删除失败：文件夹未能同步，请重试')
      })
      .finally(markSaved)
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

      markSaving()
      notesApi.update(noteId, { folderId: note.folderId, updatedAt: note.updatedAt })
        .catch(err => console.error('移动笔记失败:', err))
        .finally(markSaved)
    }
  }

  // ==================== 笔记操作 ====================

  function createNote(title = '新笔记', folderId = null) {
    const now = getTimestamp()
    const note = {
      id: generateId(),
      title,
      folderId: folderId || currentFolderId.value || null,
      tags: [],
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

    markSaving()
    notesApi.create(note)
      .catch(err => {
        console.error('创建笔记失败:', err)
        const idx = notes.value.findIndex(n => n.id === note.id)
        if (idx >= 0) notes.value.splice(idx, 1)
      })
      .finally(markSaved)

    return note
  }

  function deleteNote(id) {
    const note = notes.value.find(n => n.id === id)
    if (!note) return
    const backup = { deleted: note.deleted, updatedAt: note.updatedAt }
    const prevCurrentNoteId = currentNoteId.value

    note.deleted = true
    note.updatedAt = getTimestamp()
    if (currentNoteId.value === id) {
      currentNoteId.value = null
    }

    markSaving()
    notesApi.delete(id)
      .catch(err => {
        console.error('删除笔记失败:', err)
        note.deleted = backup.deleted
        note.updatedAt = backup.updatedAt
        if (prevCurrentNoteId === id) currentNoteId.value = prevCurrentNoteId
        toastError('删除失败：笔记未能同步，请重试')
      })
      .finally(markSaved)
  }

  function updateNote(id, updates) {
    const note = notes.value.find(n => n.id === id)
    if (note) {
      Object.assign(note, updates, { updatedAt: getTimestamp() })

      markSaving()
      notesApi.update(id, { ...updates, updatedAt: note.updatedAt })
        .catch(err => console.error('更新笔记失败:', err))
        .finally(markSaved)
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

      markSaving()
      notesApi.duplicate(id)
        .then(serverNote => {
          // 用服务端返回的副本替换本地副本（ID 和 block/connection 映射更准确）
          if (serverNote) {
            const idx = notes.value.findIndex(n => n.id === newNote.id)
            if (idx >= 0) {
              notes.value[idx] = {
                ...serverNote,
                blocks: serverNote.blocks || [],
                connections: serverNote.connections || []
              }
            }
          }
        })
        .catch(err => {
          console.error('复制笔记失败:', err)
          const idx = notes.value.findIndex(n => n.id === newNote.id)
          if (idx >= 0) notes.value.splice(idx, 1)
        })
        .finally(markSaved)

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

  // ==================== 画布块操作 ====================

  function addBlock(noteId, blockData) {
    const note = notes.value.find(n => n.id === noteId)
    if (!note) return null

    const block = {
      id: generateId(),
      type: 'text',
      content: '',
      x: blockData?.x || 100,
      y: blockData?.y || 100,
      width: 240,
      minHeight: 60,
      color: 'default',
      ...blockData,
      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    }
    note.blocks.push(block)
    note.updatedAt = getTimestamp()

    markSaving()
    blocksApi.create(noteId, block)
      .catch(err => {
        console.error('创建块失败:', err)
        const idx = note.blocks.findIndex(b => b.id === block.id)
        if (idx >= 0) note.blocks.splice(idx, 1)
      })
      .finally(markSaved)

    return block
  }

  function updateBlock(noteId, blockId, updates) {
    const note = notes.value.find(n => n.id === noteId)
    if (note) {
      const block = note.blocks.find(b => b.id === blockId)
      if (block) {
          const oldValues = {}
        Object.keys(updates).forEach(k => { oldValues[k] = block[k] })

        Object.assign(block, updates, { updatedAt: getTimestamp() })
        note.updatedAt = getTimestamp()

        markSaving()
        blocksApi.update(noteId, blockId, { ...updates, updatedAt: block.updatedAt })
          .catch(err => {
            console.error('更新块失败:', err)
            Object.assign(block, oldValues, { updatedAt: getTimestamp() })
            toastError('保存失败：块位置/内容未能同步，请检查后端服务')
          })
          .finally(markSaved)
      }
    }
  }

  function deleteBlock(noteId, blockId) {
    const note = notes.value.find(n => n.id === noteId)
    if (!note) return

    const idx = note.blocks.findIndex(b => b.id === blockId)
    if (idx < 0) return

    const backup = note.blocks[idx]
    const backupConns = note.connections.filter(c => c.from === blockId || c.to === blockId)

    note.blocks.splice(idx, 1)
    note.connections = note.connections.filter(c => c.from !== blockId && c.to !== blockId)
    note.updatedAt = getTimestamp()

    markSaving()
    blocksApi.delete(noteId, blockId)
      .catch(err => {
        console.error('删除块失败:', err)
        note.blocks.splice(idx, 0, backup)
        note.connections.push(...backupConns)
      })
      .finally(markSaved)
  }

  // ==================== 连线操作 ====================

  function addConnection(noteId, from, to, shape = 'straight', overrides = {}) {
    const note = notes.value.find(n => n.id === noteId)
    if (!note) return null

    const exists = note.connections.some(
      c => (c.from === from && c.to === to) || (c.from === to && c.to === from)
    )
    if (exists) return null

    const ts = getTimestamp()
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
      label: '',
      createdAt: ts,
      updatedAt: ts,
      ...overrides
    }
    note.connections.push(connection)
    note.updatedAt = getTimestamp()

    markSaving()
    connectionsApi.create(noteId, connection)
      .catch(err => {
        console.error('创建连线失败:', err)
        const idx = note.connections.findIndex(c => c.id === connection.id)
        if (idx >= 0) note.connections.splice(idx, 1)
      })
      .finally(markSaved)

    return connection
  }

  function updateConnection(noteId, connectionId, updates) {
    const note = notes.value.find(n => n.id === noteId)
    if (note) {
      const conn = note.connections.find(c => c.id === connectionId)
      if (conn) {
        const ts = getTimestamp()
        Object.assign(conn, updates, { updatedAt: ts })
        note.updatedAt = ts

        markSaving()
        connectionsApi.update(noteId, connectionId, { ...updates, updatedAt: ts })
          .catch(err => console.error('更新连线失败:', err))
          .finally(markSaved)
      }
    }
  }

  function deleteConnection(noteId, connectionId) {
    const note = notes.value.find(n => n.id === noteId)
    if (!note) return

    const idx = note.connections.findIndex(c => c.id === connectionId)
    if (idx < 0) return

    const backup = note.connections[idx]
    note.connections.splice(idx, 1)
    note.updatedAt = getTimestamp()

    markSaving()
    connectionsApi.delete(noteId, connectionId)
      .catch(err => {
        console.error('删除连线失败:', err)
        note.connections.splice(idx, 0, backup)
      })
      .finally(markSaved)
  }

  // ==================== 画布配置 ====================

  function updateCanvasConfig(noteId, config) {
    const note = notes.value.find(n => n.id === noteId)
    if (note) {
      if (!note.canvasConfig || typeof note.canvasConfig !== 'object') {
        note.canvasConfig = { zoom: 1, offsetX: 0, offsetY: 0 }
      }
      Object.assign(note.canvasConfig, config)
      note.updatedAt = getTimestamp()

      markSaving()
      notesApi.update(noteId, { canvasConfig: note.canvasConfig, updatedAt: note.updatedAt })
        .catch(err => console.error('更新画布配置失败:', err))
        .finally(markSaved)
    }
  }

  // ==================== 批量替换（导入/迁移用） ====================

  async function replaceAll(newNotes) {
    notes.value = deepClone(newNotes || [])
  }

  async function replaceAllFolders(newFolders) {
    folders.value = deepClone(newFolders || [])
    await ensureSystemRootFolder()
  }

  function restoreNoteBlocks(noteId, blocks) {
    const note = notes.value.find(n => n.id === noteId)
    if (note) {
      note.blocks = blocks
      note.updatedAt = getTimestamp()

      markSaving()
      blocksApi.batch(noteId, blocks)
        .catch(err => console.error('恢复块失败:', err))
        .finally(markSaved)
    }
  }

  function restoreNoteConnections(noteId, connections) {
    const note = notes.value.find(n => n.id === noteId)
    if (note) {
      note.connections = connections
      note.updatedAt = getTimestamp()

      // 连线没有 batch 接口，逐条创建
      markSaving()
      Promise.all(connections.map(c => connectionsApi.create(noteId, c)))
        .catch(err => console.error('恢复连线失败:', err))
        .finally(markSaved)
    }
  }

  // ==================== 标签操作 ====================

  function setNoteTags(noteId, tags) {
    const note = notes.value.find(n => n.id === noteId)
    if (note) {
      const oldTags = [...(note.tags || [])]
      note.tags = Array.isArray(tags) ? [...tags] : []
      note.updatedAt = getTimestamp()

      markSaving()
      notesApi.updateTags(noteId, note.tags)
        .catch(err => {
          console.error('更新笔记标签失败:', err)
          note.tags = oldTags
          toastError('标签保存失败，请重试')
        })
        .finally(markSaved)
    }
  }

  function setFolderTags(folderId, tags) {
    const folder = folders.value.find(f => f.id === folderId)
    if (folder) {
      const oldTags = [...(folder.tags || [])]
      folder.tags = Array.isArray(tags) ? [...tags] : []
      folder.updatedAt = getTimestamp()

      markSaving()
      foldersApi.updateTags(folderId, folder.tags)
        .catch(err => {
          console.error('更新文件夹标签失败:', err)
          folder.tags = oldTags
          toastError('标签保存失败，请重试')
        })
        .finally(markSaved)
    }
  }

  function notesByTag(tagId) {
    return notes.value.filter(n => !n.deleted && Array.isArray(n.tags) && n.tags.includes(tagId))
  }

  function foldersByTag(tagId) {
    return folders.value.filter(f => !f.deleted && Array.isArray(f.tags) && f.tags.includes(tagId))
  }

  // ==================== 清理 ====================

  function clearCache() {
    if (pendingCount > 0) return
    notes.value = []
    folders.value = []
    currentNoteId.value = null
    currentFolderId.value = null
  }

  // ==================== 导出 ====================

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
    saveStatus,
    init,
    clearCache,
    setNoteTags,
    setFolderTags,
    notesByTag,
    foldersByTag,
    createFolder,
    ensureSystemRootFolder,
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
    restoreNoteConnections,
    getChildFolders,
    getChildFolderCount,
    getFolderNoteCount,
    rootFolders,
    getFolderPath,
    getFolderPathString
  }
})
