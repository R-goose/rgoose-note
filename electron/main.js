const { app, BrowserWindow, ipcMain, dialog, shell, protocol, Tray, Menu, safeStorage } = require('electron')
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')
const backend = require('./backend')
const imageService = require('./backend/service/imageService')

let mainWindow
let tray = null
let isQuitting = false
const AI_BASE_URL = 'https://open.bigmodel.cn/api/coding/paas/v4'
const aiRequests = new Map()

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

function getAppIconPath() {
  const iconCandidates = [
    path.join(__dirname, '../build/icon.ico'),
    path.join(process.resourcesPath || '', 'build/icon.ico'),
    path.join(__dirname, 'icon.ico')
  ]
  return iconCandidates.find(p => { try { return fs.existsSync(p) } catch { return false } }) || null
}

function createTray() {
  if (tray && !tray.isDestroyed()) return
  const iconPath = getAppIconPath()
  if (!iconPath) return
  tray = new Tray(iconPath)
  tray.setToolTip('R-Goose Note')
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出应用',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isVisible()) {
        mainWindow.focus()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })
}

function destroyTray() {
  if (tray) {
    tray.destroy()
    tray = null
  }
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
    show: false,
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

  // 等待首帧绘制完成再显示窗口：消除启动瞬间 frameless 窗口的黑屏闪烁
  // 页面内 index.html 的 splash 动画会在首帧立即绘制，窗口出现时用户看到的就是它
  mainWindow.once('ready-to-show', () => {
    if (!mainWindow.isDestroyed()) mainWindow.show()
  })
  // 兜底：万一 ready-to-show 未触发（加载异常等），5 秒后强制显示，避免窗口永不出现
  const showFallbackTimer = setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show()
    }
  }, 5000)
  mainWindow.on('closed', () => clearTimeout(showFallbackTimer))

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (/^https?:\/\//i.test(url)) {
      e.preventDefault()
      shell.openExternal(url)
    }
  })

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

  // 关闭到托盘：启用时点关闭仅隐藏窗口，并常驻系统托盘
  mainWindow.on('close', (e) => {
    if (!isQuitting && loadConfig().closeToTray) {
      e.preventDefault()
      mainWindow.hide()
      createTray()
    }
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

ipcMain.handle('get-close-to-tray', () => {
  return !!loadConfig().closeToTray
})

ipcMain.handle('set-close-to-tray', (_event, enabled) => {
  const cfg = loadConfig()
  cfg.closeToTray = !!enabled
  saveConfig(cfg)
  if (enabled) {
    createTray()
  } else {
    destroyTray()
  }
  return true
})

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false
})

// AI 密钥和请求均留在主进程：渲染进程只能获得“是否已配置”的状态与业务结果，
// 永远不会读到原始 API Key。
ipcMain.handle('ai:status', () => {
  const secureStorageAvailable = safeStorage.isEncryptionAvailable()
  return {
    configured: secureStorageAvailable && Boolean(loadConfig().aiApiKeyEncrypted),
    secureStorageAvailable
  }
})

ipcMain.handle('ai:save-api-key', (_event, value) => {
  saveSecureAiKey(value)
  return { configured: true }
})

ipcMain.handle('ai:clear-api-key', () => {
  clearSecureAiKey()
  return { configured: false }
})

ipcMain.handle('ai:validate-api-key', async (_event, candidate) => {
  const apiKey = typeof candidate === 'string' && candidate.trim() ? candidate.trim() : getSecureAiKey()
  await aiFetchJson('/chat/completions', {
    method: 'POST',
    apiKey,
    body: { model: 'glm-4.7-flash', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
    maxRetries: 0
  })
  return { valid: true }
})

ipcMain.handle('ai:request', async (_event, request) => {
  const requestId = typeof request?.requestId === 'string' ? request.requestId : ''
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(requestId)) throw new Error('无效的请求标识')
  if (aiRequests.has(requestId)) throw new Error('请求正在执行')
  const controller = new AbortController()
  aiRequests.set(requestId, controller)
  try {
    return await runAiRequest(request.operation, request.payload, getSecureAiKey(), controller.signal)
  } finally {
    aiRequests.delete(requestId)
  }
})

ipcMain.handle('ai:cancel', (_event, requestId) => {
  const controller = aiRequests.get(requestId)
  if (!controller) return false
  controller.abort()
  return true
})

