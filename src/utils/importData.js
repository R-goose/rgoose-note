export const SYSTEM_ROOT_FOLDER_ID = 'system-root'

const asList = value => Array.isArray(value) ? value : []

function cloneData(data) {
  return JSON.parse(JSON.stringify(data || {}))
}

function groupRecordsByNote(records, notes, key) {
  const grouped = new Map(notes.map(note => [note.id, new Map()]))
  const add = (record, fallbackNoteId) => {
    const noteId = record?.noteId || fallbackNoteId
    if (!noteId || !grouped.has(noteId) || !record?.id) return
    grouped.get(noteId).set(record.id, { ...record, noteId })
  }

  asList(records).forEach(record => add(record))
  notes.forEach(note => asList(note?.[key]).forEach(record => add(record, note.id)))
  return grouped
}

/**
 * 兼容两类备份：blocks/connections 位于顶层，或直接嵌套在 note 中。
 * 返回的 notes 会统一带上嵌套子资源，同时保留扁平数组供后端批量导入。
 */
export function nestNoteChildren(data) {
  const nested = cloneData(data)
  const notes = asList(nested.notes).filter(note => note?.id)
  const blocksByNote = groupRecordsByNote(nested.blocks, notes, 'blocks')
  const connectionsByNote = groupRecordsByNote(nested.connections, notes, 'connections')

  nested.notes = notes.map(note => ({
    ...note,
    blocks: [...blocksByNote.get(note.id).values()],
    connections: [...connectionsByNote.get(note.id).values()]
  }))
  nested.blocks = nested.notes.flatMap(note => note.blocks)
  nested.connections = nested.notes.flatMap(note => note.connections)
  return nested
}

/** 返回导入确认弹窗需要展示的数据概览。 */
export function summarizeImportData(data) {
  const folders = asList(data?.folders)
  const notes = asList(data?.notes)
  return {
    activeFolders: folders.filter(folder => !folder?.deleted && folder?.id !== SYSTEM_ROOT_FOLDER_ID).length,
    deletedFolders: folders.filter(folder => folder?.deleted).length,
    activeNotes: notes.filter(note => !note?.deleted).length,
    deletedNotes: notes.filter(note => note?.deleted).length
  }
}

/**
 * 在写入前准备导入数据。
 * 指定目标文件夹时，只重挂导入树的顶层目录；其余子目录及笔记的原有结构会保留。
 */
export function prepareImportData(data, {
  targetMode = 'merge',
  targetFolderId = null,
  newFolderName = '',
  includeDeleted = false,
  idFactory,
  timestamp = Date.now()
} = {}) {
  let prepared = cloneData(data)
  const restoreOrKeep = item => {
    if (!item?.deleted) return item
    if (!includeDeleted) return null
    return { ...item, deleted: false, updatedAt: timestamp }
  }

  prepared.folders = asList(prepared.folders)
    .filter(folder => folder?.id && folder.id !== SYSTEM_ROOT_FOLDER_ID)
    .map(restoreOrKeep)
    .filter(Boolean)
  prepared.notes = asList(prepared.notes)
    .filter(note => note?.id)
    .map(restoreOrKeep)
    .filter(Boolean)

  const keptNoteIds = new Set(prepared.notes.map(note => note.id))
  prepared.blocks = asList(prepared.blocks).filter(block => keptNoteIds.has(block?.noteId))
  prepared.connections = asList(prepared.connections).filter(connection => keptNoteIds.has(connection?.noteId))
  prepared = nestNoteChildren(prepared)

  let resolvedTargetFolderId = targetFolderId
  let createdFolder = null

  if (targetMode === 'new') {
    if (typeof idFactory !== 'function') throw new Error('创建导入文件夹失败：缺少 ID 生成器')
    const name = newFolderName.trim()
    if (!name) throw new Error('请输入新文件夹名称')
    createdFolder = {
      id: idFactory(),
      name,
      parentId: null,
      tags: [],
      isSystem: false,
      deleted: false,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    resolvedTargetFolderId = createdFolder.id
    prepared.folders.push(createdFolder)
  }

  if (targetMode === 'folder' || targetMode === 'new') {
    if (!resolvedTargetFolderId) throw new Error('请选择要导入到的文件夹')

    // 指定的目标文件夹已存在于当前数据时，不用备份中的同 ID 记录覆盖它。
    if (targetMode === 'folder') {
      prepared.folders = prepared.folders.filter(folder => folder.id !== resolvedTargetFolderId)
    }

    const activeImportedFolderIds = new Set(prepared.folders.map(folder => folder.id))
    let attachedRootFolderCount = 0
    let movedRootNoteCount = 0

    prepared.folders = prepared.folders.map(folder => {
      if (folder.id === resolvedTargetFolderId) return folder
      if (activeImportedFolderIds.has(folder.parentId)) return folder
      attachedRootFolderCount++
      return { ...folder, parentId: resolvedTargetFolderId, updatedAt: timestamp }
    })

    prepared.notes = prepared.notes.map(note => {
      if (activeImportedFolderIds.has(note.folderId)) return note
      movedRootNoteCount++
      return { ...note, folderId: resolvedTargetFolderId, updatedAt: timestamp }
    })

    prepared.blocks = prepared.notes.flatMap(note => note.blocks || [])
    prepared.connections = prepared.notes.flatMap(note => note.connections || [])

    return {
      data: prepared,
      targetFolderId: resolvedTargetFolderId,
      createdFolder,
      attachedRootFolderCount,
      movedRootNoteCount
    }
  }

  // 合并到原结构时，把缺失父目录的文件夹提升为顶层，并将孤立笔记放入系统根目录。
  const importedFolderIds = new Set(prepared.folders.map(folder => folder.id))
  prepared.folders = prepared.folders.map(folder => {
    if (!folder.parentId || folder.parentId === SYSTEM_ROOT_FOLDER_ID || importedFolderIds.has(folder.parentId)) return folder
    return { ...folder, parentId: null, updatedAt: timestamp }
  })
  const validFolderIds = new Set([SYSTEM_ROOT_FOLDER_ID, ...importedFolderIds])
  prepared.notes = prepared.notes.map(note => {
    if (note.folderId && validFolderIds.has(note.folderId)) return note
    return { ...note, folderId: SYSTEM_ROOT_FOLDER_ID, updatedAt: timestamp }
  })
  prepared.blocks = prepared.notes.flatMap(note => note.blocks || [])
  prepared.connections = prepared.notes.flatMap(note => note.connections || [])

  return {
    data: prepared,
    targetFolderId: null,
    createdFolder: null,
    attachedRootFolderCount: 0,
    movedRootNoteCount: 0
  }
}
