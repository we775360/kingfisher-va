import { useEffect, useRef } from 'react'
import { Volume2, VolumeX, Speaker } from 'lucide-react'
import { useSettingsStore } from '../stores/settingsStore'
import { useFlightStore, FlightPhase } from '../stores/flightStore'
import { cn } from '../lib/utils'

const PHASE_DESC: Record<FlightPhase, string> = {
  'PRE-FLIGHT': 'Pre-flight checks',
  'BOARDING': 'Passengers boarding',
  'PUSHBACK': 'Pushback from gate',
  'TAXI': 'Taxiing to runway',
  'TAKEOFF': 'Takeoff roll',
  'INITIAL CLIMB': 'Initial climb',
  'CLIMB': 'Climbing',
  'CRUISE': 'At cruise altitude',
  'DESCENT': 'Descending',
  'APPROACH': 'On approach',
  'FINAL': 'Final approach',
  'LANDED': 'Landed',
  'TAXI-IN': 'Taxiing to gate',
  'ARRIVED': 'Flight complete',
}

const ANNOUNCEMENTS: Partial<Record<FlightPhase, string>> = {
  'BOARDING': 'boarding',
  'PUSHBACK': 'pushback',
  'TAKEOFF': 'takeoff',
  'CLIMB': 'climb_10000ft',
  'CRUISE': 'cruise',
  'DESCENT': 'descent',
  'APPROACH': 'approach',
  'LANDED': 'landing',
  'TAXI-IN': 'taxi_in',
}

export function AudioEnginePanel() {
  const { volume, autoAnnouncements } = useSettingsStore()
  const { phase, isTracking } = useFlightStore()
  const lastRef = useRef<FlightPhase | null>(null)

  useEffect(() => {
    if (!autoAnnouncements || !isTracking) return
    if (lastRef.current === phase) return
    const file = ANNOUNCEMENTS[phase]
    if (file) {
      const audio = new Audio(`/audio/announcements/${file}.mp3`)
      audio.volume = volume
      audio.play().catch(() => {})
    }
    lastRef.current = phase
  }, [phase, isTracking, autoAnnouncements, volume])

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-black italic uppercase tracking-tight">Audio Control</h2>
        <p className="text-xs text-neutral-500 font-bold tracking-wider mt-1">Cabin announcements & ambient sound</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", autoAnnouncements ? 'bg-kf-red/10 border border-kf-red/20' : 'bg-neutral-800/50 border border-neutral-700/50')}>
            {autoAnnouncements ? <Speaker className="w-6 h-6 text-kf-red" /> : <VolumeX className="w-6 h-6 text-neutral-600" />}
          </div>
          <div>
            <div className="text-sm font-bold italic">{autoAnnouncements ? 'Auto-Announcements Active' : 'Announcements Disabled'}</div>
            <div className="text-[10px] text-neutral-500 flex items-center gap-2 mt-1">
              <Volume2 className="w-3 h-3" />
              Volume: {Math.round(volume * 100)}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(ANNOUNCEMENTS).map(([ph]) => (
            <div key={ph} className={cn(
              "px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all",
              phase === ph
                ? 'glass-red text-kf-red'
                : 'bg-neutral-900/50 text-neutral-600'
            )}>
              {ph.replace('_', ' ')}
            </div>
          ))}
        </div>

        <div className="bg-neutral-950/50 rounded-xl p-4">
          <div className="text-[9px] font-black text-neutral-600 uppercase tracking-wider mb-2">Current Phase</div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-black italic text-kf-red">{phase}</span>
            <span className="text-xs text-neutral-500">— {PHASE_DESC[phase]}</span>
          </div>
          {!isTracking && (
            <p className="text-[10px] text-neutral-600 mt-2 italic">Awaiting flight start for auto-announcements.</p>
          )}
        </div>
      </div>
    </div>
  )
}
