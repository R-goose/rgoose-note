const { app, BrowserWindow, ipcMain, dialog, shell, protocol } = require('electron')
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')
const backend = require('./backend')
const imageService = require('./backend/service/imageService')

let mainWindow

// 注册自定义协议（必须在 app.whenReady 之前）
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'rgoose-image',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
  }
])

function getConfigPath() {
  return path.join(app.getPath('userData'), 'app-config.json')
}

function loadConfig() {
  try {
    const p = getConfigPath()
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'))
    }
  } catch (e) {
    console.error('loadConfig failed:', e)
  }
  return {}
}

function saveConfig(config) {
  try {
    fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2))
  } catch (e) {
    console.error('saveConfig failed:', e)
  }
}

function getCustomDataDir() {
  const config = loadConfig()
  const dir = config.customDataDir
  if (dir && fs.existsSync(dir)) return dir
  return null
}

function createWindow() {
  const config = loadConfig()
  const saved = config.windowBounds
  const wasMaximized = config.isMaximized !== false

  const iconCandidates = [
    path.join(__dirname, '../build/icon.ico'),
    path.join(process.resourcesPath || '', 'build/icon.ico'),
    path.join(__dirname, 'icon.ico')
  ]
  const appIcon = iconCandidates.find(p => { try { return fs.existsSync(p) } catch { return false } }) || undefined

  const windowOptions = {
    minWidth: 800,
    minHeight: 600,
    frame: false,
    resizable: true,
    backgroundColor: '#fafbfa',
    hasShadow: true,
    roundedCorners: true,
    icon: appIcon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  }

  if (saved && typeof saved.width === 'number' && typeof saved.height === 'number') {
    windowOptions.width = saved.width
    windowOptions.height = saved.height
    if (typeof saved.x === 'number' && typeof saved.y === 'number') {
      windowOptions.x = saved.x
      windowOptions.y = saved.y
    }
  } else {
    windowOptions.width = 1280
    windowOptions.height = 800
  }

  mainWindow = new BrowserWindow(windowOptions)

  if (wasMaximized) {
    mainWindow.maximize()
  }

  let saveTimer = null
  const persistWindowState = () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      const cfg = loadConfig()
      if (!mainWindow.isMaximized() && !mainWindow.isMinimized()) {
        cfg.windowBounds = mainWindow.getBounds()
      }
      cfg.isMaximized = mainWindow.isMaximized()
      saveConfig(cfg)
      saveTimer = null
    }, 400)
  }

  mainWindow.on('resize', persistWindowState)
  mainWindow.on('move', persistWindowState)

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('window-maximize-changed', mainWindow.isMaximized())
  })
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximize-changed', true)
    const cfg = loadConfig(); cfg.isMaximized = true; saveConfig(cfg)
  })
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximize-changed', false)
    const cfg = loadConfig(); cfg.isMaximized = false; saveConfig(cfg)
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize()
})

ipcMain.handle('window-toggle-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  }
})

ipcMain.handle('window-close', () => {
  if (mainWindow) mainWindow.close()
})

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false
})

// 截取窗口内指定 DIP 矩形，返回高清 PNG dataURL（用于笔记导出）
// 渲染端已通过 canvasConfig 撑大画布容器，这里只需：
// 1. 临时扩大窗口容纳整个画布
// 2. setZoomFactor 提升清晰度
// 3. capturePage 截取（原生渲染 SVG/伪元素/CSS变量，所见即所得）
// 4. 恢复
ipcMain.handle('capture-page', async (_event, payload) => {
  if (!mainWindow) return null
  const opts = payload || {}
  const rect = opts.rect
  const scale = opts.scale || 2
  try {
    const [origW, origH] = mainWindow.getContentSize()
    const [origMaxW, origMaxH] = mainWindow.getMaximumSize()
    const origZoom = mainWindow.webContents.getZoomFactor()

    // 1. 先放大页面（zoomFactor 改变布局缩放，内容在窗口中放大 scale 倍）
    mainWindow.webContents.setZoomFactor(scale)
    await new Promise(r => setTimeout(r, 300))

    // 2. 临时扩大窗口以容纳放大后的画布（rect 是 zoom=1 的 DIP，放大后 = rect × scale）
    if (rect) {
      const needW = Math.ceil(rect.width * scale + rect.x * scale + 16)
      const needH = Math.ceil(rect.height * scale + rect.y * scale + 16)
      if (needW > origW || needH > origH) {
        mainWindow.setMaximumSize(16000, 16000)
        mainWindow.setContentSize(needW, needH)
        await new Promise(r => setTimeout(r, 400))
      }
    }

    // 3. capturePage：放大后的画布在窗口坐标 = rect × scale
    let image
    if (rect) {
      const dip = {
        x: Math.round(rect.x * scale),
        y: Math.round(rect.y * scale),
        width: Math.round(rect.width * scale),
        height: Math.round(rect.height * scale)
      }
      image = await mainWindow.webContents.capturePage(dip)
    } else {
      image = await mainWindow.webContents.capturePage()
    }

    // 4. 恢复
    mainWindow.webContents.setZoomFactor(origZoom)
    mainWindow.setContentSize(origW, origH)
    mainWindow.setMaximumSize(origMaxW, origMaxH)

    return image.toDataURL()
  } catch (e) {
    console.error('capture-page failed:', e)
    try {
      mainWindow.webContents.setZoomFactor(1)
    } catch (_) {}
    return null
  }
})

