import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Shield, Lock, Eye, FileText, ArrowLeft, Globe } from 'lucide-react'
import { useThemeStore } from '../store/theme.store'

export default function PrivacyPolicy() {
  const navigate = useNavigate()
  const { isDark } = useThemeStore()

  const t = {
    bg: isDark ? 'bg-[#050505]' : 'bg-slate-50',
    text: isDark ? 'text-white' : 'text-slate-900',
    muted: isDark ? 'text-zinc-400' : 'text-slate-500',
    card: isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm',
    border: isDark ? 'border-white/5' : 'border-slate-200'
  }

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} font-sans transition-colors duration-500`}>
      {/* Header */}
      <nav className={`fixed top-0 w-full z-50 py-6 bg-transparent backdrop-blur-xl border-b ${t.border}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.png" className="w-10 h-10" alt="Logo" />
            <span className="font-black italic text-xl tracking-tighter uppercase leading-none">Kingfisher</span>
          </div>
          <button 
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl border ${t.border} text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all`}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </nav>

      <main className="pt-32 pb-24 max-w-4xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-6">
            <Shield size={32} />
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase mb-6">Privacy <span className="text-red-600">Policy.</span></h1>
          <p className={`${t.muted} text-lg font-medium`}>Last Updated: June 2026 • Version 1.0.0</p>
        </motion.div>

        <div className="space-y-12">
          {[
            {
              title: "Data Collection",
              icon: Eye,
              content: "We collect minimal personal data required for your simulation experience, including your name, email, and IP address for security purposes. No real-world financial information is ever requested."
            },
            {
              title: "Flight Tracking",
              icon: Globe,
              content: "Our flight tracking system (FSACARS) records your flight telemetry, simulator position, and aircraft state. This data is used exclusively to generate your pilot service record and statistics within the Kingfisher network."
            },
            {
              title: "Third-Party Services",
              icon: Lock,
              content: "We use services like Discord for community engagement and FSACARS for flight tracking. Each service has its own privacy policy which we encourage you to review."
            },
            {
              title: "Content Rights",
              icon: FileText,
              content: "Any screenshots or media you upload to our gallery or Discord remain your property, but by sharing them, you grant Kingfisher VA the right to display them on our platforms."
            }
          ].map((sec, i) => (
            <motion.div 
              key={sec.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`p-8 md:p-12 rounded-[3rem] border ${t.card} transition-all`}
            >
              <div className="flex gap-8 items-start">
                <div className={`w-12 h-12 shrink-0 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-100'} flex items-center justify-center text-red-600`}>
                  <sec.icon size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black italic tracking-tight uppercase mb-4">{sec.title}</h3>
                  <p className={`${t.muted} leading-relaxed font-medium text-lg`}>{sec.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 p-12 rounded-[3rem] bg-red-600 text-white text-center shadow-2xl shadow-red-600/20">
           <h4 className="text-3xl font-black italic tracking-tighter uppercase mb-4">Have Questions?</h4>
           <p className="text-red-100 font-medium mb-8">Our support team is available on Discord to clarify any privacy concerns.</p>
           <a href="https://discord.gg/XxSyQJH327" className="inline-block px-10 py-5 bg-white text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">Contact Ops</a>
        </div>
      </main>

      <footer className={`py-12 border-t ${t.border} text-center ${t.muted} text-[10px] font-black uppercase tracking-widest`}>
        © 2026 Kingfisher Virtual Airline · Not a real airline
      </footer>
    </div>
  )
}
