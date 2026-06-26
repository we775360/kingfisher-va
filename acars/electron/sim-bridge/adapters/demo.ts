import { SimulatorAdapter, SimData, SimulatorType } from '../types.js'

const DEFAULT_ORIGIN = { lat: 51.47, lng: -0.4543 }
const DEFAULT_DEST = { lat: 52.3086, lng: 4.7639 }

function bearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180)
  const x = Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function gauss(mean: number, std: number): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export class DemoAdapter implements SimulatorAdapter {
  readonly type = SimulatorType.UNKNOWN
  readonly name = 'Simulation / Demo Mode'

  private timer: NodeJS.Timeout | null = null
  private dataCallback: ((data: SimData) => void) | null = null
  private statusCallbacks: Set<(connected: boolean) => void> = new Set()
  private connected = false

  private origin = DEFAULT_ORIGIN
  private dest = DEFAULT_DEST
  private hdg = 0
  private elapsed = 0
  private alt = 0
  private gs = 0
  private ias = 0
  private mach = 0
  private vs = 0
  private pitch = 0
  private bank = 0
  private fuel = 8500
  private fuelFlow = 0
  private onGround = true
  private engineOn = false
  private squawk = '2000'
  private phase: 'ground' | 'taxi' | 'takeoff' | 'climb' | 'cruise' | 'descent' | 'approach' | 'landed' = 'ground'

  private readonly TAXI_SPEED = 15
  private readonly TAKEOFF_SPEED = 155
  private readonly CLIMB_SPEED = 285
  private readonly CRUISE_SPEED = 450
  private readonly APPROACH_SPEED = 160
  private readonly CRUISE_ALT = 36000
  private readonly CLIMB_RATE = 1800
  private readonly DESCENT_RATE = -1200

  setRoute(origin: { lat: number; lng: number }, dest: { lat: number; lng: number }) {
    this.origin = origin
    this.dest = dest
    this.hdg = bearing(origin.lat, origin.lng, dest.lat, dest.lng)
  }

  async connect(): Promise<boolean> {
    if (this.connected) return true
    this.connected = true
    this.notifyStatus(true)
    return true
  }

  disconnect(): void {
    this.stopPolling()
    this.connected = false
    this.phase = 'ground'
    this.elapsed = 0
    this.alt = 0
    this.gs = 0
    this.engineOn = false
    this.onGround = true
    this.fuel = 8500
    this.notifyStatus(false)
  }

  isConnected(): boolean {
    return this.connected
  }

  startPolling(intervalMs: number, callback: (data: SimData) => void): void {
    this.dataCallback = callback
    if (this.timer) return
    this.phase = 'ground'
    this.elapsed = 0

    setTimeout(() => { this.engineOn = true }, 5000)
    setTimeout(() => { this.phase = 'taxi' }, 12000)

    this.timer = setInterval(() => {
      this.tick()
      if (this.dataCallback) {
        this.dataCallback(this.buildData())
      }
    }, intervalMs)
  }

  stopPolling(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private tick() {
    this.elapsed += 1

    switch (this.phase) {
      case 'ground':
        this.gs = 0
        this.alt = 0
        this.vs = 0
        this.pitch = 0
        this.bank = 0
        this.fuelFlow = 0
        this.squawk = '2000'
        this.mach = 0
        this.ias = 0
        if (this.engineOn && this.elapsed > 12) {
          this.phase = 'taxi'
          this.elapsed = 0
        }
        break

      case 'taxi':
        this.gs = gauss(this.TAXI_SPEED, 3)
        this.alt = 0
        this.vs = 0
        this.pitch = 0
        this.bank = gauss(0, 2)
        this.fuelFlow = gauss(300, 20)
        this.ias = this.gs
        this.mach = this.gs / 575
        this.squawk = '2000'
        if (this.elapsed > 25) {
          this.phase = 'takeoff'
          this.elapsed = 0
        }
        break

      case 'takeoff':
        this.gs = gauss(lerp(this.TAXI_SPEED, this.TAKEOFF_SPEED, Math.min(this.elapsed / 20, 1)), 5)
        this.alt = lerp(0, 3500, Math.min(this.elapsed / 30, 1))
        this.vs = lerp(0, this.CLIMB_RATE, Math.min(this.elapsed / 15, 1))
        this.pitch = lerp(0, 12, Math.min(this.elapsed / 10, 1)) * (this.elapsed < 10 ? 0 : 1)
        this.bank = gauss(0, 1)
        this.fuelFlow = gauss(2800, 100)
        this.ias = this.gs
        this.mach = this.gs / 575
        this.onGround = this.elapsed < 12
        this.squawk = String(Math.floor(1000 + Math.random() * 7000))
        if (this.alt > 3000) {
          this.phase = 'climb'
          this.elapsed = 0
        }
        break

      case 'climb':
        this.alt = lerp(3500, this.CRUISE_ALT, Math.min(this.elapsed / 300, 1))
        this.gs = gauss(lerp(this.TAKEOFF_SPEED, this.CLIMB_SPEED, Math.min(this.elapsed / 200, 1)), 8)
        this.vs = lerp(this.CLIMB_RATE, 800, Math.min(this.elapsed / 250, 1))
        this.pitch = lerp(12, 3, Math.min(this.elapsed / 200, 1))
        this.bank = gauss(0, 1.5)
        this.fuelFlow = gauss(2600, 150)
        this.ias = Math.max(200, this.gs - this.alt * 0.002)
        this.mach = this.gs / 575
        this.onGround = false
        this.squawk = String(Math.floor(1000 + Math.random() * 7000))
        if (this.alt >= this.CRUISE_ALT - 500) {
          this.phase = 'cruise'
          this.elapsed = 0
        }
        break

      case 'cruise':
        this.alt = gauss(this.CRUISE_ALT, 50)
        this.gs = gauss(this.CRUISE_SPEED, 5)
        this.vs = gauss(0, 50)
        this.pitch = gauss(2, 0.5)
        this.bank = gauss(0, 1)
        this.fuelFlow = gauss(2400, 100)
        this.ias = this.gs - this.alt * 0.0022
        this.mach = this.gs / 575
        this.onGround = false
        if (this.elapsed > 180) {
          this.phase = 'descent'
          this.elapsed = 0
        }
        break

      case 'descent':
        this.alt = lerp(this.CRUISE_ALT, 3000, Math.min(this.elapsed / 280, 1))
        this.gs = gauss(lerp(this.CRUISE_SPEED, 250, Math.min(this.elapsed / 200, 1)), 10)
        this.vs = gauss(this.DESCENT_RATE, 100)
        this.pitch = gauss(-2, 0.5)
        this.bank = gauss(0, 2)
        this.fuelFlow = gauss(1600, 100)
        this.ias = Math.max(250, this.gs - this.alt * 0.0015)
        this.mach = this.gs / 575
        this.onGround = false
        if (this.alt <= 3000) {
          this.phase = 'approach'
          this.elapsed = 0
        }
        break

      case 'approach':
        this.alt = lerp(3000, 0, Math.min(this.elapsed / 120, 1))
        this.gs = gauss(lerp(250, this.APPROACH_SPEED, Math.min(this.elapsed / 60, 1)), 8)
        this.vs = gauss(-700, 100)
        this.pitch = gauss(-3, 1)
        this.bank = gauss(0, 3)
        this.fuelFlow = gauss(1200, 80)
        this.ias = this.gs
        this.mach = this.gs / 575
        this.onGround = false
        this.squawk = String(Math.floor(1000 + Math.random() * 7000))
        if (this.alt < 50) {
          this.phase = 'landed'
          this.elapsed = 0
          this.onGround = true
        }
        break

      case 'landed':
        this.gs = gauss(lerp(this.APPROACH_SPEED, 0, Math.min(this.elapsed / 30, 1)), 5)
        this.alt = 0
        this.vs = gauss(-100, 50)
        this.pitch = 0
        this.bank = 0
        this.fuelFlow = gauss(400, 50)
        this.ias = this.gs
        this.mach = 0
        this.onGround = true
        this.squawk = '2000'
        if (this.gs < 5) {
          this.gs = 0
          this.ias = 0
          this.vs = 0
          this.fuelFlow = 0
          this.engineOn = false
        }
        break
    }

    this.fuel -= this.fuelFlow / 3600
  }

  private buildData(): SimData {
    const currentLerpT = this.phase === 'takeoff' || this.phase === 'climb' || this.phase === 'cruise'
      ? Math.min(this.elapsed / 400, 1)
      : this.phase === 'descent' || this.phase === 'approach'
        ? 1 - Math.min(this.elapsed / 400, 1)
        : 0

    const finalT = this.phase === 'landed' || (this.phase === 'ground' && this.onGround && !this.engineOn) ? 1 : currentLerpT

    return {
      lat: lerp(this.origin.lat, this.dest.lat, finalT) + gauss(0, 0.0005),
      lng: lerp(this.origin.lng, this.dest.lng, finalT) + gauss(0, 0.0005),
      alt: Math.round(this.alt * 10) / 10,
      heading: this.hdg + gauss(0, 2),
      gs: Math.round(this.gs * 10) / 10,
      ias: Math.round(this.ias * 10) / 10,
      mach: Math.round(this.mach * 1000) / 1000,
      vs: Math.round(this.vs),
      pitch: Math.round(this.pitch * 10) / 10,
      bank: Math.round(this.bank * 10) / 10,
      fuel: Math.round(this.fuel * 10) / 10,
      fuelFlow: Math.round(this.fuelFlow * 10) / 10,
      fuelUnit: 'LBS',
      onGround: this.onGround,
      engineOn: this.engineOn,
      simOn: true,
      timestamp: Date.now(),
      squawk: this.squawk,
      simulator: SimulatorType.UNKNOWN,
    }
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
