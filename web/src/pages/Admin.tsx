import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, Users, Plane, FileText,
  Map, Bell, LogOut, ChevronLeft, ChevronRight,
  Settings, Shield, BarChart3, Plus, Trash2,
  Check, X, AlertTriangle, Hash, Clock,
  TrendingUp, Navigation, Building2, Sun, Moon,
  Eye, Search, Filter, Calendar,
  Headphones, Radio, MapPin, Key, Wrench, Edit3
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
  { icon: Headphones, label: 'ATC Staff', id: 'atc-staff' },
  { icon: Map, label: 'Daily Hubs', id: 'daily-hubs' },
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

  // ATC Staff states
  const [atcStaff, setAtcStaff] = useState<any[]>([])
  const [atcStaffForm, setAtcStaffForm] = useState({ email: '', password: '', firstName: '', lastName: '', position: 'TWR', rating: 'S1' })
  const [dailyHubForm, setDailyHubForm] = useState({ depIcao: '', arrIcao: '', date: new Date().toISOString().split('T')[0] })
  const [currentDailyHub, setCurrentDailyHub] = useState<any>(null)

  // Edit modal states
  const [editAircraft, setEditAircraft] = useState<any>(null)
  const [editAircraftForm, setEditAircraftForm] = useState({ currentLocation: '', maintenanceThreshold: 50 })
  const [routeTypeEditor, setRouteTypeEditor] = useState<any>(null)
  const [routeTypeSelections, setRouteTypeSelections] = useState<string[]>([])
  const [allAircraftTypes, setAllAircraftTypes] = useState<string[]>([])

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
        api.get('/public/announcements').then(r => r.data).catch(() => [])
      ])
      setStats(s.data)
      setPilots(p.data)
      setPireps(pi.data)
      setAircraft(a.data)
      setRoutes(r.data)
      setHubs(h.data)
      setEvents(e.data)
      setAnnouncements(Array.isArray(an) ? an : [])
      // Compute unique aircraft types
      const types = [...new Set(a.data.map((ac: any) => ac.icao).filter(Boolean))] as string[]
      setAllAircraftTypes(types)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const [announcements, setAnnouncements] = useState<any[]>([])

  const fetchATCData = useCallback(async () => {
    try {
      const [staff, hub] = await Promise.all([
        api.get('/admin/atc').catch(() => ({ data: [] })),
        api.get('/admin/daily-hubs/current').catch(() => ({ data: null })),
      ])
      setAtcStaff(staff.data)
      setCurrentDailyHub(hub.data)
    } catch (err) { console.error(err) }
  }, [])

  useEffect(() => {
    fetchAll()
    fetchATCData()
  }, [fetchAll, fetchATCData])


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
        allowedTypes: routeTypeSelections.length > 0 ? routeTypeSelections : null,
      })
      setRouteForm({ flightNumber: '', depIcao: '', arrIcao: '', depName: '', arrName: '', distance: '', duration: '' })
      setRouteTypeSelections([])
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
        const filteredPilots = pilots.filter((u: any) => {
          const p = u.pilot
          const name = p ? `${p.firstName} ${p.lastName} ${p.pilotId}` : u.email
          return name.toLowerCase().includes(search.toLowerCase())
        })
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
                    {['Pilot ID', 'Name', 'Email', 'Rank', 'Hours', 'Flights', 'Status', 'Role', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold tracking-wide"
                        style={{ color: t.textMuted }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: t.border }}>
                  {filteredPilots.map((user: any) => {
                    const p = user.pilot
                    return (
                    <tr key={user.id}
                      onMouseEnter={e => e.currentTarget.style.background = t.navHover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="px-5 py-3.5">
                        {p ? (
                          <span className="text-xs font-bold font-mono" style={{ color: '#c0121e' }}>
                            {p.pilotId}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: t.textMuted }}>—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {p ? (
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)', color: 'white' }}>
                              {p.firstName?.[0]}{p.lastName?.[0]}
                            </div>
                            <span className="text-sm font-medium" style={{ color: t.text }}>
                              {p.firstName} {p.lastName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm" style={{ color: t.textMuted }}>Pending Setup</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs" style={{ color: t.textSub }}>{user.email}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs" style={{ color: t.textSub }}>{p?.rank || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold" style={{ color: t.text }}>
                          {p ? `${p.totalHours?.toFixed(1)}h` : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs" style={{ color: t.textSub }}>{p?.totalFlights ?? '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {p ? <StatusBadge status={p.status} /> : <span className="text-xs" style={{ color: t.textMuted }}>No Pilot</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md"
                          style={{
                            background: user.role === 'ADMIN' ? 'rgba(192,18,30,0.1)' : user.role === 'STAFF' ? 'rgba(37,99,235,0.1)' : 'rgba(16,185,129,0.1)',
                            color: user.role === 'ADMIN' ? '#c0121e' : user.role === 'STAFF' ? '#2563eb' : '#10b981'
                          }}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {p ? (
                            p.status === 'ACTIVE' ? (
                              <>
                                <button onClick={() => updatePilotStatus(p.id, 'SUSPENDED')}
                                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                                  style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                                  Suspend
                                </button>
                                <button onClick={() => updatePilotStatus(p.id, 'BANNED')}
                                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                  Ban
                                </button>
                              </>
                            ) : (
                              <button onClick={() => updatePilotStatus(p.id, 'ACTIVE')}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                                style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                                Reactivate
                              </button>
                            )
                          ) : (
                            <span className="text-xs" style={{ color: t.textMuted }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                    )
                  })}
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
                      {['Registration', 'Name', 'Type', 'Pax', 'Range', 'Hub', 'Current Location', 'Flight Hours', 'Maintenance', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold"
                          style={{ color: t.textMuted }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: t.border }}>
                    {aircraft.map((a: any) => {
                      const inMaint = a.maintenanceStatus === 'IN_MAINTENANCE'
                      const countdown = a.maintenanceUntil ? (() => {
                        const remaining = new Date(a.maintenanceUntil).getTime() - Date.now()
                        if (remaining <= 0) return null
                        return `${Math.floor(remaining / 3600000)}h ${Math.floor((remaining % 3600000) / 60000)}m`
                      })() : null
                      return (
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
                          <span className="text-xs font-semibold" style={{ color: '#3b82f6' }}>
                            {a.currentLocation || a.hub || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs" style={{ color: t.textSub }}>
                            {a.totalFlightHours?.toFixed(1)}h / {a.maintenanceThreshold || 50}h
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {inMaint ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                              <Wrench size={10} />
                              {countdown || 'IN MAINT'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                              Available
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => {
                              setEditAircraft(a)
                              setEditAircraftForm({
                                currentLocation: a.currentLocation || a.hub || '',
                                maintenanceThreshold: a.maintenanceThreshold || 50,
                              })
                            }}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                              <Edit3 size={13} />
                            </button>
                            <button onClick={() => deleteItem(`/admin/aircraft/${a.id}`)}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})}
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

              {/* Allowed aircraft types for this route */}
              <div className="mb-4">
                <label className="block text-xs font-semibold mb-2" style={{ color: t.textMuted }}>
                  ALLOWED AIRCRAFT TYPES (leave empty for all)
                </label>
                <div className="flex flex-wrap gap-2">
                  {allAircraftTypes.length === 0 ? (
                    <span className="text-xs" style={{ color: t.textMuted }}>No aircraft types found. Add aircraft first.</span>
                  ) : (
                    allAircraftTypes.map(type => {
                      const selected = routeTypeSelections.includes(type)
                      return (
                        <button key={type}
                          onClick={() => {
                            setRouteTypeSelections(prev =>
                              prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                            )
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{
                            background: selected ? 'rgba(192,18,30,0.15)' : t.input,
                            border: `1px solid ${selected ? 'rgba(192,18,30,0.4)' : t.border}`,
                            color: selected ? '#c0121e' : t.textSub,
                          }}>
                          {type}
                        </button>
                      )
                    })
                  )}
                </div>
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
                      {['Flight', 'From', 'To', 'Distance', 'Duration', 'Allowed Types', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold"
                          style={{ color: t.textMuted }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                    <tbody className="divide-y" style={{ borderColor: t.border }}>
                    {routes.map((r: any) => {
                      const types = r.allowedTypes as string[] | null
                      return (
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
                          <span className="text-xs" style={{ color: t.textSub }}>
                            {types && types.length > 0 ? types.join(', ') : 'All'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => {
                              const currentTypes = (r.allowedTypes as string[]) || []
                              setRouteTypeSelections(currentTypes)
                              setRouteTypeEditor(r)
                            }}
                              className="p-1.5 rounded-lg"
                              style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                              <Edit3 size={13} />
                            </button>
                            <button onClick={() => deleteItem(`/admin/routes/${r.id}`)}
                              className="p-1.5 rounded-lg"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})}
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

      // ── ATC STAFF ──
      case 'atc-staff':
        const filteredStaff = atcStaff.filter((s: any) =>
          `${s.firstName} ${s.lastName} ${s.email} ${s.position}`.toLowerCase().includes(search.toLowerCase())
        )
        return (
          <div className="space-y-5">
            {/* Add ATC Staff Form */}
            <div className="rounded-2xl p-5" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center gap-2.5 mb-4">
                <Headphones size={15} style={{ color: '#c0121e' }} />
                <span className="text-sm font-semibold" style={{ color: t.text }}>Create ATC Staff Account</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {[
                  { key: 'firstName', label: 'First Name', placeholder: 'John', type: 'text' },
                  { key: 'lastName', label: 'Last Name', placeholder: 'Doe', type: 'text' },
                  { key: 'email', label: 'Email', placeholder: 'controller@kfrva.com', type: 'email' },
                  { key: 'password', label: 'Password', placeholder: 'Min 8 characters', type: 'password' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-xs mb-1.5" style={{ color: t.textMuted }}>{field.label}</label>
                    <input type={field.type}
                      value={(atcStaffForm as any)[field.key]}
                      onChange={e => setAtcStaffForm({ ...atcStaffForm, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      style={inputStyle} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: t.textMuted }}>Position</label>
                  <select value={atcStaffForm.position}
                    onChange={e => setAtcStaffForm({ ...atcStaffForm, position: e.target.value })}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    {['DEL', 'GND', 'TWR', 'APR', 'CTR'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: t.textMuted }}>Rating</label>
                  <select value={atcStaffForm.rating}
                    onChange={e => setAtcStaffForm({ ...atcStaffForm, rating: e.target.value })}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    {['S1', 'S2', 'S3', 'C1', 'C3'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
              {formMsg && active === 'atc-staff' && (
                <div className="mb-3 text-xs px-3 py-2 rounded-lg"
                  style={{ background: formMsg.includes('Error') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: formMsg.includes('Error') ? '#ef4444' : '#10b981' }}>
                  {formMsg}
                </div>
              )}
              <button onClick={async () => {
                try {
                  await api.post('/admin/atc', atcStaffForm)
                  setAtcStaffForm({ email: '', password: '', firstName: '', lastName: '', position: 'TWR', rating: 'S1' })
                  setFormMsg('ATC staff account created!')
                  fetchATCData()
                } catch (err: any) {
                  setFormMsg(err.response?.data?.error || 'Error creating ATC staff')
                }
              }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                Create ATC Account
              </button>
            </div>

            {/* ATC Staff List */}
            <div className="rounded-2xl overflow-hidden" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-2.5">
                  <Headphones size={15} style={{ color: '#c0121e' }} />
                  <span className="text-sm font-semibold" style={{ color: t.text }}>ATC Staff ({atcStaff.length})</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: t.input, border: `1px solid ${t.border}` }}>
                  <Search size={13} style={{ color: t.textMuted }} />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search staff..."
                    className="bg-transparent outline-none text-xs w-40" style={{ color: t.text }} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                      {['Name', 'Email', 'Position', 'Rating', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: t.textMuted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: t.border }}>
                    {filteredStaff.map((staff: any) => (
                      <tr key={staff.id}
                        onMouseEnter={e => e.currentTarget.style.background = t.navHover}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)', color: 'white' }}>
                              {staff.firstName?.[0]}{staff.lastName?.[0]}
                            </div>
                            <span className="text-sm font-medium" style={{ color: t.text }}>
                              {staff.firstName} {staff.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs" style={{ color: t.textSub }}>{staff.email}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-lg text-xs font-bold font-mono"
                            style={{
                              background: staff.position === 'CTR' ? 'rgba(239,68,68,0.1)' :
                                staff.position === 'APR' ? 'rgba(139,92,246,0.1)' :
                                  staff.position === 'TWR' ? 'rgba(245,158,11,0.1)' :
                                    staff.position === 'GND' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                              color: staff.position === 'CTR' ? '#ef4444' :
                                staff.position === 'APR' ? '#8b5cf6' :
                                  staff.position === 'TWR' ? '#f59e0b' :
                                    staff.position === 'GND' ? '#10b981' : '#3b82f6',
                            }}>
                            {staff.position}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-semibold" style={{ color: t.textSub }}>{staff.rating}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={staff.status || 'ACTIVE'} />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {staff.status === 'ACTIVE' ? (
                              <button onClick={async () => {
                                try { await api.patch(`/admin/atc/${staff.id}/status`, { status: 'SUSPENDED' }); fetchATCData() }
                                catch (err) { console.error(err) }
                              }}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium"
                                style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                                Suspend
                              </button>
                            ) : (
                              <button onClick={async () => {
                                try { await api.patch(`/admin/atc/${staff.id}/status`, { status: 'ACTIVE' }); fetchATCData() }
                                catch (err) { console.error(err) }
                              }}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium"
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
                {filteredStaff.length === 0 && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-sm" style={{ color: t.textSub }}>No ATC staff found</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      // ── DAILY HUBS ──
      case 'daily-hubs':
        return (
          <div className="space-y-5">
            {/* Current hub */}
            {currentDailyHub && (
              <div className="rounded-2xl p-6 overflow-hidden relative"
                style={{
                  background: isDark ? 'linear-gradient(135deg, #1a0000, #0a0a0a)' : 'linear-gradient(135deg, #fff5f5, #ffffff)',
                  border: `1px solid ${isDark ? 'rgba(192,18,30,0.2)' : 'rgba(192,18,30,0.1)'}`,
                }}>
                <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/5 blur-[80px] rounded-full" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={14} style={{ color: '#c0121e' }} />
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#c0121e' }}>Current Daily Hub</span>
                  </div>
                  <div className="flex items-end gap-6">
                    <div>
                      <div className="text-4xl font-black italic tracking-tighter" style={{ color: t.text }}>
                        {currentDailyHub.depIcao}
                      </div>
                      <div className="text-xs mt-1" style={{ color: t.textSub }}>
                        {currentDailyHub.depName || 'Departure'} → {currentDailyHub.arrIcao}
                      </div>
                    </div>
                    <div className="pb-1">
                      <div className="text-xs" style={{ color: t.textMuted }}>
                        {new Date(currentDailyHub.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Set Daily Hub Form */}
            <div className="rounded-2xl p-5" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center gap-2.5 mb-4">
                <MapPin size={15} style={{ color: '#c0121e' }} />
                <span className="text-sm font-semibold" style={{ color: t.text }}>Set Daily Hub</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {[
                  { key: 'depIcao', label: 'Departure ICAO', placeholder: 'VABB' },
                  { key: 'arrIcao', label: 'Arrival ICAO', placeholder: 'VIDP' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-xs mb-1.5" style={{ color: t.textMuted }}>{field.label}</label>
                    <input value={(dailyHubForm as any)[field.key]}
                      onChange={e => setDailyHubForm({ ...dailyHubForm, [field.key]: e.target.value.toUpperCase() })}
                      placeholder={field.placeholder}
                      style={inputStyle} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: t.textMuted }}>Date</label>
                  <input type="date" value={dailyHubForm.date}
                    onChange={e => setDailyHubForm({ ...dailyHubForm, date: e.target.value })}
                    style={inputStyle} />
                </div>
              </div>
              {formMsg && active === 'daily-hubs' && (
                <div className="mb-3 text-xs px-3 py-2 rounded-lg"
                  style={{ background: formMsg.includes('Error') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: formMsg.includes('Error') ? '#ef4444' : '#10b981' }}>
                  {formMsg}
                </div>
              )}
              <button onClick={async () => {
                try {
                  await api.post('/admin/daily-hubs', dailyHubForm)
                  setFormMsg('Daily hub set!')
                  fetchATCData()
                } catch (err: any) {
                  setFormMsg(err.response?.data?.error || 'Error setting daily hub')
                }
              }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                Set as Current Hub
              </button>
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

        {/* ── EDIT AIRCRAFT MODAL ── */}
        {editAircraft && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) setEditAircraft(null) }}>
            <div className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: isDark ? '#141414' : '#ffffff', border: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-3">
                  <Wrench size={15} style={{ color: '#c0121e' }} />
                  <span className="text-sm font-semibold" style={{ color: t.text }}>
                    Edit Aircraft — {editAircraft.registration}
                  </span>
                </div>
                <button onClick={() => setEditAircraft(null)}
                  className="p-1.5 rounded-xl" style={{ color: t.textMuted }}>
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: t.textMuted }}>Current Location (ICAO)</label>
                  <input value={editAircraftForm.currentLocation}
                    onChange={e => setEditAircraftForm({ ...editAircraftForm, currentLocation: e.target.value.toUpperCase() })}
                    placeholder="VABB"
                    style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: t.textMuted }}>
                    Maintenance Threshold (hours): {editAircraftForm.maintenanceThreshold}h
                  </label>
                  <input type="range" min={10} max={200} step={5}
                    value={editAircraftForm.maintenanceThreshold}
                    onChange={e => setEditAircraftForm({ ...editAircraftForm, maintenanceThreshold: parseInt(e.target.value) })}
                    style={{ width: '100%' }} />
                </div>
                {editAircraft.maintenanceStatus === 'IN_MAINTENANCE' && (
                  <button onClick={async () => {
                    try {
                      await api.patch(`/admin/aircraft/${editAircraft.id}`, {
                        maintenanceStatus: 'AVAILABLE',
                      })
                      setEditAircraft(null)
                      fetchAll()
                    } catch (err) { console.error(err) }
                  }}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                    Resolve Maintenance (Mark Available)
                  </button>
                )}
                {editAircraft.maintenanceStatus !== 'IN_MAINTENANCE' && (
                  <button onClick={async () => {
                    try {
                      await api.patch(`/admin/aircraft/${editAircraft.id}`, {
                        maintenanceStatus: 'IN_MAINTENANCE',
                        maintenanceUntil: new Date(Date.now() + 6 * 3600000).toISOString(),
                      })
                      setEditAircraft(null)
                      fetchAll()
                    } catch (err) { console.error(err) }
                  }}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                    Trigger 6h Maintenance
                  </button>
                )}
                <button onClick={async () => {
                  try {
                    await api.patch(`/admin/aircraft/${editAircraft.id}`, editAircraftForm)
                    setEditAircraft(null)
                    fetchAll()
                  } catch (err) { console.error(err) }
                }}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ROUTE TYPE EDITOR MODAL ── */}
        {routeTypeEditor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) setRouteTypeEditor(null) }}>
            <div className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: isDark ? '#141414' : '#ffffff', border: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-3">
                  <Plane size={15} style={{ color: '#c0121e' }} />
                  <span className="text-sm font-semibold" style={{ color: t.text }}>
                    Route Aircraft Types — {routeTypeEditor.flightNumber}
                  </span>
                </div>
                <button onClick={() => setRouteTypeEditor(null)}
                  className="p-1.5 rounded-xl" style={{ color: t.textMuted }}>
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-xs" style={{ color: t.textSub }}>
                  Select which aircraft types can fly this route. Leave empty to allow all types.
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {allAircraftTypes.length === 0 ? (
                    <div className="text-xs py-4 text-center" style={{ color: t.textMuted }}>
                      No aircraft types found. Add aircraft first.
                    </div>
                  ) : (
                    allAircraftTypes.map(type => (
                      <label key={type}
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                        style={{ background: t.input, border: `1px solid ${t.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = t.navHover}
                        onMouseLeave={e => e.currentTarget.style.background = t.input}>
                        <input type="checkbox"
                          checked={routeTypeSelections.includes(type)}
                          onChange={() => {
                            setRouteTypeSelections(prev =>
                              prev.includes(type)
                                ? prev.filter(t => t !== type)
                                : [...prev, type]
                            )
                          }}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: '#c0121e' }} />
                        <span className="text-sm font-medium" style={{ color: t.text }}>{type}</span>
                      </label>
                    ))
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={async () => {
                    try {
                      await api.patch(`/admin/routes/${routeTypeEditor.id}/types`, {
                        allowedTypes: routeTypeSelections.length > 0 ? routeTypeSelections : null,
                      })
                      setRouteTypeEditor(null)
                      fetchAll()
                    } catch (err) { console.error(err) }
                  }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                    Save
                  </button>
                  <button onClick={() => setRouteTypeEditor(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: t.badge, color: t.textSub }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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