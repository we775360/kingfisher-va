import { SimulatorAdapter, SimData, SimulatorType, ADAPTER_ORDER } from './types.js'
import { detectBestSimulator, detectSimulatorsRunning } from './detector.js'
import { SimConnectAdapter } from './adapters/simconnect.js'
import { FSUIPCAdapter } from './adapters/fsuipc.js'
import { XPUIPCAdapter } from './adapters/xpuipc.js'
import { DemoAdapter } from './adapters/demo.js'

export type { SimData } from './types.js'
export { SimulatorType, ADAPTER_ORDER } from './types.js'
export { detectBestSimulator, detectSimulatorsRunning }

let demoRouteOrigin: { lat: number; lng: number } | null = null
let demoRouteDest: { lat: number; lng: number } | null = null

export function setDemoRoute(origin: { lat: number; lng: number }, dest: { lat: number; lng: number }) {
  demoRouteOrigin = origin
  demoRouteDest = dest
}

export class SimulatorBridge {
  private adapters: SimulatorAdapter[] = []
  private activeAdapter: SimulatorAdapter | null = null
  private dataCallback: ((data: SimData) => void) | null = null
  private statusCallback: ((connected: boolean, type: SimulatorType | null) => void) | null = null
  private isDemo = false

  constructor() {
    this.adapters = [
      new SimConnectAdapter(),
      new FSUIPCAdapter(),
      new XPUIPCAdapter(),
    ]
  }

  get usingDemo(): boolean {
    return this.isDemo
  }

  get isConnected(): boolean {
    return this.activeAdapter?.isConnected() ?? false
  }

  get activeSimulator(): SimulatorType | null {
    return this.activeAdapter?.type ?? null
  }

  get activeAdapterName(): string | null {
    return this.activeAdapter?.name ?? null
  }

  async connect(simType?: SimulatorType): Promise<boolean> {
    this.disconnect()
    this.isDemo = false

    const targetType = simType || detectBestSimulator()

    if (targetType !== SimulatorType.UNKNOWN) {
      const adapter = this.adapters.find(a => a.type === targetType)
      if (adapter) {
        const ok = await adapter.connect()
        if (ok) {
          this.activeAdapter = adapter
          adapter.onStatusChange(this.handleStatusChange)
          if (this.dataCallback) {
            adapter.startPolling(1000, this.dataCallback)
          }
          this.statusCallback?.(true, adapter.type)
          return true
        }
      }

      for (const sim of ADAPTER_ORDER) {
        if (sim === targetType) continue
        const fallback = this.adapters.find(a => a.type === sim)
        if (!fallback) continue
        const fallbackOk = await fallback.connect()
        if (fallbackOk) {
          this.activeAdapter = fallback
          fallback.onStatusChange(this.handleStatusChange)
          if (this.dataCallback) {
            fallback.startPolling(1000, this.dataCallback)
          }
          this.statusCallback?.(true, fallback.type)
          return true
        }
      }
    }

    return this.connectDemo()
  }

  async connectDemo(origin?: { lat: number; lng: number }, dest?: { lat: number; lng: number }): Promise<boolean> {
    this.disconnect()
    const demo = new DemoAdapter()
    if (origin && dest) {
      demo.setRoute(origin, dest)
    } else if (demoRouteOrigin && demoRouteDest) {
      demo.setRoute(demoRouteOrigin, demoRouteDest)
    }
    this.adapters.push(demo)
    const ok = await demo.connect()
    if (ok) {
      this.isDemo = true
      this.activeAdapter = demo
      demo.onStatusChange(this.handleStatusChange)
      if (this.dataCallback) {
        demo.startPolling(1000, this.dataCallback)
      }
      this.statusCallback?.(true, SimulatorType.UNKNOWN)
      return true
    }
    this.statusCallback?.(false, null)
    return false
  }

  disconnect(): void {
    if (this.activeAdapter) {
      this.activeAdapter.removeStatusChangeListener(this.handleStatusChange)
      this.activeAdapter.disconnect()
      this.activeAdapter = null
    }
  }

  onData(callback: (data: SimData) => void): void {
    this.dataCallback = callback
    if (this.activeAdapter) {
      this.activeAdapter.stopPolling()
      this.activeAdapter.startPolling(1000, callback)
    }
  }

  removeDataListener(): void {
    this.dataCallback = null
    if (this.activeAdapter) {
      this.activeAdapter.stopPolling()
    }
  }

  onStatus(callback: (connected: boolean, type: SimulatorType | null) => void): void {
    this.statusCallback = callback
  }

  private handleStatusChange = (connected: boolean) => {
    if (!connected && this.activeAdapter) {
      this.activeAdapter = null
    }
    this.statusCallback?.(connected, this.activeAdapter?.type ?? null)
  }
}

let bridgeInstance: SimulatorBridge | null = null

export function getBridge(): SimulatorBridge {
  if (!bridgeInstance) {
    bridgeInstance = new SimulatorBridge()
  }
  return bridgeInstance
}

export function resetBridge(): void {
  if (bridgeInstance) {
    bridgeInstance.disconnect()
    bridgeInstance = null
  }
}
