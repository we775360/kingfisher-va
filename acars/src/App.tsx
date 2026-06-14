import { useState, useEffect } from 'react'
import { LogIn, Plane, Activity, Map, Settings, LogOut, ChevronRight, Import } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import axios from 'axios'
import { create } from 'zustand'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- STORE ---
interface AuthStore {
  user: any | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: any, token: string) => void
  logout: () => void
}

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

const API_URL = 'http://localhost:3000/api/v1'

function App() {
  const { isAuthenticated, logout, user, setAuth, token } = useAuthStore()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password })
      setAuth(res.data.user, res.data.token)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-screen bg-kf-black text-white p-8">
        <div className="flex-1 flex flex-col items-center justify-center">
          <img src="/logo.png" alt="Kingfisher" className="w-32 mb-8" />
          <h1 className="text-2xl font-bold mb-6">ACARS Login</h1>
          <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 focus:border-kf-red outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 focus:border-kf-red outline-none transition-colors"
                required
              />
            </div>
            {error && <p className="text-kf-red text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-kf-red hover:bg-kf-red-dark text-white font-bold py-2 rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
        <div className="text-center text-xs text-neutral-500">
          Kingfisher VA ACARS v1.0.0
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-kf-black text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-16 bg-sidebar border-r border-neutral-800 flex flex-col items-center py-6 space-y-8">
        <div className="p-2 bg-kf-red rounded-lg">
          <Plane className="w-6 h-6" />
        </div>
        
        <nav className="flex-1 flex flex-col space-y-6">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn("p-2 rounded-lg transition-colors", activeTab === 'dashboard' ? 'bg-neutral-800 text-kf-red' : 'text-neutral-500 hover:text-white')}
          >
            <Activity className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setActiveTab('map')}
            className={cn("p-2 rounded-lg transition-colors", activeTab === 'map' ? 'bg-neutral-800 text-kf-red' : 'text-neutral-500 hover:text-white')}
          >
            <Map className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn("p-2 rounded-lg transition-colors", activeTab === 'settings' ? 'bg-neutral-800 text-kf-red' : 'text-neutral-500 hover:text-white')}
          >
            <Settings className="w-6 h-6" />
          </button>
        </nav>

        <button 
          onClick={logout}
          className="p-2 text-neutral-500 hover:text-kf-red transition-colors"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Titlebar / Header */}
        <header className="h-14 border-b border-neutral-800 flex items-center justify-between px-6 bg-kf-black/50 backdrop-blur-md sticky top-0 z-10">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-neutral-400">
            {activeTab}
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold">{user?.pilot?.pilotId}</span>
              <span className="text-[10px] text-neutral-500">{user?.pilot?.rank}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
              <span className="text-xs font-bold text-kf-red">
                {user?.pilot?.firstName?.[0]}{user?.pilot?.lastName?.[0]}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'map' && <div className="text-center mt-20 text-neutral-500">Map coming soon...</div>}
          {activeTab === 'settings' && <div className="text-center mt-20 text-neutral-500">Settings coming soon...</div>}
        </main>
      </div>
    </div>
  )
}

function Dashboard() {
  const [sbUsername, setSbUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [ofp, setOfp] = useState<any>(null)

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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* SimBrief Import */}
      {!ofp ? (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-2">
            <Import className="w-8 h-8 text-kf-red" />
          </div>
          <h3 className="text-lg font-bold">Import Flight Plan</h3>
          <p className="text-neutral-400 text-sm max-w-xs mx-auto">
            Enter your SimBrief username to fetch your latest operational flight plan.
          </p>
          <div className="flex max-w-sm mx-auto space-x-2">
            <input
              type="text"
              placeholder="SimBrief Username"
              value={sbUsername}
              onChange={(e) => setSbUsername(e.target.value)}
              className="flex-1 bg-kf-black border border-neutral-800 rounded px-3 py-2 focus:border-kf-red outline-none text-sm transition-colors"
            />
            <button
              onClick={fetchSimBrief}
              disabled={loading || !sbUsername}
              className="bg-kf-red hover:bg-kf-red-dark text-white text-sm font-bold px-4 py-2 rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Fetching...' : 'Fetch'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Flight Summary Card */}
          <div className="bg-gradient-to-br from-neutral-900 to-kf-black border border-neutral-800 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-kf-red/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <span className="text-xs font-bold text-kf-red uppercase tracking-widest">Active Flight</span>
                <h3 className="text-3xl font-black italic">{ofp.general.icao_airline}{ofp.general.flight_number}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-neutral-500">Aircraft</span>
                <p className="font-bold">{ofp.aircraft.icaocode} ({ofp.aircraft.reg})</p>
              </div>
            </div>

            <div className="flex items-center justify-between relative z-10">
              <div className="text-center">
                <h4 className="text-4xl font-bold">{ofp.origin.icao_code}</h4>
                <p className="text-xs text-neutral-400">{ofp.origin.iata_code}</p>
              </div>
              
              <div className="flex-1 flex flex-col items-center px-4">
                <div className="w-full h-[2px] bg-neutral-800 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-kf-black p-1 border border-neutral-800 rounded-full">
                    <Plane className="w-4 h-4 text-kf-red rotate-90" />
                  </div>
                </div>
                <span className="text-[10px] mt-2 text-neutral-500 uppercase tracking-tighter italic">Enroute</span>
              </div>

              <div className="text-center">
                <h4 className="text-4xl font-bold">{ofp.destination.icao_code}</h4>
                <p className="text-xs text-neutral-400">{ofp.destination.iata_code}</p>
              </div>
            </div>
          </div>

          {/* Telemetry Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4">
              <span className="text-[10px] text-neutral-500 uppercase font-bold">Altitude</span>
              <p className="text-2xl font-mono font-bold">0 <span className="text-xs text-neutral-600">FT</span></p>
            </div>
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4">
              <span className="text-[10px] text-neutral-500 uppercase font-bold">Ground Speed</span>
              <p className="text-2xl font-mono font-bold">0 <span className="text-xs text-neutral-600">KTS</span></p>
            </div>
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4">
              <span className="text-[10px] text-neutral-500 uppercase font-bold">Heading</span>
              <p className="text-2xl font-mono font-bold">000°</p>
            </div>
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4">
              <span className="text-[10px] text-neutral-500 uppercase font-bold">Phase</span>
              <p className="text-lg font-bold text-kf-red italic uppercase">Pre-Flight</p>
            </div>
          </div>

          <button className="w-full bg-kf-red hover:bg-kf-red-dark text-white font-black italic py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-kf-red/20 uppercase tracking-widest">
            Start Tracking
          </button>
          
          <button 
            onClick={() => setOfp(null)}
            className="w-full text-neutral-600 hover:text-neutral-400 text-xs py-2 transition-colors"
          >
            Cancel and Import New OFP
          </button>
        </div>
      )}
    </div>
  )
}

export default App
