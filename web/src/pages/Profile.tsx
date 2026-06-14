import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  User, Plane, Clock, TrendingUp,
  Award, BarChart3, Calendar, Hash,
  MapPin, Radio, Wind, DollarSign, Shield
} from 'lucide-react'
import { useThemeStore } from '../store/theme.store'
import { useAuthStore } from '../store/auth.store'
import api from '../lib/axios'

const RANKS = [
  { name: 'Student Pilot', minHours: 0, maxHours: 50 },
  { name: 'PPL', minHours: 50, maxHours: 200 },
  { name: 'CPL', minHours: 200, maxHours: 500 },
  { name: 'ATPL', minHours: 500, maxHours: 99999 },
]

export default function Profile() {
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: t.bg }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: '#c0121e', borderTopColor: 'transparent' }} />
    </div>
  )

  const pilot = pilotData?.pilot
  const initials = `${pilot?.firstName?.[0] || ''}${pilot?.lastName?.[0] || ''}`
  const approvedPireps = pireps.filter(p => p.status === 'APPROVED')
  const avgLanding = approvedPireps.length > 0
    ? approvedPireps.reduce((s, p) => s + Math.abs(p.landingRate), 0) / approvedPireps.length
    : 0

  // Rank progression
  const currentRankIndex = RANKS.findIndex(r => r.name === pilot?.rank) ?? 0
  const currentRank = RANKS[currentRankIndex]
  const nextRank = RANKS[currentRankIndex + 1]
  const hoursInRank = (pilot?.totalHours || 0) - currentRank.minHours
  const hoursNeeded = currentRank.maxHours - currentRank.minHours
  const progressPct = nextRank ? Math.min((hoursInRank / hoursNeeded) * 100, 100) : 100

  return (
    <div className="min-h-screen" style={{ background: t.bg, color: t.text }}>

      {/* Header */}
      <div className="sticky top-0 z-30 px-6 py-4"
        style={{
          background: isDark ? 'rgba(15,15,15,0.92)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${t.border}`,
        }}>
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link to="/dashboard" className="text-sm" style={{ color: t.textSub, textDecoration: 'none' }}>
            ← Dashboard
          </Link>
          <div className="w-px h-4" style={{ background: t.border }} />
          <div className="flex items-center gap-2">
            <User size={16} style={{ color: '#c0121e' }} />
            <span className="font-bold text-base" style={{ color: t.text }}>My Profile</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">

        {/* Profile hero card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>

          {/* Banner */}
          <div className="h-28 relative"
            style={{ background: 'linear-gradient(135deg, #8b0000 0%, #c0121e 50%, #8b0000 100%)' }}>
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
                backgroundSize: '30px 30px'
              }} />
            <div className="absolute top-3 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.3)' }}>
              <Shield size={12} style={{ color: '#d4af37' }} />
              <span className="text-xs font-bold" style={{ color: '#d4af37' }}>
                {pilotData?.role}
              </span>
            </div>
          </div>

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold border-4"
                style={{
                  background: 'linear-gradient(135deg, #c0121e, #8b0000)',
                  color: 'white',
                  borderColor: isDark ? '#141414' : '#ffffff',
                }}>
                {initials}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ background: 'rgba(192,18,30,0.1)', color: '#c0121e', border: '1px solid rgba(192,18,30,0.2)' }}>
                  {pilot?.rank}
                </div>
              </div>
            </div>

            {/* Name + details */}
            <h2 className="text-2xl font-bold mb-1" style={{ color: t.text }}>
              {pilot?.firstName} {pilot?.lastName}
            </h2>
            <div className="flex items-center gap-4 flex-wrap mb-4">
              <div className="flex items-center gap-1.5">
                <Hash size={13} style={{ color: t.textMuted }} />
                <span className="text-sm font-mono" style={{ color: t.textSub }}>{pilot?.pilotId}</span>
              </div>
              {pilot?.callsign && (
                <div className="flex items-center gap-1.5">
                  <Radio size={13} style={{ color: t.textMuted }} />
                  <span className="text-sm" style={{ color: t.textSub }}>{pilot?.callsign}</span>
                </div>
              )}
              {pilot?.hub && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} style={{ color: t.textMuted }} />
                  <span className="text-sm" style={{ color: t.textSub }}>{pilot?.hub}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar size={13} style={{ color: t.textMuted }} />
                <span className="text-sm" style={{ color: t.textSub }}>
                  Joined {new Date(pilot?.joinedAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Rank progression */}
            <div className="p-4 rounded-xl" style={{ background: t.navActive }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold" style={{ color: t.text }}>
                  {pilot?.rank}
                </div>
                {nextRank ? (
                  <div className="text-xs" style={{ color: t.textMuted }}>
                    {(nextRank.minHours - (pilot?.totalHours || 0)).toFixed(1)}h to {nextRank.name}
                  </div>
                ) : (
                  <div className="text-xs" style={{ color: '#d4af37' }}>Max Rank Achieved</div>
                )}
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: t.border }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #8b0000, #c0121e)' }} />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-xs" style={{ color: t.textMuted }}>
                  {pilot?.totalHours?.toFixed(1)}h
                </span>
                {nextRank && (
                  <span className="text-xs" style={{ color: t.textMuted }}>
                    {nextRank.minHours}h
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Flight Hours', value: pilot?.totalHours?.toFixed(1) || '0.0', unit: 'hours', icon: Clock, color: '#c0121e' },
            { label: 'Total Flights', value: pilot?.totalFlights || 0, unit: 'flights', icon: Plane, color: '#3b82f6' },
            { label: 'Avg Landing', value: avgLanding.toFixed(0), unit: 'fpm', icon: Wind, color: '#8b5cf6' },
            { label: 'Wallet', value: `$${pilot?.walletBalance?.toFixed(0) || '0'}`, unit: 'virtual USD', icon: DollarSign, color: '#10b981' },
          ].map((stat, i) => (
            <motion.div key={stat.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
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

        {/* Recent flights on profile */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-2.5">
              <BarChart3 size={15} style={{ color: '#c0121e' }} />
              <span className="text-sm font-semibold" style={{ color: t.text }}>Recent Activity</span>
            </div>
            <Link to="/logbook" className="text-xs font-medium"
              style={{ color: '#c0121e', textDecoration: 'none' }}>
              Full Logbook →
            </Link>
          </div>
          {pireps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14">
              <Plane size={30} style={{ color: t.textMuted, marginBottom: '10px' }} strokeWidth={1.5} />
              <div className="text-sm" style={{ color: t.textSub }}>No flights yet</div>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: t.border }}>
              {pireps.slice(0, 5).map((pirep: any) => {
                const statusColors: any = {
                  APPROVED: '#10b981',
                  PENDING: '#f59e0b',
                  REJECTED: '#ef4444',
                }
                return (
                  <div key={pirep.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(192,18,30,0.1)' }}>
                        <Plane size={15} style={{ color: '#c0121e' }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono" style={{ color: '#c0121e' }}>
                            {pirep.flightNumber}
                          </span>
                          <span className="text-sm font-medium" style={{ color: t.text }}>
                            {pirep.depIcao} → {pirep.arrIcao}
                          </span>
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>
                          {pirep.flightTime?.toFixed(1)}h · {pirep.aircraft?.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold mb-0.5"
                        style={{ color: statusColors[pirep.status] }}>
                        {pirep.status}
                      </div>
                      <div className="text-xs" style={{ color: t.textMuted }}>
                        {new Date(pirep.depTime).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Awards placeholder */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-5"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2.5 mb-4">
            <Award size={15} style={{ color: '#d4af37' }} />
            <span className="text-sm font-semibold" style={{ color: t.text }}>Awards & Badges</span>
          </div>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Award size={28} style={{ color: t.textMuted, margin: '0 auto 8px' }} strokeWidth={1.5} />
              <div className="text-sm" style={{ color: t.textSub }}>No awards yet</div>
              <div className="text-xs mt-1" style={{ color: t.textMuted }}>Fly more to earn badges</div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}