import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Trophy, Star, Lock, Plane, Clock,
  TrendingUp, Award, CheckCircle, Shield
} from 'lucide-react'
import { useThemeStore } from '../store/theme.store'
import { useAuthStore } from '../store/auth.store'
import api from '../lib/axios'

const ALL_AWARDS = [
  { id: 'first_flight', icon: '✈', name: 'First Flight', desc: 'Complete your very first flight', color: '#c0121e', req: 1, type: 'flights' },
  { id: 'flights_10', icon: '🛫', name: 'Frequent Flyer', desc: 'Complete 10 approved flights', color: '#3b82f6', req: 10, type: 'flights' },
  { id: 'flights_50', icon: '🌏', name: 'Globetrotter', desc: 'Complete 50 approved flights', color: '#8b5cf6', req: 50, type: 'flights' },
  { id: 'flights_100', icon: '👑', name: 'Century Club', desc: 'Complete 100 approved flights', color: '#d4af37', req: 100, type: 'flights' },
  { id: 'hours_10', icon: '⏱', name: '10 Hour Club', desc: 'Log 10 total flight hours', color: '#10b981', req: 10, type: 'hours' },
  { id: 'hours_50', icon: '🕐', name: '50 Hour Pilot', desc: 'Log 50 total flight hours', color: '#3b82f6', req: 50, type: 'hours' },
  { id: 'hours_200', icon: '🏅', name: 'PPL Ready', desc: 'Log 200 total flight hours', color: '#d4af37', req: 200, type: 'hours' },
  { id: 'hours_500', icon: '🎖', name: 'ATPL Ready', desc: 'Log 500 total flight hours', color: '#c0121e', req: 500, type: 'hours' },
  { id: 'smooth_lander', icon: '🛬', name: 'Smooth Lander', desc: 'Land with under 100fpm 5 times', color: '#10b981', req: 5, type: 'smooth' },
  { id: 'wallet_1000', icon: '💰', name: 'First $1,000', desc: 'Earn $1,000 in virtual salary', color: '#d4af37', req: 1000, type: 'wallet' },
  { id: 'wallet_10000', icon: '💎', name: 'High Earner', desc: 'Earn $10,000 in virtual salary', color: '#8b5cf6', req: 10000, type: 'wallet' },
  { id: 'vatsim', icon: '📡', name: 'ATC Connected', desc: 'Complete a flight on VATSIM or IVAO', color: '#3b82f6', req: 1, type: 'network' },
]

export default function Awards() {
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

  const checkUnlocked = (award: any) => {
    const pilot = pilotData?.pilot
    const approved = pireps.filter(p => p.status === 'APPROVED')
    const smoothLandings = approved.filter(p => Math.abs(p.landingRate) < 100).length
    const onNetwork = approved.filter(p => p.network === 'VATSIM' || p.network === 'IVAO').length

    switch (award.type) {
      case 'flights': return approved.length >= award.req
      case 'hours': return (pilot?.totalHours || 0) >= award.req
      case 'smooth': return smoothLandings >= award.req
      case 'wallet': return (pilot?.walletBalance || 0) >= award.req
      case 'network': return onNetwork >= award.req
      default: return false
    }
  }

  const getProgress = (award: any) => {
    const pilot = pilotData?.pilot
    const approved = pireps.filter(p => p.status === 'APPROVED')
    const smoothLandings = approved.filter(p => Math.abs(p.landingRate) < 100).length
    const onNetwork = approved.filter(p => p.network === 'VATSIM' || p.network === 'IVAO').length

    let current = 0
    switch (award.type) {
      case 'flights': current = approved.length; break
      case 'hours': current = pilot?.totalHours || 0; break
      case 'smooth': current = smoothLandings; break
      case 'wallet': current = pilot?.walletBalance || 0; break
      case 'network': current = onNetwork; break
    }
    return Math.min((current / award.req) * 100, 100)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: t.bg }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: '#c0121e', borderTopColor: 'transparent' }} />
    </div>
  )

  const unlocked = ALL_AWARDS.filter(a => checkUnlocked(a))
  const locked = ALL_AWARDS.filter(a => !checkUnlocked(a))

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, color: t.text }}>
      <div className="sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-4"
        style={{
          background: isDark ? 'rgba(15,15,15,0.92)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${t.border}`,
        }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/dashboard" className="text-sm shrink-0" style={{ color: t.textSub, textDecoration: 'none' }}>← Dashboard</Link>
            <div className="w-px h-4 shrink-0" style={{ background: t.border }} />
            <div className="flex items-center gap-2 min-w-0">
              <Trophy size={16} className="shrink-0" style={{ color: '#d4af37' }} />
              <span className="font-bold text-base truncate" style={{ color: t.text }}>Awards & Badges</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl shrink-0"
            style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <Trophy size={13} className="shrink-0" style={{ color: '#d4af37' }} />
            <span className="text-xs font-bold whitespace-nowrap" style={{ color: '#d4af37' }}>
              {unlocked.length}/{ALL_AWARDS.length} Unlocked
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        <div
          className="p-5 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold" style={{ color: t.text }}>Overall Progress</div>
            <div className="text-sm font-bold" style={{ color: '#d4af37' }}>
              {unlocked.length}/{ALL_AWARDS.length}
            </div>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: t.border }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${(unlocked.length / ALL_AWARDS.length) * 100}%`, background: 'linear-gradient(90deg, #8b0000, #d4af37)' }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs" style={{ color: t.textMuted }}>{unlocked.length} earned</span>
            <span className="text-xs" style={{ color: t.textMuted }}>{locked.length} remaining</span>
          </div>
        </div>

        {unlocked.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={15} className="shrink-0" style={{ color: '#10b981' }} />
              <span className="text-sm font-semibold" style={{ color: t.text }}>Earned ({unlocked.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {unlocked.map((award) => (
                <div key={award.id}
                  className="p-5 rounded-2xl text-center relative overflow-hidden transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: t.card, border: `1px solid ${award.color}40` }}>
                  <div className="absolute top-2 right-2">
                    <CheckCircle size={14} style={{ color: '#10b981' }} />
                  </div>
                  <div className="text-4xl mb-3">{award.icon}</div>
                  <div className="text-sm font-bold mb-1 truncate" style={{ color: t.text }}>{award.name}</div>
                  <div className="text-xs break-words" style={{ color: t.textSub }}>{award.desc}</div>
                  <div className="mt-3 px-3 py-1 rounded-full text-xs font-semibold inline-block"
                    style={{ background: `${award.color}18`, color: award.color }}>
                    Unlocked
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lock size={15} className="shrink-0" style={{ color: t.textMuted }} />
            <span className="text-sm font-semibold" style={{ color: t.text }}>In Progress ({locked.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {locked.map((award) => {
              const progress = getProgress(award)
              return (
                <div key={award.id}
                  className="p-5 rounded-2xl text-center transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: t.card, border: `1px solid ${t.border}`, opacity: 0.7 }}>
                  <div className="text-4xl mb-3 grayscale opacity-50">{award.icon}</div>
                  <div className="text-sm font-bold mb-1 truncate" style={{ color: t.text }}>{award.name}</div>
                  <div className="text-xs mb-3 break-words" style={{ color: t.textSub }}>{award.desc}</div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden mb-1" style={{ background: t.border }}>
                    <div className="h-full rounded-full transition-all duration-200"
                      style={{ width: `${progress}%`, background: award.color }} />
                  </div>
                  <div className="text-xs" style={{ color: t.textMuted }}>{progress.toFixed(0)}%</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
