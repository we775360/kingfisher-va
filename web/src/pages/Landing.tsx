import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { 
  Download, Monitor, Zap, Shield, Globe as GlobeIcon, 
  ArrowRight, CheckCircle2, Cloud, Navigation, Activity,
  ChevronRight, List, Lock, AppWindow, Radio
} from 'lucide-react'

// Fix Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
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
  const [liveFlights, setLiveFlights] = useState<any[]>([])
  const [scrolled, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setCollapsed(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    
    // Initial fetch
    fetchData()
    const interval = setInterval(fetchData, 30000)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearInterval(interval)
    }
  }, [])

  const fetchData = async () => {
    try {
      const [s, f, l] = await Promise.all([
        fetch(`${API}/public/stats`).then(r => r.json()).catch(() => ({})),
        fetch(`${API}/public/fleet`).then(r => r.json()).catch(() => []),
        fetch(`${API}/public/live-flights`).then(r => r.json()).catch(() => []),
      ])
      if (s) setStats(s)
      if (f) setFleet(f.slice(0, 8))
      if (l) setLiveFlights(l)
    } catch (e) {
      console.error('Fetch failed', e)
    }
  }

  return (
    <div className="bg-[#050505] text-white min-h-screen selection:bg-red-600 selection:text-white font-sans">
      
      {/* ── NAVIGATION ── */}
      <nav className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-500 ${scrolled ? 'bg-black/80 backdrop-blur-2xl py-3 border-b border-white/5' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain group-hover:rotate-12 transition-transform duration-500" />
              <div className="absolute inset-0 bg-red-600/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="hidden sm:block">
              <div className="font-black italic tracking-tighter text-xl leading-none">KINGFISHER</div>
              <div className="text-[9px] font-bold text-red-600 tracking-[0.3em] uppercase opacity-80">Virtual Airlines</div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-10">
            {['About', 'Fleet', 'Network', 'ACARS'].map((item) => (
              <button 
                key={item}
                onClick={() => document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: 'smooth' })}
                className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white hover:tracking-[0.3em] transition-all"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="hidden sm:block text-xs font-black uppercase tracking-widest px-6 py-2 hover:bg-white/5 transition-colors rounded-full"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-[0.2em] px-8 py-3 rounded-full shadow-2xl shadow-red-600/20 transition-all transform hover:scale-105 active:scale-95"
            >
              Join the Crew
            </button>
            <button className="lg:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
               <List className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background Grid & FX */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(185,28,28,0.1),_transparent_70%)]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 100, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border-[1px] border-white/5 rounded-full"
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <div className="max-w-4xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-3 mb-8">
                <span className="h-[2px] w-12 bg-red-600" />
                <span className="text-xs font-black uppercase tracking-[0.4em] text-red-600">Established 2026</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl lg:text-[110px] font-black italic tracking-tighter leading-[0.85] mb-10 text-white drop-shadow-2xl">
                FLY BEYOND <br />
                <span className="text-transparent stroke-text" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.3)' }}>THE HORIZON.</span>
              </h1>

              <p className="text-xl md:text-2xl text-zinc-400 font-medium max-w-2xl leading-relaxed mb-12">
                The most advanced Virtual Airline ecosystem in India. Custom tracking, 
                real-world operations, and a community built by virtual pilots, for virtual pilots.
              </p>

              <div className="flex flex-wrap gap-6">
                <button 
                  onClick={() => navigate('/register')}
                  className="bg-white text-black px-12 py-5 rounded-full text-sm font-black uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center gap-3 group"
                >
                  Start Your Career <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                </button>
                <div className="flex -space-x-4 items-center">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-black bg-zinc-800 flex items-center justify-center overflow-hidden">
                       <img src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-full h-full object-cover" alt="pilot" />
                    </div>
                  ))}
                  <div className="pl-8">
                    <div className="font-black italic leading-none">{stats.pilots}+ PILOTS</div>
                    <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Active Worldwide</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Hero Bottom Stats */}
        <div className="absolute bottom-12 left-0 right-0 z-10 border-y border-white/5 bg-black/40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-8 flex flex-wrap justify-between gap-8 md:gap-0">
             {[
               { label: 'ICAO', value: 'KFR' },
               { label: 'CALLSIGN', value: 'KINGFISHER' },
               { label: 'BASE', value: 'INDIA' },
               { label: 'SALARY', value: '$500/HR' },
               { label: 'STATUS', value: 'OPERATIONAL' },
             ].map(stat => (
               <div key={stat.label}>
                 <div className="text-[9px] font-black text-zinc-500 tracking-[0.3em] uppercase mb-1">{stat.label}</div>
                 <div className="text-xl font-black italic tracking-tighter text-white">{stat.value}</div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* ── ACARS DOWNLOAD HERO ── */}
      <section id="acars" className="py-32 bg-zinc-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-red-600/5 blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-red-600/10 rounded-full border border-red-600/20 mb-8">
              <Zap className="w-4 h-4 text-red-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-red-600">New Software Release</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-[0.9] mb-8">
              THE ALL-NEW <br />
              <span className="text-red-600 underline decoration-white/10">KINGFISHER ACARS</span>
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed mb-10 max-w-xl">
              Experience zero-latency flight tracking with our bespoke telemetry core. 
              Built with an industrial-grade "Glass Cockpit" UI, supporting MSFS, X-Plane, and P3D.
            </p>

            <div className="grid grid-cols-2 gap-8 mb-12">
               <Feature icon={<Activity />} title="Live Telemetry" desc="Real-time IAS, Mach, & Attitude" />
               <Feature icon={<Lock />} title="Secure Sessions" desc="Automatic server sync & login" />
               <Feature icon={<AppWindow />} title="SimBrief Link" desc="Direct mission dispatching" />
               <Feature icon={<Shield />} title="Auto-Filing" desc="Zero-click PIREP submission" />
            </div>

            <div className="flex items-center gap-6">
              <a 
                href="#" // You can replace with actual download link
                className="bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-2xl shadow-red-600/20 flex items-center gap-3 transform hover:-translate-y-1"
              >
                <Download className="w-5 h-5" /> Download for Windows
              </a>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                v1.1.0 Stable · 64-bit
              </div>
            </div>
          </div>

          <div className="relative">
             {/* Industrial UI Mockup using CSS */}
             <div className="bg-[#0a0a0a] p-3 rounded-3xl border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] transform lg:rotate-3">
                <div className="bg-[#050505] rounded-2xl overflow-hidden border border-white/5 aspect-video flex flex-col">
                   <div className="h-8 bg-zinc-900 flex items-center px-4 gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-600" />
                      <div className="w-2 h-2 rounded-full bg-zinc-800" />
                      <div className="text-[8px] font-bold text-zinc-600 ml-auto tracking-widest uppercase">ACARS Operational Core</div>
                   </div>
                   <div className="flex-1 p-8 flex flex-col justify-center items-center text-center">
                      <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-600/20 mb-6 animate-pulse">
                         <Navigation className="w-8 h-8 text-red-600" />
                      </div>
                      <div className="text-2xl font-black italic tracking-tighter mb-2">SYSTEMS ACTIVE</div>
                      <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.4em] mb-6">Tracking Active Mission KFR102</div>
                      <div className="w-full max-w-xs h-1 bg-white/5 rounded-full overflow-hidden">
                         <div className="w-2/3 h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                      </div>
                      <div className="flex justify-between w-full max-w-xs mt-4">
                         <div className="text-left text-[8px] font-bold text-zinc-600 uppercase">DEP: VABB</div>
                         <div className="text-right text-[8px] font-bold text-zinc-600 uppercase">ARR: VIDP</div>
                      </div>
                   </div>
                </div>
             </div>
             {/* Floating badge */}
             <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-2xl shadow-2xl hidden md:block border border-zinc-200 transform -rotate-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white">
                      <Zap className="w-6 h-6" />
                   </div>
                   <div>
                      <div className="text-black font-black italic leading-none text-xl tracking-tighter">VAMSYS TYPE</div>
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Experience Level</div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ── LIVE TRACKING MAP ── */}
      <section id="network" className="py-32 bg-black relative">
        <div className="max-w-7xl mx-auto px-6 mb-16 flex items-end justify-between">
           <div>
              <div className="text-[10px] font-black text-red-600 tracking-[0.4em] uppercase mb-4">Real-time Operations</div>
              <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter">LIVE NETWORK</h2>
           </div>
           <div className="text-right hidden sm:block">
              <div className="font-black italic text-3xl leading-none">{liveFlights.length}</div>
              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Flights Airborne</div>
           </div>
        </div>

        <div className="max-w-[1440px] mx-auto h-[700px] relative rounded-[3rem] overflow-hidden border border-white/5 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
           <MapContainer 
             center={[20, 77]} 
             zoom={5} 
             style={{ height: '100%', width: '100%', background: '#050505' }}
             zoomControl={false}
           >
             <TileLayer
               url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
               attribution='&copy; OSM'
             />
             {liveFlights.map(f => (
               <Marker key={f.id} position={[f.lat, f.lng]} icon={planeIcon}>
                 <Tooltip permanent direction="top" offset={[0, -10]} className="map-tooltip">
                    <div className="bg-black/90 text-white p-2 rounded-lg border border-red-600/30 text-[10px] font-bold italic">
                       {f.flightNumber} · {f.pilot.pilotId}
                    </div>
                 </Tooltip>
               </Marker>
             ))}
           </MapContainer>

           {/* Floating Live List overlay */}
           <div className="absolute top-10 right-10 z-[1000] w-72 space-y-3 pointer-events-none hidden md:block">
              {liveFlights.length === 0 ? (
                <div className="bg-black/80 backdrop-blur-xl p-6 rounded-3xl border border-white/5 text-center pointer-events-auto">
                   <Cloud className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                   <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Skies are clear</div>
                </div>
              ) : (
                liveFlights.map(f => (
                  <div key={f.id} className="bg-black/60 backdrop-blur-xl p-4 rounded-2xl border-l-4 border-red-600 border-y border-r border-white/5 flex items-center justify-between pointer-events-auto shadow-2xl">
                    <div>
                       <div className="text-red-600 text-[10px] font-black tracking-widest">{f.flightNumber}</div>
                       <div className="font-bold text-sm italic">{f.pilot.firstName} {f.pilot.lastName}</div>
                       <div className="text-[9px] text-zinc-500 uppercase font-black mt-1 tracking-tighter">{f.phase} · {Math.round(f.alt)}FT</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                       <Radio className="w-4 h-4 text-red-600 animate-pulse" />
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </section>

      {/* ── FLEET SHOWCASE ── */}
      <section id="fleet" className="py-32 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 mb-20">
           <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-5xl font-black italic tracking-tighter mb-6">OUR METAL</h2>
              <p className="text-zinc-500 uppercase text-xs font-black tracking-[0.3em]">Precision engineering for virtual aviators</p>
           </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
           {fleet.map((a, i) => (
             <motion.div 
               key={a.id}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               viewport={{ once: true }}
               className="group relative bg-[#0a0a0a] rounded-3xl p-8 border border-white/5 hover:border-red-600/30 transition-all cursor-default overflow-hidden"
             >
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-[40px] group-hover:bg-red-600/10 transition-colors" />
                <div className="relative z-10">
                   <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Plane className="w-6 h-6 text-zinc-600 group-hover:text-red-600" />
                   </div>
                   <div className="text-red-600 text-[10px] font-black tracking-widest mb-1">{a.type}</div>
                   <div className="text-xl font-black italic tracking-tighter mb-4 group-hover:text-red-600 transition-colors">{a.name}</div>
                   <div className="flex items-center justify-between border-t border-white/5 pt-4">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">REG: {a.registration}</span>
                      <span className="text-xs font-black italic">{a.pax} SEATS</span>
                   </div>
                </div>
             </motion.div>
           ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-20 border-t border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-4 gap-16 mb-20">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-4 mb-8">
                <img src="/logo.png" alt="Logo" className="w-12 h-12 grayscale" />
                <div className="font-black italic text-2xl tracking-tighter">KINGFISHER</div>
              </div>
              <p className="text-zinc-500 text-lg max-w-md leading-relaxed">
                India's premier community virtual airline. Redefining the standard of virtual aviation since 2026.
              </p>
            </div>
            
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-8">Navigation</h4>
              <ul className="space-y-4">
                {['Home', 'About', 'Fleet', 'Network', 'ACARS'].map(l => (
                  <li key={l}><button onClick={() => go(l.toLowerCase())} className="text-sm font-bold text-zinc-600 hover:text-white transition-colors">{l}</button></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-8">Community</h4>
              <ul className="space-y-4">
                <li><a href={DISCORD} target="_blank" className="text-sm font-bold text-zinc-600 hover:text-white transition-colors">Official Discord</a></li>
                <li><a href="#" className="text-sm font-bold text-zinc-600 hover:text-white transition-colors">Global Roster</a></li>
                <li><a href="#" className="text-sm font-bold text-zinc-600 hover:text-white transition-colors">Operations Manual</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-t border-white/5 pt-12">
            <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
              © 2026 Kingfisher Virtual Airlines · Not affiliated with any real-world airline.
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest">
              Built by <span className="text-red-600">Virtual Pilots</span> · For the Community
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .stroke-text { -webkit-text-fill-color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,0.2); }
        .map-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
        .leaflet-container { background: #050505 !important; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #222; }
      `}</style>

    </div>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex gap-5 group">
       <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-red-600/10 group-hover:border-red-600/30 transition-all">
          <div className="w-5 h-5 text-zinc-500 group-hover:text-red-600 transition-colors">
            {icon}
          </div>
       </div>
       <div>
          <div className="text-sm font-black italic tracking-tighter uppercase mb-1">{title}</div>
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{desc}</div>
       </div>
    </div>
  )
}
