import { useEffect, useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Plane, FileText, BookOpen,
  User, Trophy, Map, Calendar, LogOut,
  Clock, Hash, TrendingUp, Sun, Moon,
  Bell, Settings, ChevronLeft,
  AlertTriangle, Wind, Thermometer, Eye,
  Activity, Globe, Users, BarChart3,
  Menu, Shield, Headphones, DollarSign,
  Navigation, Radio, CloudRain, Gauge, ArrowRight
} from 'lucide-react'
import { useAuthStore } from '../store/auth.store'
import { useThemeStore } from '../store/theme.store'
import api from '../lib/axios'

const NAV_SECTIONS = [
  {
    title: 'Main',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Map, label: 'Live Map', path: '/live-map' },
      { icon: Activity, label: 'Live Flights', path: '/live-flights' },
    ]
  },
  {
    title: 'My Flying',
    items: [
      { icon: Plane, label: 'Book a Flight', path: '/flights' },
      { icon: FileText, label: 'File PIREP', path: '/pirep' },
      { icon: BookOpen, label: 'Logbook', path: '/logbook' },
      { icon: DollarSign, label: 'My Wallet', path: '/wallet' },
      { icon: Navigation, label: 'Browse Routes', path: '/routes' },
    ]
  },
  {
    title: 'Pilot',
    items: [
      { icon: User, label: 'My Profile', path: '/profile' },
      { icon: Trophy, label: 'Awards', path: '/awards' },
      { icon: BarChart3, label: 'Statistics', path: '/stats' },
      { icon: Calendar, label: 'Events', path: '/events' },
    ]
  },
  {
    title: 'Community',
    items: [
      { icon: Users, label: 'Roster', path: '/roster' },
      { icon: Globe, label: 'Forums', path: '/forums' },
      { icon: Radio, label: 'VATSIM / IVAO', path: '/atc' },
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
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [pinned, setPinned] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [gmtTime, setGmtTime] = useState('')
  const [gmtDate, setGmtDate] = useState('')

  const isExpanded = pinned ? !collapsed : hovered
  const sidebarW = isExpanded ? '260px' : '72px'

  const t = {
    bg: isDark ? '#0f0f0f' : '#f0f2f5',
    sidebar: isDark ? '#0a0a0a' : '#ffffff',
    card: isDark ? '#141414' : '#ffffff',
    border: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    text: isDark ? '#ffffff' : '#0a0a0a',
    textSub: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
    textMuted: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
    navActive: isDark ? 'rgba(192,18,30,0.15)' : 'rgba(192,18,30,0.08)',
    navHover: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    badge: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
  }

  // GMT Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const hh = String(now.getUTCHours()).padStart(2, '0')
      const mm = String(now.getUTCMinutes()).padStart(2, '0')
      const ss = String(now.getUTCSeconds()).padStart(2, '0')
      setGmtTime(`${hh}:${mm}:${ss}`)
      setGmtDate(now.toUTCString().slice(0, 16))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    document.body.style.background = t.bg
  }, [isDark])

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return }
    fetchAll()
  }, [isAuthenticated])

  const fetchAll = async () => {
    try {
      const [me, b, p, a] = await Promise.all([
        api.get('/auth/me'),
        api.get('/bookings/my'),
        api.get('/pireps/my'),
        api.get('/announcements').catch(() => ({ data: [] })),
      ])
      setPilotData(me.data)
      setBookings(b.data)
      setPireps(p.data)
      setAnnouncements(a.data)
    } catch {
      logout()
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bg }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 animate-spin mx-auto mb-4"
            style={{ borderColor: '#c0121e', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: t.textSub }}>Loading your cockpit...</p>
        </div>
      </div>
    )
  }

  const pilot = pilotData?.pilot
  const initials = `${pilot?.firstName?.[0] || ''}${pilot?.lastName?.[0] || ''}`

  const getBookingStatusStyle = (status: string) => {
    const map: any = {
      UPCOMING: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'Upcoming' },
      PIREP_PENDING: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'PIREP Pending' },
      APPROVED: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Approved' },
      CANCELLED: { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', label: 'Cancelled' },
    }
    return map[status] || map.CANCELLED
  }

  const NavItem = ({ item, expanded }: { item: any, expanded: boolean }) => {
    const active = location.pathname === item.path
    return (
      <Link to={item.path}
        title={!expanded ? item.label : undefined}
        className="flex items-center rounded-xl transition-all duration-150"
        style={{
          gap: expanded ? '10px' : '0',
          padding: expanded ? '8px 10px' : '8px 0',
          justifyContent: expanded ? 'flex-start' : 'center',
          background: active ? t.navActive : 'transparent',
          color: active ? '#c0121e' : t.textSub,
          minHeight: '36px',
          textDecoration: 'none',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = t.navHover }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? t.navActive : 'transparent' }}>
        <item.icon size={17} strokeWidth={active ? 2.5 : 2} style={{ flexShrink: 0 }} />
        {expanded && (
          <>
            <span className="text-sm font-medium flex-1 truncate">{item.label}</span>
            {active && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#c0121e' }} />}
          </>
        )}
      </Link>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: t.bg, color: t.text }}>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <div
        onMouseEnter={() => { if (!pinned) setHovered(true) }}
        onMouseLeave={() => { if (!pinned) setHovered(false) }}
        className="fixed left-0 top-0 bottom-0 z-50 flex flex-col"
        style={{
          width: sidebarW,
          background: t.sidebar,
          borderRight: `1px solid ${t.border}`,
          transition: 'width 0.22s ease',
          overflow: 'hidden',
        }}>

        <div className="flex items-center flex-shrink-0"
          style={{
            borderBottom: `1px solid ${t.border}`,
            minHeight: '65px',
            padding: isExpanded ? '0 12px 0 16px' : '0',
            justifyContent: isExpanded ? 'space-between' : 'center',
          }}>
          {isExpanded ? (
            <>
              <Link to="/" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
                <img src="/logo.png" alt="KFR" className="w-8 h-8 object-contain flex-shrink-0" />
                <div>
                  <div className="font-bold text-sm leading-tight" style={{ color: t.text }}>Kingfisher</div>
                  <div className="text-xs leading-tight" style={{ color: '#d4af37' }}>Virtual Airlines</div>
                </div>
              </Link>
              <div className="flex items-center gap-1">
                <button onClick={() => setPinned(!pinned)}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ color: pinned ? '#c0121e' : t.textMuted, background: pinned ? 'rgba(192,18,30,0.1)' : 'transparent' }}>
                  <ChevronLeft size={14} style={{ transform: pinned ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }} />
                </button>
                {pinned && (
                  <button onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg transition-all"
                    style={{ color: t.textMuted }}
                    onMouseEnter={e => e.currentTarget.style.background = t.navHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <ChevronLeft size={14} />
                  </button>
                )}
              </div>
            </>
          ) : (
            <img src="/logo.png" alt="KFR" className="w-8 h-8 object-contain" />
          )}
        </div>

        {isExpanded ? (
          <div className="mx-3 my-3 p-3 rounded-xl flex-shrink-0"
            style={{ background: t.navActive, border: `1px solid rgba(192,18,30,0.15)` }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)', color: 'white' }}>
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: t.text }}>
                  {pilot?.firstName} {pilot?.lastName}
                </div>
                <div className="text-xs truncate" style={{ color: t.textSub }}>
                  {pilot?.pilotId} · {pilot?.rank}
                </div>
              </div>
            </div>
            <div className="mt-2.5 pt-2.5 flex items-center justify-around"
              style={{ borderTop: `1px solid rgba(192,18,30,0.1)` }}>
              {[
                { label: 'Hours', value: pilot?.totalHours?.toFixed(0) || 0 },
                { label: 'Flights', value: pilot?.totalFlights || 0 },
                { label: 'Wallet', value: `$${pilot?.walletBalance?.toFixed(0) || 0}` },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-xs font-bold" style={{ color: '#c0121e' }}>{s.value}</div>
                  <div className="text-xs" style={{ color: t.textMuted }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)', color: 'white' }}>
              {initials}
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-2"
          style={{ scrollbarWidth: 'none' }}>
          {NAV_SECTIONS.map(section => (
            <div key={section.title} className="mb-2">
              {isExpanded && (
                <div className="text-xs font-semibold tracking-widest uppercase px-2 py-1.5"
                  style={{ color: t.textMuted }}>
                  {section.title}
                </div>
              )}
              {!isExpanded && <div className="py-1.5" />}
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <NavItem key={item.path} item={item} expanded={isExpanded} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="flex-shrink-0 px-3 pt-3 pb-4 space-y-0.5"
          style={{ borderTop: `1px solid ${t.border}` }}>
          {[
            { icon: Settings, label: 'Settings', path: '/settings' },
            { icon: Headphones, label: 'Support', path: '/support' },
          ].map((item, i) => (
            <Link key={i} to={item.path}
              title={!isExpanded ? item.label : undefined}
              className="flex items-center rounded-xl transition-all duration-150"
              style={{
                gap: isExpanded ? '10px' : '0',
                padding: isExpanded ? '8px 10px' : '8px 0',
                justifyContent: isExpanded ? 'flex-start' : 'center',
                color: t.textSub,
                minHeight: '36px',
                textDecoration: 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = t.navHover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <item.icon size={17} style={{ flexShrink: 0 }} />
              {isExpanded && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
          <button onClick={toggle}
            title={!isExpanded ? (isDark ? 'Light Mode' : 'Dark Mode') : undefined}
            className="w-full flex items-center rounded-xl transition-all duration-150"
            style={{
              gap: isExpanded ? '10px' : '0',
              padding: isExpanded ? '8px 10px' : '8px 0',
              justifyContent: isExpanded ? 'flex-start' : 'center',
              color: t.textSub,
              minHeight: '36px',
            }}
            onMouseEnter={e => e.currentTarget.style.background = t.navHover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {isDark ? <Sun size={17} style={{ flexShrink: 0 }} /> : <Moon size={17} style={{ flexShrink: 0 }} />}
            {isExpanded && <span className="text-sm font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button onClick={() => { logout(); navigate('/') }}
            title={!isExpanded ? 'Sign Out' : undefined}
            className="w-full flex items-center rounded-xl transition-all duration-150"
            style={{
              gap: isExpanded ? '10px' : '0',
              padding: isExpanded ? '8px 10px' : '8px 0',
              justifyContent: isExpanded ? 'flex-start' : 'center',
              color: '#c0121e',
              minHeight: '36px',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,18,30,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <LogOut size={17} style={{ flexShrink: 0 }} />
            {isExpanded && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col min-h-screen"
        style={{ marginLeft: sidebarW, transition: 'margin-left 0.22s ease' }}>

        <header className="sticky top-0 z-30 flex items-center justify-between px-6"
          style={{
            background: isDark ? 'rgba(15,15,15,0.92)' : 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${t.border}`,
            minHeight: '65px',
          }}>
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 rounded-lg" onClick={() => setMobileSidebarOpen(true)}
              style={{ color: t.textSub }}>
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-base font-bold" style={{ color: t.text }}>Dashboard</h1>
              <p className="text-xs" style={{ color: t.textMuted }}>
                Welcome back, {pilot?.firstName} — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end px-3 py-1.5 rounded-xl"
              style={{ background: t.badge }}>
              <div className="flex items-center gap-1.5">
                <Clock size={11} style={{ color: '#c0121e' }} />
                <span className="text-xs font-bold tracking-widest font-mono" style={{ color: t.text }}>{gmtTime}</span>
                <span className="text-xs font-semibold" style={{ color: '#c0121e' }}>Z</span>
              </div>
              <div className="text-xs" style={{ color: t.textMuted, fontSize: '10px' }}>{gmtDate} UTC</div>
            </div>
            <Link to="/settings"
              className="p-2.5 rounded-xl transition-colors"
              style={{ color: t.textSub, background: t.badge, textDecoration: 'none' }}>
              <Settings size={17} />
            </Link>
            <Link to="/profile"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
              style={{ background: t.badge, textDecoration: 'none' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)', color: 'white' }}>
                {initials}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold" style={{ color: t.text }}>{pilot?.firstName} {pilot?.lastName}</div>
                <div className="text-xs" style={{ color: t.textMuted }}>{pilot?.rank}</div>
              </div>
            </Link>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Hours', value: `${pilot?.totalHours?.toFixed(1) || '0.0'}`, unit: 'hrs', icon: Clock, color: '#c0121e' },
              { label: 'Total Flights', value: `${pilot?.totalFlights || 0}`, unit: 'flights', icon: Plane, color: '#3b82f6' },
              { label: 'Wallet Balance', value: `$${pilot?.walletBalance?.toFixed(2) || '0.00'}`, unit: 'virtual USD', icon: DollarSign, color: '#10b981' },
              { label: 'Current Rank', value: pilot?.rank || 'Student Pilot', unit: '', icon: TrendingUp, color: '#d4af37' },
            ].map((stat, i) => (
              <motion.div key={stat.label}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="p-4 rounded-2xl"
                style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-medium" style={{ color: t.textSub }}>{stat.label}</div>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: `${stat.color}18` }}>
                    <stat.icon size={15} style={{ color: stat.color }} />
                  </div>
                </div>
                <div className="text-xl font-bold truncate" style={{ color: t.text }}>{stat.value}</div>
                {stat.unit && <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>{stat.unit}</div>}
              </motion.div>
            ))}
          </div>

          {/* Live map + NOTAMs */}
          <div className="grid lg:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="lg:col-span-2 rounded-2xl overflow-hidden"
              style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-2.5">
                  <Globe size={15} style={{ color: '#c0121e' }} />
                  <span className="text-sm font-semibold" style={{ color: t.text }}>Live Map</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>● Live</span>
                </div>
                <Link to="/live-map" className="text-xs font-medium" style={{ color: '#c0121e', textDecoration: 'none' }}>
                  Full Map →
                </Link>
              </div>
              <div className="flex items-center justify-center relative overflow-hidden"
                style={{ height: '220px', background: isDark ? '#0d1117' : '#e8f0f7' }}>
                <div className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `linear-gradient(${isDark ? 'rgba(192,18,30,0.3)' : 'rgba(0,100,200,0.2)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(192,18,30,0.3)' : 'rgba(0,100,200,0.2)'} 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                  }} />
                <div className="relative z-10 text-center">
                  <Navigation size={28} style={{ color: isDark ? 'rgba(192,18,30,0.4)' : 'rgba(0,100,200,0.3)', margin: '0 auto 8px' }} />
                  <div className="text-sm font-medium" style={{ color: t.textSub }}>Live map arrives with ACARS</div>
                  <div className="text-xs mt-1" style={{ color: t.textMuted }}>Real-time flight tracking</div>
                </div>
                {[{ top: '28%', left: '22%' }, { top: '52%', left: '58%' }, { top: '38%', left: '74%' }, { top: '65%', left: '38%' }, { top: '20%', left: '55%' }].map((pos, i) => (
                  <div key={i} className="absolute w-2 h-2 rounded-full animate-pulse"
                    style={{ top: pos.top, left: pos.left, background: '#c0121e', boxShadow: '0 0 6px rgba(192,18,30,0.8)', animationDelay: `${i * 0.4}s` }} />
                ))}
              </div>
            </motion.div>

            {/* Recent bookings as NOTAM-style */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.28 }}
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
                style={{ borderBottom: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-2.5">
                  <Plane size={15} style={{ color: '#c0121e' }} />
                  <span className="text-sm font-semibold" style={{ color: t.text }}>My Flights</span>
                </div>
                <Link to="/flights" className="text-xs font-medium" style={{ color: '#c0121e', textDecoration: 'none' }}>
                  View all →
                </Link>
              </div>
              {bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-8 px-4 text-center">
                  <Plane size={24} style={{ color: t.textMuted, marginBottom: '8px' }} strokeWidth={1.5} />
                  <div className="text-xs" style={{ color: t.textSub }}>No flights booked yet</div>
                  <Link to="/flights"
                    className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)', textDecoration: 'none' }}>
                    Book a Flight
                  </Link>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: t.border }}>
                  {bookings.slice(0, 4).map((booking: any) => {
                    const s = getBookingStatusStyle(booking.status)
                    return (
                      <div key={booking.id} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold font-mono" style={{ color: '#c0121e' }}>
                            {booking.route?.flightNumber}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: s.bg, color: s.color, fontSize: '10px' }}>
                            {s.label}
                          </span>
                        </div>
                        <div className="text-xs font-medium" style={{ color: t.text }}>
                          {booking.route?.depIcao} → {booking.route?.arrIcao}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>
                          {booking.aircraft?.registration} · {booking.network}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* Recent PIREPs + Announcements */}
          <div className="grid lg:grid-cols-3 gap-4">

            {/* Recent PIREPs */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.33 }}
              className="lg:col-span-2 rounded-2xl overflow-hidden"
              style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-2.5">
                  <BookOpen size={15} style={{ color: '#c0121e' }} />
                  <span className="text-sm font-semibold" style={{ color: t.text }}>Recent Flights</span>
                </div>
                <Link to="/logbook" className="text-xs font-medium" style={{ color: '#c0121e', textDecoration: 'none' }}>
                  Full Logbook →
                </Link>
              </div>
              {pireps.length === 0 ? (
                <div className="flex items-center justify-center py-14">
                  <div className="text-center">
                    <Plane size={30} style={{ color: t.textMuted, margin: '0 auto 12px' }} strokeWidth={1.5} />
                    <div className="text-sm font-medium mb-1" style={{ color: t.textSub }}>No flights yet</div>
                    <div className="text-xs mb-4" style={{ color: t.textMuted }}>File your first PIREP to see your history</div>
                    <Link to="/pirep"
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)', textDecoration: 'none' }}>
                      File a PIREP
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: t.border }}>
                  {pireps.slice(0, 5).map((pirep: any) => {
                    const statusColors: any = {
                      APPROVED: '#10b981',
                      PENDING: '#f59e0b',
                      REJECTED: '#ef4444',
                    }
                    return (
                      <div key={pirep.id} className="flex items-center justify-between px-5 py-3.5"
                        onMouseEnter={e => e.currentTarget.style.background = t.navHover}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(192,18,30,0.1)' }}>
                            <Plane size={14} style={{ color: '#c0121e' }} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold font-mono" style={{ color: '#c0121e' }}>
                                {pirep.flightNumber}
                              </span>
                              <span className="text-sm font-medium" style={{ color: t.text }}>
                                {pirep.depIcao} → {pirep.arrIcao}
                              </span>
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>
                              {pirep.flightTime?.toFixed(1)}h · {pirep.aircraft?.name} · {pirep.simulator}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-semibold" style={{ color: statusColors[pirep.status] }}>
                            {pirep.status}
                          </div>
                          <div className="text-xs" style={{ color: t.textMuted }}>
                            {new Date(pirep.depTime).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>

            {/* Announcements — real data */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.38 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center gap-2.5 px-5 py-3.5"
                style={{ borderBottom: `1px solid ${t.border}` }}>
                <Bell size={15} style={{ color: '#c0121e' }} />
                <span className="text-sm font-semibold" style={{ color: t.text }}>Announcements</span>
              </div>
              {announcements.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <div className="text-center">
                    <Bell size={24} style={{ color: t.textMuted, margin: '0 auto 8px' }} strokeWidth={1.5} />
                    <div className="text-xs" style={{ color: t.textSub }}>No announcements yet</div>
                  </div>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: t.border }}>
                  {announcements.slice(0, 3).map((ann: any, i: number) => (
                    <div key={i} className="px-5 py-4">
                      <div className="flex items-start gap-2 mb-1.5">
                        {ann.isPinned && (
                          <span className="px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0"
                            style={{ background: 'rgba(192,18,30,0.1)', color: '#c0121e' }}>PIN</span>
                        )}
                        <div className="text-sm font-semibold leading-tight" style={{ color: t.text }}>{ann.title}</div>
                      </div>
                      <p className="text-xs leading-relaxed mb-2" style={{ color: t.textSub }}>{ann.content}</p>
                      <div className="text-xs" style={{ color: t.textMuted }}>
                        {new Date(ann.createdAt).toLocaleDateString()} · {ann.author}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Quick actions */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
            className="rounded-2xl p-5"
            style={{ background: t.card, border: `1px solid ${t.border}` }}>
            <div className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: t.textMuted }}>
              Quick Actions
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Plane, label: 'Book a Flight', path: '/flights', color: '#c0121e' },
                { icon: FileText, label: 'File PIREP', path: '/pirep', color: '#3b82f6' },
                { icon: DollarSign, label: 'My Wallet', path: '/wallet', color: '#10b981' },
                { icon: User, label: 'My Profile', path: '/profile', color: '#d4af37' },
              ].map(action => (
                <Link key={action.label} to={action.path}
                  className="flex flex-col items-center gap-2.5 p-4 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: t.badge, border: `1px solid ${t.border}`, textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = `${action.color}40`}
                  onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${action.color}18` }}>
                    <action.icon size={18} style={{ color: action.color }} />
                  </div>
                  <span className="text-xs font-medium text-center" style={{ color: t.text }}>{action.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>

        </div>

        {/* Footer */}
        <footer className="px-6 py-4 mt-auto"
          style={{ borderTop: `1px solid ${t.border}`, background: t.sidebar }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="KFR" className="w-5 h-5 object-contain" />
                <span className="text-xs font-semibold" style={{ color: t.text }}>Kingfisher Virtual Airlines</span>
              </div>
              <span className="text-xs" style={{ color: t.textMuted }}>ICAO: KFR</span>
              <span className="text-xs" style={{ color: t.textMuted }}>v1.0.0</span>
              <span className="text-xs" style={{ color: t.textMuted }}>{gmtTime} UTC</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {[
                { label: 'Home', path: '/' },
                { label: 'Support', path: '/support' },
                { label: 'Privacy', path: '/privacy' },
                { label: 'Terms', path: '/terms' },
                { label: 'Contact', path: '/contact' },
              ].map(link => (
                <Link key={link.label} to={link.path}
                  className="text-xs hover:underline"
                  style={{ color: t.textMuted, textDecoration: 'none' }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}