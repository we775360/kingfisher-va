import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
// @ts-ignore
import 'leaflet/dist/leaflet.css'
import { 
  ArrowLeft, Activity, Radio, Plane, 
  Navigation, Zap, Globe, Shield, Clock,
  Maximize2, Crosshair
} from 'lucide-react'
import { useThemeStore } from '../store/theme.store'

// Fix Leaflet icon
// @ts-ignore
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const planeIcon = new L.DivIcon({
  className: 'custom-plane-icon',
  html: `<div style="transform: rotate(0deg);"><img src="https://cdn-icons-png.flaticon.com/512/723/723955.png" style="width: 32px; height: 32px; filter: drop-shadow(0 0 10px rgba(192,18,30,0.5));" /></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
})

export default function LiveMap() {
  const navigate = useNavigate()
  const { isDark } = useThemeStore()
  const [liveFlights, setLiveFlights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLive = async () => {
    try {
      const l = await fetch('https://kingfisher-api.onrender.com/api/v1/public/live-flights').then(r => r.json())
      if (Array.isArray(l)) setLiveFlights(l)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLive()
    const i = setInterval(fetchLive, 30000)
    return () => clearInterval(i)
  }, [])

  const t = {
    bg: isDark ? 'bg-[#050505]' : 'bg-slate-50',
    text: isDark ? 'text-white' : 'text-slate-900',
    border: isDark ? 'border-white/5' : 'border-slate-200',
    card: isDark ? 'bg-black/60 backdrop-blur-xl border-white/10' : 'bg-white/80 backdrop-blur-xl border-slate-200 shadow-xl'
  }

  return (
    <div className={`h-screen w-full flex flex-col ${t.bg} ${t.text} font-sans overflow-hidden`}>
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-6 flex justify-between items-start pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`p-6 rounded-[2.5rem] border ${t.card} pointer-events-auto flex items-center gap-6`}
        >
          <button onClick={() => navigate('/dashboard')} className="p-3 rounded-2xl bg-red-600 text-white hover:scale-105 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Radar Scope</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live Operations Tracking</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`p-6 rounded-[2.5rem] border ${t.card} pointer-events-auto flex gap-8`}
        >
          <div className="text-center">
            <div className="text-2xl font-black italic text-red-600">{liveFlights.length}</div>
            <div className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Airborne</div>
          </div>
          <div className="w-[1px] h-10 bg-current opacity-10" />
          <div className="text-center">
            <Activity className="w-6 h-6 text-red-600 mb-1 mx-auto" />
            <div className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Synced</div>
          </div>
        </motion.div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {/* @ts-ignore */}
        <MapContainer center={[20, 77]} zoom={5} style={{ height: '100%', width: '100%', filter: isDark ? 'invert(100%) hue-rotate(180deg) brightness(0.9) contrast(1.1)' : 'none' }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          {liveFlights.map(f => (
            /* @ts-ignore */
            <Marker 
              key={f.id} 
              position={[f.lat, f.lng]} 
              /* @ts-ignore */
              icon={new L.DivIcon({
                className: 'custom-plane-icon',
                html: `<div style="transform: rotate(${f.heading}deg); transition: all 1s linear;"><img src="https://cdn-icons-png.flaticon.com/512/723/723955.png" style="width: 32px; height: 32px; filter: drop-shadow(0 0 10px rgba(192,18,30,0.6));" /></div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              })}
            >
              {/* @ts-ignore */}
              <Tooltip permanent direction="top" offset={[0, -15]} className={`${isDark ? 'bg-black/90 text-white' : 'bg-white text-slate-900'} backdrop-blur-xl border border-red-600/30 rounded-2xl p-4 shadow-2xl min-w-[200px]`}>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-current/10 pb-2">
                    <span className="text-sm font-black text-red-600">{f.flightNumber}</span>
                    <span className="bg-green-500/20 text-green-500 text-[8px] font-black px-3 py-1 rounded-full uppercase">{f.phase}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-black uppercase italic">
                    <span>{f.depIcao}</span>
                    <ArrowLeft size={10} className="rotate-180 opacity-40" />
                    <span>{f.arrIcao}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <div className="text-[8px] font-black uppercase text-zinc-500 tracking-widest mb-1 text-glow-none">Altitude</div>
                      <div className="text-xs font-bold">{f.alt.toLocaleString()} FT</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-black uppercase text-zinc-500 tracking-widest mb-1">Ground Speed</div>
                      <div className="text-xs font-bold">{f.groundSpeed} KT</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-current/10 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-[10px] font-black text-white italic">
                      {f.pilot.firstName[0]}
                    </div>
                    <span className="text-[10px] font-bold uppercase">{f.pilot.firstName} {f.pilot.lastName}</span>
                  </div>
                </div>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>

        {/* Sidebar Overlay */}
        <div className="absolute bottom-10 left-10 z-[1000] hidden md:block w-80">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-8 rounded-[3rem] border ${t.card}`}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white animate-pulse">
                <Radio size={24} />
              </div>
              <div>
                <h4 className="text-lg font-black italic tracking-tight uppercase leading-none">Radar Feed</h4>
                <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest mt-1">Real-time Telemetry</p>
              </div>
            </div>
            <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-hide">
              {liveFlights.length > 0 ? liveFlights.map(f => (
                <div key={f.id} className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'} flex items-center justify-between group cursor-pointer hover:border-red-600/30 transition-all`}>
                  <div>
                    <div className="text-[10px] font-black text-red-600">{f.flightNumber}</div>
                    <div className="text-xs font-bold uppercase">{f.pilot.firstName} {f.pilot.lastName[0]}.</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] font-black text-zinc-500 uppercase">{f.depIcao} → {f.arrIcao}</div>
                    <div className="text-[10px] font-black text-green-500 uppercase mt-1">{f.phase}</div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 opacity-30">
                  <Globe className="w-10 h-10 mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Scanning airspace...</p>
                </div>
              )}
            </div>
          </motion.div>
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
