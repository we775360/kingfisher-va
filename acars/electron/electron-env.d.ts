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
  demo?: boolean
}

interface Window {
  ipcRenderer: import('electron').IpcRenderer
  electronAPI: {
    sim: {
      getStatus: () => Promise<SimStatus>
      getDetected: () => Promise<string[]>
      connect: (simType?: string) => Promise<boolean>
      connectDemo: (origin?: { lat: number; lng: number }, dest?: { lat: number; lng: number }, fuel?: number) => Promise<boolean>
      startDemoFlight: () => Promise<boolean>
      disconnect: () => Promise<void>
      detect: () => Promise<string>
      diagnose: () => Promise<{
        platform: string
        simProcessesDetected: string[]
        bestSimulator: string
        modulesInstalled: { nodeFsuipc: boolean; nodeSimconnect: boolean }
        bridgeConnected: boolean
        bridgeUsingDemo: boolean
      }>
    }
    onFlightData: (callback: (data: any) => void) => () => void
    onSimStatus: (callback: (status: SimStatus) => void) => () => void
  }
}
