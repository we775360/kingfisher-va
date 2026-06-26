import { SimulatorAdapter, SimData, SimulatorType, ADAPTER_ORDER } from './types.js'
import { detectBestSimulator, detectSimulatorsRunning } from './detector.js'
import { SimConnectAdapter } from './adapters/simconnect.js'
import { FSUIPCAdapter } from './adapters/fsuipc.js'
import { XPUIPCAdapter } from './adapters/xpuipc.js'

export type { SimData } from './types.js'
export { SimulatorType, ADAPTER_ORDER } from './types.js'
export { detectBestSimulator, detectSimulatorsRunning }

export class SimulatorBridge {
  private adapters: SimulatorAdapter[] = []
  private activeAdapter: SimulatorAdapter | null = null
  private dataCallback: ((data: SimData) => void) | null = null
  private statusCallback: ((connected: boolean, type: SimulatorType | null) => void) | null = null

  constructor() {
    this.adapters = [
      new SimConnectAdapter(),
      new FSUIPCAdapter(),
      new XPUIPCAdapter(),
    ]
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

    const targetType = simType || detectBestSimulator()

    const adapter = this.adapters.find(a => a.type === targetType)
    if (!adapter) return false

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
