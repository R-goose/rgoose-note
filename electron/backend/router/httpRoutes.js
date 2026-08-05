/**
 * HTTP 路由（可选调试模式）
 * 路径与 v2.0 Java 版完全一致，便于前端 src/api/*.js 零改动
 */

const express = require('express')
const multer = require('multer')
const noteService = require('../service/noteService')
const blockService = require('../service/blockService')
const connectionService = require('../service/connectionService')
const folderService = require('../service/folderService')
const planService = require('../service/planService')
const tagService = require('../service/tagService')
const imageService = require('../service/imageService')
const syncService = require('../service/syncService')
const { ok, handleError } = require('../common/response')

const upload = multer({ storage: multer.memoryStorage() })

function createRouter() {
  const app = express()
  app.use(express.json({ limit: '100mb' }))

  // ---------- Notes ----------
  app.get('/api/notes', (req, res) => {
    res.json(ok(noteService.list(req.query)))
  })
  app.get('/api/notes/all', (_req, res) => res.json(ok(noteService.listAll())))
  app.get('/api/notes/:id', (req, res) => res.json(ok(noteService.get(req.params.id))))
  app.post('/api/notes', (req, res) => res.json(ok(noteService.create(req.body))))
  app.put('/api/notes/:id', (req, res) => res.json(ok(noteService.update(req.params.id, req.body))))
  app.delete('/api/notes/:id', (req, res) => { noteService.delete(req.params.id); res.json(ok()) })
  app.post('/api/notes/:id/duplicate', (req, res) => res.json(ok(noteService.duplicate(req.params.id))))

  // ---------- Blocks ----------
  app.get('/api/notes/:noteId/blocks', (req, res) => {
    res.json(ok(blockService.list(req.params.noteId)))
  })
  app.post('/api/notes/:noteId/blocks', (req, res) => {
    res.json(ok(blockService.create(req.params.noteId, req.body)))
  })
  app.put('/api/notes/:noteId/blocks/:blockId', (req, res) => {
    res.json(ok(blockService.update(req.params.noteId, req.params.blockId, req.body)))
  })
  app.delete('/api/notes/:noteId/blocks/:blockId', (req, res) => {
    blockService.delete(req.params.noteId, req.params.blockId)
    res.json(ok())
  })
  app.post('/api/notes/:noteId/blocks/batch', (req, res) => {
    blockService.batchUpdate(req.params.noteId, req.body)
    res.json(ok())
  })

  // ---------- Connections ----------
  app.get('/api/notes/:noteId/connections', (req, res) => {
    res.json(ok(connectionService.list(req.params.noteId)))
  })
  app.post('/api/notes/:noteId/connections', (req, res) => {
    res.json(ok(connectionService.create(req.params.noteId, req.body)))
  })
  app.put('/api/notes/:noteId/connections/:connId', (req, res) => {
    res.json(ok(connectionService.update(req.params.noteId, req.params.connId, req.body)))
  })
  app.delete('/api/notes/:noteId/connections/:connId', (req, res) => {
    connectionService.delete(req.params.noteId, req.params.connId)
    res.json(ok())
  })

  // ---------- Folders ----------
  app.get('/api/folders', (req, res) => {
    res.json(ok(folderService.list(req.query.parentId)))
  })
  app.get('/api/folders/all', (_req, res) => res.json(ok(folderService.listAll())))
  app.get('/api/folders/:id', (req, res) => res.json(ok(folderService.get(req.params.id))))
  app.post('/api/folders', (req, res) => res.json(ok(folderService.create(req.body))))
  app.put('/api/folders/:id', (req, res) => res.json(ok(folderService.update(req.params.id, req.body))))
  app.delete('/api/folders/:id', (req, res) => res.json(ok(folderService.delete(req.params.id))))

  // ---------- Plans ----------
  app.get('/api/plans', (req, res) => {
    const { completed, dueBefore, dueAfter } = req.query
    res.json(ok(planService.list({
      completed: completed == null ? null : completed === 'true',
      dueBefore: dueBefore == null ? null : Number(dueBefore),
      dueAfter: dueAfter == null ? null : Number(dueAfter)
    })))
  })
  app.get('/api/plans/all', (_req, res) => res.json(ok(planService.listAll())))
  app.get('/api/plans/:id', (req, res) => res.json(ok(planService.get(req.params.id))))
  app.post('/api/plans', (req, res) => res.json(ok(planService.create(req.body))))
  app.put('/api/plans/:id', (req, res) => res.json(ok(planService.update(req.params.id, req.body))))
  app.delete('/api/plans/:id', (req, res) => { planService.delete(req.params.id); res.json(ok()) })
  app.patch('/api/plans/:id/complete', (req, res) => { planService.toggleComplete(req.params.id); res.json(ok()) })

  // ---------- Tags ----------
  app.get('/api/tags', (_req, res) => res.json(ok(tagService.list())))
  app.get('/api/tags/:id', (req, res) => res.json(ok(tagService.get(req.params.id))))
  app.post('/api/tags', (req, res) => res.json(ok(tagService.create(req.body))))
  app.put('/api/tags/:id', (req, res) => res.json(ok(tagService.update(req.params.id, req.body))))
  app.delete('/api/tags/:id', (req, res) => { tagService.delete(req.params.id); res.json(ok()) })

  // ---------- Images ----------
  app.post('/api/images', upload.single('file'), (req, res) => {
    const ref = imageService.upload(req.file)
    res.json(ok({ ref }))
  })
  app.get('/api/images', (_req, res) => res.json(ok(imageService.listRefs())))
  app.get('/api/images/meta', (_req, res) => res.json(ok(imageService.listAllWithMeta())))
  app.patch('/api/images/:ref/rename', (req, res) => {
    const { displayName } = req.body || {}
    imageService.rename(req.params.ref, displayName)
    res.json(ok())
  })
  app.get('/api/images/:ref', (req, res) => {
    try {
      const { buffer, mimeType } = imageService.download(req.params.ref)
      res.set('Content-Type', mimeType)
      res.send(buffer)
    } catch (err) {
      handleError(err, req, res)
    }
  })
  app.delete('/api/images/:ref', (req, res) => {
    imageService.delete(req.params.ref)
    res.json(ok())
  })

  // ---------- Proxy (绕过 CORS 下载远程图片) ----------
  app.get('/api/proxy-image', async (req, res) => {
    try {
      const url = req.query.url
      if (!url) return res.status(400).json({ error: 'missing url' })
      const response = await fetch(url)
      if (!response.ok) return res.status(response.status).json({ error: `remote ${response.status}` })
      const arrayBuffer = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') || 'image/png'
      res.set('Content-Type', contentType)
      res.set('Cache-Control', 'public, max-age=86400')
      res.send(Buffer.from(arrayBuffer))
    } catch (err) {
      handleError(err, req, res)
    }
  })

  // ---------- Sync / Data ----------
  app.get('/api/sync', (req, res) => res.json(ok(syncService.pull(Number(req.query.since) || 0))))
  app.get('/api/data/export', (_req, res) => res.json(ok(syncService.pull(0))))
  app.post('/api/data/import', (req, res) => { syncService.importAll(req.body); res.json(ok()) })
  app.delete('/api/data/all', (_req, res) => { syncService.clearAll(); res.json(ok()) })

  app.use(handleError)
  return app
}

module.exports = { createRouter }
