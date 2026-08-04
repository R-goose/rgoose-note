/**
 * 后端冒烟测试运行器（在 Electron 主进程中执行）
 * 通过 main.js --test-smoke 触发，导出函数接收 done 回调
 *
 * 运行：npm run test:smoke
 */
const path = require('path')
const fs = require('fs')
const os = require('os')

module.exports = function runSmoke(done) {
  const BACKEND_DIR = path.join(__dirname, '..', 'electron', 'backend')
  const tmpDir = path.join(os.tmpdir(), `rgoose-smoke-${Date.now()}`)
  // 清理历史残留
  for (const entry of fs.readdirSync(os.tmpdir())) {
    if (entry.startsWith('rgoose-smoke-')) {
      try { fs.rmSync(path.join(os.tmpdir(), entry), { recursive: true, force: true }) } catch (_) {}
    }
  }
  fs.mkdirSync(tmpDir, { recursive: true })

  const config = require(path.join(BACKEND_DIR, 'config'))
  config.dataDir = tmpDir
  config.mode = 'ipc'

  const { getDb, closeDb } = require(path.join(BACKEND_DIR, 'db', 'connection'))
  const { runMigrations } = require(path.join(BACKEND_DIR, 'db', 'migrate'))
  const folderDao = require(path.join(BACKEND_DIR, 'dao', 'folderDao'))
  const folderService = require(path.join(BACKEND_DIR, 'service', 'folderService'))
  const noteService = require(path.join(BACKEND_DIR, 'service', 'noteService'))
  const blockService = require(path.join(BACKEND_DIR, 'service', 'blockService'))
  const connectionService = require(path.join(BACKEND_DIR, 'service', 'connectionService'))
  const planService = require(path.join(BACKEND_DIR, 'service', 'planService'))
  const tagService = require(path.join(BACKEND_DIR, 'service', 'tagService'))
  const imageService = require(path.join(BACKEND_DIR, 'service', 'imageService'))
  const syncService = require(path.join(BACKEND_DIR, 'service', 'syncService'))
  const { uuid } = require(path.join(BACKEND_DIR, 'common', 'utils'))

  let passed = 0, failed = 0
  const assert = (cond, msg) => {
    if (cond) { passed++; console.log(`  ✓ ${msg}`) }
    else { failed++; console.error(`  ✗ ${msg}`) }
  }

  try {
    console.log('=== 1. 初始化数据库 ===')
    const db = getDb(tmpDir)
    runMigrations(db)
    assert(true, '数据库初始化成功')

    console.log('=== 2. 文件夹 ===')
    const rootFolders = folderService.list(null)
    assert(rootFolders.length === 1, `根目录存在系统文件夹 (got ${rootFolders.length})`)
    assert(rootFolders[0].id === 'system-root', '系统根目录 ID = system-root')
    assert(rootFolders[0].isSystem === true, 'isSystem 反序列化为 true')

    const folder = folderService.create({
      id: uuid(), name: '测试文件夹', parentId: 'system-root', tags: ['tag-1']
    })
    assert(folder.id, '文件夹创建返回 id')
    assert(Array.isArray(folder.tags) && folder.tags.length === 1, 'tags 反序列化为数组')

    console.log('=== 3. 笔记 ===')
    const note = noteService.create({
      id: uuid(), title: '测试笔记', folderId: folder.id, tags: ['tag-1'],
      canvasConfig: { zoom: 1, offsetX: 0, offsetY: 0 }
    })
    assert(note.id, '笔记创建返回 id')
    assert(note.canvasConfig && note.canvasConfig.zoom === 1, 'canvasConfig 反序列化为对象')

    console.log('=== 4. 块 ===')
    const block1 = blockService.create(note.id, {
      id: uuid(), type: 'text', content: 'Hello', x: 100, y: 100, width: 240, minHeight: 60, color: 'default'
    })
    const block2 = blockService.create(note.id, {
      id: uuid(), type: 'todo', content: '买牛奶', x: 400, y: 100, width: 240, minHeight: 60,
      status: 'pending', priority: 'high'
    })
    assert(blockService.list(note.id).length === 2, '块列表 = 2')

    console.log('=== 4b. 全类型块字段持久化 ===')
    const calloutBlock = blockService.create(note.id, {
      id: uuid(), type: 'callout', content: '提示', calloutType: 'warning', x: 0, y: 0, width: 280, minHeight: 60
    })
    const reloadedCallout = blockService.list(note.id).find(b => b.id === calloutBlock.id)
    assert(reloadedCallout.calloutType === 'warning', 'callout.calloutType 持久化')

    const tableBlock = blockService.create(note.id, {
      id: uuid(), type: 'table', tableData: 'A|B\n1|2', tableAnalysis: true, x: 0, y: 0, width: 280, minHeight: 60
    })
    const reloadedTable = blockService.list(note.id).find(b => b.id === tableBlock.id)
    assert(reloadedTable.tableData === 'A|B\n1|2', 'table.tableData 持久化')
    assert(reloadedTable.tableAnalysis === true, 'table.tableAnalysis 反序列化为 true')

    const milestoneBlock = blockService.create(note.id, {
      id: uuid(), type: 'milestone', title: '里程碑', date: Date.now(), done: true, desc: '描述',
      x: 0, y: 0, width: 300, minHeight: 100
    })
    const reloadedMilestone = blockService.list(note.id).find(b => b.id === milestoneBlock.id)
    assert(reloadedMilestone.done === true, 'milestone.done 反序列化为 true')
    assert(reloadedMilestone.desc === '描述', 'milestone.desc 持久化（SQL 保留字）')

    console.log('=== 5. 连线 ===')
    const conn = connectionService.create(note.id, {
      id: uuid(), from: block1.id, to: block2.id, shape: 'bezier', color: '#4a9568'
    })
    const dupConn = connectionService.create(note.id, {
      id: uuid(), from: block2.id, to: block1.id, shape: 'straight'
    })
    assert(dupConn.id === conn.id, '双向去重：反向连线返回已存在的连线')
    assert(connectionService.list(note.id).length === 1, '连线列表去重后 = 1')

    console.log('=== 6. 计划 ===')
    const plan = planService.create({
      id: uuid(), title: '完成报告', priority: 'high', tags: ['tag-1'],
      dueDate: Date.now() + 86400000, noteId: note.id
    })
    assert(plan.completed === false, 'completed 反序列化为 false')
    assert(planService.toggleComplete(plan.id).completed === true, '切换完成状态 → true')

    console.log('=== 7. 标签 ===')
    const tag = tagService.create({ id: uuid(), name: '重要', color: '#4a9568' })
    assert(tag.id, '标签创建返回 id')
    let dupError = null
    try { tagService.create({ id: uuid(), name: '重要', color: '#000' }) }
    catch (e) { dupError = e }
    assert(dupError && dupError.code === 40900, '标签名唯一校验抛出冲突错误')

    console.log('=== 8. 图片 ===')
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    const ref = imageService.saveFromDataUrl(`data:image/png;base64,${pngBase64}`, 'test.png')
    assert(ref && ref.startsWith('img_'), '图片保存返回 ref')
    const downloaded = imageService.download(ref)
    assert(downloaded.buffer && downloaded.buffer.length > 0, '图片下载返回 buffer')
    assert(downloaded.mimeType === 'image/png', 'mimeType = image/png')

    console.log('=== 9. 笔记复制 ===')
    const dupNote = noteService.duplicate(note.id)
    assert(dupNote.id !== note.id, '复制笔记生成新 ID')
    assert(Array.isArray(dupNote.blocks), 'duplicate 返回值包含 blocks 数组')
    const dupBlocks = blockService.list(dupNote.id)
    assert(dupBlocks.length === 5, `复制后块数 = 5 (got ${dupBlocks.length})`)

    console.log('=== 10. 同步导出 ===')
    const exported = syncService.pull(0)
    assert(exported.folders.length >= 2, '导出文件夹数 >= 2')
    assert(exported.notes.every(n => !n.deleted), '全量同步不返回已软删笔记')

    console.log('=== 11. 级联删除 ===')
    folderService.delete(folder.id)
    const deletedFolder = folderDao.getById(folder.id)
    assert(deletedFolder && deletedFolder.deleted === true, '文件夹软删')
    assert(folderService.list(folder.id).length === 0, '子文件夹已级联软删')

    console.log('=== 12. 清空数据 ===')
    syncService.clearAll()
    assert(syncService.pull(0).notes.length === 0, '清空后 notes = 0')

    console.log('\n==========================')
    console.log(`✓ 通过: ${passed}  ✗ 失败: ${failed}`)
    console.log('==========================')
  } catch (e) {
    console.error('\n冒烟测试异常:', e)
    failed++
  } finally {
    closeDb()
    try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch (_) {}
    done(failed)
  }
}
