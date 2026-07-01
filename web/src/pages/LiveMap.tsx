import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowLeft, Activity } from 'lucide-react'
import { useThemeStore } from '../store/theme.store'
import api from '../lib/axios'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface LiveFlight {
  id: string
  flightNumber: string
  depIcao: string
  arrIcao: string
  lat: number
  lng: number
  alt: number
  heading: number
  groundSpeed: number
  phase: string
  pilot: { firstName: string; lastName: string; pilotId: string; rank: string }
}

export default function LiveMap() {
  const navigate = useNavigate()
  const { isDark } = useThemeStore()
  const [liveFlights, setLiveFlights] = useState<LiveFlight[]>([])
  const [loading, setLoading] = useState(true)
  const liveRef = useRef(liveFlights)
  liveRef.current = liveFlights

  useEffect(() => {
    api.get('/public/live-flights').then((r) => {
      if (Array.isArray(r.data)) setLiveFlights(r.data)
    }).catch(() => {}).finally(() => setLoading(false))

    const es = new EventSource(`https://kingfisher-api.onrender.com/api/v1/public/live-flights/stream`)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'position') {
          setLiveFlights((prev) => {
            const existing = prev.find((f) => f.flightNumber === data.flightNumber)
            if (existing) {
              return prev.map((f) =>
                f.flightNumber === data.flightNumber
                  ? { ...f, lat: data.lat, lng: data.lng, alt: data.alt, heading: data.heading, groundSpeed: data.groundSpeed, phase: data.phase }
                  : f
              )
            }
            return [...prev, data]
          })
        }
      } catch {}
    }

    es.onerror = () => {}

    return () => es.close()
  }, [])

  const t = {
    bg: isDark ? 'bg-[#050505]' : 'bg-slate-50',
    text: isDark ? 'text-white' : 'text-slate-900',
    border: isDark ? 'border-white/5' : 'border-slate-200',
    card: isDark ? 'bg-black/60 backdrop-blur-xl border-white/10' : 'bg-white/80 backdrop-blur-xl border-slate-200 shadow-xl'
  }

  return (
    <div className={`h-screen w-full flex flex-col ${t.bg} ${t.text} font-sans overflow-hidden`}>
      <div className="absolute top-0 left-0 right-0 z-[1000] p-3 sm:p-6 flex justify-between items-start pointer-events-none gap-3">
        <div className={`p-3 sm:p-4 rounded-2xl border ${t.card} pointer-events-auto flex items-center gap-3 sm:gap-4`}>
          <button onClick={() => navigate('/dashboard')} className="p-2.5 rounded-xl bg-[#c0121e] text-white transition-all duration-200 hover:bg-[#8b0000]">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black italic tracking-tighter uppercase leading-none truncate">Radar</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Live</span>
            </div>
          </div>
        </div>

        <div className={`p-3 sm:p-4 rounded-2xl border ${t.card} pointer-events-auto flex items-center gap-4 sm:gap-6`}>
          <div className="text-center">
            <div className="text-xl font-black italic text-[#c0121e]">{liveFlights.length}</div>
            <div className="text-[8px] font-black uppercase tracking-widest text-zinc-500 whitespace-nowrap">Airborne</div>
          </div>
          {liveFlights.length > 0 && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />}
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer center={[20, 77]} zoom={5} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {liveFlights.filter(f => f.lat && f.lng).map(f => (
            <Marker
              key={f.id || f.flightNumber}
              position={[f.lat, f.lng]}
              icon={new L.DivIcon({
                className: 'custom-plane-icon',
                html: `<div style="transform: rotate(${f.heading}deg); transition: transform 1s linear;">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#d61c22" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                  </svg>
                </div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 14]
              })}
            >
              <Tooltip permanent direction="top" offset={[0, -18]}
                className={`${isDark ? 'bg-black/90 text-white' : 'bg-white text-slate-900'} backdrop-blur-xl border border-[#c0121e]/20 rounded-xl p-3 shadow-2xl min-w-[160px]`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
                    <span className="text-xs font-black text-[#c0121e]">{f.flightNumber}</span>
                    <span className="bg-green-500/10 text-green-400 text-[7px] font-black px-2 py-0.5 rounded-full uppercase">{f.phase}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase italic">
                    <span>{f.depIcao}</span>
                    <span className="opacity-30">&rarr;</span>
                    <span>{f.arrIcao}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                    <div className="min-w-0">
                      <div className="text-[7px] font-black uppercase text-zinc-500 tracking-widest">Alt</div>
                      <div className="text-[10px] font-bold font-mono truncate">{f.alt?.toLocaleString()} ft</div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[7px] font-black uppercase text-zinc-500 tracking-widest">GS</div>
                      <div className="text-[10px] font-bold font-mono truncate">{f.groundSpeed} kt</div>
                    </div>
                  </div>
                </div>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>

        <div className="absolute bottom-3 sm:bottom-6 left-3 sm:left-6 right-3 sm:right-auto z-[1000]">
          <div className={`p-3 sm:p-4 rounded-2xl border ${t.card} max-w-full sm:max-w-xs`}>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#c0121e] mb-3 flex items-center gap-2">
              <Activity size={12} /> Flights
            </h4>
            <div className="space-y-2 max-h-[160px] sm:max-h-[200px] overflow-y-auto scrollbar-hide">
              {liveFlights.length > 0 ? liveFlights.filter(f => f.pilot).map(f => (
                <div key={f.id || f.flightNumber} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] font-black text-[#c0121e] truncate">{f.flightNumber}</div>
                    <div className="text-[8px] font-bold text-zinc-500 uppercase truncate">{f.pilot?.firstName} {f.pilot?.lastName?.[0]}.</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[8px] font-black text-zinc-500">{f.depIcao}&rarr;{f.arrIcao}</div>
                    <div className="text-[8px] font-bold text-green-500 uppercase">{f.phase}</div>
                  </div>
                </div>
              )) : (
                <p className="text-[10px] text-zinc-600 text-center py-4">
                  {loading ? 'Scanning airspace...' : 'No active flights'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-plane-icon { background: none !important; border: none !important; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
