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
  return a + (b - a) * Math.max(0, Math.min(1, t))
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

export class DemoAdapter implements SimulatorAdapter {
  readonly type = SimulatorType.UNKNOWN
  readonly name = 'Simulation / Demo Mode'
  readonly compatibleTypes: SimulatorType[] = []

  private timer: NodeJS.Timeout | null = null
  private dataCallback: ((data: SimData) => void) | null = null
  private statusCallbacks: Set<(connected: boolean) => void> = new Set()
  private connected = false
  private flying = false

  private origin = DEFAULT_ORIGIN
  private dest = DEFAULT_DEST
  private hdg = 0
  private elapsed = 0

  private fuelAmount = 8500
  private fuelUnit = 'LBS'

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
  private phase: 'idle' | 'taxi' | 'takeoff' | 'climb' | 'cruise' | 'descent' | 'approach' | 'landed' | 'done' = 'idle'
  private lat = DEFAULT_ORIGIN.lat
  private lng = DEFAULT_ORIGIN.lng

  setRoute(origin: { lat: number; lng: number }, dest: { lat: number; lng: number }) {
    this.origin = origin
    this.dest = dest
    this.hdg = bearing(origin.lat, origin.lng, dest.lat, dest.lng)
    this.lat = origin.lat
    this.lng = origin.lng
  }

  setFuel(amount: number, unit?: string) {
    this.fuelAmount = amount
    this.fuel = amount
    if (unit) this.fuelUnit = unit
  }

  startFlight() {
    if (!this.flying) {
      this.flying = true
      this.phase = 'idle'
      this.elapsed = 0
      this.engineOn = true
      this.squawk = String(1200 + Math.floor(Math.random() * 5000))
    }
  }

  async connect(): Promise<boolean> {
    if (this.connected) return true
    this.connected = true
    this.flying = false
    this.phase = 'idle'
    this.elapsed = 0
    this.alt = 0
    this.gs = 0
    this.ias = 0
    this.mach = 0
    this.vs = 0
    this.pitch = 0
    this.bank = 0
    this.fuel = this.fuelAmount
    this.fuelFlow = 0
    this.onGround = true
    this.engineOn = false
    this.squawk = '2000'
    this.lat = this.origin.lat
    this.lng = this.origin.lng
    this.notifyStatus(true)
    return true
  }

  disconnect(): void {
    this.stopPolling()
    this.connected = false
    this.flying = false
    this.phase = 'idle'
    this.notifyStatus(false)
  }

  isConnected(): boolean {
    return this.connected
  }

  isFlying(): boolean {
    return this.flying
  }

