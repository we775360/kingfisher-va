import { useEffect, useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
// @ts-ignore
import 'leaflet/dist/leaflet.css'
import {
  LayoutDashboard, Plane, FileText, BookOpen,
  User, Trophy, Map as MapIcon, Calendar, LogOut,
  Clock, Hash, TrendingUp, Sun, Moon,
  Bell, Settings, ChevronLeft,
  AlertTriangle, Wind, Thermometer, Eye,
  Activity, Globe, Users, BarChart3,
  Menu, Shield, Headphones, DollarSign,
  Navigation, Radio, CloudRain, Gauge, ArrowRight,
  List, X, ExternalLink, Monitor, Download
} from 'lucide-react'
import { useAuthStore } from '../store/auth.store'
import { useThemeStore } from '../store/theme.store'
import api from '../lib/axios'

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
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const NAV_SECTIONS = [
  {
    title: 'Operations',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: MapIcon, label: 'Network Map', path: '/live-map' },
      { icon: Activity, label: 'Live Tracking', path: '/live-flights' },
    ]
  },
  {
    title: 'Flight Deck',
    items: [
      { icon: Plane, label: 'Assignments', path: '/flights' },
      { icon: FileText, label: 'Manual PIREP', path: '/pirep' },
      { icon: BookOpen, label: 'Mission Log', path: '/logbook' },
      { icon: DollarSign, label: 'Payroll', path: '/wallet' },
    ]
  },
  {
    title: 'Personnel',
    items: [
      { icon: User, label: 'Service Record', path: '/profile' },
      { icon: Trophy, label: 'Awards', path: '/awards' },
      { icon: BarChart3, label: 'Analytics', path: '/stats' },
    ]
  },
]

