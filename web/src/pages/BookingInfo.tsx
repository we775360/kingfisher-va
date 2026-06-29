import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Tooltip, Polyline } from 'react-leaflet'
import L from 'leaflet'
// @ts-ignore
import 'leaflet/dist/leaflet.css'
import {
  Plane, Navigation, Clock, X, Calendar, Globe, Radio,
  DollarSign, Info, Check, ArrowRight, MapPin, Download,
  FileText, AlertTriangle, ExternalLink, Zap, Loader,
  RefreshCw, Shield, Users, Fuel, Gauge, Thermometer,
  Wind, Cloud, Eye, Ban, ArrowLeft, Edit3
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
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()

  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ofpLoading, setOfpLoading] = useState(false)
  const [ofpData, setOfpData] = useState<any>(null)
  const [networkChanging, setNetworkChanging] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [metarDep, setMetarDep] = useState('')
  const [metarArr, setMetarArr] = useState('')
  const [notamDep, setNotamDep] = useState<string[]>([])
  const [notamArr, setNotamArr] = useState<string[]>([])
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [networkDropdown, setNetworkDropdown] = useState(false)

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
  const simbriefUsername = booking?.pilot?.simbriefUsername || user?.pilot?.simbriefUsername || ''

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
      const rawOfp = res.data?.simbriefOfpData
      if (rawOfp) {
        try {
          const parsed = typeof rawOfp === 'string' ? JSON.parse(rawOfp) : rawOfp
          setOfpData(parsed)
        } catch { }
      }
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
      setter(['NOTAMs unavailable'])
    }
  }

  const handleGenerateOFP = async () => {
    if (!simbriefUsername) {
      navigate('/settings')
      return
    }
    setOfpLoading(true)
    try {
      const res = await api.post(`/bookings/${id}/generate-ofp`)
      const rawOfp = res.data?.ofpData
      if (rawOfp) {
        setOfpData(rawOfp)
        setBooking((prev: any) => ({
          ...prev,
          simbriefOfpData: JSON.stringify(rawOfp),
          simbriefPdfUrl: res.data.pdfUrl,
        }))
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Unknown error'
      alert('OFP Generation: ' + msg)
    } finally {
      setOfpLoading(false)
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

  const handleFileToIVAO = () => {
    const url = `https://www.simbrief.com/system/dispatch.php?orig=${depIcao}&dest=${arrIcao}&airline=KFR&fltnum=${flightNumber.replace('KFR', '')}&ivao=1&auto=1`
    window.open(url, '_blank')
  }

  const handleFileToVATSIM = () => {
    const url = `https://www.simbrief.com/system/dispatch.php?orig=${depIcao}&dest=${arrIcao}&airline=KFR&fltnum=${flightNumber.replace('KFR', '')}&vatsim=1&auto=1`
    window.open(url, '_blank')
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

  const extractOfpSection = (data: any, section: string) => {
    if (!data) return null
    return data.fetch?.text?.flight?.airline?.flight?.find((f: any) => f.label === section)
      || data.fetch?.text?.flight?.airline?.flight?.[section]
      || data[section] || null
  }

  const getOFPValue = (data: any, ...keys: string[]) => {
    if (!data) return ''
    for (const key of keys) {
      const v = data.fetch?.text?.flight?.airline?.flight?.[0]?.[key]
        || data.fetch?.text?.general?.[key]
        || data.fetch?.params?.[key]
        || data[key]
      if (v !== undefined && v !== null) return String(v)
    }
    return ''
  }

  const ofpGeneral = ofpData?.fetch?.text?.general || ofpData?.general || {}
  const ofpFlight = ofpData?.fetch?.text?.flight?.airline?.flight?.[0] || ofpData?.flight || {}
  const ofpParams = ofpData?.fetch?.params || ofpData?.params || {}
  const ofpRoutes = ofpData?.fetch?.text?.flight?.airline?.flight || []
  const ofpNavlog = ofpData?.fetch?.text?.navlog?.fix || []

  const simbriefPdfUrl = booking?.simbriefPdfUrl || ''

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

            {/* ── SIMBRIEF OFP SECTION ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl overflow-hidden border"
              style={{ background: t.card, borderColor: t.border }}
            >
              <div className="flex items-center gap-2.5 px-6 py-4 border-b" style={{ borderColor: t.border }}>
                <Navigation size={15} style={{ color: '#3b82f6' }} />
                <span className="text-sm font-semibold" style={{ color: t.text }}>SimBrief Flight Plan</span>
                {isStandard && !isUpcoming && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full ml-auto" style={{ background: 'rgba(107,114,128,0.1)', color: '#6b7280' }}>
                    COMPLETED
                  </span>
                )}
              </div>
              <div className="p-6">
                {!isStandard ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: t.input }}>
                    <Info size={16} style={{ color: t.textMuted }} />
                    <div className="text-xs" style={{ color: t.textSub }}>
                      SimBrief OFP is available for standard schedule bookings. Realistic Ops flights have fixed pre-defined schedules.
                    </div>
                  </div>
                ) : !simbriefUsername ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                      <div>
                        <div className="text-sm font-semibold" style={{ color: t.text }}>No SimBrief Account Linked</div>
                        <div className="text-xs mt-0.5" style={{ color: t.textSub }}>Connect your SimBrief account in Settings to generate flight plans.</div>
                      </div>
                    </div>
                    <Link to="/settings" className="px-4 py-2.5 rounded-xl text-xs font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                      Link Account
                    </Link>
                  </div>
                ) : ofpData ? (
                  <div className="space-y-5">
                    {/* Route / Waypoints summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Route</div>
                        <div className="text-xs font-mono mt-1 truncate" style={{ color: t.text }} title={getOFPValue(ofpData, 'route', 'route_string') || ofpGeneral?.route || '—'}>
                          {getOFPValue(ofpData, 'route', 'route_string') || ofpGeneral?.route || '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Cruise Alt</div>
                        <div className="text-xs font-mono mt-1" style={{ color: t.text }}>{ofpParams?.cruise_alt || ofpGeneral?.initial_altitude || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Cost Index</div>
                        <div className="text-xs font-mono mt-1" style={{ color: t.text }}>{ofpParams?.cost_index || ofpGeneral?.cost_index || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Alternate</div>
                        <div className="text-xs font-mono mt-1" style={{ color: t.text }}>{ofpGeneral?.alternate || getOFPValue(ofpData, 'alternate') || '—'}</div>
                      </div>
                    </div>

                    <div className="h-px" style={{ background: t.border }} />

                    {/* Pax / Cargo / Fuel / Payload */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: t.input }}>
                        <Users size={16} style={{ color: '#3b82f6' }} />
                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Passengers</div>
                          <div className="text-sm font-bold" style={{ color: t.text }}>{getOFPValue(ofpData, 'pax', 'passengers') || '—'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: t.input }}>
                        <Fuel size={16} style={{ color: '#f59e0b' }} />
                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Fuel</div>
                          <div className="text-sm font-bold" style={{ color: t.text }}>
                            {getOFPValue(ofpData, 'fuel', 'total_fuel') || ofpGeneral?.total_fuel || '—'} kg
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: t.input }}>
                        <Gauge size={16} style={{ color: '#10b981' }} />
                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Payload</div>
                          <div className="text-sm font-bold" style={{ color: t.text }}>
                            {getOFPValue(ofpData, 'payload', 'payload') || ofpGeneral?.payload || '—'} kg
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: t.input }}>
                        <Wind size={16} style={{ color: '#8b5cf6' }} />
                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>Cargo</div>
                          <div className="text-sm font-bold" style={{ color: t.text }}>
                            {getOFPValue(ofpData, 'cargo', 'cargo') || ofpGeneral?.cargo || '—'} kg
                          </div>
                        </div>
                      </div>
                    </div>

                    {Array.isArray(ofpRoutes) && ofpRoutes.length > 1 && (
                      <>
                        <div className="h-px" style={{ background: t.border }} />
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: t.textMuted }}>Flight Steps (OFP)</div>
                          <div className="max-h-[200px] overflow-y-auto space-y-1">
                            {ofpRoutes.slice(0, 20).map((step: any, i: number) => (
                              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs" style={{ background: t.input }}>
                                <span className="font-mono font-bold" style={{ color: '#c0121e', minWidth: '60px' }}>{step.ident || step.fix || step.waypoint || `Step ${i + 1}`}</span>
                                {step.frequency && <span className="font-mono" style={{ color: t.textSub }}>{step.frequency}</span>}
                                <span className="ml-auto font-mono" style={{ color: t.textSub }}>
                                  {step.altitude || step.alt || ''} {step.route || ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Download & File buttons */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      {simbriefPdfUrl && (
                        <a
                          href={simbriefPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                          style={{ background: '#3b82f6', color: 'white' }}
                        >
                          <Download size={13} /> Download OFP
                        </a>
                      )}
                      <button onClick={handleFileToIVAO}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                        style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' }}>
                        <Globe size={13} /> File to IVAO
                      </button>
                      <button onClick={handleFileToVATSIM}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                        style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                        <Globe size={13} /> File to VATSIM
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Generate OFP button */
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Zap size={16} style={{ color: '#3b82f6' }} />
                      <div>
                        <div className="text-sm font-semibold" style={{ color: t.text }}>Ready to Generate</div>
                        <div className="text-xs mt-0.5" style={{ color: t.textSub }}>Your flight plan will be auto-generated via SimBrief.</div>
                      </div>
                    </div>
                    <button
                      onClick={handleGenerateOFP}
                      disabled={ofpLoading}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white flex-shrink-0 transition-all"
                      style={{
                        background: ofpLoading ? 'rgba(59,130,246,0.5)' : '#3b82f6',
                      }}
                    >
                      {ofpLoading ? <><Loader size={13} className="animate-spin" /> Generating...</> : <><Zap size={13} /> Generate OFP</>}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
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
                    )) : <div className="text-[10px]" style={{ color: t.textMuted }}>Loading...</div>}
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
                    )) : <div className="text-[10px]" style={{ color: t.textMuted }}>Loading...</div>}
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
                <div className="h-px" style={{ background: t.border }} />
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs" style={{ color: t.textMuted }}>SimBrief</span>
                  <span className="text-xs font-bold" style={{ color: simbriefUsername ? '#10b981' : '#ef4444' }}>
                    {simbriefUsername ? 'Connected' : 'Not Linked'}
                  </span>
                </div>
                <div className="h-px" style={{ background: t.border }} />
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs" style={{ color: t.textMuted }}>OFP Status</span>
                  <span className="text-xs font-bold" style={{ color: ofpData ? '#10b981' : t.textMuted }}>
                    {ofpData ? 'Generated' : 'Not Generated'}
                  </span>
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
