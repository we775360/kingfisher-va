import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import logoImg from '../assets/logo.png'

export function LoginScreen() {
  const { login, loading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white">
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-sm w-full space-y-8 px-8">
          <div className="text-center space-y-4">
            <img src={logoImg} alt="KFR" className="w-20 mx-auto" />
            <h1 className="text-xl font-black italic tracking-tight">ACARS LOGIN</h1>
            <p className="text-xs text-neutral-500 font-medium">Kingfisher Operations Control v2</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500 ml-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-kf-red transition-colors"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500 ml-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-kf-red transition-colors"
                required
              />
            </div>

            {error && (
              <p className="text-xs text-kf-red bg-kf-red/10 border border-kf-red/20 rounded-lg px-4 py-2.5 font-medium">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-kf-red hover:bg-red-700 text-white font-black italic py-3.5 rounded-xl transition-all text-sm tracking-wider disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