export default function Dashboard() {
  const { logout, isAuthenticated } = useAuthStore()
  const { isDark, toggle } = useThemeStore()
  const navigate = useNavigate()
  const location = useLocation()

  const [pilotData, setPilotData] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [pireps, setPireps] = useState<any[]>([])
  const [liveFlights, setLiveFlights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [gmtTime, setGmtTime] = useState('')

  const sidebarW = collapsed ? '80px' : '280px'

  const t = {
    bg: isDark ? '#080808' : '#f8f9fa',
    sidebar: isDark ? '#0d0d0d' : '#ffffff',
    card: isDark ? '#121212' : '#ffffff',
    border: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    text: isDark ? '#ffffff' : '#000000',
    accent: '#c0121e',
  }

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setGmtTime(now.getUTCHours().toString().padStart(2, '0') + ':' + now.getUTCMinutes().toString().padStart(2, '0') + 'Z')
    }
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return }
    fetchAll()
    const i = setInterval(fetchLive, 30000)
    return () => clearInterval(i)
  }, [isAuthenticated])

  const fetchLive = async () => {
    try {
      const l = await fetch('https://kingfisher-api.onrender.com/api/v1/public/live-flights').then(r => r.json())
      if (Array.isArray(l)) setLiveFlights(l)
    } catch (e) {}
  }

  const fetchAll = async () => {
    try {
      const [me, b, p] = await Promise.all([
        api.get('/auth/me'),
        api.get('/bookings/my'),
        api.get('/pireps/my'),
      ])
      setPilotData(me.data)
      setBookings(b.data)
      setPireps(p.data)
      fetchLive()
    } catch {
      logout(); navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#050505]">
       <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const pilot = pilotData?.pilot

  return (
    <div className="min-h-screen flex overflow-hidden font-sans" style={{ background: t.bg, color: t.text }}>
      
      {/* ── SIDEBAR ── */}
      <aside 
        className="hidden md:flex flex-col z-50 border-r transition-all duration-500"
        style={{ width: sidebarW, background: t.sidebar, borderColor: t.border }}
      >
        <div className="h-20 flex items-center px-6 border-b" style={{ borderColor: t.border }}>
           <img src="/logo.png" className="w-10 h-10 object-contain" />
           {!collapsed && (
             <div className="ml-4">
                <div className="font-black italic tracking-tighter leading-none text-lg">KINGFISHER</div>
                <div className="text-[8px] font-black text-red-600 tracking-[0.3em] uppercase">Operations</div>
             </div>
           )}
        </div>

        <div className="flex-1 overflow-y-auto py-8 px-4 space-y-8 scrollbar-hide">
           {NAV_SECTIONS.map(s => (
             <div key={s.title}>
                {!collapsed && <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4 px-2">{s.title}</div>}
                <div className="space-y-1">
                   {s.items.map(i => (
                     <Link 
                       key={i.path} 
                       to={i.path}
                       className={`flex items-center gap-4 p-3 rounded-xl transition-all ${location.pathname === i.path ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'hover:bg-white/5 text-zinc-400 hover:text-white'}`}
                     >
                        <i.icon size={20} strokeWidth={2.5} />
                        {!collapsed && <span className="text-sm font-black italic tracking-tight">{i.label}</span>}
                     </Link>
                   ))}
                </div>
             </div>
           ))}
        </div>

        <div className="p-4 border-t" style={{ borderColor: t.border }}>
           <button 
             onClick={() => setCollapsed(!collapsed)}
             className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-white/5 transition-colors text-zinc-500"
           >
              <ChevronLeft className={`transition-transform duration-500 ${collapsed ? 'rotate-180' : ''}`} />
           </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 flex items-center justify-between px-8 border-b z-40 sticky top-0 bg-opacity-80 backdrop-blur-xl" style={{ borderColor: t.border, background: t.bg }}>
           <div className="flex items-center gap-6">
              <button className="md:hidden" onClick={() => setMobileSidebarOpen(true)}><Menu /></button>
              <div>
                 <h2 className="text-xl font-black italic tracking-tighter leading-none uppercase">Service Dashboard</h2>
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Personnel: {pilot?.pilotId} • {pilot?.rank}</p>
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-zinc-900/50 rounded-full border border-white/5">
                 <Clock size={14} className="text-red-600" />
                 <span className="text-xs font-black tracking-widest font-mono">{gmtTime}</span>
              </div>
              <div className="h-10 w-[1px] bg-white/5" />
              <div className="flex items-center gap-4">
                 <div className="text-right hidden sm:block">
                    <div className="text-sm font-black italic tracking-tighter leading-none">{pilot?.firstName} {pilot?.lastName}</div>
                    <div className="text-[9px] font-bold text-red-600 uppercase tracking-widest mt-1">${pilot?.walletBalance?.toFixed(0)} SALARY</div>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center font-black italic text-red-600">
                    {pilot?.firstName?.[0]}{pilot?.lastName?.[0]}
                 </div>
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
           
           {/* Primary Stats Grid */}
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Flight Hours" value={pilot?.totalHours?.toFixed(1) || '0.0'} icon={<Clock />} color="text-red-600" />
              <StatCard label="Total PIREPs" value={pilot?.totalFlights || '0'} icon={<FileText />} color="text-blue-500" />
              <StatCard label="Pilot Points" value={pilot?.points || '0'} icon={<Trophy />} color="text-yellow-500" />
              <StatCard label="Service Status" value="ACTIVE" icon={<Shield />} color="text-green-500" />
           </div>

           {/* Live Tracking Map Component */}
           <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                 <div className="relative h-[450px] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl group">
                    <div className="absolute top-6 left-6 z-[500] flex items-center gap-3 px-4 py-2 bg-black/80 backdrop-blur-md rounded-2xl border border-white/10">
                       <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Network Operational Map</span>
                    </div>
                    
                    {/* @ts-ignore */}
                    <MapContainer center={[20, 77]} zoom={4} style={{ height: '100%', width: '100%', background: '#080808' }} zoomControl={false}>
                       <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                       {liveFlights.map(f => (
                         /* @ts-ignore */
                         <Marker key={f.id} position={[f.lat, f.lng]} icon={planeIcon}>
                           {/* @ts-ignore */}
                           <Tooltip permanent direction="top" className="map-tooltip-mini">
                              <div className="text-[8px] font-black uppercase">{f.flightNumber}</div>
                           </Tooltip>
                         </Marker>
                       ))}
                    </MapContainer>

                    {/* Map Footer */}
                    <div className="absolute bottom-6 left-6 right-6 z-[500] flex justify-between items-center pointer-events-none">
                       <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest pointer-events-auto">
                          {liveFlights.length} Flights Currently Tracked
                       </div>
                       <Link to="/live-map" className="bg-red-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest pointer-events-auto hover:bg-red-700 transition-all flex items-center gap-2">
                          Operations Center <ArrowRight size={12} />
                       </Link>
                    </div>
                 </div>

                 {/* Recent Activity */}
                 <div className="bg-[#0c0c0c] rounded-[2.5rem] border border-white/5 p-8">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-xl font-black italic tracking-tighter uppercase">Recent Service Log</h3>
                       <Link to="/logbook" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-red-600 transition-colors">Full Record →</Link>
                    </div>
                    <div className="space-y-4">
                       {pireps.length === 0 ? (
                         <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                            <BookOpen className="mx-auto text-zinc-800 mb-4" size={32} />
                            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">No missions recorded yet</p>
                         </div>
                       ) : (
                         pireps.slice(0, 3).map(p => (
                           <div key={p.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-red-600/30 transition-all group">
                              <div className="flex items-center gap-6">
                                 <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center border border-white/10 group-hover:border-red-600/20">
                                    <Plane className="text-zinc-600 group-hover:text-red-600" size={18} />
                                 </div>
                                 <div>
                                    <div className="text-red-600 text-[10px] font-black tracking-widest">{p.flightNumber}</div>
                                    <div className="font-black italic text-lg tracking-tight uppercase">{p.depIcao} → {p.arrIcao}</div>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <div className={`text-[10px] font-black uppercase px-3 py-1 rounded-full mb-1 ${p.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                    {p.status}
                                 </div>
                                 <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{new Date(p.depTime).toLocaleDateString()}</div>
                              </div>
                           </div>
                         ))
                       )}
                    </div>
                 </div>
              </div>

              {/* Sidebar Cards */}
              <div className="space-y-8">
                 {/* Assignments Card */}
                 <div className="bg-red-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-red-600/20 group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <Plane className="w-12 h-12 mb-6 opacity-40 group-hover:scale-110 transition-transform" />
                    <h3 className="text-3xl font-black italic tracking-tighter leading-tight mb-4 uppercase">Pending <br />Assignments</h3>
                    <p className="text-red-100 text-sm font-medium mb-8 leading-relaxed opacity-80">You have {bookings.length} operational tasks scheduled for departure.</p>
                    <Link to="/flights" className="inline-flex items-center gap-3 px-8 py-4 bg-white text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-100 transition-all">
                       Open Ops <ArrowRight size={14} />
                    </Link>
                 </div>

                 {/* ACARS Link Card */}
                 <div className="bg-[#121212] rounded-[2.5rem] border border-white/10 p-8 group">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/5 group-hover:border-red-600/30 transition-all">
                       <Monitor className="text-zinc-500 group-hover:text-red-600" />
                    </div>
                    <h4 className="text-xl font-black italic tracking-tighter uppercase mb-2">Download ACARS</h4>
                    <p className="text-zinc-500 text-xs font-medium leading-relaxed mb-6">Synchronize your simulator with our operations core. v1.1.0 Stable ready.</p>
                    <a href="#" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group/link">
                       <span className="text-[10px] font-black uppercase tracking-widest">Get Installer</span>
                       <Download size={14} className="group-hover/link:translate-y-1 transition-transform" />
                    </a>
                 </div>

                 {/* Discord Card */}
                 <div className="bg-[#5865F2]/10 rounded-[2.5rem] border border-[#5865F2]/20 p-8 group">
                    <div className="w-12 h-12 bg-[#5865F2]/20 rounded-2xl flex items-center justify-center mb-6">
                       <Radio className="text-[#5865F2]" />
                    </div>
                    <h4 className="text-xl font-black italic tracking-tighter uppercase mb-2 text-[#5865F2]">COMMS Center</h4>
                    <p className="text-zinc-500 text-xs font-medium leading-relaxed mb-6">Join the pilot frequencies on our official Discord server.</p>
                    <a href="https://discord.gg/Y7hxzG76" target="_blank" className="flex items-center justify-between p-4 bg-[#5865F2] rounded-2xl text-white transition-all hover:bg-[#4752c4]">
                       <span className="text-[10px] font-black uppercase tracking-widest text-white">Join Frequency</span>
                       <ExternalLink size={14} />
                    </a>
                 </div>
              </div>
           </div>
        </div>

        <footer className="h-14 flex items-center justify-between px-8 border-t opacity-50" style={{ borderColor: t.border }}>
           <div className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Kingfisher Custom ACARS · v1.1.0 · Founded 2026</div>
           <div className="flex gap-6">
              <button className="text-[9px] font-bold text-zinc-500 hover:text-red-600 uppercase tracking-widest">Privacy</button>
              <button className="text-[9px] font-bold text-zinc-500 hover:text-red-600 uppercase tracking-widest">Terms</button>
           </div>
        </footer>
      </main>

      {/* MOBILE SIDEBAR */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 z-[2000] backdrop-blur-md" onClick={() => setMobileSidebarOpen(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed inset-y-0 left-0 w-80 bg-zinc-950 z-[2001] p-10 flex flex-col">
               <div className="flex items-center justify-between mb-12">
                  <img src="/logo.png" className="w-12 h-12" />
                  <button onClick={() => setMobileSidebarOpen(false)}><X /></button>
               </div>
               <div className="flex-1 space-y-8">
                  {NAV_SECTIONS.flatMap(s => s.items).map(i => (
                    <Link key={i.path} to={i.path} className="flex items-center gap-6 text-2xl font-black italic tracking-tighter uppercase text-zinc-500 hover:text-white transition-all" onClick={() => setMobileSidebarOpen(false)}>
                       <i.icon size={24} className="text-red-600" />
                       {i.label}
                    </Link>
                  ))}
               </div>
               <button onClick={() => { logout(); navigate('/') }} className="flex items-center gap-4 text-red-600 font-black uppercase tracking-widest text-sm">
                  <LogOut /> Terminate Session
               </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .map-tooltip-mini { background: #000 !important; border: 1px solid rgba(220,38,38,0.3) !important; color: #fff !important; box-shadow: none !important; border-radius: 4px !important; padding: 2px 6px !important; }
        .leaflet-container { background: #080808 !important; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-[#0c0c0c] border border-white/5 p-6 rounded-[2rem] hover:border-white/10 transition-all">
       <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</div>
          <div className={`p-2 bg-zinc-900 rounded-xl ${color}`}>{icon}</div>
       </div>
       <div className="text-3xl font-black italic tracking-tighter uppercase">{value}</div>
    </div>
  )
}
