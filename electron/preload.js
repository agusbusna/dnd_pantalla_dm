const { contextBridge, ipcRenderer } = require('electron')

// El segundo argumento (`entity`) identifica qué se guarda:
// 'combat' | 'bestiary' | 'characters' | 'encounters' | 'campaigns'
contextBridge.exposeInMainWorld('electronAPI', {
  saveState: (data, entity) => ipcRenderer.invoke('save-state', data, entity),
  loadState: (entity) => ipcRenderer.invoke('load-state', entity),
  isElectron: true
})
