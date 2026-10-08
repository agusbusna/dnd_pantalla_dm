const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Data persistence: un archivo por entidad (combat, bestiary, characters…)
const dataDir = path.join(app.getPath('userData'), 'data')
const legacyPath = path.join(app.getPath('userData'), 'combat-state.json')

function entityPath(entity = 'combat') {
  // Whitelist: el nombre viene del renderer, no debe escapar de dataDir
  if (!/^[a-z0-9_-]+$/i.test(entity)) {
    throw new Error(`Entidad inválida: ${entity}`)
  }
  return path.join(dataDir, `${entity}.json`)
}

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

// IPC: save state (un archivo por entidad)
ipcMain.handle('save-state', async (_, data, entity) => {
  try {
    fs.mkdirSync(dataDir, { recursive: true })
    fs.writeFileSync(entityPath(entity), JSON.stringify(data, null, 2), 'utf-8')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

// IPC: load state (un archivo por entidad)
ipcMain.handle('load-state', async (_, entity) => {
  try {
    const target = entityPath(entity)
    if (fs.existsSync(target)) {
      return { ok: true, data: JSON.parse(fs.readFileSync(target, 'utf-8')) }
    }

    // Migración: versiones anteriores guardaban TODO en un único archivo.
    // Solo se migra si el contenido parece un estado de combate.
    if ((entity === 'combat' || !entity) && fs.existsSync(legacyPath)) {
      const legacy = JSON.parse(fs.readFileSync(legacyPath, 'utf-8'))
      if (legacy && typeof legacy === 'object' && !Array.isArray(legacy) && 'combatants' in legacy) {
        return { ok: true, data: legacy }
      }
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
