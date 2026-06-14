import { useState, useEffect, useRef } from 'react'
import { Plane, Activity, Map as MapIcon, Settings, LogOut, Import, Briefcase, Navigation, List, ExternalLink, ShieldCheck } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import axios from 'axios'
import { create } from 'zustand'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import logoImg from './assets/logo.png'

// Fix Leaflet icon issue in Electron/Vite
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const planeIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/723/723955.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- TYPES ---
interface Pilot {
  id: string
  pilotId: string
  firstName: string
  lastName: string
  rank: string
  totalHours: number
  status: string
}

interface User {
  id: string
  email: string
  role: string
  pilot: Pilot
}

interface OFP {
  general: {
    icao_airline: string
    flight_number: string
  }
  aircraft: {
    icaocode: string
    reg: string
  }
  origin: {
    icao_code: string
    iata_code: string
  }
  destination: {
    icao_code: string
    iata_code: string
  }
  times: {
    est_block: number
    est_out: number
    est_off: number
    est_on: number
    est_in: number
  }
  fuel: {
    plan_ramp: number
  }
}

interface FlightData {
  lat: number
  lng: number
  alt: number
  heading: number
  gs: number
  onGround: boolean
  vs: number
  fuel: number
  engineOn: boolean
  timestamp: number
  ias: number
  mach: number
  squawk: string
  pitch: number
  bank: number
}

type FlightPhase = 
  | 'PRE-FLIGHT' 
  | 'PUSHBACK' 
  | 'TAXI' 
  | 'TAKEOFF' 
  | 'INITIAL CLIMB' 
  | 'CLIMB' 
  | 'CRUISE' 
  | 'DESCENT' 
  | 'APPROACH' 
  | 'FINAL' 
  | 'LANDED' 
  | 'TAXI-IN' 
  | 'ARRIVED'

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}
// --- STORE ---
const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setAuth: (user, token) => {
    localStorage.setItem('kf_token', token)
    set({ user, token, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem('kf_token')
    set({ user: null, token: null, isAuthenticated: false })
  },
}))

// Force sign-out on app start to ensure fresh session data
localStorage.removeItem('kf_token');


const API_URL = 'https://kingfisher-api.onrender.com/api/v1'

