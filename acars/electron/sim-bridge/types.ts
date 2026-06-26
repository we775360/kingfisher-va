export enum SimulatorType {
  MSFS2020 = 'MSFS2020',
  MSFS2024 = 'MSFS2024',
  FSX = 'FSX',
  FSX_SE = 'FSX:SE',
  P3Dv4 = 'P3Dv4',
  P3Dv5 = 'P3Dv5',
  P3Dv6 = 'P3Dv6',
  XP11 = 'XP11',
  XP12 = 'XP12',
  UNKNOWN = 'UNKNOWN',
}

export interface SimData {
  lat: number
  lng: number
  alt: number
  heading: number
  gs: number
  ias: number
  mach: number
  vs: number
  pitch: number
  bank: number
  fuel: number
  fuelFlow: number
  fuelUnit: string
  onGround: boolean
  engineOn: boolean
  simOn: boolean
  timestamp: number
  squawk: string
  simulator: SimulatorType
  nav1Freq?: number
  nav2Freq?: number
  transponder?: number
}

export interface SimulatorAdapter {
  readonly type: SimulatorType
  readonly name: string
  readonly compatibleTypes: SimulatorType[]

  connect(): Promise<boolean>
  disconnect(): void
  isConnected(): boolean

  startPolling(intervalMs: number, callback: (data: SimData) => void): void
  stopPolling(): void

  onStatusChange(callback: (connected: boolean) => void): void
  removeStatusChangeListener(callback: (connected: boolean) => void): void
}

export const ADAPTER_ORDER: SimulatorType[] = [
  SimulatorType.MSFS2020,
  SimulatorType.MSFS2024,
  SimulatorType.P3Dv5,
  SimulatorType.P3Dv4,
  SimulatorType.P3Dv6,
  SimulatorType.FSX_SE,
  SimulatorType.FSX,
  SimulatorType.XP12,
  SimulatorType.XP11,
]