ipcMain.handle('get-data-path', () => {
  return path.join(app.getPath('userData'), 'rgoose_note_data.json')
})

ipcMain.handle('export-data', async (_event, data) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: '导出数据',
    defaultPath: `rgoose-note-backup-${Date.now()}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })

  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2))
    return true
  }

  return false
})

/** 选择导出文件夹（仅弹窗，返回路径） */
ipcMain.handle('select-export-dir', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择导出文件夹',
    properties: ['openDirectory']
  })

  if (result.canceled || !result.filePaths.length) {
    return null
  }
  return result.filePaths[0]
})

/** 将素材文件写入指定目录 */
ipcMain.handle('write-media-to-dir', async (_event, { dir, files }) => {
  let count = 0
  for (const file of files) {
    const filePath = path.join(dir, file.name)
    fs.writeFileSync(filePath, Buffer.from(file.buffer, 'base64'))
    count++
  }
  return count
})

ipcMain.handle('import-data', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '导入数据',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  })

  if (!result.canceled && result.filePaths.length > 0) {
    const content = fs.readFileSync(result.filePaths[0], 'utf-8')
    return JSON.parse(content)
  }

  return null
})

function getDataDir() {
  const custom = getCustomDataDir()
  if (custom) return custom
  return path.join(app.getPath('userData'), 'rgoose-data')
}

function getImagesDir() {
  return path.join(getDataDir(), 'images')
}

function ensureImagesDir() {
  const dir = getImagesDir()
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

ipcMain.handle('get-storage-info', () => {
  const config = loadConfig()
  return {
    type: 'electron',
    dataDir: getDataDir(),
    dataFile: path.join(getDataDir(), 'rgoose.db'),
    dbFile: path.join(getDataDir(), 'rgoose.db'),
    imagesDir: getImagesDir(),
    isCustom: !!config.customDataDir,
    defaultDir: path.join(app.getPath('userData'), 'rgoose-data')
  }
})

ipcMain.handle('pick-data-dir', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择数据存储位置',
    properties: ['openDirectory', 'createDirectory']
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

ipcMain.handle('change-data-dir', async (_event, targetDir) => {
  try {
    if (!targetDir || typeof targetDir !== 'string') {
      return { ok: false, error: '无效的目标路径' }
    }
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    const srcDir = getDataDir()
    const dstDbFile = path.join(targetDir, 'rgoose.db')
    const dstImagesDir = path.join(targetDir, 'images')

    // 关闭后端以释放 SQLite 文件句柄
    backend.stop()

    // 迁移 rgoose.db（及 WAL/SHM 附属文件）
    for (const suffix of ['', '-wal', '-shm']) {
      const src = path.join(srcDir, `rgoose.db${suffix}`)
      if (fs.existsSync(src)) fs.copyFileSync(src, dstDbFile + suffix)
    }
    // 迁移 images/
    const srcImagesDir = getImagesDir()
    if (fs.existsSync(srcImagesDir)) {
      if (fs.existsSync(dstImagesDir)) {
        fs.rmSync(dstImagesDir, { recursive: true, force: true })
      }
      fs.cpSync(srcImagesDir, dstImagesDir, { recursive: true })
    }

    // 切换配置
    const config = loadConfig()
    config.customDataDir = targetDir
    saveConfig(config)

    // 重启后端（指向新目录）
    backend.start(getDataDir())

    // 清理旧目录（仅当旧目录是默认 userData 目录且迁移成功）
    const defaultDir = path.join(app.getPath('userData'), 'rgoose-data')
    if (path.resolve(srcDir) === path.resolve(defaultDir)) {
      try {
        if (fs.existsSync(srcImagesDir)) fs.rmSync(srcImagesDir, { recursive: true, force: true })
        for (const suffix of ['', '-wal', '-shm']) {
          const f = path.join(srcDir, `rgoose.db${suffix}`)
          if (fs.existsSync(f)) fs.unlinkSync(f)
        }
      } catch (e) {
        // 清理失败不阻断流程
      }
    }

    return { ok: true, newDir: targetDir }
  } catch (e) {
    console.error('change-data-dir failed:', e)
    // 失败时尝试重启后端
    try { backend.start(getDataDir()) } catch (_) {}
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('reset-data-dir', async () => {
  try {
    const config = loadConfig()
    const currentDir = getDataDir()
    const defaultDir = path.join(app.getPath('userData'), 'rgoose-data')

    if (currentDir !== defaultDir) {
      // 关闭后端
      backend.stop()

      if (!fs.existsSync(defaultDir)) fs.mkdirSync(defaultDir, { recursive: true })
      // 迁回 rgoose.db 及附属文件
      for (const suffix of ['', '-wal', '-shm']) {
        const src = path.join(currentDir, `rgoose.db${suffix}`)
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, path.join(defaultDir, `rgoose.db${suffix}`))
        }
      }
      const srcImagesDir = path.join(currentDir, 'images')
      if (fs.existsSync(srcImagesDir)) {
        fs.cpSync(srcImagesDir, path.join(defaultDir, 'images'), { recursive: true })
      }

      config.customDataDir = null
      saveConfig(config)

      // 重启后端指向默认目录
      backend.start(getDataDir())
    }

    return { ok: true, newDir: defaultDir }
  } catch (e) {
    try { backend.start(getDataDir()) } catch (_) {}
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('read-data-file', async () => {
  try {
    const file = path.join(getDataDir(), 'data.json')
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8')
      return JSON.parse(content)
    }
    return null
  } catch (e) {
    console.error('read-data-file failed:', e)
    return null
  }
})

ipcMain.handle('write-data-file', async (_event, data) => {
  try {
    const dir = getDataDir()
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const file = path.join(dir, 'data.json')
    const tmp = file + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(data))
    fs.renameSync(tmp, file)
    return true
  } catch (e) {
    console.error('write-data-file failed:', e)
    return false
  }
})

ipcMain.handle('save-image', async (_event, base64Data, ext) => {
  try {
    const dir = ensureImagesDir()
    const safeExt = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext) ? ext : 'png'
    const fileName = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${safeExt}`
    const filePath = path.join(dir, fileName)
    const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '')
    fs.writeFileSync(filePath, Buffer.from(base64, 'base64'))
    return { ok: true, path: fileName }
  } catch (e) {
    console.error('save-image failed:', e)
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('read-image', async (_event, relativePath) => {
  try {
    const filePath = path.join(getImagesDir(), relativePath)
    if (!fs.existsSync(filePath)) return null
    const buffer = fs.readFileSync(filePath)
    const ext = path.extname(relativePath).slice(1).toLowerCase() || 'png'
    const mime = ext === 'jpg' ? 'jpeg' : ext
    return `data:image/${mime};base64,${buffer.toString('base64')}`
  } catch (e) {
    console.error('read-image failed:', e)
    return null
  }
})

ipcMain.handle('resolve-image-path', async (_event, relativePath) => {
  return path.join(getImagesDir(), relativePath)
})

ipcMain.handle('delete-image', async (_event, relativePath) => {
  try {
    const filePath = path.join(getImagesDir(), relativePath)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    return true
  } catch (e) {
    return false
  }
})

ipcMain.handle('list-images', async () => {
  try {
    const dir = getImagesDir()
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir).filter(f => !f.startsWith('.'))
  } catch (e) {
    return []
  }
})

