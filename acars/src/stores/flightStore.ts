import { create } from 'zustand'
import { startFlight, endFlight, updatePosition, submitPIREP, fetchSimBrief, OFP, Booking } from '../lib/api'

export type FlightPhase =
  | 'PRE-FLIGHT' | 'BOARDING' | 'PUSHBACK' | 'TAXI' | 'TAKEOFF'
  | 'INITIAL CLIMB' | 'CLIMB' | 'CRUISE' | 'DESCENT' | 'APPROACH'
  | 'FINAL' | 'LANDED' | 'TAXI-IN' | 'ARRIVED'

export interface FlightData {
  lat: number; lng: number; alt: number; heading: number; gs: number
  ias: number; mach: number; vs: number; pitch: number; bank: number
  fuel: number; fuelFlow: number; fuelUnit: string; onGround: boolean
  engineOn: boolean; simOn: boolean; timestamp: number; squawk: string
  simulator: string
}

export interface FlightLogEntry {
  time: string; event: string
}

interface FlightState {
  ofp: OFP | null
  flightData: FlightData | null
  isTracking: boolean
  phase: FlightPhase
  flightLog: FlightLogEntry[]
  flightHistory: [number, number][]
  fuelAtStart: number
  maxLandingRate: number
  takeoffTime: number | null
  liveFlightId: string | null
  bookings: Booking[]
  sbUsername: string

  setOFP: (ofp: OFP | null) => void
  setFlightData: (data: FlightData) => void
  setPhase: (phase: FlightPhase) => void
  setSbUsername: (username: string) => void
  setBookings: (bookings: Booking[]) => void

  addLog: (event: string) => void
  updatePhaseFromData: (data: FlightData) => FlightPhase

  startFlight: (simulator?: string, network?: string) => Promise<boolean>
  endFlightAndSubmitPIREP: () => Promise<boolean>
  handleSimBriefFetch: (username: string) => Promise<void>
  sendPositionUpdate: () => Promise<void>

  reset: () => void
}

