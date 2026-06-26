import * as dgram from 'node:dgram'
import { SimulatorAdapter, SimData, SimulatorType } from '../types.js'

interface XPlaneDataRef {
  dataref: string
  type: 'float' | 'double' | 'int' | 'byte'
  index?: number
}

const DATA_REFS: Record<string, XPlaneDataRef> = {
  lat: { dataref: 'sim/flightmodel/position/latitude', type: 'double' },
  lng: { dataref: 'sim/flightmodel/position/longitude', type: 'double' },
  alt: { dataref: 'sim/flightmodel/position/elevation', type: 'float' },
  heading: { dataref: 'sim/flightmodel/position/true_psi', type: 'float' },
  gs: { dataref: 'sim/flightmodel/position/groundspeed', type: 'float' },
  ias: { dataref: 'sim/flightmodel/position/indicated_airspeed', type: 'float' },
  mach: { dataref: 'sim/flightmodel/position/mach', type: 'float' },
  vs: { dataref: 'sim/flightmodel/position/vh_ind_fpm', type: 'float' },
  pitch: { dataref: 'sim/flightmodel/position/theta', type: 'float' },
  bank: { dataref: 'sim/flightmodel/position/phi', type: 'float' },
  onGround: { dataref: 'sim/flightmodel/failures/onground_any', type: 'int' },
  engineOn: { dataref: 'sim/flightmodel/engine/ENGN_running', type: 'byte', index: 0 },
  fuel: { dataref: 'sim/flightmodel/weight/m_fuel_total', type: 'float' },
  fuelFlow: { dataref: 'sim/flightmodel/engine/ENGN_ff_', type: 'float', index: 0 },
}

export class XPUIPCAdapter implements SimulatorAdapter {
  readonly type = SimulatorType.XP12
  readonly name = 'XPUIPC / X-Plane UDP'
  readonly compatibleTypes = [
    SimulatorType.XP11,
    SimulatorType.XP12,
  ]

  private socket: dgram.Socket | null = null
  private pollTimer: NodeJS.Timeout | null = null
  private dataCallback: ((data: SimData) => void) | null = null
  private statusCallbacks: Set<(connected: boolean) => void> = new Set()
  private connected = false
  private xplaneHost = '127.0.0.1'
  private xplanePort = 49000
  private recvPort = 49001
  private rrefMap = new Map<number, string>()
  private dataValues = new Map<string, number>()
  private rrefIndex = 1
  private simVersion: SimulatorType = SimulatorType.XP12

  private lastDataTimestamp = 0
  private watchdogTimer: NodeJS.Timeout | null = null
  private readonly WATCHDOG_TIMEOUT_MS = 10000

  private readonly RREF_HEADER = Buffer.from('RREF\x00')

  setXPlaneVersion(version: SimulatorType) {
    if (version === SimulatorType.XP11 || version === SimulatorType.XP12) {
      this.simVersion = version
    }
  }

  async connect(): Promise<boolean> {
    if (this.connected) return true

    try {
      this.socket = dgram.createSocket('udp4')

      let connectResolve: ((ok: boolean) => void) | null = null
      const connectPromise = new Promise<boolean>((resolve) => {
        connectResolve = resolve
      })

      this.socket.on('message', (msg) => {
        this.handleMessage(msg)
        if (connectResolve) {
          connectResolve(true)
          connectResolve = null
        }
      })

      this.socket.on('error', (err) => {
        console.error('XPUIPC socket error:', err)
        if (connectResolve) {
          connectResolve(false)
          connectResolve = null
        }
        this.connected = false
        this.notifyStatus(false)
      })

      await new Promise<void>((resolve, reject) => {
        this.socket!.bind(this.recvPort, '127.0.0.1', () => resolve())
        this.socket!.on('error', reject)
        setTimeout(() => reject(new Error('X-Plane UDP bind timeout')), 2000)
      })

      this.requestAllDataRefs()

      const timeout = setTimeout(() => {
        if (connectResolve) {
          connectResolve(false)
          connectResolve = null
        }
      }, 3000)

      const xplaneResponded = await connectPromise
      clearTimeout(timeout)

      if (!xplaneResponded) {
        this.cleanup()
        return false
      }

      this.connected = true
      this.notifyStatus(true)
      this.startDataWatchdog()
      return true
    } catch (err) {
      console.error('XPUIPC connection failed:', err)
      this.cleanup()
      return false
    }
  }