function getDirSize(dir) {
  if (!fs.existsSync(dir)) return 0
  const stat = fs.statSync(dir)
  if (stat.isFile()) return stat.size
  let total = 0
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      total += getDirSize(full)
    } else {
      total += fs.statSync(full).size
    }
  }
  return total
}

ipcMain.handle('get-storage-size', async () => {
  const result = {
    dataFileSize: 0,
    imagesDirSize: 0,
    dataSize: 0,
    dataDirSize: 0,
    backupSize: 0,
    backupCount: 0,
    appSize: 0,
    totalSize: 0
  }
  try {
    const dataDir = getDataDir()
    const imagesDir = getImagesDir()
    const userData = app.getPath('userData')

    try {
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
    } catch (_) {}

    try {
      // 统计 rgoose.db 及 WAL/SHM 附属文件总大小
      const dbFile = path.join(dataDir, 'rgoose.db')
      let dbTotal = 0
      for (const suffix of ['', '-wal', '-shm']) {
        const f = path.join(dataDir, `rgoose.db${suffix}`)
        if (fs.existsSync(f)) dbTotal += fs.statSync(f).size
      }
      result.dataFileSize = dbTotal
    } catch (e) {
      console.error('measure rgoose.db failed:', e)
    }

    try {
      result.imagesDirSize = getDirSize(imagesDir)
    } catch (e) {
      console.error('measure images dir failed:', e)
    }

    try {
      const backups = fs.readdirSync(userData)
        .filter(n => n.startsWith('backup_'))
        .map(n => {
          const full = path.join(userData, n)
          return { name: n, size: getDirSize(full), mtime: fs.statSync(full).mtimeMs }
        })
      result.backupSize = backups.reduce((s, b) => s + b.size, 0)
      result.backupCount = backups.length
    } catch (e) {
      console.error('measure backups failed:', e)
    }

    try {
      if (app.isPackaged) {
        result.appSize = getDirSize(app.getAppPath())
      } else {
        const appPath = app.getAppPath()
        let appTotal = 0
        const appCodeDirs = ['dist', 'electron', 'build']
        for (const d of appCodeDirs) {
          try {
            const p = path.join(appPath, d)
            if (fs.existsSync(p)) appTotal += getDirSize(p)
          } catch (_) {}
        }
        result.appSize = appTotal
      }
    } catch (e) {
      console.error('measure app size failed:', e)
    }

    result.dataDirSize = result.dataFileSize + result.imagesDirSize
    result.dataSize = result.dataFileSize
    result.totalSize = result.dataFileSize + result.imagesDirSize + result.backupSize
  } catch (e) {
    console.error('get-storage-size failed:', e)
  }
  return result
})

