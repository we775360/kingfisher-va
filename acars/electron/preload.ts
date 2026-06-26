import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('ipcRenderer', {
  on: (channel: string, listener: (...args: any[]) => void) => {
    const sub = (_event: any, ...args: any[]) => listener.apply(null, args)
    ipcRenderer.on(channel, sub)
    return () => ipcRenderer.removeListener(channel, sub)
  },
  send: (channel: string, data?: any) => ipcRenderer.send(channel, data),
  invoke: (channel: string, data?: any) => ipcRenderer.invoke(channel, data),
})

contextBridge.exposeInMainWorld('electronAPI', {
  sim: {
    getStatus: () => ipcRenderer.invoke('sim:get-status'),
    getDetected: () => ipcRenderer.invoke('sim:get-detected'),
    connect: (simType?: string) => ipcRenderer.invoke('sim:connect', simType),
    disconnect: () => ipcRenderer.invoke('sim:disconnect'),
    detect: () => ipcRenderer.invoke('sim:detect'),
  },
  onFlightData: (callback: (data: any) => void) => {
    const sub = (_event: any, data: any) => callback(data)
    ipcRenderer.on('flight-data', sub)
    return () => ipcRenderer.removeListener('flight-data', sub)
  },
  onSimStatus: (callback: (status: any) => void) => {
    const sub = (_event: any, status: any) => callback(status)
    ipcRenderer.on('sim-status', sub)
    return () => ipcRenderer.removeListener('sim-status', sub)
  },
})
