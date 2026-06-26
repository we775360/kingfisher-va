import { SimulatorAdapter, SimData, SimulatorType } from '../types.js'

export class SimConnectAdapter implements SimulatorAdapter {
  readonly type = SimulatorType.MSFS2020
  readonly name = 'SimConnect (MSFS/FSX/P3D)'

  private handle: any = null
  private simConnectModule: any = null
  private pollTimer: NodeJS.Timeout | null = null
  private dataCallback: ((data: SimData) => void) | null = null
  private statusCallbacks: Set<(connected: boolean) => void> = new Set()
  private definitionId = 1
  private connected = false

  private get sc() {
    return this.simConnectModule
  }

  async connect(): Promise<boolean> {
    if (this.connected) return true

    try {
      this.simConnectModule = await import('node-simconnect')

      const result = await this.sc.open('KingfisherACARS', this.sc.Protocol.KittyHawk)
      this.handle = result.handle

      this.handle.on('exception', (e: any) => console.error('SimConnect exception:', e))

      this.handle.on('close', () => {
        this.connected = false
        this.stopPolling()
        this.notifyStatus(false)
        setTimeout(() => this.connect(), 5000)
      })

      this.setupDataDefinition()
      this.connected = true
      this.notifyStatus(true)
      return true
    } catch (err) {
      console.error('SimConnect connection failed:', err)
      return false
    }
  }

  private setupDataDefinition() {
    if (!this.handle) return

    const defs: [string, string][] = [
      ['PLANE LATITUDE', 'degrees'],
      ['PLANE LONGITUDE', 'degrees'],
      ['PLANE ALTITUDE', 'feet'],
      ['PLANE HEADING DEGREES TRUE', 'degrees'],
      ['AIRSPEED TRUE', 'knots'],
      ['SIM ON GROUND', 'bool'],
      ['VERTICAL SPEED', 'feet per minute'],
      ['FUEL TOTAL QUANTITY', 'gallons'],
      ['ENG COMBUSTION:1', 'bool'],
      ['AIRSPEED INDICATED', 'knots'],
      ['AIRSPEED MACH', 'mach'],
      ['TRANSPONDER CODE:1', 'number'],
      ['PLANE PITCH DEGREES', 'degrees'],
      ['PLANE BANK DEGREES', 'degrees'],
      ['GENERAL ENG FUEL FLOW:1', 'gallons per hour'],
      ['NAV ACTIVE FREQUENCY:1', 'megahertz'],
      ['NAV ACTIVE FREQUENCY:2', 'megahertz'],
    ]

    for (const [name, unit] of defs) {
      this.handle.addToDataDefinition(this.definitionId, name, unit, this.sc.SimConnectDataType.FLOAT64)
    }

    this.handle.on('simObjectData', (data: any) => {
      if (data.defineId !== this.definitionId) return
      try {
        const buf = data.data
        const simData: SimData = {
          lat: buf.readDoubleLE(0),
          lng: buf.readDoubleLE(8),
          alt: buf.readDoubleLE(16),
          heading: buf.readDoubleLE(24),
          gs: buf.readDoubleLE(32),
          onGround: buf.readDoubleLE(40) === 1,
          vs: buf.readDoubleLE(48),
          fuel: buf.readDoubleLE(56),
          engineOn: buf.readDoubleLE(64) === 1,
          ias: buf.readDoubleLE(72),
          mach: buf.readDoubleLE(80),
          squawk: buf.readDoubleLE(88).toString().padStart(4, '0'),
          pitch: buf.readDoubleLE(96),
          bank: buf.readDoubleLE(104),
          fuelFlow: buf.readDoubleLE(112),
          fuelUnit: 'GAL',
          nav1Freq: buf.readDoubleLE(120),
          nav2Freq: buf.readDoubleLE(128),
          simOn: true,
          timestamp: Date.now(),
          simulator: this.type,
        }
        this.dataCallback?.(simData)
      } catch (e) {
        console.error('SimConnect parse error:', e)
      }
    })
  }

  startPolling(intervalMs: number, callback: (data: SimData) => void): void {
    this.dataCallback = callback
    if (this.pollTimer) return
    this.pollTimer = setInterval(() => {
      if (this.handle && this.connected) {
        this.handle.requestDataOnSimObject(
          this.definitionId,
          this.definitionId,
          this.sc.SimObjectType.USER,
          this.sc.SimConnectPeriod.ONCE,
        )
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
      this.handle.close()
      this.handle = null
    }
    this.connected = false
    this.notifyStatus(false)
  }

  isConnected(): boolean {
    return this.connected
  }

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