function App() {
  const { isAuthenticated, logout, user, token, setAuth } = useAuthStore()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [simStatus, setSimStatus] = useState<'connected' | 'disconnected'>('disconnected')
  const [flightData, setFlightData] = useState<FlightData | null>(null)
  const [flightHistory, setFlightHistory] = useState<[number, number][]>([])
  const [ofp, setOfp] = useState<OFP | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [phase, setPhase] = useState<FlightPhase>('PRE-FLIGHT')
  const [flightLog, setFlightLog] = useState<{ time: string, event: string }[]>([])
  const [sbUsername, setSbUsername] = useState(localStorage.getItem('kf_sb_user') || '')

  useEffect(() => {
    if (isAuthenticated) {
      (window as any).ipcRenderer.invoke('get-sim-status').then((status: any) => {
        setSimStatus(status)
      })

      const removeStatusListener = (window as any).ipcRenderer.on('sim-status', (_event: any, status: any) => {
        setSimStatus(status)
        addLog(`Simulator Connection: ${status.toUpperCase()}`)
      })

      const removeDataListener = (window as any).ipcRenderer.on('flight-data', (_event: any, data: FlightData) => {
        setFlightData(data)
        if (data.lat && data.lng && data.lat !== 0) {
          setFlightHistory(prev => [...prev.slice(-1000), [data.lat, data.lng]])
        }
      })

      return () => {
        if (typeof removeStatusListener === 'function') removeStatusListener()
        if (typeof removeDataListener === 'function') removeDataListener()
      }
    }
  }, [isAuthenticated])

  const addLog = (event: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setFlightLog(prev => [{ time, event }, ...prev].slice(0, 50))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password })
      setAuth(res.data.user, res.data.token)
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error)
      } else {
        setError('Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchSimBrief = async (username: string) => {
    if (!username) return
    setLoading(true)
    try {
      localStorage.setItem('kf_sb_user', username)
      setSbUsername(username)
      const res = await axios.get(`${API_URL}/acars/simbrief?username=${username}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOfp(res.data)
      setFlightLog([])
      addLog(`OFP IMPORTED: ${res.data.general.icao_airline}${res.data.general.flight_number}`)
      setActiveTab('dashboard')
    } catch (err) {
      console.error(err)
      alert('Failed to fetch SimBrief. Check your username.')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-screen bg-kf-black text-white p-8">
        <div className="flex-1 flex flex-col items-center justify-center">
          <img src={logoImg} alt="Kingfisher" className="w-32 mb-8" />
          <h1 className="text-2xl font-bold mb-6 italic tracking-tighter">ACARS LOGIN</h1>
          <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Personnel Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-3 focus:border-kf-red outline-none transition-all focus:ring-1 focus:ring-kf-red/20"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Personnel Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-3 focus:border-kf-red outline-none transition-all focus:ring-1 focus:ring-kf-red/20"
                required
              />
            </div>
            {error && <p className="text-kf-red text-xs font-bold bg-kf-red/10 p-3 rounded-lg border border-kf-red/20">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-kf-red hover:bg-kf-red-dark text-white font-black italic py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-kf-red/20 uppercase tracking-widest disabled:opacity-50 mt-4"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
        <div className="text-center text-[10px] font-bold text-neutral-600 uppercase tracking-[0.3em]">
          Kingfisher Operations Control v1.1.0
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-kf-black text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-20 bg-sidebar border-r border-neutral-800/50 flex flex-col items-center py-8 space-y-10 z-30 shadow-2xl relative">
        <div className="p-3 bg-gradient-to-br from-kf-red to-kf-red-dark rounded-2xl shadow-xl shadow-kf-red/30 transform hover:rotate-6 transition-transform cursor-pointer">
          <Plane className="w-7 h-7" />
        </div>
        
        <nav className="flex-1 flex flex-col space-y-8">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Activity className="w-6 h-6" />} label="Live" />
          <NavItem active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} icon={<Briefcase className="w-6 h-6" />} label="Tasks" />
          <NavItem active={activeTab === 'map'} onClick={() => setActiveTab('map')} icon={<MapIcon className="w-6 h-6" />} label="Map" />
          <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings className="w-6 h-6" />} label="Data" />
        </nav>

        <button 
          onClick={logout}
          className="p-4 text-neutral-600 hover:text-kf-red hover:bg-kf-red/5 rounded-2xl transition-all"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-neutral-900/40 via-kf-black to-kf-black">
        <header className="h-20 border-b border-neutral-800/30 flex items-center justify-between px-10 bg-kf-black/40 backdrop-blur-2xl sticky top-0 z-20">
          <div className="flex items-center space-x-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-1">Status</span>
              <div className={cn(
                "flex items-center space-x-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border-2",
                simStatus === 'connected' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
              )}>
                <div className={cn("w-2 h-2 rounded-full", simStatus === 'connected' ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500')} />
                <span>{simStatus === 'connected' ? 'Sim Connected' : 'No Connection'}</span>
              </div>
            </div>
            
            {ofp && (
              <div className="h-10 w-[1px] bg-neutral-800/50" />
            )}

            {ofp && (
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-1">Mission</span>
                <span className="text-lg font-black italic tracking-tighter uppercase leading-none">
                  {ofp.general.icao_airline}{ofp.general.flight_number} <span className="text-kf-red ml-1">/</span> {ofp.aircraft.icaocode}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex flex-col items-end">
              <span className="text-base font-black italic tracking-tighter uppercase leading-none">{user?.pilot?.firstName} {user?.pilot?.lastName}</span>
              <span className="text-[10px] font-bold text-kf-red uppercase tracking-widest mt-1">{user?.pilot?.pilotId} • {user?.pilot?.rank}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700/50 flex items-center justify-center shadow-xl transform rotate-3">
              <span className="text-lg font-black text-kf-red italic">
                {user?.pilot?.firstName?.[0]}{user?.pilot?.lastName?.[0]}
              </span>
            </div>
          </div>
        </header>

        <main className={cn("flex-1 relative flex flex-col min-h-0", activeTab !== 'map' && 'p-6 overflow-y-auto')}>
          {activeTab === 'dashboard' && (
            <Dashboard 
              token={token} 
              flightData={flightData} 
              ofp={ofp} 
              isTracking={isTracking}
              setIsTracking={setIsTracking}
              phase={phase}
              setPhase={setPhase}
              setOfp={setOfp}
              fetchSimBrief={fetchSimBrief}
              loading={loading}
              setLoading={setLoading}
              flightLog={flightLog}
              sbUsername={sbUsername}
              setSbUsername={setSbUsername}
              addLog={addLog}
            />
          )}
          {activeTab === 'bookings' && <BookingsView token={token} onSelect={fetchSimBrief} />}
          {activeTab === 'map' && <MapView flightData={flightData} history={flightHistory} ofp={ofp} />}
          {activeTab === 'settings' && <SettingsView />}
        </main>

        <footer className="h-8 bg-kf-black border-t border-neutral-800/30 px-6 flex items-center justify-between text-[9px] font-bold text-neutral-600 uppercase tracking-[0.2em] z-20">
          <span>Kingfisher Custom ACARS · Founded 2026</span>
          <div className="flex items-center space-x-4">
            <span>Server: <span className="text-green-500">Live</span></span>
            <span>Lat: {flightData?.lat.toFixed(4) || '0.0000'}</span>
            <span>Lng: {flightData?.lng.toFixed(4) || '0.0000'}</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center space-y-1.5 transition-all duration-300 relative group",
        active ? 'text-kf-red scale-110' : 'text-neutral-600 hover:text-white'
      )}
    >
      <div className={cn(
        "p-3 rounded-2xl transition-all duration-300",
        active ? 'bg-kf-red/10 shadow-lg shadow-kf-red/5' : 'group-hover:bg-neutral-800'
      )}>
        {icon}
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      {active && <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-kf-red rounded-l-full shadow-[0_0_10px_rgba(214,28,34,0.5)]" />}
    </button>
  )
}

function Dashboard({ 
  token, flightData, ofp, isTracking, setIsTracking, phase, setPhase, setOfp, fetchSimBrief, loading, setLoading, flightLog, sbUsername, setSbUsername, addLog 
}: { 
  token: string | null, flightData: FlightData | null, ofp: OFP | null, isTracking: boolean, 
  setIsTracking: (v: boolean) => void, phase: FlightPhase, setPhase: (p: FlightPhase) => void,
  setOfp: (o: OFP | null) => void, fetchSimBrief: (u: string) => void, loading: boolean, setLoading: (v: boolean) => void,
  flightLog: {time: string, event: string}[], sbUsername: string, setSbUsername: (u: string) => void, addLog: (e: string) => void
}) {
  const [fuelAtStart, setFuelAtStart] = useState<number>(0)
  const [maxLandingRate, setMaxLandingRate] = useState<number>(0)
  const [takeoffTime, setTakeoffTime] = useState<number | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  useEffect(() => {
    if (isTracking && flightData) {
      const gs = flightData.gs
      const alt = flightData.alt
      const vs = flightData.vs
      const onGround = flightData.onGround
      const currentPhase = phaseRef.current

      let nextPhase: FlightPhase = currentPhase

      if (onGround) {
        if (gs < 2 && currentPhase === 'PRE-FLIGHT' && flightData.engineOn) {
          // pre-flight
        } else if (gs > 2 && gs < 30 && currentPhase === 'PRE-FLIGHT') {
          nextPhase = 'TAXI'
          addLog('COMMENCING TAXI')
        } else if (gs > 40 && (currentPhase === 'TAXI' || currentPhase === 'PRE-FLIGHT')) {
          nextPhase = 'TAKEOFF'
          addLog('V1 - ROTATE - AIRBORNE')
          if (!takeoffTime) setTakeoffTime(Date.now())
        } else if (gs < 30 && (currentPhase === 'LANDED')) {
          nextPhase = 'TAXI-IN'
          addLog('VACATED RUNWAY - TAXIING TO GATE')
        } else if (gs < 5 && currentPhase === 'TAXI-IN' && !flightData.engineOn) {
          nextPhase = 'ARRIVED'
          addLog('ENGINES SHUTDOWN - MISSION COMPLETE')
        }
      } else {
        if (alt < 2500 && vs > 500 && (currentPhase === 'TAKEOFF')) {
          nextPhase = 'INITIAL CLIMB'
        } else if (alt >= 2500 && vs > 500 && currentPhase !== 'CLIMB') {
          nextPhase = 'CLIMB'
          addLog(`CLIMBING TO FL${Math.round(alt/100)}`)
        } else if (Math.abs(vs) < 500 && alt > 5000 && currentPhase !== 'CRUISE') {
          nextPhase = 'CRUISE'
          addLog(`LEVEL AT CRUISE ALTITUDE`)
        } else if (vs < -500 && alt > 5000 && currentPhase !== 'DESCENT') {
          nextPhase = 'DESCENT'
          addLog('TOP OF DESCENT REACHED')
        } else if (alt <= 5000 && alt > 1500 && vs < -200 && currentPhase !== 'APPROACH') {
          nextPhase = 'APPROACH'
          addLog('ESTABLISHED ON APPROACH')
        } else if (alt <= 1500 && vs < -100 && currentPhase !== 'FINAL') {
          nextPhase = 'FINAL'
          addLog('FINAL APPROACH')
        }
      }

      if (onGround && (currentPhase === 'FINAL' || currentPhase === 'APPROACH')) {
        if (gs > 30) {
          nextPhase = 'LANDED'
          addLog(`TOUCHDOWN: ${Math.round(vs)} FPM`)
          if (Math.abs(vs) > maxLandingRate) setMaxLandingRate(Math.abs(vs))
        }
      }

      if (nextPhase !== currentPhase) {
        setPhase(nextPhase)
      }

      if (Date.now() - lastUpdateRef.current > 30000) {
        sendUpdate(flightData, nextPhase)
        lastUpdateRef.current = Date.now()
      }
    }
  }, [isTracking, flightData])

  const sendUpdate = async (data: FlightData, currentPhase: string) => {
    try {
      await axios.post(`${API_URL}/acars/update`, {
        lat: data.lat,
        lng: data.lng,
        alt: data.alt,
        heading: data.heading,
        groundSpeed: data.gs,
        phase: currentPhase
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (err) {
      console.error('Update failed:', err)
    }
  }

  const handleStartTracking = async () => {
    if (!ofp || !flightData) return
    setLoading(true)
    try {
      await axios.post(`${API_URL}/acars/start`, {
        flightNumber: `${ofp.general.icao_airline}${ofp.general.flight_number}`,
        depIcao: ofp.origin.icao_code,
        arrIcao: ofp.destination.icao_code,
        aircraftType: ofp.aircraft.icaocode,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setIsTracking(true)
      setPhase('PRE-FLIGHT')
      setFuelAtStart(flightData.fuel)
      addLog('FLIGHT TRACKING ENGAGED')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEndFlight = async () => {
    if (!ofp || !flightData) return
    setLoading(true)
    try {
      const flightTime = takeoffTime ? (Date.now() - takeoffTime) / (1000 * 60 * 60) : 0
      await axios.post(`${API_URL}/pirep`, {
        flightNumber: `${ofp.general.icao_airline}${ofp.general.flight_number}`,
        depIcao: ofp.origin.icao_code,
        arrIcao: ofp.destination.icao_code,
        depTime: new Date(takeoffTime || Date.now()).toISOString(),
        arrTime: new Date().toISOString(),
        aircraftId: ofp.aircraft.reg,
        simulator: 'MSFS',
        network: 'OFFLINE',
        landingRate: Math.round(maxLandingRate),
        fuelUsed: Math.max(0, fuelAtStart - flightData.fuel),
        distance: 0,
        flightTime: flightTime,
        comments: 'Kingfisher Custom ACARS Auto-Filing'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      await axios.post(`${API_URL}/acars/end`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setIsTracking(false)
      setOfp(null)
      setPhase('PRE-FLIGHT')
      alert('PIREP FILED SUCCESSFULLY. MISSION COMPLETE.')
    } catch (err) {
      console.error(err)
      alert('Critical: PIREP filing failed. Check connection.')
    } finally {
      setLoading(false)
    }
  }

  if (!ofp) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-10 max-w-2xl mx-auto p-10">
        <div className="bg-neutral-900/40 border border-neutral-800/50 rounded-[3rem] p-16 text-center space-y-8 shadow-2xl backdrop-blur-3xl w-full">
          <div className="w-28 h-28 bg-gradient-to-br from-kf-red/20 to-kf-red/5 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-kf-red/20 shadow-2xl shadow-kf-red/10 rotate-3">
            <Import className="w-12 h-12 text-kf-red" />
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Initialize Dispatch</h3>
            <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest leading-relaxed">
              Import your SimBrief flight plan or go to Tasks to select a booked mission.
            </p>
          </div>
          <div className="flex space-x-3 bg-kf-black/80 p-3 rounded-2xl border border-neutral-800/50 shadow-inner">
            <input
              type="text"
              placeholder="SIMBRIEF USERNAME"
              value={sbUsername}
              onChange={(e) => setSbUsername(e.target.value)}
              className="flex-1 bg-transparent px-5 py-3 outline-none text-sm font-black tracking-widest uppercase placeholder:text-neutral-700"
            />
            <button
              onClick={() => fetchSimBrief(sbUsername)}
              disabled={loading || !sbUsername}
              className="bg-kf-red hover:bg-kf-red-dark text-white text-[10px] font-black uppercase italic px-10 py-4 rounded-xl transition-all shadow-xl shadow-kf-red/20 disabled:opacity-50 tracking-[0.2em]"
            >
              {loading ? 'SYNCING...' : 'CONNECT'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 bg-gradient-to-br from-neutral-900 to-kf-black border border-neutral-800/50 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-kf-red/5 rounded-full -mr-48 -mt-48 blur-[120px]" />
          <div className="flex justify-between items-end mb-12 relative z-10">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-kf-red uppercase tracking-[0.4em]">Flight Profile</span>
              <h3 className="text-6xl font-black italic tracking-tighter leading-none">
                {ofp.origin.icao_code} <span className="text-2xl not-italic text-neutral-700 mx-4">→</span> {ofp.destination.icao_code}
              </h3>
            </div>
            <div className="text-right space-y-1">
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.4em]">Status</span>
              <div className="flex items-center space-x-3 justify-end">
                <span className="text-2xl font-black italic tracking-tighter text-kf-red uppercase">{phase}</span>
                <div className="w-2 h-10 bg-kf-red/20 rounded-full overflow-hidden">
                  <div className="w-full bg-kf-red transition-all duration-1000" style={{ height: isTracking ? '100%' : '20%' }} />
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-8 relative z-10">
            <Detail label="ALTITUDE" value={flightData?.alt ? Math.round(flightData.alt).toLocaleString() : '0'} unit="FT" />
            <Detail label="GROUND SPEED" value={flightData?.gs ? Math.round(flightData.gs).toString() : '0'} unit="KTS" />
            <Detail label="HEADING" value={flightData?.heading ? Math.round(flightData.heading).toString().padStart(3, '0') : '000'} unit="°" />
            <Detail label="SQUAWK" value={flightData?.squawk || '2000'} unit="XPDR" />
          </div>
        </div>

        <div className="col-span-4 grid grid-rows-2 gap-6">
          <div className="bg-neutral-900/40 border border-neutral-800/50 rounded-[2rem] p-6 flex flex-col justify-center shadow-xl backdrop-blur-xl">
             <span className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-4">Vertical Telemetry</span>
             <div className="flex items-end space-x-4">
                <span className={cn(
                  "text-5xl font-mono font-black italic tracking-tighter leading-none",
                  (flightData?.vs || 0) > 100 ? 'text-green-500' : (flightData?.vs || 0) < -100 ? 'text-kf-red' : 'text-white'
                )}>
                  {Math.round(flightData?.vs || 0)}
                </span>
                <span className="text-xs font-black text-neutral-600 uppercase mb-1">FPM</span>
             </div>
          </div>
          <div className="bg-neutral-900/40 border border-neutral-800/50 rounded-[2rem] p-6 flex flex-col justify-center shadow-xl backdrop-blur-xl">
             <span className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-4">Fuel Status</span>
             <div className="flex items-end space-x-4">
                <span className="text-5xl font-mono font-black italic tracking-tighter leading-none text-white">
                  {Math.round(flightData?.fuel || 0).toLocaleString()}
                </span>
                <span className="text-xs font-black text-neutral-600 uppercase mb-1">GAL</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden min-h-0">
        <div className="col-span-3 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
           <TelemetryBox label="IAS" value={flightData?.ias ? Math.round(flightData.ias) : 0} unit="KTS" />
           <TelemetryBox label="MACH" value={flightData?.mach?.toFixed(3) || '0.000'} unit="M" />
           <TelemetryBox label="PITCH" value={flightData?.pitch?.toFixed(1) || '0.0'} unit="°" color={(v) => Number(v) > 15 ? 'text-kf-red' : 'text-white'} />
           <TelemetryBox label="BANK" value={flightData?.bank?.toFixed(1) || '0.0'} unit="°" color={(v) => Math.abs(Number(v)) > 30 ? 'text-kf-red' : 'text-white'} />
           <div className="bg-neutral-900/40 border border-neutral-800/50 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center space-x-2 mb-4">
                <List className="w-4 h-4 text-kf-red" />
                <span className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.3em]">Flight Log</span>
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                {flightLog.map((log, i) => (
                  <div key={i} className="text-[10px] flex space-x-2 border-l border-neutral-800 pl-3 py-1">
                    <span className="text-neutral-500 font-mono">{log.time}</span>
                    <span className="text-neutral-300 font-bold uppercase">{log.event}</span>
                  </div>
                ))}
              </div>
           </div>
        </div>

        <div className="col-span-9 bg-neutral-900/20 border border-neutral-800/30 rounded-[2.5rem] p-10 flex flex-col shadow-inner relative overflow-hidden">
          <div className="flex-1 flex flex-col items-center justify-center space-y-12">
            {!isTracking ? (
              <div className="text-center space-y-10">
                <div className="space-y-4">
                  <h4 className="text-4xl font-black italic uppercase tracking-tighter">Mission Ready</h4>
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-[0.3em] max-w-md mx-auto">
                    All telemetry systems are online. Ensure your simulator is running and click below to begin recording.
                  </p>
                </div>
                <button 
                  onClick={handleStartTracking}
                  className="group relative px-20 py-8 bg-kf-red hover:bg-kf-red-dark text-white rounded-3xl transition-all transform hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(214,28,34,0.3)]"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                  <span className="relative text-xl font-black italic uppercase tracking-[0.2em]">Engage Flight</span>
                </button>
              </div>
            ) : (
              <div className="w-full space-y-12">
                <div className="grid grid-cols-3 gap-10">
                  <div className="text-center">
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block mb-4">Departure Time</span>
                    <span className="text-3xl font-mono font-black italic">{takeoffTime ? new Date(takeoffTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : '--:--:--'}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block mb-4">Landing Rate</span>
                    <span className="text-3xl font-mono font-black italic text-kf-red">{maxLandingRate ? `-${Math.round(maxLandingRate)}` : '---'} <span className="text-xs">FPM</span></span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block mb-4">Total Fuel Burn</span>
                    <span className="text-3xl font-mono font-black italic">{Math.max(0, Math.round(fuelAtStart - (flightData?.fuel || 0))).toLocaleString()} <span className="text-xs text-neutral-600 uppercase">GAL</span></span>
                  </div>
                </div>
                <div className="h-[1px] bg-neutral-800/50" />
                <div className="flex justify-center space-x-6">
                  <button 
                    onClick={handleEndFlight}
                    className="flex-1 max-w-md py-6 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/50 text-white rounded-2xl font-black italic uppercase tracking-widest transition-all shadow-xl"
                  >
                    Cease Mission & File PIREP
                  </button>
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={() => setOfp(null)}
            className="absolute bottom-6 right-10 text-[9px] font-black text-neutral-700 hover:text-kf-red uppercase tracking-[0.3em] transition-colors"
          >
            Reset Systems & Purge OFP
          </button>
        </div>
      </div>
    </div>
  )
}

function SettingsView() {
  return (
    <div className="p-8 space-y-10 max-w-4xl mx-auto h-full overflow-y-auto custom-scrollbar">
      <div className="space-y-2">
        <h3 className="text-4xl font-black italic uppercase tracking-tighter">System Data</h3>
        <p className="text-neutral-500 text-xs font-bold uppercase tracking-[0.3em]">Hardware & software synchronization parameters</p>
      </div>
      <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-[2.5rem] divide-y divide-neutral-800/50 overflow-hidden shadow-2xl">
        <SettingsRow label="Automatic PIREP Submission" description="Files your flight immediately upon engine shutdown at destination." enabled={true} />
        <SettingsRow label="High-Frequency Telemetry" description="Samples simulator data every 500ms for smoother tracking." enabled={true} />
        <SettingsRow label="Discord Rich Presence" description="Broadcast your current flight status to the Kingfisher Discord." enabled={true} />
        <div className="p-8 bg-kf-red/5 flex items-center justify-between">
           <div>
              <h4 className="font-black italic uppercase text-lg tracking-tighter text-kf-red">Operational Mode</h4>
              <p className="text-xs text-neutral-500 font-medium mt-1">System is currently operating in PRODUCTION environment.</p>
           </div>
           <div className="px-4 py-2 bg-kf-red/10 border border-kf-red/20 rounded-xl text-kf-red text-[10px] font-black uppercase tracking-widest">
              Live Link
           </div>
        </div>
      </div>
    </div>
  )
}

function SettingsRow({ label, description, enabled }: { label: string, description: string, enabled: boolean }) {
  return (
    <div className="p-8 flex items-center justify-between group hover:bg-neutral-800/20 transition-all">
      <div className="space-y-1">
        <h4 className="font-black italic uppercase tracking-tight text-neutral-200">{label}</h4>
        <p className="text-xs text-neutral-500 font-medium">{description}</p>
      </div>
      <div className={cn(
        "w-14 h-7 rounded-full relative p-1 transition-all cursor-pointer shadow-inner",
        enabled ? "bg-kf-red" : "bg-neutral-800"
      )}>
        <div className={cn(
          "w-5 h-5 bg-white rounded-full shadow-lg transition-all transform",
          enabled ? "translate-x-7" : "translate-x-0"
        )} />
      </div>
    </div>
  )
}

function Detail({ label, value, unit }: { label: string, value: string, unit: string }) {
  return (
    <div className="space-y-1">
      <span className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.3em] block">{label}</span>
      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-mono font-black italic tracking-tighter leading-none">{value}</span>
        <span className="text-[10px] font-black text-neutral-600 uppercase">{unit}</span>
      </div>
    </div>
  )
}

function TelemetryBox({ label, value, unit, color }: { label: string, value: any, unit: string, color?: (v: any) => string }) {
  return (
    <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-2xl p-5 hover:border-kf-red/30 transition-all shadow-lg group">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.3em]">{label}</span>
        <div className="w-1.5 h-1.5 rounded-full bg-neutral-800 group-hover:bg-kf-red shadow-inner transition-colors" />
      </div>
      <div className="flex items-baseline space-x-3">
        <span className={cn("text-2xl font-mono font-black italic leading-none", color ? color(value) : "text-white")}>
          {value}
        </span>
        <span className="text-[10px] font-black text-neutral-600 uppercase">{unit}</span>
      </div>
    </div>
  )
}

function MapView({ flightData, history, ofp }: { flightData: FlightData | null, history: [number, number][], ofp: OFP | null }) {
  const RecenterMap = ({ position }: { position: [number, number] }) => {
    const map = useMap()
    useEffect(() => {
      if (position[0] !== 0 && position[0] !== 20.5937) {
        map.setView(position, map.getZoom())
      }
    }, [position, map])
    return null
  }
  
  const pos: [number, number] = flightData && flightData.lat !== 0 ? [flightData.lat, flightData.lng] : [20.5937, 78.9629]
  
  return (
    <div className="flex-1 w-full bg-neutral-950 overflow-hidden relative shadow-2xl min-h-0">
      <MapContainer center={pos} zoom={5} style={{ height: '100%', width: '100%', minHeight: '400px' }} zoomControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; OSM' />
        {flightData && flightData.lat !== 0 && (
          <>
            <Marker position={pos} icon={planeIcon} />
            <Polyline positions={history} color="#D61C22" weight={3} opacity={0.8} />
            <RecenterMap position={pos} />
          </>
        )}
      </MapContainer>
      <div className="absolute top-8 left-8 z-[1000] space-y-4 pointer-events-none">
        <div className="bg-kf-black/80 backdrop-blur-2xl p-6 rounded-3xl border border-neutral-800/50 shadow-2xl pointer-events-auto">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-kf-red/10 rounded-xl flex items-center justify-center border border-kf-red/20 shadow-lg shadow-kf-red/5">
                <Navigation className="w-5 h-5 text-kf-red" />
              </div>
              <div>
                <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block mb-0.5">Live Telemetry</span>
                <span className="text-xl font-black italic tracking-tighter uppercase leading-none">{ofp ? `${ofp.general.icao_airline}${ofp.general.flight_number}` : 'No Active Mission'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-10 gap-y-4">
               <div>
                  <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block">Latitude</span>
                  <span className="text-sm font-mono font-bold">{flightData?.lat.toFixed(6) || '0.000000'}</span>
               </div>
               <div>
                  <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block">Longitude</span>
                  <span className="text-sm font-mono font-bold">{flightData?.lng.toFixed(6) || '0.000000'}</span>
               </div>
               <div>
                  <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block">Ground Speed</span>
                  <span className="text-sm font-mono font-bold">{Math.round(flightData?.gs || 0)} <span className="text-[10px] text-neutral-700">KTS</span></span>
               </div>
               <div>
                  <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block">Altitude</span>
                  <span className="text-sm font-mono font-bold">{Math.round(flightData?.alt || 0).toLocaleString()} <span className="text-[10px] text-neutral-700">FT</span></span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BookingsView({ token, onSelect }: { token: string | null, onSelect: (u: string) => void }) {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    axios.get(`${API_URL}/bookings/my`, { headers: { Authorization: `Bearer ${token}` } }).then(res => {
      const upcoming = res.data.filter((b: any) => b.status === 'UPCOMING')
      setBookings(upcoming)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [token])

  const handleDispatch = (b: any) => {
    const dep = b.route.depIcao
    const arr = b.route.arrIcao
    const type = b.aircraft.icaocode || 'A320'
    const reg = b.aircraft.registration
    const flt = b.route.flightNumber.replace(/\D/g, '')
    const url = `https://www.simbrief.com/system/dispatch.php?type=generate&orig=${dep}&dest=${arr}&fltnum=${flt}&type=${type}&reg=${reg}&airline=KFR&auto=1`
    window.open(url, '_blank')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-10">
      <div className="flex items-center justify-between border-b border-neutral-800/50 pb-8">
        <div className="space-y-2">
          <h3 className="text-4xl font-black italic uppercase tracking-tighter">Mission Assignments</h3>
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-[0.3em]">Pending operational tasks requiring dispatch</p>
        </div>
        <button onClick={() => window.location.reload()} className="p-4 bg-neutral-900/50 hover:bg-kf-red/10 border border-neutral-800 rounded-2xl transition-all group">
          <Activity className="w-6 h-6 text-neutral-700 group-hover:text-kf-red transition-colors" />
        </button>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 gap-6 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-neutral-900/40 rounded-[2rem]" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-neutral-900/50 rounded-[3rem] bg-neutral-900/10">
          <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-10 h-10 text-neutral-800" />
          </div>
          <p className="text-neutral-500 font-black italic uppercase tracking-[0.3em] text-sm">No operational assignments booked</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map(b => (
            <div key={b.id} className="group bg-neutral-900/30 border border-neutral-800/50 p-8 rounded-[2.5rem] flex items-center justify-between hover:border-kf-red/50 hover:bg-kf-red/5 transition-all shadow-xl">
              <div className="flex items-center space-x-10">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <h4 className="text-4xl font-black italic tracking-tighter leading-none">{b.route.depIcao}</h4>
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-2">{b.route.depName.split(' ')[0]}</p>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                     <Navigation className="w-5 h-5 text-neutral-700 rotate-90 group-hover:text-kf-red transition-colors" />
                     <div className="w-12 h-[1px] bg-neutral-800 group-hover:bg-kf-red/30" />
                  </div>
                  <div className="text-center">
                    <h4 className="text-4xl font-black italic tracking-tighter leading-none">{b.route.arrIcao}</h4>
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-2">{b.route.arrName.split(' ')[0]}</p>
                  </div>
                </div>
                <div className="h-12 w-[1px] bg-neutral-800" />
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-kf-red uppercase tracking-widest block">{b.route.flightNumber}</span>
                  <p className="text-lg font-black italic tracking-tighter text-neutral-300 uppercase leading-none">{b.aircraft.name}</p>
                  <p className="text-[10px] font-bold text-neutral-600 tracking-widest">{b.aircraft.registration}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => handleDispatch(b)}
                  title="Dispatch in SimBrief"
                  className="bg-neutral-900 hover:bg-neutral-800 text-white p-5 rounded-2xl transition-all shadow-xl shadow-black/50 border border-neutral-800"
                >
                  <ExternalLink className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => {
                    const userSb = prompt('Confirm SimBrief Username to link this mission:', localStorage.getItem('kf_sb_user') || '')
                    if (userSb) onSelect(userSb)
                  }}
                  title="Link and Start"
                  className="bg-kf-red text-white p-5 rounded-2xl transition-all shadow-xl shadow-kf-red/20 transform group-hover:scale-105"
                >
                  <ShieldCheck className="w-6 h-6" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
