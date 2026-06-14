import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Radio, ExternalLink, Check, Info,
  Globe, Shield, Users, Headphones
} from 'lucide-react'
import { useThemeStore } from '../store/theme.store'

export default function ATCVSO() {
  const { isDark } = useThemeStore()

  const t = {
    bg: isDark ? '#0f0f0f' : '#f0f2f5',
    card: isDark ? '#141414' : '#ffffff',
    border: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    text: isDark ? '#ffffff' : '#0a0a0a',
    textSub: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
    textMuted: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
    navActive: isDark ? 'rgba(192,18,30,0.15)' : 'rgba(192,18,30,0.08)',
  }

  return (
    <div className="min-h-screen" style={{ background: t.bg, color: t.text }}>

      {/* Header */}
      <div className="sticky top-0 z-30 px-6 py-4"
        style={{
          background: isDark ? 'rgba(15,15,15,0.92)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${t.border}`,
        }}>
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/dashboard" className="text-sm" style={{ color: t.textSub, textDecoration: 'none' }}>
            ← Dashboard
          </Link>
          <div className="w-px h-4" style={{ background: t.border }} />
          <div className="flex items-center gap-2">
            <Radio size={16} style={{ color: '#c0121e' }} />
            <span className="font-bold text-base" style={{ color: t.text }}>VATSIM & IVAO</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

        {/* Intro */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(192,18,30,0.1)' }}>
              <Radio size={22} style={{ color: '#c0121e' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold mb-2" style={{ color: t.text }}>Online ATC Networks</h2>
              <p className="text-sm leading-relaxed" style={{ color: t.textSub }}>
                Kingfisher Virtual Airlines fully supports flying on both VATSIM and IVAO — the two largest
                online ATC networks for flight simulation. Flying online earns you the same hours and salary
                as offline, with the added immersion of real ATC communication.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Networks */}
        <div className="grid md:grid-cols-2 gap-5">

          {/* VATSIM */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: t.card, border: `1px solid ${t.border}` }}>
            <div className="p-5" style={{ borderBottom: `1px solid ${t.border}`, background: 'rgba(59,130,246,0.05)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(59,130,246,0.15)' }}>
                    <Globe size={18} style={{ color: '#3b82f6' }} />
                  </div>
                  <div>
                    <div className="font-bold text-base" style={{ color: t.text }}>VATSIM</div>
                    <div className="text-xs" style={{ color: t.textMuted }}>vatsim.net</div>
                  </div>
                </div>
                <a href="https://vatsim.net" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', textDecoration: 'none' }}>
                  Visit <ExternalLink size={11} />
                </a>
              </div>
              <p className="text-sm" style={{ color: t.textSub }}>
                The largest online flying network with 100,000+ members. Offers real-time ATC coverage across the globe.
              </p>
            </div>
            <div className="p-5 space-y-3">
              <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: t.textMuted }}>
                How to Connect
              </div>
              {[
                'Create a free account at vatsim.net',
                'Download a pilot client — vPilot (MSFS/P3D) or X-Pilot (X-Plane)',
                'Connect using your VATSIM CID and password',
                'Select KFR as your airline when filing flight plan',
                'Log your flight in KFR VA as normal — select VATSIM as network',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(59,130,246,0.1)' }}>
                    <span style={{ color: '#3b82f6', fontSize: '10px', fontWeight: 'bold' }}>{i + 1}</span>
                  </div>
                  <span className="text-sm" style={{ color: t.textSub }}>{step}</span>
                </div>
              ))}
              <div className="mt-4 flex flex-wrap gap-2">
                {['vPilot', 'X-Pilot', 'Swift'].map(client => (
                  <span key={client} className="px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                    {client}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* IVAO */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: t.card, border: `1px solid ${t.border}` }}>
            <div className="p-5" style={{ borderBottom: `1px solid ${t.border}`, background: 'rgba(139,92,246,0.05)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(139,92,246,0.15)' }}>
                    <Radio size={18} style={{ color: '#8b5cf6' }} />
                  </div>
                  <div>
                    <div className="font-bold text-base" style={{ color: t.text }}>IVAO</div>
                    <div className="text-xs" style={{ color: t.textMuted }}>ivao.aero</div>
                  </div>
                </div>
                <a href="https://ivao.aero" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', textDecoration: 'none' }}>
                  Visit <ExternalLink size={11} />
                </a>
              </div>
              <p className="text-sm" style={{ color: t.textSub }}>
                Strong coverage in Europe, South America and Asia. Known for excellent ATC training and events.
              </p>
            </div>
            <div className="p-5 space-y-3">
              <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: t.textMuted }}>
                How to Connect
              </div>
              {[
                'Register for free at ivao.aero',
                'Download Altitude (the official IVAO pilot client)',
                'Connect with your IVAO VID and password',
                'File flight plan with KFR callsign prefix',
                'Select IVAO as network when logging in KFR VA',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(139,92,246,0.1)' }}>
                    <span style={{ color: '#8b5cf6', fontSize: '10px', fontWeight: 'bold' }}>{i + 1}</span>
                  </div>
                  <span className="text-sm" style={{ color: t.textSub }}>{step}</span>
                </div>
              ))}
              <div className="mt-4 flex flex-wrap gap-2">
                {['Altitude', 'IvAc', 'IvAp'].map(client => (
                  <span key={client} className="px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                    {client}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* KFR Policy */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl p-5"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2.5 mb-4">
            <Shield size={15} style={{ color: '#c0121e' }} />
            <span className="text-sm font-semibold" style={{ color: t.text }}>Kingfisher VA Online Policy</span>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { icon: Check, text: 'VATSIM and IVAO flights earn the same $500/hr salary', color: '#10b981' },
              { icon: Check, text: 'Use KFR callsign prefix (e.g. KFR101) when filing plans', color: '#10b981' },
              { icon: Check, text: 'Follow all VATSIM/IVAO codes of conduct at all times', color: '#10b981' },
              { icon: Check, text: 'Report your network in your PIREP for accurate logging', color: '#10b981' },
              { icon: Info, text: 'Offline flights are equally valid — network is your choice', color: '#3b82f6' },
              { icon: Info, text: 'ATC event participation may earn bonus event rewards', color: '#3b82f6' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl"
                style={{ background: `${item.color}08` }}>
                <item.icon size={14} style={{ color: item.color, flexShrink: 0, marginTop: '1px' }} />
                <span className="text-sm" style={{ color: t.textSub }}>{item.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Useful links */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-5"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2.5 mb-4">
            <Headphones size={15} style={{ color: '#c0121e' }} />
            <span className="text-sm font-semibold" style={{ color: t.text }}>Useful Resources</span>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {[
              { label: 'VATSIM Website', href: 'https://vatsim.net', color: '#3b82f6' },
              { label: 'IVAO Website', href: 'https://ivao.aero', color: '#8b5cf6' },
              { label: 'vPilot Download', href: 'https://vpilot.rosscarlson.dev', color: '#3b82f6' },
              { label: 'X-Pilot for X-Plane', href: 'https://www.x-pilot.com', color: '#10b981' },
              { label: 'IVAO Altitude Client', href: 'https://ivao.aero/softdev/altitude', color: '#8b5cf6' },
              { label: 'SimAware Live Map', href: 'https://simaware.ca', color: '#c0121e' },
            ].map((link, i) => (
              <a key={i} href={link.href} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 rounded-xl transition-all hover:scale-[1.02]"
                style={{ background: `${link.color}08`, border: `1px solid ${link.color}20`, textDecoration: 'none' }}>
                <span className="text-sm font-medium" style={{ color: t.text }}>{link.label}</span>
                <ExternalLink size={13} style={{ color: link.color }} />
              </a>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}