export const useFlightStore = create<FlightState>((set, get) => ({
  ofp: null,
  flightData: null,
  isTracking: false,
  phase: 'PRE-FLIGHT',
  flightLog: [],
  flightHistory: [],
  fuelAtStart: 0,
  maxLandingRate: 0,
  takeoffTime: null,
  liveFlightId: null,
  bookings: [],
  sbUsername: localStorage.getItem('kf_sb_user') || '',

  setOFP: (ofp) => set({ ofp, flightLog: [], phase: 'PRE-FLIGHT' }),
  setFlightData: (data) => set({ flightData: data }),
  setPhase: (phase) => set({ phase }),
  setSbUsername: (username) => {
    localStorage.setItem('kf_sb_user', username)
    set({ sbUsername: username })
  },
  setBookings: (bookings) => set({ bookings }),

  addLog: (event) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    set((s) => ({ flightLog: [{ time, event }, ...s.flightLog].slice(0, 50) }))
  },

  updatePhaseFromData: (data) => {
    const { gs, alt, vs, onGround, engineOn } = data
    const current: string = get().phase
    const prev = get().phase
    let next: FlightPhase = prev

    if (!engineOn && onGround) {
      if (current !== 'ARRIVED' && current !== 'PRE-FLIGHT') return 'ARRIVED'
      return 'PRE-FLIGHT'
    }

    if (onGround) {
      if (gs < 2 && current === 'PRE-FLIGHT' && engineOn) return prev
      if (gs > 2 && gs < 30 && (current === 'PRE-FLIGHT' || current === 'BOARDING' || current === 'PUSHBACK')) {
        if (prev !== 'TAXI') get().addLog('COMMENCING TAXI')
        return 'TAXI'
      }
      if (gs > 40 && (current === 'TAXI' || current === 'PRE-FLIGHT')) {
        if (prev !== 'TAKEOFF') {
          get().addLog('V1 - ROTATE - AIRBORNE')
          if (!get().takeoffTime) set({ takeoffTime: Date.now() })
        }
        return 'TAKEOFF'
      }
      if (gs < 30 && current === 'LANDED') {
        get().addLog('VACATED RUNWAY - TAXIING TO GATE')
        return 'TAXI-IN'
      }
      if (gs < 5 && current === 'TAXI-IN' && !engineOn) {
        get().addLog('ENGINES SHUTDOWN - MISSION COMPLETE')
        return 'ARRIVED'
      }
      if (current === 'FINAL' || current === 'APPROACH') {
        if (gs > 30) {
          get().addLog(`TOUCHDOWN: ${Math.round(vs)} FPM`)
          const lr = get().maxLandingRate
          if (Math.abs(vs) > lr) set({ maxLandingRate: Math.abs(vs) })
          return 'LANDED'
        }
      }
    } else {
      if (alt < 2500 && vs > 500 && current === 'TAKEOFF') return 'INITIAL CLIMB'
      if (alt >= 2500 && vs > 500 && prev !== 'CLIMB') {
        get().addLog(`CLIMBING TO FL${Math.round(alt / 100)}`)
        return 'CLIMB'
      }
      if (Math.abs(vs) < 500 && alt > 5000 && prev !== 'CRUISE') {
        get().addLog('LEVEL AT CRUISE ALTITUDE')
        return 'CRUISE'
      }
      if (vs < -500 && alt > 5000 && prev !== 'DESCENT') {
        get().addLog('TOP OF DESCENT REACHED')
        return 'DESCENT'
      }
      if (alt <= 5000 && alt > 1500 && vs < -200 && prev !== 'APPROACH') {
        get().addLog('ESTABLISHED ON APPROACH')
        return 'APPROACH'
      }
      if (alt <= 1500 && vs < -100 && prev !== 'FINAL') {
        get().addLog('FINAL APPROACH')
        return 'FINAL'
      }
    }
    return next
  },

  startFlight: async (simulator, network) => {
    const ofp = get().ofp
    if (!ofp) return false
    try {
      await startFlight({
        flightNumber: `${ofp.general.icao_airline}${ofp.general.flight_number}`,
        depIcao: ofp.origin.icao_code,
        arrIcao: ofp.destination.icao_code,
        aircraftType: ofp.aircraft.icaocode,
        simulator: simulator || 'UNKNOWN',
        network: network || 'OFFLINE',
      })
      const data = get().flightData
      set({
        isTracking: true,
        phase: 'PRE-FLIGHT',
        fuelAtStart: data?.fuel ?? 0,
        maxLandingRate: 0,
        takeoffTime: null,
      })
      get().addLog('FLIGHT TRACKING ENGAGED')
      return true
    } catch (err) {
      console.error('Failed to start flight:', err)
      return false
    }
  },

  endFlightAndSubmitPIREP: async () => {
    const { ofp, flightData, fuelAtStart, maxLandingRate, takeoffTime } = get()
    if (!ofp || !flightData) return false
    try {
      const flightTime = takeoffTime ? (Date.now() - takeoffTime) / (1000 * 60 * 60) : 0
      await submitPIREP({
        flightNumber: `${ofp.general.icao_airline}${ofp.general.flight_number}`,
        depIcao: ofp.origin.icao_code,
        arrIcao: ofp.destination.icao_code,
        depTime: new Date(takeoffTime || Date.now()).toISOString(),
        arrTime: new Date().toISOString(),
        aircraftId: ofp.aircraft.reg,
        simulator: flightData.simulator || 'UNKNOWN',
        network: 'OFFLINE',
        landingRate: Math.round(maxLandingRate),
        fuelUsed: Math.max(0, fuelAtStart - flightData.fuel),
        distance: 0,
        flightTime,
        comments: 'Kingfisher ACARS - Auto-filed',
      })
      await endFlight()
      get().reset()
      return true
    } catch (err) {
      console.error('Failed to submit PIREP:', err)
      return false
    }
  },

  handleSimBriefFetch: async (username) => {
    const ofp = await fetchSimBrief(username)
    get().setOFP(ofp)
    get().setSbUsername(username)
    get().addLog(`OFP IMPORTED: ${ofp.general.icao_airline}${ofp.general.flight_number}`)
  },

  sendPositionUpdate: async () => {
    const { flightData, phase } = get()
    if (!flightData) return
    try {
      await updatePosition({
        lat: flightData.lat,
        lng: flightData.lng,
        alt: flightData.alt,
        heading: flightData.heading,
        groundSpeed: flightData.gs,
        phase,
        fuel: flightData.fuel,
        vs: flightData.vs,
      })
    } catch (err) {
      console.error('Position update failed:', err)
    }
  },

  reset: () => set({
    ofp: null, flightData: null, isTracking: false, phase: 'PRE-FLIGHT',
    flightLog: [], flightHistory: [], fuelAtStart: 0, maxLandingRate: 0,
    takeoffTime: null, liveFlightId: null,
  }),
}))
