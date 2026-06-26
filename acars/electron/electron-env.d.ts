/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string
    VITE_PUBLIC: string
  }
}

interface SimStatus {
  connected: boolean
  type: string
}

interface Window {
  ipcRenderer: import('electron').IpcRenderer
  electronAPI: {
    sim: {
      getStatus: () => Promise<SimStatus>
      getDetected: () => Promise<string[]>
      connect: (simType?: string) => Promise<boolean>
      disconnect: () => Promise<void>
      detect: () => Promise<string>
    }
    onFlightData: (callback: (data: any) => void) => () => void
    onSimStatus: (callback: (status: SimStatus) => void) => () => void
  }
}
