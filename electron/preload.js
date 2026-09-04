const { contextBridge, ipcRenderer } = require('electron')

// 渲染进程只能调用这里明确列出的后端业务通道，不能把任意字符串交给
// ipcRenderer.invoke。这样即使页面出现注入问题，也不会自动获得全部 IPC 权限。
const ALLOWED_BACKEND_CHANNELS = new Set([
  'backend:notes:list', 'backend:notes:get', 'backend:notes:create', 'backend:notes:update',
  'backend:notes:updateTags', 'backend:notes:delete', 'backend:notes:restore',
  'backend:notes:hardDelete', 'backend:notes:duplicate', 'backend:notes:listAll',
  'backend:blocks:list', 'backend:blocks:create', 'backend:blocks:update',
  'backend:blocks:delete', 'backend:blocks:batch',
  'backend:connections:list', 'backend:connections:create', 'backend:connections:update',
  'backend:connections:delete',
  'backend:folders:list', 'backend:folders:get', 'backend:folders:create',
  'backend:folders:update', 'backend:folders:updateTags', 'backend:folders:delete',
  'backend:folders:listAll',
  'backend:plans:list', 'backend:plans:get', 'backend:plans:create', 'backend:plans:update',
  'backend:plans:delete', 'backend:plans:toggleComplete', 'backend:plans:listAll',
  'backend:tags:list', 'backend:tags:get', 'backend:tags:create', 'backend:tags:update',
  'backend:tags:delete',
  'backend:images:upload', 'backend:images:download', 'backend:images:delete',
  'backend:images:listRefs', 'backend:images:listAllWithMeta', 'backend:images:rename',
  'backend:images:updateTags', 'backend:images:fetchRemote',
  'backend:sync:pull', 'backend:sync:exportAll', 'backend:sync:importAll',
  'backend:sync:clearAll'
])

function invokeBackend(channel, ...args) {
  if (!ALLOWED_BACKEND_CHANNELS.has(channel)) {
    return Promise.reject(new Error(`不允许的后端通道: ${channel}`))
  }
  return ipcRenderer.invoke(channel, ...args)
}

contextBridge.exposeInMainWorld('electronAPI', {
  exportData: data => ipcRenderer.invoke('export-data', data),
  selectExportDir: () => ipcRenderer.invoke('select-export-dir'),
  writeMediaToDir: payload => ipcRenderer.invoke('write-media-to-dir', payload),
  importData: () => ipcRenderer.invoke('import-data'),
  getDataPath: () => ipcRenderer.invoke('get-data-path'),
  openPath: targetPath => ipcRenderer.invoke('open-path', targetPath),
  openBackup: name => ipcRenderer.invoke('open-backup', name),
  openBackupsFolder: () => ipcRenderer.invoke('open-backups-folder'),
  isElectron: true,

  getStorageInfo: () => ipcRenderer.invoke('get-storage-info'),
  readDataFile: () => ipcRenderer.invoke('read-data-file'),
  writeDataFile: data => ipcRenderer.invoke('write-data-file', data),
  saveImage: (base64Data, ext) => ipcRenderer.invoke('save-image', base64Data, ext),
  readImage: relativePath => ipcRenderer.invoke('read-image', relativePath),
  resolveImagePath: relativePath => ipcRenderer.invoke('resolve-image-path', relativePath),
  deleteImage: relativePath => ipcRenderer.invoke('delete-image', relativePath),
  listImages: () => ipcRenderer.invoke('list-images'),
  getStorageSize: () => ipcRenderer.invoke('get-storage-size'),
  createBackup: () => ipcRenderer.invoke('create-backup'),
  listBackups: () => ipcRenderer.invoke('list-backups'),
  deleteBackup: name => ipcRenderer.invoke('delete-backup', name),
  pickDataDir: () => ipcRenderer.invoke('pick-data-dir'),
  changeDataDir: dir => ipcRenderer.invoke('change-data-dir', dir),
  resetDataDir: () => ipcRenderer.invoke('reset-data-dir'),

  ai: {
    status: () => ipcRenderer.invoke('ai:status'),
    saveApiKey: value => ipcRenderer.invoke('ai:save-api-key', value),
    clearApiKey: () => ipcRenderer.invoke('ai:clear-api-key'),
    validateApiKey: candidate => ipcRenderer.invoke('ai:validate-api-key', candidate),
    request: payload => ipcRenderer.invoke('ai:request', payload),
    cancel: requestId => ipcRenderer.invoke('ai:cancel', requestId)
  },

  // 兼容现有 REST → IPC 路由层；内部仍会执行静态白名单校验。
  backend: invokeBackend,

  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowToggleMaximize: () => ipcRenderer.invoke('window-toggle-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  getCloseToTray: () => ipcRenderer.invoke('get-close-to-tray'),
  setCloseToTray: enabled => ipcRenderer.invoke('set-close-to-tray', enabled),
  captureExport: payload => ipcRenderer.invoke('capture-export', payload),
  sendExportReady: data => ipcRenderer.send('export-ready', data),
  onMaximizeChange: cb => {
    const handler = (_e, isMaximized) => cb(isMaximized)
    ipcRenderer.on('window-maximize-changed', handler)
    return () => ipcRenderer.removeListener('window-maximize-changed', handler)
  }
})
