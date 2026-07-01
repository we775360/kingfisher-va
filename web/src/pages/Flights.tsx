import { useEffect, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Navigation, Clock, Search,
  ChevronRight, X, Calendar, Radio,
  DollarSign, Info, Check, ArrowRight,
  MapPin, Wrench, AlertTriangle, ChevronLeft, Fuel
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
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s',
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
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-[3px] animate-spin"
          style={{ borderColor: 'rgba(192,18,30,0.15)', borderTopColor: '#c0121e' }} />
        <span className="text-xs font-medium tracking-wider uppercase" style={{ color: t.textSub }}>
          Loading Fleet
        </span>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: t.bg, color: t.text }}>

      {/* Header */}
      <div className="sticky top-0 z-30 px-8 py-5"
        style={{
          background: isDark ? 'rgba(12,12,12,0.85)' : 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: `1px solid ${t.border}`,
          boxShadow: isDark ? '0 4px 30px rgba(0,0,0,0.3)' : '0 4px 30px rgba(0,0,0,0.06)',
        }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {view === 'aircraft' ? (
              <button onClick={handleBackToFamilies}
                className="flex items-center gap-2 text-sm font-medium transition-all hover:opacity-80"
                style={{ color: t.textSub }}>
                <ChevronLeft size={16} /> Families
              </button>
            ) : view === 'routes' ? (
              <button onClick={handleBackToAircraft}
                className="flex items-center gap-2 text-sm font-medium transition-all hover:opacity-80"
                style={{ color: t.textSub }}>
                <ChevronLeft size={16} /> Aircraft
              </button>
            ) : (
              <Link to="/dashboard"
                className="flex items-center gap-2 text-sm font-medium transition-all hover:opacity-80"
                style={{ color: t.textSub, textDecoration: 'none' }}>
                <ChevronLeft size={16} /> Dashboard
              </Link>
            )}
            <div className="w-px h-5" style={{ background: t.border }} />
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                <img src="/logo.png" alt="" className="w-3.5 h-3.5 object-contain" />
              </div>
              <span className="font-bold text-base tracking-tight" style={{ color: t.text }}>
                {view === 'family' ? 'Select Aircraft Family' :
                 view === 'aircraft' ? `Select ${selectedFamily}` :
                 view === 'routes' ? 'Available Routes' : 'My Flights'}
              </span>
            </div>
          </div>
          <button onClick={() => { setView('mybookings'); setSearch('') }}
            className="relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background: view === 'mybookings'
                ? 'linear-gradient(135deg, rgba(192,18,30,0.12), rgba(192,18,30,0.06))'
                : 'transparent',
              color: view === 'mybookings' ? '#c0121e' : t.textSub,
              border: `1px solid ${view === 'mybookings' ? 'rgba(192,18,30,0.25)' : 'transparent'}`,
            }}>
            My Flights
            {myBookings.filter(b => b.status === 'UPCOMING').length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                style={{ background: '#c0121e', boxShadow: '0 2px 8px rgba(192,18,30,0.4)' }}>
                {myBookings.filter(b => b.status === 'UPCOMING').length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8">

        {/* ── STEP 1: SELECT AIRCRAFT FAMILY ── */}
        {view === 'family' && (
          <div>
            <div className="flex gap-3 p-4 rounded-2xl mb-8"
              style={{ background: 'linear-gradient(135deg, rgba(192,18,30,0.07), rgba(192,18,30,0.03))', border: '1px solid rgba(192,18,30,0.12)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(192,18,30,0.12)' }}>
                <Info size={15} style={{ color: '#c0121e' }} />
              </div>
              <div className="text-xs leading-relaxed" style={{ color: 'rgba(192,18,30,0.8)' }}>
                Pick an aircraft family first, then choose a specific aircraft to see routes available from its current location.
              </div>
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 flex items-center gap-3 px-5 py-3.5 rounded-2xl"
                style={{ background: t.card, border: `1px solid ${t.border}`, boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.15)' : '0 2px 12px rgba(0,0,0,0.03)' }}>
                <Search size={16} style={{ color: t.textMuted }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search aircraft families..."
                  className="flex-1 bg-transparent outline-none text-sm" style={{ color: t.text }} />
                {search && <button onClick={() => setSearch('')} className="p-1 rounded-lg hover:opacity-70 transition-opacity"><X size={14} style={{ color: t.textMuted }} /></button>}
              </div>
              <div className="px-5 py-3.5 rounded-2xl text-sm font-medium"
                style={{ background: t.card, border: `1px solid ${t.border}`, color: t.textSub, boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.15)' : '0 2px 12px rgba(0,0,0,0.03)' }}>
                {filteredFamilies.length} families
              </div>
            </div>

            {filteredFamilies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(192,18,30,0.06)' }}>
                  <img src="/logo.png" alt="" style={{ width: 36, height: 36, opacity: 0.4 }} />
                </div>
                <div className="text-base font-semibold mb-1.5" style={{ color: t.textSub }}>No aircraft families found</div>
                <div className="text-sm" style={{ color: t.textMuted }}>Ask admin to add aircraft to the fleet</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredFamilies.map((family, i) => {
                  const available = family.aircraft.filter(a => a.maintenanceStatus !== 'IN_MAINTENANCE').length
                  return (
                    <div key={family.icao}
                      onClick={() => handleSelectFamily(family.icao)}
                      className="p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group"
                      style={{
                        background: `linear-gradient(135deg, ${t.card}, ${t.card})`,
                        border: `1px solid ${t.border}`,
                        boxShadow: isDark ? '0 2px 20px rgba(0,0,0,0.15)' : '0 2px 20px rgba(0,0,0,0.04)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(192,18,30,0.35)'
                        e.currentTarget.style.boxShadow = isDark
                          ? '0 8px 30px rgba(192,18,30,0.12)'
                          : '0 8px 30px rgba(192,18,30,0.08)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = t.border
                        e.currentTarget.style.boxShadow = isDark ? '0 2px 20px rgba(0,0,0,0.15)' : '0 2px 20px rgba(0,0,0,0.04)'
                      }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, rgba(192,18,30,0.12), rgba(192,18,30,0.04))' }}>
                          <img src="/logo.png" alt="KFR" className="w-7 h-7 object-contain" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-lg text-xs font-bold"
                            style={{ background: t.badge, color: t.textSub }}>
                            {family.count}
                          </span>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:translate-x-0.5"
                            style={{ background: 'rgba(192,18,30,0.08)' }}>
                            <ChevronRight size={16} style={{ color: '#c0121e' }} />
                          </div>
                        </div>
                      </div>
                      <div className="text-xl font-bold tracking-tight mb-1" style={{ color: t.text }}>{family.icao}</div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: t.textSub }}>
                        <span>{family.count} aircraft</span>
                        <span className="w-1 h-1 rounded-full" style={{ background: t.textMuted }} />
                        <span style={{ color: available > 0 ? '#10b981' : t.textMuted }}>{available} available</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: SELECT AIRCRAFT ── */}
        {view === 'aircraft' && selectedFamily && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 flex items-center gap-3 px-5 py-3.5 rounded-2xl"
                style={{ background: t.card, border: `1px solid ${t.border}`, boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.15)' : '0 2px 12px rgba(0,0,0,0.03)' }}>
                <Search size={16} style={{ color: t.textMuted }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by registration, name or location..."
                  className="flex-1 bg-transparent outline-none text-sm" style={{ color: t.text }} />
                {search && <button onClick={() => setSearch('')} className="p-1 rounded-lg hover:opacity-70 transition-opacity"><X size={14} style={{ color: t.textMuted }} /></button>}
              </div>
              <div className="px-5 py-3.5 rounded-2xl text-sm font-medium"
                style={{ background: t.card, border: `1px solid ${t.border}`, color: t.textSub, boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.15)' : '0 2px 12px rgba(0,0,0,0.03)' }}>
                {filteredAircraft.length} aircraft
              </div>
            </div>

            {filteredAircraft.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(192,18,30,0.06)' }}>
                  <img src="/logo.png" alt="" style={{ width: 36, height: 36, opacity: 0.4 }} />
                </div>
                <div className="text-base font-semibold mb-1.5" style={{ color: t.textSub }}>No aircraft in this family</div>
                <div className="text-sm" style={{ color: t.textMuted }}>Ask admin to add {selectedFamily} aircraft</div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAircraft.map((ac, i) => {
                  const inMaint = ac.maintenanceStatus === 'IN_MAINTENANCE'
                  const countdown = getMaintenanceCountdown(ac)
                  const location = ac.currentLocation || ac.hub || 'Unknown'
                  const isAtHub = ac.currentLocation === ac.hub
                  return (
                    <div key={ac.id}
                      onClick={() => !inMaint && handleSelectAircraft(ac)}
                      className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 ${inMaint ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5 group'}`}
                      style={{
                        background: `linear-gradient(135deg, ${t.card}, ${t.cardHover})`,
                        border: `1px solid ${inMaint ? 'rgba(239,68,68,0.25)' : t.border}`,
                        boxShadow: isDark ? '0 2px 20px rgba(0,0,0,0.12)' : '0 2px 20px rgba(0,0,0,0.04)',
                      }}
                      onMouseEnter={e => {
                        if (!inMaint) {
                          e.currentTarget.style.borderColor = 'rgba(192,18,30,0.35)'
                          e.currentTarget.style.boxShadow = isDark ? '0 8px 30px rgba(192,18,30,0.1)' : '0 8px 30px rgba(192,18,30,0.06)'
                        }
                      }}
                      onMouseLeave={e => {
                        if (!inMaint) {
                          e.currentTarget.style.borderColor = t.border
                          e.currentTarget.style.boxShadow = isDark ? '0 2px 20px rgba(0,0,0,0.12)' : '0 2px 20px rgba(0,0,0,0.04)'
                        }
                      }}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, rgba(192,18,30,0.12), rgba(192,18,30,0.04))' }}>
                            <img src="/logo.png" alt="" className="w-6 h-6 object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                              <span className="text-base font-bold" style={{ color: t.text }}>{ac.name}</span>
                              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-lg"
                                style={{ background: `linear-gradient(135deg, ${t.navActive}, rgba(192,18,30,0.04))`, color: '#c0121e' }}>
                                {ac.registration}
                              </span>
                              {ac.type && (
                                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-lg"
                                  style={{ background: t.badge, color: t.textSub }}>
                                  {ac.type}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                              <span className="text-xs flex items-center gap-1.5" style={{ color: t.textSub }}>
                                <MapPin size={11} style={{ color: '#3b82f6' }} />
                                <span style={{ color: '#3b82f6', fontWeight: 600 }}>{location}</span>
                                {!isAtHub && ac.hub && (
                                  <span style={{ color: t.textMuted }}>· hub: {ac.hub}</span>
                                )}
                              </span>
                              {ac.totalFlightHours !== undefined && (
                                <span className="text-xs" style={{ color: t.textMuted }}>
                                  <Clock size={10} style={{ display: 'inline', marginRight: 3 }} />
                                  {(ac.totalFlightHours || 0).toFixed(1)}h
                                </span>
                              )}
                              {inMaint && (
                                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold"
                                  style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                                  <Wrench size={11} /> {countdown || 'In Maintenance'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {!inMaint && (
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:translate-x-0.5 flex-shrink-0"
                            style={{ background: 'rgba(192,18,30,0.08)' }}>
                            <ChevronRight size={16} style={{ color: '#c0121e' }} />
                          </div>
                        )}
                      </div>
                    </div>
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
            <div
              className="flex items-center justify-between p-5 rounded-2xl mb-8"
              style={{
                background: `linear-gradient(135deg, ${t.card}, ${t.cardHover})`,
                border: `1px solid ${t.border}`,
                boxShadow: isDark ? '0 2px 20px rgba(0,0,0,0.12)' : '0 2px 20px rgba(0,0,0,0.04)',
              }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                  <img src="/logo.png" alt="" className="w-5 h-5 object-contain" />
                </div>
                <div>
                  <div className="text-base font-bold tracking-tight" style={{ color: t.text }}>
                    {selectedAircraft.name} <span className="font-mono font-semibold" style={{ color: t.textSub }}>· {selectedAircraft.registration}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5">
                    {selectedAircraft.type && (
                      <span className="text-xs" style={{ color: t.textSub }}>{selectedAircraft.type}</span>
                    )}
                    <span className="text-xs" style={{ color: t.textSub }}>
                      <MapPin size={10} style={{ display: 'inline', marginRight: 2, color: '#3b82f6' }} />
                      <span style={{ color: '#3b82f6', fontWeight: 600 }}>{selectedAircraft.currentLocation || selectedAircraft.hub || 'Unknown'}</span>
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={handleBackToAircraft}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 hover:opacity-80"
                style={{ background: t.navHover, color: t.textSub, border: `1px solid ${t.border}` }}>
                Change
              </button>
            </div>

            {routesLoading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-10 h-10 rounded-full border-[3px] animate-spin mb-3"
                  style={{ borderColor: 'rgba(192,18,30,0.15)', borderTopColor: '#c0121e' }} />
                <span className="text-xs font-medium tracking-wider uppercase" style={{ color: t.textSub }}>
                  Loading routes...
                </span>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="flex-1 flex items-center gap-3 px-5 py-3.5 rounded-2xl"
                    style={{ background: t.card, border: `1px solid ${t.border}`, boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.15)' : '0 2px 12px rgba(0,0,0,0.03)' }}>
                    <Search size={16} style={{ color: t.textMuted }} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search routes..."
                      className="flex-1 bg-transparent outline-none text-sm" style={{ color: t.text }} />
                    {search && <button onClick={() => setSearch('')} className="p-1 rounded-lg hover:opacity-70 transition-opacity"><X size={14} style={{ color: t.textMuted }} /></button>}
                  </div>
                  <div className="px-5 py-3.5 rounded-2xl text-sm font-medium"
                    style={{ background: t.card, border: `1px solid ${t.border}`, color: t.textSub, boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.15)' : '0 2px 12px rgba(0,0,0,0.03)' }}>
                    {filteredRoutes.length} routes
                  </div>
                </div>

                {/* Return to hub */}
                {returnRoute && !search && (
                  <div
                    onClick={() => { setSelectedRoute(returnRoute); setBookingSuccess(false); setBookingMsg(''); setBookingForm({ depTime: '', network: 'Offline' }) }}
                    className="p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5 mb-4"
                    style={{
                      background: `linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))`,
                      border: '2px solid rgba(245,158,11,0.25)',
                      boxShadow: isDark ? '0 2px 20px rgba(245,158,11,0.06)' : '0 2px 20px rgba(245,158,11,0.04)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(245,158,11,0.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.25)'; e.currentTarget.style.boxShadow = isDark ? '0 2px 20px rgba(245,158,11,0.06)' : '0 2px 20px rgba(245,158,11,0.04)' }}>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
                        <AlertTriangle size={13} style={{ color: '#f59e0b' }} />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#f59e0b' }}>Return to Hub</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold tracking-tight" style={{ color: t.text }}>{returnRoute.depIcao}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: t.textSub }}>{returnRoute.depName || returnRoute.depIcao}</div>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div className="flex items-center w-full gap-1.5">
                          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)' }} />
                          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
                            <img src="/logo.png" alt="" className="w-2.5 h-2.5 object-contain" />
                          </div>
                          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)' }} />
                        </div>
                        {returnRoute.duration && (
                          <span className="text-[10px] font-medium" style={{ color: t.textMuted }}>
                            {Math.floor((returnRoute.duration || 60) / 60)}h {(returnRoute.duration || 60) % 60}m
                          </span>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold tracking-tight" style={{ color: t.text }}>{returnRoute.arrIcao}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: t.textSub }}>{returnRoute.arrName || returnRoute.arrIcao}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Route list */}
                {filteredRoutes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                      style={{ background: 'rgba(192,18,30,0.06)' }}>
                      <Navigation size={36} style={{ color: t.textMuted }} strokeWidth={1.5} />
                    </div>
                    <div className="text-base font-semibold mb-1.5" style={{ color: t.textSub }}>No routes from this location</div>
                    <div className="text-sm" style={{ color: t.textMuted }}>
                      No available routes from {selectedAircraft.currentLocation || selectedAircraft.hub}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRoutes.map((route, i) => (
                      <div key={route.id || `rth-${i}`}
                        onClick={() => { setSelectedRoute(route); setBookingSuccess(false); setBookingMsg(''); setBookingForm({ depTime: '', network: 'Offline' }) }}
                        className="p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group"
                        style={{
                          background: route.isReturnRoute
                            ? `linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))`
                            : `linear-gradient(135deg, ${t.card}, ${t.cardHover})`,
                          border: `1px solid ${route.isReturnRoute ? 'rgba(245,158,11,0.25)' : t.border}`,
                          boxShadow: isDark ? '0 2px 20px rgba(0,0,0,0.12)' : '0 2px 20px rgba(0,0,0,0.04)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = route.isReturnRoute ? 'rgba(245,158,11,0.5)' : 'rgba(192,18,30,0.35)'
                          e.currentTarget.style.boxShadow = isDark ? '0 8px 30px rgba(192,18,30,0.1)' : '0 8px 30px rgba(192,18,30,0.06)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = route.isReturnRoute ? 'rgba(245,158,11,0.25)' : t.border
                          e.currentTarget.style.boxShadow = isDark ? '0 2px 20px rgba(0,0,0,0.12)' : '0 2px 20px rgba(0,0,0,0.04)'
                        }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                              style={{
                                background: route.isReturnRoute
                                  ? 'rgba(245,158,11,0.12)'
                                  : 'linear-gradient(135deg, rgba(192,18,30,0.12), rgba(192,18,30,0.04))'
                              }}>
                              <Navigation size={18} style={{ color: route.isReturnRoute ? '#f59e0b' : '#c0121e' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-bold font-mono tracking-tight px-2.5 py-0.5 rounded-lg"
                                  style={{
                                    background: route.isReturnRoute ? 'rgba(245,158,11,0.1)' : t.navActive,
                                    color: route.isReturnRoute ? '#f59e0b' : '#c0121e',
                                  }}>
                                  {route.flightNumber}
                                </span>
                                <span className="text-base font-bold tracking-tight" style={{ color: t.text }}>{route.depIcao}</span>
                                <div className="flex items-center gap-1">
                                  <div className="w-6 h-px" style={{ background: t.border }} />
                                  <ArrowRight size={12} style={{ color: t.textMuted }} />
                                  <div className="w-6 h-px" style={{ background: t.border }} />
                                </div>
                                <span className="text-base font-bold tracking-tight" style={{ color: t.text }}>{route.arrIcao}</span>
                              </div>
                              <div className="flex items-center gap-4 flex-wrap">
                                <span className="text-xs" style={{ color: t.textSub }}>
                                  {route.depName || route.depIcao} → {route.arrName || route.arrIcao}
                                </span>
                                <span className="flex items-center gap-1 text-xs" style={{ color: t.textMuted }}>
                                  <Clock size={10} />
                                  {Math.floor((route.duration || 60) / 60)}h {(route.duration || 60) % 60}m
                                </span>
                                {route.distance && (
                                  <span className="flex items-center gap-1 text-xs" style={{ color: t.textMuted }}>
                                    <Fuel size={10} />
                                    {route.distance} nm
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#10b981' }}>
                                  <DollarSign size={10} />
                                  ${estimatedEarnings(route)} est.
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:translate-x-0.5 flex-shrink-0"
                            style={{ background: route.isReturnRoute ? 'rgba(245,158,11,0.1)' : 'rgba(192,18,30,0.08)' }}>
                            <ChevronRight size={16} style={{ color: route.isReturnRoute ? '#f59e0b' : '#c0121e' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── MY BOOKINGS ── */}
        {view === 'mybookings' && (
          <div className="space-y-5">
            <div className="flex gap-3 p-4 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, rgba(192,18,30,0.07), rgba(192,18,30,0.03))', border: '1px solid rgba(192,18,30,0.12)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(192,18,30,0.12)' }}>
                <Info size={15} style={{ color: '#c0121e' }} />
              </div>
              <div className="text-xs leading-relaxed" style={{ color: 'rgba(192,18,30,0.8)' }}>
                Realistic Ops flights are for today only and generated daily based on ATC staff availability.
                Standard schedule bookings can be made on any active route.
              </div>
            </div>
            {myBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(192,18,30,0.06)' }}>
                  <img src="/logo.png" alt="" style={{ width: 36, height: 36, opacity: 0.4 }} />
                </div>
                <div className="text-base font-semibold mb-1.5" style={{ color: t.textSub }}>No flights yet</div>
                <div className="text-sm mb-6" style={{ color: t.textMuted }}>Select an aircraft family and book your first flight!</div>
                <button onClick={() => setView('family')}
                  className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #c0121e, #8b0000)',
                    boxShadow: '0 4px 15px rgba(192,18,30,0.3)',
                  }}>
                  Browse Aircraft
                </button>
              </div>
            ) : (
              myBookings.map((booking, i) => {
                const s = getStatusStyle(booking.status)
                const isRealisticOps = booking._type === 'realistic-ops'
                return (
                  <div key={`${booking._type}-${booking.id}`}
                    className="p-6 rounded-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${t.card}, ${t.cardHover})`,
                      border: `1px solid ${booking._type === 'realistic-ops' ? 'rgba(192,18,30,0.2)' : t.border}`,
                      boxShadow: isDark ? '0 2px 20px rgba(0,0,0,0.1)' : '0 2px 20px rgba(0,0,0,0.03)',
                    }}>
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm font-bold font-mono tracking-tight px-2.5 py-0.5 rounded-lg"
                            style={{ background: t.navActive, color: '#c0121e' }}>
                            {booking.flightNumber || booking.route?.flightNumber}
                          </span>
                          {isRealisticOps && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider"
                              style={{ background: 'linear-gradient(135deg, rgba(192,18,30,0.12), rgba(192,18,30,0.04))', color: '#c0121e' }}>
                              REALISTIC OPS
                            </span>
                          )}
                          <span className="px-3 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: s.bg, color: s.color }}>{s.label}</span>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-xl font-bold tracking-tight" style={{ color: t.text }}>{booking.depIcao || booking.route?.depIcao}</span>
                          <div className="flex items-center gap-1">
                            <div className="w-8 h-px" style={{ background: t.border }} />
                            <ArrowRight size={13} style={{ color: t.textMuted }} />
                            <div className="w-8 h-px" style={{ background: t.border }} />
                          </div>
                          <span className="text-xl font-bold tracking-tight" style={{ color: t.text }}>{booking.arrIcao || booking.route?.arrIcao}</span>
                        </div>
                        <div className="flex items-center gap-5 flex-wrap">
                          {!isRealisticOps && booking.aircraft && (
                            <span className="text-xs flex items-center gap-1.5" style={{ color: t.textSub }}>
                              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(192,18,30,0.08)' }}>
                                <img src="/logo.png" alt="" className="w-2.5 h-2.5 object-contain" />
                              </div>
                              {booking.aircraft?.name} · {booking.aircraft?.registration}
                            </span>
                          )}
                          <span className="text-xs flex items-center gap-1.5" style={{ color: t.textSub }}>
                            <Calendar size={12} style={{ color: t.textMuted }} />
                            {isRealisticOps ? booking.depTime : new Date(booking.depTime).toLocaleString()}
                          </span>
                          <span className="text-xs flex items-center gap-1.5" style={{ color: t.textSub }}>
                            <Radio size={12} style={{ color: t.textMuted }} />
                            {booking.network}
                          </span>
                          <span className="text-xs font-semibold flex items-center gap-1" style={{ color: '#10b981' }}>
                            <DollarSign size={12} />
                            ${isRealisticOps ? (booking.earnings || 0) : (booking.earnings?.toFixed(0) || '0')} est.
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2.5 flex-shrink-0">
                        <button onClick={() => navigate(`/booking/${isRealisticOps ? 'realistic' : 'standard'}/${booking.id}`)}
                          className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 hover:shadow-md"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                          Details
                        </button>
                        {booking.status === 'UPCOMING' && !isRealisticOps && (
                          <Link to="/pirep"
                            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white text-center transition-all duration-200 hover:shadow-md"
                            style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)', textDecoration: 'none' }}>
                            File PIREP
                          </Link>
                        )}
                        {booking.status === 'UPCOMING' && (
                          <button onClick={() => handleCancel(booking)}
                            className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 hover:opacity-80"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}>
                            Cancel
                          </button>
                        )}
                        {booking.status === 'APPROVED' && (
                          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                            style={{ background: 'rgba(16,185,129,0.1)' }}>
                            <Check size={13} style={{ color: '#10b981' }} />
                            <span className="text-xs font-bold" style={{ color: '#10b981' }}>+${booking.earnings?.toFixed(0)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* ── BOOKING MODAL ── */}
      {selectedRoute && selectedAircraft && view !== 'mybookings' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedRoute(null) }}>
          <div
            className="w-full max-w-xl rounded-3xl flex flex-col overflow-hidden"
            style={{
              background: isDark ? '#141414' : '#ffffff',
              border: `1px solid ${t.border}`,
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              maxHeight: '90vh',
            }}>
            {/* Modal Header */}
            <div className="relative px-8 py-6"
              style={{
                background: 'linear-gradient(135deg, #c0121e, #8b0000)',
              }}>
              <div className="absolute inset-0" style={{ background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.08\'/%3E%3C/svg%3E")', opacity: 0.3 }} />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                    <img src="/logo.png" alt="" className="w-5 h-5 object-contain" />
                  </div>
                  <div>
                    <div className="font-bold text-base text-white">{selectedRoute.flightNumber}</div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{selectedRoute.depIcao} → {selectedRoute.arrIcao}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedRoute(null)}
                  className="p-2.5 rounded-xl transition-all duration-200 hover:bg-white/10"
                  style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {bookingSuccess ? (
              <div className="px-8 py-14 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'rgba(16,185,129,0.1)' }}>
                  <Check size={40} style={{ color: '#10b981' }} />
                </div>
                <div className="text-xl font-bold mb-2" style={{ color: t.text }}>Flight Booked!</div>
                <div className="text-sm mb-1" style={{ color: t.textSub }}>
                  {selectedRoute.flightNumber} — {selectedRoute.depIcao} → {selectedRoute.arrIcao}
                </div>
                <div className="text-sm mb-8" style={{ color: t.textMuted }}>
                  {selectedAircraft.name} · {selectedAircraft.registration}
                </div>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={async () => {
                      setSelectedRoute(null);
                      const b = await api.get('/bookings/my').then(r => r.data);
                      navigate(b?.[0]?.id ? `/booking/standard/${b[0].id}` : '/flights');
                    }}
                    className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #c0121e, #8b0000)',
                      boxShadow: '0 4px 15px rgba(192,18,30,0.3)',
                    }}>
                    View Booking Details
                  </button>
                  <button onClick={() => setSelectedRoute(null)}
                    className="px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                    style={{ background: t.badge, color: t.textSub }}>
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-8 py-6 space-y-6 overflow-y-auto flex-1">
                {/* Aircraft info chip */}
                <div className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{ background: t.badge, border: `1px solid ${t.border}` }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(192,18,30,0.1)' }}>
                    <img src="/logo.png" alt="" className="w-3.5 h-3.5 object-contain" />
                  </div>
                  <div className="text-sm" style={{ color: t.textSub }}>
                    <span className="font-semibold" style={{ color: t.text }}>{selectedAircraft.name}</span>
                    <span style={{ color: t.textMuted }}> · {selectedAircraft.registration} · From </span>
                    <strong style={{ color: t.text }}>{selectedRoute.depIcao}</strong>
                  </div>
                </div>

                {/* Route preview card */}
                <div className="p-5 rounded-2xl text-center"
                  style={{
                    background: `linear-gradient(135deg, ${t.navActive}, rgba(192,18,30,0.03))`,
                    border: `1px solid rgba(192,18,30,0.12)`,
                  }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1 text-center">
                      <div className="text-2xl font-bold tracking-tight" style={{ color: t.text }}>{selectedRoute.depIcao}</div>
                      <div className="text-xs mt-1" style={{ color: t.textSub }}>{selectedRoute.depName}</div>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-px" style={{ background: `linear-gradient(90deg, ${t.text}, ${t.text})` }} />
                        <div className="w-3 h-3 rounded-full flex items-center justify-center" style={{ background: 'rgba(192,18,30,0.15)' }}>
                          <div className="w-1 h-1 rounded-full" style={{ background: '#c0121e' }} />
                        </div>
                        <div className="w-12 h-px" style={{ background: `linear-gradient(90deg, ${t.text}, ${t.text})` }} />
                      </div>
                      {selectedRoute.distance && (
                        <span className="text-[11px] font-medium" style={{ color: t.textMuted }}>{selectedRoute.distance} nm</span>
                      )}
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-2xl font-bold tracking-tight" style={{ color: t.text }}>{selectedRoute.arrIcao}</div>
                      <div className="text-xs mt-1" style={{ color: t.textSub }}>{selectedRoute.arrName}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-4"
                    style={{ borderTop: `1px solid rgba(192,18,30,0.1)` }}>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5 text-sm font-bold" style={{ color: t.text }}>
                        <Clock size={13} style={{ color: t.textMuted }} />
                        {Math.floor((selectedRoute.duration || 60) / 60)}h {(selectedRoute.duration || 60) % 60}m
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: t.textMuted }}>Duration</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5 text-sm font-bold" style={{ color: '#10b981' }}>
                        <DollarSign size={13} />
                        ${estimatedEarnings(selectedRoute)}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: t.textMuted }}>Earnings</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5 text-sm font-bold" style={{ color: t.text }}>
                        <Fuel size={13} style={{ color: t.textMuted }} />
                        $500/hr
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: t.textMuted }}>Pay Rate</div>
                    </div>
                  </div>
                </div>

                {/* Info note */}
                <div className="flex gap-3 p-4 rounded-2xl"
                  style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.03))', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(59,130,246,0.12)' }}>
                    <Info size={14} style={{ color: '#3b82f6' }} />
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: '#3b82f6' }}>
                    <a href="/fsacars" className="font-semibold underline hover:opacity-80">FSACARS</a> auto-tracks your flight. Manual PIREPs also accepted.
                  </div>
                </div>

                {/* Form */}
                <div>
                  <label className="block text-xs font-semibold mb-2.5 tracking-wide" style={{ color: t.textMuted }}>DEPARTURE DATE & TIME</label>
                  <input type="datetime-local" value={bookingForm.depTime}
                    onChange={e => setBookingForm({ ...bookingForm, depTime: e.target.value })}
                    style={inputStyle}
                    className="[&::-webkit-calendar-picker-indicator]:cursor-pointer" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2.5 tracking-wide" style={{ color: t.textMuted }}>NETWORK</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {NETWORKS.map(net => (
                      <button key={net}
                        onClick={() => setBookingForm({ ...bookingForm, network: net })}
                        className="py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                        style={{
                          background: bookingForm.network === net
                            ? 'linear-gradient(135deg, rgba(192,18,30,0.15), rgba(192,18,30,0.05))'
                            : t.input,
                          border: `1px solid ${bookingForm.network === net ? 'rgba(192,18,30,0.4)' : t.border}`,
                          color: bookingForm.network === net ? '#c0121e' : t.textSub,
                          boxShadow: bookingForm.network === net ? '0 2px 10px rgba(192,18,30,0.1)' : 'none',
                        }}>
                        {net}
                      </button>
                    ))}
                  </div>
                </div>

                {bookingMsg && (
                  <div
                    className="px-4 py-3 rounded-xl text-xs font-medium"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {bookingMsg}
                  </div>
                )}

                <button onClick={handleBook} disabled={bookingLoading}
                  className="w-full py-4 rounded-xl text-sm font-bold text-white transition-all duration-200"
                  style={{
                    background: bookingLoading
                      ? 'linear-gradient(135deg, rgba(192,18,30,0.5), rgba(139,0,0,0.5))'
                      : 'linear-gradient(135deg, #c0121e, #8b0000)',
                    boxShadow: bookingLoading
                      ? 'none'
                      : '0 4px 20px rgba(192,18,30,0.35)',
                    opacity: bookingLoading ? 0.7 : 1,
                  }}>
                  {bookingLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 animate-spin"
                        style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                      Booking...
                    </span>
                  ) : (
                    `Book ${selectedRoute.flightNumber} — ${selectedRoute.depIcao} → ${selectedRoute.arrIcao}`
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
