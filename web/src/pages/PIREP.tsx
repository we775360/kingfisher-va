import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Plane, FileText, Clock, Navigation,
  Radio, Wind, AlertTriangle, Check,
  ChevronDown, Info, DollarSign
} from 'lucide-react'
import { useThemeStore } from '../store/theme.store'
import { useAuthStore } from '../store/auth.store'
import api from '../lib/axios'

const SIMULATORS = ['MSFS 2020', 'MSFS 2024', 'X-Plane 12', 'Prepar3D v5', 'Prepar3D v6']
const NETWORKS = ['Offline', 'VATSIM', 'IVAO']

export default function PIREP() {
  const { isDark } = useThemeStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const [aircraft, setAircraft] = useState<any[]>([])
  const [myBookings, setMyBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    flightNumber: '',
    depIcao: '',
    arrIcao: '',
    depTime: '',
    arrTime: '',
    aircraftId: '',
    aircraftSearch: '',
    simulator: 'MSFS 2020',
    network: 'Offline',
    landingRate: '',
    fuelUsed: '',
    distance: '',
    comments: '',
    bookingId: '',
  })

  const t = {
    bg: isDark ? '#0f0f0f' : '#f0f2f5',
    card: isDark ? '#141414' : '#ffffff',
    border: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    text: isDark ? '#ffffff' : '#0a0a0a',
    textSub: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
    textMuted: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
    navActive: isDark ? 'rgba(192,18,30,0.15)' : 'rgba(192,18,30,0.08)',
    navHover: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
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
      const [a, b] = await Promise.all([
        api.get('/aircraft'),
        api.get('/bookings/my'),
      ])
      setAircraft(a.data)
      setMyBookings(b.data.filter((b: any) => b.status === 'UPCOMING'))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredAircraft = aircraft.filter(a =>
    `${a.name} ${a.registration}`.toLowerCase().includes(form.aircraftSearch.toLowerCase())
  )

  const flightTime = () => {
    if (!form.depTime || !form.arrTime) return null
    const dep = new Date(form.depTime)
    const arr = new Date(form.arrTime)
    const diff = (arr.getTime() - dep.getTime()) / 1000 / 60 / 60
    return diff > 0 ? diff : null
  }

  const estimatedEarnings = () => {
    const ft = flightTime()
    if (!ft) return null
    return (ft * 500).toFixed(2)
  }

  const getLandingRateColor = () => {
    const lr = Math.abs(Number(form.landingRate))
    if (lr < 100) return '#10b981'
    if (lr < 200) return '#10b981'
    if (lr < 400) return '#f59e0b'
    return '#ef4444'
  }

  const getLandingRateLabel = () => {
    const lr = Math.abs(Number(form.landingRate))
    if (lr < 100) return 'Greaser!'
    if (lr < 200) return 'Smooth'
    if (lr < 300) return 'Acceptable'
    if (lr < 400) return 'Hard'
    return 'Very Hard'
  }

  const handleBookingSelect = (booking: any) => {
    setForm({
      ...form,
      bookingId: booking.id,
      flightNumber: booking.route?.flightNumber || '',
      depIcao: booking.route?.depIcao || '',
      arrIcao: booking.route?.arrIcao || '',
      aircraftId: booking.aircraft?.id || '',
      aircraftSearch: `${booking.aircraft?.name} · ${booking.aircraft?.registration}`,
      network: booking.network,
      distance: booking.route?.distance?.toString() || '',
    })
  }

  const handleSubmit = async () => {
    const ft = flightTime()
    if (!ft) { setError('Invalid departure or arrival time'); return }
    if (!form.aircraftId) { setError('Please select an aircraft'); return }
    if (!form.flightNumber) { setError('Flight number is required'); return }
    if (!form.depIcao || !form.arrIcao) { setError('Departure and arrival ICAO required'); return }
    if (!form.landingRate) { setError('Landing rate is required'); return }

    setSubmitting(true)
    setError('')

    try {
      await api.post('/pireps', {
        flightNumber: form.flightNumber,
        depIcao: form.depIcao.toUpperCase(),
        arrIcao: form.arrIcao.toUpperCase(),
        depTime: form.depTime,
        arrTime: form.arrTime,
        aircraftId: form.aircraftId,
        simulator: form.simulator,
        network: form.network,
        landingRate: Number(form.landingRate),
        fuelUsed: Number(form.fuelUsed) || 0,
        distance: Number(form.distance) || 0,
        flightTime: ft,
        comments: form.comments,
        bookingId: form.bookingId || undefined,
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit PIREP')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: t.bg }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: '#c0121e', borderTopColor: 'transparent' }} />
    </div>
  )

  if (success) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: t.bg }}>
      <div
        className="text-center p-8 sm:p-12 rounded-2xl max-w-md w-full mx-4 transition-all duration-200"
        style={{ background: t.card, border: `1px solid ${t.border}` }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(16,185,129,0.1)' }}>
          <Check size={32} style={{ color: '#10b981' }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: t.text }}>PIREP Submitted!</h2>
        <p className="text-sm mb-2" style={{ color: t.textSub }}>
          Your flight report has been submitted and is pending admin review.
        </p>
        <p className="text-xs mb-6" style={{ color: t.textMuted }}>
          Once approved, your hours and earnings will be credited to your account.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/flights')}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
            My Flights
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ background: t.input, color: t.textSub }}>
            Dashboard
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, color: t.text }}>

      {/* Header */}
      <div className="sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-4"
        style={{
          background: isDark ? 'rgba(15,15,15,0.92)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${t.border}`,
        }}>
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link to="/dashboard"
            className="text-sm transition-all duration-200 whitespace-nowrap"
            style={{ color: t.textSub, textDecoration: 'none' }}>
            ← Dashboard
          </Link>
          <div className="w-px h-4" style={{ background: t.border }} />
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={16} style={{ color: '#c0121e' }} />
            <span className="font-bold text-base truncate" style={{ color: t.text }}>File PIREP</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* Link to booking */}
        {myBookings.length > 0 && (
          <div
            className="p-4 rounded-2xl transition-all duration-200 hover:scale-[1.01]"
            style={{ background: t.navActive, border: `1px solid rgba(192,18,30,0.2)` }}>
            <div className="flex items-center gap-2 mb-3">
              <Plane size={14} style={{ color: '#c0121e' }} />
              <span className="text-sm font-semibold" style={{ color: t.text }}>
                Link to a Booked Flight
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{ background: 'rgba(192,18,30,0.1)', color: '#c0121e' }}>
                Optional
              </span>
            </div>
            <div className="space-y-2">
              {myBookings.map(booking => (
                <button key={booking.id}
                  onClick={() => handleBookingSelect(booking)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-left gap-2"
                  style={{
                    background: form.bookingId === booking.id ? 'rgba(192,18,30,0.15)' : t.input,
                    border: `1px solid ${form.bookingId === booking.id ? 'rgba(192,18,30,0.4)' : t.border}`,
                  }}>
                  <div className="min-w-0">
                    <span className="text-sm font-bold font-mono" style={{ color: '#c0121e' }}>
                      {booking.route?.flightNumber}
                    </span>
                    <span className="text-sm ml-2" style={{ color: t.text }}>
                      {booking.route?.depIcao} → {booking.route?.arrIcao}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs whitespace-nowrap" style={{ color: t.textSub }}>
                      {booking.aircraft?.registration}
                    </span>
                    {form.bookingId === booking.id && (
                      <Check size={14} style={{ color: '#10b981' }} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Flight details */}
        <div
          className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.01]"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2.5 px-4 sm:px-5 py-4"
            style={{ borderBottom: `1px solid ${t.border}` }}>
            <Navigation size={15} style={{ color: '#c0121e' }} />
            <span className="text-sm font-semibold" style={{ color: t.text }}>Flight Details</span>
          </div>
          <div className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: t.textMuted }}>
                  FLIGHT NUMBER
                </label>
                <input value={form.flightNumber}
                  onChange={e => setForm({ ...form, flightNumber: e.target.value })}
                  placeholder="IT101"
                  style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: t.textMuted }}>
                  DEP ICAO
                </label>
                <input value={form.depIcao}
                  onChange={e => setForm({ ...form, depIcao: e.target.value.toUpperCase() })}
                  placeholder="VABB"
                  maxLength={4}
                  style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: t.textMuted }}>
                  ARR ICAO
                </label>
                <input value={form.arrIcao}
                  onChange={e => setForm({ ...form, arrIcao: e.target.value.toUpperCase() })}
                  placeholder="VIDP"
                  maxLength={4}
                  style={inputStyle} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: t.textMuted }}>
                  DEPARTURE TIME
                </label>
                <input type="datetime-local"
                  value={form.depTime}
                  onChange={e => setForm({ ...form, depTime: e.target.value })}
                  style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: t.textMuted }}>
                  ARRIVAL TIME
                </label>
                <input type="datetime-local"
                  value={form.arrTime}
                  onChange={e => setForm({ ...form, arrTime: e.target.value })}
                  style={inputStyle} />
              </div>
            </div>

            {/* Flight time display */}
            {flightTime() && (
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 px-4 py-3 rounded-xl"
                style={{ background: t.navActive }}>
                <div className="flex items-center gap-2">
                  <Clock size={13} style={{ color: '#c0121e' }} />
                  <span className="text-xs font-semibold whitespace-nowrap" style={{ color: t.text }}>
                    Flight Time: {flightTime()?.toFixed(1)}h
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign size={13} style={{ color: '#10b981' }} />
                  <span className="text-xs font-semibold whitespace-nowrap" style={{ color: '#10b981' }}>
                    Estimated: ${estimatedEarnings()}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: t.textMuted }}>
                  DISTANCE (nm)
                </label>
                <input value={form.distance}
                  onChange={e => setForm({ ...form, distance: e.target.value })}
                  placeholder="592"
                  type="number"
                  style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: t.textMuted }}>
                  FUEL USED (kg)
                </label>
                <input value={form.fuelUsed}
                  onChange={e => setForm({ ...form, fuelUsed: e.target.value })}
                  placeholder="8500"
                  type="number"
                  style={inputStyle} />
              </div>
            </div>
          </div>
        </div>

        {/* Aircraft */}
        <div
          className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.01]"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2.5 px-4 sm:px-5 py-4"
            style={{ borderBottom: `1px solid ${t.border}` }}>
            <Plane size={15} style={{ color: '#c0121e' }} />
            <span className="text-sm font-semibold" style={{ color: t.text }}>Aircraft & Equipment</span>
          </div>
          <div className="p-4 sm:p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: t.textMuted }}>
                AIRCRAFT
              </label>
              <input
                value={form.aircraftSearch}
                onChange={e => setForm({ ...form, aircraftSearch: e.target.value, aircraftId: '' })}
                placeholder="Search by name or registration..."
                style={inputStyle}
              />
              {form.aircraftSearch && !form.aircraftId && (
                <div className="mt-1.5 rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${t.border}`, background: isDark ? '#1a1a1a' : '#ffffff' }}>
                  {filteredAircraft.length === 0 ? (
                    <div className="px-4 py-3 text-xs" style={{ color: t.textMuted }}>No aircraft found</div>
                  ) : (
                    filteredAircraft.slice(0, 5).map(a => (
                      <button key={a.id}
                        onClick={() => setForm({ ...form, aircraftId: a.id, aircraftSearch: `${a.name} · ${a.registration}` })}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-all duration-200 gap-2"
                        style={{ borderBottom: `1px solid ${t.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = t.navHover}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <span className="text-sm font-medium truncate" style={{ color: t.text }}>{a.name}</span>
                        <span className="text-xs font-mono flex-shrink-0" style={{ color: '#c0121e' }}>{a.registration}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
              {form.aircraftId && (
                <div className="mt-1.5 flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <Check size={13} style={{ color: '#10b981' }} />
                  <span className="text-xs font-medium truncate" style={{ color: '#10b981' }}>{form.aircraftSearch}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: t.textMuted }}>
                  SIMULATOR
                </label>
                <select value={form.simulator}
                  onChange={e => setForm({ ...form, simulator: e.target.value })}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  {SIMULATORS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: t.textMuted }}>
                  NETWORK
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {NETWORKS.map(net => (
                    <button key={net}
                      onClick={() => setForm({ ...form, network: net })}
                      className="py-2.5 rounded-xl text-xs font-medium transition-all duration-200"
                      style={{
                        background: form.network === net ? 'rgba(192,18,30,0.15)' : t.input,
                        border: `1px solid ${form.network === net ? 'rgba(192,18,30,0.4)' : t.border}`,
                        color: form.network === net ? '#c0121e' : t.textSub,
                      }}>
                      {net}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Landing & Stats */}
        <div
          className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.01]"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2.5 px-4 sm:px-5 py-4"
            style={{ borderBottom: `1px solid ${t.border}` }}>
            <Wind size={15} style={{ color: '#c0121e' }} />
            <span className="text-sm font-semibold" style={{ color: t.text }}>Landing Report</span>
          </div>
          <div className="p-4 sm:p-5">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: t.textMuted }}>
                LANDING RATE (fpm — negative value)
              </label>
              <input value={form.landingRate}
                onChange={e => setForm({ ...form, landingRate: e.target.value })}
                placeholder="-150"
                type="number"
                style={inputStyle} />
              {form.landingRate && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: getLandingRateColor() }} />
                  <span className="text-xs font-semibold"
                    style={{ color: getLandingRateColor() }}>
                    {getLandingRateLabel()} — {Math.abs(Number(form.landingRate))} fpm
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comments */}
        <div
          className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.01]"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2.5 px-4 sm:px-5 py-4"
            style={{ borderBottom: `1px solid ${t.border}` }}>
            <FileText size={15} style={{ color: '#c0121e' }} />
            <span className="text-sm font-semibold" style={{ color: t.text }}>Comments</span>
            <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
              style={{ background: t.input, color: t.textSub }}>
              Optional
            </span>
          </div>
          <div className="p-4 sm:p-5">
            <textarea value={form.comments}
              onChange={e => setForm({ ...form, comments: e.target.value })}
              placeholder="Any remarks about the flight — weather, diversions, technical issues..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </div>

        {/* Info box */}
        <div className="flex gap-2.5 p-4 rounded-xl"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <Info size={14} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '1px' }} />
          <div className="text-xs leading-relaxed" style={{ color: '#3b82f6' }}>
            PIREPs are reviewed by staff before approval. Hours and earnings ($500/hr) are credited
            to your account upon approval. Dishonest reports may result in account suspension.
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex gap-2.5 p-4 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span className="text-xs break-words" style={{ color: '#ef4444' }}>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={submitting}
          className="w-full py-4 rounded-xl text-sm font-bold text-white transition-all duration-200 mb-8"
          style={{
            background: submitting ? 'rgba(192,18,30,0.5)' : 'linear-gradient(135deg, #c0121e, #8b0000)',
            boxShadow: submitting ? 'none' : '0 0 20px rgba(192,18,30,0.3)',
          }}>
          {submitting ? 'Submitting PIREP...' : 'Submit Flight Report'}
        </button>

      </div>
    </div>
  )
}
