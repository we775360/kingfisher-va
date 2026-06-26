import { SimulatorAdapter, SimData, SimulatorType } from '../types.js'

interface FSUIPCOffset {
  address: number
  type: 'byte' | 'word' | 'dword' | 'float64' | 'string' | 'bits'
  size: number
}

const OFFSETS: Record<string, FSUIPCOffset> = {
  lat: { address: 0x560, type: 'float64', size: 8 },
  lng: { address: 0x568, type: 'float64', size: 8 },
  alt: { address: 0x570, type: 'float64', size: 8 },
  heading: { address: 0x580, type: 'float64', size: 8 },
  gs: { address: 0x574, type: 'float64', size: 8 },
  vs: { address: 0x578, type: 'float64', size: 8 },
  onGround: { address: 0x0366, type: 'byte', size: 1 },
  engineOn: { address: 0x0892, type: 'bits', size: 2 },
  fuel: { address: 0x0B94, type: 'float64', size: 8 },
  ias: { address: 0x02BC, type: 'float64', size: 8 },
  pitch: { address: 0x0578, type: 'float64', size: 8 },
  bank: { address: 0x057C, type: 'float64', size: 8 },
  fuelFlow: { address: 0x0B9C, type: 'float64', size: 8 },
}

export class FSUIPCAdapter implements SimulatorAdapter {
  readonly type = SimulatorType.FSX
  readonly name = 'FSUIPC (FSX/P3D)'
  readonly compatibleTypes = [
    SimulatorType.FSX,
    SimulatorType.FSX_SE,
    SimulatorType.P3Dv4,
    SimulatorType.P3Dv5,
    SimulatorType.P3Dv6,
  ]

  private fsuipc: any = null
  private handle: any = null
  private pollTimer: NodeJS.Timeout | null = null
  private dataCallback: ((data: SimData) => void) | null = null
  private statusCallbacks: Set<(connected: boolean) => void> = new Set()
  private connected = false

  async connect(): Promise<boolean> {
    if (this.connected) return true

    try {
      this.fsuipc = await import('node-fsuipc')
      this.handle = new this.fsuipc.FSUIPC()
      await this.handle.open()
      this.connected = true
      this.notifyStatus(true)
      return true
    } catch (err) {
      console.error('FSUIPC connection failed:', err)
      return false
    }
  }

  async readAll(): Promise<Partial<SimData>> {
    if (!this.handle || !this.connected) return {}

    try {
      const data: any = {}
      for (const [key, offset] of Object.entries(OFFSETS)) {
        try {
          data[key] = await this.handle.read(offset.address, offset.size, offset.type)
        } catch { }
      }

      return {
        lat: data.lat ?? 0,
        lng: data.lng ?? 0,
        alt: data.alt ?? 0,
        heading: data.heading ?? 0,
        gs: data.gs ?? 0,
        ias: data.ias ?? 0,
        mach: 0,
        vs: data.vs ?? 0,
        pitch: data.pitch ?? 0,
        bank: data.bank ?? 0,
        fuel: data.fuel ?? 0,
        fuelFlow: data.fuelFlow ?? 0,
        fuelUnit: 'GAL',
        onGround: data.onGround === 1,
        engineOn: data.engineOn !== 0,
        simOn: true,
        timestamp: Date.now(),
        squawk: '2000',
        simulator: this.type,
      }
    } catch {
      return {}
    }
  }

  startPolling(intervalMs: number, callback: (data: SimData) => void): void {
    this.dataCallback = callback
    if (this.pollTimer) return

    this.pollTimer = setInterval(async () => {
      const partial = await this.readAll()
      if (partial.lat !== undefined && partial.lat !== 0) {
        this.dataCallback?.(partial as SimData)
      }
    }, intervalMs)
  }

  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  }

  disconnect(): void {
    this.stopPolling()
    if (this.handle) {
      try { this.handle.close() } catch { }
      this.handle = null
    }
    this.connected = false
    this.notifyStatus(false)
  }

  isConnected(): boolean { return this.connected }

  onStatusChange(callback: (connected: boolean) => void): void {
    this.statusCallbacks.add(callback)
  }

  removeStatusChangeListener(callback: (connected: boolean) => void): void {
    this.statusCallbacks.delete(callback)
  }

  private notifyStatus(connected: boolean) {
    for (const cb of this.statusCallbacks) cb(connected)
  }
}
