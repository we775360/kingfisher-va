import { useFlightStore } from '../stores/flightStore'

interface PIREPModalProps {
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
  result: { success: boolean; message: string } | null
  onClose: () => void
}

export function PIREPModal({ onConfirm, onCancel, loading, result, onClose }: PIREPModalProps) {
  const { ofp, flightData, fuelAtStart, maxLandingRate, takeoffTime, flightLog } = useFlightStore()

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="glass-strong rounded-3xl p-8 max-w-sm w-full mx-6 text-center space-y-5">
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto",
            result.success ? 'bg-green-500/10' : 'bg-red-500/10'
          )}>
            <span className={cn("text-3xl", result.success ? 'text-green-500' : 'text-red-500')}>
              {result.success ? '✓' : '✗'}
            </span>
          </div>
          <h3 className="text-xl font-black italic uppercase tracking-tight">
            {result.success ? 'Complete' : 'Error'}
          </h3>
          <p className="text-sm text-neutral-400">{result.message}</p>
          <button onClick={onClose}
            className="px-8 py-3 bg-kf-red rounded-xl font-bold italic uppercase tracking-wider text-sm"
          >
            OK
          </button>
        </div>
      </div>
    )
  }

  const flightTime = takeoffTime ? ((Date.now() - takeoffTime) / 3600000).toFixed(2) : '0.00'
  const fuelUsed = Math.max(0, Math.round(fuelAtStart - (flightData?.fuel || 0)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-strong rounded-3xl p-8 max-w-sm w-full mx-6 space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-black italic uppercase tracking-tight">PIREP Summary</h3>
          <p className="text-xs text-neutral-500 mt-1 font-bold tracking-wider uppercase">
            {ofp?.general?.icao_airline}{ofp?.general?.flight_number} • {ofp?.origin?.icao_code} → {ofp?.destination?.icao_code}
          </p>
        </div>

        <div className="space-y-3">
          <Row label="Flight Time" value={`${flightTime} hrs`} />
          <Row label="Fuel Used" value={`${fuelUsed.toLocaleString()} GAL`} />
          <Row label="Landing Rate" value={`${maxLandingRate ? `-${Math.round(maxLandingRate)}` : '0'} FPM`} />
          <Row label="Events Logged" value={`${flightLog.length}`} />
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-3 bg-neutral-800 rounded-xl font-bold text-sm uppercase tracking-wider disabled:opacity-50"
          >
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-3 bg-kf-red rounded-xl font-bold italic text-sm uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? '...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-neutral-800/50 text-sm">
      <span className="text-neutral-400 font-medium">{label}</span>
      <span className="font-bold font-['JetBrains_Mono']">{value}</span>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
