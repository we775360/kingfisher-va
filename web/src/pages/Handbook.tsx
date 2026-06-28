import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Plane, Navigation, Zap, ArrowLeft, Info, CheckCircle2 } from 'lucide-react'
import { useThemeStore } from '../store/theme.store'

export default function Handbook() {
  const navigate = useNavigate()
  const { isDark } = useThemeStore()

  const t = {
    bg: isDark ? 'bg-[#050505]' : 'bg-slate-50',
    text: isDark ? 'text-white' : 'text-slate-900',
    muted: isDark ? 'text-zinc-400' : 'text-slate-500',
    card: isDark ? 'bg-white/5 border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-sm',
    border: isDark ? 'border-white/5' : 'border-slate-200'
  }

  const sections = [
    {
      title: "Pilot Admission",
      icon: Plane,
      content: "All pilots must undergo an initial application process. Upon acceptance, you will be assigned the rank of Trainee. Promotion is based on logged flight hours and point accumulation through successful flights."
    },
    {
      title: "Flight Operations",
      icon: Navigation,
      content: "Flights must be booked via the 'Duty Roster'. All operations must be recorded using the FSACARS client. Manual PIREPs are allowed only in cases of technical failure and must include screenshots of the flight summary."
    },
    {
      title: "FSACARS Usage",
      icon: Zap,
      content: "FSACARS must be active from engine start to engine shutdown. Telemetry is monitored live. Disconnections exceeding 15 minutes may result in an automatic flight rejection."
    },
    {
      title: "Community Conduct",
      icon: Info,
      content: "Professionalism is expected at all times. This includes interactions on Discord and while flying on VATSIM/IVAO using Kingfisher callsigns. Harassment or toxicity will result in immediate termination."
    }
  ]

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} font-sans transition-colors duration-500`}>
      <nav className={`fixed top-0 w-full z-50 py-6 bg-transparent backdrop-blur-xl border-b ${t.border}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.png" className="w-10 h-10" alt="Logo" />
            <span className="font-black italic text-xl tracking-tighter uppercase leading-none">Kingfisher</span>
          </div>
          <button onClick={() => navigate(-1)} className={`flex items-center gap-2 px-6 py-2 rounded-xl border ${t.border} text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all`}>
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </nav>

      <main className="pt-32 pb-24 max-w-5xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-24">
          <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-6">
            <BookOpen size={32} />
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase mb-6">Pilot <span className="text-red-600">Handbook.</span></h1>
          <p className={`${t.muted} text-lg font-medium max-w-2xl mx-auto`}>Official operating procedures and code of conduct for all Kingfisher Virtual Airline aviators.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {sections.map((sec, i) => (
            <motion.div 
              key={sec.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`p-10 rounded-[3rem] border ${t.card} hover:border-red-600/20 transition-all group`}
            >
              <div className={`w-14 h-14 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-100'} flex items-center justify-center text-red-600 mb-8 group-hover:scale-110 transition-transform`}>
                <sec.icon size={28} />
              </div>
              <h3 className="text-2xl font-black italic tracking-tight uppercase mb-6">{sec.title}</h3>
              <p className={`${t.muted} leading-relaxed font-medium`}>{sec.content}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 grid lg:grid-cols-3 gap-8">
            {[
                "80% Flight Approval Rate",
                "Active Discord Presence",
                "Simulator Realism > 50%"
            ].map((req, i) => (
                <div key={i} className={`p-6 rounded-2xl border ${t.border} flex items-center gap-4 ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                    <CheckCircle2 size={20} className="text-green-500" />
                    <span className="text-xs font-black uppercase tracking-widest">{req}</span>
                </div>
            ))}
        </div>
      </main>

      <footer className={`py-12 border-t ${t.border} text-center ${t.muted} text-[10px] font-black uppercase tracking-widest`}>
        © 2026 Kingfisher Virtual Airline · Operations Core v1.1.0
      </footer>
    </div>
  )
}
