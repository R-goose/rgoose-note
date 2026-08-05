/**
 * IPC 路由注册
 * 通道命名规范：backend:{resource}:{action}
 */

const { ipcMain } = require('electron')
const noteService = require('../service/noteService')
const blockService = require('../service/blockService')
const connectionService = require('../service/connectionService')
const folderService = require('../service/folderService')
const planService = require('../service/planService')
const tagService = require('../service/tagService')
const imageService = require('../service/imageService')
const syncService = require('../service/syncService')
const { wrap } = require('../common/response')

function register() {
  // ---------- Notes ----------
  ipcMain.handle('backend:notes:list',     (_e, params) => wrap(() => noteService.list(params || {})))
  ipcMain.handle('backend:notes:get',      (_e, id) => wrap(() => noteService.get(id)))
  ipcMain.handle('backend:notes:create',   (_e, note) => wrap(() => noteService.create(note)))
  ipcMain.handle('backend:notes:update',   (_e, { id, note }) => wrap(() => noteService.update(id, note)))
  ipcMain.handle('backend:notes:delete',   (_e, id) => wrap(() => noteService.delete(id)))
  ipcMain.handle('backend:notes:duplicate',(_e, id) => wrap(() => noteService.duplicate(id)))
  ipcMain.handle('backend:notes:listAll',  () => wrap(() => noteService.listAll()))

  // ---------- Blocks ----------
  ipcMain.handle('backend:blocks:list',    (_e, noteId) => wrap(() => blockService.list(noteId)))
  ipcMain.handle('backend:blocks:create',  (_e, { noteId, block }) => wrap(() => blockService.create(noteId, block)))
  ipcMain.handle('backend:blocks:update',  (_e, { noteId, blockId, block }) => wrap(() => blockService.update(noteId, blockId, block)))
  ipcMain.handle('backend:blocks:delete',  (_e, { noteId, blockId }) => wrap(() => blockService.delete(noteId, blockId)))
  ipcMain.handle('backend:blocks:batch',   (_e, { noteId, blocks }) => wrap(() => blockService.batchUpdate(noteId, blocks)))

  // ---------- Connections ----------
  ipcMain.handle('backend:connections:list',   (_e, noteId) => wrap(() => connectionService.list(noteId)))
  ipcMain.handle('backend:connections:create', (_e, { noteId, conn }) => wrap(() => connectionService.create(noteId, conn)))
  ipcMain.handle('backend:connections:update', (_e, { noteId, connId, conn }) => wrap(() => connectionService.update(noteId, connId, conn)))
  ipcMain.handle('backend:connections:delete', (_e, { noteId, connId }) => wrap(() => connectionService.delete(noteId, connId)))

  // ---------- Folders ----------
  ipcMain.handle('backend:folders:list',     (_e, parentId) => wrap(() => folderService.list(parentId)))
  ipcMain.handle('backend:folders:get',      (_e, id) => wrap(() => folderService.get(id)))
  ipcMain.handle('backend:folders:create',   (_e, folder) => wrap(() => folderService.create(folder)))
  ipcMain.handle('backend:folders:update',   (_e, { id, folder }) => wrap(() => folderService.update(id, folder)))
  ipcMain.handle('backend:folders:delete',   (_e, id) => wrap(() => folderService.delete(id)))
  ipcMain.handle('backend:folders:listAll',  () => wrap(() => folderService.listAll()))

  // ---------- Plans ----------
  ipcMain.handle('backend:plans:list',           (_e, params) => wrap(() => planService.list(params || {})))
  ipcMain.handle('backend:plans:get',            (_e, id) => wrap(() => planService.get(id)))
  ipcMain.handle('backend:plans:create',         (_e, plan) => wrap(() => planService.create(plan)))
  ipcMain.handle('backend:plans:update',         (_e, { id, plan }) => wrap(() => planService.update(id, plan)))
  ipcMain.handle('backend:plans:delete',         (_e, id) => wrap(() => planService.delete(id)))
  ipcMain.handle('backend:plans:toggleComplete', (_e, id) => wrap(() => planService.toggleComplete(id)))
  ipcMain.handle('backend:plans:listAll',        () => wrap(() => planService.listAll()))

  // ---------- Tags ----------
  ipcMain.handle('backend:tags:list',     () => wrap(() => tagService.list()))
  ipcMain.handle('backend:tags:get',      (_e, id) => wrap(() => tagService.get(id)))
  ipcMain.handle('backend:tags:create',   (_e, tag) => wrap(() => tagService.create(tag)))
  ipcMain.handle('backend:tags:update',   (_e, { id, tag }) => wrap(() => tagService.update(id, tag)))
  ipcMain.handle('backend:tags:delete',   (_e, id) => wrap(() => tagService.delete(id)))

  // ---------- Images ----------
  ipcMain.handle('backend:images:upload',   (_e, { base64, fileName }) => wrap(() => {
    return { ref: imageService.saveFromDataUrl(base64, fileName) }
  }))
  ipcMain.handle('backend:images:download', (_e, ref) => wrap(() => {
    const { buffer, mimeType } = imageService.download(ref)
    return { buffer: buffer.toString('base64'), mimeType }
  }))
  ipcMain.handle('backend:images:delete',   (_e, ref) => wrap(() => imageService.delete(ref)))
  ipcMain.handle('backend:images:listRefs', () => wrap(() => imageService.listRefs()))
  ipcMain.handle('backend:images:listAllWithMeta', () => wrap(() => imageService.listAllWithMeta()))
  ipcMain.handle('backend:images:rename', (_e, { ref, displayName }) => wrap(() => imageService.rename(ref, displayName)))

  // ---------- 远程图片下载（绕过 CORS） ----------
  ipcMain.handle('backend:images:fetchRemote', async (_e, url) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const arrayBuffer = await response.arrayBuffer()
    const mimeType = response.headers.get('content-type') || 'image/png'
    return { base64: Buffer.from(arrayBuffer).toString('base64'), mimeType }
  })

  // ---------- Sync / Data ----------
  ipcMain.handle('backend:sync:pull',       (_e, since) => wrap(() => syncService.pull(since || 0)))
  ipcMain.handle('backend:sync:exportAll',  () => wrap(() => syncService.pull(0)))
  ipcMain.handle('backend:sync:importAll',  (_e, data) => wrap(() => syncService.importAll(data)))
  ipcMain.handle('backend:sync:clearAll',   () => wrap(() => syncService.clearAll()))
}

module.exports = { register }
