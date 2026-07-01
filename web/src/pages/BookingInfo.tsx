import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Tooltip, Polyline } from 'react-leaflet'
import L from 'leaflet'
// @ts-ignore
import 'leaflet/dist/leaflet.css'
import {
  Plane, Clock, X, Globe, Radio,
  DollarSign, Info, Check, ArrowRight, MapPin,
  FileText, AlertTriangle,
  Cloud, Ban, ArrowLeft, Edit3, Download, Fuel, Weight,
  Route
} from 'lucide-react'
import { useThemeStore } from '../store/theme.store'
import { useAuthStore } from '../store/auth.store'
import { getAirportCoords, getMidpoint } from '../utils/airportCoords'
import api from '../lib/axios'

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const depIcon = new L.DivIcon({
  className: '',
  html: `<div style="background:#10b981;width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const arrIcon = new L.DivIcon({
  className: '',
  html: `<div style="background:#c0121e;width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

export default function BookingInfo() {
  const { type, id } = useParams<{ type: string; id: string }>()
  const { isDark } = useThemeStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [networkChanging, setNetworkChanging] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [metarDep, setMetarDep] = useState('')
  const [metarArr, setMetarArr] = useState('')
  const [notamDep, setNotamDep] = useState<string[]>([])
  const [notamArr, setNotamArr] = useState<string[]>([])
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [networkDropdown, setNetworkDropdown] = useState(false)
  const [ofpData, setOfpData] = useState<any>(null)
  const [ofpLoading, setOfpLoading] = useState(false)
  const [ofpError, setOfpError] = useState('')

  const isStandard = type === 'standard'
  const depIcao = booking?.depIcao || booking?.route?.depIcao || ''
  const arrIcao = booking?.arrIcao || booking?.route?.arrIcao || ''
  const flightNumber = booking?.flightNumber || booking?.route?.flightNumber || ''
  const aircraftName = booking?.aircraft?.name || booking?.aircraftType || ''
  const aircraftReg = booking?.aircraft?.registration || ''
  const bookingNetwork = booking?.network || ''
  const bookingStatus = booking?.status || ''
  const depTime = booking?.depTime || booking?.offBlock || ''
  const arrTime = booking?.arrTime || booking?.onBlock || ''

  const depCoords = getAirportCoords(depIcao)
  const arrCoords = getAirportCoords(arrIcao)
  const center = getMidpoint(depCoords, arrCoords)
  const flightEarnings = booking?.earnings || booking?.reward || 0

  const NETWORK_OPTIONS = isStandard ? ['Offline', 'VATSIM', 'IVAO'] : ['VATSIM', 'IVAO']

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (!id || !type) { navigate('/dashboard'); return }
    fetchBooking()
  }, [id, type])

  useEffect(() => {
    if (depIcao) { fetchMETAR(depIcao, setMetarDep); fetchNOTAMs(depIcao, setNotamDep) }
    if (arrIcao) { fetchMETAR(arrIcao, setMetarArr); fetchNOTAMs(arrIcao, setNotamArr) }
  }, [depIcao, arrIcao])

  const fetchBooking = async () => {
    setLoading(true)
    setError('')
    try {
      const endpoint = isStandard
        ? `/bookings/${id}`
        : `/realistic-flights/${id}`
      const res = await api.get(endpoint)
      setBooking(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load booking')
    } finally {
      setLoading(false)
    }
  }

  const fetchMETAR = async (icao: string, setter: (v: string) => void) => {
    try {
      const res = await api.get(`/public/weather/metar/${icao}`, { responseType: 'text' })
      setter((res.data || '').trim() || 'METAR unavailable')
    } catch {
      setter('METAR unavailable')
    }
  }

  const fetchNOTAMs = async (icao: string, setter: (v: string[]) => void) => {
    try {
      const res = await api.get(`/public/weather/notam/${icao}`, { responseType: 'text' })
      const text = (res.data || '') as string
      const lines = text.split('\n').filter(l => l.trim().length > 0).slice(0, 5)
      setter(lines.length > 0 ? lines : ['No active NOTAMs'])
    } catch {
      setter([])
    }
  }

  const handleNetworkChange = async (network: string) => {
    setNetworkChanging(true)
    try {
      const endpoint = isStandard
        ? `/bookings/${id}/network`
        : `/realistic-flights/${id}/network`
      await api.patch(endpoint, { network })
      setBooking((prev: any) => ({ ...prev, network }))
      setNetworkDropdown(false)
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to change network')
    } finally {
      setNetworkChanging(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      if (isStandard) {
        await api.patch(`/bookings/${id}/cancel`)
      } else {
        await api.patch(`/realistic-flights/${id}/cancel`)
      }
      navigate('/flights')
    } catch (err: any) {
      alert(err.response?.data?.error || 'Cancellation failed')
    } finally {
      setCancelling(false)
      setShowCancelConfirm(false)
    }
  }

  const handleGenerateOFP = async () => {
    setOfpLoading(true)
    setOfpError('')
    try {
      const res = await api.get(`/ofp/generate`, { params: { bookingId: id, type } })
      setOfpData(res.data)
    } catch (err: any) {
      setOfpError(err.response?.data?.error || 'Failed to generate OFP')
    } finally {
      setOfpLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    setOfpLoading(true)
    try {
      const res = await api.get(`/ofp/download`, {
        params: { bookingId: id, type },
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `OFP-${flightNumber}-${depIcao}-${arrIcao}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setOfpError('Failed to download OFP PDF')
    } finally {
      setOfpLoading(false)
    }
  }

  const t = {
    bg: isDark ? '#0f0f0f' : '#f0f2f5',
    card: isDark ? '#141414' : '#ffffff',
    border: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    text: isDark ? '#ffffff' : '#0a0a0a',
    textSub: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
    textMuted: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
    navActive: isDark ? 'rgba(192,18,30,0.15)' : 'rgba(192,18,30,0.08)',
    badge: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    input: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: t.bg }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#c0121e', borderTopColor: 'transparent' }} />
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: t.bg, color: t.text }}>
      <AlertTriangle size={48} style={{ color: '#ef4444' }} />
      <div className="text-lg font-bold">{error}</div>
      <button onClick={() => navigate('/flights')} className="px-6 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
        Back to Flights
      </button>
    </div>
  )

  const statusColor: Record<string, string> = {
    UPCOMING: '#3b82f6', BOOKED: '#3b82f6', PIREP_PENDING: '#f59e0b',
    APPROVED: '#10b981', COMPLETED: '#6b7280', CANCELLED: '#ef4444',
  }

  const isUpcoming = bookingStatus === 'UPCOMING' || bookingStatus === 'BOOKED'

  const getTimeDisplay = () => {
    if (isStandard && depTime) {
      const d = new Date(depTime)
      return d.toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
      })
    }
    if (!isStandard && depTime) return `${depTime} UTC`
    return '—'
  }

  const getArrTimeDisplay = () => {
    if (isStandard && booking?.route?.duration) {
      const d = new Date(depTime)
      d.setMinutes(d.getMinutes() + booking.route.duration)
      return d.toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
      })
    }
    if (!isStandard && arrTime) return `${arrTime} UTC`
    return '—'
  }

  return (
    <div className="min-h-screen" style={{ background: t.bg, color: t.text }}>
      <div className="sticky top-0 z-30 px-6 py-4" style={{
        background: isDark ? 'rgba(15,15,15,0.92)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${t.border}`,
      }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/flights" className="flex items-center gap-2 text-sm transition-colors" style={{ color: t.textSub, textDecoration: 'none' }}>
              <ArrowLeft size={16} /> Flights
            </Link>
            <div className="w-px h-4" style={{ background: t.border }} />
            <div className="flex items-center gap-2">
              <Plane size={16} style={{ color: '#c0121e' }} />
              <span className="font-bold text-base" style={{ color: t.text }}>Booking Checkout</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold" style={{ color: '#c0121e' }}>{flightNumber}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* ── ROUTE MAP ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative h-[300px] rounded-2xl overflow-hidden border"
          style={{ borderColor: t.border }}
        >
          {/* @ts-ignore */}
          <MapContainer center={center} zoom={4} style={{ height: '100%', width: '100%' }} zoomControl={false} scrollWheelZoom={false}>
            <TileLayer url={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"} />
            {/* @ts-ignore */}
            <Marker position={depCoords} icon={depIcon}>
              <Tooltip permanent direction="top">
                <div style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace' }}>{depIcao}</div>
              </Tooltip>
            </Marker>
            {/* @ts-ignore */}
            <Marker position={arrCoords} icon={arrIcon}>
              <Tooltip permanent direction="top">
                <div style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace' }}>{arrIcao}</div>
              </Tooltip>
            </Marker>
            {/* @ts-ignore */}
            <Polyline positions={[depCoords, arrCoords]} color="#c0121e" weight={3} opacity={0.7} dashArray="10 8" />
          </MapContainer>
          <div className="absolute top-4 left-4 z-[500] flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest" style={{ background: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}>
            <MapPin size={12} style={{ color: '#10b981' }} /> {depIcao}
            <ArrowRight size={10} style={{ color: t.textMuted }} />
            <MapPin size={12} style={{ color: '#c0121e' }} /> {arrIcao}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── BOOKING DETAILS ── */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl overflow-hidden border"
              style={{ background: t.card, borderColor: t.border }}
            >
              <div className="flex items-center gap-2.5 px-6 py-4 border-b" style={{ borderColor: t.border }}>
                <FileText size={15} style={{ color: '#c0121e' }} />
                <span className="text-sm font-semibold" style={{ color: t.text }}>Flight Details</span>
                {!isStandard && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold ml-auto" style={{ background: 'rgba(192,18,30,0.1)', color: '#c0121e' }}>
                    REALISTIC OPS
                  </span>
                )}
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Flight Number</div>
                    <div className="text-sm font-bold font-mono mt-1" style={{ color: '#c0121e' }}>{flightNumber}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Aircraft</div>
                    <div className="text-sm font-bold mt-1" style={{ color: t.text }}>{aircraftName || '—'}</div>
                    {aircraftReg && <div className="text-[10px] font-mono" style={{ color: t.textSub }}>{aircraftReg}</div>}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Status</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: statusColor[bookingStatus] || '#6b7280' }} />
                      <span className="text-sm font-bold" style={{ color: statusColor[bookingStatus] || t.text }}>{bookingStatus}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Network</div>
                    <div className="relative">
                      <button
                        onClick={() => isUpcoming ? setNetworkDropdown(!networkDropdown) : null}
                        className="flex items-center gap-1.5 text-sm font-bold mt-1 transition-colors"
                        style={{ color: '#8b5cf6', cursor: isUpcoming ? 'pointer' : 'default' }}
                      >
                        <Radio size={12} /> {bookingNetwork}
                        {isUpcoming && <Edit3 size={10} style={{ opacity: 0.5 }} />}
                      </button>
                      {networkDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute top-full left-0 mt-1 rounded-xl overflow-hidden z-10 shadow-2xl border"
                          style={{ background: t.card, borderColor: t.border, minWidth: '140px' }}
                        >
                          {NETWORK_OPTIONS.map(net => (
                            <button
                              key={net}
                              onClick={() => handleNetworkChange(net)}
                              disabled={networkChanging}
                              className="w-full px-4 py-2.5 text-xs font-semibold text-left transition-colors hover:bg-red-600/10 flex items-center gap-2"
                              style={{
                                color: bookingNetwork === net ? '#c0121e' : t.text,
                                background: bookingNetwork === net ? 'rgba(192,18,30,0.08)' : 'transparent',
                              }}
                            >
                              {bookingNetwork === net && <Check size={12} style={{ color: '#c0121e' }} />}
                              {bookingNetwork !== net && <div className="w-3" />}
                              {net}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="h-px" style={{ background: t.border }} />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Route</div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="text-center">
                        <div className="text-lg font-bold" style={{ color: t.text }}>{depIcao}</div>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <Plane size={12} style={{ color: '#c0121e' }} />
                        <div className="text-[9px] font-mono" style={{ color: t.textMuted }}>{booking?.route?.distance || booking?.distance || ''} nm</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold" style={{ color: t.text }}>{arrIcao}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Off-Block</div>
                    <div className="text-sm font-bold mt-1" style={{ color: t.text }}>{getTimeDisplay()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>On-Block (Est.)</div>
                    <div className="text-sm font-bold mt-1" style={{ color: t.text }}>{getArrTimeDisplay()}</div>
                  </div>
                </div>

                <div className="h-px" style={{ background: t.border }} />

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Est. Duration</div>
                    <div className="text-sm font-bold mt-1" style={{ color: t.text }}>
                      {isStandard && booking?.route?.duration
                        ? `${Math.floor(booking.route.duration / 60)}h ${booking.route.duration % 60}m`
                        : booking?.estimatedFlightTime || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Distance</div>
                    <div className="text-sm font-bold mt-1" style={{ color: t.text }}>{booking?.route?.distance || booking?.distance || '—'} nm</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Est. Earnings</div>
                    <div className="text-sm font-bold mt-1" style={{ color: '#10b981' }}>
                      ${isStandard ? flightEarnings?.toFixed(0) : flightEarnings}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="h-px" style={{ background: t.border }} />
                <div className="flex flex-wrap gap-3">
                  {isUpcoming && (
                    <>
                      <Link to="/pirep"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                        style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)', color: 'white' }}>
                        <FileText size={13} /> File PIREP
                      </Link>
                      <button onClick={() => setShowCancelConfirm(true)}
                        disabled={cancelling}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                        {cancelling ? '...' : <><Ban size={13} /> Cancel Booking</>}
                      </button>
                    </>
                  )}
                  {isStandard && isUpcoming && booking?.pirep && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                      <Clock size={13} /> PIREP Pending Review
                    </div>
                  )}
                  {!isUpcoming && bookingStatus === 'APPROVED' && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                      <Check size={13} /> Completed
                    </div>
                  )}
                  {!isUpcoming && bookingStatus === 'CANCELLED' && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                      <Ban size={13} /> Cancelled
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ── OPERATIONAL FLIGHT PLAN ── */}
            {isUpcoming && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl overflow-hidden border"
                style={{ background: t.card, borderColor: t.border }}
              >
                <div className="flex items-center gap-2.5 px-6 py-4 border-b" style={{ borderColor: t.border }}>
                  <FileText size={15} style={{ color: '#c0121e' }} />
                  <span className="text-sm font-semibold" style={{ color: t.text }}>Operational Flight Plan</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold ml-auto" style={{ background: 'rgba(192,18,30,0.1)', color: '#c0121e' }}>
                    SIMBRIEF-STYLE
                  </span>
                </div>
                <div className="p-6">
                  {!ofpData ? (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(192,18,30,0.08)' }}>
                        <FileText size={28} style={{ color: '#c0121e' }} />
                      </div>
                      <div className="text-sm font-semibold mb-2" style={{ color: t.text }}>Generate Your OFP</div>
                      <div className="text-xs mb-5" style={{ color: t.textSub }}>
                        Create a detailed operational flight plan with fuel calculations,
                        weight & balance, route waypoints, and live weather data.
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-5 text-left max-w-sm mx-auto">
                        {['Live METAR/TAF weather', 'Aircraft performance data', 'Fuel & weight planning', 'Dispatch release', 'Multi-page PDF download', 'Nav database powered'].map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px]" style={{ color: t.textSub }}>
                            <Check size={10} style={{ color: '#10b981' }} />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleGenerateOFP}
                        disabled={ofpLoading}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                          background: ofpLoading ? 'rgba(192,18,30,0.5)' : 'linear-gradient(135deg, #c0121e, #8b0000)',
                          boxShadow: ofpLoading ? 'none' : '0 4px 20px rgba(192,18,30,0.3)',
                        }}
                      >
                        {ofpLoading ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            Generating...
                          </span>
                        ) : (
                          <><FileText size={14} /> Generate OFP</>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* OFP Header */}
                      <div className="text-center pb-4 border-b" style={{ borderColor: t.border }}>
                        <div className="text-lg font-black font-mono" style={{ color: '#c0121e' }}>{ofpData.header.flightNumber}</div>
                        <div className="text-xs font-mono mt-1" style={{ color: t.textSub }}>
                          {ofpData.header.date} &middot; {ofpData.header.depIcao} → {ofpData.header.arrIcao} &middot; {ofpData.header.aircraftIcao} {ofpData.header.aircraftReg}
                        </div>
                        <div className="text-[10px] font-mono mt-1" style={{ color: t.textMuted }}>
                          RELEASE {ofpData.header.releaseTime}Z &middot; OFP {ofpData.header.ofpNumber}
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="px-3 py-2.5 rounded-xl" style={{ background: t.input }}>
                          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Block Fuel</div>
                          <div className="text-base font-bold font-mono mt-0.5" style={{ color: t.text }}>{ofpData.fuel.blockFuel.toLocaleString()} kg</div>
                        </div>
                        <div className="px-3 py-2.5 rounded-xl" style={{ background: t.input }}>
                          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>TOW</div>
                          <div className="text-base font-bold font-mono mt-0.5" style={{ color: t.text }}>{ofpData.weights.tow.toFixed(1)}t</div>
                        </div>
                        <div className="px-3 py-2.5 rounded-xl" style={{ background: t.input }}>
                          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Distance</div>
                          <div className="text-base font-bold font-mono mt-0.5" style={{ color: t.text }}>{ofpData.route.totalDistance} nm</div>
                        </div>
                        <div className="px-3 py-2.5 rounded-xl" style={{ background: t.input }}>
                          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Flight Time</div>
                          <div className="text-base font-bold font-mono mt-0.5" style={{ color: t.text }}>{Math.floor(ofpData.times.flightTime / 60)}h {ofpData.times.flightTime % 60}m</div>
                        </div>
                      </div>

                      {/* Fuel Summary */}
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: t.textMuted }}>Fuel Plan</div>
                        <div className="rounded-xl overflow-hidden border text-[11px] font-mono" style={{ borderColor: t.border }}>
                          {[
                            ['TRIP', ofpData.header.arrIcao, ofpData.fuel.tripFuel, `${Math.floor(ofpData.fuel.tripFuelTime / 60)}h ${ofpData.fuel.tripFuelTime % 60}m`],
                            ['CONT 5%', '', ofpData.fuel.contingencyFuel, '15m'],
                            ['ALTN', ofpData.route.altnIcao, ofpData.fuel.alternateFuel, `${Math.floor(ofpData.fuel.alternateTime / 60)}h ${ofpData.fuel.alternateTime % 60}m`],
                            ['FIN RES', '', ofpData.fuel.finalReserve, '30m'],
                            ['MIN T/OFF', '', ofpData.fuel.minimumTakeoffFuel, `${Math.floor(ofpData.fuel.minimumTakeoffTime / 60)}h ${ofpData.fuel.minimumTakeoffTime % 60}m`],
                            ['EXTRA', '', ofpData.fuel.extraFuel, '0m'],
                            ['TAXI', ofpData.header.depIcao, ofpData.fuel.taxiFuel, '20m'],
                          ].map((row, i) => (
                            <div key={i} className="flex items-center px-4 py-1.5" style={{ background: i % 2 === 0 ? t.input : 'transparent' }}>
                              <span className="w-20 font-bold" style={{ color: t.text }}>{row[0]}</span>
                              <span className="w-16" style={{ color: t.textSub }}>{row[1] as string}</span>
                              <span className="flex-1 text-right font-bold" style={{ color: t.text }}>{(row[2] as number).toLocaleString()} kg</span>
                              <span className="w-20 text-right" style={{ color: t.textMuted }}>{row[3] as string}</span>
                            </div>
                          ))}
                          <div className="flex items-center px-4 py-2 font-bold" style={{ background: 'rgba(192,18,30,0.08)' }}>
                            <span className="w-20" style={{ color: '#c0121e' }}>BLOCK</span>
                            <span className="w-16" style={{ color: t.textSub }}>{ofpData.header.depIcao}</span>
                            <span className="flex-1 text-right" style={{ color: '#c0121e' }}>{ofpData.fuel.blockFuel.toLocaleString()} kg</span>
                            <span className="w-20 text-right" style={{ color: t.textMuted }}>{Math.floor(ofpData.times.blockTime / 60)}h {ofpData.times.blockTime % 60}m</span>
                          </div>
                        </div>
                      </div>

                      {/* Weights Summary */}
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: t.textMuted }}>Weights (tonnes)</div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                          {[
                            ['BEW', ofpData.weights.bew / 1000, '—'],
                            ['PAYLOAD', ofpData.weights.payload, `Max ${ofpData.weights.mzfw.toFixed(1)}`],
                            ['ZFW', ofpData.weights.zfw, `MZFW ${ofpData.weights.mzfw}`],
                            ['TOW', ofpData.weights.tow, `MTOW ${ofpData.weights.mtow}`],
                            ['LAW', ofpData.weights.law, `MLW ${ofpData.weights.mlw}`],
                            ['FUEL', ofpData.weights.fuelWeight, `Cap ${ofpData.weights.maxFuel}`],
                          ].map((row, i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg" style={{ background: t.input }}>
                              <span style={{ color: t.textMuted }}>{row[0]}</span>
                              <span className="font-bold" style={{ color: t.text }}>{(row[1] as number).toFixed(1)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Route */}
                      {ofpData.route.routeString && (
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: t.textMuted }}>Route</div>
                          <div className="text-[11px] font-mono leading-relaxed px-4 py-3 rounded-xl" style={{ background: t.input, color: t.text }}>
                            {ofpData.route.routeString}
                          </div>
                        </div>
                      )}

                      {/* Times */}
                      <div className="grid grid-cols-4 gap-2 text-[11px] font-mono text-center">
                        {[['OUT', ofpData.times.out], ['OFF', ofpData.times.off], ['ON', ofpData.times.on], ['IN', ofpData.times.in]].map(([label, val], i) => (
                          <div key={i} className="px-2 py-2 rounded-xl" style={{ background: t.input }}>
                            <div className="text-[9px] font-bold uppercase" style={{ color: t.textMuted }}>{label as string}</div>
                            <div className="text-xs font-bold mt-0.5" style={{ color: t.text }}>{val as string}Z</div>
                          </div>
                        ))}
                      </div>

                      {/* METAR */}
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: t.textMuted }}>Live Weather</div>
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-2 text-[10px] font-mono px-3 py-2 rounded-lg" style={{ background: t.input }}>
                            <span className="font-bold shrink-0" style={{ color: '#10b981' }}>{ofpData.header.depIcao}</span>
                            <span style={{ color: t.textSub, wordBreak: 'break-word' }}>{ofpData.metar.dep}</span>
                          </div>
                          <div className="flex items-start gap-2 text-[10px] font-mono px-3 py-2 rounded-lg" style={{ background: t.input }}>
                            <span className="font-bold shrink-0" style={{ color: '#c0121e' }}>{ofpData.header.arrIcao}</span>
                            <span style={{ color: t.textSub, wordBreak: 'break-word' }}>{ofpData.metar.arr}</span>
                          </div>
                        </div>
                      </div>

                      {/* Error */}
                      {ofpError && (
                        <div className="text-xs font-medium px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                          {ofpError}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3 pt-2">
                        <button
                          onClick={handleGenerateOFP}
                          disabled={ofpLoading}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
                          style={{ background: 'rgba(192,18,30,0.1)', color: '#c0121e', border: '1px solid rgba(192,18,30,0.2)' }}
                        >
                          <FileText size={13} /> Regenerate
                        </button>
                        <button
                          onClick={handleDownloadPDF}
                          disabled={ofpLoading}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02]"
                          style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}
                        >
                          <Download size={13} /> Download PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="space-y-6">
            {/* METARs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl overflow-hidden border"
              style={{ background: t.card, borderColor: t.border }}
            >
              <div className="flex items-center gap-2.5 px-6 py-4 border-b" style={{ borderColor: t.border }}>
                <Cloud size={15} style={{ color: '#3b82f6' }} />
                <span className="text-sm font-semibold" style={{ color: t.text }}>Live METARs</span>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
                    <span className="text-xs font-bold font-mono" style={{ color: t.text }}>{depIcao}</span>
                  </div>
                  <div className="text-[11px] font-mono leading-relaxed px-3 py-2 rounded-lg" style={{ background: t.input, color: t.textSub, wordBreak: 'break-word' }}>
                    {metarDep || <span style={{ opacity: 0.5 }}>Loading...</span>}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#c0121e' }} />
                    <span className="text-xs font-bold font-mono" style={{ color: t.text }}>{arrIcao}</span>
                  </div>
                  <div className="text-[11px] font-mono leading-relaxed px-3 py-2 rounded-lg" style={{ background: t.input, color: t.textSub, wordBreak: 'break-word' }}>
                    {metarArr || <span style={{ opacity: 0.5 }}>Loading...</span>}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* NOTAMs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="rounded-2xl overflow-hidden border"
              style={{ background: t.card, borderColor: t.border }}
            >
              <div className="flex items-center gap-2.5 px-6 py-4 border-b" style={{ borderColor: t.border }}>
                <AlertTriangle size={15} style={{ color: '#f59e0b' }} />
                <span className="text-sm font-semibold" style={{ color: t.text }}>Live NOTAMs</span>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
                    <span className="text-xs font-bold font-mono" style={{ color: t.text }}>{depIcao}</span>
                  </div>
                  <div className="max-h-[120px] overflow-y-auto space-y-1">
                    {notamDep.length > 0 ? notamDep.map((n, i) => (
                      <div key={i} className="text-[10px] font-mono leading-relaxed px-2 py-1 rounded" style={{ background: t.input, color: t.textSub }}>
                        {n}
                      </div>
                    )) : <div className="text-[10px]" style={{ color: t.textMuted }}>No active NOTAMs</div>}
                  </div>
                </div>
                <div className="h-px" style={{ background: t.border }} />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#c0121e' }} />
                    <span className="text-xs font-bold font-mono" style={{ color: t.text }}>{arrIcao}</span>
                  </div>
                  <div className="max-h-[120px] overflow-y-auto space-y-1">
                    {notamArr.length > 0 ? notamArr.map((n, i) => (
                      <div key={i} className="text-[10px] font-mono leading-relaxed px-2 py-1 rounded" style={{ background: t.input, color: t.textSub }}>
                        {n}
                      </div>
                    )) : <div className="text-[10px]" style={{ color: t.textMuted }}>No active NOTAMs</div>}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Summary */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl overflow-hidden border"
              style={{ background: t.card, borderColor: t.border }}
            >
              <div className="flex items-center gap-2.5 px-6 py-4 border-b" style={{ borderColor: t.border }}>
                <Info size={15} style={{ color: '#c0121e' }} />
                <span className="text-sm font-semibold" style={{ color: t.text }}>Quick Summary</span>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs" style={{ color: t.textMuted }}>Type</span>
                  <span className="text-xs font-bold" style={{ color: t.text }}>{isStandard ? 'Standard Schedule' : 'Realistic Ops'}</span>
                </div>
                <div className="h-px" style={{ background: t.border }} />
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs" style={{ color: t.textMuted }}>Pilot</span>
                  <span className="text-xs font-bold" style={{ color: t.text }}>{booking?.pilot?.callsign || booking?.pilot?.firstName || '—'}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── CANCEL CONFIRMATION MODAL ── */}
      {showCancelConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCancelConfirm(false) }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md rounded-2xl"
            style={{ background: isDark ? '#141414' : '#ffffff', border: `1px solid ${t.border}` }}
          >
            <div className="px-6 py-5 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <AlertTriangle size={28} style={{ color: '#ef4444' }} />
              </div>
              <div className="text-lg font-bold mb-2" style={{ color: t.text }}>Cancel Booking?</div>
              <div className="text-sm mb-1" style={{ color: t.textSub }}>
                {flightNumber} — {depIcao} → {arrIcao}
              </div>
              {!isStandard && (
                <div className="flex items-center justify-center gap-2 mt-4 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <DollarSign size={16} style={{ color: '#ef4444' }} />
                  <span className="text-sm font-semibold" style={{ color: '#ef4444' }}>
                    $500 cancellation penalty will be deducted from your wallet
                  </span>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: t.badge, color: t.textSub }}>
                  Keep Booking
                </button>
                <button onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ background: cancelling ? 'rgba(239,68,68,0.5)' : '#ef4444' }}>
                  {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
