import { useEffect, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Calendar, Plane, Users, Clock,
  DollarSign, Radio, Check, X,
  MapPin, Info, ArrowLeft, Zap, Shield,
  Trophy, Navigation, ArrowRight
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

  const t = useMemo(() => ({
    bg: isDark ? 'bg-[#050505]' : 'bg-[#f0f2f5]',
    card: isDark ? 'bg-[#0c0c0c] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-sm',
    header: isDark ? 'bg-[#050505]/80' : 'bg-white/80',
    border: isDark ? 'border-white/5' : 'border-slate-200',
    text: isDark ? 'text-white' : 'text-slate-900',
    textMuted: isDark ? 'text-zinc-500' : 'text-slate-400',
    accent: 'text-red-600',
  }), [isDark])

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return }
    fetchData()
  }, [isAuthenticated])

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
    <div className={`h-screen flex items-center justify-center ${t.bg}`}>
       <div className="w-12 h-12 border-4 border-[#c0121e] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} font-sans transition-colors duration-500 overflow-x-hidden`}>
      
      <header className={`h-24 sticky top-0 z-50 backdrop-blur-xl border-b ${t.header} ${t.border} flex items-center px-4 sm:px-6 lg:px-8`}>
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <button onClick={() => navigate('/dashboard')} className={`p-3 rounded-2xl border ${t.border} ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'} transition-all duration-200 shrink-0`}>
              <ArrowLeft size={20} className="text-[#c0121e]" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase leading-none truncate">Flight Events</h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-[#c0121e] animate-pulse shrink-0" />
                <span className={`text-[10px] font-black uppercase tracking-widest ${t.textMuted}`}>Network Operations</span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4 px-6 py-3 rounded-2xl border ${isDark ? 'bg-white/5' : 'bg-slate-50'} ${t.border} shrink-0">
            <Calendar size={16} className="text-[#c0121e]" />
            <span className="text-sm font-black tracking-widest uppercase whitespace-nowrap">{upcoming.length} Upcoming Events</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        
        <section className="mb-16 sm:mb-20">
          <div className="relative h-[250px] sm:h-[350px] rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl group">
             <img 
               src="https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&q=80&w=2000" 
               className="w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-105"
               alt="Event Hero"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
             <div className="absolute bottom-6 sm:bottom-12 left-4 sm:left-12 right-4 sm:right-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6 sm:gap-8">
               <div>
                 <div className="text-[#c0121e] font-black uppercase tracking-[0.4em] text-[10px] mb-4">Elite Operations</div>
                 <h2 className="text-3xl sm:text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white break-words">GROUP <br /> <span className="text-[#c0121e]">FLIGHTS.</span></h2>
               </div>
               <div className="p-6 sm:p-8 glass-dark rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 hidden lg:block">
                 <div className="flex items-center gap-4 mb-4">
                   <Shield className="text-[#c0121e]" size={24} />
                   <h4 className="text-sm font-black uppercase tracking-widest text-white">Pilot Requirements</h4>
                 </div>
                 <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
                   Active flight status &middot; Valid FSACARS setup &middot; <br /> Professional conduct on VATSIM/IVAO
                 </p>
               </div>
             </div>
          </div>
        </section>

        <section className="space-y-8 sm:space-y-10">
          <div className="flex items-center justify-between">
             <h3 className="text-sm font-black uppercase tracking-[0.5em] text-[#c0121e]">Active Schedules</h3>
             <div className="w-px h-10 bg-current opacity-10" />
          </div>

          {upcoming.length === 0 ? (
            <div className={`py-16 sm:py-24 text-center rounded-[2rem] sm:rounded-[3rem] border-2 border-dashed ${t.border} ${isDark ? 'bg-white/2' : 'bg-white'}`}>
               <Calendar size={48} className="text-zinc-700 mx-auto mb-6" />
               <h4 className={`text-xl font-black italic uppercase ${t.textMuted}`}>Airspace Clear</h4>
               <p className={`text-xs font-bold ${t.textMuted} uppercase tracking-widest mt-2`}>New events are scheduled weekly by dispatch</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {upcoming.map((event) => {
                const joined = isJoined(event)
                const full = isFull(event)
                const fillPct = (event.attendees?.length / event.slots) * 100
                return (
                  <div
                    key={event.id}
                    className={`${t.card} rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 flex flex-col justify-between gap-8 sm:gap-10 transition-all duration-200 hover:scale-[1.02] hover:border-[#c0121e]/30`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-4 flex-wrap">
                             <div className="px-3 py-1 bg-[#c0121e] text-white text-[8px] font-black uppercase tracking-widest rounded-full italic">Operational</div>
                             <div className={`px-3 py-1 ${isDark ? 'bg-white/5' : 'bg-slate-100'} text-[8px] font-black uppercase tracking-widest rounded-full`}>{event.network}</div>
                          </div>
                          <h4 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase mb-4 break-words">{event.title}</h4>
                          <p className={`text-sm font-bold ${t.textMuted} leading-relaxed uppercase tracking-wide`}>{event.description}</p>
                       </div>
                       <div className="text-left sm:text-right flex-shrink-0">
                          <div className="text-2xl font-black italic tracking-tighter text-[#c0121e] leading-none">
                             {new Date(event.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                          </div>
                          <div className={`text-[10px] font-black ${t.textMuted} uppercase tracking-widest mt-2`}>
                             {new Date(event.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} Z
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 py-6 sm:py-8 border-y border-current/5">
                       <div className="min-w-0">
                          <span className={`text-[8px] font-black ${t.textMuted} uppercase tracking-widest mb-1 block`}>Route</span>
                          <span className="text-xs font-black uppercase italic truncate block">{event.depIcao} &rarr; {event.arrIcao}</span>
                       </div>
                       <div className="min-w-0">
                          <span className={`text-[8px] font-black ${t.textMuted} uppercase tracking-widest mb-1 block`}>Network</span>
                          <span className="text-xs font-black uppercase truncate block">{event.network}</span>
                       </div>
                       <div className="min-w-0 text-[#c0121e]">
                          <span className={`text-[8px] font-black uppercase tracking-widest mb-1 block`}>Reward</span>
                          <span className="text-xs font-black uppercase truncate block">+${event.earnings}</span>
                       </div>
                       <div className="min-w-0">
                          <span className={`text-[8px] font-black ${t.textMuted} uppercase tracking-widest mb-1 block`}>Slots</span>
                          <span className="text-xs font-black uppercase truncate block">{event.attendees?.length} / {event.slots}</span>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="w-full h-1.5 bg-current/5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${fillPct}%` }}
                            className="h-full bg-[#c0121e] rounded-full transition-all duration-500"
                          />
                       </div>
                       
                       <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                          <div className="flex items-center gap-2">
                             <Info size={14} className="text-[#c0121e] shrink-0" />
                             <span className={`text-[9px] font-bold ${t.textMuted} uppercase tracking-widest`}>Assigned to current hub duty roster</span>
                          </div>
                          {joined ? (
                             <button 
                               onClick={() => handleLeave(event.id)}
                               disabled={joining === event.id}
                               className="w-full sm:w-auto px-8 sm:px-10 py-4 rounded-2xl border border-[#c0121e]/30 text-[#c0121e] text-[10px] font-black uppercase tracking-widest transition-all duration-200 hover:bg-[#c0121e] hover:text-white"
                             >
                               {joining === event.id ? 'Processing...' : 'Abort'}
                             </button>
                          ) : (
                             <button 
                               onClick={() => handleJoin(event.id)}
                               disabled={joining === event.id || full}
                               className={`w-full sm:w-auto px-8 sm:px-10 py-4 rounded-2xl ${full ? 'bg-zinc-800' : 'bg-[#c0121e]'} text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#c0121e]/20 transition-all duration-200 hover:scale-[1.02]`}
                             >
                               {joining === event.id ? 'Syncing...' : full ? 'Squadron Full' : 'Secure Slot'}
                             </button>
                          )}
                       </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {past.length > 0 && (
          <section className="mt-24 sm:mt-32 space-y-8 sm:space-y-10">
             <div className="flex items-center justify-between">
                <h3 className={`text-sm font-black uppercase tracking-[0.5em] ${t.textMuted}`}>Historical Logs</h3>
                <div className="w-px h-10 bg-current opacity-10" />
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {past.map((event) => (
                  <div key={event.id} className={`${t.card} p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] opacity-50 grayscale transition-all duration-200 hover:opacity-100 hover:grayscale-0`}>
                     <h5 className="font-black italic text-lg uppercase mb-2 break-words">{event.title}</h5>
                     <div className="flex justify-between items-center text-[10px] font-black text-[#c0121e] uppercase tracking-widest">
                        <span>{event.depIcao} &rarr; {event.arrIcao}</span>
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                     </div>
                  </div>
                ))}
             </div>
          </section>
        )}

      </main>

      <footer className={`py-12 border-t ${t.border} text-center ${t.textMuted} text-[10px] font-black uppercase tracking-[0.4em] px-4`}>
        &copy; 2026 Kingfisher VA &middot; Squad Ops Division
      </footer>
    </div>
  )
}
