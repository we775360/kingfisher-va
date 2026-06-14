import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Calendar, Plane, Users, Clock,
  DollarSign, Radio, Check, X,
  MapPin, Info
} from 'lucide-react'
import { useThemeStore } from '../store/theme.store'
import { useAuthStore } from '../store/auth.store'
import api from '../lib/axios'

export default function Events() {
  const { isDark } = useThemeStore()
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const [events, setEvents] = useState<any[]>([])
  const [pilotData, setPilotData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState<string | null>(null)

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
      const [e, p] = await Promise.all([
        api.get('/events'),
        api.get('/auth/me'),
      ])
      setEvents(e.data)
      setPilotData(p.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const isJoined = (event: any) => {
    return event.attendees?.some((a: any) => a.pilotId === pilotData?.pilot?.id)
  }

  const isFull = (event: any) => event.attendees?.length >= event.slots

  const handleJoin = async (eventId: string) => {
    setJoining(eventId)
    try {
      await api.post(`/events/${eventId}/join`)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to join')
    } finally { setJoining(null) }
  }

  const handleLeave = async (eventId: string) => {
    setJoining(eventId)
    try {
      await api.delete(`/events/${eventId}/leave`)
      fetchData()
    } catch (err) { console.error(err) }
    finally { setJoining(null) }
  }

  const upcoming = events.filter(e => new Date(e.date) > new Date())
  const past = events.filter(e => new Date(e.date) <= new Date())

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
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm" style={{ color: t.textSub, textDecoration: 'none' }}>
              ← Dashboard
            </Link>
            <div className="w-px h-4" style={{ background: t.border }} />
            <div className="flex items-center gap-2">
              <Calendar size={16} style={{ color: '#c0121e' }} />
              <span className="font-bold text-base" style={{ color: t.text }}>Events</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(192,18,30,0.1)', border: '1px solid rgba(192,18,30,0.2)' }}>
            <Calendar size={13} style={{ color: '#c0121e' }} />
            <span className="text-xs font-bold" style={{ color: '#c0121e' }}>
              {upcoming.length} Upcoming
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">

        {/* Upcoming events */}
        <div>
          <div className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: t.textMuted }}>
            Upcoming Events
          </div>
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
              style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <Calendar size={36} style={{ color: t.textMuted, marginBottom: '12px' }} strokeWidth={1.5} />
              <div className="text-sm font-medium mb-1" style={{ color: t.textSub }}>No upcoming events</div>
              <div className="text-xs" style={{ color: t.textMuted }}>Check back soon — events are posted regularly</div>
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map((event, i) => {
                const joined = isJoined(event)
                const full = isFull(event)
                const fillPct = (event.attendees?.length / event.slots) * 100
                return (
                  <motion.div key={event.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: t.card, border: `1px solid ${joined ? 'rgba(192,18,30,0.3)' : t.border}` }}>

                    {/* Event header */}
                    <div className="px-6 py-4 flex items-start justify-between gap-4"
                      style={{ borderBottom: `1px solid ${t.border}` }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="text-base font-bold" style={{ color: t.text }}>{event.title}</h3>
                          {joined && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                              ✓ Registered
                            </span>
                          )}
                          {full && !joined && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                              Full
                            </span>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: t.textSub }}>{event.description}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-sm font-bold" style={{ color: '#c0121e' }}>
                          {new Date(event.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>
                          {new Date(event.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} local
                        </div>
                      </div>
                    </div>

                    {/* Event details */}
                    <div className="px-6 py-4">
                      <div className="flex items-center gap-6 flex-wrap mb-4">
                        <div className="flex items-center gap-2">
                          <Plane size={14} style={{ color: t.textMuted }} />
                          <span className="text-sm font-semibold" style={{ color: t.text }}>
                            {event.depIcao} → {event.arrIcao}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Radio size={14} style={{ color: t.textMuted }} />
                          <span className="text-sm" style={{ color: t.textSub }}>{event.network}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign size={14} style={{ color: '#10b981' }} />
                          <span className="text-sm font-semibold" style={{ color: '#10b981' }}>
                            +${event.earnings} bonus
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={14} style={{ color: t.textMuted }} />
                          <span className="text-sm" style={{ color: t.textSub }}>
                            {event.attendees?.length}/{event.slots} pilots
                          </span>
                        </div>
                      </div>

                      {/* Slot progress */}
                      <div className="mb-4">
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: t.border }}>
                          <div className="h-full rounded-full transition-all"
                            style={{
                              width: `${fillPct}%`,
                              background: fillPct > 80 ? '#ef4444' : fillPct > 50 ? '#f59e0b' : '#10b981'
                            }} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs" style={{ color: t.textMuted }}>
                            {event.attendees?.length} registered
                          </span>
                          <span className="text-xs" style={{ color: t.textMuted }}>
                            {event.slots - event.attendees?.length} slots left
                          </span>
                        </div>
                      </div>

                      {/* Join/Leave button */}
                      <div className="flex items-center gap-3">
                        {joined ? (
                          <button
                            onClick={() => handleLeave(event.id)}
                            disabled={joining === event.id}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <X size={14} />
                            {joining === event.id ? 'Leaving...' : 'Leave Event'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoin(event.id)}
                            disabled={joining === event.id || full}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                            style={{
                              background: full ? 'rgba(107,114,128,0.3)' : 'linear-gradient(135deg, #c0121e, #8b0000)',
                              boxShadow: full ? 'none' : '0 0 15px rgba(192,18,30,0.3)',
                            }}>
                            <Check size={14} />
                            {joining === event.id ? 'Joining...' : full ? 'Event Full' : 'Join Event'}
                          </button>
                        )}
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: t.textMuted }}>
                          <Info size={12} />
                          Bonus earnings credited after PIREP approval
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Past events */}
        {past.length > 0 && (
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: t.textMuted }}>
              Past Events
            </div>
            <div className="space-y-3">
              {past.map((event, i) => (
                <motion.div key={event.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between px-5 py-4 rounded-2xl"
                  style={{ background: t.card, border: `1px solid ${t.border}`, opacity: 0.6 }}>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: t.text }}>{event.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: t.textSub }}>
                      {event.depIcao} → {event.arrIcao} · {event.attendees?.length} attended
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: t.textMuted }}>
                    {new Date(event.date).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}