import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import * as SimConnect from 'node-simconnect'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let simHandle: SimConnect.SimConnectConnection | null = null
let pollInterval: NodeJS.Timeout | null = null

function createWindow() {
  win = new BrowserWindow({
    width: 450,
    height: 800,
    resizable: true,
    maximizable: false,
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
    stopPolling()
    if (simHandle) {
      simHandle.close()
      simHandle = null
    }
  })
}

async function initSimConnect() {
  try {
    if (simHandle) return

    const { handle } = await SimConnect.open('KingfisherACARS', SimConnect.Protocol.KittyHawk)
    simHandle = handle
    
    simHandle.on('exception', (exception: any) => {
      console.error('SimConnect Exception:', exception)
    })

    simHandle.on('close', () => {
      console.log('SimConnect Connection Closed')
      win?.webContents.send('sim-status', 'disconnected')
      stopPolling()
      simHandle = null
      setTimeout(initSimConnect, 5000)
    })

    console.log('SimConnect connected')
    win?.webContents.send('sim-status', 'connected')

    startPolling()
  } catch (error) {
    console.log('SimConnect connection failed, retrying...')
    win?.webContents.send('sim-status', 'disconnected')
    setTimeout(initSimConnect, 5000)
  }
}

function startPolling() {
  if (pollInterval || !simHandle) return

  const DEFINITION_ID = 1

  simHandle.addToDataDefinition(DEFINITION_ID, 'PLANE LATITUDE', 'degrees', SimConnect.SimConnectDataType.FLOAT64)
  simHandle.addToDataDefinition(DEFINITION_ID, 'PLANE LONGITUDE', 'degrees', SimConnect.SimConnectDataType.FLOAT64)
  simHandle.addToDataDefinition(DEFINITION_ID, 'PLANE ALTITUDE', 'feet', SimConnect.SimConnectDataType.FLOAT64)
  simHandle.addToDataDefinition(DEFINITION_ID, 'PLANE HEADING DEGREES TRUE', 'degrees', SimConnect.SimConnectDataType.FLOAT64)
  simHandle.addToDataDefinition(DEFINITION_ID, 'AIRSPEED TRUE', 'knots', SimConnect.SimConnectDataType.FLOAT64)
  simHandle.addToDataDefinition(DEFINITION_ID, 'SIM ON GROUND', 'bool', SimConnect.SimConnectDataType.FLOAT64)
  simHandle.addToDataDefinition(DEFINITION_ID, 'VERTICAL SPEED', 'feet per minute', SimConnect.SimConnectDataType.FLOAT64)
  simHandle.addToDataDefinition(DEFINITION_ID, 'FUEL TOTAL QUANTITY', 'gallons', SimConnect.SimConnectDataType.FLOAT64)
  simHandle.addToDataDefinition(DEFINITION_ID, 'ENG COMBUSTION:1', 'bool', SimConnect.SimConnectDataType.FLOAT64)

  pollInterval = setInterval(() => {
    if (simHandle && win) {
      simHandle.requestDataOnSimObject(DEFINITION_ID, DEFINITION_ID, SimConnect.SimObjectType.USER, SimConnect.SimConnectPeriod.ONCE)
    }
  }, 1000)

  simHandle.on('simObjectData', (data: any) => {
    if (data.defineId === DEFINITION_ID && win) {
      // Basic extraction - this depends on the buffer format of simObjectData
      // node-simconnect returns a buffer in simObjectData.data
      const flightData = {
        lat: data.data.readDoubleLE(0),
        lng: data.data.readDoubleLE(8),
        alt: data.data.readDoubleLE(16),
        heading: data.data.readDoubleLE(24),
        gs: data.data.readDoubleLE(32),
        onGround: data.data.readDoubleLE(40) === 1,
        vs: data.data.readDoubleLE(48),
        fuel: data.data.readDoubleLE(56),
        engineOn: data.data.readDoubleLE(64) === 1,
        timestamp: Date.now()
      }
      win.webContents.send('flight-data', flightData)
    }
  })
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
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
  initSimConnect()
})

ipcMain.handle('get-sim-status', () => {
  return simHandle ? 'connected' : 'disconnected'
})
