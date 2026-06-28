import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plane, Navigation, Clock, Search, Filter,
  ChevronRight, X, Calendar, Globe, Radio,
  DollarSign, Award, Info, Check, ArrowRight,
  MapPin, Shield, Users, AlertTriangle
} from 'lucide-react'
import { useThemeStore } from '../store/theme.store'
import { useAuthStore } from '../store/auth.store'
import api from '../lib/axios'

const NETWORKS = ['VATSIM', 'IVAO']

export default function RealisticFlights() {
  const { isDark } = useThemeStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const [flights, setFlights] = useState<any[]>([])
  const [myBookings, setMyBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedFlight, setSelectedFlight] = useState<any>(null)
  const [view, setView] = useState<'browse' | 'mybookings'>('browse')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingMsg, setBookingMsg] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [networkFilter, setNetworkFilter] = useState<string>('')
  const [cancelTarget, setCancelTarget] = useState<any>(null)
  const [cancelLoading, setCancelLoading] = useState(false)

  const t = {
    bg: isDark ? '#0f0f0f' : '#f0f2f5',
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
    error: 'rgba(239,68,68,0.1)',
  }

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [f, b] = await Promise.all([
        api.get('/realistic-flights'),
        api.get('/realistic-flights/my'),
      ])
      setFlights(f.data)
      setMyBookings(b.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredFlights = flights.filter(f => {
    const matchesSearch = `${f.flightNumber} ${f.depIcao} ${f.arrIcao} ${f.depName} ${f.arrName}`
      .toLowerCase().includes(search.toLowerCase())
    const matchesNetwork = !networkFilter || f.network === networkFilter
    return matchesSearch && matchesNetwork
  })

  const handleBook = async () => {
    if (!selectedFlight) return
    setBookingLoading(true)
    setBookingMsg('')
    try {
      await api.post('/realistic-flights/book', { flightId: selectedFlight.id })
      setBookingSuccess(true)
      fetchData()
    } catch (err: any) {
      setBookingMsg(err.response?.data?.error || 'Booking failed')
    } finally {
      setBookingLoading(false)
    }
  }

  const handleCancel = async (id: string) => {
    setCancelLoading(true)
    try {
      await api.patch(`/realistic-flights/${id}/cancel`)
      setCancelTarget(null)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Cancellation failed')
    } finally {
      setCancelLoading(false)
    }
  }

  const calcEarnings = (flight: any) => {
    const m = flight.estimatedFlightTime?.match(/(\d+)\s*h\s*(\d+)?/)
    if (!m) return '$0'
    const hrs = parseInt(m[1]) + (parseInt(m[2] || '0') / 60)
    return `$${Math.round(hrs * 700).toLocaleString()}`
  }

  const getStatusStyle = (status: string) => {
    const map: any = {
      AVAILABLE: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Available' },
      BOOKED: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'Booked' },
      COMPLETED: { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', label: 'Completed' },
      CANCELLED: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Cancelled' },
    }
    return map[status] || map.AVAILABLE
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: t.bg }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: '#c0121e', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: t.bg, color: t.text }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-6 py-4"
        style={{
          background: isDark ? 'rgba(15,15,15,0.92)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${t.border}`,
        }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 text-sm transition-colors"
              style={{ color: t.textSub, textDecoration: 'none' }}>
              ← Dashboard
            </Link>
            <div className="w-px h-4" style={{ background: t.border }} />
            <div className="flex items-center gap-2">
              <Shield size={16} style={{ color: '#c0121e' }} />
              <span className="font-bold text-base" style={{ color: t.text }}>Realistic Flight Operations</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setView('browse')}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: view === 'browse' ? t.navActive : 'transparent',
                color: view === 'browse' ? '#c0121e' : t.textSub,
                border: `1px solid ${view === 'browse' ? 'rgba(192,18,30,0.2)' : 'transparent'}`,
              }}>
              Available Flights
            </button>
            <button onClick={() => setView('mybookings')}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors relative"
              style={{
                background: view === 'mybookings' ? t.navActive : 'transparent',
                color: view === 'mybookings' ? '#c0121e' : t.textSub,
                border: `1px solid ${view === 'mybookings' ? 'rgba(192,18,30,0.2)' : 'transparent'}`,
              }}>
              My Bookings
              {myBookings.filter((b: any) => b.status === 'BOOKED').length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center text-white"
                  style={{ background: '#c0121e', fontSize: '10px' }}>
                  {myBookings.filter((b: any) => b.status === 'BOOKED').length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* ── BROWSE FLIGHTS ── */}
        {view === 'browse' && (
          <div>
            {/* Search & Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex-1 min-w-[200px] flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <Search size={15} style={{ color: t.textMuted }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by flight number, airport..."
                  className="flex-1 bg-transparent outline-none text-sm" style={{ color: t.text }} />
                {search && <button onClick={() => setSearch('')}><X size={14} style={{ color: t.textMuted }} /></button>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setNetworkFilter('')}
                  className="px-4 py-3 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: !networkFilter ? t.navActive : t.card,
                    border: `1px solid ${!networkFilter ? 'rgba(192,18,30,0.4)' : t.border}`,
                    color: !networkFilter ? '#c0121e' : t.textSub,
                  }}>
                  All Networks
                </button>
                {NETWORKS.map(net => (
                  <button key={net} onClick={() => setNetworkFilter(net)}
                    className="px-4 py-3 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: networkFilter === net ? t.navActive : t.card,
                      border: `1px solid ${networkFilter === net ? 'rgba(192,18,30,0.4)' : t.border}`,
                      color: networkFilter === net ? '#c0121e' : t.textSub,
                    }}>
                    {net}
                  </button>
                ))}
              </div>
              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: t.card, border: `1px solid ${t.border}`, color: t.textSub }}>
                {filteredFlights.length} flights
              </div>
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 rounded-xl mb-6"
              style={{ background: 'rgba(192,18,30,0.06)', border: '1px solid rgba(192,18,30,0.12)' }}>
              <Shield size={16} style={{ color: '#c0121e', flexShrink: 0, marginTop: 2 }} />
              <div className="text-xs leading-relaxed" style={{ color: t.textSub }}>
                <span className="font-semibold" style={{ color: '#c0121e' }}>Full ATC Coverage</span> — Flights are for today only and generated daily based on ATC staff availability.
                Only book if you can fly during the scheduled time. Ground controllers at both airports will confirm your flight.
              </div>
            </div>

            {/* Flight Cards */}
            {filteredFlights.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Plane size={40} style={{ color: t.textMuted, marginBottom: 12 }} strokeWidth={1.5} />
                <div className="text-sm font-medium mb-1" style={{ color: t.textSub }}>No flights available</div>
                <div className="text-xs" style={{ color: t.textMuted }}>Check back tomorrow when ATC slots are fully staffed</div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFlights.map((flight, i) => {
                  const s = getStatusStyle(flight.status)
                  return (
                    <motion.div key={flight.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      onClick={() => {
                        if (flight.status === 'AVAILABLE') {
                          setSelectedFlight(flight)
                          setBookingSuccess(false)
                          setBookingMsg('')
                        }
                      }}
                      className="p-5 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                      style={{
                        background: t.card,
                        border: `1px solid ${flight.status === 'AVAILABLE' ? t.border : 'rgba(107,114,128,0.2)'}`,
                        opacity: flight.status === 'AVAILABLE' ? 1 : 0.6,
                        cursor: flight.status === 'AVAILABLE' ? 'pointer' : 'default',
                      }}
                      onMouseEnter={e => { if (flight.status === 'AVAILABLE') e.currentTarget.style.borderColor = 'rgba(192,18,30,0.4)' }}
                      onMouseLeave={e => e.currentTarget.style.borderColor = flight.status === 'AVAILABLE' ? t.border : 'rgba(107,114,128,0.2)'}>
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <img src="/logo.png" alt="KFR" className="w-8 h-8 object-contain" />
                          <span className="text-sm font-bold font-mono" style={{ color: '#c0121e' }}>
                            {flight.flightNumber}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      </div>

                      {/* Route */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold" style={{ color: t.text }}>{flight.depIcao}</div>
                          <div className="text-xs mt-0.5 truncate max-w-[80px]" style={{ color: t.textSub }}>{flight.depName}</div>
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex items-center gap-1">
                            <div className="flex-1 h-px" style={{ background: t.border }} />
                            <Plane size={14} style={{ color: '#c0121e' }} />
                            <div className="flex-1 h-px" style={{ background: t.border }} />
                          </div>
                          <div className="text-xs" style={{ color: t.textMuted }}>{flight.distance} nm</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold" style={{ color: t.text }}>{flight.arrIcao}</div>
                          <div className="text-xs mt-0.5 truncate max-w-[80px]" style={{ color: t.textSub }}>{flight.arrName}</div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} style={{ color: t.textMuted }} />
                          <span className="text-xs" style={{ color: t.textSub }}>
                            OB: {flight.offBlock} | IB: {flight.onBlock}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 justify-end">
                          <Radio size={12} style={{ color: t.textMuted }} />
                          <span className="text-xs font-semibold" style={{ color: t.textSub }}>
                            {flight.network}
                          </span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
                        <div className="flex items-center gap-1.5">
                          <Navigation size={12} style={{ color: t.textMuted }} />
                          <span className="text-xs" style={{ color: t.textSub }}>
                            {flight.estimatedFlightTime}
                          </span>
                        </div>
                        {flight.status === 'AVAILABLE' && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <DollarSign size={11} style={{ color: '#f59e0b' }} />
                              <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>
                                {calcEarnings(flight)}
                              </span>
                            </div>
                            <ChevronRight size={14} style={{ color: '#c0121e' }} />
                            <span className="text-xs font-semibold" style={{ color: '#c0121e' }}>Book</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── MY BOOKINGS ── */}
        {view === 'mybookings' && (
          <div className="space-y-4">
            {myBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Plane size={40} style={{ color: t.textMuted, marginBottom: 12 }} strokeWidth={1.5} />
                <div className="text-sm font-medium mb-1" style={{ color: t.textSub }}>No bookings yet</div>
                <div className="text-xs mb-4" style={{ color: t.textMuted }}>Browse today's available flights and book one!</div>
                <button onClick={() => setView('browse')}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                  Browse Flights
                </button>
              </div>
            ) : (
              myBookings.map((booking: any, i) => {
                const s = getStatusStyle(booking.status)
                return (
                  <motion.div key={booking.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="p-5 rounded-2xl"
                    style={{ background: t.card, border: `1px solid ${t.border}` }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm font-bold font-mono" style={{ color: '#c0121e' }}>
                            {booking.flightNumber}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: s.bg, color: s.color }}>
                            {s.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-center">
                            <div className="text-xl font-bold" style={{ color: t.text }}>{booking.depIcao}</div>
                            <div className="text-xs" style={{ color: t.textSub }}>{booking.depName}</div>
                          </div>
                          <ArrowRight size={16} style={{ color: t.textMuted }} />
                          <div className="text-center">
                            <div className="text-xl font-bold" style={{ color: t.text }}>{booking.arrIcao}</div>
                            <div className="text-xs" style={{ color: t.textSub }}>{booking.arrName}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} style={{ color: t.textMuted }} />
                            <span className="text-xs" style={{ color: t.textSub }}>
                              {booking.offBlock} — {booking.onBlock}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Radio size={12} style={{ color: t.textMuted }} />
                            <span className="text-xs" style={{ color: t.textSub }}>{booking.network}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <DollarSign size={12} style={{ color: '#f59e0b' }} />
                            <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>
                              ${booking.reward} reward
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {booking.status === 'BOOKED' && (
                          <button onClick={() => setCancelTarget(booking)}
                            className="px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                            style={{ background: t.error, color: '#ef4444' }}>
                            Cancel
                          </button>
                        )}
                        {booking.status === 'COMPLETED' && (
                          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                            style={{ background: t.success }}>
                            <Check size={13} style={{ color: '#10b981' }} />
                            <span className="text-xs font-semibold" style={{ color: '#10b981' }}>
                              Paid {calcEarnings(booking)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* ── BOOKING MODAL ── */}
      <AnimatePresence>
        {selectedFlight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) setSelectedFlight(null) }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-2xl flex flex-col"
              style={{ background: isDark ? '#141414' : '#ffffff', border: `1px solid ${t.border}`, maxHeight: '90vh' }}>

              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                    <Shield size={16} style={{ color: 'white' }} />
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: t.text }}>
                      {selectedFlight.flightNumber}
                    </div>
                    <div className="text-xs" style={{ color: t.textSub }}>
                      Realistic Flight Operation
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedFlight(null)}
                  className="p-2 rounded-xl transition-colors" style={{ color: t.textMuted }}
                  onMouseEnter={e => e.currentTarget.style.background = t.navHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <X size={18} />
                </button>
              </div>

              {bookingSuccess ? (
                <div className="px-6 py-12 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: t.success }}>
                    <Check size={32} style={{ color: '#10b981' }} />
                  </div>
                  <div className="text-lg font-bold mb-2" style={{ color: t.text }}>Flight Booked!</div>
                  <div className="text-sm mb-1" style={{ color: t.textSub }}>
                    {selectedFlight.flightNumber} — {selectedFlight.depIcao} → {selectedFlight.arrIcao}
                  </div>
                  <div className="text-xs mb-6" style={{ color: t.textMuted }}>
                    Off-block: {selectedFlight.offBlock} | Network: {selectedFlight.network}
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button onClick={() => { setSelectedFlight(null); setView('mybookings') }}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                      View My Bookings
                    </button>
                    <button onClick={() => setSelectedFlight(null)}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: t.badge, color: t.textSub }}>
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
                  {/* Route details */}
                  <div className="p-4 rounded-xl" style={{ background: t.navActive, border: '1px solid rgba(192,18,30,0.1)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: t.text }}>{selectedFlight.depIcao}</div>
                        <div className="text-xs" style={{ color: t.textSub }}>{selectedFlight.depName}</div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-px" style={{ background: 'rgba(192,18,30,0.3)' }} />
                          <Plane size={14} style={{ color: '#c0121e' }} />
                          <div className="w-12 h-px" style={{ background: 'rgba(192,18,30,0.3)' }} />
                        </div>
                        <div className="text-xs" style={{ color: t.textMuted }}>{selectedFlight.distance} nm</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: t.text }}>{selectedFlight.arrIcao}</div>
                        <div className="text-xs" style={{ color: t.textSub }}>{selectedFlight.arrName}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-3" style={{ borderTop: '1px solid rgba(192,18,30,0.1)' }}>
                      <div className="text-center">
                        <div className="text-xs font-semibold" style={{ color: t.text }}>{selectedFlight.offBlock}</div>
                        <div className="text-xs" style={{ color: t.textMuted }}>Off-Block</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold" style={{ color: t.text }}>{selectedFlight.onBlock}</div>
                        <div className="text-xs" style={{ color: t.textMuted }}>On-Block</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold" style={{ color: t.text }}>{selectedFlight.estimatedFlightTime}</div>
                        <div className="text-xs" style={{ color: t.textMuted }}>Est. Time</div>
                      </div>
                    </div>
                  </div>

                  {/* Info cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl" style={{ background: t.input, border: `1px solid ${t.border}` }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Radio size={12} style={{ color: '#8b5cf6' }} />
                        <span className="text-xs font-semibold" style={{ color: t.textMuted }}>Network</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: '#8b5cf6' }}>{selectedFlight.network}</span>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: t.input, border: `1px solid ${t.border}` }}>
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign size={12} style={{ color: '#f59e0b' }} />
                        <span className="text-xs font-semibold" style={{ color: t.textMuted }}>Reward ($700/hr)</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: '#f59e0b' }}>{calcEarnings(selectedFlight)}</span>
                    </div>
                  </div>

                  {/* Requirement notice */}
                  <div className="flex gap-2.5 p-3.5 rounded-xl"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                    <Info size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                    <div className="text-xs leading-relaxed" style={{ color: '#f59e0b' }}>
                      This is a network-only flight with full ATC coverage. You must fly on <strong>{selectedFlight.network}</strong> during the scheduled time slot.
                      Ground controllers will confirm your departure and arrival before reward is paid.
                    </div>
                  </div>

                  {/* Booking message */}
                  {bookingMsg && (
                    <div className="px-4 py-3 rounded-xl text-xs"
                      style={{ background: t.error, border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                      {bookingMsg}
                    </div>
                  )}

                  {/* Book button */}
                  <button onClick={handleBook}
                    disabled={bookingLoading}
                    className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all"
                    style={{
                      background: bookingLoading ? 'rgba(192,18,30,0.5)' : 'linear-gradient(135deg, #c0121e, #8b0000)',
                      boxShadow: bookingLoading ? 'none' : '0 0 20px rgba(192,18,30,0.3)',
                    }}>
                    {bookingLoading ? 'Booking...' : `Book ${selectedFlight.flightNumber}`}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CANCEL CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {cancelTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) setCancelTarget(null) }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md rounded-2xl"
              style={{ background: isDark ? '#141414' : '#ffffff', border: `1px solid ${t.border}` }}>
              <div className="px-6 py-5 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <AlertTriangle size={28} style={{ color: '#ef4444' }} />
                </div>
                <div className="text-lg font-bold mb-2" style={{ color: t.text }}>Cancel Booking?</div>
                <div className="text-sm mb-1" style={{ color: t.textSub }}>
                  {cancelTarget.flightNumber} — {cancelTarget.depIcao} → {cancelTarget.arrIcao}
                </div>
                <div className="flex items-center justify-center gap-2 mt-4 p-4 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <DollarSign size={16} style={{ color: '#ef4444' }} />
                  <span className="text-sm font-semibold" style={{ color: '#ef4444' }}>
                    $500 cancellation penalty will be deducted from your wallet
                  </span>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setCancelTarget(null)}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold"
                    style={{ background: t.badge, color: t.textSub }}>
                    Keep Booking
                  </button>
                  <button onClick={() => handleCancel(cancelTarget.id)}
                    disabled={cancelLoading}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
                    style={{
                      background: cancelLoading ? 'rgba(239,68,68,0.5)' : '#ef4444',
                    }}>
                    {cancelLoading ? 'Cancelling...' : 'Confirm Cancel'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
