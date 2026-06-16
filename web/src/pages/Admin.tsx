import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, Users, Plane, FileText,
  Map, Bell, LogOut, ChevronLeft, ChevronRight,
  Settings, Shield, BarChart3, Plus, Trash2,
  Check, X, AlertTriangle, Hash, Clock,
  TrendingUp, Navigation, Building2, Sun, Moon,
  Eye, Search, Filter, Calendar
} from 'lucide-react'
import { useAuthStore } from '../store/auth.store'
import { useThemeStore } from '../store/theme.store'
import api from '../lib/axios'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview', id: 'overview' },
  { icon: Users, label: 'Pilots', id: 'pilots' },
  { icon: FileText, label: 'PIREPs', id: 'pireps' },
  { icon: Plane, label: 'Fleet', id: 'fleet' },
  { icon: Navigation, label: 'Routes', id: 'routes' },
  { icon: Building2, label: 'Hubs', id: 'hubs' },
  { icon: Calendar, label: 'Events', id: 'events' },
  { icon: Bell, label: 'Announcements', id: 'announcements' },
]

export default function Admin() {
  const { logout } = useAuthStore()
  const { isDark, toggle } = useThemeStore()
  const navigate = useNavigate()

  const [active, setActive] = useState('overview')
  const [collapsed, setCollapsed] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [pinned, setPinned] = useState(true)
  const [gmtTime, setGmtTime] = useState('')
  const [search, setSearch] = useState('')

  // Data states
  const [stats, setStats] = useState<any>(null)
  const [pilots, setPilots] = useState<any[]>([])
  const [pireps, setPireps] = useState<any[]>([])
  const [aircraft, setAircraft] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [hubs, setHubs] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Form states
  const [aircraftForm, setAircraftForm] = useState({ icao: '', name: '', registration: '', type: '', engines: '', pax: '', range: '', cruiseSpeed: '', hub: '' })
  const [routeForm, setRouteForm] = useState({ flightNumber: '', depIcao: '', arrIcao: '', depName: '', arrName: '', distance: '', duration: '' })
  const [hubForm, setHubForm] = useState({ icao: '', name: '', city: '', country: '' })
  const [eventForm, setEventForm] = useState({
    title: '', description: '', route: '', depIcao: '',
    arrIcao: '', date: '', earnings: '', slots: '20', network: 'Any'
  })
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', author: '', isPinned: false })
  const [formMsg, setFormMsg] = useState('')
  const [selectedPirep, setSelectedPirep] = useState<any>(null)
  const [staffNote, setStaffNote] = useState('')

  const isExpanded = pinned ? !collapsed : hovered
  const sidebarW = isExpanded ? '240px' : '64px'

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
    input: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
  }

  // GMT Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const hh = String(now.getUTCHours()).padStart(2, '0')
      const mm = String(now.getUTCMinutes()).padStart(2, '0')
      const ss = String(now.getUTCSeconds()).padStart(2, '0')
      setGmtTime(`${hh}:${mm}:${ss}`)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    document.body.style.background = t.bg
  }, [isDark, t.bg])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [s, p, pi, a, r, h, e, an] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/pilots'),
        api.get('/admin/pireps'),
        api.get('/admin/aircraft'),
        api.get('/admin/routes'),
        api.get('/admin/hubs'),
        api.get('/events'),
        fetch('https://kingfisher-api.onrender.com/api/v1/public/announcements').then(r => r.json()).catch(() => [])
      ])
      setStats(s.data)
      setPilots(p.data)
      setPireps(pi.data)
      setAircraft(a.data)
      setRoutes(r.data)
      setHubs(h.data)
      setEvents(e.data)
      setAnnouncements(Array.isArray(an) ? an : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const [announcements, setAnnouncements] = useState<any[]>([])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])


  const updatePilotStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/pilots/${id}/status`, { status })
      fetchAll()
    } catch (err) { console.error(err) }
  }

  const updatePIREP = async (id: string, status: string, staffNotes?: string) => {
    try {
      await api.patch(`/admin/pireps/${id}/status`, { status, staffNotes })
      fetchAll()
    } catch (err) { console.error(err) }
  }

  const deleteItem = async (endpoint: string) => {
    if (!confirm('Are you sure?')) return
    try {
      await api.delete(endpoint)
      fetchAll()
    } catch (err) { console.error(err) }
  }

  const submitAircraft = async () => {
    try {
      await api.post('/admin/aircraft', {
        ...aircraftForm,
        pax: Number(aircraftForm.pax),
        range: Number(aircraftForm.range),
        cruiseSpeed: Number(aircraftForm.cruiseSpeed),
      })
      setAircraftForm({ icao: '', name: '', registration: '', type: '', engines: '', pax: '', range: '', cruiseSpeed: '', hub: '' })
      setFormMsg('Aircraft added!')
      fetchAll()
    } catch (err: any) {
      setFormMsg(err.response?.data?.error || 'Error adding aircraft')
    }
  }

  const submitRoute = async () => {
    try {
      await api.post('/admin/routes', {
        ...routeForm,
        distance: Number(routeForm.distance),
        duration: Number(routeForm.duration),
      })
      setRouteForm({ flightNumber: '', depIcao: '', arrIcao: '', depName: '', arrName: '', distance: '', duration: '' })
      setFormMsg('Route added!')
      fetchAll()
    } catch (err: any) {
      setFormMsg(err.response?.data?.error || 'Error adding route')
    }
  }

  const submitHub = async () => {
    try {
      await api.post('/admin/hubs', hubForm)
      setHubForm({ icao: '', name: '', city: '', country: '' })
      setFormMsg('Hub added!')
      fetchAll()
    } catch (err: any) {
      setFormMsg(err.response?.data?.error || 'Error adding hub')
    }
  }

  

  const submitAnnouncement = async () => {
    try {
      await api.post('/admin/announcements', announcementForm)
      setAnnouncementForm({ title: '', content: '', author: '', isPinned: false })
      setFormMsg('Announcement posted!')
    } catch (err: any) {
      setFormMsg(err.response?.data?.error || 'Error posting announcement')
    }
  }

  const inputStyle = {
    background: t.input,
    border: `1px solid ${t.border}`,
    color: t.text,
    borderRadius: '10px',
    padding: '8px 12px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: any = {
      APPROVED: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
      PENDING: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
      REJECTED: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
      ACTIVE: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
      INACTIVE: { bg: 'rgba(107,114,128,0.1)', color: '#6b7280' },
      SUSPENDED: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
      BANNED: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
    }
    const c = colors[status] || colors.INACTIVE
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
        style={{ background: c.bg, color: c.color }}>
        {status}
      </span>
    )
  }

  const renderContent = () => {
    if (loading) return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: '#c0121e', borderTopColor: 'transparent' }} />
      </div>
    )

    switch (active) {

      // ── OVERVIEW ──
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Total Pilots', value: stats?.totalPilots || 0, icon: Users, color: '#3b82f6' },
                { label: 'Total Flights', value: stats?.totalFlights || 0, icon: Plane, color: '#10b981' },
                { label: 'Aircraft', value: stats?.totalAircraft || 0, icon: Plane, color: '#8b5cf6' },
                { label: 'Routes', value: stats?.totalRoutes || 0, icon: Navigation, color: '#d4af37' },
                { label: 'Pending PIREPs', value: stats?.pendingPireps || 0, icon: AlertTriangle, color: '#f59e0b' },
              ].map((s, i) => (
                <div key={i} className="p-4 rounded-2xl"
                  style={{ background: t.card, border: `1px solid ${t.border}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs" style={{ color: t.textSub }}>{s.label}</div>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `${s.color}18` }}>
                      <s.icon size={14} style={{ color: s.color }} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: t.text }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Recent PIREPs needing attention */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-2.5">
                  <AlertTriangle size={15} style={{ color: '#f59e0b' }} />
                  <span className="text-sm font-semibold" style={{ color: t.text }}>Pending PIREPs</span>
                </div>
                <button onClick={() => setActive('pireps')}
                  className="text-xs font-medium" style={{ color: '#c0121e' }}>
                  View all →
                </button>
              </div>
              {pireps.filter(p => p.status === 'PENDING').length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Check size={28} style={{ color: '#10b981', margin: '0 auto 8px' }} />
                    <div className="text-sm" style={{ color: t.textSub }}>All PIREPs reviewed</div>
                  </div>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: t.border }}>
                  {pireps.filter(p => p.status === 'PENDING').slice(0, 5).map((pirep: any) => (
                    <div key={pirep.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold" style={{ color: t.text }}>
                          {pirep.pilot?.firstName} {pirep.pilot?.lastName} — {pirep.flightNumber}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: t.textSub }}>
                          {pirep.depIcao} → {pirep.arrIcao} · {pirep.flightTime?.toFixed(1)}h · {pirep.landingRate} fpm
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => updatePIREP(pirep.id, 'APPROVED')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                          <Check size={13} /> Approve
                        </button>
                        <button onClick={() => updatePIREP(pirep.id, 'REJECTED')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                          <X size={13} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      // ── PILOTS ──
      case 'pilots':
        const filteredPilots = pilots.filter(p =>
          `${p.firstName} ${p.lastName} ${p.pilotId}`.toLowerCase().includes(search.toLowerCase())
        )
        return (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: t.card, border: `1px solid ${t.border}` }}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${t.border}` }}>
              <div className="flex items-center gap-2.5">
                <Users size={15} style={{ color: '#c0121e' }} />
                <span className="text-sm font-semibold" style={{ color: t.text }}>All Pilots ({pilots.length})</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: t.input, border: `1px solid ${t.border}` }}>
                <Search size={13} style={{ color: t.textMuted }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search pilots..."
                  className="bg-transparent outline-none text-xs w-40"
                  style={{ color: t.text }} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    {['Pilot ID', 'Name', 'Email', 'Rank', 'Hours', 'Flights', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold tracking-wide"
                        style={{ color: t.textMuted }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: t.border }}>
                  {filteredPilots.map((pilot: any) => (
                    <tr key={pilot.id}
                      onMouseEnter={e => e.currentTarget.style.background = t.navHover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-bold font-mono" style={{ color: '#c0121e' }}>
                          {pilot.pilotId}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)', color: 'white' }}>
                            {pilot.firstName?.[0]}{pilot.lastName?.[0]}
                          </div>
                          <span className="text-sm font-medium" style={{ color: t.text }}>
                            {pilot.firstName} {pilot.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs" style={{ color: t.textSub }}>{pilot.user?.email}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs" style={{ color: t.textSub }}>{pilot.rank}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold" style={{ color: t.text }}>
                          {pilot.totalHours?.toFixed(1)}h
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs" style={{ color: t.textSub }}>{pilot.totalFlights}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={pilot.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {pilot.status === 'ACTIVE' ? (
                            <>
                              <button onClick={() => updatePilotStatus(pilot.id, 'SUSPENDED')}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                                style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                                Suspend
                              </button>
                              <button onClick={() => updatePilotStatus(pilot.id, 'BANNED')}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                Ban
                              </button>
                            </>
                          ) : (
                            <button onClick={() => updatePilotStatus(pilot.id, 'ACTIVE')}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                              style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredPilots.length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-sm" style={{ color: t.textSub }}>No pilots found</div>
                </div>
              )}
            </div>
          </div>
        )

      // ── PIREPs ──
      case 'pireps':
        const filteredPireps = pireps.filter(p =>
          `${p.pilot?.firstName} ${p.pilot?.lastName} ${p.flightNumber}`.toLowerCase().includes(search.toLowerCase())
        )
        return (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden"
              style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-2.5">
                  <FileText size={15} style={{ color: '#c0121e' }} />
                  <span className="text-sm font-semibold" style={{ color: t.text }}>All PIREPs ({pireps.length})</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: t.input, border: `1px solid ${t.border}` }}>
                  <Search size={13} style={{ color: t.textMuted }} />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search PIREPs..."
                    className="bg-transparent outline-none text-xs w-40"
                    style={{ color: t.text }} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                      {['Pilot', 'Flight', 'Route', 'Duration', 'Landing', 'Sim', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold tracking-wide"
                          style={{ color: t.textMuted }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: t.border }}>
                    {filteredPireps.map((pirep: any) => (
                      <tr key={pirep.id}
                        onMouseEnter={e => e.currentTarget.style.background = t.navHover}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td className="px-5 py-3.5">
                          <div className="text-sm font-medium" style={{ color: t.text }}>
                            {pirep.pilot?.firstName} {pirep.pilot?.lastName}
                          </div>
                          <div className="text-xs" style={{ color: t.textMuted }}>{pirep.pilot?.pilotId}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-bold font-mono" style={{ color: '#c0121e' }}>
                            {pirep.flightNumber}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs" style={{ color: t.textSub }}>
                            {pirep.depIcao} → {pirep.arrIcao}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-semibold" style={{ color: t.text }}>
                            {pirep.flightTime?.toFixed(1)}h
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-semibold"
                            style={{ color: Math.abs(pirep.landingRate) < 200 ? '#10b981' : Math.abs(pirep.landingRate) < 400 ? '#f59e0b' : '#ef4444' }}>
                            {pirep.landingRate} fpm
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs" style={{ color: t.textSub }}>{pirep.simulator}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={pirep.status} />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setSelectedPirep(pirep)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                              style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                              <Eye size={12} /> View
                            </button>
                            {pirep.status === 'PENDING' && (
                              <>
                                <button onClick={() => updatePIREP(pirep.id, 'APPROVED')}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                                  <Check size={12} />
                                </button>
                                <button onClick={() => updatePIREP(pirep.id, 'REJECTED')}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                  <X size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredPireps.length === 0 && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-sm" style={{ color: t.textSub }}>No PIREPs found</div>
                  </div>
                )}
              </div>
            </div>

            {/* PIREP Detail Modal */}
            {selectedPirep && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
                onClick={e => { if (e.target === e.currentTarget) setSelectedPirep(null) }}>
                <div className="w-full max-w-lg rounded-2xl overflow-hidden"
                  style={{ background: isDark ? '#141414' : '#ffffff', border: `1px solid ${t.border}`, maxHeight: '90vh', overflowY: 'auto' }}>
                  <div className="flex items-center justify-between px-6 py-4 sticky top-0"
                    style={{ borderBottom: `1px solid ${t.border}`, background: isDark ? '#141414' : '#ffffff' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                        <FileText size={15} style={{ color: 'white' }} />
                      </div>
                      <div>
                        <div className="font-bold text-sm" style={{ color: t.text }}>
                          PIREP — {selectedPirep.flightNumber}
                        </div>
                        <div className="text-xs" style={{ color: t.textSub }}>
                          {selectedPirep.pilot?.firstName} {selectedPirep.pilot?.lastName} · {selectedPirep.pilot?.pilotId}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setSelectedPirep(null)}
                      className="p-2 rounded-xl"
                      style={{ color: t.textMuted }}>
                      <X size={18} />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Route */}
                    <div className="p-4 rounded-xl"
                      style={{ background: t.navActive, border: `1px solid rgba(192,18,30,0.1)` }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold" style={{ color: t.text }}>{selectedPirep.depIcao}</div>
                          <div className="text-xs" style={{ color: t.textSub }}>Departure</div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <Plane size={16} style={{ color: '#c0121e' }} />
                          <span className="text-xs font-bold font-mono" style={{ color: '#c0121e' }}>
                            {selectedPirep.flightNumber}
                          </span>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold" style={{ color: t.text }}>{selectedPirep.arrIcao}</div>
                          <div className="text-xs" style={{ color: t.textSub }}>Arrival</div>
                        </div>
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Flight Time', value: `${selectedPirep.flightTime?.toFixed(2)}h` },
                        { label: 'Distance', value: `${selectedPirep.distance} nm` },
                        { label: 'Landing Rate', value: `${selectedPirep.landingRate} fpm` },
                        { label: 'Fuel Used', value: `${selectedPirep.fuelUsed} kg` },
                        { label: 'Simulator', value: selectedPirep.simulator },
                        { label: 'Network', value: selectedPirep.network },
                        { label: 'Aircraft', value: selectedPirep.aircraft?.name || '—' },
                        { label: 'Registration', value: selectedPirep.aircraft?.registration || '—' },
                        { label: 'Dep Time', value: new Date(selectedPirep.depTime).toLocaleString() },
                        { label: 'Arr Time', value: new Date(selectedPirep.arrTime).toLocaleString() },
                      ].map(item => (
                        <div key={item.label} className="p-3 rounded-xl"
                          style={{ background: t.input, border: `1px solid ${t.border}` }}>
                          <div className="text-xs mb-1" style={{ color: t.textMuted }}>{item.label}</div>
                          <div className="text-sm font-semibold" style={{ color: t.text }}>{item.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Estimated earnings */}
                    <div className="p-3 rounded-xl flex items-center justify-between"
                      style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <span className="text-sm font-semibold" style={{ color: '#10b981' }}>Estimated Earnings</span>
                      <span className="text-lg font-bold" style={{ color: '#10b981' }}>
                        ${(selectedPirep.flightTime * 500).toFixed(2)}
                      </span>
                    </div>

                    {/* Comments */}
                    {selectedPirep.comments && (
                      <div className="p-3 rounded-xl"
                        style={{ background: t.input, border: `1px solid ${t.border}` }}>
                        <div className="text-xs mb-1" style={{ color: t.textMuted }}>Pilot Comments</div>
                        <div className="text-sm" style={{ color: t.text }}>{selectedPirep.comments}</div>
                      </div>
                    )}

                    {/* Staff notes */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: t.textMuted }}>
                        STAFF NOTES (optional)
                      </label>
                      <textarea
                        value={staffNote}
                        onChange={e => setStaffNote(e.target.value)}
                        placeholder="Add notes for the pilot..."
                        rows={2}
                        style={{
                          background: t.input,
                          border: `1px solid ${t.border}`,
                          color: t.text,
                          borderRadius: '10px',
                          padding: '10px 14px',
                          fontSize: '13px',
                          outline: 'none',
                          width: '100%',
                          resize: 'vertical',
                        }} />
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center justify-between">
                      <StatusBadge status={selectedPirep.status} />
                      <div className="text-xs" style={{ color: t.textMuted }}>
                        Submitted {new Date(selectedPirep.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Action buttons */}
                    {selectedPirep.status === 'PENDING' && (
                      <div className="flex gap-3 pt-2">
                        <button onClick={async () => {
                          await updatePIREP(selectedPirep.id, 'APPROVED', staffNote)
                          setSelectedPirep(null)
                          setStaffNote('')
                        }}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors"
                          style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                          <Check size={15} /> Approve PIREP
                        </button>
                        <button onClick={async () => {
                          await updatePIREP(selectedPirep.id, 'REJECTED', staffNote)
                          setSelectedPirep(null)
                          setStaffNote('')
                        }}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors"
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                          <X size={15} /> Reject PIREP
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      // ── FLEET ──
      case 'fleet':
        return (
          <div className="space-y-5">
            {/* Add aircraft form */}
            <div className="rounded-2xl p-5"
              style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center gap-2.5 mb-4">
                <Plus size={15} style={{ color: '#c0121e' }} />
                <span className="text-sm font-semibold" style={{ color: t.text }}>Add Aircraft</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {[
                  { key: 'icao', label: 'ICAO Type', placeholder: 'A320' },
                  { key: 'name', label: 'Full Name', placeholder: 'Airbus A320-200' },
                  { key: 'registration', label: 'Registration', placeholder: 'VT-KFA' },
                  { key: 'type', label: 'Type', placeholder: 'Narrow Body' },
                  { key: 'engines', label: 'Engines', placeholder: 'CFM56' },
                  { key: 'pax', label: 'Passengers', placeholder: '180' },
                  { key: 'range', label: 'Range (nm)', placeholder: '3300' },
                  { key: 'cruiseSpeed', label: 'Cruise Speed (kt)', placeholder: '450' },
                  { key: 'hub', label: 'Hub ICAO (optional)', placeholder: 'VABB' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-xs mb-1.5" style={{ color: t.textMuted }}>{field.label}</label>
                    <input
                      value={(aircraftForm as any)[field.key]}
                      onChange={e => setAircraftForm({ ...aircraftForm, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>
              {formMsg && active === 'fleet' && (
                <div className="mb-3 text-xs px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  {formMsg}
                </div>
              )}
              <button onClick={submitAircraft}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                Add to Fleet
              </button>
            </div>

            {/* Aircraft list */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-2.5">
                  <Plane size={15} style={{ color: '#c0121e' }} />
                  <span className="text-sm font-semibold" style={{ color: t.text }}>Fleet ({aircraft.length})</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                      {['Registration', 'Name', 'Type', 'Pax', 'Range', 'Hub', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold"
                          style={{ color: t.textMuted }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: t.border }}>
                    {aircraft.map((a: any) => (
                      <tr key={a.id}
                        onMouseEnter={e => e.currentTarget.style.background = t.navHover}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-bold font-mono" style={{ color: '#c0121e' }}>
                            {a.registration}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-medium" style={{ color: t.text }}>{a.name}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs" style={{ color: t.textSub }}>{a.type}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs" style={{ color: t.textSub }}>{a.pax}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs" style={{ color: t.textSub }}>{a.range} nm</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs" style={{ color: t.textSub }}>{a.hub || '—'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => deleteItem(`/admin/aircraft/${a.id}`)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {aircraft.length === 0 && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-sm" style={{ color: t.textSub }}>No aircraft in fleet yet</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      // ── ROUTES ──
      case 'routes':
        return (
          <div className="space-y-5">
            <div className="rounded-2xl p-5"
              style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center gap-2.5 mb-4">
                <Plus size={15} style={{ color: '#c0121e' }} />
                <span className="text-sm font-semibold" style={{ color: t.text }}>Add Route</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {[
                  { key: 'flightNumber', label: 'Flight Number', placeholder: 'IT101' },
                  { key: 'depIcao', label: 'Dep ICAO', placeholder: 'VABB' },
                  { key: 'arrIcao', label: 'Arr ICAO', placeholder: 'VIDP' },
                  { key: 'depName', label: 'Dep Airport Name', placeholder: 'Mumbai' },
                  { key: 'arrName', label: 'Arr Airport Name', placeholder: 'Delhi' },
                  { key: 'distance', label: 'Distance (nm)', placeholder: '592' },
                  { key: 'duration', label: 'Duration (min)', placeholder: '125' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-xs mb-1.5" style={{ color: t.textMuted }}>{field.label}</label>
                    <input
                      value={(routeForm as any)[field.key]}
                      onChange={e => setRouteForm({ ...routeForm, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>
              {formMsg && active === 'routes' && (
                <div className="mb-3 text-xs px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  {formMsg}
                </div>
              )}
              <button onClick={submitRoute}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                Add Route
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden"
              style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-2.5">
                  <Navigation size={15} style={{ color: '#c0121e' }} />
                  <span className="text-sm font-semibold" style={{ color: t.text }}>Routes ({routes.length})</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                      {['Flight', 'From', 'To', 'Distance', 'Duration', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold"
                          style={{ color: t.textMuted }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: t.border }}>
                    {routes.map((r: any) => (
                      <tr key={r.id}
                        onMouseEnter={e => e.currentTarget.style.background = t.navHover}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-bold font-mono" style={{ color: '#c0121e' }}>
                            {r.flightNumber}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-sm font-medium" style={{ color: t.text }}>{r.depIcao}</div>
                          <div className="text-xs" style={{ color: t.textMuted }}>{r.depName}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-sm font-medium" style={{ color: t.text }}>{r.arrIcao}</div>
                          <div className="text-xs" style={{ color: t.textMuted }}>{r.arrName}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs" style={{ color: t.textSub }}>{r.distance} nm</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs" style={{ color: t.textSub }}>{r.duration} min</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => deleteItem(`/admin/routes/${r.id}`)}
                            className="p-1.5 rounded-lg"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {routes.length === 0 && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-sm" style={{ color: t.textSub }}>No routes yet</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      // ── HUBS ──
      case 'hubs':
        return (
          <div className="space-y-5">
            <div className="rounded-2xl p-5"
              style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center gap-2.5 mb-4">
                <Plus size={15} style={{ color: '#c0121e' }} />
                <span className="text-sm font-semibold" style={{ color: t.text }}>Add Hub</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { key: 'icao', label: 'ICAO Code', placeholder: 'VABB' },
                  { key: 'name', label: 'Airport Name', placeholder: 'Chhatrapati Shivaji' },
                  { key: 'city', label: 'City', placeholder: 'Mumbai' },
                  { key: 'country', label: 'Country', placeholder: 'India' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-xs mb-1.5" style={{ color: t.textMuted }}>{field.label}</label>
                    <input
                      value={(hubForm as any)[field.key]}
                      onChange={e => setHubForm({ ...hubForm, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>
              {formMsg && active === 'hubs' && (
                <div className="mb-3 text-xs px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  {formMsg}
                </div>
              )}
              <button onClick={submitHub}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                Add Hub
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {hubs.map((hub: any) => (
                <div key={hub.id} className="p-5 rounded-2xl"
                  style={{ background: t.card, border: `1px solid ${t.border}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold"
                      style={{ background: 'rgba(192,18,30,0.1)', color: '#c0121e' }}>
                      {hub.icao}
                    </div>
                    <button onClick={() => deleteItem(`/admin/hubs/${hub.id}`)}
                      className="p-1.5 rounded-lg"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="text-sm font-semibold mb-1" style={{ color: t.text }}>{hub.name}</div>
                  <div className="text-xs" style={{ color: t.textSub }}>{hub.city}, {hub.country}</div>
                </div>
              ))}
              {hubs.length === 0 && (
                <div className="col-span-3 flex items-center justify-center py-12">
                  <div className="text-sm" style={{ color: t.textSub }}>No hubs yet</div>
                </div>
              )}
            </div>
          </div>
        )

      // ── Events ──
      case 'events':
        const submitEvent = async () => {
          try {
            await api.post('/events', {
              ...eventForm,
              earnings: Number(eventForm.earnings),
              slots: Number(eventForm.slots),
            })
            setEventForm({ title: '', description: '', route: '', depIcao: '', arrIcao: '', date: '', earnings: '', slots: '20', network: 'Any' })
            setFormMsg('Event created!')
            fetchAll()
          } catch (err: any) {
            setFormMsg(err.response?.data?.error || 'Error creating event')
          }
        }
        return (
          <div className="space-y-5">
            <div className="rounded-2xl p-5" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center gap-2.5 mb-4">
                <Plus size={15} style={{ color: '#c0121e' }} />
                <span className="text-sm font-semibold" style={{ color: t.text }}>Create Event</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {[
                  { key: 'title', label: 'Event Title', placeholder: 'India Mega Event' },
                  { key: 'route', label: 'Route Name', placeholder: 'VABB → VIDP' },
                  { key: 'depIcao', label: 'Dep ICAO', placeholder: 'VABB' },
                  { key: 'arrIcao', label: 'Arr ICAO', placeholder: 'VIDP' },
                  { key: 'earnings', label: 'Bonus Earnings ($)', placeholder: '500' },
                  { key: 'slots', label: 'Max Slots', placeholder: '20' },
                  { key: 'network', label: 'Network', placeholder: 'VATSIM / Any' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-xs mb-1.5" style={{ color: t.textMuted }}>{field.label}</label>
                    <input
                      value={(eventForm as any)[field.key]}
                      onChange={e => setEventForm({ ...eventForm, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      style={inputStyle} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: t.textMuted }}>Date & Time</label>
                  <input type="datetime-local"
                    value={eventForm.date}
                    onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                    style={inputStyle} />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs mb-1.5" style={{ color: t.textMuted }}>Description</label>
                <textarea value={eventForm.description}
                  onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Describe the event..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              {formMsg && active === 'events' && (
                <div className="mb-3 text-xs px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  {formMsg}
                </div>
              )}
              <button onClick={submitEvent}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                Create Event
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-2.5">
                  <Calendar size={15} style={{ color: '#c0121e' }} />
                  <span className="text-sm font-semibold" style={{ color: t.text }}>Events ({events.length})</span>
                </div>
              </div>
              {events.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-sm" style={{ color: t.textSub }}>No events yet</div>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: t.border }}>
                  {events.map((event: any) => (
                    <div key={event.id} className="px-5 py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold" style={{ color: t.text }}>{event.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: t.textSub }}>
                          {event.depIcao} → {event.arrIcao} · {new Date(event.date).toLocaleDateString()} · {event.attendees?.length || 0}/{event.slots} slots · ${event.earnings} bonus
                        </div>
                      </div>
                      <button onClick={async () => {
                        if (!confirm('Delete this event?')) return
                        await api.delete(`/events/${event.id}`)
                        fetchAll()
                      }}
                        className="p-1.5 rounded-lg flex-shrink-0"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      // ── ANNOUNCEMENTS ──
      case 'announcements':
        return (
          <div className="rounded-2xl p-5"
            style={{ background: t.card, border: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-2.5 mb-5">
              <Bell size={15} style={{ color: '#c0121e' }} />
              <span className="text-sm font-semibold" style={{ color: t.text }}>Post Announcement</span>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: t.textMuted }}>Title</label>
                <input value={announcementForm.title}
                  onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="Announcement title"
                  style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: t.textMuted }}>Content</label>
                <textarea value={announcementForm.content}
                  onChange={e => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  placeholder="Write your announcement..."
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: t.textMuted }}>Author</label>
                <input value={announcementForm.author}
                  onChange={e => setAnnouncementForm({ ...announcementForm, author: e.target.value })}
                  placeholder="Your name or Kingfisher VA Staff"
                  style={inputStyle} />
              </div>
              <div className="flex items-center gap-2.5">
                <input type="checkbox"
                  id="pinned"
                  checked={announcementForm.isPinned}
                  onChange={e => setAnnouncementForm({ ...announcementForm, isPinned: e.target.checked })}
                  className="w-4 h-4 rounded" />
                <label htmlFor="pinned" className="text-sm" style={{ color: t.textSub }}>
                  Pin this announcement
                </label>
              </div>
            </div>
            {formMsg && active === 'announcements' && (
              <div className="mb-3 text-xs px-3 py-2 rounded-lg"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                {formMsg}
              </div>
            )}
            <button onClick={submitAnnouncement}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
              Post Announcement
            </button>

            <div className="mt-8 pt-8" style={{ borderTop: `1px solid ${t.border}` }}>
              <div className="flex items-center gap-2.5 mb-5">
                <Filter size={15} style={{ color: '#c0121e' }} />
                <span className="text-sm font-semibold" style={{ color: t.text }}>Manage Announcements</span>
              </div>
              <div className="space-y-4">
                {announcements.length === 0 ? (
                  <div className="text-sm italic py-4 text-center" style={{ color: t.textMuted }}>No announcements found</div>
                ) : (
                  announcements.map((a: any) => (
                    <div key={a.id} className="p-4 rounded-2xl flex items-center justify-between gap-4"
                      style={{ background: t.badge, border: `1px solid ${t.border}` }}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {a.isPinned && <Shield size={12} className="text-red-600" />}
                          <span className="text-sm font-bold" style={{ color: t.text }}>{a.title}</span>
                        </div>
                        <p className="text-xs line-clamp-1" style={{ color: t.textSub }}>{a.content}</p>
                      </div>
                      <button onClick={() => deleteItem(`/admin/announcements/${a.id}`)}
                        className="p-2 rounded-xl flex-shrink-0"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: t.bg, color: t.text }}>

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

        {/* Header */}
        <div className="flex items-center flex-shrink-0"
          style={{
            borderBottom: `1px solid ${t.border}`,
            minHeight: '65px',
            padding: isExpanded ? '0 12px 0 16px' : '0',
            justifyContent: isExpanded ? 'space-between' : 'center',
          }}>
          {isExpanded ? (
            <>
              <div className="flex items-center gap-2.5">
                <img src="/logo.png" alt="KFR" className="w-8 h-8 object-contain" />
                <div>
                  <div className="font-bold text-xs leading-tight" style={{ color: t.text }}>Kingfisher VA</div>
                  <div className="text-xs leading-tight flex items-center gap-1">
                    <Shield size={9} style={{ color: '#c0121e' }} />
                    <span style={{ color: '#c0121e' }}>Admin Panel</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setPinned(!pinned)}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ color: pinned ? '#c0121e' : t.textMuted, background: pinned ? 'rgba(192,18,30,0.1)' : 'transparent' }}>
                  <ChevronLeft size={14} style={{ transform: pinned ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }} />
                </button>
                {pinned && (
                  <button onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg"
                    style={{ color: t.textMuted }}>
                    <ChevronLeft size={14} />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
              <Shield size={14} style={{ color: 'white' }} />
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5"
          style={{ scrollbarWidth: 'none' }}>
          {NAV_ITEMS.map(item => {
            const isActive = active === item.id
            return (
              <button key={item.id}
                onClick={() => { setActive(item.id); setSearch(''); setFormMsg('') }}
                title={!isExpanded ? item.label : undefined}
                className="w-full flex items-center rounded-xl transition-all duration-150"
                style={{
                  gap: isExpanded ? '10px' : '0',
                  padding: isExpanded ? '8px 10px' : '8px 0',
                  justifyContent: isExpanded ? 'flex-start' : 'center',
                  background: isActive ? t.navActive : 'transparent',
                  color: isActive ? '#c0121e' : t.textSub,
                  minHeight: '36px',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = t.navHover }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? t.navActive : 'transparent' }}>
                <item.icon size={17} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
                {isExpanded && (
                  <>
                    <span className="text-sm font-medium flex-1 text-left truncate">{item.label}</span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#c0121e' }} />}
                  </>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 px-3 pt-3 pb-4 space-y-0.5"
          style={{ borderTop: `1px solid ${t.border}` }}>
          <Link to="/dashboard"
            title={!isExpanded ? 'Pilot Dashboard' : undefined}
            className="flex items-center rounded-xl transition-all"
            style={{
              gap: isExpanded ? '10px' : '0',
              padding: isExpanded ? '8px 10px' : '8px 0',
              justifyContent: isExpanded ? 'flex-start' : 'center',
              color: t.textSub,
              textDecoration: 'none',
              minHeight: '36px',
            }}
            onMouseEnter={e => e.currentTarget.style.background = t.navHover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <LayoutDashboard size={17} style={{ flexShrink: 0 }} />
            {isExpanded && <span className="text-sm font-medium">Pilot Dashboard</span>}
          </Link>
          <button onClick={toggle}
            title={!isExpanded ? 'Toggle theme' : undefined}
            className="w-full flex items-center rounded-xl transition-all"
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
            className="w-full flex items-center rounded-xl transition-all"
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

        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6"
          style={{
            background: isDark ? 'rgba(15,15,15,0.92)' : 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${t.border}`,
            minHeight: '65px',
          }}>
          <div>
            <div className="flex items-center gap-2">
              <Shield size={15} style={{ color: '#c0121e' }} />
              <h1 className="text-base font-bold" style={{ color: t.text }}>
                {NAV_ITEMS.find(n => n.id === active)?.label || 'Admin'}
              </h1>
            </div>
            <p className="text-xs" style={{ color: t.textMuted }}>Kingfisher VA — Admin Panel</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl"
              style={{ background: t.badge }}>
              <Clock size={11} style={{ color: '#c0121e' }} />
              <span className="text-xs font-bold font-mono tracking-widest" style={{ color: t.text }}>
                {gmtTime}
              </span>
              <span className="text-xs font-semibold" style={{ color: '#c0121e' }}>Z</span>
            </div>
            <button onClick={fetchAll}
              className="px-3 py-2 rounded-xl text-xs font-medium transition-colors"
              style={{ background: t.badge, color: t.textSub }}>
              Refresh
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6">
          {renderContent()}
        </div>

        {/* Footer */}
        <footer className="px-6 py-4"
          style={{ borderTop: `1px solid ${t.border}`, background: t.sidebar }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="KFR" className="w-5 h-5 object-contain" />
              <span className="text-xs font-semibold" style={{ color: t.text }}>
                Kingfisher VA — Admin Panel
              </span>
              <span className="text-xs" style={{ color: t.textMuted }}>v1.0.0</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={11} style={{ color: '#c0121e' }} />
              <span className="text-xs" style={{ color: t.textMuted }}>Restricted Access</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}