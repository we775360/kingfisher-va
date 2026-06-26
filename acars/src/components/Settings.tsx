import { useSettingsStore } from '../stores/settingsStore'
import { useFlightStore } from '../stores/flightStore'
import { cn } from '../lib/utils'

export function SettingsView() {
  const { autoAnnouncements, ambientSounds, volume, toggleAutoAnnouncements, toggleAmbientSounds, setVolume } = useSettingsStore()
  const { sbUsername, setSbUsername } = useFlightStore()

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-black italic uppercase tracking-tight">Configuration</h2>
        <p className="text-xs text-neutral-500 font-bold tracking-wider mt-1">System & audio settings</p>
      </div>

      <div className="glass rounded-2xl divide-y divide-neutral-800/50 overflow-hidden">
        <SettingsRow label="SimBrief" desc="Your SimBrief account for flight plan import.">
          <input type="text" value={sbUsername} onChange={(e) => setSbUsername(e.target.value)}
            placeholder="username"
            className="bg-neutral-800/80 px-4 py-2 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-kf-red/50 w-40 text-right"
          />
        </SettingsRow>

        <SettingsRow label="Auto Announcements" desc="Phase-based passenger announcements.">
          <Toggle checked={autoAnnouncements} onChange={toggleAutoAnnouncements} />
        </SettingsRow>

        <SettingsRow label="Ambient Sounds" desc="Cabin ambiance and engine noise.">
          <Toggle checked={ambientSounds} onChange={toggleAmbientSounds} />
        </SettingsRow>

        <SettingsRow label="Volume" desc="Audio output level.">
          <div className="flex items-center gap-3 min-w-[140px]">
            <input type="range" min="0" max="1" step="0.05" value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 accent-kf-red h-1"
            />
            <span className="text-xs font-bold text-neutral-400 w-10 tabular-nums">{Math.round(volume * 100)}%</span>
          </div>
        </SettingsRow>
      </div>

      <div className="glass rounded-2xl p-6 flex items-center justify-between">
        <div>
          <div className="text-sm font-bold italic text-kf-red">Operational Mode</div>
          <p className="text-xs text-neutral-500 mt-1">Production environment</p>
        </div>
        <div className="px-3 py-1.5 glass-red rounded-lg text-[10px] font-black uppercase tracking-wider text-kf-red">
          Live Link
        </div>
      </div>

      <p className="text-[10px] text-neutral-700 text-center font-bold tracking-wider">
        KFR ACARS v2.0.0
      </p>
    </div>
  )
}

function SettingsRow({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
      <div className="space-y-0.5">
        <div className="text-sm font-bold">{label}</div>
        <p className="text-[10px] text-neutral-500 font-medium">{desc}</p>
      </div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className={cn("w-12 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer", checked ? 'bg-kf-red' : 'bg-neutral-700')}
    >
      <div className={cn("w-5 h-5 bg-white rounded-full shadow transition-transform", checked ? 'translate-x-6' : 'translate-x-0')} />
    </button>
  )
}
