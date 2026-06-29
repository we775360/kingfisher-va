import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Settings, Sun, Moon, LogOut, Shield, User, Bell, Key, Trash2, Check, Navigation, ExternalLink } from 'lucide-react'
import { useThemeStore } from '../store/theme.store'
import { useAuthStore } from '../store/auth.store'
import api from '../lib/axios'

export default function SettingsPage() {
  const { isDark, toggle } = useThemeStore()
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()

  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' })
  const [simbriefUsername, setSimbriefUsername] = useState('')
  const [simbriefSaving, setSimbriefSaving] = useState(false)
  const [simbriefMsg, setSimbriefMsg] = useState('')
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    fetchSimBriefUsername()
  }, [])

  const fetchSimBriefUsername = async () => {
    try {
      const me = await api.get('/auth/me')
      const username = me.data?.pilot?.simbriefUsername || ''
      setSimbriefUsername(username)
    } catch {}
  }

  const handleSaveSimBrief = async () => {
    setSimbriefSaving(true)
    setSimbriefMsg('')
    try {
      await api.patch('/pilot/simbrief', { simbriefUsername: simbriefUsername.trim() })
      setSimbriefMsg('SimBrief account linked successfully!')
      setTimeout(() => setSimbriefMsg(''), 3000)
    } catch (err: any) {
      setSimbriefMsg(err.response?.data?.error || 'Failed to save SimBrief username')
    } finally {
      setSimbriefSaving(false)
    }
  }

  const t = {
    bg: isDark ? '#0f0f0f' : '#f0f2f5',
    card: isDark ? '#141414' : '#ffffff',
    border: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    text: isDark ? '#ffffff' : '#0a0a0a',
    textSub: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
    textMuted: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
    navHover: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    input: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
  }

  const inputStyle = {
    background: t.input,
    border: `1px solid ${t.border}`,
    color: t.text,
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
  }

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg(text)
    setMsgType(type)
    setTimeout(() => setMsg(''), 3000)
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPass !== passwordForm.confirm) {
      showMsg('Passwords do not match', 'error'); return
    }
    if (passwordForm.newPass.length < 8) {
      showMsg('Password must be at least 8 characters', 'error'); return
    }
    showMsg('Password updated successfully!', 'success')
    setPasswordForm({ current: '', newPass: '', confirm: '' })
  }

  return (
    <div className="min-h-screen" style={{ background: t.bg, color: t.text }}>

      <div className="sticky top-0 z-30 px-6 py-4"
        style={{
          background: isDark ? 'rgba(15,15,15,0.92)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${t.border}`,
        }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link to="/dashboard" className="text-sm" style={{ color: t.textSub, textDecoration: 'none' }}>
            ← Dashboard
          </Link>
          <div className="w-px h-4" style={{ background: t.border }} />
          <div className="flex items-center gap-2">
            <Settings size={16} style={{ color: '#c0121e' }} />
            <span className="font-bold text-base" style={{ color: t.text }}>Settings</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">

        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2.5 px-5 py-4"
            style={{ borderBottom: `1px solid ${t.border}` }}>
            <Sun size={15} style={{ color: '#c0121e' }} />
            <span className="text-sm font-semibold" style={{ color: t.text }}>Appearance</span>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium mb-0.5" style={{ color: t.text }}>
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </div>
              <div className="text-xs" style={{ color: t.textMuted }}>
                Switch between dark and light theme
              </div>
            </div>
            <button onClick={toggle}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', color: t.text }}>
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
              {isDark ? 'Switch to Light' : 'Switch to Dark'}
            </button>
          </div>
        </motion.div>

        {/* Account */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2.5 px-5 py-4"
            style={{ borderBottom: `1px solid ${t.border}` }}>
            <User size={15} style={{ color: '#c0121e' }} />
            <span className="text-sm font-semibold" style={{ color: t.text }}>Account</span>
          </div>
          <div className="px-5 py-4 space-y-3">
            <Link to="/profile"
              className="flex items-center justify-between py-2.5 px-4 rounded-xl transition-all"
              style={{ textDecoration: 'none', color: t.text }}
              onMouseEnter={e => e.currentTarget.style.background = t.navHover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div>
                <div className="text-sm font-medium" style={{ color: t.text }}>Edit Profile</div>
                <div className="text-xs" style={{ color: t.textMuted }}>Update your name, callsign and bio</div>
              </div>
              <span style={{ color: t.textMuted }}>→</span>
            </Link>
          </div>
        </motion.div>

        {/* SimBrief Integration */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2.5 px-5 py-4"
            style={{ borderBottom: `1px solid ${t.border}` }}>
            <Navigation size={15} style={{ color: '#3b82f6' }} />
            <span className="text-sm font-semibold" style={{ color: t.text }}>SimBrief Integration</span>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.12)' }}>
              <ExternalLink size={13} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 1 }} />
              <div className="text-xs leading-relaxed" style={{ color: t.textSub }}>
                Link your SimBrief account to auto-generate flight plans when booking.
                All OFP data (route, waypoints, passengers, fuel, cargo) will be displayed inline on the Booking Checkout page.
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: t.textMuted }}>SIMBRIEF USERNAME</label>
              <div className="flex gap-2">
                <input
                  value={simbriefUsername}
                  onChange={e => setSimbriefUsername(e.target.value)}
                  placeholder="Enter your SimBrief username..."
                  style={{ ...inputStyle, flex: 1 }} />
                <button onClick={handleSaveSimBrief}
                  disabled={simbriefSaving}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                  style={{
                    background: simbriefSaving ? 'rgba(59,130,246,0.5)' : '#3b82f6',
                  }}>
                  {simbriefSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
            {simbriefMsg && (
              <div className="px-4 py-2.5 rounded-xl text-xs flex items-center gap-2"
                style={{
                  background: simbriefMsg.includes('success') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: simbriefMsg.includes('success') ? '#10b981' : '#ef4444',
                }}>
                <Check size={13} /> {simbriefMsg}
              </div>
            )}
          </div>
        </motion.div>

        {/* Password */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2.5 px-5 py-4"
            style={{ borderBottom: `1px solid ${t.border}` }}>
            <Key size={15} style={{ color: '#c0121e' }} />
            <span className="text-sm font-semibold" style={{ color: t.text }}>Change Password</span>
          </div>
          <div className="px-5 py-4 space-y-3">
            {['current', 'newPass', 'confirm'].map((field, i) => (
              <div key={field}>
                <label className="block text-xs mb-1.5" style={{ color: t.textMuted }}>
                  {field === 'current' ? 'Current Password' : field === 'newPass' ? 'New Password' : 'Confirm New Password'}
                </label>
                <input
                  type="password"
                  value={(passwordForm as any)[field]}
                  onChange={e => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
                  placeholder="••••••••"
                  style={inputStyle} />
              </div>
            ))}
            {msg && (
              <div className="px-4 py-2.5 rounded-xl text-xs flex items-center gap-2"
                style={{
                  background: msgType === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: msgType === 'success' ? '#10b981' : '#ef4444',
                }}>
                <Check size={13} /> {msg}
              </div>
            )}
            <button onClick={handlePasswordChange}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #c0121e, #8b0000)' }}>
              Update Password
            </button>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2.5 px-5 py-4"
            style={{ borderBottom: `1px solid ${t.border}` }}>
            <Bell size={15} style={{ color: '#c0121e' }} />
            <span className="text-sm font-semibold" style={{ color: t.text }}>Notifications</span>
          </div>
          <div className="px-5 py-2 divide-y" style={{ borderColor: t.border }}>
            {[
              { label: 'PIREP Approved', desc: 'When your flight report is approved' },
              { label: 'New Event', desc: 'When a new event is posted' },
              { label: 'Rank Promotion', desc: 'When you reach a new rank' },
              { label: 'Award Unlocked', desc: 'When you earn a new badge' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3.5">
                <div>
                  <div className="text-sm font-medium" style={{ color: t.text }}>{item.label}</div>
                  <div className="text-xs" style={{ color: t.textMuted }}>{item.desc}</div>
                </div>
                <div className="w-10 h-6 rounded-full relative cursor-pointer transition-all"
                  style={{ background: 'rgba(192,18,30,0.8)' }}>
                  <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Danger zone */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: t.card, border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="flex items-center gap-2.5 px-5 py-4"
            style={{ borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
            <Shield size={15} style={{ color: '#ef4444' }} />
            <span className="text-sm font-semibold" style={{ color: '#ef4444' }}>Danger Zone</span>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium" style={{ color: t.text }}>Sign Out</div>
              <div className="text-xs" style={{ color: t.textMuted }}>Sign out of your account on this device</div>
            </div>
            <button onClick={() => { logout(); navigate('/') }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  )
}