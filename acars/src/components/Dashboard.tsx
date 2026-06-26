import { useState } from 'react'
import { Import, Navigation, Plane as PlaneIcon, Bug } from 'lucide-react'
import { useFlightStore } from '../stores/flightStore'
import { useSimulator } from '../hooks/useSimulator'
import { FlightTracker } from './FlightTracker'
import { PIREPModal } from './PIREPModal'

export function Dashboard() {
  const {
    ofp, flightData, isTracking, setSbUsername, sbUsername,
    handleSimBriefFetch, startFlight
  } = useFlightStore()
  const { simConnected, isDemo, autoConnect, diagnose } = useSimulator()
  const [loading, setLoading] = useState(false)
  const [showPIREP, setShowPIREP] = useState(false)
  const [pirepResult, setPirepResult] = useState<{ success: boolean; message: string } | null>(null)
  const [diag, setDiag] = useState<any>(null)

  const handleConnect = async () => {
    setLoading(true)
    setDiag(null)
    const started = await autoConnect()
    if (!started) {
      const d = await diagnose()
      setDiag(d)
    }
    setLoading(false)
  }

  const handleStart = async () => {
    setLoading(true)
    if (!simConnected) await autoConnect()
    const sim = simConnected
      ? (isDemo ? 'SIMULATION' : (flightData?.simulator || 'UNKNOWN'))
      : 'UNKNOWN'
    const ok = await startFlight(sim)
    setLoading(false)
    if (!ok) alert('Failed to start flight tracking.')
  }

  const handleEnd = () => setShowPIREP(true)

  const handleConfirmEnd = async () => {
    setPirepResult(null)
    setLoading(true)
    const ok = await useFlightStore.getState().endFlightAndSubmitPIREP()
    setLoading(false)
    setPirepResult(ok
      ? { success: true, message: 'PIREP filed.' }
      : { success: false, message: 'Failed to file PIREP.' }
    )
  }

  // No OFP loaded
  if (!ofp) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="glass rounded-3xl p-10 text-center max-w-md w-full space-y-6">
          <div className="w-16 h-16 rounded-2xl glass-red flex items-center justify-center mx-auto">
            <Import className="w-6 h-6 text-kf-red" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black italic uppercase tracking-tight">Initialize Dispatch</h2>
            <p className="text-xs text-neutral-500 font-medium">Load a mission from Tasks or import via SimBrief.</p>
          </div>
          <div className="flex gap-2 bg-neutral-900/80 p-2 rounded-xl border border-neutral-800/50">
            <input type="text" placeholder="SIMBRIEF USERNAME"
              value={sbUsername} onChange={(e) => setSbUsername(e.target.value)}
              className="flex-1 bg-transparent px-4 py-2.5 outline-none text-sm font-bold tracking-wider uppercase placeholder:text-neutral-700"
            />
            <button onClick={() => handleSimBriefFetch(sbUsername)}
              disabled={loading || !sbUsername}
              className="px-8 py-2.5 bg-kf-red hover:bg-red-700 rounded-lg text-xs font-black uppercase tracking-widest disabled:opacity-50 transition-colors"
            >
              GO
            </button>
          </div>
        </div>
      </div>
    )
  }

  // OFP loaded, sim status
  return (
    <div className="h-full flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Flight Info Card */}
      <div className="glass rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="text-center">
            <div className="text-lg font-black italic tracking-tight">{ofp.origin.icao_code}</div>
            <div className="text-[8px] font-bold text-neutral-500 tracking-wider uppercase">{ofp.origin.name?.split(' ')[0] || ''}</div>
          </div>
          <div className="flex items-center gap-2 text-neutral-700">
            <Navigation className="w-3 h-3 rotate-90" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{Math.round(useFlightStore.getState().takeoffTime ? ((Date.now() - useFlightStore.getState().takeoffTime!) / 3600000) * 100 : 0)}%</span>
            <Navigation className="w-3 h-3" />
          </div>
          <div className="text-center">
            <div className="text-lg font-black italic tracking-tight">{ofp.destination.icao_code}</div>
            <div className="text-[8px] font-bold text-neutral-500 tracking-wider uppercase">{ofp.destination.name?.split(' ')[0] || ''}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-black italic">{ofp.general.icao_airline}{ofp.general.flight_number}</div>
          <div className="text-[9px] font-bold text-neutral-500">{ofp.aircraft.icaocode}</div>
        </div>
      </div>

      {/* Sim Connected: Telemetry + Controls */}
      {simConnected ? (
        <div className="space-y-5">
          {/* Telemetry Grid */}
          <div className="grid grid-cols-4 gap-3">
            <TelemetryCard label="Altitude" value={Math.round(flightData?.alt ?? 0).toLocaleString()} unit="FT" />
            <TelemetryCard label="Ground Speed" value={Math.round(flightData?.gs ?? 0).toString()} unit="KT" />
            <TelemetryCard label="Heading" value={Math.round(flightData?.heading ?? 0).toString().padStart(3, '0')} unit="°" />
            <TelemetryCard label="Vertical Speed" value={Math.round(flightData?.vs ?? 0).toString()} unit="FPM"
              color={(flightData?.vs ?? 0) > 100 ? 'text-green-500' : (flightData?.vs ?? 0) < -100 ? 'text-kf-red' : ''}
            />
          </div>

          {/* Mini Telemetry */}
          <div className="grid grid-cols-4 gap-3">
            <MiniCard label="IAS" value={Math.round(flightData?.ias ?? 0).toString()} unit="KT" />
            <MiniCard label="MACH" value={(flightData?.mach ?? 0).toFixed(3)} unit="M" />
            <MiniCard label="FUEL" value={Math.round(flightData?.fuel ?? 0).toLocaleString()} unit={flightData?.fuelUnit || 'LBS'} />
            <MiniCard label="SQUAWK" value={flightData?.squawk || '2000'} unit="XPDR" />
          </div>

          {/* Controls */}
          <div className="glass rounded-2xl p-6 text-center">
            <FlightTracker
              isTracking={isTracking}
              loading={loading}
              flightData={flightData}
              onStart={handleStart}
              onEnd={handleEnd}
            />
          </div>
        </div>
      ) : (
        /* Sim Disconnected: Show connect option */
        <div className="glass rounded-2xl p-8 text-center space-y-4">
          <PlaneIcon className="w-8 h-8 text-neutral-700 mx-auto" />
          <div>
            <p className="text-sm font-bold tracking-wider">Simulator Not Connected</p>
            <p className="text-[10px] text-neutral-600 mt-1">Connect to a running simulator to view telemetry.</p>
          </div>
          <button onClick={handleConnect} disabled={loading}
            className="px-8 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
          >
            {loading ? 'Scanning...' : 'Connect Simulator'}
          </button>
          <p className="text-[9px] text-neutral-700">Detects MSFS, FSX, P3D, X-Plane. Falls back to simulation mode.</p>

          {diag && (
            <div className="text-left text-[10px] font-mono bg-neutral-900/80 rounded-xl p-4 space-y-1.5 border border-neutral-800">
              <div className="flex items-center gap-2 text-neutral-500 mb-2">
                <Bug className="w-3 h-3" /> Diagnostics
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-neutral-400">
                <span>Platform:</span><span className="text-white font-bold">{diag.platform}</span>
                <span>Sim Process:</span><span className={diag.simProcessesDetected?.length ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                  {diag.simProcessesDetected?.length ? diag.simProcessesDetected.join(', ') : 'None detected'}
                </span>
                <span>Best Match:</span><span className="text-white font-bold">{diag.bestSimulator}</span>
                <span>node-fsuipc:</span><span className={diag.modulesInstalled?.nodeFsuipc ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                  {diag.modulesInstalled?.nodeFsuipc ? 'Installed' : 'Not installed'}
                </span>
                <span>node-simconnect:</span><span className={diag.modulesInstalled?.nodeSimconnect ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                  {diag.modulesInstalled?.nodeSimconnect ? 'Installed' : 'Not installed'}
                </span>
              </div>
              {diag.modulesInstalled && !diag.modulesInstalled.nodeFsuipc && !diag.modulesInstalled.nodeSimconnect && (
                <div className="text-amber-500 text-[9px] mt-2 leading-relaxed">
                  Native sim modules not found. Run{' '}
                  <code className="bg-neutral-800 px-1 rounded">pnpm install --include-optional node-fsuipc node-simconnect</code>
                  {' '}on Windows, then restart ACARS.
                </div>
              )}
              {diag.platform !== 'win32' && (
                <div className="text-amber-500 text-[9px] mt-2">
                  Running on {diag.platform}. Simulator connection is only available on Windows. Use simulation mode for testing.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PIREP Modal */}
      {showPIREP && (
        <PIREPModal
          onConfirm={handleConfirmEnd}
          onCancel={() => setShowPIREP(false)}
          loading={loading}
          result={pirepResult}
          onClose={() => { setShowPIREP(false); setPirepResult(null) }}
        />
      )}
    </div>
  )
}

function TelemetryCard({ label, value, unit, color }: { label: string; value: string; unit: string; color?: string }) {
  return (
    <div className="glass rounded-2xl p-4 space-y-1 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-28 h-28 bg-kf-red/5 rounded-full -mr-10 -mt-10 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-neutral-500 block relative">{label}</span>
      <div className="flex items-baseline gap-1.5 relative">
        <span className={`text-3xl font-['JetBrains_Mono'] font-black italic leading-none tracking-tight ${color || 'text-white'}`}>
          {value}
        </span>
        <span className="text-[9px] font-bold text-neutral-600 uppercase">{unit}</span>
      </div>
    </div>
  )
}

function MiniCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="glass rounded-xl p-3 flex items-center justify-between">
      <div>
        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-neutral-600 block">{label}</span>
        <span className="text-base font-['JetBrains_Mono'] font-black italic">{value}</span>
      </div>
      <span className="text-[8px] font-bold text-neutral-700 uppercase">{unit}</span>
    </div>
  )
}