// 导出截图：创建屏幕外隐藏窗口，加载应用 export 模式，原生截图
// 主窗口完全不受影响（无缩放、无跳动），导出内容纯净（只有画布）
ipcMain.handle('capture-export', async (_event, payload) => {
  const opts = payload || {}
  const noteId = opts.noteId
  if (!noteId) { console.error('[export] no noteId'); return null }
  console.log('[export] start, noteId:', noteId)

  // 创建导出窗口（必须在可见屏幕区域内，否则 Windows 不渲染窗口，capturePage 返回 0x0）
  // 放在 (0,0)，用主窗口遮挡，capturePage 截取的是该窗口自己的渲染缓冲区，不受遮挡影响
  const exportWin = new BrowserWindow({
    show: true,
    x: 0,
    y: 0,
    width: 1200,
    height: 800,
    frame: false,
    resizable: false,
    backgroundColor: '#f8faf8',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // 导出窗口设为完全透明：用户看不见任何缩放/窗口变化
  // 但 backing store 仍正常渲染，capturePage 可正常工作
  exportWin.setOpacity(0)

  try {
    const baseUrl = process.env.VITE_DEV_SERVER_URL
      ? process.env.VITE_DEV_SERVER_URL
      : `file://${path.join(__dirname, '../dist/index.html').replace(/\\/g, '/')}`
    const url = `${baseUrl}#/note/${noteId}?export=1`

    // 先注册 listener 再 loadURL，防止 race condition
    const readyPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('export-ready 超时')), 15000)
      ipcMain.once('export-ready', (_e, data) => {
        clearTimeout(timer)
        resolve(data || { width: 1200, height: 800 })
      })
    })

    await exportWin.loadURL(url)

    const { width, height } = await readyPromise

    // 窗口扩大到 2 倍容纳 CSS zoom 放大后的画布（不用 setZoomFactor，避免污染主窗口 session）
    const scale = 2
    exportWin.setMaximumSize(16000, 16000)
    exportWin.setContentSize(
      Math.ceil(width * scale + 16),
      Math.ceil(height * scale + 16)
    )
    await new Promise(r => setTimeout(r, 500))

    // 原生截图（完美渲染 SVG/伪元素/CSS变量）
    const image = await exportWin.webContents.capturePage()

    // 返回 PNG Buffer
    return image.toPNG()
  } catch (e) {
    console.error('capture-export failed:', e)
    return null
  } finally {
    exportWin.destroy()
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

function getSecureAiKey() {
  const encrypted = loadConfig().aiApiKeyEncrypted
  if (!encrypted) return ''
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('系统安全存储不可用，无法读取 API Key')
  }
  try {
    return safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
  } catch (e) {
    console.error('decrypt AI API key failed:', e)
    throw new Error('保存的 API Key 无法读取，请在设置中重新保存')
  }
}

function saveSecureAiKey(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('API Key 不能为空')
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('系统安全存储不可用，未保存 API Key')
  }
  const config = loadConfig()
  config.aiApiKeyEncrypted = safeStorage.encryptString(value.trim()).toString('base64')
  // 兼容早期开发版可能写入配置文件的明文字段，保存时一并清理。
  delete config.aiApiKey
  saveConfig(config)
}

function clearSecureAiKey() {
  const config = loadConfig()
  delete config.aiApiKeyEncrypted
  delete config.aiApiKey
  saveConfig(config)
}

function abortError() {
  const error = new Error('请求已取消')
  error.name = 'AbortError'
  return error
}

function delayWithSignal(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError())
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(abortError())
    }, { once: true })
  })
}

function normalizeAiModel(value, fallback) {
  const model = typeof value === 'string' ? value.trim() : ''
  if (!model) return fallback
  if (model.length > 120 || !/^[A-Za-z0-9._:-]+$/.test(model)) throw new Error('无效的模型名称')
  return model
}

function normalizeAiText(value, field, maxLength) {
  if (typeof value !== 'string') throw new Error(`${field} 必须是文本`)
  const text = value.trim()
  if (!text) throw new Error(`${field} 不能为空`)
  if (text.length > maxLength) throw new Error(`${field} 过长`)
  return text
}

async function aiFetchJson(endpoint, { method = 'GET', body, apiKey, signal, maxRetries = 3 } = {}) {
  let lastError = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(`${AI_BASE_URL}${endpoint}`, {
      method,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal
    })
    const data = await response.json().catch(() => ({}))
    if (response.ok) return data

    const apiError = data?.error || {}
    const code = apiError.code || ''
    const message = apiError.message || data?.msg || `HTTP ${response.status}`
    if (response.status === 429 && attempt < maxRetries && !['1113', '1308', '1310', '1311', '1313', '1314', '1315', '1316', '1317'].includes(String(code))) {
      lastError = new Error(message)
      await delayWithSignal(2000 * Math.pow(2, attempt), signal)
      continue
    }
    throw new Error(code ? `请求失败(${code})：${message}` : message)
  }
  throw lastError || new Error('请求失败')
}

function normalizeChatMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) throw new Error('无效的对话内容')
  return messages.map((message) => ({
    role: ['user', 'assistant', 'system'].includes(message?.role) ? message.role : 'user',
    content: normalizeAiText(message?.content, '消息内容', 12000)
  }))
}

async function runAiRequest(operation, payload, apiKey, signal) {
  if (!payload || typeof payload !== 'object') throw new Error('无效的 AI 请求')
  if (operation === 'chat') {
    const data = await aiFetchJson('/chat/completions', {
      method: 'POST', apiKey, signal,
      body: { model: normalizeAiModel(payload.model, 'glm-4.7-flash'), messages: normalizeChatMessages(payload.messages), temperature: 0.7, max_tokens: 4096 }
    })
    return { content: data.choices?.[0]?.message?.content || '(空回复)' }
  }
  if (operation === 'image') {
    const data = await aiFetchJson('/images/generations', {
      method: 'POST', apiKey, signal,
      body: { model: normalizeAiModel(payload.model, 'cogview-3-flash'), prompt: normalizeAiText(payload.prompt, '提示词', 4000) }
    })
    const url = data.data?.[0]?.url
    if (!url) throw new Error('未返回图片')
    return { url }
  }
  if (operation === 'video') {
    const data = await aiFetchJson('/videos/generations', {
      method: 'POST', apiKey, signal,
      body: { model: normalizeAiModel(payload.model, 'cogvideox-flash'), prompt: normalizeAiText(payload.prompt, '提示词', 4000) }
    })
    const taskId = data.id || data.task?.id
    if (!taskId || typeof taskId !== 'string') throw new Error(data?.msg || '视频任务创建失败')
    for (let attempt = 0; attempt < 60; attempt++) {
      await delayWithSignal(5000, signal)
      const result = await aiFetchJson(`/async-result/${encodeURIComponent(taskId)}`, { apiKey, signal, maxRetries: 0 })
      if (result.task_status === 'SUCCESS') {
        const url = result.video_result?.[0]?.url || result.results?.[0]?.url || result.video_result?.[0]?.cover_image_url
        if (url) return { url }
        throw new Error('视频生成成功但未返回地址')
      }
      if (result.task_status === 'FAIL') throw new Error(result.fail || '视频生成失败')
    }
    throw new Error('视频生成超时，请稍后重试')
  }
  throw new Error('不支持的 AI 操作')
}

/**
 * 将 renderer 提供的相对文件名限制在指定目录内。
 * path.join() 本身允许 ../../ 逃出目录，所有旧图片/备份 IPC 都必须经过这里。
 */
function resolveContainedPath(baseDir, relativePath) {
  if (typeof relativePath !== 'string' || !relativePath || path.isAbsolute(relativePath)) {
    throw new Error('无效的相对路径')
  }
  const base = path.resolve(baseDir)
  const resolved = path.resolve(base, relativePath)
  const relative = path.relative(base, resolved)
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error('路径超出允许目录')
  }
  return resolved
}

function assertRegularFile(filePath) {
  const stat = fs.lstatSync(filePath)
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('不允许的文件类型')
}

function isSafeBackupName(name) {
  return typeof name === 'string' && /^backup_[A-Za-z0-9._-]+$/.test(name)
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
    const filePath = resolveContainedPath(getImagesDir(), relativePath)
    if (!fs.existsSync(filePath)) return null
    assertRegularFile(filePath)
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
  try {
    const filePath = resolveContainedPath(getImagesDir(), relativePath)
    if (fs.existsSync(filePath)) assertRegularFile(filePath)
    return filePath
  } catch (_) {
    return null
  }
})

