import { useState, useEffect, useRef } from 'react'
import { Import, Fuel, List } from 'lucide-react'
import { useFlightStore } from '../stores/flightStore'
import { useSimulator } from '../hooks/useSimulator'
import { cn } from '../lib/utils'
import { FlightTracker } from './FlightTracker'
import { PIREPModal } from './PIREPModal'

export function Dashboard() {
  const {
    ofp, flightData, isTracking, flightLog,
    setSbUsername, sbUsername, handleSimBriefFetch,
    startFlight
  } = useFlightStore()
  const { simConnected, connect } = useSimulator()
  const [loading, setLoading] = useState(false)
  const [showPIREP, setShowPIREP] = useState(false)
  const [pirepResult, setPirepResult] = useState<{ success: boolean; message: string } | null>(null)
  const lastUpdateRef = useRef(0)

  useEffect(() => {
    if (isTracking && flightData && Date.now() - lastUpdateRef.current > 10000) {
      useFlightStore.getState().sendPositionUpdate()
      lastUpdateRef.current = Date.now()
    }
  }, [isTracking, flightData])

  const handleStart = async () => {
    setLoading(true)
    const ok = await startFlight(simConnected ? useFlightStore.getState().flightData?.simulator || 'UNKNOWN' : 'UNKNOWN')
    setLoading(false)
    if (!ok) alert('Failed to start tracking.')
  }

  const handleEnd = () => setShowPIREP(true)

  const handleConfirmEnd = async () => {
    setPirepResult(null)
    setLoading(true)
    const ok = await useFlightStore.getState().endFlightAndSubmitPIREP()
    setLoading(false)
    setPirepResult(ok
      ? { success: true, message: 'PIREP filed. Mission complete.' }
      : { success: false, message: 'Failed to file PIREP.' }
    )
  }

  if (!ofp) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="glass rounded-3xl p-12 text-center max-w-lg w-full space-y-8">
          <div className="w-20 h-20 rounded-2xl glass-red flex items-center justify-center mx-auto">
            <Import className="w-8 h-8 text-kf-red" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black italic uppercase tracking-tight">Initialize Dispatch</h2>
            <p className="text-sm text-neutral-500 font-medium">Import SimBrief or select a booked mission from Tasks.</p>
          </div>
          {!simConnected && (
            <button onClick={() => connect()}
              className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-sm font-bold transition-colors"
            >
              Connect Simulator
            </button>
          )}
          <div className="flex gap-2 bg-neutral-900/80 p-2 rounded-xl border border-neutral-800/50">
            <input type="text" placeholder="SIMBRIEF USERNAME"
              value={sbUsername} onChange={(e) => setSbUsername(e.target.value)}
              className="flex-1 bg-transparent px-4 py-2.5 outline-none text-sm font-bold tracking-wider uppercase placeholder:text-neutral-700"
            />
            <button onClick={() => handleSimBriefFetch(sbUsername)}
              disabled={loading || !sbUsername}
              className="px-8 py-2.5 bg-kf-red hover:bg-red-700 rounded-lg text-xs font-black uppercase tracking-widest disabled:opacity-50 transition-colors"
            >
              {loading ? '...' : 'GO'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const alt = flightData?.alt ?? 0
  const gs = flightData?.gs ?? 0
  const hdg = flightData?.heading ?? 0
  const vs = flightData?.vs ?? 0
  const ias = flightData?.ias ?? 0
  const mach = flightData?.mach ?? 0
  const fuel = flightData?.fuel ?? 0
  const squawk = flightData?.squawk ?? '2000'
  const pitch = flightData?.pitch ?? 0
  const bank = flightData?.bank ?? 0
  const fuelFlow = flightData?.fuelFlow ?? 0

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Telemetry Grid */}
      <div className="grid grid-cols-4 gap-4">
        <TelemetryCard label="Altitude" value={alt.toLocaleString()} unit="FT" />
        <TelemetryCard label="Ground Speed" value={Math.round(gs).toString()} unit="KT" />
        <TelemetryCard label="Heading" value={Math.round(hdg).toString().padStart(3, '0')} unit="°" />
        <TelemetryCard label="Vertical Speed" value={Math.round(vs).toString()} unit="FPM"
          color={vs > 100 ? 'text-green-500' : vs < -100 ? 'text-kf-red' : ''}
        />
      </div>

      <div className="grid grid-cols-5 gap-4">
        <TelemetryMini label="IAS" value={Math.round(ias).toString()} unit="KT" />
        <TelemetryMini label="MACH" value={mach.toFixed(3)} unit="M" />
        <TelemetryMini label="PITCH" value={pitch.toFixed(1)} unit="°"
          color={Math.abs(pitch) > 15 ? 'text-red-500' : ''}
        />
        <TelemetryMini label="BANK" value={bank.toFixed(1)} unit="°"
          color={Math.abs(bank) > 30 ? 'text-red-500' : ''}
        />
        <TelemetryMini label="SQUAWK" value={squawk} unit="XPDR" />
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Fuel + Times */}
        <div className="glass rounded-2xl p-5 space-y-4 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-500">
            <Fuel className="w-4 h-4 text-kf-red" /> Fuel
          </div>
          <div className="text-3xl font-['JetBrains_Mono'] font-black italic">{Math.round(fuel).toLocaleString()}</div>
          <div className="text-[10px] font-bold text-neutral-500 uppercase">{flightData?.fuelUnit || 'GAL'}</div>
          {fuelFlow > 0 && (
            <div className="text-xs text-neutral-400">
              Burn: {fuelFlow.toFixed(1)} {flightData?.fuelUnit || 'GAL'}/hr
            </div>
          )}
          <div className="border-t border-neutral-800 pt-4 space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-neutral-500">Flight Time</span>
              <span className="font-bold">{useFlightStore.getState().takeoffTime ? ((Date.now() - useFlightStore.getState().takeoffTime!) / 3600000).toFixed(1) : '0.0'}h</span>
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-neutral-500">Fuel Used</span>
              <span className="font-bold">{Math.max(0, Math.round(useFlightStore.getState().fuelAtStart - fuel)).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Flight Log */}
        <div className="glass rounded-2xl p-5 space-y-3 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-500 sticky top-0 bg-[#0d0d0d] pb-2">
            <List className="w-4 h-4 text-kf-red" /> Log
          </div>
          {flightLog.length === 0 ? (
            <p className="text-xs text-neutral-600 italic">No events recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {flightLog.map((log, i) => (
                <div key={i} className="flex gap-2 text-[10px] border-l-2 border-neutral-800 pl-3 py-0.5">
                  <span className="text-neutral-600 font-mono shrink-0 w-14">{log.time}</span>
                  <span className="font-bold">{log.event}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="glass rounded-2xl p-5 flex flex-col justify-center items-center">
          <FlightTracker
            isTracking={isTracking}
            loading={loading}
            flightData={flightData}
            onStart={handleStart}
            onEnd={handleEnd}
          />
          <button onClick={() => useFlightStore.getState().setOFP(null)}
            className="mt-4 text-[9px] font-bold text-neutral-700 hover:text-kf-red uppercase tracking-widest transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

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
    <div className="glass rounded-2xl p-5 space-y-1 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-kf-red/5 rounded-full -mr-12 -mt-12 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="text-[9px] font-black uppercase tracking-[0.25em] text-neutral-500 block relative">{label}</span>
      <div className="flex items-baseline gap-2 relative">
        <span className={cn("text-4xl font-['JetBrains_Mono'] font-black italic leading-none tracking-tight", color || 'text-white')}>
          {value}
        </span>
        <span className="text-[10px] font-bold text-neutral-600 uppercase">{unit}</span>
      </div>
    </div>
  )
}

function TelemetryMini({ label, value, unit, color }: { label: string; value: string; unit: string; color?: string }) {
  return (
    <div className="glass rounded-xl p-3 space-y-0.5">
      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-neutral-600 block">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={cn("text-lg font-['JetBrains_Mono'] font-black italic leading-none", color || 'text-white')}>
          {value}
        </span>
        <span className="text-[8px] font-bold text-neutral-700 uppercase">{unit}</span>
      </div>
    </div>
  )
}
