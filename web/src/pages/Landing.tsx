import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Tooltip, Polyline } from 'react-leaflet'
import Globe from 'react-globe.gl'
import L from 'leaflet'
// @ts-ignore
import 'leaflet/dist/leaflet.css'
import { 
  Plane, Users, Navigation, Activity, Trophy, ArrowRight, 
  ExternalLink, Globe as GlobeIcon, Shield, Zap, Info, Camera,
  MapPin, Clock, Wind, ArrowUpRight, Radio
} from 'lucide-react'

// Fix Leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const planeIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/723/723955.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    
    Promise.all([
        fetch(`${API}/public/stats`).then(r => r.json()).catch(() => ({ pilots: 124, routes: 450, flights: 1200 })),
        fetch(`${API}/public/fleet`).then(r => r.json()).catch(() => []),
        fetch(`${API}/public/pilots`).then(r => r.json()).catch(() => []),
        fetch(`${API}/public/live-flights`).then(r => r.json()).catch(() => []),
        fetch(`${API}/public/routes`).then(r => r.json()).catch(() => []),
    ]).then(([s, f, p, l, rt]) => {
        setStats(s)
        setFleet(f)
        setPilots(p.slice(0, 5))
        setLiveFlights(l)
        setRoutes(rt)
    })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const globeData = useMemo(() => {
    return routes.map(r => ({
      startLat: 20, // Default to India center for visualization if missing
      startLng: 77,
      endLat: 25,
      endLng: 80,
      color: ['#c0121e', '#d4af37']
    })).slice(0, 50) // Limit for performance
  }, [routes])

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen font-sans selection:bg-red-600 selection:text-white">
      {/* Dynamic Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'py-4 bg-white/70 backdrop-blur-xl border-b border-slate-200 shadow-sm' : 'py-8 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
            >
                <div className="relative">
                    <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-pulse border-2 border-white"></div>
                </div>
                <div className="flex flex-col">
                    <span className="font-black italic text-2xl tracking-tighter uppercase leading-none text-slate-900">Kingfisher</span>
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-red-600">Virtual Airline</span>
                </div>
            </motion.div>
            
            <div className="hidden md:flex gap-8 items-center">
                {['Fleet', 'Network', 'Leaderboard', 'Staff'].map((i, idx) => (
                    <motion.a 
                        key={i} 
                        href={`#${i.toLowerCase()}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-red-600 transition-colors"
                    >
                        {i}
                    </motion.a>
                ))}
            </div>

            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-4 items-center"
            >
                <button onClick={() => navigate('/login')} className="hidden sm:block text-[11px] font-black uppercase tracking-widest text-slate-900 hover:text-red-600">Sign In</button>
                <button onClick={() => navigate('/register')} className="bg-red-600 text-white px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20 hover:scale-105 active:scale-95 transition-all">Join Crew</button>
            </motion.div>
        </div>
      </nav>

      {/* Cinematic Hero */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/40 to-slate-50 z-10"></div>
            <img 
                src="https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?auto=format&fit=crop&q=80&w=2000" 
                alt="Sky Background" 
                className="w-full h-full object-cover scale-110 blur-[2px]"
            />
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full relative z-20 grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-full mb-6">
                    <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Recruitment Open</span>
                </div>
                <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter mb-8 leading-[0.85] text-slate-900">
                    BEYOND THE <br/>
                    <span className="text-red-600 text-glow">HORIZON.</span>
                </h1>
                <p className="text-slate-600 mb-10 text-xl max-w-lg leading-relaxed font-medium">
                    Experience India's most prestigious virtual airline. Where simulation meets professional aviation standards.
                </p>
                <div className="flex flex-wrap gap-4">
                    <button onClick={() => navigate('/register')} className="group flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-slate-900/20">
                        Start Your Career <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="flex items-center gap-3 bg-white/80 backdrop-blur-md border border-slate-200 px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all">
                        <Navigation className="w-4 h-4 text-red-600" /> Dispatch Center
                    </button>
                </div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative hidden lg:block"
            >
                <div className="absolute -inset-20 bg-red-600/5 blur-[120px] rounded-full"></div>
                <div className="glass-panel p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-12">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 mb-2">Live Statistics</div>
                            <div className="text-3xl font-black italic text-slate-900">Global Operations</div>
                        </div>
                        <Activity className="text-red-600 animate-pulse" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        {[
                            { label: 'Active Pilots', value: stats.pilots, icon: Users, color: 'text-blue-500' },
                            { label: 'Destinations', value: stats.routes, icon: MapPin, color: 'text-red-500' },
                            { label: 'Successful PIREPs', value: stats.flights, icon: Plane, color: 'text-green-500' },
                            { label: 'Fleet Strength', value: fleet.length || '32', icon: Shield, color: 'text-amber-500' }
                        ].map((s, i) => (
                            <motion.div 
                                key={s.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 rounded-3xl bg-white/50 border border-slate-100 hover:border-red-600/30 transition-all group/card"
                            >
                                <s.icon className={`w-6 h-6 mb-4 ${s.color}`} />
                                <div className="text-4xl font-black italic text-slate-900 mb-1">{s.value}</div>
                                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{s.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
      </section>

      {/* Global Network - 3D Globe */}
      <section id="network" className="py-32 relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 h-[600px] relative">
                <div className="absolute inset-0 bg-red-600/10 blur-[100px] rounded-full scale-75"></div>
                <Globe
                    height={600}
                    width={600}
                    backgroundColor="rgba(0,0,0,0)"
                    globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
                    arcsData={globeData}
                    arcColor="color"
                    arcDashLength={0.4}
                    arcDashGap={4}
                    arcDashAnimateTime={2000}
                    arcStroke={1}
                />
            </div>
            <motion.div 
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="order-1 lg:order-2"
            >
                <div className="text-red-600 font-black uppercase tracking-[0.4em] text-[10px] mb-4">Our Presence</div>
                <h2 className="text-5xl font-black italic tracking-tighter mb-8 leading-none">CONNECTING THE <span className="text-red-600">WORLD.</span></h2>
                <p className="text-slate-600 text-lg mb-10 leading-relaxed font-medium">
                    From our hubs in Mumbai and Delhi, Kingfisher VA bridges continents. Explore our vast network of over 450+ routes meticulously planned for the ultimate simulation experience.
                </p>
                <div className="space-y-6">
                    {[
                        { title: 'Real-World Routes', desc: 'Sourced from active flight schedules.' },
                        { title: 'Dynamic Dispatch', desc: 'SimBrief integrated flight planning.' },
                        { title: 'Regional Dominance', desc: 'Unmatched coverage across South Asia.' }
                    ].map((feat, i) => (
                        <div key={i} className="flex gap-4 items-start group">
                            <div className="w-12 h-12 shrink-0 rounded-2xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 mb-1">{feat.title}</h4>
                                <p className="text-sm text-slate-500">{feat.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
      </section>

      {/* Live Map - Operations */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div>
                    <div className="text-red-600 font-black uppercase tracking-[0.4em] text-[10px] mb-4">Real-Time OPS</div>
                    <h2 className="text-5xl font-black italic tracking-tighter leading-none">LIVE OPERATIONS <span className="text-red-600">MAP.</span></h2>
                </div>
                <div className="flex gap-4">
                    <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Traffic: {liveFlights.length}</span>
                    </div>
                </div>
            </div>
            
            <div className="h-[700px] w-full rounded-[40px] overflow-hidden shadow-2xl border-8 border-white relative group">
                {/* @ts-ignore */}
                <MapContainer center={[20, 77]} zoom={5} style={{ height: '100%', width: '100%', filter: 'grayscale(0.2) contrast(1.1)' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    {liveFlights.map(f => (
                    /* @ts-ignore */
                    <Marker 
                        key={f.id} 
                        position={[f.lat, f.lng]} 
                        /* @ts-ignore */
                        icon={new L.DivIcon({
                            className: 'custom-plane-icon',
                            html: `<div style="transform: rotate(${f.heading}deg); transition: all 0.5s ease;"><img src="https://cdn-icons-png.flaticon.com/512/723/723955.png" style="width: 32px; height: 32px;" /></div>`,
                            iconSize: [32, 32],
                            iconAnchor: [16, 16]
                        })}
                    >
                        {/* @ts-ignore */}
                        <Tooltip permanent direction="top" offset={[0, -10]} className="bg-white/90 backdrop-blur-md border-none shadow-xl rounded-lg p-3">
                            <div className="flex flex-col gap-1">
                                <div className="text-xs font-black text-red-600">{f.flightNumber}</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase">{f.depIcao} → {f.arrIcao}</div>
                                <div className="flex gap-3 mt-2 border-t border-slate-100 pt-2">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] text-slate-400 uppercase">Altitude</span>
                                        <span className="text-[10px] font-bold">{f.alt} FT</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] text-slate-400 uppercase">Ground</span>
                                        <span className="text-[10px] font-bold">{f.groundSpeed} KT</span>
                                    </div>
                                </div>
                            </div>
                        </Tooltip>
                    </Marker>
                    ))}
                </MapContainer>
                <div className="absolute bottom-8 right-8 z-[1000] glass-panel p-6 rounded-3xl max-w-sm hidden md:block">
                    <div className="flex items-center gap-3 mb-4">
                        <Radio className="w-5 h-5 text-red-600 animate-pulse" />
                        <span className="font-bold text-sm">Active Communications</span>
                    </div>
                    <div className="space-y-3">
                        {liveFlights.slice(0, 3).map(f => (
                            <div key={f.id} className="text-[11px] text-slate-500 flex justify-between items-center bg-white/50 p-2 rounded-xl">
                                <span><strong className="text-slate-900">{f.pilot.firstName} {f.pilot.lastName[0]}.</strong> in {f.flightNumber}</span>
                                <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-black text-[8px]">{f.phase}</span>
                            </div>
                        ))}
                        {liveFlights.length === 0 && <div className="text-[11px] text-slate-400 italic">No flights currently active. Join the network!</div>}
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Meet the Founder & Staff */}
      <section id="staff" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
                <div className="text-red-600 font-black uppercase tracking-[0.4em] text-[10px] mb-4">Leadership</div>
                <h2 className="text-5xl font-black italic tracking-tighter mb-4">THE MINDS BEHIND <span className="text-red-600">KINGFISHER.</span></h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Founder */}
                <motion.div 
                    whileHover={{ y: -10 }}
                    className="glass-panel p-10 rounded-[40px] border-2 border-red-600/10 text-center relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-6">
                        <Shield className="w-8 h-8 text-red-600/20 group-hover:text-red-600 transition-colors" />
                    </div>
                    <div className="w-32 h-32 bg-slate-100 rounded-full mx-auto mb-8 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                        <img src="https://ui-avatars.com/api/?name=Kingfisher+Founder&background=c0121e&color=fff&size=256" alt="Founder" />
                    </div>
                    <h4 className="text-2xl font-black italic mb-2">Founder Name</h4>
                    <div className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-6 bg-red-50 py-1 px-3 rounded-full inline-block">Chief Executive Officer</div>
                    <p className="text-sm text-slate-500 leading-relaxed mb-8">
                        Visionary leader and aviation enthusiast, dedicated to creating the world's most immersive virtual flight experience.
                    </p>
                    <div className="flex justify-center gap-4">
                        <ExternalLink className="w-4 h-4 text-slate-300 hover:text-red-600 cursor-pointer" />
                        <Users className="w-4 h-4 text-slate-300 hover:text-red-600 cursor-pointer" />
                    </div>
                </motion.div>

                {/* Staff Placeholders */}
                {[
                    { role: 'Chief Operations Officer', name: 'Operational Lead' },
                    { role: 'Lead Developer', name: 'Technical Director' }
                ].map((s, i) => (
                    <motion.div 
                        key={i}
                        whileHover={{ y: -10 }}
                        className="glass-panel p-10 rounded-[40px] border border-slate-100 text-center group"
                    >
                        <div className="w-24 h-24 bg-slate-50 rounded-full mx-auto mb-8 flex items-center justify-center border-2 border-white shadow-lg">
                            <Users className="w-8 h-8 text-slate-200" />
                        </div>
                        <h4 className="text-xl font-bold mb-2">{s.name}</h4>
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-6">{s.role}</div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Ensuring the highest standards of realism and technical excellence across our global network.
                        </p>
                    </motion.div>
                ))}
            </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-center mb-16">
                <div>
                    <div className="text-red-600 font-black uppercase tracking-[0.4em] text-[10px] mb-4">Visuals</div>
                    <h2 className="text-5xl font-black italic tracking-tighter">FLEET <span className="text-red-600">GALLERY.</span></h2>
                </div>
                <button className="hidden sm:flex items-center gap-3 bg-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:border-red-600 transition-all">
                    View Full Gallery <ArrowUpRight className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    "https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&q=80&w=800",
                    "https://images.unsplash.com/photo-1556388158-158ea5ccacbd?auto=format&fit=crop&q=80&w=800",
                    "https://images.unsplash.com/photo-1520437358207-323b43b50729?auto=format&fit=crop&q=80&w=800",
                    "https://images.unsplash.com/photo-1506012733851-bb0755184526?auto=format&fit=crop&q=80&w=800"
                ].map((img, i) => (
                    <motion.div 
                        key={i}
                        whileHover={{ scale: 1.05 }}
                        className="h-64 rounded-3xl overflow-hidden relative group cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center">
                            <Camera className="text-white w-8 h-8" />
                        </div>
                        <img src={img} alt="Aviation" className="w-full h-full object-cover group-hover:blur-[2px] transition-all" />
                    </motion.div>
                ))}
            </div>
            
            <div className="mt-12 p-12 glass-panel rounded-[40px] text-center border-2 border-dashed border-slate-200">
                <Info className="w-8 h-8 text-slate-300 mx-auto mb-4" />
                <h4 className="font-bold text-slate-400 uppercase tracking-widest text-xs">More Photos Coming Soon</h4>
                <p className="text-[10px] text-slate-300 mt-2 uppercase">Submit your in-flight screenshots via Discord</p>
            </div>
        </div>
      </section>

      {/* Call to Action - Join Discord */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
            <div className="relative overflow-hidden bg-slate-900 rounded-[60px] p-20 text-center">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-[-50%] left-[-20%] w-[100%] h-[200%] bg-red-600/20 blur-[150px] animate-pulse"></div>
                </div>
                <div className="relative z-10">
                    <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white mb-8">
                        JOIN OUR <span className="text-red-600">DISCORD.</span>
                    </h2>
                    <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-12">
                        Become part of India's most active virtual aviation community. Events, support, and friendship await.
                    </p>
                    <button className="group flex items-center gap-4 bg-white text-slate-900 px-12 py-6 rounded-3xl text-sm font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all mx-auto shadow-2xl">
                        Join Community <ExternalLink className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-12 mb-20">
                <div className="col-span-2">
                    <div className="flex items-center gap-3 mb-8">
                        <img src="/logo.png" alt="Logo" className="w-10 h-10" />
                        <span className="font-black italic text-2xl tracking-tighter uppercase leading-none text-slate-900">Kingfisher VA</span>
                    </div>
                    <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
                        Kingfisher Virtual Airline is a non-profit organization for flight simulation enthusiasts. We are not affiliated with any real-world airline.
                    </p>
                </div>
                <div>
                    <h5 className="font-black uppercase tracking-widest text-[10px] text-slate-900 mb-8">Navigation</h5>
                    <ul className="space-y-4 text-sm text-slate-500 font-medium">
                        {['Operations', 'Leaderboard', 'Routes', 'Events', 'Privacy Policy'].map(i => (
                            <li key={i} className="hover:text-red-600 cursor-pointer transition-colors">{i}</li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h5 className="font-black uppercase tracking-widest text-[10px] text-slate-900 mb-8">Connect</h5>
                    <ul className="space-y-4 text-sm text-slate-500 font-medium">
                        {['Discord Server', 'Instagram', 'Twitter (X)', 'YouTube'].map(i => (
                            <li key={i} className="hover:text-red-600 cursor-pointer transition-colors">{i}</li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-slate-50 gap-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    © 2026 KINGFISHER VA · BUILT FOR VIRTUAL PILOTS
                </div>
                <div className="flex gap-8">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-red-600 cursor-pointer transition-colors">System Status: Online</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-red-600 cursor-pointer transition-colors">ACARS v2.4.0</span>
                </div>
            </div>
        </div>
      </footer>
    </div>
  )
}
