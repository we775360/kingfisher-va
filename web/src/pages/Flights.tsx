import { useEffect, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Navigation, Clock, Search,
  ChevronRight, X, Calendar, Radio,
  DollarSign, Info, Check, ArrowRight,
  MapPin, Wrench, AlertTriangle, ChevronLeft
} from 'lucide-react'
import { useThemeStore } from '../store/theme.store'
import { useAuthStore } from '../store/auth.store'
import api from '../lib/axios'

const NETWORKS = ['Offline', 'VATSIM', 'IVAO']

export default function Flights() {
  const { isDark } = useThemeStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const [aircraft, setAircraft] = useState<any[]>([])
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null)
  const [selectedAircraft, setSelectedAircraft] = useState<any>(null)
  const [routes, setRoutes] = useState<any[]>([])
  const [returnRoute, setReturnRoute] = useState<any>(null)
  const [myBookings, setMyBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [routesLoading, setRoutesLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedRoute, setSelectedRoute] = useState<any>(null)
  const [view, setView] = useState<'family' | 'aircraft' | 'routes' | 'mybookings'>('family')
  const [bookingForm, setBookingForm] = useState({ depTime: '', network: 'Offline' })
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
      const [a, b, rb] = await Promise.all([
        api.get('/aircraft'),
        api.get('/bookings/my'),
        api.get('/realistic-flights/my').catch(() => ({ data: [] })),
      ])
      setAircraft(a.data)
      const merged = [
        ...(b.data || []).map((bk: any) => ({ ...bk, _type: 'scheduled' as const })),
        ...(rb.data || []).map((rf: any) => ({
          id: rf.id,
          flightNumber: rf.flightNumber,
          depIcao: rf.depIcao,
          arrIcao: rf.arrIcao,
          depName: rf.depName,
          arrName: rf.arrName,
          depTime: rf.offBlock,
          route: { depIcao: rf.depIcao, arrIcao: rf.arrIcao, depName: rf.depName, arrName: rf.arrName, flightNumber: rf.flightNumber, duration: parseInt(rf.estimatedFlightTime) || 60 },
          aircraft: { name: rf.aircraftType || 'A320', registration: '' },
          network: rf.network,
          status: rf.status === 'AVAILABLE' ? 'UPCOMING' : rf.status === 'BOOKED' ? 'UPCOMING' : rf.status === 'COMPLETED' ? 'APPROVED' : 'CANCELLED',
          earnings: rf.reward,
          _type: 'realistic-ops' as const,
          _realistic: rf,
        })),
      ]
      setMyBookings(merged)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoutesForAircraft = async (aircraftId: string) => {
    setRoutesLoading(true)
    try {
      const res = await api.get(`/aircraft/${aircraftId}/routes`)
      setRoutes(res.data.routes)
      setReturnRoute(res.data.returnRoute)
    } catch (err) {
      console.error(err)
      setRoutes([])
    } finally {
      setRoutesLoading(false)
    }
  }

  const handleSelectFamily = (family: string) => {
    setSelectedFamily(family)
    setSearch('')
    setView('aircraft')
  }

  const handleSelectAircraft = async (ac: any) => {
    if (ac.maintenanceStatus === 'IN_MAINTENANCE') return
    setSelectedAircraft(ac)
    setSearch('')
    setView('routes')
    await fetchRoutesForAircraft(ac.id)
  }

  const handleBackToFamilies = () => {
    setView('family')
    setSelectedFamily(null)
    setSearch('')
  }

  const handleBackToAircraft = () => {
    setView('aircraft')
    setSelectedAircraft(null)
    setRoutes([])
    setSearch('')
  }

  // Compute families from aircraft data
  const families = useMemo(() => {
    const map = new Map<string, any[]>()
    aircraft.forEach(ac => {
      const icao = ac.icao || 'Unknown'
      if (!map.has(icao)) map.set(icao, [])
      map.get(icao)!.push(ac)
    })
    return Array.from(map.entries())
      .map(([icao, list]) => ({ icao, count: list.length, aircraft: list }))
      .sort((a, b) => a.icao.localeCompare(b.icao))
  }, [aircraft])

  const filteredFamilies = families.filter(f =>
    f.icao.toLowerCase().includes(search.toLowerCase())
  )

  const familyAircraft = selectedFamily
    ? aircraft.filter(ac => ac.icao === selectedFamily)
    : []

  const filteredAircraft = familyAircraft.filter(ac =>
    `${ac.name} ${ac.registration} ${ac.hub || ''} ${ac.currentLocation || ''}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const allDisplayRoutes = [...routes, ...(returnRoute ? [returnRoute] : [])]

  const filteredRoutes = allDisplayRoutes.filter(r =>
    `${r.flightNumber} ${r.depIcao} ${r.arrIcao} ${r.depName || ''} ${r.arrName || ''}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const estimatedEarnings = (route: any) => {
    const hours = (route.duration || 60) / 60
    return (hours * 500).toFixed(0)
  }

  const handleBook = async () => {
    if (!bookingForm.depTime) { setBookingMsg('Please select departure time'); return }
    setBookingLoading(true)
    setBookingMsg('')
    try {
      let routeId = selectedRoute.id
      if (selectedRoute.isReturnRoute) routeId = 'return-to-hub'
      await api.post('/bookings', { routeId, aircraftId: selectedAircraft.id, depTime: bookingForm.depTime, network: bookingForm.network })
      setBookingSuccess(true)
      fetchData()
    } catch (err: any) {
      setBookingMsg(err.response?.data?.error || 'Booking failed')
    } finally {
      setBookingLoading(false)
    }
  }

  const handleCancel = async (booking: any) => {
    if (!confirm('Cancel this booking?')) return
    try {
      if (booking._type === 'realistic-ops') {
        await api.patch(`/realistic-flights/${booking.id}/cancel`)
      } else {
        await api.patch(`/bookings/${booking.id}/cancel`)
      }
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

  const getMaintenanceCountdown = (ac: any) => {
    if (!ac.maintenanceUntil) return null
    const remaining = new Date(ac.maintenanceUntil).getTime() - Date.now()
    if (remaining <= 0) return null
    return `${Math.floor(remaining / 3600000)}h ${Math.floor((remaining % 3600000) / 60000)}m`
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
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {view === 'aircraft' ? (
              <button onClick={handleBackToFamilies}
                className="flex items-center gap-2 text-sm transition-colors"
                style={{ color: t.textSub }}>
                <ChevronLeft size={16} /> Families
              </button>
            ) : view === 'routes' ? (
              <button onClick={handleBackToAircraft}
                className="flex items-center gap-2 text-sm transition-colors"
                style={{ color: t.textSub }}>
                <ChevronLeft size={16} /> Aircraft
              </button>
            ) : (
              <Link to="/dashboard"
                className="flex items-center gap-2 text-sm transition-colors"
                style={{ color: t.textSub, textDecoration: 'none' }}>
                ← Dashboard
              </Link>
            )}
            <div className="w-px h-4" style={{ background: t.border }} />
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="" className="inline-block" style={{ width: 16, height: 16 }} />
              <span className="font-bold text-base" style={{ color: t.text }}>
                {view === 'family' ? 'Select Aircraft Family' :
                 view === 'aircraft' ? `Select ${selectedFamily}` :
                 view === 'routes' ? 'Available Routes' : 'My Flights'}
              </span>
            </div>
          </div>
          <button onClick={() => { setView('mybookings'); setSearch('') }}
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

      <div className="max-w-4xl mx-auto px-6 py-6">

        {/* ── STEP 1: SELECT AIRCRAFT FAMILY ── */}
        {view === 'family' && (
          <div>
            <div className="flex gap-2.5 p-3.5 rounded-xl mb-6"
              style={{ background: 'rgba(192,18,30,0.06)', border: '1px solid rgba(192,18,30,0.12)' }}>
              <Info size={14} style={{ color: '#c0121e', flexShrink: 0, marginTop: '1px' }} />
              <div className="text-xs leading-relaxed" style={{ color: '#c0121e' }}>
                Pick an aircraft family first, then choose a specific aircraft to see routes available from its current location.
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <Search size={15} style={{ color: t.textMuted }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search aircraft families..."
                  className="flex-1 bg-transparent outline-none text-sm" style={{ color: t.text }} />
                {search && <button onClick={() => setSearch('')}><X size={14} style={{ color: t.textMuted }} /></button>}
              </div>
              <div className="px-4 py-3 rounded-xl text-sm"
                style={{ background: t.card, border: `1px solid ${t.border}`, color: t.textSub }}>
                {filteredFamilies.length} families
              </div>
            </div>

            {filteredFamilies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <img src="/logo.png" alt="" style={{ width: 40, height: 40, opacity: 0.5, marginBottom: '12px' }} />
                <div className="text-sm font-medium mb-1" style={{ color: t.textSub }}>No aircraft families found</div>
                <div className="text-xs" style={{ color: t.textMuted }}>Ask admin to add aircraft to the fleet</div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFamilies.map((family, i) => (
                  <motion.div key={family.icao}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                    onClick={() => handleSelectFamily(family.icao)}
                    className="p-5 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.01]"
                    style={{ background: t.card, border: `1px solid ${t.border}` }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(192,18,30,0.4)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img src="/logo.png" alt="KFR" className="w-10 h-10 object-contain" />
                        <div>
                          <div className="text-base font-bold" style={{ color: t.text }}>{family.icao}</div>
                          <div className="text-xs mt-0.5" style={{ color: t.textSub }}>
                            {family.count} aircraft{family.count > 0 && ` · ${family.aircraft.filter(a => a.maintenanceStatus !== 'IN_MAINTENANCE').length} available`}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} style={{ color: t.textMuted }} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: SELECT AIRCRAFT ── */}
        {view === 'aircraft' && selectedFamily && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <Search size={15} style={{ color: t.textMuted }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by registration, name or location..."
                  className="flex-1 bg-transparent outline-none text-sm" style={{ color: t.text }} />
                {search && <button onClick={() => setSearch('')}><X size={14} style={{ color: t.textMuted }} /></button>}
              </div>
              <div className="px-4 py-3 rounded-xl text-sm"
                style={{ background: t.card, border: `1px solid ${t.border}`, color: t.textSub }}>
                {filteredAircraft.length} aircraft
              </div>
            </div>

            {filteredAircraft.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <img src="/logo.png" alt="" style={{ width: 40, height: 40, opacity: 0.5, marginBottom: '12px' }} />
                <div className="text-sm font-medium mb-1" style={{ color: t.textSub }}>No aircraft in this family</div>
                <div className="text-xs" style={{ color: t.textMuted }}>Ask admin to add {selectedFamily} aircraft</div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAircraft.map((ac, i) => {
                  const inMaint = ac.maintenanceStatus === 'IN_MAINTENANCE'
                  const countdown = getMaintenanceCountdown(ac)
                  const location = ac.currentLocation || ac.hub || 'Unknown'
                  return (
                    <motion.div key={ac.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.03 }}
                      onClick={() => !inMaint && handleSelectAircraft(ac)}
                      className={`p-5 rounded-2xl cursor-pointer transition-all duration-200 ${inMaint ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}`}
                      style={{ background: t.card, border: `1px solid ${inMaint ? 'rgba(239,68,68,0.2)' : t.border}` }}
                      onMouseEnter={e => { if (!inMaint) e.currentTarget.style.borderColor = 'rgba(192,18,30,0.4)' }}
                      onMouseLeave={e => { if (!inMaint) e.currentTarget.style.borderColor = t.border }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(192,18,30,0.1)' }}>
                            <img src="/logo.png" alt="" className="w-5 h-5 object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold" style={{ color: t.text }}>{ac.name}</span>
                              <span className="text-xs font-mono px-2 py-0.5 rounded-md"
                                style={{ background: t.navActive, color: '#c0121e' }}>
                                {ac.registration}
                              </span>
                              {inMaint && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold flex-shrink-0"
                                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                  <Wrench size={11} /> {countdown || 'Maint'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1.5">
                              <span className="text-xs" style={{ color: t.textSub }}>
                                Hub: <strong>{ac.hub || '—'}</strong>
                              </span>
                              <span className="text-xs flex items-center gap-1" style={{ color: '#3b82f6' }}>
                                <MapPin size={10} /> {location}
                              </span>
                            </div>
                          </div>
                        </div>
                        {!inMaint && <ChevronRight size={16} style={{ color: t.textMuted, flexShrink: 0 }} />}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: SELECT ROUTE ── */}
        {view === 'routes' && selectedAircraft && (
          <div>
            {/* Aircraft info bar */}
            <div className="flex items-center justify-between p-4 rounded-2xl mb-6"
              style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                  <img src="/logo.png" alt="" className="w-5 h-5 object-contain" />
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: t.text }}>
                    {selectedAircraft.name} · {selectedAircraft.registration}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs" style={{ color: t.textSub }}><strong>Type:</strong> {selectedAircraft.type}</span>
                    <span className="text-xs" style={{ color: t.textSub }}><strong>Hub:</strong> {selectedAircraft.hub || '—'}</span>
                    <span className="text-xs font-semibold" style={{ color: '#3b82f6' }}>
                      <MapPin size={10} style={{ display: 'inline', marginRight: 2 }} />
                      {selectedAircraft.currentLocation || selectedAircraft.hub || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={handleBackToAircraft}
                className="px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                style={{ background: t.navHover, color: t.textSub }}>
                Change
              </button>
            </div>

            {routesLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 rounded-full border-2 animate-spin"
                  style={{ borderColor: '#c0121e', borderTopColor: 'transparent' }} />
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl"
                    style={{ background: t.card, border: `1px solid ${t.border}` }}>
                    <Search size={15} style={{ color: t.textMuted }} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search routes..."
                      className="flex-1 bg-transparent outline-none text-sm" style={{ color: t.text }} />
                    {search && <button onClick={() => setSearch('')}><X size={14} style={{ color: t.textMuted }} /></button>}
                  </div>
                  <div className="px-4 py-3 rounded-xl text-sm"
                    style={{ background: t.card, border: `1px solid ${t.border}`, color: t.textSub }}>
                    {filteredRoutes.length} routes
                  </div>
                </div>

                {/* Return to hub */}
                {returnRoute && !search && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => { setSelectedRoute(returnRoute); setBookingSuccess(false); setBookingMsg(''); setBookingForm({ depTime: '', network: 'Offline' }) }}
                    className="p-5 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.01] mb-3"
                    style={{ background: t.card, border: '2px solid rgba(245,158,11,0.3)' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.6)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={13} style={{ color: '#f59e0b' }} />
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#f59e0b' }}>Return to Hub</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold" style={{ color: t.text }}>{returnRoute.depIcao}</span>
                      <div className="flex-1 flex items-center gap-1">
                        <div className="flex-1 h-px" style={{ background: t.border }} />
                        <img src="/logo.png" alt="" style={{ width: 12, height: 12 }} />
                        <div className="flex-1 h-px" style={{ background: t.border }} />
                      </div>
                      <span className="text-lg font-bold" style={{ color: t.text }}>{returnRoute.arrIcao}</span>
                    </div>
                  </motion.div>
                )}

                {/* Route list */}
                {filteredRoutes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Navigation size={40} style={{ color: t.textMuted, marginBottom: '12px' }} strokeWidth={1.5} />
                    <div className="text-sm font-medium mb-1" style={{ color: t.textSub }}>No routes from this location</div>
                    <div className="text-xs" style={{ color: t.textMuted }}>
                      No available routes from {selectedAircraft.currentLocation || selectedAircraft.hub}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRoutes.map((route, i) => (
                      <motion.div key={route.id || `rth-${i}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.03 }}
                        onClick={() => { setSelectedRoute(route); setBookingSuccess(false); setBookingMsg(''); setBookingForm({ depTime: '', network: 'Offline' }) }}
                        className="p-5 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.01]"
                        style={{ background: t.card, border: `1px solid ${route.isReturnRoute ? 'rgba(245,158,11,0.3)' : t.border}` }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = route.isReturnRoute ? 'rgba(245,158,11,0.6)' : 'rgba(192,18,30,0.4)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = route.isReturnRoute ? 'rgba(245,158,11,0.3)' : t.border}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: 'rgba(192,18,30,0.1)' }}>
                              <Navigation size={16} style={{ color: '#c0121e' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold font-mono" style={{ color: route.isReturnRoute ? '#f59e0b' : '#c0121e' }}>
                                  {route.flightNumber}
                                </span>
                                <span className="text-sm font-semibold" style={{ color: t.text }}>
                                  {route.depIcao}
                                </span>
                                <ArrowRight size={12} style={{ color: t.textMuted }} />
                                <span className="text-sm font-semibold" style={{ color: t.text }}>
                                  {route.arrIcao}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs" style={{ color: t.textSub }}>
                                  {route.depName || route.depIcao} → {route.arrName || route.arrIcao}
                                </span>
                                <span className="text-xs" style={{ color: t.textMuted }}>
                                  {Math.floor((route.duration || 60) / 60)}h {(route.duration || 60) % 60}m
                                </span>
                                <span className="text-xs font-semibold" style={{ color: '#10b981' }}>
                                  ${estimatedEarnings(route)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight size={16} style={{ color: t.textMuted, flexShrink: 0 }} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── MY BOOKINGS ── */}
        {view === 'mybookings' && (
          <div className="space-y-4">
            <div className="flex gap-2.5 p-3.5 rounded-xl"
              style={{ background: 'rgba(192,18,30,0.06)', border: '1px solid rgba(192,18,30,0.12)' }}>
              <Info size={14} style={{ color: '#c0121e', flexShrink: 0, marginTop: '1px' }} />
              <div className="text-xs leading-relaxed" style={{ color: '#c0121e' }}>
                Realistic Ops flights are for today only and generated daily based on ATC staff availability.
                Standard schedule bookings can be made on any active route.
              </div>
            </div>
            {myBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <img src="/logo.png" alt="" style={{ width: 40, height: 40, opacity: 0.5, marginBottom: '12px' }} />
                <div className="text-sm font-medium mb-1" style={{ color: t.textSub }}>No flights yet</div>
                <div className="text-xs mb-4" style={{ color: t.textMuted }}>Select an aircraft family and book your first flight!</div>
                <button onClick={() => setView('family')}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                  Browse Aircraft
                </button>
              </div>
            ) : (
              myBookings.map((booking, i) => {
                const s = getStatusStyle(booking.status)
                const isRealisticOps = booking._type === 'realistic-ops'
                return (
                  <motion.div key={`${booking._type}-${booking.id}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                    className="p-5 rounded-2xl"
                    style={{ background: t.card, border: `1px solid ${booking._type === 'realistic-ops' ? 'rgba(192,18,30,0.2)' : t.border}` }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm font-bold font-mono" style={{ color: '#c0121e' }}>
                            {booking.flightNumber || booking.route?.flightNumber}
                          </span>
                          {isRealisticOps && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                              style={{ background: 'rgba(192,18,30,0.1)', color: '#c0121e' }}>REALISTIC OPS</span>
                          )}
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: s.bg, color: s.color }}>{s.label}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-base font-bold" style={{ color: t.text }}>{booking.depIcao || booking.route?.depIcao}</span>
                          <ArrowRight size={14} style={{ color: t.textMuted }} />
                          <span className="text-base font-bold" style={{ color: t.text }}>{booking.arrIcao || booking.route?.arrIcao}</span>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          {!isRealisticOps && (
                            <span className="text-xs" style={{ color: t.textSub }}>
                              <img src="/logo.png" alt="" className="inline-block" style={{ width: 11, height: 11, marginRight: 2 }} />
                              {booking.aircraft?.name} · {booking.aircraft?.registration}
                            </span>
                          )}
                          <span className="text-xs" style={{ color: t.textSub }}>
                            <Calendar size={11} style={{ display: 'inline', marginRight: 2 }} />
                            {isRealisticOps ? booking.depTime : new Date(booking.depTime).toLocaleString()}
                          </span>
                          <span className="text-xs" style={{ color: t.textSub }}>
                            <Radio size={11} style={{ display: 'inline', marginRight: 2 }} />
                            {booking.network}
                          </span>
                          <span className="text-xs font-semibold" style={{ color: '#10b981' }}>
                            <DollarSign size={11} style={{ display: 'inline' }} />
                            ${isRealisticOps ? (booking.earnings || 0) : (booking.earnings?.toFixed(0) || '0')} est.
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button onClick={() => navigate(`/booking/${isRealisticOps ? 'realistic' : 'standard'}/${booking.id}`)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                          Details
                        </button>
                        {booking.status === 'UPCOMING' && !isRealisticOps && (
                          <Link to="/pirep"
                            className="px-3 py-2 rounded-xl text-xs font-semibold text-white text-center"
                            style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)', textDecoration: 'none' }}>
                            File PIREP
                          </Link>
                        )}
                        {booking.status === 'UPCOMING' && (
                          <button onClick={() => handleCancel(booking)}
                            className="px-3 py-2 rounded-xl text-xs font-semibold"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                            Cancel
                          </button>
                        )}
                        {booking.status === 'APPROVED' && (
                          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                            style={{ background: 'rgba(16,185,129,0.1)' }}>
                            <Check size={13} style={{ color: '#10b981' }} />
                            <span className="text-xs font-semibold" style={{ color: '#10b981' }}>+${booking.earnings?.toFixed(0)}</span>
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
        {selectedRoute && selectedAircraft && view !== 'mybookings' && (
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
              <div className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                    <img src="/logo.png" alt="" className="w-4 h-4 object-contain" />
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: t.text }}>{selectedRoute.flightNumber}</div>
                    <div className="text-xs" style={{ color: t.textSub }}>{selectedRoute.depIcao} → {selectedRoute.arrIcao}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedRoute(null)}
                  className="p-2 rounded-xl transition-colors" style={{ color: t.textMuted }}>
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
                    {selectedAircraft.name} · {selectedAircraft.registration}
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={async () => {
                        setSelectedRoute(null);
                        const b = await api.get('/bookings/my').then(r => r.data);
                        navigate(b?.[0]?.id ? `/booking/standard/${b[0].id}` : '/flights');
                      }}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                      View Booking Details
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
                  <div className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: t.badge, border: `1px solid ${t.border}` }}>
                    <img src="/logo.png" alt="" style={{ width: 14, height: 14 }} />
                    <div className="text-xs" style={{ color: t.textSub }}>
                      <span className="font-semibold" style={{ color: t.text }}>{selectedAircraft.name}</span>
                      {' · '}{selectedAircraft.registration} · From <strong>{selectedRoute.depIcao}</strong>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl"
                    style={{ background: t.navActive, border: `1px solid rgba(192,18,30,0.1)` }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: t.text }}>{selectedRoute.depIcao}</div>
                        <div className="text-xs" style={{ color: t.textSub }}>{selectedRoute.depName}</div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                    <img src="/logo.png" alt="" style={{ width: 14, height: 14 }} />
                        <div className="text-xs" style={{ color: t.textMuted }}>{selectedRoute.distance || 0} nm</div>
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
                          {Math.floor((selectedRoute.duration || 60) / 60)}h {(selectedRoute.duration || 60) % 60}m
                        </div>
                        <div className="text-xs" style={{ color: t.textMuted }}>Duration</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold" style={{ color: '#10b981' }}>${estimatedEarnings(selectedRoute)}</div>
                        <div className="text-xs" style={{ color: t.textMuted }}>Earnings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold" style={{ color: t.text }}>$500/hr</div>
                        <div className="text-xs" style={{ color: t.textMuted }}>Pay Rate</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2.5 p-3.5 rounded-xl"
                    style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <Info size={14} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '1px' }} />
                    <div className="text-xs leading-relaxed" style={{ color: '#3b82f6' }}>
                      <a href="/fsacars" className="text-blue-500 hover:text-blue-400 underline">FSACARS</a> auto-tracks your flight. Manual PIREPs also accepted.
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: t.textMuted }}>DEPARTURE DATE & TIME</label>
                    <input type="datetime-local" value={bookingForm.depTime}
                      onChange={e => setBookingForm({ ...bookingForm, depTime: e.target.value })}
                      style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: t.textMuted }}>NETWORK</label>
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
                  {bookingMsg && (
                    <div className="px-4 py-3 rounded-xl text-xs"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {bookingMsg}
                    </div>
                  )}
                  <button onClick={handleBook} disabled={bookingLoading}
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