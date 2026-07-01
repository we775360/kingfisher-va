import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Radio, Eye, EyeOff, ArrowRight,
  Shield, AlertTriangle, Headphones, Mail,
  ExternalLink, MessageCircle, X, Info
} from 'lucide-react'
import { useThemeStore } from '../store/theme.store'
import { useATCStore } from '../store/atc.store'
import api from '../lib/axios'

export default function ATCLogin() {
  const { isDark } = useThemeStore()
  const { setAuth } = useATCStore()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRecruitModal, setShowRecruitModal] = useState(false)

  const t = {
    bg: isDark ? '#0f0f0f' : '#f0f2f5',
    card: isDark ? '#141414' : '#ffffff',
    border: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    text: isDark ? '#ffffff' : '#0a0a0a',
    textSub: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
    textMuted: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
    input: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    navHover: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
  }

  const inputStyle = {
    background: t.input,
    border: `1px solid ${t.border}`,
    color: t.text,
    borderRadius: '12px',
    padding: '14px 16px',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s',
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/atc/login', { email, password })
      setAuth(res.data.user, res.data.token)
      navigate('/atc/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>ATC Staff Login — Kingfisher VA</title>
      </Helmet>
      <div className="min-h-screen flex flex-col lg:flex-row overflow-x-hidden" style={{ background: t.bg, color: t.text }}>
        {/* Left — Visual Panel */}
        <div className="hidden lg:flex w-full lg:w-1/2 relative items-center justify-center overflow-hidden p-8"
          style={{ background: 'linear-gradient(135deg, #0a0a0a, #1a0000)' }}>
          <div className="absolute inset-0">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-red-600/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-600/5 blur-[100px] rounded-full" />
          </div>
          <div className="relative z-10 text-center px-4 sm:px-8 lg:px-16 max-w-full">
            <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-[28px] flex items-center justify-center mx-auto mb-6 sm:mb-8"
              style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
              <Radio size={36} style={{ color: 'white' }} />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black italic tracking-tighter text-white mb-4 sm:mb-6 uppercase break-words">
              ATC <span className="text-red-600">LOGIN</span>
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base lg:text-lg leading-relaxed max-w-md mx-auto font-medium px-2">
              Access the ATC Staff Dashboard. Manage positions, log flights, and oversee realistic operations.
            </p>
            <div className="flex items-center justify-center gap-4 sm:gap-6 lg:gap-8 mt-8 sm:mt-10 lg:mt-12 flex-wrap">
              {[
                { label: 'DEL', desc: 'Clearance' },
                { label: 'GND', desc: 'Ground' },
                { label: 'TWR', desc: 'Tower' },
                { label: 'APR', desc: 'Approach' },
                { label: 'CTR', desc: 'Control' },
              ].map(p => (
                <div key={p.label} className="text-center">
                  <div className="text-white font-black text-base sm:text-xl">{p.label}</div>
                  <div className="text-zinc-600 text-[10px] sm:text-xs font-bold uppercase tracking-widest">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md">
            
            {/* Logo & Back */}
            <div className="flex items-center gap-4 mb-6 sm:mb-8">
              <Link to="/"
                className="p-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                style={{ background: t.input, color: t.textSub }}>
                <ArrowRight size={18} className="rotate-180" />
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Radio size={16} style={{ color: '#c0121e' }} />
                  <span className="font-bold text-base sm:text-lg truncate" style={{ color: t.text }}>ATC Staff Login</span>
                </div>
                <div className="text-xs truncate" style={{ color: t.textMuted }}>Kingfisher VA — Air Traffic Control</div>
              </div>
            </div>

            {/* Recruitment Banner */}
            <div
              className="p-4 rounded-xl mb-6 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg"
              style={{
                background: isDark ? 'rgba(192,18,30,0.08)' : 'rgba(192,18,30,0.04)',
                border: `1px solid ${isDark ? 'rgba(192,18,30,0.2)' : 'rgba(192,18,30,0.1)'}`,
              }}
              onClick={() => setShowRecruitModal(true)}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(192,18,30,0.1)' }}>
                  <Headphones size={16} style={{ color: '#c0121e' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate" style={{ color: t.text }}>
                    Want to Join ATC Staff?
                  </div>
                  <div className="text-xs mt-0.5 truncate" style={{ color: t.textSub }}>
                    Contact us to get your ATC credentials.
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold" style={{ color: '#c0121e' }}>
                    Learn More <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-widest truncate"
                  style={{ color: t.textMuted }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="controller@kfrva.com"
                  style={inputStyle}
                  autoFocus
                  className="transition-all duration-200"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-widest truncate"
                  style={{ color: t.textMuted }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    placeholder="Enter your password"
                    style={inputStyle}
                    className="transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-200"
                    style={{ color: t.textMuted }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                  <AlertTriangle size={16} />
                  <span className="truncate">{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: loading ? 'rgba(192,18,30,0.5)' : 'linear-gradient(135deg, #c0121e, #8b0000)',
                  boxShadow: loading ? 'none' : '0 0 30px rgba(192,18,30,0.25)',
                }}>
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <Headphones size={18} />
                    Access ATC Dashboard
                  </>
                )}
              </button>

              {/* Footer links */}
              <div className="flex items-center justify-between pt-4 gap-2">
                <Link to="/"
                  className="text-xs font-medium transition-all duration-200 hover:scale-[1.02]"
                  style={{ color: t.textSub }}>
                  ← Back to Home
                </Link>
                <div className="flex items-center gap-2 text-xs flex-shrink-0" style={{ color: t.textMuted }}>
                  <Shield size={12} />
                  <span className="truncate">Authorized Staff Only</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ── ATC RECRUITMENT MODAL ── */}
      {showRecruitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowRecruitModal(false) }}>
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden transition-all duration-200"
            style={{ background: isDark ? '#141414' : '#ffffff', border: `1px solid ${t.border}` }}>
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4"
              style={{ borderBottom: `1px solid ${t.border}` }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
                  <Headphones size={16} style={{ color: 'white' }} />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate" style={{ color: t.text }}>Join ATC Staff</div>
                  <div className="text-xs truncate" style={{ color: t.textMuted }}>Kingfisher VA — Air Traffic Control</div>
                </div>
              </div>
              <button onClick={() => setShowRecruitModal(false)}
                className="p-2 rounded-xl transition-all duration-200 hover:scale-[1.02] flex-shrink-0" style={{ color: t.textMuted }}>
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-6 space-y-6">
              <div className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <Info size={16} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 2 }} />
                <div className="text-xs leading-relaxed break-words" style={{ color: t.textSub }}>
                  ATC staff accounts are created by administrators. If you're interested in joining the
                  Kingfisher VA Air Traffic Control team, reach out to us and we'll set you up.
                </div>
              </div>

              {/* Contact options */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 rounded-xl transition-all duration-200"
                  style={{ background: t.input, border: `1px solid ${t.border}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(192,18,30,0.1)' }}>
                    <Mail size={18} style={{ color: '#c0121e' }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: t.text }}>Email Us</div>
                    <a href="mailto:kingfishervirtualairline@gmail.com"
                      className="text-xs transition-all duration-200 truncate block"
                      style={{ color: '#c0121e' }}>
                      kingfishervirtualairline@gmail.com
                    </a>
                  </div>
                </div>

                <a href="https://discord.gg/XxSyQJH327" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl transition-all duration-200 hover:scale-[1.01] hover:shadow-lg"
                  style={{ background: 'rgba(88,101,242,0.1)', border: '1px solid rgba(88,101,242,0.2)', textDecoration: 'none' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(88,101,242,0.15)' }}>
                    <MessageCircle size={18} style={{ color: '#5865F2' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: '#5865F2' }}>Join our Discord</div>
                    <div className="text-xs truncate" style={{ color: t.textSub }}>Contact support and the team</div>
                  </div>
                  <ExternalLink size={16} style={{ color: '#5865F2' }} className="flex-shrink-0" />
                </a>
              </div>

              <button onClick={() => setShowRecruitModal(false)}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02]"
                style={{ background: t.input, border: `1px solid ${t.border}`, color: t.textSub }}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
