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
    <div className={`min-h-screen overflow-x-hidden ${t.bg} ${t.text} font-sans transition-colors duration-500`}>
      <nav className={`fixed top-0 w-full z-50 py-6 bg-transparent backdrop-blur-xl border-b ${t.border}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.png" className="w-10 h-10 shrink-0" alt="Logo" />
            <span className="font-black italic text-xl tracking-tighter uppercase leading-none truncate">Kingfisher</span>
          </div>
          <button 
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl border ${t.border} text-xs font-black uppercase tracking-widest transition-all duration-200 hover:bg-[#c0121e] hover:text-white`}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </nav>

      <main className="pt-32 pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 sm:mb-20">
          <div className="w-16 h-16 bg-[#c0121e]/10 rounded-2xl flex items-center justify-center text-[#c0121e] mx-auto mb-6">
            <Shield size={32} />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black italic tracking-tighter uppercase mb-6">Privacy <span className="text-[#c0121e]">Policy.</span></h1>
          <p className={`${t.muted} text-lg font-medium`}>Last Updated: June 2026 &bull; Version 1.0.0</p>
        </div>

        <div className="space-y-8 sm:space-y-12">
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
          ].map((sec) => (
            <div
              key={sec.title}
              className={`p-6 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[3rem] border ${t.card} transition-all duration-200 hover:scale-[1.02]`}
            >
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
                <div className={`w-12 h-12 shrink-0 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-100'} flex items-center justify-center text-[#c0121e]`}>
                  <sec.icon size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-black italic tracking-tight uppercase mb-4 break-words">{sec.title}</h3>
                  <p className={`${t.muted} leading-relaxed font-medium text-base sm:text-lg`}>{sec.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 sm:mt-20 p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] bg-[#c0121e] text-white text-center shadow-2xl shadow-[#c0121e]/20">
           <h4 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase mb-4">Have Questions?</h4>
           <p className="text-red-100 font-medium mb-8">Our support team is available on Discord to clarify any privacy concerns.</p>
           <a href="https://discord.gg/XxSyQJH327" className="inline-block px-8 sm:px-10 py-5 bg-white text-[#c0121e] rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-200 hover:scale-[1.05]">Contact Ops</a>
        </div>
      </main>

      <footer className={`py-12 border-t ${t.border} text-center ${t.muted} text-[10px] font-black uppercase tracking-widest px-4`}>
        &copy; 2026 Kingfisher Virtual Airline &middot; Not a real airline
      </footer>
    </div>
  )
}
