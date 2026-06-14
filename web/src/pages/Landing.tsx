import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Download, Zap, Shield, Navigation, Activity, List, Plane, ExternalLink, Radio, BookOpen, Trophy, Users, BarChart3, ChevronRight } from 'lucide-react'

// Fix Leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const planeIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/723/723955.png',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

const API = 'https://kingfisher-api.onrender.com/api/v1'

export default function Landing() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ pilots: 0, routes: 0, flights: 0 })
  const [fleet, setFleet] = useState<any[]>([])
  const [pilots, setPilots] = useState<any[]>([])
  const [liveFlights, setLiveFlights] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
        fetch(`${API}/public/stats`).then(r => r.json()).catch(() => ({})),
        fetch(`${API}/public/fleet`).then(r => r.json()).catch(() => []),
        fetch(`${API}/public/pilots`).then(r => r.json()).catch(() => []),
        fetch(`${API}/public/live-flights`).then(r => r.json()).catch(() => []),
    ]).then(([s, f, p, l]) => {
        setStats(s)
        setFleet(f)
        setPilots(p.slice(0, 5))
        setLiveFlights(l)
    })
  }, [])

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen font-sans">
      {/* Header */}
      <nav className="p-8 flex justify-between items-center max-w-7xl mx-auto border-b border-white/10">
        <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10" />
            <div className="font-black italic text-xl tracking-tighter uppercase">Kingfisher VA</div>
        </div>
        <div className="flex gap-6 items-center">
            {['About', 'Fleet', 'Network', 'Leaderboard'].map(i => <a key={i} href={`#${i.toLowerCase()}`} className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white">{i}</a>)}
            <button onClick={() => navigate('/login')} className="text-[10px] font-black uppercase tracking-widest border border-white/20 px-6 py-2 rounded-full hover:bg-white/10">Sign In</button>
            <button onClick={() => navigate('/register')} className="bg-red-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Join Crew</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <div>
            <h1 className="text-7xl font-black italic tracking-tighter mb-8 leading-[0.9]">BEYOND THE <br/><span className="text-red-600">HORIZON.</span></h1>
            <p className="text-zinc-400 mb-10 text-lg">India's premier virtual airline. Bespoke ACARS technology, realistic operations, and a dedicated pilot community.</p>
            <div className="flex gap-4">
                <button onClick={() => navigate('/register')} className="bg-red-600 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest">Register Free</button>
                <button onClick={() => document.getElementById('acars')?.scrollIntoView()} className="bg-zinc-900 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest">Download ACARS</button>
            </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
            {[{l:'Pilots', v: stats.pilots}, {l:'Routes', v: stats.routes}, {l:'Flights', v: stats.flights}].map(s => (
                <div key={s.l} className="bg-zinc-900 p-6 rounded-2xl">
                    <div className="text-3xl font-black italic">{s.v}</div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{s.l}</div>
                </div>
            ))}
        </div>
      </section>

      {/* Leaderboard & Fleet */}
      <section className="py-24 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16">
        <div id="leaderboard">
            <h3 className="text-2xl font-black italic uppercase mb-8 flex items-center gap-3"><Trophy className="text-red-600" /> Pilot Leaderboard</h3>
            <div className="space-y-4">
                {pilots.map((p, i) => (
                    <div key={p.pilotId} className="flex justify-between p-4 bg-zinc-900 rounded-xl items-center">
                        <span className="font-bold">{i+1}. {p.firstName} {p.lastName}</span>
                        <span className="text-red-600 font-mono text-sm">{p.totalHours} hrs</span>
                    </div>
                ))}
            </div>
        </div>
        <div id="fleet">
            <h3 className="text-2xl font-black italic uppercase mb-8 flex items-center gap-3"><Plane className="text-red-600" /> Our Metal</h3>
            <div className="grid grid-cols-2 gap-4">
                {fleet.map(a => (
                    <div key={a.id} className="bg-zinc-900 p-4 rounded-xl text-center">
                        <div className="font-black italic text-lg">{a.name}</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{a.registration}</div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Live Map */}
      <section id="network" className="py-24 max-w-7xl mx-auto px-6">
        <h3 className="text-2xl font-black italic uppercase mb-8 flex items-center gap-3"><Activity className="text-red-600" /> Live Network</h3>
        <div className="h-[500px] w-full rounded-3xl overflow-hidden border border-zinc-800">
          <MapContainer center={[20, 77]} zoom={4} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {liveFlights.map(f => (
              <Marker key={f.id} position={[f.lat, f.lng]} icon={planeIcon}>
                <Tooltip permanent>
                  <div className="text-[10px] font-bold">{f.flightNumber}</div>
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-900 text-center text-zinc-600 text-[10px] uppercase font-bold tracking-widest">
        © 2026 KINGFISHER VA · BUILT BY VIRTUAL PILOTS
      </footer>
    </div>
  )
}
