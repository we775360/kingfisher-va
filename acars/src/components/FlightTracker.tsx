import { FlightData, useFlightStore } from '../stores/flightStore'

interface FlightTrackerProps {
  isTracking: boolean
  loading: boolean
  flightData: FlightData | null
  onStart: () => void
  onEnd: () => void
}

export function FlightTracker({ isTracking, loading, flightData, onStart, onEnd }: FlightTrackerProps) {
  const { fuelAtStart, maxLandingRate, takeoffTime } = useFlightStore()

  if (!isTracking) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-black italic uppercase tracking-tight">Standing By</h3>
        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Ready to begin flight tracking.</p>
        <button onClick={onStart} disabled={loading}
          className="px-10 py-3.5 bg-kf-red hover:bg-red-700 rounded-xl font-black italic uppercase tracking-widest text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-kf-red/20 disabled:opacity-50"
        >
          {loading ? 'Starting...' : 'Start Flight'}
        </button>
      </div>
    )
  }

  const flightHours = takeoffTime ? ((Date.now() - takeoffTime) / 3600000).toFixed(1) : '0.0'
  const fuelUsed = Math.max(0, Math.round(fuelAtStart - (flightData?.fuel || 0)))

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-6">
        <div>
          <span className="text-[8px] font-black text-neutral-500 uppercase tracking-wider block mb-1">Time</span>
          <span className="text-xl font-['JetBrains_Mono'] font-black italic">{flightHours}h</span>
        </div>
        <div>
          <span className="text-[8px] font-black text-neutral-500 uppercase tracking-wider block mb-1">Touchdown</span>
          <span className="text-xl font-['JetBrains_Mono'] font-black italic text-kf-red">
            {maxLandingRate ? `-${Math.round(maxLandingRate)}` : '---'}
          </span>
        </div>
        <div>
          <span className="text-[8px] font-black text-neutral-500 uppercase tracking-wider block mb-1">Fuel Used</span>
          <span className="text-xl font-['JetBrains_Mono'] font-black italic">{fuelUsed.toLocaleString()}</span>
        </div>
      </div>
      <button onClick={onEnd} disabled={loading}
        className="px-8 py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/50 rounded-xl font-bold italic uppercase tracking-wider text-sm transition-colors disabled:opacity-50"
      >
        {loading ? 'Filing PIREP...' : 'End Flight & File'}
      </button>
    </div>
  )
}
