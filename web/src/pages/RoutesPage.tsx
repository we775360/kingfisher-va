import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Navigation, Search, Plane, Clock, DollarSign, ArrowRight } from 'lucide-react'
import { useThemeStore } from '../store/theme.store'
import { useAuthStore } from '../store/auth.store'
import api from '../lib/axios'

export default function RoutesPage() {
  const { isDark } = useThemeStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const [routes, setRoutes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'distance' | 'duration' | 'earnings'>('distance')

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
    api.get('/routes').then(r => setRoutes(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const filtered = routes
    .filter(r => `${r.flightNumber} ${r.depIcao} ${r.arrIcao} ${r.depName} ${r.arrName}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'distance') return a.distance - b.distance
      if (sortBy === 'duration') return a.duration - b.duration
      return (b.duration / 60 * 500) - (a.duration / 60 * 500)
    })

  const earnings = (route: any) => (route.duration / 60 * 500).toFixed(0)

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
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm" style={{ color: t.textSub, textDecoration: 'none' }}>
              ← Dashboard
            </Link>
            <div className="w-px h-4" style={{ background: t.border }} />
            <div className="flex items-center gap-2">
              <Navigation size={16} style={{ color: '#c0121e' }} />
              <span className="font-bold text-base" style={{ color: t.text }}>Route Network</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <Search size={13} style={{ color: t.textMuted }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search routes..."
                className="bg-transparent outline-none text-sm w-36"
                style={{ color: t.text }} />
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: t.card, border: `1px solid ${t.border}`, color: t.text }}>
              <option value="distance">Sort: Distance</option>
              <option value="duration">Sort: Duration</option>
              <option value="earnings">Sort: Earnings</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Routes', value: routes.length, color: '#c0121e' },
            { label: 'Avg Distance', value: `${routes.length ? (routes.reduce((s, r) => s + r.distance, 0) / routes.length).toFixed(0) : 0} nm`, color: '#3b82f6' },
            { label: 'Max Earnings', value: routes.length ? `$${Math.max(...routes.map(r => Number((r.duration / 60 * 500).toFixed(0)))).toLocaleString()}` : '$0', color: '#10b981' },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="p-4 rounded-2xl text-center"
              style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs" style={{ color: t.textMuted }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Routes */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl"
            style={{ background: t.card, border: `1px solid ${t.border}` }}>
            <Navigation size={36} style={{ color: t.textMuted, marginBottom: '12px' }} strokeWidth={1.5} />
            <div className="text-sm font-medium mb-1" style={{ color: t.textSub }}>
              {routes.length === 0 ? 'No routes added yet' : 'No routes match your search'}
            </div>
            <div className="text-xs" style={{ color: t.textMuted }}>
              {routes.length === 0 ? 'Admin can add routes from the admin panel' : 'Try a different search term'}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: t.card, border: `1px solid ${t.border}` }}>
            <div className="px-5 py-3.5 flex items-center justify-between"
              style={{ borderBottom: `1px solid ${t.border}` }}>
              <span className="text-sm font-semibold" style={{ color: t.text }}>
                {filtered.length} Routes
              </span>
              <Link to="/flights"
                className="text-xs font-semibold px-3 py-1.5 rounded-xl text-white"
                style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)', textDecoration: 'none' }}>
                Book a Flight →
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: t.border }}>
              {filtered.map((route, i) => (
                <motion.div key={route.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="px-5 py-4 flex items-center gap-4"
                  onMouseEnter={e => e.currentTarget.style.background = t.navHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                  {/* Flight number */}
                  <div className="w-16 flex-shrink-0">
                    <span className="text-xs font-bold font-mono" style={{ color: '#c0121e' }}>
                      {route.flightNumber}
                    </span>
                  </div>

                  {/* Route */}
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <div className="text-center flex-shrink-0">
                      <div className="text-lg font-bold" style={{ color: t.text }}>{route.depIcao}</div>
                      <div className="text-xs truncate max-w-20" style={{ color: t.textMuted }}>{route.depName}</div>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1 w-full">
                        <div className="flex-1 h-px" style={{ background: t.border }} />
                        <Plane size={12} style={{ color: '#c0121e' }} />
                        <div className="flex-1 h-px" style={{ background: t.border }} />
                      </div>
                      <span className="text-xs" style={{ color: t.textMuted }}>{route.distance} nm</span>
                    </div>
                    <div className="text-center flex-shrink-0">
                      <div className="text-lg font-bold" style={{ color: t.text }}>{route.arrIcao}</div>
                      <div className="text-xs truncate max-w-20" style={{ color: t.textMuted }}>{route.arrName}</div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} style={{ color: t.textMuted }} />
                      <span className="text-xs" style={{ color: t.textSub }}>
                        {Math.floor(route.duration / 60)}h {route.duration % 60}m
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign size={12} style={{ color: '#10b981' }} />
                      <span className="text-xs font-semibold" style={{ color: '#10b981' }}>
                        ${earnings(route)}
                      </span>
                    </div>
                  </div>

                  <Link to="/flights"
                    className="flex-shrink-0 p-2 rounded-xl transition-colors"
                    style={{ color: t.textMuted, textDecoration: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.background = t.navActive; (e.currentTarget as HTMLElement).style.color = '#c0121e' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = t.textMuted }}>
                    <ArrowRight size={16} />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}