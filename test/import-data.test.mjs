import assert from 'node:assert/strict'
import { nestNoteChildren, prepareImportData, summarizeImportData } from '../src/utils/importData.js'

const backup = {
  folders: [
    { id: 'system-root', name: '根目录', parentId: null },
    { id: 'story', name: '剧情', parentId: null, updatedAt: 1 },
    { id: 'chapter', name: '第一章', parentId: 'story', updatedAt: 1 },
    { id: 'removed', name: '已删除目录', parentId: null, deleted: true }
  ],
  notes: [
    { id: 'note-in-folder', title: '剧情笔记', folderId: 'chapter', updatedAt: 1 },
    { id: 'note-at-root', title: '根笔记', folderId: null, updatedAt: 1 },
    { id: 'note-deleted', title: '已删除笔记', folderId: 'removed', deleted: true, updatedAt: 1 }
  ],
  blocks: [
    { id: 'block-1', noteId: 'note-in-folder' },
    { id: 'block-2', noteId: 'note-deleted' }
  ]
}

assert.deepEqual(summarizeImportData(backup), {
  activeFolders: 2,
  deletedFolders: 1,
  activeNotes: 2,
  deletedNotes: 1
})

const intoFolder = prepareImportData(backup, {
  targetMode: 'folder', targetFolderId: 'target', timestamp: 100
})
assert.equal(intoFolder.data.folders.length, 2)
assert.equal(intoFolder.data.folders.find(folder => folder.id === 'story').parentId, 'target')
assert.equal(intoFolder.data.folders.find(folder => folder.id === 'chapter').parentId, 'story')
assert.equal(intoFolder.data.notes.find(note => note.id === 'note-at-root').folderId, 'target')
assert.equal(intoFolder.data.notes.some(note => note.id === 'note-deleted'), false)
assert.deepEqual(intoFolder.data.blocks.map(block => block.id), ['block-1'])
assert.equal(intoFolder.attachedRootFolderCount, 1)
assert.equal(intoFolder.movedRootNoteCount, 1)

const asNewFolder = prepareImportData(backup, {
  targetMode: 'new', newFolderName: '本次导入', idFactory: () => 'new-root', timestamp: 200
})
assert.equal(asNewFolder.createdFolder.id, 'new-root')
assert.equal(asNewFolder.data.folders.find(folder => folder.id === 'new-root').parentId, null)
assert.equal(asNewFolder.data.folders.find(folder => folder.id === 'story').parentId, 'new-root')

const restored = prepareImportData(backup, {
  targetMode: 'merge', includeDeleted: true, timestamp: 300
})
assert.equal(restored.data.folders.find(folder => folder.id === 'removed').deleted, false)
assert.equal(restored.data.notes.find(note => note.id === 'note-deleted').deleted, false)
assert.equal(restored.data.notes.find(note => note.id === 'note-deleted').updatedAt, 300)
assert.deepEqual(restored.data.blocks.map(block => block.id).sort(), ['block-1', 'block-2'])

const nestedTopLevel = nestNoteChildren({
  notes: [{ id: 'note-1' }],
  blocks: [{ id: 'block-top', noteId: 'note-1' }],
  connections: [{ id: 'line-top', noteId: 'note-1' }]
})
assert.deepEqual(nestedTopLevel.notes[0].blocks.map(block => block.id), ['block-top'])
assert.deepEqual(nestedTopLevel.notes[0].connections.map(connection => connection.id), ['line-top'])

const orphaned = prepareImportData({
  folders: [{ id: 'child', parentId: 'missing-parent' }],
  notes: [{ id: 'orphan-note', folderId: 'missing-folder' }]
}, { targetMode: 'merge', timestamp: 400 })
assert.equal(orphaned.data.folders[0].parentId, null)
assert.equal(orphaned.data.notes[0].folderId, 'system-root')

console.log('import-data: PASS')
