import { useEffect, useState, useMemo } from 'react'
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
  List, X, ExternalLink, Monitor, Download,
  Zap, Info, MapPin, Landmark, Award, ArrowUpRight
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
      { icon: LayoutDashboard, label: 'Control Center', path: '/dashboard' },
      { icon: MapIcon, label: 'Live Network', path: '/routes' },
      { icon: Activity, label: 'Radar Scope', path: '/live-map' },
    ]
  },
  {
    title: 'Flight Deck',
    items: [
      { icon: Plane, label: 'Duty Roster', path: '/flights' },
      { icon: Shield, label: 'Realistic Ops', path: '/realistic-flights' },
      { icon: FileText, label: 'Submit PIREP', path: '/pirep' },
      { icon: BookOpen, label: 'Flight Logs', path: '/logbook' },
      { icon: DollarSign, label: 'Financials', path: '/wallet' },
    ]
  },
  {
    title: 'Personnel',
    items: [
      { icon: User, label: 'Pilot Profile', path: '/profile' },
      { icon: Trophy, label: 'Hall of Fame', path: '/awards' },
      { icon: Settings, label: 'System Config', path: '/settings' },
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
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [gmtTime, setGmtTime] = useState('')

  const sidebarW = collapsed ? '80px' : '300px'

  const theme = useMemo(() => ({
    bg: isDark ? 'bg-[#050505]' : 'bg-[#f0f2f5]',
    sidebar: isDark ? 'bg-[#080808]' : 'bg-white',
    card: isDark ? 'bg-[#0c0c0c] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-sm',
    header: isDark ? 'bg-[#050505]/80' : 'bg-white/80',
    border: isDark ? 'border-white/5' : 'border-slate-200',
    text: isDark ? 'text-white' : 'text-slate-900',
    textMuted: isDark ? 'text-zinc-500' : 'text-slate-400',
    navActive: 'bg-red-600 text-white shadow-lg shadow-red-600/20',
    navHover: isDark ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-slate-50 text-slate-500',
  }), [isDark])

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
      const l = await api.get('/public/live-flights').then(r => r.data)
      if (Array.isArray(l)) setLiveFlights(l)
    } catch (e) {}
  }

  const fetchAll = async () => {
    try {
      const [me, b, p, a] = await Promise.all([
        api.get('/auth/me'),
        api.get('/bookings/my'),
        api.get('/pireps/my'),
        api.get('/public/announcements').then(r => r.data).catch(() => [])
      ])
      setPilotData(me.data)
      setBookings(b.data)
      setPireps(p.data)
      setAnnouncements(Array.isArray(a) ? a : [])
      fetchLive()
    } catch {
      handleLogout()
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (loading) return (
    <div className={`h-screen flex items-center justify-center ${isDark ? 'bg-[#050505]' : 'bg-white'}`}>
       <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const pilot = pilotData?.pilot

  return (
    <div className={`min-h-screen flex overflow-hidden font-sans transition-colors duration-500 ${theme.bg} ${theme.text}`}>
      
      {/* ── SIDEBAR ── */}
      <aside 
        className={`hidden md:flex flex-col z-50 border-r transition-all duration-500 ${theme.sidebar} ${theme.border}`}
        style={{ width: sidebarW }}
      >
        <div className={`h-24 flex items-center px-8 border-b ${theme.border}`}>
           <img src="/logo.png" className="w-10 h-10 object-contain" />
           {!collapsed && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-4">
                <div className="font-black italic tracking-tighter leading-none text-xl text-red-600">KINGFISHER</div>
                <div className={`text-[8px] font-black ${theme.textMuted} tracking-[0.4em] uppercase mt-1`}>Flight Operations</div>
             </motion.div>
           )}
        </div>

        <div className="flex-1 overflow-y-auto py-10 px-4 space-y-10 scrollbar-hide">
           {NAV_SECTIONS.map(s => (
             <div key={s.title}>
                {!collapsed && <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-6 px-4">{s.title}</div>}
                <div className="space-y-1.5">
                   {s.items.map(i => (
                     <Link 
                       key={i.path} 
                       to={i.path}
                       className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${location.pathname === i.path ? theme.navActive : theme.navHover}`}
                     >
                        <i.icon size={20} strokeWidth={2.5} className={location.pathname === i.path ? 'text-white' : 'text-zinc-500'} />
                        {!collapsed && <span className="text-xs font-black uppercase tracking-widest italic">{i.label}</span>}
                     </Link>
                   ))}
                </div>
             </div>
           ))}
        </div>

        <div className={`p-6 border-t ${theme.border}`}>
           <button 
             onClick={() => setCollapsed(!collapsed)}
             className={`w-full flex items-center justify-center p-4 rounded-2xl transition-all ${theme.navHover}`}
           >
              <ChevronLeft className={`transition-transform duration-500 ${collapsed ? 'rotate-180' : ''}`} />
           </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className={`h-24 flex items-center justify-between px-10 border-b z-40 sticky top-0 backdrop-blur-xl ${theme.header} ${theme.border}`}>
           <div className="flex items-center gap-8">
              <button className="md:hidden p-2" onClick={() => setMobileSidebarOpen(true)}><Menu /></button>
              <div>
                 <h2 className="text-2xl font-black italic tracking-tighter leading-none uppercase">Duty Control</h2>
                 <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">{pilot?.pilotId}</span>
                    <span className={`w-1 h-1 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                    <span className={`text-[10px] font-bold ${theme.textMuted} uppercase tracking-widest`}>{pilot?.rank}</span>
                 </div>
              </div>
           </div>
           
           <div className="flex items-center gap-8">
              <button onClick={toggle} className={`p-3 rounded-2xl border transition-all ${theme.border} ${theme.navHover}`}>
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              <div className={`hidden lg:flex items-center gap-4 px-6 py-3 rounded-2xl border font-mono ${isDark ? 'bg-white/5' : 'bg-slate-50'} ${theme.border}`}>
                 <Clock size={16} className="text-red-600" />
                 <span className="text-sm font-black tracking-widest">{gmtTime}</span>
              </div>

              <div className="flex items-center gap-6">
                 <div className="text-right hidden sm:block">
                    <div className="text-sm font-black italic tracking-tighter leading-none">{pilot?.firstName} {pilot?.lastName}</div>
                    <div className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] mt-2 leading-none">
                       {pilot?.walletBalance?.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} SALARY
                    </div>
                 </div>
                 <div className="relative group/user">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${isDark ? 'from-zinc-800 to-black' : 'from-slate-100 to-slate-200'} border ${theme.border} flex items-center justify-center font-black italic text-red-600 text-lg shadow-inner cursor-pointer`}>
                        {pilot?.firstName?.[0]}{pilot?.lastName?.[0]}
                    </div>
                    {/* Increased height of the invisible bridge to prevent dropdown from disappearing */}
                    <div className="absolute top-10 right-0 pt-6 opacity-0 group-hover/user:opacity-100 pointer-events-none group-hover/user:pointer-events-auto transition-all translate-y-2 group-hover/user:translate-y-0 z-50">
                        <div className={`${theme.card} p-2 rounded-2xl min-w-[180px] shadow-2xl`}>
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 rounded-xl text-red-600 hover:bg-red-600/10 transition-all font-black uppercase text-[10px] tracking-widest">
                                <LogOut size={16} /> Terminate Session
                            </button>
                        </div>
                    </div>
                 </div>
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
           
           {/* Dynamic NOTAMS */}
           {announcements.length > 0 ? announcements.map((a, i) => (
             <motion.div 
               key={a.id}
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className={`p-6 rounded-[2.5rem] border ${isDark ? 'bg-red-600/5 border-red-600/20' : 'bg-red-50 border-red-100'} flex items-center justify-between gap-6 group`}
             >
                <div className="flex items-center gap-6">
                   <div className={`w-12 h-12 rounded-2xl ${isDark ? 'bg-red-600/20' : 'bg-red-500'} flex items-center justify-center text-white`}>
                      <AlertTriangle size={24} className={a.isPinned ? "animate-pulse" : ""} />
                   </div>
                   <div>
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-red-600">{a.title}</h4>
                      <p className={`text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-slate-600'} mt-1`}>{a.content}</p>
                   </div>
                </div>
                <div className={`px-4 py-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'} text-[8px] font-black uppercase tracking-widest text-zinc-500`}>
                   {new Date(a.createdAt).toLocaleDateString()}
                </div>
             </motion.div>
           )) : (
            <div className={`p-6 rounded-[2.5rem] border ${theme.border} flex items-center gap-6 opacity-40`}>
                <Info size={20} className="text-zinc-500" />
                <span className="text-xs font-black uppercase tracking-widest">No active NOTAMS at this frequency</span>
            </div>
           )}

           {/* Primary Stats Grid */}
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard label="Air Time" value={`${pilot?.totalHours?.toFixed(1) || '0.0'} HRS`} icon={<Clock />} color="text-red-600" isDark={isDark} />
              <StatCard label="Missions" value={pilot?.totalFlights || '0'} icon={<Navigation />} color="text-blue-500" isDark={isDark} />
              <StatCard label="Performance" value={pilot?.points || '0'} icon={<Trophy />} color="text-amber-500" isDark={isDark} />
              <StatCard label="Status" value="ACTIVE" icon={<Shield />} color="text-green-500" isDark={isDark} />
           </div>

           <div className="grid lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-10">
                 {/* Live Map */}
                 <div className={`relative h-[550px] rounded-[3rem] overflow-hidden border ${theme.border} shadow-2xl group transition-all duration-700`}>
                    <div className="absolute top-8 left-8 z-[500] flex items-center gap-4 px-6 py-3 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10">
                       <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
                       <span className="text-xs font-black uppercase tracking-[0.3em] text-white">Radar Scope: {liveFlights.length} In Flight</span>
                    </div>
                    
                    {/* @ts-ignore */}
                    <MapContainer center={[20, 77]} zoom={4} style={{ height: '100%', width: '100%', background: isDark ? '#080808' : '#eef2f5' }} zoomControl={false}>
                       <TileLayer url={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"} />
                       {liveFlights.map(f => (
                         /* @ts-ignore */
                         <Marker key={f.id} position={[f.lat, f.lng]} icon={planeIcon}>
                           {/* @ts-ignore */}
                           <Tooltip permanent direction="top" className="map-tooltip-mini">
                              <div className="text-[10px] font-black uppercase tracking-widest">{f.flightNumber}</div>
                           </Tooltip>
                         </Marker>
                       ))}
                    </MapContainer>

                    <div className="absolute bottom-8 left-8 right-8 z-[500] flex justify-between items-center pointer-events-none">
                       <div className="bg-black/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10 text-[10px] font-black text-zinc-400 uppercase tracking-widest pointer-events-auto">
                          Global Traffic Synchronization Active
                       </div>
                       <Link to="/live-map" className="bg-red-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] pointer-events-auto hover:bg-red-700 transition-all flex items-center gap-3 shadow-xl shadow-red-600/20">
                          Radar Fullscreen <ArrowRight size={14} />
                       </Link>
                    </div>
                 </div>

                 {/* Recent Activity */}
                 <div className={`${theme.card} rounded-[3rem] p-10 transition-colors duration-500`}>
                    <div className="flex items-center justify-between mb-10">
                       <div>
                          <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Flight History</h3>
                          <p className={`text-[10px] font-bold ${theme.textMuted} uppercase tracking-widest mt-2`}>Recent service record across the network</p>
                       </div>
                       <Link to="/logbook" className="p-4 rounded-2xl border border-current/10 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Archive →</Link>
                    </div>
                    <div className="space-y-4">
                       {pireps.length === 0 ? (
                         <div className={`py-20 text-center border-2 border-dashed ${theme.border} rounded-[2.5rem]`}>
                            <BookOpen className={`mx-auto ${theme.textMuted} mb-6 opacity-20`} size={48} />
                            <p className={`text-xs font-black ${theme.textMuted} uppercase tracking-[0.4em]`}>No recent entries</p>
                         </div>
                       ) : (
                         pireps.slice(0, 3).map(p => (
                           <motion.div 
                             whileHover={{ x: 10 }}
                             key={p.id} 
                             className={`flex items-center justify-between p-6 rounded-[2rem] ${isDark ? 'bg-white/5' : 'bg-slate-50'} border ${theme.border} hover:border-red-600/30 transition-all group`}
                           >
                              <div className="flex items-center gap-8">
                                 <div className={`w-14 h-14 ${isDark ? 'bg-black' : 'bg-white shadow-sm'} rounded-2xl flex items-center justify-center border ${theme.border} group-hover:border-red-600/20`}>
                                    <Plane className="text-zinc-500 group-hover:text-red-600" size={20} />
                                 </div>
                                 <div>
                                    <div className="text-red-600 text-[10px] font-black tracking-[0.3em] uppercase">{p.flightNumber}</div>
                                    <div className="font-black italic text-xl tracking-tighter uppercase mt-1">{p.depIcao} <ArrowRight size={14} className="inline mx-2" /> {p.arrIcao}</div>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <div className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full mb-2 ${p.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                    {p.status}
                                 </div>
                                 <div className={`text-[10px] font-bold ${theme.textMuted} uppercase tracking-widest`}>{new Date(p.depTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                              </div>
                           </motion.div>
                         ))
                       )}
                    </div>
                 </div>
              </div>

              {/* Action Sidebar */}
              <div className="space-y-10">
                 {/* Assignments */}
                 <div className="bg-red-600 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-red-600/30 group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                    <Zap className="w-14 h-14 mb-8 opacity-40 group-hover:scale-110 transition-transform" />
                    <h3 className="text-4xl font-black italic tracking-tighter leading-tight mb-6 uppercase">Pending <br />Duty</h3>
                    <p className="text-red-100 text-sm font-bold mb-10 leading-relaxed opacity-80 uppercase tracking-widest">System has {bookings.length} operational tasks awaiting departure.</p>
                    <Link to="/flights" className="flex items-center justify-center gap-4 w-full py-5 bg-white text-red-600 rounded-2xl text-xs font-black uppercase tracking-[0.3em] hover:bg-slate-50 transition-all shadow-xl shadow-black/10">
                       Start Flight <ArrowUpRight size={18} />
                    </Link>
                 </div>

                 {/* ACARS */}
                 <div className={`${theme.card} rounded-[3rem] p-10 group transition-all`}>
                    <div className={`w-14 h-14 ${isDark ? 'bg-white/5' : 'bg-slate-100'} rounded-[1.5rem] flex items-center justify-center mb-8 border ${theme.border} group-hover:border-red-600/30 transition-all`}>
                       <Monitor className="text-zinc-500 group-hover:text-red-600" size={24} />
                    </div>
                    <h4 className="text-2xl font-black italic tracking-tighter uppercase mb-3">Next-Gen ACARS</h4>
                    <p className={`${theme.textMuted} text-xs font-bold leading-relaxed mb-10 uppercase tracking-widest`}>v1.1.0 STABLE · LIVE TELEMETRY · GLOBAL DISPATCH</p>
                    <a href="https://github.com/we775360/kingfisher-va/releases/latest" target="_blank" rel="noreferrer" className={`flex items-center justify-between p-5 ${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-2xl border ${theme.border} hover:bg-red-600 hover:text-white transition-all group/link`}>
                       <span className="text-[10px] font-black uppercase tracking-[0.2em]">Download Hub</span>
                       <Download size={18} className="group-hover/link:translate-y-1 transition-transform" />
                    </a>
                 </div>

                 {/* Discord */}
                 <div className={`bg-[#5865F2]/5 rounded-[3rem] border border-[#5865F2]/10 p-10 group`}>
                    <div className="w-14 h-14 bg-[#5865F2]/20 rounded-[1.5rem] flex items-center justify-center mb-8">
                       <Radio className="text-[#5865F2]" size={24} />
                    </div>
                    <h4 className="text-2xl font-black italic tracking-tighter uppercase mb-3 text-[#5865F2]">Live COMMS</h4>
                    <p className={`${theme.textMuted} text-xs font-bold leading-relaxed mb-10 uppercase tracking-widest`}>Official Frequency · Pilot Lounge · Operations Support</p>
                    <a href="https://discord.gg/jefmDpfa" target="_blank" className="flex items-center justify-between p-5 bg-[#5865F2] rounded-2xl text-white transition-all hover:bg-[#4752c4] shadow-xl shadow-[#5865F2]/20">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em]">Connect Now</span>
                       <ExternalLink size={18} />
                    </a>
                 </div>
              </div>
           </div>
        </div>

        <footer className={`h-20 flex items-center justify-between px-10 border-t ${theme.border} opacity-40 transition-colors duration-500`}>
           <div className={`text-[10px] font-black uppercase tracking-[0.4em] ${theme.textMuted}`}>Kingfisher ACARS Engine · Enterprise Edition · v1.1.0</div>
           <div className="flex gap-10">
              <Link to="/privacy" className={`text-[10px] font-black ${theme.textMuted} hover:text-red-600 uppercase tracking-widest transition-colors`}>Privacy Policy</Link>
              <Link to="/handbook" className={`text-[10px] font-black ${theme.textMuted} hover:text-red-600 uppercase tracking-widest transition-colors`}>Handbook</Link>
           </div>
        </footer>
      </main>

      {/* MOBILE SIDEBAR */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-[2000] backdrop-blur-2xl" onClick={() => setMobileSidebarOpen(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 30 }} className={`fixed inset-y-0 left-0 w-[85%] ${isDark ? 'bg-[#080808]' : 'bg-white'} z-[2001] p-12 flex flex-col shadow-2xl`}>
               <div className="flex items-center justify-between mb-16">
                  <div className="flex items-center gap-4">
                     <img src="/logo.png" className="w-12 h-12" />
                     <div className="font-black italic tracking-tighter uppercase text-xl text-red-600">Kingfisher</div>
                  </div>
                  <button onClick={() => setMobileSidebarOpen(false)} className={`p-2 ${theme.textMuted}`}><X size={32} /></button>
               </div>
               <div className="flex-1 space-y-10 overflow-y-auto scrollbar-hide">
                  {NAV_SECTIONS.flatMap(s => s.items).map(i => (
                    <Link key={i.path} to={i.path} className="flex items-center gap-8 text-3xl font-black italic tracking-tighter uppercase text-zinc-500 hover:text-red-600 transition-all" onClick={() => setMobileSidebarOpen(false)}>
                       <i.icon size={28} className="text-red-600" />
                       {i.label}
                    </Link>
                  ))}
               </div>
               <button onClick={handleLogout} className="flex items-center gap-6 text-red-600 font-black uppercase tracking-[0.3em] text-sm pt-12 border-t border-current/10">
                  <LogOut size={24} /> Terminate
               </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .map-tooltip-mini { background: #000 !important; border: 1px solid rgba(220,38,38,0.4) !important; color: #fff !important; box-shadow: 0 5px 15px rgba(0,0,0,0.5) !important; border-radius: 8px !important; padding: 4px 10px !important; }
        .leaflet-container { background: ${isDark ? '#080808' : '#eef2f5'} !important; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}

function StatCard({ label, value, icon, color, isDark }: { label: string, value: string, icon: React.ReactNode, color: string, isDark: boolean }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`${isDark ? 'bg-[#0c0c0c] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-sm'} border p-8 rounded-[2.5rem] hover:border-red-600/20 transition-all`}
    >
       <div className="flex items-center justify-between mb-8">
          <div className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>{label}</div>
          <div className={`p-3 ${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-2xl ${color} border ${isDark ? 'border-white/5' : 'border-slate-100'}`}>{icon}</div>
       </div>
       <div className={`text-4xl font-black italic tracking-tighter uppercase ${!isDark && 'text-slate-900'}`}>{value}</div>
    </motion.div>
  )
}
