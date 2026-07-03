const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  exportData: data => ipcRenderer.invoke('export-data', data),
  importData: () => ipcRenderer.invoke('import-data'),
  getDataPath: () => ipcRenderer.invoke('get-data-path'),
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
