import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { getBridge, SimulatorType, SimData, detectBestSimulator, detectSimulatorsRunning } from './sim-bridge/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null = null
let simBridge = getBridge()

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    resizable: true,
    maximizable: true,
    title: 'Kingfisher ACARS',
    icon: path.join(process.env.VITE_PUBLIC, 'logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.setMenu(null)

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  win.on('closed', () => {
    simBridge.disconnect()
    win = null
  })
}

function setupBridge() {
  simBridge.onData((data: SimData) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('flight-data', {
        ...data,
        lat: Number(data.lat.toFixed(6)),
        lng: Number(data.lng.toFixed(6)),
      })
    }
  })

  simBridge.onStatus((connected: boolean, type: SimulatorType | null) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('sim-status', {
        connected,
        type: type || 'NONE',
      })
    }
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()
  setupBridge()
})

ipcMain.handle('sim:get-status', () => ({
  connected: simBridge.isConnected,
  type: simBridge.activeSimulator,
}))

ipcMain.handle('sim:get-detected', () => detectSimulatorsRunning())

ipcMain.handle('sim:connect', async (_event, simType?: string) => {
  if (simType) {
    const type = simType as SimulatorType
    return simBridge.connect(type)
  }
  return simBridge.connect()
})

ipcMain.handle('sim:disconnect', () => {
  simBridge.disconnect()
})

ipcMain.handle('sim:detect', () => detectBestSimulator())
