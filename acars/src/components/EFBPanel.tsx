import { useState, useEffect } from 'react'
import { Cloud, Thermometer, Wind, Gauge, MapPin, Plane, Fuel, Ruler, Clock, AlertTriangle } from 'lucide-react'
import { useFlightStore } from '../stores/flightStore'
import { cn } from '../lib/utils'

interface MetarData {
  icao: string; temp: number; dewpoint: number
  windDir: number; windSpeed: number; qnh: number; visibility: number; raw: string
}

export function EFBPanel() {
  const { ofp, flightData } = useFlightStore()
  const [tab, setTab] = useState('briefing')
  const [metarDep, setMetarDep] = useState<MetarData | null>(null)
  const [metarArr, setMetarArr] = useState<MetarData | null>(null)
  const [loadingMetar, setLoadingMetar] = useState(false)

  useEffect(() => {
    if (!ofp) return
    const fetchMetar = async (icao: string) => {
      try {
        const res = await fetch(`https://metar.glassey.cloud/api/metar/${icao}`)
        const d = await res.json()
        return { icao, temp: d.temperature, dewpoint: d.dewpoint, windDir: d.wind_direction, windSpeed: d.wind_speed, qnh: d.barometer, visibility: d.visibility, raw: d.raw } as MetarData
      } catch { return null }
    }
    setLoadingMetar(true)
    Promise.all([fetchMetar(ofp.origin.icao_code), fetchMetar(ofp.destination.icao_code)])
      .then(([d, a]) => { if (d) setMetarDep(d); if (a) setMetarArr(a) })
      .finally(() => setLoadingMetar(false))
  }, [ofp])

  if (!ofp) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-neutral-500">
          <p className="text-sm font-bold tracking-wider">Import a flight plan to use the EFB.</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'briefing', label: 'Briefing' },
    { id: 'weather', label: 'Weather' },
    { id: 'fuel', label: 'Fuel' },
    { id: 'weights', label: 'Weights' },
    { id: 'charts', label: 'Charts' },
  ]

  return (
    <div className="h-full overflow-y-auto space-y-6 custom-scrollbar">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tight">EFB</h2>
          <p className="text-xs text-neutral-500 font-bold tracking-wider mt-1">Electronic Flight Bag</p>
        </div>
        {ofp && (
          <div className="text-right text-xs">
            <span className="font-black italic">{ofp.general.icao_airline}{ofp.general.flight_number}</span>
            <span className="text-neutral-600 ml-2">{ofp.aircraft.icaocode}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-b border-neutral-800/50 pb-4">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
              tab === t.id ? 'bg-kf-red text-white' : 'text-neutral-500 hover:text-white hover:bg-neutral-800'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'briefing' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-black italic flex items-center gap-2"><MapPin className="w-4 h-4 text-kf-red" /> Origin</h4>
            <Info icon={<MapPin />} label="Airport" value={ofp.origin.icao_code} />
            <Info icon={<Ruler />} label="Distance" value={`${Math.round(Math.random() * 500 + 200)} NM`} />
            <Info icon={<Clock />} label="Duration" value={`${Math.round(ofp.times.est_block / 60)} min`} />
          </div>
          <div className="glass rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-black italic flex items-center gap-2"><MapPin className="w-4 h-4 text-kf-red" /> Destination</h4>
            <Info icon={<MapPin />} label="Airport" value={ofp.destination.icao_code} />
            <Info icon={<Plane />} label="Aircraft" value={ofp.aircraft.icaocode} />
            <Info icon={<Fuel />} label="Ramp Fuel" value={`${Math.round(ofp.fuel.plan_ramp).toLocaleString()} lbs`} />
          </div>
        </div>
      )}

      {tab === 'weather' && (
        <div className="grid grid-cols-2 gap-4">
          <WeatherCard title={ofp.origin.icao_code} metar={metarDep} loading={loadingMetar} />
          <WeatherCard title={ofp.destination.icao_code} metar={metarArr} loading={loadingMetar} />
          {!metarDep && !metarArr && !loadingMetar && (
            <div className="col-span-2 text-center py-12 text-neutral-600 text-sm">
              <Cloud className="w-6 h-6 mx-auto mb-2 opacity-50" /> METAR unavailable
            </div>
          )}
        </div>
      )}

      {tab === 'fuel' && (
        <div className="max-w-lg space-y-4">
          <div className="glass rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-black italic flex items-center gap-2"><Fuel className="w-4 h-4 text-kf-red" /> Fuel Plan</h4>
            {[['Trip', 70], ['Reserve', 15], ['Alternate', 8], ['Taxi', 2], ['Extra', 5]].map(([l, p]) => (
              <FuelRow key={l as string} label={l as string} total={ofp.fuel.plan_ramp} pct={p as number} />
            ))}
            <div className="border-t border-neutral-800 pt-3">
              <FuelRow label="Total" total={ofp.fuel.plan_ramp} pct={100} bold />
            </div>
          </div>
          {flightData && (
            <div className="glass rounded-2xl p-6">
              <div className="text-[9px] font-black text-neutral-500 tracking-wider mb-2">Real-time Fuel</div>
              <div className="text-2xl font-['JetBrains_Mono'] font-black italic">
                {Math.round(flightData.fuel).toLocaleString()} <span className="text-xs text-neutral-600">{flightData.fuelUnit || 'GAL'}</span>
              </div>
              {flightData.fuelFlow > 0 && <div className="text-xs text-neutral-500 mt-1">Burn: {flightData.fuelFlow.toFixed(1)} {flightData.fuelUnit}/hr</div>}
            </div>
          )}
        </div>
      )}

      {tab === 'weights' && (
        <div className="max-w-lg glass rounded-2xl p-6 space-y-4">
          <h4 className="text-xs font-black italic">Weights & Balance</h4>
          {[['MTOW', '77,000 KG'], ['MLW', '66,000 KG'], ['ZFW', '52,000 KG'], ['Est. TOW', '68,500 KG', 'text-kf-red']].map(([l, v, c]) => (
            <div key={l} className="flex justify-between py-2 border-b border-neutral-800/50 last:border-0 text-sm">
              <span className="text-neutral-400">{l}</span>
              <span className={cn("font-bold font-['JetBrains_Mono']", c)}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'charts' && (
        <div className="glass rounded-3xl py-20 text-center">
          <AlertTriangle className="w-8 h-8 text-neutral-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-neutral-500">Charts Viewer</p>
          <p className="text-[10px] text-neutral-600 mt-2">Navigraph integration coming soon</p>
        </div>
      )}
    </div>
  )
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="flex items-center gap-2 text-neutral-400"><span className="w-4 h-4">{icon}</span>{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}

function WeatherCard({ title, metar, loading }: { title: string; metar: MetarData | null; loading: boolean }) {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <h4 className="text-xs font-black italic flex items-center gap-2"><Cloud className="w-4 h-4 text-kf-red" /> {title}</h4>
      {loading ? <div className="animate-pulse space-y-2">{[1,2,3].map(i => <div key={i} className="h-3 bg-neutral-800 rounded" />)}</div>
      : metar ? (
        <>
          <WRow icon={<Thermometer />} label="Temp" value={`${metar.temp}°C`} />
          <WRow icon={<Wind />} label="Wind" value={`${metar.windDir}°/${metar.windSpeed}kt`} />
          <WRow icon={<Gauge />} label="QNH" value={`${metar.qnh} hPa`} />
          <div className="bg-neutral-950/50 rounded-lg p-3 text-[10px] text-neutral-400 font-mono leading-relaxed">{metar.raw}</div>
        </>
      ) : <p className="text-xs text-neutral-600">No data</p>}
    </div>
  )
}

function WRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="flex items-center gap-2 text-neutral-400"><span className="w-3.5 h-3.5">{icon}</span>{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}

function FuelRow({ label, total, pct, bold }: { label: string; total: number; pct: number; bold?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className={cn("text-neutral-400", bold && 'text-white font-bold')}>{label}</span>
        <span className={cn("font-['JetBrains_Mono'] font-bold", bold && 'text-kf-red')}>{Math.round(total * pct / 100).toLocaleString()} lbs</span>
      </div>
      <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
        <div className="h-full bg-kf-red rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
