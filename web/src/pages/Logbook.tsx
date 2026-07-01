import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  BookOpen, Plane, Clock, Navigation,
  Wind, Calendar, Search, Filter,
  TrendingUp, BarChart3, Award
} from 'lucide-react'
import { useThemeStore } from '../store/theme.store'
import { useAuthStore } from '../store/auth.store'
import api from '../lib/axios'

export default function Logbook() {
  const { isDark } = useThemeStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const [pireps, setPireps] = useState<any[]>([])
  const [pilotData, setPilotData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')

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

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [p, pi] = await Promise.all([
        api.get('/auth/me'),
        api.get('/pireps/my'),
      ])
      setPilotData(p.data)
      setPireps(pi.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = pireps.filter(p => {
    const matchSearch = `${p.flightNumber} ${p.depIcao} ${p.arrIcao}`.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'ALL' || p.status === filter
    return matchSearch && matchFilter
  })

  const totalHours = pireps.filter(p => p.status === 'APPROVED').reduce((sum, p) => sum + p.flightTime, 0)
  const avgLanding = pireps.filter(p => p.status === 'APPROVED').length > 0
    ? pireps.filter(p => p.status === 'APPROVED').reduce((sum, p) => sum + Math.abs(p.landingRate), 0) / pireps.filter(p => p.status === 'APPROVED').length
    : 0

  const getLandingColor = (rate: number) => {
    const lr = Math.abs(rate)
    if (lr < 200) return '#10b981'
    if (lr < 400) return '#f59e0b'
    return '#ef4444'
  }

  const getStatusStyle = (status: string) => {
    const map: any = {
      APPROVED: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
      PENDING: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
      REJECTED: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
    }
    return map[status] || map.PENDING
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: t.bg }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: '#c0121e', borderTopColor: 'transparent' }} />
    </div>
  )

  const pilot = pilotData?.pilot

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, color: t.text }}>

      {/* Header */}
      <div className="sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-4"
        style={{
          background: isDark ? 'rgba(15,15,15,0.92)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${t.border}`,
        }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/dashboard" className="text-sm whitespace-nowrap" style={{ color: t.textSub, textDecoration: 'none' }}>
              ← Dashboard
            </Link>
            <div className="w-px h-4" style={{ background: t.border }} />
            <div className="flex items-center gap-2">
              <BookOpen size={16} style={{ color: '#c0121e' }} />
              <span className="font-bold text-base truncate" style={{ color: t.text }}>Logbook</span>
            </div>
          </div>
          <div className="text-xs font-mono whitespace-nowrap flex-shrink-0" style={{ color: t.textMuted }}>
            {pilot?.pilotId} · {pilot?.rank}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Hours', value: totalHours.toFixed(1), unit: 'hrs', icon: Clock, color: '#c0121e' },
            { label: 'Total Flights', value: pireps.filter(p => p.status === 'APPROVED').length, unit: 'approved', icon: Plane, color: '#3b82f6' },
            { label: 'Avg Landing', value: avgLanding.toFixed(0), unit: 'fpm', icon: Wind, color: '#8b5cf6' },
            { label: 'Pending Review', value: pireps.filter(p => p.status === 'PENDING').length, unit: 'PIREPs', icon: TrendingUp, color: '#f59e0b' },
          ].map((stat, i) => (
            <div key={stat.label}
              className="p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
              style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs" style={{ color: t.textSub }}>{stat.label}</div>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${stat.color}18` }}>
                  <stat.icon size={14} style={{ color: stat.color }} />
                </div>
              </div>
              <div className="text-xl font-bold truncate" style={{ color: t.text }}>{stat.value}</div>
              <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>{stat.unit}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl min-w-0"
            style={{ background: t.card, border: `1px solid ${t.border}` }}>
            <Search size={14} style={{ color: t.textMuted }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search flights..."
              className="flex-1 bg-transparent outline-none text-sm min-w-0"
              style={{ color: t.text }} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
                style={{
                  background: filter === f ? t.navActive : 'transparent',
                  color: filter === f ? '#c0121e' : t.textSub,
                  border: `1px solid ${filter === f ? 'rgba(192,18,30,0.2)' : t.border}`,
                }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Logbook table */}
        <div
          className="rounded-2xl overflow-hidden transition-all duration-200"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <BookOpen size={36} style={{ color: t.textMuted, marginBottom: '12px' }} strokeWidth={1.5} />
              <div className="text-sm font-medium mb-1" style={{ color: t.textSub }}>No flights found</div>
              <div className="text-xs mb-4" style={{ color: t.textMuted }}>
                {pireps.length === 0 ? 'File your first PIREP to build your logbook' : 'Try adjusting your filters'}
              </div>
              {pireps.length === 0 && (
                <Link to="/pirep"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-200"
                  style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)', textDecoration: 'none' }}>
                  File a PIREP
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    {['Date', 'Flight', 'Route', 'Aircraft', 'Duration', 'Landing', 'Network', 'Sim', 'Status'].map(h => (
                      <th key={h} className="text-left px-3 sm:px-5 py-3 text-xs font-semibold tracking-wide whitespace-nowrap"
                        style={{ color: t.textMuted }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: t.border }}>
                  {filtered.map((pirep: any, i) => {
                    const s = getStatusStyle(pirep.status)
                    return (
                      <tr key={pirep.id}
                        className="transition-all duration-200"
                        onMouseEnter={e => e.currentTarget.style.background = t.navHover}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td className="px-3 sm:px-5 py-3.5 whitespace-nowrap">
                          <span className="text-xs" style={{ color: t.textSub }}>
                            {new Date(pirep.depTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-3 sm:px-5 py-3.5 whitespace-nowrap">
                          <span className="text-xs font-bold font-mono" style={{ color: '#c0121e' }}>
                            {pirep.flightNumber}
                          </span>
                        </td>
                        <td className="px-3 sm:px-5 py-3.5 whitespace-nowrap">
                          <span className="text-sm font-medium" style={{ color: t.text }}>
                            {pirep.depIcao} → {pirep.arrIcao}
                          </span>
                        </td>
                        <td className="px-3 sm:px-5 py-3.5 whitespace-nowrap">
                          <span className="text-xs" style={{ color: t.textSub }}>
                            {pirep.aircraft?.name}
                          </span>
                        </td>
                        <td className="px-3 sm:px-5 py-3.5 whitespace-nowrap">
                          <span className="text-xs font-semibold" style={{ color: t.text }}>
                            {pirep.flightTime?.toFixed(1)}h
                          </span>
                        </td>
                        <td className="px-3 sm:px-5 py-3.5 whitespace-nowrap">
                          <span className="text-xs font-semibold"
                            style={{ color: getLandingColor(pirep.landingRate) }}>
                            {pirep.landingRate} fpm
                          </span>
                        </td>
                        <td className="px-3 sm:px-5 py-3.5 whitespace-nowrap">
                          <span className="text-xs" style={{ color: t.textSub }}>{pirep.network}</span>
                        </td>
                        <td className="px-3 sm:px-5 py-3.5 whitespace-nowrap">
                          <span className="text-xs" style={{ color: t.textSub }}>{pirep.simulator}</span>
                        </td>
                        <td className="px-3 sm:px-5 py-3.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
                            style={{ background: s.bg, color: s.color }}>
                            {pirep.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="text-center pb-6">
          <span className="text-xs" style={{ color: t.textMuted }}>
            Showing {filtered.length} of {pireps.length} flights · All times in local
          </span>
        </div>
      </div>
    </div>
  )
}
