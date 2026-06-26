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
  private statusCallback: ((status: { connected: boolean; type: SimulatorType | null; demo: boolean }) => void) | null = null
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

  private findAdapter(type: SimulatorType): SimulatorAdapter | undefined {
    return this.adapters.find(a => a.compatibleTypes.includes(type))
  }

  async connect(simType?: SimulatorType): Promise<boolean> {
    this.disconnect()
    this.isDemo = false

    const targetType = simType || detectBestSimulator()

    if (targetType !== SimulatorType.UNKNOWN) {
      const adapter = this.findAdapter(targetType)
      if (adapter) {
        const ok = await adapter.connect()
        if (ok) {
          this.activeAdapter = adapter
          adapter.onStatusChange(this.handleStatusChange)
          if (this.dataCallback) {
            adapter.startPolling(1000, this.dataCallback)
          }
          this.emitStatus(true, adapter.type, false)
          return true
        }
      }

      for (const sim of ADAPTER_ORDER) {
        if (sim === targetType) continue
        const fallback = this.findAdapter(sim)
        if (!fallback) continue
        const fallbackOk = await fallback.connect()
        if (fallbackOk) {
          this.activeAdapter = fallback
          fallback.onStatusChange(this.handleStatusChange)
          if (this.dataCallback) {
            fallback.startPolling(1000, this.dataCallback)
          }
          this.emitStatus(true, fallback.type, false)
          return true
        }
      }
    }

    return this.connectDemo()
  }

  async connectDemo(origin?: { lat: number; lng: number }, dest?: { lat: number; lng: number }, fuel?: number): Promise<boolean> {
    this.disconnect()
    const demo = new DemoAdapter()
    if (origin && dest) {
      demo.setRoute(origin, dest)
    } else if (demoRouteOrigin && demoRouteDest) {
      demo.setRoute(demoRouteOrigin, demoRouteDest)
    }
    if (fuel) demo.setFuel(fuel)
    this.adapters.push(demo)
    const ok = await demo.connect()
    if (ok) {
      this.isDemo = true
      this.activeAdapter = demo
      demo.onStatusChange(this.handleStatusChange)
      if (this.dataCallback) {
        demo.startPolling(1000, this.dataCallback)
      }
      this.emitStatus(true, SimulatorType.UNKNOWN, true)
      return true
    }
    this.emitStatus(false, null, false)
    return false
  }

  startDemoFlight(): boolean {
    if (this.activeAdapter instanceof DemoAdapter) {
      this.activeAdapter.startFlight()
      return true
    }
    return false
  }

  disconnect(): void {
    if (this.activeAdapter) {
      this.activeAdapter.removeStatusChangeListener(this.handleStatusChange)
      this.activeAdapter.disconnect()
      this.activeAdapter = null
    }
    this.isDemo = false
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

  onStatus(callback: (status: { connected: boolean; type: SimulatorType | null; demo: boolean }) => void): void {
    this.statusCallback = callback
  }

  private emitStatus(connected: boolean, type: SimulatorType | null, demo: boolean) {
    this.statusCallback?.({ connected, type, demo })
  }

  private handleStatusChange = (connected: boolean) => {
    if (!connected && this.activeAdapter) {
      this.activeAdapter = null
    }
    this.emitStatus(connected, this.activeAdapter?.type ?? null, this.isDemo)
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
