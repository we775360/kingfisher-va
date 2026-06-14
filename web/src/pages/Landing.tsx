import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Download, Zap, Shield, Navigation, Activity, List, Plane, ExternalLink, Radio } from 'lucide-react'

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
  const [liveFlights, setLiveFlights] = useState<any[]>([])

  useEffect(() => {
    fetch(`${API}/public/live-flights`).then(r => r.json()).then(setLiveFlights).catch(() => {})
  }, [])

  return (
    <div className="bg-white text-black min-h-screen font-sans">
      {/* Header */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8" />
            <span className="font-black italic text-lg tracking-tighter">KINGFISHER</span>
        </div>
        <div className="flex gap-4">
            <button onClick={() => navigate('/login')} className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-black">Sign In</button>
            <button onClick={() => navigate('/register')} className="bg-red-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-red-700">Join</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter mb-8 leading-[0.9]">
          FLY BEYOND <br/> THE HORIZON.
        </h1>
        <p className="text-lg text-zinc-600 max-w-xl mb-12">
          India's premier virtual airline. Founded 2026. Custom ACARS telemetry, 
          real-world operations, and a community built by virtual pilots.
        </p>
        <button onClick={() => navigate('/register')} className="bg-black text-white px-10 py-4 rounded-full text-sm font-black uppercase tracking-widest hover:bg-zinc-800">
          Start Your Career
        </button>
      </section>

      {/* ACARS Download */}
      <section id="acars" className="py-24 bg-zinc-950 text-white">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-black italic tracking-tighter mb-6 uppercase">Kingfisher Custom ACARS</h2>
            <p className="text-zinc-400 mb-8">Download our custom software for real-time telemetry, auto-pirep filing, and mission dispatching.</p>
            <a href="#" className="bg-red-600 text-white px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest inline-flex items-center gap-2 hover:bg-red-700">
              <Download size={16} /> Download Windows Setup
            </a>
          </div>
          <div className="bg-zinc-900 p-8 rounded-3xl border border-white/10">
            <div className="text-xs font-black text-red-500 uppercase tracking-widest mb-2">LiveTelemetry Core</div>
            <div className="text-2xl font-black italic mb-4">SYSTEMS ONLINE</div>
            <div className="space-y-2">
                <div className="h-1 bg-white/10 rounded-full"><div className="w-1/2 h-full bg-red-600"></div></div>
                <div className="text-[10px] text-zinc-500 font-bold">VAMSYS TYPE EXPERIENCE</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Map */}
      <section id="network" className="py-24 max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-black italic tracking-tighter mb-12 uppercase">Live Operational Map</h2>
        <div className="h-[500px] w-full bg-zinc-100 rounded-3xl overflow-hidden border border-zinc-200">
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
      <footer className="py-12 border-t border-zinc-200 mt-12">
         <div className="max-w-7xl mx-auto px-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 flex justify-between">
            <div>© 2026 KINGFISHER VA</div>
            <div>BUILT BY VIRTUAL PILOTS</div>
         </div>
      </footer>
    </div>
  )
}
