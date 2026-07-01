import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Users, Search, Clock, Plane, TrendingUp, MapPin } from 'lucide-react'
import { useThemeStore } from '../store/theme.store'
import { useAuthStore } from '../store/auth.store'
import api from '../lib/axios'

const RANK_COLORS: any = {
  'Student Pilot': '#6b7280',
  'PPL': '#3b82f6',
  'CPL': '#8b5cf6',
  'ATPL': '#d4af37',
}

export default function Roster() {
  const { isDark } = useThemeStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const [pilots, setPilots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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
    api.get('/roster').then(r => setPilots(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const filtered = pilots.filter(p =>
    `${p.firstName} ${p.lastName} ${p.pilotId} ${p.callsign || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: t.bg }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: '#c0121e', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, color: t.text }}>
      <div className="sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-4"
        style={{
          background: isDark ? 'rgba(15,15,15,0.92)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${t.border}`,
        }}>
        <div className="max-w-5xl mx-auto flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/dashboard" className="text-sm shrink-0" style={{ color: t.textSub, textDecoration: 'none' }}>← Dashboard</Link>
            <div className="w-px h-4 shrink-0" style={{ background: t.border }} />
            <div className="flex items-center gap-2 min-w-0">
              <Users size={16} className="shrink-0" style={{ color: '#c0121e' }} />
              <span className="font-bold text-base truncate" style={{ color: t.text }}>Pilot Roster</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl ml-auto shrink-0"
            style={{ background: t.card, border: `1px solid ${t.border}` }}>
            <Search size={13} className="shrink-0" style={{ color: t.textMuted }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search pilots..."
              className="bg-transparent outline-none text-sm w-24 sm:w-36"
              style={{ color: t.text }} />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Active Pilots', value: pilots.length, icon: Users, color: '#c0121e' },
            { label: 'Total Hours', value: pilots.reduce((s, p) => s + p.totalHours, 0).toFixed(0), icon: Clock, color: '#3b82f6' },
            { label: 'Total Flights', value: pilots.reduce((s, p) => s + p.totalFlights, 0), icon: Plane, color: '#10b981' },
          ].map((stat) => (
            <div key={stat.label}
              className="p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
              style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs" style={{ color: t.textSub }}>{stat.label}</div>
                <stat.icon size={14} className="shrink-0" style={{ color: stat.color }} />
              </div>
              <div className="text-2xl font-bold truncate" style={{ color: t.text }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-sm" style={{ color: t.textSub }}>No pilots found</div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((pilot) => {
              const rankColor = RANK_COLORS[pilot.rank] || '#6b7280'
              const initials = `${pilot.firstName?.[0] || ''}${pilot.lastName?.[0] || ''}`
              return (
                <div key={pilot.id}
                  className="p-5 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: t.card, border: `1px solid ${t.border}` }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(192,18,30,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)', color: 'white' }}>
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate" style={{ color: t.text }}>
                        {pilot.firstName} {pilot.lastName}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono shrink-0" style={{ color: '#c0121e' }}>{pilot.pilotId}</span>
                        {pilot.callsign && (
                          <span className="text-xs truncate" style={{ color: t.textMuted }}>· {pilot.callsign}</span>
                        )}
                      </div>
                    </div>
                    <div className="px-2 py-0.5 rounded-full text-xs font-semibold shrink-0"
                      style={{ background: `${rankColor}18`, color: rankColor }}>
                      {pilot.rank}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-3"
                    style={{ borderTop: `1px solid ${t.border}` }}>
                    <div className="text-center min-w-0">
                      <div className="text-sm font-bold truncate" style={{ color: t.text }}>
                        {pilot.totalHours?.toFixed(0)}h
                      </div>
                      <div className="text-xs" style={{ color: t.textMuted }}>Hours</div>
                    </div>
                    <div className="text-center min-w-0">
                      <div className="text-sm font-bold truncate" style={{ color: t.text }}>{pilot.totalFlights}</div>
                      <div className="text-xs" style={{ color: t.textMuted }}>Flights</div>
                    </div>
                    <div className="text-center min-w-0">
                      <div className="text-sm font-bold truncate" style={{ color: t.text }}>
                        {pilot.hub || '—'}
                      </div>
                      <div className="text-xs" style={{ color: t.textMuted }}>Hub</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
