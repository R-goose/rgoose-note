const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  exportData: data => ipcRenderer.invoke('export-data', data),
  importData: () => ipcRenderer.invoke('import-data'),
  getDataPath: () => ipcRenderer.invoke('get-data-path'),
  isElectron: true,

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
