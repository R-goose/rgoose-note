const { contextBridge, ipcRenderer } = require('electron')

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

  // ★ 后端统一入口：所有 backend:* 通道通过此方法调用
  backend: (channel, ...args) => ipcRenderer.invoke(channel, ...args),

  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowToggleMaximize: () => ipcRenderer.invoke('window-toggle-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizeChange: cb => {
    const handler = (_e, isMaximized) => cb(isMaximized)
    ipcRenderer.on('window-maximize-changed', handler)
    return () => ipcRenderer.removeListener('window-maximize-changed', handler)
  }
})
