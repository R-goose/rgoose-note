const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

let mainWindow

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
      preload: path.join(__dirname, 'preload.cjs')
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
    dataFile: path.join(getDataDir(), 'data.json'),
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
    const dstDataFile = path.join(targetDir, 'data.json')
    const dstImagesDir = path.join(targetDir, 'images')

    // 迁移 data.json
    const srcDataFile = path.join(srcDir, 'data.json')
    if (fs.existsSync(srcDataFile)) {
      fs.copyFileSync(srcDataFile, dstDataFile)
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

    // 清理旧目录（仅当旧目录是默认 userData 目录且迁移成功）
    const defaultDir = path.join(app.getPath('userData'), 'rgoose-data')
    if (path.resolve(srcDir) === path.resolve(defaultDir)) {
      // 保留默认目录但清空其数据（避免重复）
      try {
        if (fs.existsSync(srcImagesDir)) fs.rmSync(srcImagesDir, { recursive: true, force: true })
        if (fs.existsSync(srcDataFile)) fs.unlinkSync(srcDataFile)
      } catch (e) {
        // 清理失败不阻断流程
      }
    }

    return { ok: true, newDir: targetDir }
  } catch (e) {
    console.error('change-data-dir failed:', e)
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('reset-data-dir', async () => {
  try {
    const config = loadConfig()
    const currentDir = getDataDir()
    const defaultDir = path.join(app.getPath('userData'), 'rgoose-data')

    if (currentDir !== defaultDir) {
      // 把当前自定义目录数据迁回默认目录
      if (!fs.existsSync(defaultDir)) fs.mkdirSync(defaultDir, { recursive: true })
      const srcDataFile = path.join(currentDir, 'data.json')
      if (fs.existsSync(srcDataFile)) {
        fs.copyFileSync(srcDataFile, path.join(defaultDir, 'data.json'))
      }
      const srcImagesDir = path.join(currentDir, 'images')
      if (fs.existsSync(srcImagesDir)) {
        fs.cpSync(srcImagesDir, path.join(defaultDir, 'images'), { recursive: true })
      }
    }

    config.customDataDir = null
    saveConfig(config)
    return { ok: true, newDir: defaultDir }
  } catch (e) {
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
      const dataFile = path.join(dataDir, 'data.json')
      if (fs.existsSync(dataFile)) {
        result.dataFileSize = fs.statSync(dataFile).size
      }
    } catch (e) {
      console.error('measure data.json failed:', e)
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
    flushDataFile()
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const userData = app.getPath('userData')
    const zipPath = path.join(userData, `backup_${ts}.zip`)
    const stagingDir = path.join(userData, `.backup-stage-${ts}`)
    fs.rmSync(stagingDir, { recursive: true, force: true })
    fs.mkdirSync(stagingDir, { recursive: true })

    const srcData = path.join(getDataDir(), 'data.json')
    if (fs.existsSync(srcData)) {
      fs.copyFileSync(srcData, path.join(stagingDir, 'data.json'))
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
      if (fs.existsSync(srcData)) fs.copyFileSync(srcData, path.join(backupDir, 'data.json'))
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
  // 占位：Electron 主进程无 pending 写队列，data.json 由渲染进程原子写入
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