  private handleMessage(msg: Buffer) {
    if (msg.length < 5) return

    const header = msg.subarray(0, 5).toString()

    if (header === 'RREF,' || header.startsWith('RREF')) {
      this.parseRREF(msg)
    }
  }

  private parseRREF(msg: Buffer) {
    let offset = 5
    while (offset + 8 < msg.length) {
      try {
        const index = msg.readInt32LE(offset)
        const value = msg.readFloatLE(offset + 4)
        const refName = this.rrefMap.get(index)
        if (refName) {
          this.dataValues.set(refName, value)
        }
        offset += 8
      } catch {
        break
      }
    }

    this.emitDataIfComplete()
  }

  private startDataWatchdog() {
    this.lastDataTimestamp = Date.now()
    this.stopDataWatchdog()
    this.watchdogTimer = setInterval(() => {
      if (Date.now() - this.lastDataTimestamp > this.WATCHDOG_TIMEOUT_MS) {
        console.warn('XPUIPC watchdog: no data for', this.WATCHDOG_TIMEOUT_MS, 'ms, disconnecting')
        this.disconnect()
      }
    }, 2000)
  }

  private stopDataWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer)
      this.watchdogTimer = null
    }
  }

  private emitDataIfComplete() {
    const lat = this.dataValues.get('lat')
    const lng = this.dataValues.get('lng')
    if (lat === undefined || lng === undefined) return

    this.lastDataTimestamp = Date.now()

    const simData: SimData = {
      lat,
      lng,
      alt: this.dataValues.get('alt') ?? 0,
      heading: this.dataValues.get('heading') ?? 0,
      gs: this.dataValues.get('gs') ?? 0,
      ias: this.dataValues.get('ias') ?? 0,
      mach: this.dataValues.get('mach') ?? 0,
      vs: this.dataValues.get('vs') ?? 0,
      pitch: this.dataValues.get('pitch') ?? 0,
      bank: this.dataValues.get('bank') ?? 0,
      fuel: this.dataValues.get('fuel') ?? 0,
      fuelFlow: this.dataValues.get('fuelFlow') ?? 0,
      fuelUnit: 'KGS',
      onGround: (this.dataValues.get('onGround') ?? 0) === 1,
      engineOn: (this.dataValues.get('engineOn') ?? 0) === 1,
      simOn: true,
      timestamp: Date.now(),
      squawk: '2000',
      simulator: this.simVersion,
    }

    this.dataCallback?.(simData)
  }

  private requestAllDataRefs() {
    if (!this.socket) return

    for (const [key, ref] of Object.entries(DATA_REFS)) {
      this.rrefIndex++
      this.rrefMap.set(this.rrefIndex, key)

      const msg = Buffer.alloc(509)
      this.RREF_HEADER.copy(msg, 0)
      msg.writeInt32LE(this.rrefIndex, 5)
      msg.writeInt32LE(1, 9) // frequency: once per second
      msg.write(ref.dataref + '\x00', 13, 'utf-8')

      this.socket.send(msg, 0, 13 + ref.dataref.length + 1, this.xplanePort, this.xplaneHost)
    }
  }

  startPolling(intervalMs: number, callback: (data: SimData) => void): void {
    this.dataCallback = callback

    this.requestAllDataRefs()

    if (this.pollTimer) return
    this.pollTimer = setInterval(() => {
      this.requestAllDataRefs()
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
    this.stopDataWatchdog()
    this.cleanup()
    this.connected = false
    this.notifyStatus(false)
  }

  private cleanup() {
    if (this.socket) {
      try { this.socket.close() } catch { }
      this.socket = null
    }
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
