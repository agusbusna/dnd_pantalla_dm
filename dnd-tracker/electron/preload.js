const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  saveState: (data) => ipcRenderer.invoke('save-state', data),
  loadState: () => ipcRenderer.invoke('load-state'),
  isElectron: true
})
