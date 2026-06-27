import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plane, Navigation, Clock, Search, Filter,
  ChevronRight, X, Calendar, Globe, Radio,
  DollarSign, Award, Info, Check, ArrowRight
} from 'lucide-react'
import { useThemeStore } from '../store/theme.store'
import { useAuthStore } from '../store/auth.store'
import api from '../lib/axios'

const NETWORKS = ['Offline', 'VATSIM', 'IVAO']

export default function Flights() {
  const { isDark } = useThemeStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const [routes, setRoutes] = useState<any[]>([])
  const [aircraft, setAircraft] = useState<any[]>([])
  const [myBookings, setMyBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedRoute, setSelectedRoute] = useState<any>(null)
  const [view, setView] = useState<'browse' | 'mybookings'>('browse')
  const [bookingForm, setBookingForm] = useState({
    aircraftId: '',
    aircraftSearch: '',
    depTime: '',
    network: 'Offline',
  })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingMsg, setBookingMsg] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(false)

  const t = {
    bg: isDark ? '#0f0f0f' : '#f0f2f5',
    card: isDark ? '#141414' : '#ffffff',
    cardHover: isDark ? '#1a1a1a' : '#f8f9fa',
    border: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    text: isDark ? '#ffffff' : '#0a0a0a',
    textSub: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
    textMuted: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
    navActive: isDark ? 'rgba(192,18,30,0.15)' : 'rgba(192,18,30,0.08)',
    navHover: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    badge: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    input: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
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
    if (!isAuthenticated) { navigate('/login'); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [r, a, b] = await Promise.all([
        api.get('/routes'),
        api.get('/aircraft'),
        api.get('/bookings/my'),
      ])
      setRoutes(r.data)
      setAircraft(a.data)
      setMyBookings(b.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredRoutes = routes.filter(r =>
    `${r.flightNumber} ${r.depIcao} ${r.arrIcao} ${r.depName} ${r.arrName}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const filteredAircraft = aircraft.filter(a =>
    `${a.name} ${a.registration}`.toLowerCase().includes(bookingForm.aircraftSearch.toLowerCase())
  )

  const estimatedEarnings = (route: any) => {
    const hours = route.duration / 60
    return (hours * 500).toFixed(0)
  }

  const handleBook = async () => {
    if (!bookingForm.aircraftId) { setBookingMsg('Please select an aircraft'); return }
    if (!bookingForm.depTime) { setBookingMsg('Please select departure time'); return }
    setBookingLoading(true)
    setBookingMsg('')
    try {
      await api.post('/bookings', {
        routeId: selectedRoute.id,
        aircraftId: bookingForm.aircraftId,
        depTime: bookingForm.depTime,
        network: bookingForm.network,
      })
      setBookingSuccess(true)
      fetchData()
    } catch (err: any) {
      setBookingMsg(err.response?.data?.error || 'Booking failed')
    } finally {
      setBookingLoading(false)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this booking?')) return
    try {
      await api.patch(`/bookings/${id}/cancel`)
      fetchData()
    } catch (err) { console.error(err) }
  }

  const getStatusStyle = (status: string) => {
    const map: any = {
      UPCOMING: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'Upcoming' },
      PIREP_PENDING: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'PIREP Pending' },
      APPROVED: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Approved' },
      CANCELLED: { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', label: 'Cancelled' },
    }
    return map[status] || map.CANCELLED
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
            <Link to="/dashboard"
              className="flex items-center gap-2 text-sm transition-colors"
              style={{ color: t.textSub, textDecoration: 'none' }}>
              ← Dashboard
            </Link>
            <div className="w-px h-4" style={{ background: t.border }} />
            <div className="flex items-center gap-2">
              <Plane size={16} style={{ color: '#c0121e' }} />
              <span className="font-bold text-base" style={{ color: t.text }}>Flight Booking</span>
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
              Browse Routes
            </button>
            <button onClick={() => setView('mybookings')}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors relative"
              style={{
                background: view === 'mybookings' ? t.navActive : 'transparent',
                color: view === 'mybookings' ? '#c0121e' : t.textSub,
                border: `1px solid ${view === 'mybookings' ? 'rgba(192,18,30,0.2)' : 'transparent'}`,
              }}>
              My Flights
              {myBookings.filter(b => b.status === 'UPCOMING').length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center text-white"
                  style={{ background: '#c0121e', fontSize: '10px' }}>
                  {myBookings.filter(b => b.status === 'UPCOMING').length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* ── BROWSE ROUTES ── */}
        {view === 'browse' && (
          <div>
            {/* Search */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <Search size={15} style={{ color: t.textMuted }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by flight number, airport or city..."
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: t.text }}
                />
                {search && (
                  <button onClick={() => setSearch('')}>
                    <X size={14} style={{ color: t.textMuted }} />
                  </button>
                )}
              </div>
              <div className="px-4 py-3 rounded-xl text-sm"
                style={{ background: t.card, border: `1px solid ${t.border}`, color: t.textSub }}>
                {filteredRoutes.length} routes
              </div>
            </div>

            {/* Route cards */}
            {filteredRoutes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Navigation size={40} style={{ color: t.textMuted, marginBottom: '12px' }} strokeWidth={1.5} />
                <div className="text-sm font-medium mb-1" style={{ color: t.textSub }}>No routes found</div>
                <div className="text-xs" style={{ color: t.textMuted }}>Try a different search or ask admin to add routes</div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRoutes.map((route, i) => (
                  <motion.div key={route.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    onClick={() => { setSelectedRoute(route); setBookingSuccess(false); setBookingMsg(''); setBookingForm({ aircraftId: '', aircraftSearch: '', depTime: '', network: 'Offline' }) }}
                    className="p-5 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                    style={{ background: t.card, border: `1px solid ${t.border}` }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(192,18,30,0.4)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>

                    {/* Flight number + airline */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="KFR" className="w-8 h-8 object-contain" />
                        <span className="text-sm font-bold font-mono" style={{ color: '#c0121e' }}>
                          {route.flightNumber}
                        </span>
                      </div>
                      <ChevronRight size={16} style={{ color: t.textMuted }} />
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: t.text }}>{route.depIcao}</div>
                        <div className="text-xs mt-0.5 truncate max-w-[80px]" style={{ color: t.textSub }}>{route.depName}</div>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex items-center gap-1">
                          <div className="flex-1 h-px" style={{ background: t.border }} />
                          <Plane size={14} style={{ color: '#c0121e' }} />
                          <div className="flex-1 h-px" style={{ background: t.border }} />
                        </div>
                        <div className="text-xs" style={{ color: t.textMuted }}>{route.distance} nm</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: t.text }}>{route.arrIcao}</div>
                        <div className="text-xs mt-0.5 truncate max-w-[80px]" style={{ color: t.textSub }}>{route.arrName}</div>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center justify-between pt-3"
                      style={{ borderTop: `1px solid ${t.border}` }}>
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} style={{ color: t.textMuted }} />
                        <span className="text-xs" style={{ color: t.textSub }}>
                          {Math.floor(route.duration / 60)}h {route.duration % 60}m
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign size={12} style={{ color: '#10b981' }} />
                        <span className="text-xs font-semibold" style={{ color: '#10b981' }}>
                          ${estimatedEarnings(route)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MY BOOKINGS ── */}
        {view === 'mybookings' && (
          <div className="space-y-4">
            {myBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Plane size={40} style={{ color: t.textMuted, marginBottom: '12px' }} strokeWidth={1.5} />
                <div className="text-sm font-medium mb-1" style={{ color: t.textSub }}>No flights yet</div>
                <div className="text-xs mb-4" style={{ color: t.textMuted }}>Browse routes and book your first flight!</div>
                <button onClick={() => setView('browse')}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                  Browse Routes
                </button>
              </div>
            ) : (
              myBookings.map((booking, i) => {
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
                            {booking.route?.flightNumber}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: s.bg, color: s.color }}>
                            {s.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-center">
                            <div className="text-xl font-bold" style={{ color: t.text }}>{booking.route?.depIcao}</div>
                            <div className="text-xs" style={{ color: t.textSub }}>{booking.route?.depName}</div>
                          </div>
                          <ArrowRight size={16} style={{ color: t.textMuted }} />
                          <div className="text-center">
                            <div className="text-xl font-bold" style={{ color: t.text }}>{booking.route?.arrIcao}</div>
                            <div className="text-xs" style={{ color: t.textSub }}>{booking.route?.arrName}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Plane size={12} style={{ color: t.textMuted }} />
                            <span className="text-xs" style={{ color: t.textSub }}>
                              {booking.aircraft?.name} · {booking.aircraft?.registration}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} style={{ color: t.textMuted }} />
                            <span className="text-xs" style={{ color: t.textSub }}>
                              {new Date(booking.depTime).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Radio size={12} style={{ color: t.textMuted }} />
                            <span className="text-xs" style={{ color: t.textSub }}>{booking.network}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <DollarSign size={12} style={{ color: '#10b981' }} />
                            <span className="text-xs font-semibold" style={{ color: '#10b981' }}>
                              ${booking.earnings?.toFixed(0)} estimated
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {booking.status === 'UPCOMING' && (
                          <>
                            <button
                              onClick={() => {
                                const dep = booking.route?.depIcao || ''
                                const arr = booking.route?.arrIcao || ''
                                const type = booking.aircraft?.icao || 'A320'
                                const reg = booking.aircraft?.registration || ''
                                const airline = 'KFR'
                                const fltnum = booking.route?.flightNumber?.replace('IT', '') || '101'
                                const url = `https://www.simbrief.com/system/dispatch.php?orig=${dep}&dest=${arr}&type=${type}&reg=${reg}&airline=${airline}&fltnum=${fltnum}&units=kgs&navlog=1&etops=1&stepclimbs=1&tlr=1&notams=1&firnot=1&auto=1`
                                window.open(url, '_blank')
                              }}
                              className="px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                              style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                              <Navigation size={11} /> SimBrief OFP
                            </button>
                            <Link to="/pirep"
                              className="px-3 py-2 rounded-xl text-xs font-semibold text-white text-center"
                              style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)', textDecoration: 'none' }}>
                              File PIREP
                            </Link>
                            <button onClick={() => handleCancel(booking.id)}
                              className="px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                              Cancel
                            </button>
                          </>
                        )}
                        {booking.status === 'APPROVED' && (
                          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                            style={{ background: 'rgba(16,185,129,0.1)' }}>
                            <Check size={13} style={{ color: '#10b981' }} />
                            <span className="text-xs font-semibold" style={{ color: '#10b981' }}>
                              +${booking.earnings?.toFixed(0)}
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
        {selectedRoute && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) setSelectedRoute(null) }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-2xl flex flex-col"
              style={{ background: isDark ? '#141414' : '#ffffff', border: `1px solid ${t.border}`, maxHeight: '90vh' }}>

              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                    <Plane size={16} style={{ color: 'white' }} />
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: t.text }}>
                      {selectedRoute.flightNumber}
                    </div>
                    <div className="text-xs" style={{ color: t.textSub }}>
                      {selectedRoute.depIcao} → {selectedRoute.arrIcao}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedRoute(null)}
                  className="p-2 rounded-xl transition-colors"
                  style={{ color: t.textMuted }}
                  onMouseEnter={e => e.currentTarget.style.background = t.navHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <X size={18} />
                </button>
              </div>

              {bookingSuccess ? (
                <div className="px-6 py-12 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'rgba(16,185,129,0.1)' }}>
                    <Check size={32} style={{ color: '#10b981' }} />
                  </div>
                  <div className="text-lg font-bold mb-2" style={{ color: t.text }}>Flight Booked!</div>
                  <div className="text-sm mb-1" style={{ color: t.textSub }}>
                    {selectedRoute.flightNumber} — {selectedRoute.depIcao} → {selectedRoute.arrIcao}
                  </div>
                  <div className="text-xs mb-6" style={{ color: t.textMuted }}>
                    Estimated earnings: ${estimatedEarnings(selectedRoute)}
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button onClick={() => { setSelectedRoute(null); setView('mybookings') }}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                      View My Flights
                    </button>
                    <button onClick={() => setSelectedRoute(null)}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: t.badge, color: t.textSub }}>
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">

                  {/* Route details */}
                  <div className="p-4 rounded-xl"
                    style={{ background: t.navActive, border: `1px solid rgba(192,18,30,0.1)` }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: t.text }}>{selectedRoute.depIcao}</div>
                        <div className="text-xs" style={{ color: t.textSub }}>{selectedRoute.depName}</div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-px" style={{ background: 'rgba(192,18,30,0.3)' }} />
                          <Plane size={14} style={{ color: '#c0121e' }} />
                          <div className="w-12 h-px" style={{ background: 'rgba(192,18,30,0.3)' }} />
                        </div>
                        <div className="text-xs" style={{ color: t.textMuted }}>{selectedRoute.distance} nm</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: t.text }}>{selectedRoute.arrIcao}</div>
                        <div className="text-xs" style={{ color: t.textSub }}>{selectedRoute.arrName}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-3"
                      style={{ borderTop: `1px solid rgba(192,18,30,0.1)` }}>
                      <div className="text-center">
                        <div className="text-xs font-semibold" style={{ color: t.text }}>
                          {Math.floor(selectedRoute.duration / 60)}h {selectedRoute.duration % 60}m
                        </div>
                        <div className="text-xs" style={{ color: t.textMuted }}>Duration</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold" style={{ color: '#10b981' }}>
                          ${estimatedEarnings(selectedRoute)}
                        </div>
                        <div className="text-xs" style={{ color: t.textMuted }}>Earnings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold" style={{ color: t.text }}>
                          ${500}/hr
                        </div>
                        <div className="text-xs" style={{ color: t.textMuted }}>Pay Rate</div>
                      </div>
                    </div>
                  </div>

                  {/* Info box */}
                  <div className="flex gap-2.5 p-3.5 rounded-xl"
                    style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <Info size={14} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '1px' }} />
                    <div className="text-xs leading-relaxed" style={{ color: '#3b82f6' }}>
                      <a href="/fsacars" className="text-blue-500 hover:text-blue-400 underline">FSACARS</a> tracks your flight automatically.
                       Manual PIREPs are also accepted via the My Flights portal.
                    </div>
                  </div>

                  {/* Aircraft selector */}
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: t.textMuted }}>
                      SELECT AIRCRAFT
                    </label>
                    <input
                      value={bookingForm.aircraftSearch}
                      onChange={e => setBookingForm({ ...bookingForm, aircraftSearch: e.target.value, aircraftId: '' })}
                      placeholder="Search by name or registration..."
                      style={inputStyle}
                    />
                    {bookingForm.aircraftSearch && !bookingForm.aircraftId && (
                      <div className="mt-1.5 rounded-xl overflow-hidden"
                        style={{ border: `1px solid ${t.border}`, background: isDark ? '#1a1a1a' : '#ffffff' }}>
                        {filteredAircraft.length === 0 ? (
                          <div className="px-4 py-3 text-xs" style={{ color: t.textMuted }}>No aircraft found</div>
                        ) : (
                          filteredAircraft.slice(0, 5).map(a => (
                            <button key={a.id}
                              onClick={() => setBookingForm({ ...bookingForm, aircraftId: a.id, aircraftSearch: `${a.name} · ${a.registration}` })}
                              className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors"
                              style={{ borderBottom: `1px solid ${t.border}` }}
                              onMouseEnter={e => e.currentTarget.style.background = t.navHover}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <span className="text-sm font-medium" style={{ color: t.text }}>{a.name}</span>
                              <span className="text-xs font-mono" style={{ color: '#c0121e' }}>{a.registration}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                    {bookingForm.aircraftId && (
                      <div className="mt-1.5 flex items-center justify-between px-3 py-2 rounded-xl"
                        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <span className="text-xs font-medium" style={{ color: '#10b981' }}>
                          {bookingForm.aircraftSearch}
                        </span>
                        <button onClick={() => setBookingForm({ ...bookingForm, aircraftId: '', aircraftSearch: '' })}>
                          <X size={13} style={{ color: '#10b981' }} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Departure time */}
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: t.textMuted }}>
                      DEPARTURE DATE & TIME
                    </label>
                    <input
                      type="datetime-local"
                      value={bookingForm.depTime}
                      onChange={e => setBookingForm({ ...bookingForm, depTime: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  {/* Network */}
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: t.textMuted }}>
                      NETWORK
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {NETWORKS.map(net => (
                        <button key={net}
                          onClick={() => setBookingForm({ ...bookingForm, network: net })}
                          className="py-2.5 rounded-xl text-sm font-medium transition-all"
                          style={{
                            background: bookingForm.network === net ? 'rgba(192,18,30,0.15)' : t.input,
                            border: `1px solid ${bookingForm.network === net ? 'rgba(192,18,30,0.4)' : t.border}`,
                            color: bookingForm.network === net ? '#c0121e' : t.textSub,
                          }}>
                          {net}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Error message */}
                  {bookingMsg && (
                    <div className="px-4 py-3 rounded-xl text-xs"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {bookingMsg}
                    </div>
                  )}

                  {/* Book button */}
                  <button
                    onClick={handleBook}
                    disabled={bookingLoading}
                    className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all"
                    style={{
                      background: bookingLoading ? 'rgba(192,18,30,0.5)' : 'linear-gradient(135deg, #c0121e, #8b0000)',
                      boxShadow: bookingLoading ? 'none' : '0 0 20px rgba(192,18,30,0.3)',
                    }}>
                    {bookingLoading ? 'Booking...' : `Book ${selectedRoute.flightNumber} — ${selectedRoute.depIcao} → ${selectedRoute.arrIcao}`}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}