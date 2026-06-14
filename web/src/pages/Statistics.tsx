import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart3, Plane, Clock, Wind,
  TrendingUp, DollarSign, Navigation, Calendar
} from 'lucide-react'
import { useThemeStore } from '../store/theme.store'
import { useAuthStore } from '../store/auth.store'
import api from '../lib/axios'

export default function Statistics() {
  const { isDark } = useThemeStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const [pilotData, setPilotData] = useState<any>(null)
  const [pireps, setPireps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const t = {
    bg: isDark ? '#0f0f0f' : '#f0f2f5',
    card: isDark ? '#141414' : '#ffffff',
    border: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    text: isDark ? '#ffffff' : '#0a0a0a',
    textSub: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
    textMuted: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
    navActive: isDark ? 'rgba(192,18,30,0.15)' : 'rgba(192,18,30,0.08)',
    navHover: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: t.bg }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: '#c0121e', borderTopColor: 'transparent' }} />
    </div>
  )

  const pilot = pilotData?.pilot
  const approved = pireps.filter(p => p.status === 'APPROVED')
  const avgLanding = approved.length > 0
    ? approved.reduce((s, p) => s + Math.abs(p.landingRate), 0) / approved.length : 0
  const bestLanding = approved.length > 0
    ? Math.min(...approved.map(p => Math.abs(p.landingRate))) : 0
  const avgFlightTime = approved.length > 0
    ? approved.reduce((s, p) => s + p.flightTime, 0) / approved.length : 0
  const totalDistance = approved.reduce((s, p) => s + (p.distance || 0), 0)
  const totalFuel = approved.reduce((s, p) => s + (p.fuelUsed || 0), 0)

  const simBreakdown = approved.reduce((acc: any, p) => {
    acc[p.simulator] = (acc[p.simulator] || 0) + 1
    return acc
  }, {})

  const networkBreakdown = approved.reduce((acc: any, p) => {
    acc[p.network] = (acc[p.network] || 0) + 1
    return acc
  }, {})

  const routeBreakdown = approved.reduce((acc: any, p) => {
    const key = `${p.depIcao}→${p.arrIcao}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const topRoutes = Object.entries(routeBreakdown)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5)

  const getLandingColor = (rate: number) => {
    if (rate < 100) return '#10b981'
    if (rate < 200) return '#10b981'
    if (rate < 400) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="min-h-screen" style={{ background: t.bg, color: t.text }}>
      <div className="sticky top-0 z-30 px-6 py-4"
        style={{
          background: isDark ? 'rgba(15,15,15,0.92)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${t.border}`,
        }}>
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link to="/dashboard" className="text-sm" style={{ color: t.textSub, textDecoration: 'none' }}>← Dashboard</Link>
          <div className="w-px h-4" style={{ background: t.border }} />
          <div className="flex items-center gap-2">
            <BarChart3 size={16} style={{ color: '#c0121e' }} />
            <span className="font-bold text-base" style={{ color: t.text }}>Statistics</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">

        {/* Key stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Hours', value: pilot?.totalHours?.toFixed(1) || '0', unit: 'hrs', icon: Clock, color: '#c0121e' },
            { label: 'Total Flights', value: approved.length, unit: 'approved', icon: Plane, color: '#3b82f6' },
            { label: 'Total Distance', value: totalDistance.toFixed(0), unit: 'nm', icon: Navigation, color: '#8b5cf6' },
            { label: 'Total Earnings', value: `$${pilot?.walletBalance?.toFixed(0) || '0'}`, unit: 'virtual USD', icon: DollarSign, color: '#10b981' },
          ].map((stat, i) => (
            <motion.div key={stat.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="p-4 rounded-2xl"
              style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs" style={{ color: t.textSub }}>{stat.label}</div>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${stat.color}18` }}>
                  <stat.icon size={14} style={{ color: stat.color }} />
                </div>
              </div>
              <div className="text-xl font-bold" style={{ color: t.text }}>{stat.value}</div>
              <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>{stat.unit}</div>
            </motion.div>
          ))}
        </div>

        {/* Landing + flight stats */}
        <div className="grid lg:grid-cols-2 gap-5">

          {/* Landing stats */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: t.card, border: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-2.5 px-5 py-4"
              style={{ borderBottom: `1px solid ${t.border}` }}>
              <Wind size={15} style={{ color: '#c0121e' }} />
              <span className="text-sm font-semibold" style={{ color: t.text }}>Landing Statistics</span>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'Average Landing Rate', value: `${avgLanding.toFixed(0)} fpm`, color: getLandingColor(avgLanding) },
                { label: 'Best Landing', value: `${bestLanding} fpm`, color: '#10b981' },
                { label: 'Average Flight Time', value: `${avgFlightTime.toFixed(1)}h`, color: '#3b82f6' },
                { label: 'Total Fuel Used', value: `${totalFuel.toFixed(0)} kg`, color: '#8b5cf6' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2.5 border-b"
                  style={{ borderColor: t.border }}>
                  <span className="text-sm" style={{ color: t.textSub }}>{item.label}</span>
                  <span className="text-sm font-bold" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top routes */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: t.card, border: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-2.5 px-5 py-4"
              style={{ borderBottom: `1px solid ${t.border}` }}>
              <Navigation size={15} style={{ color: '#c0121e' }} />
              <span className="text-sm font-semibold" style={{ color: t.text }}>Most Flown Routes</span>
            </div>
            <div className="p-5">
              {topRoutes.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm" style={{ color: t.textSub }}>No data yet</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {topRoutes.map(([route, count]: any, i) => (
                    <div key={route} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'rgba(192,18,30,0.1)', color: '#c0121e' }}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold" style={{ color: t.text }}>{route}</span>
                          <span className="text-xs font-bold" style={{ color: '#c0121e' }}>{count}x</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: t.border }}>
                          <div className="h-full rounded-full"
                            style={{ width: `${(count / (topRoutes[0][1] as number)) * 100}%`, background: '#c0121e' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Simulator + network breakdown */}
        <div className="grid lg:grid-cols-2 gap-5">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: t.card, border: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-2.5 px-5 py-4"
              style={{ borderBottom: `1px solid ${t.border}` }}>
              <TrendingUp size={15} style={{ color: '#c0121e' }} />
              <span className="text-sm font-semibold" style={{ color: t.text }}>Simulator Usage</span>
            </div>
            <div className="p-5 space-y-3">
              {Object.entries(simBreakdown).length === 0 ? (
                <div className="text-center py-6 text-sm" style={{ color: t.textSub }}>No data yet</div>
              ) : (
                Object.entries(simBreakdown).map(([sim, count]: any) => (
                  <div key={sim}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm" style={{ color: t.text }}>{sim}</span>
                      <span className="text-xs font-bold" style={{ color: '#c0121e' }}>{count} flights</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: t.border }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${(count / approved.length) * 100}%`, background: 'linear-gradient(90deg, #8b0000, #c0121e)' }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: t.card, border: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-2.5 px-5 py-4"
              style={{ borderBottom: `1px solid ${t.border}` }}>
              <Navigation size={15} style={{ color: '#c0121e' }} />
              <span className="text-sm font-semibold" style={{ color: t.text }}>Network Usage</span>
            </div>
            <div className="p-5 space-y-3">
              {Object.entries(networkBreakdown).length === 0 ? (
                <div className="text-center py-6 text-sm" style={{ color: t.textSub }}>No data yet</div>
              ) : (
                Object.entries(networkBreakdown).map(([net, count]: any) => {
                  const colors: any = { VATSIM: '#3b82f6', IVAO: '#8b5cf6', Offline: '#6b7280' }
                  return (
                    <div key={net}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm" style={{ color: t.text }}>{net}</span>
                        <span className="text-xs font-bold" style={{ color: colors[net] || '#c0121e' }}>{count} flights</span>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: t.border }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${(count / approved.length) * 100}%`, background: colors[net] || '#c0121e' }} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        </div>

        {/* Landing rate history */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2.5 px-5 py-4"
            style={{ borderBottom: `1px solid ${t.border}` }}>
            <Wind size={15} style={{ color: '#c0121e' }} />
            <span className="text-sm font-semibold" style={{ color: t.text }}>Landing Rate History</span>
          </div>
          {approved.length === 0 ? (
            <div className="flex items-center justify-center py-14">
              <div className="text-sm" style={{ color: t.textSub }}>No approved flights yet</div>
            </div>
          ) : (
            <div className="p-5">
              <div className="flex items-end gap-2 h-32">
                {approved.slice(-20).map((p, i) => {
                  const rate = Math.abs(p.landingRate)
                  const height = Math.min((rate / 800) * 100, 100)
                  const color = getLandingColor(rate)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10"
                        style={{ background: t.card, border: `1px solid ${t.border}`, color: t.text }}>
                        {rate} fpm
                      </div>
                      <div className="w-full rounded-t-sm transition-all"
                        style={{ height: `${height}%`, background: color, minHeight: '4px' }} />
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs" style={{ color: t.textMuted }}>Oldest</span>
                <span className="text-xs" style={{ color: t.textMuted }}>Latest</span>
              </div>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  )
}