ipcMain.handle('open-path', async (_event, targetPath) => {
  try {
    if (!targetPath || typeof targetPath !== 'string') return { ok: false, error: 'invalid path' }
    const resolved = path.resolve(targetPath)
    if (fs.existsSync(resolved)) {
      const stat = fs.statSync(resolved)
      if (stat.isDirectory()) {
        await shell.openPath(resolved)
      } else {
        shell.showItemInFolder(resolved)
      }
      return { ok: true }
    }
    const parent = path.dirname(resolved)
    if (fs.existsSync(parent)) {
      await shell.openPath(parent)
      return { ok: true }
    }
    return { ok: false, error: 'path not found' }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('open-backup', async (_event, name) => {
  try {
    if (!name || typeof name !== 'string' || !name.startsWith('backup_')) {
      return { ok: false, error: 'invalid backup name' }
    }
    const full = path.join(app.getPath('userData'), name)
    if (!fs.existsSync(full)) return { ok: false, error: 'backup not found' }
    const stat = fs.statSync(full)
    if (stat.isDirectory()) await shell.openPath(full)
    else shell.showItemInFolder(full)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('open-backups-folder', async () => {
  try {
    await shell.openPath(app.getPath('userData'))
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('create-backup', async () => {
  try {
    backend.flush()
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const userData = app.getPath('userData')
    const zipPath = path.join(userData, `backup_${ts}.zip`)
    const stagingDir = path.join(userData, `.backup-stage-${ts}`)
    fs.rmSync(stagingDir, { recursive: true, force: true })
    fs.mkdirSync(stagingDir, { recursive: true })

    const srcData = path.join(getDataDir(), 'rgoose.db')
    if (fs.existsSync(srcData)) {
      // 备份 rgoose.db 及 WAL/SHM 附属文件
      for (const suffix of ['', '-wal', '-shm']) {
        const f = path.join(getDataDir(), `rgoose.db${suffix}`)
        if (fs.existsSync(f)) fs.copyFileSync(f, path.join(stagingDir, `rgoose.db${suffix}`))
      }
    }
    const srcImages = getImagesDir()
    if (fs.existsSync(srcImages)) {
      fs.cpSync(srcImages, path.join(stagingDir, 'images'), { recursive: true })
    }

    let zipped = false
    if (process.platform === 'win32') {
      try {
        const psStaging = stagingDir.replace(/'/g, "''")
        const psZip = zipPath.replace(/'/g, "''")
        execSync(
          `powershell -NoProfile -NonInteractive -Command "Compress-Archive -LiteralPath '${psStaging}\\*' -DestinationPath '${psZip}' -Force"`,
          { windowsHide: true, timeout: 180000 }
        )
        zipped = fs.existsSync(zipPath)
      } catch (e) {
        console.error('zip via powershell failed:', e)
      }
    }

    fs.rmSync(stagingDir, { recursive: true, force: true })

    let finalPath
    if (zipped) {
      finalPath = zipPath
    } else {
      const backupDir = path.join(userData, `backup_${ts}`)
      fs.mkdirSync(backupDir, { recursive: true })
      for (const suffix of ['', '-wal', '-shm']) {
        const f = path.join(getDataDir(), `rgoose.db${suffix}`)
        if (fs.existsSync(f)) fs.copyFileSync(f, path.join(backupDir, `rgoose.db${suffix}`))
      }
      if (fs.existsSync(srcImages)) fs.cpSync(srcImages, path.join(backupDir, 'images'), { recursive: true })
      finalPath = backupDir
    }

    const backups = fs.readdirSync(userData)
      .filter(n => n.startsWith('backup_'))
      .map(n => ({ name: n, mtime: fs.statSync(path.join(userData, n)).mtimeMs }))
      .sort((a, b) => a.mtime - b.mtime)
    while (backups.length > 5) {
      const old = backups.shift()
      fs.rmSync(path.join(userData, old.name), { recursive: true, force: true })
    }
    return { ok: true, path: finalPath, timestamp: ts }
  } catch (e) {
    console.error('create-backup failed:', e)
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('list-backups', async () => {
  try {
    const userData = app.getPath('userData')
    if (!fs.existsSync(userData)) return []
    return fs.readdirSync(userData)
      .filter(n => n.startsWith('backup_'))
      .map(n => {
        const full = path.join(userData, n)
        const stat = fs.statSync(full)
        return { name: n, size: getDirSize(full), mtime: stat.mtimeMs }
      })
      .sort((a, b) => b.mtime - a.mtime)
  } catch (e) {
    return []
  }
})

ipcMain.handle('delete-backup', async (_event, backupName) => {
  try {
    const userData = app.getPath('userData')
    const full = path.join(userData, backupName)
    if (fs.existsSync(full) && backupName.startsWith('backup_')) {
      fs.rmSync(full, { recursive: true, force: true })
      return true
    }
    return false
  } catch (e) {
    return false
  }
})

function flushDataFile() {
  // 兼容旧调用：实际 flush 由 backend.flush() 完成
  backend.flush()
}

// 测试模式：--test-smoke 运行后端冒烟测试后退出
if (process.argv.includes('--test-smoke')) {
  app.whenReady().then(() => {
    try { require('./../test/run-smoke.cjs')((failed) => { app.exit(failed > 0 ? 1 : 0) }) }
    catch (e) { console.error(e); app.exit(1) }
  })
} else {

app.whenReady().then(async () => {
  // 启动后端（SQLite + IPC + 可选 HTTP）
  try {
    backend.start(getDataDir())
  } catch (e) {
    console.error('[main] backend start failed:', e)
  }

  // 注册图片协议处理器：rgoose-image://{ref} → 返回图片二进制流
  protocol.handle('rgoose-image', async (req) => {
    // URL 格式：rgoose-image://host/img_xxx.png
    // 取 pathname 部分（去掉前导 /）
    const ref = decodeURIComponent(req.url.replace(/^rgoose-image:\/\/[^/]+\//, ''))
    try {
      const { buffer, mimeType } = imageService.download(ref)
      return new Response(buffer, {
        status: 200,
        headers: { 'Content-Type': mimeType, 'Cache-Control': 'max-age=86400' }
      })
    } catch (err) {
      return new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } })
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

} // end else (非测试模式)

app.on('window-all-closed', () => {
  backend.stop()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
