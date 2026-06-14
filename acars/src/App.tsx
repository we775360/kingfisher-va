import { useState, useEffect, useRef } from 'react'
import { Plane, Activity, Map as MapIcon, Settings, LogOut, Import, Radio, Wifi, Briefcase, Navigation } from 'lucide-react'
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
}

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
  token: localStorage.getItem('kf_token'),
  isAuthenticated: !!localStorage.getItem('kf_token'),
  setAuth: (user, token) => {
    localStorage.setItem('kf_token', token)
    set({ user, token, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem('kf_token')
    set({ user: null, token: null, isAuthenticated: false })
  },
}))

// --- COMPONENTS ---

const API_URL = 'https://kingfisher-va-api.onrender.com/api/v1'

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

  useEffect(() => {
    if (isAuthenticated) {
      (window as any).ipcRenderer.invoke('get-sim-status').then((status: any) => {
        setSimStatus(status)
      })

      const removeStatusListener = (window as any).ipcRenderer.on('sim-status', (_event: any, status: any) => {
        setSimStatus(status)
      })

      const removeDataListener = (window as any).ipcRenderer.on('flight-data', (_event: any, data: FlightData) => {
        setFlightData(data)
        if (data.lat && data.lng) {
          setFlightHistory(prev => [...prev.slice(-1000), [data.lat, data.lng]])
        }
      })

      return () => {
        if (typeof removeStatusListener === 'function') removeStatusListener()
        if (typeof removeDataListener === 'function') removeDataListener()
      }
    }
  }, [isAuthenticated])

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
          Kingfisher Operations Control v1.0
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-kf-black text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-16 bg-sidebar border-r border-neutral-800 flex flex-col items-center py-6 space-y-8 z-30 shadow-2xl">
        <div className="p-2 bg-kf-red rounded-xl shadow-lg shadow-kf-red/40 transform hover:rotate-12 transition-transform cursor-pointer">
          <Plane className="w-6 h-6" />
        </div>
        
        <nav className="flex-1 flex flex-col space-y-6">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Activity className="w-6 h-6" />} />
          <NavItem active={activeTab === 'map'} onClick={() => setActiveTab('map')} icon={<MapIcon className="w-6 h-6" />} />
          <NavItem active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} icon={<Briefcase className="w-6 h-6" />} />
          <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings className="w-6 h-6" />} />
        </nav>

        <button 
          onClick={logout}
          className="p-3 text-neutral-600 hover:text-kf-red hover:bg-kf-red/10 rounded-xl transition-all"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-6 bg-kf-black/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center space-x-4">
            <h2 className="font-black text-sm italic uppercase tracking-widest text-neutral-500">
              {activeTab}
            </h2>
            <div className={cn(
              "flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border",
              simStatus === 'connected' ? 'bg-green-500/5 text-green-500 border-green-500/20' : 'bg-red-500/5 text-red-500 border-red-500/20'
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full", simStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500')} />
              <span>{simStatus === 'connected' ? 'Live' : 'No Signal'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-black italic tracking-tighter uppercase">{user?.pilot?.firstName} {user?.pilot?.lastName}</span>
              <span className="text-[10px] font-bold text-kf-red uppercase tracking-widest">{user?.pilot?.pilotId} | {user?.pilot?.rank}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-inner">
              <span className="text-sm font-black text-kf-red italic">
                {user?.pilot?.firstName?.[0]}{user?.pilot?.lastName?.[0]}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative">
          {activeTab === 'dashboard' && <Dashboard token={token} flightData={flightData} />}
          {activeTab === 'map' && <MapView flightData={flightData} history={flightHistory} />}
          {activeTab === 'bookings' && <BookingsView token={token} />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  )
}

function NavItem({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl transition-all duration-300 relative group",
        active ? 'bg-kf-red/10 text-kf-red' : 'text-neutral-600 hover:text-white hover:bg-neutral-800'
      )}
    >
      {icon}
      {active && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-kf-red rounded-l-full" />}
    </button>
  )
}

function MapView({ flightData, history }: { flightData: FlightData | null, history: [number, number][] }) {
  const RecenterMap = ({ position }: { position: [number, number] }) => {
    const map = useMap()
    useEffect(() => {
      if (position[0] !== 0) map.setView(position, map.getZoom())
    }, [position, map])
    return null
  }

  const pos: [number, number] = flightData ? [flightData.lat, flightData.lng] : [0, 0]

  return (
    <div className="h-full w-full bg-neutral-950">
      <MapContainer 
        center={pos[0] !== 0 ? pos : [20, 77]} 
        zoom={6} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />
        {pos[0] !== 0 && (
          <>
            {/* @ts-ignore */}
            <Marker position={pos} icon={planeIcon} />
            <Polyline positions={history} color="#D61C22" weight={2} opacity={0.6} dashArray="5, 10" />
            <RecenterMap position={pos} />
          </>
        )}
      </MapContainer>
      
      {/* Overlay Data */}
      <div className="absolute bottom-6 left-6 right-6 z-[1000] flex justify-between items-end pointer-events-none">
        <div className="bg-kf-black/80 backdrop-blur-xl p-4 rounded-2xl border border-neutral-800 shadow-2xl pointer-events-auto">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            <DataPoint label="LAT" value={flightData?.lat.toFixed(4) || '---'} />
            <DataPoint label="LNG" value={flightData?.lng.toFixed(4) || '---'} />
            <DataPoint label="ALT" value={Math.round(flightData?.alt || 0).toLocaleString()} unit="FT" />
            <DataPoint label="HDG" value={Math.round(flightData?.heading || 0).toString().padStart(3, '0')} unit="°" />
          </div>
        </div>
      </div>
    </div>
  )
}

function DataPoint({ label, value, unit }: { label: string, value: string, unit?: string }) {
  return (
    <div>
      <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block">{label}</span>
      <span className="text-sm font-mono font-bold">{value} <span className="text-[10px] text-neutral-600">{unit}</span></span>
    </div>
  )
}

function BookingsView({ token }: { token: string | null }) {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API_URL}/bookings/my`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setBookings(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [token])

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black italic uppercase tracking-tighter">My Flight Assignments</h3>
        <button onClick={() => window.location.reload()} className="p-2 bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors">
          <Activity className="w-4 h-4 text-kf-red" />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-neutral-900 rounded-2xl" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-neutral-900 rounded-3xl">
          <Briefcase className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
          <p className="text-neutral-500 font-bold italic uppercase tracking-widest text-sm">No active bookings found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {bookings.map(b => (
            <div key={b.id} className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl flex items-center justify-between hover:border-kf-red/50 transition-all group">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <h4 className="text-2xl font-black italic">{b.route.depIcao}</h4>
                  <p className="text-[10px] font-bold text-neutral-500">{b.route.depName.split(' ')[0]}</p>
                </div>
                <Navigation className="w-5 h-5 text-neutral-700 rotate-90 group-hover:text-kf-red transition-colors" />
                <div className="text-center">
                  <h4 className="text-2xl font-black italic">{b.route.arrIcao}</h4>
                  <p className="text-[10px] font-bold text-neutral-500">{b.route.arrName.split(' ')[0]}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-kf-red uppercase tracking-widest">{b.route.flightNumber}</span>
                <p className="text-sm font-bold text-neutral-300">{b.aircraft.name}</p>
                <p className="text-[10px] text-neutral-500">{b.aircraft.registration}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SettingsView() {
  return (
    <div className="p-8 space-y-6">
      <h3 className="text-xl font-black italic uppercase tracking-tighter">System Settings</h3>
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h4 className="font-bold">Auto-PIREP Submission</h4>
            <p className="text-xs text-neutral-500">Automatically submit PIREP upon parking at destination</p>
          </div>
          <div className="w-12 h-6 bg-kf-red rounded-full relative p-1 shadow-inner cursor-pointer">
            <div className="absolute right-1 w-4 h-4 bg-white rounded-full shadow" />
          </div>
        </div>
        <div className="p-6 flex items-center justify-between bg-kf-red/5">
          <div>
            <h4 className="font-bold text-kf-red">Development Mode</h4>
            <p className="text-xs text-neutral-500">Enable advanced telemetry logging</p>
          </div>
          <div className="w-12 h-6 bg-neutral-800 rounded-full relative p-1 shadow-inner cursor-pointer">
            <div className="absolute left-1 w-4 h-4 bg-neutral-500 rounded-full shadow" />
          </div>
        </div>
      </div>
    </div>
  )
}

function Dashboard({ token, flightData }: { token: string | null, flightData: FlightData | null }) {
  const [sbUsername, setSbUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [ofp, setOfp] = useState<OFP | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [phase, setPhase] = useState('PRE-FLIGHT')
  
  // Tracking Stats
  const [takeoffTime, setTakeoffTime] = useState<number | null>(null)
  const [fuelAtStart, setFuelAtStart] = useState<number>(0)
  const [maxLandingRate, setMaxLandingRate] = useState<number>(0)

  const lastUpdateRef = useRef<number>(0)
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  useEffect(() => {
    if (isTracking && flightData) {
      // Auto phase detection
      if (flightData.onGround) {
        if (flightData.gs > 40) {
          if (phaseRef.current !== 'TAKEOFF') {
            setPhase('TAKEOFF')
            if (!takeoffTime) setTakeoffTime(Date.now())
          }
        }
        else if (flightData.gs > 5) setPhase('TAXI')
        else if (phaseRef.current === 'LANDING' || phaseRef.current === 'DESCENT') setPhase('ARRIVED')
        else if (!flightData.engineOn) setPhase('PARKED')
      } else {
        if (flightData.vs > 500) setPhase('CLIMB')
        else if (flightData.vs < -500) setPhase('DESCENT')
        else if (Math.abs(flightData.vs) < 500) setPhase('CRUISE')
        
        if (flightData.alt < 2000 && flightData.vs < -200) {
          setPhase('LANDING')
          if (Math.abs(flightData.vs) > maxLandingRate) setMaxLandingRate(Math.abs(flightData.vs))
        }
      }

      // Send update to backend every 30 seconds
      if (Date.now() - lastUpdateRef.current > 30000) {
        sendUpdate(flightData)
        lastUpdateRef.current = Date.now()
      }
    }
  }, [isTracking, flightData])

  const sendUpdate = async (data: FlightData) => {
    try {
      await axios.post(`${API_URL}/acars/update`, {
        lat: data.lat,
        lng: data.lng,
        alt: data.alt,
        heading: data.heading,
        groundSpeed: data.gs,
        phase: phase
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (err) {
      console.error('Update failed:', err)
    }
  }

  const fetchSimBrief = async () => {
    if (!sbUsername) return
    setLoading(true)
    try {
      const res = await axios.get(`${API_URL}/acars/simbrief?username=${sbUsername}`)
      setOfp(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
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
        comments: 'Submitted via Kingfisher ACARS v1.0'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      await axios.post(`${API_URL}/acars/end`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setIsTracking(false)
      setOfp(null)
      setPhase('PRE-FLIGHT')
      alert('Flight Logged Successfully!')
    } catch (err) {
      console.error(err)
      alert('Failed to log PIREP. Check connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!ofp ? (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2rem] p-10 text-center space-y-6 shadow-2xl">
          <div className="w-24 h-24 bg-kf-red/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-kf-red/20 shadow-xl shadow-kf-red/5">
            <Import className="w-10 h-10 text-kf-red" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Import Flight Dispatch</h3>
            <p className="text-neutral-500 text-sm max-w-xs mx-auto font-medium">
              Link your SimBrief OFP to initialize flight systems and tracking.
            </p>
          </div>
          <div className="flex max-w-sm mx-auto space-x-2 bg-kf-black p-2 rounded-2xl border border-neutral-800 shadow-inner">
            <input
              type="text"
              placeholder="SimBrief Username"
              value={sbUsername}
              onChange={(e) => setSbUsername(e.target.value)}
              className="flex-1 bg-transparent px-4 py-2 outline-none text-sm font-bold tracking-tight"
            />
            <button
              onClick={fetchSimBrief}
              disabled={loading || !sbUsername}
              className="bg-kf-red hover:bg-kf-red-dark text-white text-xs font-black uppercase italic px-6 py-3 rounded-xl transition-all shadow-lg shadow-kf-red/20 disabled:opacity-50"
            >
              {loading ? 'Fetching...' : 'Connect'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-neutral-900 to-kf-black border border-neutral-800 rounded-[2rem] p-8 relative overflow-hidden shadow-2xl group transition-all hover:border-kf-red/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-kf-red/5 rounded-full -mr-32 -mt-32 blur-[100px] group-hover:bg-kf-red/10 transition-colors" />
            
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-kf-red/10 rounded-xl flex items-center justify-center border border-kf-red/20">
                  <Activity className="w-6 h-6 text-kf-red" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-kf-red uppercase tracking-[0.2em] block mb-0.5">Active Mission</span>
                  <h3 className="text-4xl font-black italic tracking-tighter leading-none">{ofp.general.icao_airline}{ofp.general.flight_number}</h3>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block mb-1">Equipment</span>
                <p className="font-black italic text-lg leading-none">{ofp.aircraft.icaocode}</p>
                <p className="text-[10px] font-bold text-kf-red tracking-widest mt-1 bg-kf-red/10 px-2 py-0.5 rounded inline-block">{ofp.aircraft.reg}</p>
              </div>
            </div>

            <div className="flex items-center justify-between relative z-10">
              <div className="text-center group-hover:scale-105 transition-transform">
                <h4 className="text-5xl font-black italic tracking-tighter">{ofp.origin.icao_code}</h4>
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1">{ofp.origin.iata_code}</p>
              </div>
              
              <div className="flex-1 flex flex-col items-center px-8">
                <div className="w-full h-1 bg-neutral-800/50 rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-kf-red to-transparent w-full animate-progress" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-900 p-1.5 border border-neutral-700 rounded-lg shadow-xl">
                    <Plane className={cn("w-5 h-5 text-kf-red transition-all duration-1000", isTracking ? "rotate-90" : "opacity-50")} />
                  </div>
                </div>
                <div className="mt-4 flex flex-col items-center">
                  <span className={cn(
                    "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                    isTracking ? "bg-kf-red/10 text-kf-red border-kf-red/20 shadow-lg shadow-kf-red/5" : "bg-neutral-800/50 text-neutral-500 border-neutral-700"
                  )}>
                    {isTracking ? phase : 'Systems Ready'}
                  </span>
                </div>
              </div>

              <div className="text-center group-hover:scale-105 transition-transform">
                <h4 className="text-5xl font-black italic tracking-tighter">{ofp.destination.icao_code}</h4>
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1">{ofp.destination.iata_code}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TelemetryCard label="Altitude" value={flightData?.alt} unit="FT" icon={<Navigation className="w-4 h-4" />} />
            <TelemetryCard label="Ground Speed" value={flightData?.gs} unit="KTS" icon={<Activity className="w-4 h-4" />} />
            <TelemetryCard label="Heading" value={flightData?.heading} unit="°" icon={<MapIcon className="w-4 h-4" />} suffix={(v) => v.toString().padStart(3, '0')} />
            <TelemetryCard label="Vertical Speed" value={flightData?.vs} unit="FPM" icon={<Radio className="w-4 h-4" />} 
              color={(v) => v > 100 ? 'text-green-500' : v < -100 ? 'text-kf-red' : 'text-white'} />
          </div>

          {!isTracking ? (
            <button 
              onClick={handleStartTracking}
              disabled={loading}
              className="w-full bg-kf-red hover:bg-kf-red-dark text-white font-black italic py-5 rounded-2xl transition-all transform hover:scale-[1.01] active:scale-95 shadow-2xl shadow-kf-red/30 uppercase tracking-[0.2em] text-lg disabled:opacity-50"
            >
              {loading ? 'Initializing Core...' : 'Engage Tracking'}
            </button>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-6 flex items-center justify-between shadow-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-500/10 rounded-xl">
                    <Wifi className="w-6 h-6 text-green-500 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest block">Telemetry Link</span>
                    <span className="font-black italic uppercase text-lg tracking-tighter">Recording Mode Active</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">Fuel Remaining</span>
                  <span className="font-mono font-bold text-xl">{Math.round(flightData?.fuel || 0).toLocaleString()} <span className="text-xs text-neutral-600">GAL</span></span>
                </div>
              </div>
              <button 
                onClick={handleEndFlight}
                disabled={loading}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-black italic py-4 rounded-2xl transition-all border border-neutral-800 shadow-xl uppercase tracking-widest disabled:opacity-50"
              >
                {loading ? 'Terminating Session...' : 'Cease Operations and Log'}
              </button>
            </div>
          )}
          
          <button 
            onClick={() => setOfp(null)}
            className="w-full text-neutral-700 hover:text-kf-red text-[10px] font-black uppercase tracking-[0.3em] py-2 transition-all"
          >
            Purge Current OFP Data
          </button>
        </div>
      )}
    </div>
  )
}

function TelemetryCard({ label, value, unit, icon, color, suffix }: { label: string, value?: number, unit: string, icon: React.ReactNode, color?: (v: number) => string, suffix?: (v: number) => string }) {
  const val = value !== undefined ? Math.round(value) : null
  return (
    <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 group hover:border-kf-red/50 transition-all shadow-xl">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">{label}</span>
        <div className="p-1.5 bg-neutral-800 rounded-lg group-hover:bg-kf-red/10 group-hover:text-kf-red transition-colors">
          {icon}
        </div>
      </div>
      <p className={cn(
        "text-3xl font-mono font-black italic tracking-tighter",
        color && val !== null ? color(val) : 'text-white'
      )}>
        {val !== null ? (suffix ? suffix(val) : val.toLocaleString()) : '---'}
        <span className="text-xs text-neutral-600 ml-2 font-bold uppercase not-italic">{unit}</span>
      </p>
    </div>
  )
}

export default App