  startPolling(intervalMs: number, callback: (data: SimData) => void): void {
    this.dataCallback = callback
    if (this.timer) return
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
    if (!this.flying) return

    this.elapsed += 1
    const t = this.elapsed

    if (this.phase === 'idle') {
      this.gs = 0
      this.alt = 0
      this.vs = 0
      this.pitch = 0
      this.bank = 0
      this.fuelFlow = 0.5
      this.ias = 0
      this.mach = 0
      this.onGround = true
      this.engineOn = true
      if (t > 8) {
        this.phase = 'taxi'
        this.elapsed = 0
      }
    }

    else if (this.phase === 'taxi') {
      const taxiProgress = smoothstep(0, 20, t)
      this.gs = lerp(0, 18, taxiProgress)
      this.alt = 0
      this.vs = 0
      this.pitch = 0
      this.bank = 0
      this.fuelFlow = lerp(0.5, 4.2, taxiProgress)
      this.ias = this.gs
      this.mach = 0
      this.onGround = true
      this.engineOn = true
      if (t > 25) {
        this.phase = 'takeoff'
        this.elapsed = 0
      }
    }

    else if (this.phase === 'takeoff') {
      const toProgress = smoothstep(0, 22, t)
      this.gs = lerp(18, 160, toProgress)
      this.alt = lerp(0, 3500, smoothstep(5, 25, t))
      this.vs = lerp(0, 1800, smoothstep(3, 18, t))
      this.pitch = lerp(0, 10, smoothstep(6, 14, t))
      this.bank = 0
      this.fuelFlow = lerp(4.2, 38, toProgress)
      this.ias = Math.max(this.gs - this.alt * 0.002, this.gs * 0.6)
      this.mach = Math.max(0, this.gs / 575 - this.alt * 1.5e-6)
      this.onGround = t < 14
      this.engineOn = true
      if (this.alt >= 3000) {
        this.phase = 'climb'
        this.elapsed = 0
      }
    }

    else if (this.phase === 'climb') {
      const climbProgress = smoothstep(0, 240, t)
      const altTarget = lerp(3500, 36000, climbProgress)
      this.alt = altTarget
      this.gs = lerp(160, 285, climbProgress)
      this.vs = lerp(1800, 600, climbProgress)
      this.pitch = lerp(10, 3, climbProgress)
      this.bank = (Math.sin(t * 0.05)) * 1.5
      this.fuelFlow = lerp(38, 32, climbProgress)
      this.ias = Math.max(180, this.gs - this.alt * 0.0022)
      this.mach = this.gs / 575
      this.onGround = false
      this.engineOn = true
      if (this.alt >= 35000) {
        this.phase = 'cruise'
        this.elapsed = 0
      }
    }

    else if (this.phase === 'cruise') {
      this.alt = 36000 + Math.sin(t * 0.02) * 100
      this.gs = 450 + Math.sin(t * 0.03) * 8
      this.vs = Math.sin(t * 0.02) * 50
      this.pitch = 2 + Math.sin(t * 0.04) * 0.5
      this.bank = Math.sin(t * 0.05) * 1.5
      this.fuelFlow = 28 + Math.sin(t * 0.02) * 1.5
      this.ias = this.gs - this.alt * 0.0022
      this.mach = this.gs / 575
      this.onGround = false
      this.engineOn = true
      if (t > 210) {
        this.phase = 'descent'
        this.elapsed = 0
      }
    }

    else if (this.phase === 'descent') {
      const descProgress = smoothstep(0, 240, t)
      this.alt = lerp(36000, 3000, descProgress)
      this.gs = lerp(450, 250, descProgress)
      this.vs = lerp(-200, -1200, smoothstep(0, 80, t))
      this.pitch = lerp(2, -3, descProgress)
      this.bank = Math.sin(t * 0.06) * 2
      this.fuelFlow = lerp(28, 14, descProgress)
      this.ias = Math.max(220, this.gs - this.alt * 0.0018)
      this.mach = this.gs / 575
      this.onGround = false
      this.engineOn = true
      if (this.alt <= 3000) {
        this.phase = 'approach'
        this.elapsed = 0
      }
    }

    else if (this.phase === 'approach') {
      const appProgress = smoothstep(0, 100, t)
      this.alt = lerp(3000, 0, appProgress)
      this.gs = lerp(250, 140, appProgress)
      this.vs = lerp(-600, -800, smoothstep(20, 60, t))
      this.pitch = lerp(-2, -4, appProgress)
      this.bank = Math.sin(t * 0.08) * 3
      this.fuelFlow = lerp(14, 8, appProgress)
      this.ias = this.gs
      this.mach = this.gs / 575
      this.onGround = false
      this.engineOn = true
      if (this.alt < 20) {
        this.phase = 'landed'
        this.elapsed = 0
        this.onGround = true
      }
    }

    else if (this.phase === 'landed') {
      const landProgress = smoothstep(0, 20, t)
      this.gs = lerp(140, 0, landProgress)
      this.alt = 0
      this.vs = lerp(-100, 0, landProgress)
      this.pitch = 0
      this.bank = 0
      this.fuelFlow = lerp(8, 0.5, landProgress)
      this.ias = this.gs
      this.mach = 0
      this.onGround = true
      this.engineOn = this.gs > 2
      if (this.gs < 2) {
        this.squawk = '2000'
        this.fuelFlow = 0
        this.vs = 0
        this.phase = 'done'
      }
    }

    const routeProgress = this.calcRouteProgress()
    this.lat = lerp(this.origin.lat, this.dest.lat, routeProgress)
    this.lng = lerp(this.origin.lng, this.dest.lng, routeProgress)
    this.fuel -= this.fuelFlow / 3600
  }

  private calcRouteProgress(): number {
    if (!this.flying || this.phase === 'idle') return 0
    if (this.phase === 'done' || this.phase === 'landed') return 1
    const phaseProgress: Record<string, [number, number]> = {
      taxi: [0, 0.01],
      takeoff: [0, 0.03],
      climb: [0.01, 0.35],
      cruise: [0.3, 0.7],
      descent: [0.65, 0.92],
      approach: [0.9, 0.99],
    }
    const range = phaseProgress[this.phase]
    if (!range) return 0
    return lerp(range[0], range[1], Math.min(this.elapsed / 100, 1))
  }

  private buildData(): SimData {
    return {
      lat: this.lat,
      lng: this.lng,
      alt: Math.round(this.alt * 10) / 10,
      heading: this.hdg,
      gs: Math.round(this.gs * 10) / 10,
      ias: Math.round(this.ias * 10) / 10,
      mach: Math.round(this.mach * 1000) / 1000,
      vs: Math.round(this.vs),
      pitch: Math.round(this.pitch * 10) / 10,
      bank: Math.round(this.bank * 10) / 10,
      fuel: Math.round(this.fuel * 10) / 10,
      fuelFlow: Math.round(this.fuelFlow * 10) / 10,
      fuelUnit: this.fuelUnit,
      onGround: this.onGround,
      engineOn: this.engineOn,
      simOn: true,
      timestamp: Date.now(),
      squawk: this.squawk,
      simulator: 'SIMULATION',
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
