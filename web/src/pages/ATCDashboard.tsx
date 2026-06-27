import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Radio, Clock, Calendar, Plane,
  LogOut, Sun, Moon, Check, X, Users,
  Navigation, ChevronLeft, ChevronRight, Shield,
  MapPin, Search, AlertTriangle,
  Headphones, BarChart3, CheckSquare, Square,
  ArrowRight, Loader, TowerControl, Map,
  Airplay, Radar, Satellite
} from 'lucide-react'
import { useThemeStore } from '../store/theme.store'
import { useATCStore } from '../store/atc.store'
import api from '../lib/axios'

const POSITIONS = ['DEL', 'GND', 'TWR', 'APR', 'CTR']
const AIRPORTS = ['DEP', 'ARR']

function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = 0; h < 24; h++) {
    const hh = String(h).padStart(2, '0')
    slots.push(`${hh}:00-${hh}:30`)
    slots.push(`${hh}:30-${String(h + 1).padStart(2, '0')}:00`)
  }
  return slots
}
const TIME_SLOTS = generateTimeSlots()

const POSITION_LABELS: Record<string, string> = {
  DEL: 'Clearance',
  GND: 'Ground',
  TWR: 'Tower',
  APR: 'Approach',
  CTR: 'Center',
}

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview', id: 'overview' },
  { icon: TowerControl, label: 'Schedule', id: 'schedule' },
  { icon: Plane, label: 'Flights', id: 'flights' },
  { icon: Users, label: 'Staff', id: 'staff' },
]

function generateNext14Days() {
  const days = []
  const today = new Date()
  for (let i = 0; i < 14; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    days.push({
      date: d.toISOString().split('T')[0],
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    })
  }
  return days
}

