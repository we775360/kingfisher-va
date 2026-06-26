import { useState, useEffect, useRef } from 'react'
import { cn } from './lib/utils'
import { useAuthStore } from './stores/authStore'
import { useFlightStore } from './stores/flightStore'
import { useSimulator } from './hooks/useSimulator'
import { LoginScreen } from './components/LoginScreen'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { BookingsView } from './components/BookingsView'
import { MapViewComponent } from './components/MapView'
import { EFBPanel } from './components/EFBPanel'
import { SettingsView } from './components/Settings'
import { AudioEnginePanel } from './components/AudioEngine'

const PHASES = ['PRE-FLIGHT', 'TAXI', 'TAKEOFF', 'CLIMB', 'CRUISE', 'DESCENT', 'APPROACH', 'LANDED', 'TAXI-IN'] as const

function App() {
  const { isAuthenticated, user, logout, checkAuth } = useAuthStore()
  const { ofp, flightData, isTracking, phase, addLog, startPositionUpdates } = useFlightStore()
  const { simConnected, simType, isDemo } = useSimulator()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [authChecked, setAuthChecked] = useState(false)
  const posUpdateCleanup = useRef<(() => void) | null>(null)

  useEffect(() => {
    checkAuth().finally(() => setAuthChecked(true))
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    const unsubs: (() => void)[] = []
    if (window.electronAPI?.onSimStatus) {
      unsubs.push(window.electronAPI.onSimStatus((status) => {
        addLog(`SIM: ${status.type} ${status.connected ? 'CONNECTED' : 'DISCONNECTED'}`)
      }))
    }
    return () => unsubs.forEach((fn) => fn())
  }, [isAuthenticated])

  useEffect(() => {
    if (isTracking) {
      posUpdateCleanup.current = startPositionUpdates()
    }
    return () => {
      if (posUpdateCleanup.current) {
        posUpdateCleanup.current()
        posUpdateCleanup.current = null
      }
    }
  }, [isTracking])

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <div className="animate-pulse text-kf-red text-lg font-black italic tracking-tighter">INITIALIZING...</div>
      </div>
    )
  }

  if (!isAuthenticated) return <LoginScreen />

  const phaseIndex = PHASES.indexOf(phase as typeof PHASES[number])

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[60px] border-b border-neutral-800/30 flex items-center justify-between px-6 bg-[#0d0d0d] shrink-0">
          <div className="flex items-center gap-6">
            {ofp && (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black italic tracking-tight text-white/90">
                    {ofp.general.icao_airline}{ofp.general.flight_number}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-600 px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800">
                    {ofp.aircraft.icaocode}
                  </span>
                </div>
                <div className="w-px h-6 bg-neutral-800" />
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-400">
                  <span>{ofp.origin.icao_code}</span>
                  <span className="text-neutral-700">→</span>
                  <span>{ofp.destination.icao_code}</span>
                </div>
              </>
            )}

            {isTracking && (
              <>
                <div className="w-px h-6 bg-neutral-800" />
                <div className="flex items-center gap-1">
                  {PHASES.map((p, i) => (
                    <div key={p} className="flex items-center">
                      <div className={cn(
                        'w-[6px] h-[6px] rounded-full transition-all duration-500',
                        i < phaseIndex ? 'bg-kf-red/50' : i === phaseIndex ? 'bg-kf-red shadow-[0_0_8px_rgba(192,18,30,0.6)]' : 'bg-neutral-800'
                      )} />
                      {i < PHASES.length - 1 && (
                        <div className={cn(
                          'w-3 h-px transition-all duration-500',
                          i < phaseIndex ? 'bg-kf-red/30' : 'bg-neutral-800'
                        )} />
                      )}
                    </div>
                  ))}
                  <span className="text-[9px] font-bold text-kf-red uppercase tracking-wider ml-2">{phase}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider",
              simConnected ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
            )}>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                simConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              )} />
              {simConnected ? (isDemo ? 'SIMULATION' : simType) : 'NO SIM'}
            </div>

            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-bold italic tracking-tight leading-none">{user.pilot?.firstName}</div>
                  <div className="text-[9px] font-bold text-kf-red tracking-wider">{user.pilot?.pilotId}</div>
                </div>
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700/50 flex items-center justify-center">
                  <span className="text-sm font-black text-kf-red italic">
                    {user.pilot?.firstName?.[0]}{user.pilot?.lastName?.[0]}
                  </span>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className={cn(
          "flex-1 min-h-0",
          activeTab !== 'map' && 'p-6 overflow-y-auto'
        )}>
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'bookings' && <BookingsView />}
          {activeTab === 'efb' && <EFBPanel />}
          {activeTab === 'map' && <MapViewComponent />}
          {activeTab === 'audio' && <AudioEnginePanel />}
          {activeTab === 'settings' && <SettingsView />}
        </main>

        <footer className="h-7 border-t border-neutral-800/30 px-6 flex items-center justify-between text-[8px] font-bold text-neutral-700 uppercase tracking-[0.2em] bg-[#0d0d0d] shrink-0">
          <span>KFR ACARS v2</span>
          <div className="flex items-center gap-4">
            {flightData && (
              <>
                <span>{flightData.lat.toFixed(4)}, {flightData.lng.toFixed(4)}</span>
                <span>{Math.round(flightData.alt).toLocaleString()} ft</span>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