ipcMain.handle('delete-image', async (_event, relativePath) => {
  try {
    const filePath = resolveContainedPath(getImagesDir(), relativePath)
    if (fs.existsSync(filePath)) {
      assertRegularFile(filePath)
      fs.unlinkSync(filePath)
    }
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
    if (!isSafeBackupName(name)) {
      return { ok: false, error: 'invalid backup name' }
    }
    const full = resolveContainedPath(app.getPath('userData'), name)
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
      // flush 已完成 WAL checkpoint，主 db 即为完整数据，只打包单文件（不再带 -wal/-shm）
      fs.copyFileSync(srcData, path.join(stagingDir, 'rgoose.db'))
    }
    const srcImages = getImagesDir()
    if (fs.existsSync(srcImages)) {
      fs.cpSync(srcImages, path.join(stagingDir, 'images'), { recursive: true })
    }

    let zipped = false
    if (process.platform === 'win32') {
      try {
        // 打包 stagingDir 下的内容（rgoose.db + images）到 zip 根，不包含 staging 目录本身
        const psStaging = stagingDir.replace(/'/g, "''")
        const psZip = zipPath.replace(/'/g, "''")
        execSync(
          `powershell -NoProfile -NonInteractive -Command "Compress-Archive -Path '${psStaging}\\*' -DestinationPath '${psZip}' -Force"`,
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
      fs.copyFileSync(srcData, path.join(backupDir, 'rgoose.db'))
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
    if (!isSafeBackupName(backupName)) return false
    const full = resolveContainedPath(userData, backupName)
    if (fs.existsSync(full)) {
      fs.rmSync(full, { recursive: true, force: true })
      return true
    }
    return false
  } catch (e) {
    return false
  }
})

/** 从压缩包恢复备份：选 zip → 解压 → 替换 rgoose.db + images → 重启数据库 */
ipcMain.handle('restore-backup', async () => {
  let stagingDir = null
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择备份压缩包恢复',
      filters: [{ name: '备份压缩包', extensions: ['zip'] }],
      properties: ['openFile']
    })
    if (result.canceled || !result.filePaths.length) return { ok: false, error: '已取消' }

    const srcZip = result.filePaths[0]
    const ts = Date.now()
    const userData = app.getPath('userData')
    stagingDir = path.join(userData, `.restore-stage-${ts}`)
    fs.mkdirSync(stagingDir, { recursive: true })

    // 解压 zip（Windows 用 PowerShell Expand-Archive）
    if (process.platform === 'win32') {
      const psZip = srcZip.replace(/'/g, "''")
      const psDir = stagingDir.replace(/'/g, "''")
      execSync(
        `powershell -NoProfile -NonInteractive -Command "Expand-Archive -LiteralPath '${psZip}' -DestinationPath '${psDir}' -Force"`,
        { windowsHide: true, timeout: 180000 }
      )
    }

    // 自动查找 rgoose.db，兼容嵌套目录（比如之前版本的压缩包）
    function findDb(dir) {
      const files = fs.readdirSync(dir)
      if (files.includes('rgoose.db')) return path.join(dir, 'rgoose.db')
      for (const f of files) {
        const full = path.join(dir, f)
        if (fs.statSync(full).isDirectory()) {
          const found = findDb(full)
          if (found) return found
        }
      }
      return null
    }

    const extractedDb = findDb(stagingDir)
    if (!extractedDb) {
      return { ok: false, error: '备份文件无效：zip 中未找到 rgoose.db' }
    }

    // rgoose.db 所在目录即为「备份根目录」，images 也在这里
    const backupRoot = path.dirname(extractedDb)

    const dataDir = getDataDir()
    const imagesDir = getImagesDir()

    // 恢复前安全快照，误操作可回退（存当前数据目录内 .pre-restore-*）
    const safetyDir = path.join(dataDir, `.pre-restore-${ts}`)
    fs.mkdirSync(safetyDir, { recursive: true })
    for (const suffix of ['', '-wal', '-shm']) {
      const f = path.join(dataDir, `rgoose.db${suffix}`)
      if (fs.existsSync(f)) fs.copyFileSync(f, path.join(safetyDir, `rgoose.db${suffix}`))
    }
    if (fs.existsSync(imagesDir)) fs.cpSync(imagesDir, path.join(safetyDir, 'images'), { recursive: true })

    // 关闭后端释放 SQLite 句柄，替换数据文件
    backend.stop()
    for (const suffix of ['', '-wal', '-shm']) {
      const f = path.join(dataDir, `rgoose.db${suffix}`)
      if (fs.existsSync(f)) fs.rmSync(f, { force: true })
    }
    fs.copyFileSync(extractedDb, path.join(dataDir, 'rgoose.db'))

    const extractedImages = path.join(backupRoot, 'images')
    if (fs.existsSync(imagesDir)) fs.rmSync(imagesDir, { recursive: true, force: true })
    if (fs.existsSync(extractedImages)) {
      fs.cpSync(extractedImages, imagesDir, { recursive: true })
    } else {
      fs.mkdirSync(imagesDir, { recursive: true })
    }

    // 清理临时解压目录
    fs.rmSync(stagingDir, { recursive: true, force: true })
    stagingDir = null

    // 重启数据库（不重注册 IPC）
    backend.restart(getDataDir())

    return { ok: true }
  } catch (e) {
    console.error('restore-backup failed:', e)
    try { backend.restart(getDataDir()) } catch (_) {}
    return { ok: false, error: e.message }
  } finally {
    if (stagingDir && fs.existsSync(stagingDir)) {
      try { fs.rmSync(stagingDir, { recursive: true, force: true }) } catch (_) {}
    }
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

app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => {
  destroyTray()
  backend.stop()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