export default function ATCDashboard() {
  const { logout: atcLogout, user: atcUser } = useATCStore()
  const { isDark, toggle } = useThemeStore()
  const navigate = useNavigate()

  const [active, setActive] = useState('overview')
  const [gmtTime, setGmtTime] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [pinned, setPinned] = useState(true)

  const [dailyHub, setDailyHub] = useState<any>(null)
  const [mySchedule, setMySchedule] = useState<any[]>([])
  const [allSchedules, setAllSchedules] = useState<any[]>([])
  const [flights, setFlights] = useState<any[]>([])
  const [positionStatus, setPositionStatus] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const days = generateNext14Days()
  const [selectedDay, setSelectedDay] = useState(days[0].date)
  const [selectedPosition, setSelectedPosition] = useState('')
  const [selectedAirport, setSelectedAirport] = useState('DEP')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')
  const [scheduleLoading, setScheduleLoading] = useState(false)

  const [flightSearch, setFlightSearch] = useState('')

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
    success: 'rgba(16,185,129,0.08)',
    successBorder: 'rgba(16,185,129,0.2)',
    error: 'rgba(239,68,68,0.1)',
    errorBorder: 'rgba(239,68,68,0.2)',
  }

  const inputStyle = {
    background: t.input,
    border: `1px solid ${t.border}`,
    color: t.text,
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
  }

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setGmtTime(`${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('kf_atc_token')
      const headers = { Authorization: `Bearer ${token}` }

      const [hubRes, mySchedRes, allSchedRes, flightsRes, statsRes, posRes] = await Promise.all([
        api.get('/atc/daily-hub').catch(() => ({ data: null })),
        api.get('/atc/my-schedule', { headers }).catch(() => ({ data: [] })),
        api.get('/atc/schedules', { headers }).catch(() => ({ data: [] })),
        api.get('/atc/flights', { headers }).catch(() => ({ data: [] })),
        api.get('/atc/stats', { headers }).catch(() => ({ data: null })),
        api.get('/atc/position-status', { headers }).catch(() => ({ data: [] })),
      ])

      setDailyHub(hubRes.data)
      setMySchedule(mySchedRes.data)
      setAllSchedules(allSchedRes.data)
      setFlights(flightsRes.data)
      setStats(statsRes.data)
      setPositionStatus(posRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.body.style.background = t.bg
  }, [isDark, t.bg])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleBookSchedule = async () => {
    if (!selectedPosition || !selectedTimeSlot) {
      setMsg('Please select a position and time slot')
      return
    }
    setScheduleLoading(true)
    setMsg('')
    try {
      const token = localStorage.getItem('kf_atc_token')
      await api.post('/atc/schedule', {
        date: selectedDay,
        position: selectedPosition,
        airport: selectedAirport,
        timeSlot: selectedTimeSlot,
      }, { headers: { Authorization: `Bearer ${token}` } })
      setMsg('Schedule booked!')
      fetchAll()
    } catch (err: any) {
      setMsg(err.response?.data?.error || 'Failed to book schedule')
    } finally {
      setScheduleLoading(false)
    }
  }

  const handleCancelSchedule = async (id: string) => {
    if (!confirm('Cancel this schedule booking?')) return
    try {
      const token = localStorage.getItem('kf_atc_token')
      await api.delete(`/atc/schedule/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      fetchAll()
    } catch (err) { console.error(err) }
  }

  const handleToggleFlight = async (flightId: string, field: 'depConfirmed' | 'arrConfirmed') => {
    try {
      const token = localStorage.getItem('kf_atc_token')
      await api.patch(`/atc/flights/${flightId}/toggle`, { field }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchAll()
    } catch (err) { console.error(err) }
  }

  const handleLogout = () => {
    atcLogout()
    navigate('/atc/login')
  }

  const positionColor = (pos: string) => {
    const colors: any = {
      DEL: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
      GND: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
      TWR: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
      APR: { bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6' },
      CTR: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
    }
    return colors[pos] || { bg: t.badge, color: t.textSub }
  }

  const StatusBadge = ({ label, color, bg }: { label: string; color: string; bg: string }) => (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: bg, color }}>
      {label}
    </span>
  )

  // ── Find my booked positions for a given slot & airport ──
  const myBookedPositions = mySchedule
    .filter(s => s.date === selectedDay)
    .map(s => `${s.airport}-${s.position}`)

  const renderContent = () => {
    if (loading) return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: '#c0121e', borderTopColor: 'transparent' }} />
      </div>
    )

    switch (active) {

      // ═══════════════════ OVERVIEW ═══════════════════
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Daily Hub Card — shows BOTH airports */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-6 overflow-hidden relative"
              style={{
                background: isDark ? 'linear-gradient(135deg, #1a0000, #0a0a0a)' : 'linear-gradient(135deg, #fff5f5, #ffffff)',
                border: `1px solid ${isDark ? 'rgba(192,18,30,0.2)' : 'rgba(192,18,30,0.15)'}`,
              }}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[80px] rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={14} style={{ color: '#c0121e' }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#c0121e' }}>
                    Today's Operations
                  </span>
                </div>
                {dailyHub ? (
                  <>
                    <div className="flex items-center gap-6 flex-wrap">
                      {/* Departure */}
                      <div className="flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                          Departure Airport
                        </div>
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="text-4xl font-black italic tracking-tighter" style={{ color: isDark ? '#ffffff' : '#0a0a0a' }}>
                              {dailyHub.depIcao}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                              {dailyHub.depName}
                            </div>
                          </div>
                          <ArrowRight size={20} style={{ color: '#c0121e' }} />
                          <div>
                            <div className="text-4xl font-black italic tracking-tighter" style={{ color: isDark ? '#ffffff' : '#0a0a0a' }}>
                              {dailyHub.arrIcao}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                              {dailyHub.arrName}
                            </div>
                          </div>
                          <div className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                            Arrival Airport
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pb-1">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                          style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                          <Calendar size={12} style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }} />
                          <span className="text-xs font-semibold" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                            {new Date(dailyHub.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Coverage summary */}
                    <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
                        <span className="text-xs font-medium" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                          {stats?.positionsFilled || 0} total positions filled today
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: '#3b82f6' }} />
                        <span className="text-xs font-medium" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                          {stats?.flightsToday || 0} flights scheduled
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
                    <span className="text-sm font-medium" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                      No hub set for today. Check back later.
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Staff Online', value: stats?.staffOnline || 0, icon: Headphones, color: '#3b82f6' },
                { label: 'Positions Filled', value: stats?.positionsFilled || 0, icon: Radio, color: '#10b981' },
                { label: 'Flights Today', value: stats?.flightsToday || 0, icon: Plane, color: '#f59e0b' },
                { label: 'My Schedules', value: mySchedule.length, icon: Calendar, color: '#8b5cf6' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-2xl" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs" style={{ color: t.textSub }}>{s.label}</div>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18` }}>
                      <s.icon size={14} style={{ color: s.color }} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: t.text }}>{s.value}</div>
                </motion.div>
              ))}
            </div>

            {/* Traffic Summary */}
            {stats && (
              <div className="grid grid-cols-2 gap-4">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="p-4 rounded-2xl" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 size={14} style={{ color: '#10b981' }} />
                    <span className="text-xs font-semibold" style={{ color: t.textSub }}>Flights Booked</span>
                  </div>
                  <div className="text-xl font-bold" style={{ color: '#10b981' }}>{stats.flightsBooked || 0}</div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="p-4 rounded-2xl" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Check size={14} style={{ color: '#8b5cf6' }} />
                    <span className="text-xs font-semibold" style={{ color: t.textSub }}>Flights Completed</span>
                  </div>
                  <div className="text-xl font-bold" style={{ color: '#8b5cf6' }}>{stats.flightsCompleted || 0}</div>
                </motion.div>
              </div>
            )}

            {/* My Schedule */}
            <div className="rounded-2xl overflow-hidden" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-2.5">
                  <Calendar size={15} style={{ color: '#c0121e' }} />
                  <span className="text-sm font-semibold" style={{ color: t.text }}>My Schedule</span>
                </div>
                <button onClick={() => setActive('schedule')}
                  className="text-xs font-medium" style={{ color: '#c0121e' }}>
                  Book Slot →
                </button>
              </div>
              {mySchedule.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <div className="text-center">
                    <Calendar size={28} style={{ color: t.textMuted, margin: '0 auto 8px' }} />
                    <div className="text-sm" style={{ color: t.textSub }}>No schedules booked yet</div>
                    <button onClick={() => setActive('schedule')}
                      className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                      Book Your First Slot
                    </button>
                  </div>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: t.border }}>
                  {mySchedule.slice(0, 5).map((s: any) => {
                    const pc = positionColor(s.position)
                    return (
                      <div key={s.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded-lg text-xs font-bold font-mono"
                            style={{ background: pc.bg, color: pc.color }}>
                            {s.position}
                          </span>
                          <div>
                            <div className="text-sm font-medium" style={{ color: t.text }}>
                              {new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} — {s.airport}
                            </div>
                            <div className="text-xs" style={{ color: t.textSub }}>{s.timeSlot} UTC</div>
                          </div>
                        </div>
                        <button onClick={() => handleCancelSchedule(s.id)}
                          className="p-1.5 rounded-lg flex-shrink-0"
                          style={{ background: t.error, color: '#ef4444' }}>
                          <X size={13} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )

      // ═══════════════════ SCHEDULE ═══════════════════
      case 'schedule':
        return (
          <div className="space-y-6">
            {/* Book Schedule */}
            <div className="rounded-2xl p-6" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(192,18,30,0.1)' }}>
                  <Calendar size={16} style={{ color: '#c0121e' }} />
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: t.text }}>Book ATC Slot</div>
                  <div className="text-xs" style={{ color: t.textMuted }}>Select airport, position, and time</div>
                </div>
              </div>

              {/* Day selector */}
              <div className="mb-5">
                <label className="block text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: t.textMuted }}>
                  SELECT DAY
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                  {days.map(d => (
                    <button key={d.date}
                      onClick={() => setSelectedDay(d.date)}
                      className="flex-shrink-0 px-4 py-3 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: selectedDay === d.date ? 'rgba(192,18,30,0.15)' : t.input,
                        border: `1px solid ${selectedDay === d.date ? 'rgba(192,18,30,0.4)' : t.border}`,
                        color: selectedDay === d.date ? '#c0121e' : t.textSub,
                      }}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Airport selector */}
              {dailyHub && (
                <div className="mb-5">
                  <label className="block text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: t.textMuted }}>
                    SELECT AIRPORT
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setSelectedAirport('DEP')}
                      className="p-4 rounded-xl text-left transition-all"
                      style={{
                        background: selectedAirport === 'DEP' ? 'rgba(16,185,129,0.1)' : t.input,
                        border: `1px solid ${selectedAirport === 'DEP' ? 'rgba(16,185,129,0.4)' : t.border}`,
                      }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Airplay size={14} style={{ color: '#10b981' }} />
                        <span className="text-sm font-bold" style={{ color: selectedAirport === 'DEP' ? '#10b981' : t.text }}>
                          Departure
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold" style={{ color: selectedAirport === 'DEP' ? '#10b981' : t.textSub }}>
                        {dailyHub.depIcao} — {dailyHub.depName}
                      </div>
                    </button>
                    <button onClick={() => setSelectedAirport('ARR')}
                      className="p-4 rounded-xl text-left transition-all"
                      style={{
                        background: selectedAirport === 'ARR' ? 'rgba(59,130,246,0.1)' : t.input,
                        border: `1px solid ${selectedAirport === 'ARR' ? 'rgba(59,130,246,0.4)' : t.border}`,
                      }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Satellite size={14} style={{ color: '#3b82f6' }} />
                        <span className="text-sm font-bold" style={{ color: selectedAirport === 'ARR' ? '#3b82f6' : t.text }}>
                          Arrival
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold" style={{ color: selectedAirport === 'ARR' ? '#3b82f6' : t.textSub }}>
                        {dailyHub.arrIcao} — {dailyHub.arrName}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Position selector */}
              <div className="mb-5">
                <label className="block text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: t.textMuted }}>
                  SELECT POSITION — {selectedAirport} ({selectedAirport === 'DEP' ? dailyHub?.depIcao : dailyHub?.arrIcao})
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {POSITIONS.map(pos => {
                    const pc = positionColor(pos)
                    const isBookedByMe = myBookedPositions.includes(`${selectedAirport}-${pos}`)
                    return (
                      <button key={pos}
                        onClick={() => setSelectedPosition(pos)}
                        className="py-3 rounded-xl text-sm font-bold transition-all"
                        style={{
                          background: isBookedByMe ? 'rgba(192,18,30,0.08)' : selectedPosition === pos ? pc.bg : t.input,
                          border: `1px solid ${isBookedByMe ? 'rgba(192,18,30,0.3)' : selectedPosition === pos ? pc.color + '60' : t.border}`,
                          color: isBookedByMe ? '#c0121e' : selectedPosition === pos ? pc.color : t.textSub,
                          opacity: isBookedByMe ? 0.6 : 1,
                          cursor: isBookedByMe ? 'not-allowed' : 'pointer',
                        }}
                        title={isBookedByMe ? 'Already booked' : POSITION_LABELS[pos]}>
                        {pos}
                        {isBookedByMe && <div className="text-[9px] opacity-70">Booked</div>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Time slot selector - 30-min */}
              <div className="mb-5">
                <label className="block text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: t.textMuted }}>
                  SELECT TIME SLOT (30-min blocks — UTC)
                </label>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-1.5 max-h-48 overflow-y-auto"
                  style={{ scrollbarWidth: 'thin' }}>
                  {TIME_SLOTS.map(slot => {
                    const status = positionStatus.find(ps => ps.timeSlot === slot && ps.airport === selectedAirport)
                    const posStatus = status?.positions?.find((p: any) => p.position === selectedPosition)
                    const alreadyFilled = posStatus?.filled
                    return (
                      <button key={slot}
                        onClick={() => !alreadyFilled && setSelectedTimeSlot(prev => prev === slot ? '' : slot)}
                        className="py-2 rounded-lg text-[11px] font-medium transition-all"
                        style={{
                          background: selectedTimeSlot === slot ? 'rgba(192,18,30,0.15)' : alreadyFilled ? 'rgba(16,185,129,0.08)' : t.input,
                          border: `1px solid ${selectedTimeSlot === slot ? 'rgba(192,18,30,0.4)' : alreadyFilled ? 'rgba(16,185,129,0.2)' : t.border}`,
                          color: selectedTimeSlot === slot ? '#c0121e' : alreadyFilled ? '#10b981' : t.textSub,
                          opacity: alreadyFilled ? 0.6 : 1,
                          cursor: alreadyFilled ? 'not-allowed' : 'pointer',
                        }}
                        title={alreadyFilled ? `Already filled at ${selectedAirport}` : `Book ${slot}`}>
                        {slot}
                      </button>
                    )
                  })}
                </div>
              </div>

              {msg && (
                <div className="mb-4 px-4 py-3 rounded-xl text-xs"
                  style={{
                    background: msg.includes('fail') || msg.includes('Please') ? t.error : t.success,
                    border: `1px solid ${msg.includes('fail') || msg.includes('Please') ? t.errorBorder : t.successBorder}`,
                    color: msg.includes('fail') || msg.includes('Please') ? '#ef4444' : '#10b981',
                  }}>
                  {msg}
                </div>
              )}

              <button onClick={handleBookSchedule}
                disabled={scheduleLoading}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all"
                style={{
                  background: scheduleLoading ? 'rgba(192,18,30,0.5)' : 'linear-gradient(135deg, #c0121e, #8b0000)',
                  boxShadow: scheduleLoading ? 'none' : '0 0 20px rgba(192,18,30,0.3)',
                }}>
                {scheduleLoading ? 'Booking...' : `Book ${selectedPosition || 'Position'} @ ${selectedAirport} — ${selectedTimeSlot || 'Select Slot'}`}
              </button>
            </div>

            {/* Position Status Grid — shows filled/empty positions per slot */}
            {dailyHub && (
              <div className="rounded-2xl overflow-hidden" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <div className="px-5 py-4" style={{ borderBottom: `1px solid ${t.border}` }}>
                  <div className="flex items-center gap-2.5">
                    <Radar size={15} style={{ color: '#c0121e' }} />
                    <span className="text-sm font-semibold" style={{ color: t.text }}>Position Coverage — {dailyHub.depIcao} / {dailyHub.arrIcao}</span>
                  </div>
                </div>
                <div className="overflow-auto" style={{ maxHeight: 480 }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                        <th className="px-3 py-2 text-left font-semibold" style={{ color: t.textMuted, minWidth: 80 }}>
                          Slot
                        </th>
                        <th className="px-3 py-2 text-center font-semibold" style={{ color: '#10b981' }} colSpan={5}>
                          DEP ({dailyHub?.depIcao})
                        </th>
                        <th className="px-3 py-2 text-center font-semibold" style={{ color: '#3b82f6' }} colSpan={5}>
                          ARR ({dailyHub?.arrIcao})
                        </th>
                      </tr>
                      <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                        <th className="px-3 py-1"></th>
                        {POSITIONS.map(pos => (
                          <th key={`dep-${pos}`} className="px-2 py-1 text-center font-semibold text-[10px]" style={{ color: '#10b981' }}>
                            {pos}
                          </th>
                        ))}
                        {POSITIONS.map(pos => (
                          <th key={`arr-${pos}`} className="px-2 py-1 text-center font-semibold text-[10px]" style={{ color: '#3b82f6' }}>
                            {pos}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: t.border }}>
                      {positionStatus
                        .filter((ps: any) => ps.airport === 'DEP')
                        .map((depSlot: any) => {
                          const arrSlot = positionStatus.find((ps: any) => ps.timeSlot === depSlot.timeSlot && ps.airport === 'ARR')
                          const allPos = [
                            ...depSlot.positions,
                            ...(arrSlot?.positions || []),
                          ]
                          return (
                            <tr key={depSlot.timeSlot}
                              onMouseEnter={e => e.currentTarget.style.background = t.navHover}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <td className="px-3 py-2 font-mono font-semibold" style={{ color: t.text }}>
                                {depSlot.timeSlot}
                              </td>
                              {allPos.map((p: any, i: number) => (
                                <td key={i} className="px-2 py-2 text-center">
                                  <div className="w-5 h-5 rounded mx-auto flex items-center justify-center"
                                    style={{
                                      background: p.filled
                                        ? (i < 5 ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)')
                                        : t.badge,
                                      color: p.filled
                                        ? (i < 5 ? '#10b981' : '#3b82f6')
                                        : t.textMuted,
                                    }}>
                                    {p.filled ? <Check size={10} /> : <X size={10} />}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* My Booked Schedules */}
            <div className="rounded-2xl overflow-hidden" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-2.5">
                  <Calendar size={15} style={{ color: '#c0121e' }} />
                  <span className="text-sm font-semibold" style={{ color: t.text }}>My Schedules ({mySchedule.length})</span>
                </div>
              </div>
              {mySchedule.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <div className="text-sm" style={{ color: t.textSub }}>No schedules booked</div>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: t.border }}>
                  {mySchedule.map((s: any) => {
                    const pc = positionColor(s.position)
                    return (
                      <div key={s.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded-lg text-xs font-bold font-mono"
                            style={{ background: pc.bg, color: pc.color }}>
                            {s.position}
                          </span>
                          <div>
                            <div className="text-sm font-medium" style={{ color: t.text }}>
                              {new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                              <span className="ml-2 text-xs" style={{ color: s.airport === 'DEP' ? '#10b981' : '#3b82f6' }}>
                                {s.airport === 'DEP' ? `${dailyHub?.depIcao || 'DEP'}` : `${dailyHub?.arrIcao || 'ARR'}`}
                              </span>
                            </div>
                            <div className="text-xs" style={{ color: t.textSub }}>{s.timeSlot} UTC</div>
                          </div>
                        </div>
                        <button onClick={() => handleCancelSchedule(s.id)}
                          className="p-1.5 rounded-lg flex-shrink-0"
                          style={{ background: t.error, color: '#ef4444' }}>
                          <X size={13} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )

      // ═══════════════════ FLIGHTS ═══════════════════
      case 'flights':
        const filteredFlights = flights.filter((f: any) =>
          `${f.flightNumber} ${f.depIcao} ${f.arrIcao} ${f.pilotName}`.toLowerCase().includes(flightSearch.toLowerCase())
        )
        const bookedFlights = flights.filter((f: any) => f.status !== 'AVAILABLE')
        const completedFlights = flights.filter((f: any) => f.status === 'COMPLETED')
        return (
          <div className="space-y-4">
            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <div className="text-xs" style={{ color: t.textSub }}>Total</div>
                <div className="text-lg font-bold" style={{ color: t.text }}>{flights.length}</div>
              </div>
              <div className="p-3 rounded-xl" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <div className="text-xs" style={{ color: t.textSub }}>Booked</div>
                <div className="text-lg font-bold" style={{ color: '#3b82f6' }}>{bookedFlights.length}</div>
              </div>
              <div className="p-3 rounded-xl" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <div className="text-xs" style={{ color: t.textSub }}>Completed</div>
                <div className="text-lg font-bold" style={{ color: '#10b981' }}>{completedFlights.length}</div>
              </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <Search size={15} style={{ color: t.textMuted }} />
                <input value={flightSearch} onChange={e => setFlightSearch(e.target.value)}
                  placeholder="Search flights..."
                  className="flex-1 bg-transparent outline-none text-sm" style={{ color: t.text }} />
                {flightSearch && (
                  <button onClick={() => setFlightSearch('')}><X size={14} style={{ color: t.textMuted }} /></button>
                )}
              </div>
              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: t.card, border: `1px solid ${t.border}`, color: t.textSub }}>
                {filteredFlights.length} flights
              </div>
            </div>

            {filteredFlights.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Plane size={40} style={{ color: t.textMuted, marginBottom: 12 }} strokeWidth={1.5} />
                <div className="text-sm font-medium mb-1" style={{ color: t.textSub }}>No flights scheduled today</div>
                <div className="text-xs" style={{ color: t.textMuted }}>Flights appear once all positions at both airports are staffed</div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFlights.map((f: any) => (
                  <motion.div key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm font-bold font-mono" style={{ color: '#c0121e' }}>
                            {f.flightNumber}
                          </span>
                          <StatusBadge
                            label={f.status || 'Scheduled'}
                            color={f.status === 'COMPLETED' ? '#10b981' : f.status === 'BOOKED' ? '#3b82f6' : '#6b7280'}
                            bg={f.status === 'COMPLETED' ? 'rgba(16,185,129,0.1)' : f.status === 'BOOKED' ? 'rgba(59,130,246,0.1)' : 'rgba(107,114,128,0.1)'}
                          />
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-center">
                            <div className="text-xl font-bold" style={{ color: t.text }}>{f.depIcao}</div>
                            <div className="text-xs" style={{ color: t.textSub }}>{f.depName}</div>
                          </div>
                          <ArrowRight size={14} style={{ color: t.textMuted }} />
                          <div className="text-center">
                            <div className="text-xl font-bold" style={{ color: t.text }}>{f.arrIcao}</div>
                            <div className="text-xs" style={{ color: t.textSub }}>{f.arrName}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-wrap text-xs" style={{ color: t.textSub }}>
                          {f.pilotName && (
                            <div className="flex items-center gap-1">
                              <Users size={12} />
                              {f.pilotName}
                            </div>
                          )}
                          {f.offBlock && (
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              OB: {f.offBlock}
                            </div>
                          )}
                          {f.network && (
                            <div className="flex items-center gap-1">
                              <Radio size={12} />
                              {f.network}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {f.status === 'BOOKED' ? (
                          <>
                            <button onClick={() => handleToggleFlight(f.id, 'depConfirmed')}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                              style={{
                                background: f.depConfirmed ? t.success : t.badge,
                                border: `1px solid ${f.depConfirmed ? t.successBorder : t.border}`,
                                color: f.depConfirmed ? '#10b981' : t.textSub,
                              }}>
                              {f.depConfirmed ? <CheckSquare size={14} /> : <Square size={14} />}
                              Dep Confirmed
                            </button>
                            <button onClick={() => handleToggleFlight(f.id, 'arrConfirmed')}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                              style={{
                                background: f.arrConfirmed ? t.success : t.badge,
                                border: `1px solid ${f.arrConfirmed ? t.successBorder : t.border}`,
                                color: f.arrConfirmed ? '#10b981' : t.textSub,
                              }}>
                              {f.arrConfirmed ? <CheckSquare size={14} /> : <Square size={14} />}
                              Arr Confirmed
                            </button>
                          </>
                        ) : f.status === 'AVAILABLE' ? (
                          <div className="px-3 py-2 rounded-xl text-xs" style={{ background: t.badge, color: t.textMuted }}>
                            Not booked
                          </div>
                        ) : (
                          <div className="px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: t.success, color: '#10b981' }}>
                            {f.depConfirmed && f.arrConfirmed ? 'ALL CONFIRMED' : 'Completed'}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )

      // ═══════════════════ STAFF ═══════════════════
      case 'staff':
        // Group by airport for display
        const depStaff = allSchedules.filter((s: any) => s.airport === 'DEP')
        const arrStaff = allSchedules.filter((s: any) => s.airport === 'ARR')
        return (
          <div className="space-y-6">
            {/* DEP Staff */}
            <div className="rounded-2xl overflow-hidden" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="px-5 py-4" style={{
                borderBottom: `1px solid ${t.border}`,
                background: 'rgba(16,185,129,0.03)',
              }}>
                <div className="flex items-center gap-2.5">
                  <Airplay size={15} style={{ color: '#10b981' }} />
                  <span className="text-sm font-semibold" style={{ color: t.text }}>
                    Departure Staff — {dailyHub?.depIcao || 'DEP'} ({depStaff.length})
                  </span>
                </div>
              </div>
              {depStaff.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm" style={{ color: t.textSub }}>No departure staff scheduled</div>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: t.border }}>
                  {depStaff.map((s: any) => {
                    const pc = positionColor(s.position)
                    return (
                      <div key={s.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                            style={{ background: pc.bg, color: pc.color }}>
                            {s.staffName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '??'}
                          </div>
                          <div>
                            <div className="text-sm font-medium" style={{ color: t.text }}>
                              {s.staffName || 'Unknown'}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="px-1.5 py-0.5 rounded text-xs font-bold font-mono"
                                style={{ background: pc.bg, color: pc.color }}>
                                {s.position}
                              </span>
                              <span className="text-xs" style={{ color: t.textSub }}>
                                {new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              </span>
                              <span className="text-xs" style={{ color: t.textMuted }}>
                                {s.timeSlot}
                              </span>
                            </div>
                          </div>
                        </div>
                        <StatusBadge
                          label={s.status || 'Booked'}
                          color={s.status === 'ACTIVE' ? '#10b981' : t.textSub}
                          bg={s.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : t.badge}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ARR Staff */}
            <div className="rounded-2xl overflow-hidden" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="px-5 py-4" style={{
                borderBottom: `1px solid ${t.border}`,
                background: 'rgba(59,130,246,0.03)',
              }}>
                <div className="flex items-center gap-2.5">
                  <Satellite size={15} style={{ color: '#3b82f6' }} />
                  <span className="text-sm font-semibold" style={{ color: t.text }}>
                    Arrival Staff — {dailyHub?.arrIcao || 'ARR'} ({arrStaff.length})
                  </span>
                </div>
              </div>
              {arrStaff.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm" style={{ color: t.textSub }}>No arrival staff scheduled</div>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: t.border }}>
                  {arrStaff.map((s: any) => {
                    const pc = positionColor(s.position)
                    return (
                      <div key={s.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                            style={{ background: pc.bg, color: pc.color }}>
                            {s.staffName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '??'}
                          </div>
                          <div>
                            <div className="text-sm font-medium" style={{ color: t.text }}>
                              {s.staffName || 'Unknown'}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="px-1.5 py-0.5 rounded text-xs font-bold font-mono"
                                style={{ background: pc.bg, color: pc.color }}>
                                {s.position}
                              </span>
                              <span className="text-xs" style={{ color: t.textSub }}>
                                {new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              </span>
                              <span className="text-xs" style={{ color: t.textMuted }}>
                                {s.timeSlot}
                              </span>
                            </div>
                          </div>
                        </div>
                        <StatusBadge
                          label={s.status || 'Booked'}
                          color={s.status === 'ACTIVE' ? '#10b981' : t.textSub}
                          bg={s.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : t.badge}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
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
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                  <Radio size={14} style={{ color: 'white' }} />
                </div>
                <div>
                  <div className="font-bold text-xs leading-tight" style={{ color: t.text }}>ATC Center</div>
                  <div className="text-xs leading-tight" style={{ color: '#c0121e' }}>Staff Dashboard</div>
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
                    className="p-1.5 rounded-lg" style={{ color: t.textMuted }}>
                    <ChevronLeft size={14} />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
              <Radio size={14} style={{ color: 'white' }} />
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5" style={{ scrollbarWidth: 'none' }}>
          {NAV_ITEMS.map(item => {
            const isActive = active === item.id
            return (
              <button key={item.id}
                onClick={() => setActive(item.id)}
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
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
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
        <div className="flex-shrink-0 px-3 pt-3 pb-4 space-y-0.5" style={{ borderTop: `1px solid ${t.border}` }}>
          <div className="flex items-center rounded-xl px-3 py-2 gap-2.5"
            style={{ color: t.textSub, minHeight: '36px' }}>
            <Radio size={14} style={{ color: '#c0121e' }} />
            {isExpanded && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate" style={{ color: t.text }}>
                  {atcUser?.firstName} {atcUser?.lastName}
                </div>
                <div className="text-[10px]" style={{ color: '#c0121e' }}>{atcUser?.position || 'ATC'}</div>
              </div>
            )}
          </div>
          <Link to="/"
            title={!isExpanded ? 'Main Site' : undefined}
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
            {isExpanded && <span className="text-sm font-medium">Main Site</span>}
          </Link>
          <button
            onClick={handleLogout}
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
              <Radio size={15} style={{ color: '#c0121e' }} />
              <h1 className="text-base font-bold" style={{ color: t.text }}>
                {NAV_ITEMS.find(n => n.id === active)?.label || 'ATC'}
              </h1>
            </div>
            <p className="text-xs" style={{ color: t.textMuted }}>Kingfisher VA — ATC Operations</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: t.badge }}>
              <Clock size={11} style={{ color: '#c0121e' }} />
              <span className="text-xs font-bold font-mono tracking-widest" style={{ color: t.text }}>
                {gmtTime}
              </span>
              <span className="text-xs font-semibold" style={{ color: '#c0121e' }}>Z</span>
            </div>
            <button onClick={toggle}
              className="p-2 rounded-xl transition-colors" style={{ background: t.badge, color: t.textSub }}>
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
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
        <footer className="px-6 py-4" style={{ borderTop: `1px solid ${t.border}`, background: t.sidebar }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Radio size={14} style={{ color: '#c0121e' }} />
              <span className="text-xs font-semibold" style={{ color: t.text }}>ATC Center</span>
              <span className="text-xs" style={{ color: t.textMuted }}>v2.0.0</span>
            </div>
            <div className="flex items-center gap-2">
              <Headphones size={11} style={{ color: '#c0121e' }} />
              <span className="text-xs" style={{ color: t.textMuted }}>Authorized Staff Only</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
