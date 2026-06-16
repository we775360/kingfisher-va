import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet'
import Globe from 'react-globe.gl'
import L from 'leaflet'
// @ts-expect-error - Leaflet CSS side effect
import 'leaflet/dist/leaflet.css'
import { 
  Plane, Users, Navigation, Activity, Trophy, ArrowRight, 
  ExternalLink, Globe as GlobeIcon, Shield, Zap, Info, Camera,
  MapPin, Clock, Wind, ArrowUpRight, Radio, Mail, 
  ChevronDown, Menu, X, Landmark, Compass, Award, Share2, PlayCircle
} from 'lucide-react'

// Fix Leaflet icon
// @ts-ignore
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const API = 'https://kingfisher-api.onrender.com/api/v1'

export default function Landing() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ pilots: 0, routes: 0, flights: 0 })
  const [fleet, setFleet] = useState<any[]>([])
  const [pilots, setPilots] = useState<any[]>([])
  const [liveFlights, setLiveFlights] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [s, f, p, l, rt] = await Promise.all([
        fetch(`${API}/public/stats`).then(r => r.json()).catch(() => ({ pilots: 0, routes: 0, flights: 0 })),
        fetch(`${API}/public/fleet`).then(r => r.json()).catch(() => []),
        fetch(`${API}/public/pilots`).then(r => r.json()).catch(() => []),
        fetch(`${API}/public/live-flights`).then(r => r.json()).catch(() => []),
        fetch(`${API}/public/routes`).then(r => r.json()).catch(() => []),
      ])
      setStats(s)
      setFleet(f)
      setPilots(p)
      setLiveFlights(l)
      setRoutes(rt)
    } catch (error) {
      console.error('Data Fetch Error:', error)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearInterval(interval)
    }
  }, [fetchData])

  const globeData = useMemo(() => {
    return routes.filter(r => r.depIcao && r.arrIcao).map(r => ({
      startLat: 20, // India approximate for visualization if coords missing
      startLng: 77,
      endLat: 28,
      endLng: 77,
      color: ['#c0121e', '#ff8c00']
    })).slice(0, 40)
  }, [routes])

  const planeIcon = new L.DivIcon({
    className: 'custom-plane-icon',
    html: `<div style="transform: rotate(0deg);"><img src="https://cdn-icons-png.flaticon.com/512/723/723955.png" style="width: 24px; height: 24px; filter: drop-shadow(0 0 5px rgba(192,18,30,0.5));" /></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  })

  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-red-600 selection:text-white overflow-x-hidden">
      
      {/* ── MOBILE NAVIGATION ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col p-8 pt-24 gap-8"
          >
            <button onClick={() => setMobileMenuOpen(false)} className="absolute top-8 right-8 text-zinc-400 hover:text-white transition-colors">
              <X size={32} />
            </button>
            {['Network', 'Fleet', 'Roster', 'About'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`} 
                onClick={() => setMobileMenuOpen(false)}
                className="text-4xl font-black italic tracking-tighter uppercase text-zinc-600 hover:text-red-600 transition-all"
              >
                {item}
              </a>
            ))}
            <div className="mt-auto flex flex-col gap-4">
              <button onClick={() => navigate('/login')} className="w-full py-4 text-xl font-black uppercase tracking-widest border border-white/10 rounded-2xl">Log In</button>
              <button onClick={() => navigate('/register')} className="w-full py-4 text-xl font-black uppercase tracking-widest bg-red-600 rounded-2xl shadow-xl shadow-red-600/20">Join Crew</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DESKTOP NAVIGATION ── */}
      <nav className={`fixed top-0 w-full z-[90] transition-all duration-700 ${scrolled ? 'py-4 bg-black/60 backdrop-blur-2xl border-b border-white/5' : 'py-8 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 cursor-pointer"
                onClick={() => window.scrollTo(0,0)}
            >
                <div className="relative">
                    <img src="/logo.png" alt="Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-pulse border-2 border-black"></div>
                </div>
                <div className="flex flex-col">
                    <span className="font-black italic text-xl md:text-2xl tracking-tighter uppercase leading-none">Kingfisher</span>
                    <span className="text-[8px] md:text-[10px] font-bold tracking-[0.4em] uppercase text-red-600">Virtual Airline</span>
                </div>
            </motion.div>
            
            <div className="hidden lg:flex gap-10 items-center">
                {['Network', 'Fleet', 'Roster', 'About'].map((i, idx) => (
                    <motion.a 
                        key={i} 
                        href={`#${i.toLowerCase()}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-red-600 transition-all relative group"
                    >
                        {i}
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 transition-all group-hover:w-full"></span>
                    </motion.a>
                ))}
            </div>

            <div className="flex gap-4 items-center">
                <button onClick={() => navigate('/login')} className="hidden md:block text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Sign In</button>
                <button onClick={() => navigate('/register')} className="hidden md:block bg-red-600 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-all">Join Career</button>
                <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 text-zinc-400 hover:text-white"><Menu /></button>
            </div>
        </div>
      </nav>

      {/* ── CINEMATIC SUNSET HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#050505] z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80 z-10"></div>
            <motion.img 
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 2 }}
                src="https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&q=80&w=2000" 
                alt="Sunset Aviation" 
                className="w-full h-full object-cover"
            />
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full relative z-20 pt-20">
            <div className="flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-3 px-6 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full mb-10"
                >
                    <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-300">Phase 2 Operations Live</span>
                </motion.div>
                
                <motion.h1 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-6xl md:text-9xl font-black italic tracking-tighter mb-8 leading-[0.8] uppercase"
                >
                    SOAR TO <br/>
                    <span className="text-red-600 text-glow-red">NEW HEIGHTS.</span>
                </motion.h1>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-zinc-400 text-lg md:text-xl max-w-2xl leading-relaxed mb-12 font-medium"
                >
                    Experience the ultimate fusion of realism and high-energy aviation. Join India's most innovative virtual airline, built by aviators, for aviators.
                </motion.p>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-wrap justify-center gap-6"
                >
                    <button onClick={() => navigate('/register')} className="group flex items-center gap-4 bg-red-600 text-white px-12 py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-red-600/40 hover:scale-105 transition-all">
                        Take Command <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })} className="flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 px-12 py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all">
                        Explore Network <Compass className="w-4 h-4 text-red-600" />
                    </button>
                </motion.div>
            </div>

            {/* Float Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-24">
                {[
                    { label: 'Active Crew', value: stats.pilots, icon: Users, color: 'text-blue-500' },
                    { label: 'Global Routes', value: stats.routes, icon: Navigation, color: 'text-red-600' },
                    { label: 'Flights Flown', value: stats.flights, icon: Plane, color: 'text-orange-500' },
                    { label: 'Live OPS', value: liveFlights.length, icon: Activity, color: 'text-green-500' }
                ].map((s, i) => (
                    <motion.div 
                        key={s.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + (i * 0.1) }}
                        className="glass-dark p-6 rounded-3xl border border-white/5 hover:border-red-600/30 transition-all flex flex-col items-center justify-center text-center"
                    >
                        <s.icon className={`w-5 h-5 mb-4 ${s.color}`} />
                        <div className="text-3xl font-black italic tracking-tighter mb-1">{s.value}</div>
                        <div className="text-[8px] font-black uppercase tracking-widest text-zinc-500">{s.label}</div>
                    </motion.div>
                ))}
            </div>
        </div>
        
        <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-zinc-500"
        >
            <ChevronDown size={32} />
        </motion.div>
      </section>

      {/* ── 3D GLOBAL NETWORK ── */}
      <section id="network" className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
                <div className="relative order-2 lg:order-1 h-[400px] md:h-[600px] flex items-center justify-center">
                    <div className="absolute inset-0 bg-red-600/10 blur-[150px] rounded-full scale-50"></div>
                    <Globe
                        height={600}
                        width={600}
                        backgroundColor="rgba(0,0,0,0)"
                        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                        arcsData={globeData}
                        arcColor="color"
                        arcDashLength={0.4}
                        arcDashGap={2}
                        arcDashAnimateTime={2000}
                        arcStroke={1.5}
                        animateIn={true}
                    />
                </div>
                <motion.div 
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="order-1 lg:order-2"
                >
                    <div className="text-red-600 font-black uppercase tracking-[0.5em] text-[10px] mb-6">Real-Time Network</div>
                    <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none mb-10 uppercase">
                        DOMINATING THE <br/>
                        <span className="text-red-600 text-glow-red">GLOBAL SKIES.</span>
                    </h2>
                    <p className="text-zinc-400 text-lg leading-relaxed mb-12 font-medium">
                        Our network spans across India and beyond, connecting major hubs with high-fidelity routes. Every destination is meticulously planned for maximum simulation immersion.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-8">
                        {[
                            { title: '450+ Active Routes', icon: MapPin },
                            { title: 'SimBrief Integrated', icon: Zap },
                            { title: 'Dynamic Schedules', icon: Clock },
                            { title: 'Vatsim/Ivao Ready', icon: GlobeIcon }
                        ].map((item) => (
                            <div key={item.title} className="flex gap-4 items-center">
                                <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-600">
                                    <item.icon size={18} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest">{item.title}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
      </section>

      {/* ── FLEET SECTION ── */}
      <section id="fleet" className="py-32 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-24">
                <div className="text-red-600 font-black uppercase tracking-[0.5em] text-[10px] mb-6">Our Metal</div>
                <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">THE KINGFISHER <br/> <span className="text-red-600 text-glow-red">FLEET.</span></h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {fleet.length > 0 ? fleet.slice(0, 6).map((ac, i) => (
                    <motion.div 
                        key={ac.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-dark rounded-[40px] overflow-hidden border border-white/5 hover:border-red-600/30 transition-all group"
                    >
                        <div className="h-56 bg-zinc-900 relative overflow-hidden">
                            <img src={`https://images.unsplash.com/photo-1556388158-158ea5ccacbd?auto=format&fit=crop&q=80&w=800`} alt={ac.name} className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:rotate-2 transition-all duration-700" />
                            <div className="absolute top-6 right-6 bg-red-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{ac.icao}</div>
                        </div>
                        <div className="p-10">
                            <h4 className="text-2xl font-black italic tracking-tight mb-2 uppercase">{ac.name}</h4>
                            <div className="text-red-600 text-[10px] font-black uppercase tracking-widest mb-6">Reg: {ac.registration}</div>
                            <div className="grid grid-cols-2 gap-6 border-t border-white/5 pt-6">
                                <div>
                                    <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Engines</div>
                                    <div className="text-xs font-bold uppercase">{ac.engines}</div>
                                </div>
                                <div>
                                    <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Max PAX</div>
                                    <div className="text-xs font-bold">{ac.pax}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )) : (
                    <div className="col-span-3 text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                        <Activity className="w-12 h-12 text-zinc-700 mx-auto mb-6 animate-pulse" />
                        <h4 className="text-zinc-500 font-black uppercase tracking-[0.5em] text-xs leading-relaxed">System Synchronizing... <br/> Fleet Data Incoming</h4>
                    </div>
                )}
            </div>
        </div>
      </section>

      {/* ── LIVE OPERATIONS MAP ── */}
      <section className="py-32 relative overflow-hidden bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-10">
                <div>
                    <div className="text-red-600 font-black uppercase tracking-[0.5em] text-[10px] mb-6">Real-Time Traffic</div>
                    <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">LIVE OPS <span className="text-red-600 text-glow-red">TRACKER.</span></h2>
                </div>
                <div className="flex gap-4">
                    <div className="glass-dark px-8 py-5 rounded-3xl border border-white/5 flex items-center gap-6">
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Airborne</span>
                            <span className="text-2xl font-black italic text-green-500">{liveFlights.length}</span>
                        </div>
                        <div className="w-[1px] h-10 bg-white/10"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Pilot Count</span>
                            <span className="text-2xl font-black italic text-red-600">{stats.pilots}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-[500px] md:h-[700px] w-full rounded-[60px] overflow-hidden border border-white/5 shadow-[0_0_80px_rgba(192,18,30,0.1)] relative">
                {/* @ts-expect-error - Leaflet props types */}
                <MapContainer center={[20, 77]} zoom={4} style={{ height: '100%', width: '100%', filter: 'invert(100%) hue-rotate(180deg) brightness(0.9) contrast(1.1)' }} zoomControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    {liveFlights.map(f => (
                        /* @ts-ignore */
                        <Marker 
                            key={f.id} 
                            position={[f.lat, f.lng]} 
                            /* @ts-ignore */
                            icon={planeIcon}
                        >
                            {/* @ts-ignore */}
                            <Tooltip permanent direction="top" offset={[0, -10]} className="bg-black/90 backdrop-blur-xl border border-red-600/30 text-white rounded-xl p-3 shadow-2xl">
                                <div className="flex flex-col gap-1 min-w-[120px]">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black text-red-600">{f.flightNumber}</span>
                                        <span className="bg-green-500/20 text-green-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">{f.phase}</span>
                                    </div>
                                    <div className="text-xs font-black tracking-tight uppercase mb-2">{f.depIcao} <ArrowRight size={10} className="inline mx-1" /> {f.arrIcao}</div>
                                    <div className="flex justify-between text-[9px] font-bold text-zinc-500 pt-2 border-t border-white/5">
                                        <span>ALT: {f.alt}FT</span>
                                        <span>GS: {f.groundSpeed}KT</span>
                                    </div>
                                </div>
                            </Tooltip>
                        </Marker>
                    ))}
                </MapContainer>
                
                {/* Custom Overlay for Map Stats */}
                <div className="absolute bottom-10 left-10 z-[1000] hidden md:block">
                    <div className="glass-dark p-8 rounded-[40px] border border-white/10 min-w-[320px]">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white animate-pulse">
                                <Radio size={24} />
                            </div>
                            <div>
                                <h4 className="text-lg font-black italic tracking-tight leading-none uppercase">COMMS Center</h4>
                                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Live Flight Frequency</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {liveFlights.length > 0 ? liveFlights.slice(0, 3).map(f => (
                                <div key={f.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div>
                                        <div className="text-[9px] font-black text-red-600">{f.flightNumber}</div>
                                        <div className="text-xs font-bold uppercase">{f.pilot.firstName} {f.pilot.lastName[0]}.</div>
                                    </div>
                                    <Activity size={14} className="text-green-500" />
                                </div>
                            )) : (
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest italic py-4">No active communications...</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* ── PILOT ROSTER / LEADERBOARD ── */}
      <section id="roster" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-10">
                <div>
                    <div className="text-red-600 font-black uppercase tracking-[0.5em] text-[10px] mb-6">Elite Aviators</div>
                    <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">CREW <span className="text-red-600 text-glow-red">LEADERBOARD.</span></h2>
                </div>
                <button className="bg-white/5 border border-white/10 px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-red-600 transition-all">View All Pilots</button>
            </div>

            <div className="grid gap-4">
                {pilots.length > 0 ? pilots.slice(0, 5).map((p, i) => (
                    <motion.div 
                        key={p.pilotId}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-dark p-6 md:p-10 rounded-[35px] border border-white/5 hover:border-red-600/30 transition-all flex flex-col md:flex-row items-center justify-between gap-8 group"
                    >
                        <div className="flex items-center gap-8 w-full md:w-auto">
                            <div className="text-4xl font-black italic text-zinc-800 group-hover:text-red-600 transition-colors">0{i+1}</div>
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-[25px] bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center text-red-600 font-black italic text-xl border border-white/10 group-hover:rotate-6 transition-all">
                                {p.firstName[0]}{p.lastName[0]}
                            </div>
                            <div>
                                <h4 className="text-2xl font-black italic tracking-tight uppercase">{p.firstName} {p.lastName}</h4>
                                <div className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em]">{p.rank} • {p.pilotId}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-8 md:gap-16 w-full md:w-auto">
                            <div className="flex flex-col items-center md:items-start">
                                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2">Total Hours</span>
                                <span className="text-2xl font-black italic">{p.totalHours.toFixed(1)}</span>
                            </div>
                            <div className="flex flex-col items-center md:items-start">
                                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2">Missions</span>
                                <span className="text-2xl font-black italic">{p.totalFlights}</span>
                            </div>
                            <div className="flex flex-col items-center md:items-start">
                                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2">Points</span>
                                <span className="text-2xl font-black italic text-red-600">{p.points}</span>
                            </div>
                        </div>
                    </motion.div>
                )) : (
                    <div className="py-20 text-center glass-dark rounded-[40px] border border-dashed border-white/10">
                        <Users className="w-12 h-12 text-zinc-800 mx-auto mb-6" />
                        <p className="text-zinc-600 font-black uppercase tracking-[0.4em] text-[10px]">Loading Crew Data...</p>
                    </div>
                )}
            </div>
        </div>
      </section>

      {/* ── MEET THE FOUNDER ── */}
      <section id="about" className="py-32 relative overflow-hidden bg-[#080808]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 blur-[150px] rounded-full"></div>
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="relative group"
                >
                    <div className="absolute -inset-10 bg-red-600/10 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="glass-dark p-4 rounded-[60px] border border-white/5 relative overflow-hidden">
                        <img 
                            src="https://images.unsplash.com/photo-1520437358207-323b43b50729?auto=format&fit=crop&q=80&w=1200" 
                            alt="Founder" 
                            className="w-full aspect-[4/5] object-cover rounded-[45px] opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
                        />
                        <div className="absolute bottom-12 left-12">
                            <h3 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Guneet Singh</h3>
                            <p className="text-red-600 font-black uppercase tracking-[0.5em] text-[10px]">Founder & Lead Developer</p>
                        </div>
                    </div>
                </motion.div>

                <div>
                    <div className="text-red-600 font-black uppercase tracking-[0.5em] text-[10px] mb-6">The Visionary</div>
                    <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none mb-10">
                        BUILT BY A <br/>
                        <span className="text-red-600 text-glow-red">BUILDER.</span>
                    </h2>
                    <div className="space-y-8 text-zinc-400 text-lg leading-relaxed font-medium">
                        <p>
                            At just 16, Guneet Singh founded Kingfisher Virtual Airline with a single mission: to redefine the virtual aviation landscape in India through technology and innovation.
                        </p>
                        <p>
                            From developing the core ACARS system to designing this very platform, Guneet's hands-on approach ensures every Kingfisher pilot experiences a standard that rivals real-world flight operations.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8 mt-12">
                        <div className="p-8 glass-dark rounded-[35px] border border-white/5">
                            <Landmark size={32} className="text-red-600 mb-6" />
                            <h5 className="font-black italic text-xl uppercase mb-2">India Based</h5>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Proudly Global, Locally Inspired</p>
                        </div>
                        <div className="p-8 glass-dark rounded-[35px] border border-white/5">
                            <Award size={32} className="text-red-600 mb-6" />
                            <h5 className="font-black italic text-xl uppercase mb-2">Innovation</h5>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Next-Gen VA Architecture</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* ── CALL TO ACTION ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0c0c0c] to-black rounded-[60px] p-12 md:p-24 text-center border border-white/5 shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-[-50%] left-[-20%] w-[100%] h-[200%] bg-red-600/10 blur-[150px] animate-pulse"></div>
                </div>
                <div className="relative z-10">
                    <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter text-white mb-10 uppercase leading-[0.8]">
                        YOUR COCKPIT <br/> <span className="text-red-600">IS READY.</span>
                    </h2>
                    <p className="text-zinc-500 text-xl md:text-2xl max-w-2xl mx-auto mb-16 font-medium">
                        Don't just fly. Elevate. Join Kingfisher VA and experience the future of flight simulation.
                    </p>
                    <div className="flex flex-wrap justify-center gap-6">
                        <button onClick={() => navigate('/register')} className="group flex items-center gap-4 bg-red-600 text-white px-12 py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-red-600/40 hover:scale-105 transition-all">
                            Apply Now <ArrowRight size={18} />
                        </button>
                        <a href="https://discord.gg/jefmDpfa" target="_blank" rel="noreferrer" className="flex items-center gap-4 bg-[#5865F2] text-white px-12 py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-[#5865F2]/40 hover:scale-105 transition-all">
                            Join Discord <ExternalLink size={18} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-24 border-t border-white/5 bg-[#050505] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
                <div className="lg:col-span-2">
                    <div className="flex items-center gap-4 mb-10">
                        <img src="/logo.png" alt="Logo" className="w-12 h-12" />
                        <span className="font-black italic text-3xl tracking-tighter uppercase leading-none">Kingfisher VA</span>
                    </div>
                    <p className="text-zinc-500 text-lg max-w-md leading-relaxed mb-10 font-medium">
                        The world's most innovative virtual airline for simulation enthusiasts. Redefining the Indian aviation landscape through technology.
                    </p>
                    <div className="flex gap-6">
                        <a href="https://discord.gg/jefmDpfa" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-[#5865F2] hover:border-[#5865F2]/50 transition-all"><Radio size={20} /></a>
                        <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-[#1DA1F2] transition-all"><Share2 size={20} /></a>
                        <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-[#FF0000] transition-all"><PlayCircle size={20} /></a>
                        <a href="mailto:kingfishervirtualairline@gmail.com" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-red-600 transition-all"><Mail size={20} /></a>
                    </div>
                </div>
                
                <div>
                    <h5 className="font-black uppercase tracking-[0.4em] text-[10px] text-white mb-10">Operational Center</h5>
                    <ul className="space-y-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        {['Dispatch Hub', 'Elite Leaderboard', 'Fleet Hangar', 'Global Routes', 'ACARS Core'].map(i => (
                            <li key={i} className="hover:text-red-600 cursor-pointer transition-colors">{i}</li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h5 className="font-black uppercase tracking-[0.4em] text-[10px] text-white mb-10">Corporate</h5>
                    <ul className="space-y-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        {['About the Founder', 'Careers', 'Privacy Policy', 'Cookie Policy', 'System Status'].map(i => (
                            <li key={i} className="hover:text-red-600 cursor-pointer transition-colors">{i}</li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center pt-16 border-t border-white/5 gap-8">
                <div className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-700">
                    © 2026 KINGFISHER VA · CRAFTED BY GUNEET SINGH · NOT A REAL AIRLINE
                </div>
                <div className="flex gap-10">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-700 hover:text-red-600 cursor-pointer transition-all">Support Center</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-700 hover:text-red-600 cursor-pointer transition-all">Pilot Handbook</span>
                </div>
            </div>
        </div>
      </footer>

      <style>{`
        .leaflet-container { background: #050505 !important; }
        .custom-plane-icon { background: none !important; border: none !important; }
        .glass-dark:hover { background: rgba(15, 15, 15, 0.8) !important; transform: translateY(-5px); }
      `}</style>
    </div>
  )
}
