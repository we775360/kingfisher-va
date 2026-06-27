import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Download, Settings, Plane, Monitor, CheckCircle, ArrowLeft,
  FileText, Copy, Check
} from 'lucide-react'
import { useThemeStore } from '../store/theme.store'

export default function FSACARS() {
  const { isDark } = useThemeStore()
  const [copied, setCopied] = useState(false)

  const t = {
    bg: isDark ? '#0f0f0f' : '#f0f2f5',
    card: isDark ? '#141414' : '#ffffff',
    border: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    text: isDark ? '#ffffff' : '#0a0a0a',
    textSub: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
    textMuted: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
    navActive: isDark ? 'rgba(192,18,30,0.15)' : 'rgba(192,18,30,0.08)',
    input: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
  }

  const downloadUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:8000/api/v1/fsacars/download'
    : 'https://kingfisher-api.onrender.com/api/v1/fsacars/download'

  const steps = [
    {
      icon: <Download size={20} />,
      title: 'Download FSACARS',
      desc: 'Download our pre-configured FSACARS client. It comes with Kingfisher VA settings built in — no configuration needed!',
    },
    {
      icon: <Settings size={20} />,
      title: 'Extract & Launch',
      desc: 'Extract the zip to any folder (e.g., C:\\FSACARS). Run fsacars.exe as Administrator.',
    },
    {
      icon: <Monitor size={20} />,
      title: 'Enter Credentials',
      desc: 'Go to the Settings tab. Enter your Kingfisher VA callsign (e.g., KFR0001) and your website password.',
    },
    {
      icon: <CheckCircle size={20} />,
      title: 'Verify & Fly!',
      desc: 'Click "Verify" to confirm your login. Then go to Dispatch, select your booking, hit Start, and fly!',
    },
  ]

  const orgCfgContent = `; Kingfisher Virtual Airlines - FSACARS Configuration
; This file is already pre-configured in your download!

orgname=Kingfisher Virtual Airlines
orgurl=https://kingfisherva.com
orglogo=logo.png
orglicense=none
hashalgo=HTTPS
userquery=https://kingfisher-api.onrender.com/api/v1/fsacars/userquery
pirep=https://kingfisher-api.onrender.com/api/v1/fsacars/pirep
posrep=https://kingfisher-api.onrender.com/api/v1/fsacars/posrep
dispatch=https://kingfisher-api.onrender.com/api/v1/fsacars/dispatch
serverpass=kfva_fsacars_2026`

  const copyOrgCfg = () => {
    navigator.clipboard.writeText(orgCfgContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
          <Link to="/dashboard"
            className="text-sm transition-colors"
            style={{ color: t.textSub, textDecoration: 'none' }}>
            ← Dashboard
          </Link>
          <div className="w-px h-4" style={{ background: t.border }} />
          <div className="flex items-center gap-2">
            <Plane size={16} style={{ color: '#c0121e' }} />
            <span className="font-bold text-base">FSACARS Setup</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
            style={{ background: t.navActive }}>
            <Plane size={32} style={{ color: '#c0121e' }} />
          </div>
          <h1 className="text-3xl font-black italic tracking-tight mb-3">FSACARS Flight Tracking</h1>
          <p className="text-sm max-w-xl mx-auto" style={{ color: t.textSub }}>
            Kingfisher Virtual Airlines uses <strong>FSACARS</strong> for flight tracking
            and PIREP submission. Download the pre-configured client, log in, and fly.
          </p>
        </motion.div>

        {/* Download Button */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-center">
          <a href={downloadUrl}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #c0121e, #8b0000)',
              boxShadow: '0 0 30px rgba(192,18,30,0.3)',
            }}>
            <Download size={20} />
            Download Kingfisher FSACARS Client
          </a>
          <p className="text-xs mt-3" style={{ color: t.textMuted }}>
            Pre-configured v4.2.5 — includes our logo, org.cfg, and airports database
          </p>
        </motion.div>

        {/* Setup Steps */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-lg font-bold mb-5">Quick Start — 4 Steps</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {steps.map((step, i) => (
              <div key={i} className="p-5 rounded-2xl"
                style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: t.navActive }}>
                  <span style={{ color: '#c0121e' }}>{step.icon}</span>
                </div>
                <div className="text-xs font-black tracking-widest mb-1.5"
                  style={{ color: t.textMuted }}>
                  STEP {i + 1}
                </div>
                <h3 className="text-sm font-bold mb-2">{step.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: t.textSub }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* org.cfg reference */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-2.5">
              <FileText size={15} style={{ color: '#c0121e' }} />
              <span className="text-sm font-semibold">
                org.cfg — Already configured in your download
              </span>
            </div>
            <button onClick={copyOrgCfg}
              className="text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-2"
              style={{
                background: t.navActive,
                color: copied ? '#10b981' : '#c0121e',
              }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy for reference'}
            </button>
          </div>
          <div className="p-6">
            <pre className="text-xs leading-relaxed p-4 rounded-xl overflow-x-auto font-mono"
              style={{
                background: isDark ? '#0a0a0a' : '#f5f5f5',
                border: `1px solid ${t.border}`,
                color: isDark ? '#a1a1aa' : '#52525b',
              }}>
              {orgCfgContent}
            </pre>
            <p className="text-xs mt-3" style={{ color: t.textMuted }}>
              This file is already inside your downloaded zip. You don't need to modify anything —<br />
              just extract and run <code style={{ color: '#c0121e' }}>fsacars.exe</code>.
            </p>
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2.5 px-6 py-4"
            style={{ borderBottom: `1px solid ${t.border}` }}>
            <span className="text-sm font-semibold">How It Works</span>
          </div>
          <div className="p-6 space-y-4 text-sm" style={{ color: t.textSub }}>
            <div className="flex gap-3">
              <span className="font-bold text-red-600 shrink-0 w-6">1.</span>
              <span>You <strong>book a flight</strong> on the website (via Flights → Duty Roster).</span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-red-600 shrink-0 w-6">2.</span>
              <span>Open FSACARS, go to the <strong>Dispatch</strong> tab — your booking appears automatically (origin, destination, flight number).</span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-red-600 shrink-0 w-6">3.</span>
              <span>Click <strong>Start</strong> — FSACARS transmits your position every ~10 seconds. Your aircraft appears on the <Link to="/live-map" style={{ color: '#3b82f6' }}>Live Map</Link> in real time.</span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-red-600 shrink-0 w-6">4.</span>
              <span>After landing, click <strong>Stop</strong> — FSACARS submits a full PIREP with fuel used, landing rate, flight time, and distance.</span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-red-600 shrink-0 w-6">5.</span>
              <span>Your PIREP is logged, hours added to your record, and your booking automatically closed.</span>
            </div>
          </div>
        </motion.div>

        {/* Credentials Info */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="flex gap-3 p-5 rounded-2xl"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <Plane size={16} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '1px' }} />
          <div className="text-xs leading-relaxed" style={{ color: '#3b82f6' }}>
            <strong style={{ color: '#60a5fa' }}>Login credentials:</strong> Use your Kingfisher VA
            <strong> callsign</strong> (e.g., KFR0001) as the FSACARS username, and the <strong>same password</strong>
            you use on the website. Click <strong>Verify</strong> in FSACARS Settings to confirm.
          </div>
        </motion.div>

        {/* Important Notes */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2.5 px-6 py-4"
            style={{ borderBottom: `1px solid ${t.border}` }}>
            <span className="text-sm font-semibold">Important Notes</span>
          </div>
          <div className="p-6 space-y-3">
            {[
              'Requires Windows with .NET Framework 4+ (most Windows PCs have this).',
              'Run fsacars.exe as Administrator for proper simulator connectivity.',
              'FSACARS needs FSUIPC7 (MSFS 2020/2024) or XPUIPC (X-Plane) to read sim data.',
              'Position reports are sent every ~10 seconds while tracking.',
              'Your aircraft appears on the Live Map as soon as the first position is received.',
              'After landing, click Stop and your PIREP is submitted automatically.',
              'For support, contact us on Discord.',
            ].map((note, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle size={13} style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
                <span className="text-xs" style={{ color: t.textSub }}>{note}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Back */}
        <div className="text-center pb-8">
          <Link to="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold transition-colors"
            style={{ color: t.textSub }}>
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
