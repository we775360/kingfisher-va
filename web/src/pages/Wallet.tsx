import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  DollarSign, TrendingUp, Clock,
  Plane, ArrowDownLeft, BarChart3
} from 'lucide-react'
import { useThemeStore } from '../store/theme.store'
import { useAuthStore } from '../store/auth.store'
import api from '../lib/axios'

export default function Wallet() {
  const { isDark } = useThemeStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const [walletData, setWalletData] = useState<any>(null)
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
      const res = await api.get('/wallet')
      setWalletData(res.data)
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

  const totalEarned = walletData?.bookings?.reduce((s: number, b: any) => s + b.earnings, 0) || 0

  return (
    <div className="min-h-screen" style={{ background: t.bg, color: t.text }}>

      {/* Header */}
      <div className="sticky top-0 z-30 px-6 py-4"
        style={{
          background: isDark ? 'rgba(15,15,15,0.92)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${t.border}`,
        }}>
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link to="/dashboard" className="text-sm" style={{ color: t.textSub, textDecoration: 'none' }}>
            ← Dashboard
          </Link>
          <div className="w-px h-4" style={{ background: t.border }} />
          <div className="flex items-center gap-2">
            <DollarSign size={16} style={{ color: '#c0121e' }} />
            <span className="font-bold text-base" style={{ color: t.text }}>My Wallet</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">

        {/* Balance card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #8b0000 0%, #c0121e 60%, #8b0000 100%)' }}>
          <div className="p-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
                backgroundSize: '30px 30px'
              }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={16} style={{ color: 'rgba(255,255,255,0.7)' }} />
                <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Virtual Wallet Balance
                </span>
              </div>
              <div className="text-5xl font-bold text-white mb-1">
                ${walletData?.walletBalance?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Virtual USD · Kingfisher VA Economy
              </div>
              <div className="mt-5 pt-5 flex items-center gap-6"
                style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                <div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Total Earned</div>
                  <div className="text-lg font-bold text-white">${totalEarned.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Flight Hours</div>
                  <div className="text-lg font-bold text-white">{walletData?.totalHours?.toFixed(1)}h</div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Pay Rate</div>
                  <div className="text-lg font-bold text-white">$500/hr</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Approved Flights', value: walletData?.bookings?.length || 0, icon: Plane, color: '#3b82f6' },
            { label: 'Avg per Flight', value: `$${walletData?.bookings?.length ? (totalEarned / walletData.bookings.length).toFixed(0) : '0'}`, icon: BarChart3, color: '#8b5cf6' },
            { label: 'Hourly Rate', value: '$500', icon: TrendingUp, color: '#10b981' },
          ].map((stat, i) => (
            <motion.div key={stat.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="p-4 rounded-2xl"
              style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs" style={{ color: t.textSub }}>{stat.label}</div>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${stat.color}18` }}>
                  <stat.icon size={13} style={{ color: stat.color }} />
                </div>
              </div>
              <div className="text-lg font-bold" style={{ color: t.text }}>{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Transaction history */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2.5 px-5 py-4"
            style={{ borderBottom: `1px solid ${t.border}` }}>
            <Clock size={15} style={{ color: '#c0121e' }} />
            <span className="text-sm font-semibold" style={{ color: t.text }}>Earnings History</span>
          </div>

          {!walletData?.bookings?.length ? (
            <div className="flex flex-col items-center justify-center py-14">
              <DollarSign size={30} style={{ color: t.textMuted, marginBottom: '10px' }} strokeWidth={1.5} />
              <div className="text-sm font-medium mb-1" style={{ color: t.textSub }}>No earnings yet</div>
              <div className="text-xs mb-4" style={{ color: t.textMuted }}>
                Complete flights and get them approved to earn virtual dollars
              </div>
              <Link to="/flights"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)', textDecoration: 'none' }}>
                Book a Flight
              </Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: t.border }}>
              {walletData.bookings.map((booking: any, i: number) => (
                <motion.div key={i}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(16,185,129,0.1)' }}>
                      <ArrowDownLeft size={15} style={{ color: '#10b981' }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: t.text }}>
                        {booking.route?.flightNumber} — {booking.route?.depIcao} → {booking.route?.arrIcao}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>
                        {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: '#10b981' }}>
                      +${booking.earnings?.toFixed(2)}
                    </div>
                    <div className="text-xs" style={{ color: t.textMuted }}>Flight pay</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info */}
        <div className="p-4 rounded-xl text-center pb-8"
          style={{ background: t.navActive }}>
          <div className="text-xs" style={{ color: t.textMuted }}>
            Kingfisher VA virtual economy · $500 per flight hour · Earnings credited on PIREP approval
          </div>
        </div>

      </div>
    </div>
  )
}