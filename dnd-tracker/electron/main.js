const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Data persistence path
const dataPath = path.join(app.getPath('userData'), 'combat-state.json')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'D&D Combat Tracker',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: '#0f0f0f',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// IPC: save state
ipcMain.handle('save-state', async (_, data) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

// IPC: load state
ipcMain.handle('load-state', async () => {
  try {
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf-8')
      return { ok: true, data: JSON.parse(raw) }
    }
    return { ok: true, data: null }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
