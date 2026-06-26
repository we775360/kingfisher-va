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
  const { ofp, phase, isTracking, startPositionUpdates } = useFlightStore()
  const { simConnected, simType, isDemo } = useSimulator()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [authChecked, setAuthChecked] = useState(false)
  const posCleanup = useRef<(() => void) | null>(null)

  useEffect(() => {
    checkAuth().finally(() => setAuthChecked(true))
  }, [])

  useEffect(() => {
    if (isTracking) {
      posCleanup.current = startPositionUpdates()
    }
    return () => {
      if (posCleanup.current) {
        posCleanup.current()
        posCleanup.current = null
      }
    }
  }, [isTracking])

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <div className="animate-pulse text-kf-red text-sm font-black italic tracking-tighter">LOADING</div>
      </div>
    )
  }

  if (!isAuthenticated) return <LoginScreen />

  const phaseIdx = PHASES.indexOf(phase as typeof PHASES[number])

  const simLabel = !simConnected
    ? 'DISCONNECTED'
    : isDemo
      ? 'SIMULATION'
      : simType

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-5 h-12 border-b border-neutral-800/20 bg-[#0d0d0d] shrink-0">
          <div className="flex items-center gap-4">
            {ofp && (
              <div className="flex items-center gap-3 text-xs font-bold text-neutral-400">
                <span className="text-sm font-black italic text-white">{ofp.general.icao_airline}{ofp.general.flight_number}</span>
                <span className="text-neutral-600">|</span>
                <span>{ofp.origin.icao_code}</span>
                <span className="text-neutral-700">&rarr;</span>
                <span>{ofp.destination.icao_code}</span>
                <span className="text-neutral-600">|</span>
                <span className="text-neutral-500">{ofp.aircraft.icaocode}</span>
              </div>
            )}
            {isTracking && (
              <div className="flex items-center gap-1.5 ml-2">
                {PHASES.map((p, i) => (
                  <div key={p} className="flex items-center">
                    <div className={cn(
                      'w-1.5 h-1.5 rounded-full transition-all duration-500',
                      i < phaseIdx ? 'bg-kf-red/40' : i === phaseIdx ? 'bg-kf-red shadow-[0_0_6px_rgba(192,18,30,0.5)]' : 'bg-neutral-800'
                    )} />
                    {i < PHASES.length - 1 && (
                      <div className={cn('w-2 h-px transition-all', i < phaseIdx ? 'bg-kf-red/30' : 'bg-neutral-800')} />
                    )}
                  </div>
                ))}
                <span className="text-[9px] font-bold text-kf-red uppercase tracking-wider ml-1.5">{phase}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider',
              simConnected
                ? 'bg-green-500/8 text-green-500 border border-green-500/15'
                : 'bg-red-500/8 text-red-500 border border-red-500/15'
            )}>
              <div className={cn('w-1.5 h-1.5 rounded-full', simConnected ? 'bg-green-500' : 'bg-red-500')} />
              {simLabel}
            </div>
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-neutral-500">{user.pilot?.pilotId}</span>
                <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700/50 flex items-center justify-center">
                  <span className="text-[10px] font-black text-kf-red italic">
                    {user.pilot?.firstName?.[0]}{user.pilot?.lastName?.[0]}
                  </span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className={cn('flex-1 min-h-0', activeTab !== 'map' && 'p-5 overflow-y-auto')}>
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'bookings' && <BookingsView />}
          {activeTab === 'efb' && <EFBPanel />}
          {activeTab === 'map' && <MapViewComponent />}
          {activeTab === 'audio' && <AudioEnginePanel />}
          {activeTab === 'settings' && <SettingsView />}
        </main>

        {/* Footer */}
        <footer className="h-6 border-t border-neutral-800/20 px-5 flex items-center justify-between text-[7px] font-bold text-neutral-700 uppercase tracking-[0.15em] bg-[#0d0d0d] shrink-0">
          <span>KFR ACARS</span>
          {useFlightStore.getState().flightData && (
            <span>
              {useFlightStore.getState().flightData!.lat.toFixed(4)}, {useFlightStore.getState().flightData!.lng.toFixed(4)}
            </span>
          )}
        </footer>
      </div>
    </div>
  )
}

export default App
