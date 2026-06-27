import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import {
  Radio, Eye, EyeOff, ArrowRight,
  Shield, AlertTriangle, Headphones
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
      <div className="min-h-screen flex" style={{ background: t.bg, color: t.text }}>
        {/* Left — Visual Panel */}
        <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0a0a0a, #1a0000)' }}>
          <div className="absolute inset-0">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-red-600/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-600/5 blur-[100px] rounded-full" />
          </div>
          <div className="relative z-10 text-center px-16">
            <div className="w-20 h-20 rounded-[28px] flex items-center justify-center mx-auto mb-8"
              style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
              <Radio size={36} style={{ color: 'white' }} />
            </div>
            <h1 className="text-5xl font-black italic tracking-tighter text-white mb-6 uppercase">
              ATC <span className="text-red-600">LOGIN</span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-md mx-auto font-medium">
              Access the ATC Staff Dashboard. Manage positions, log flights, and oversee realistic operations.
            </p>
            <div className="flex items-center justify-center gap-8 mt-12">
              {[
                { label: 'DEL', desc: 'Clearance' },
                { label: 'GND', desc: 'Ground' },
                { label: 'TWR', desc: 'Tower' },
                { label: 'APR', desc: 'Approach' },
                { label: 'CTR', desc: 'Control' },
              ].map(p => (
                <div key={p.label} className="text-center">
                  <div className="text-white font-black text-xl">{p.label}</div>
                  <div className="text-zinc-600 text-xs font-bold uppercase tracking-widest">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md">
            
            {/* Logo & Back */}
            <div className="flex items-center gap-4 mb-12">
              <Link to="/"
                className="p-2.5 rounded-xl transition-colors"
                style={{ background: t.input, color: t.textSub }}>
                <ArrowRight size={18} className="rotate-180" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Radio size={16} style={{ color: '#c0121e' }} />
                  <span className="font-bold text-lg" style={{ color: t.text }}>ATC Staff Login</span>
                </div>
                <div className="text-xs" style={{ color: t.textMuted }}>Kingfisher VA — Air Traffic Control</div>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-widest"
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
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-widest"
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
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: t.textMuted }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                  <AlertTriangle size={16} />
                  {error}
                </motion.div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-bold text-white transition-all"
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
              <div className="flex items-center justify-between pt-4">
                <Link to="/"
                  className="text-xs font-medium transition-colors"
                  style={{ color: t.textSub }}>
                  ← Back to Home
                </Link>
                <div className="flex items-center gap-2 text-xs" style={{ color: t.textMuted }}>
                  <Shield size={12} />
                  Authorized Staff Only
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  )
}
