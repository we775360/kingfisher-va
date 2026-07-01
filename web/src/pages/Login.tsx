import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Plane, ArrowLeft } from 'lucide-react'
import api from '../lib/axios'
import { useAuthStore } from '../store/auth.store'

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', form)
      setAuth(res.data.user, res.data.token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-8 overflow-hidden bg-slate-50">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&q=80&w=2000"
          alt=""
          className="w-full h-full object-cover opacity-30 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-slate-50/80 to-white/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-slate-50" />
      </div>

      {/* Back to Home */}
      <Link
        to="/"
        className="fixed top-5 left-5 md:top-8 md:left-8 z-20 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all bg-white/70 backdrop-blur-md border border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900 hover:border-slate-300 shadow-sm"
      >
        <ArrowLeft size={14} /> Back to Home
      </Link>

      {/* Decorative plane */}
      <div className="fixed top-12 right-12 z-10 hidden md:block opacity-10">
        <Plane size={120} className="text-slate-300" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Glass Card */}
        <div className="rounded-3xl p-8 md:p-10 backdrop-blur-xl bg-white/70 border border-white/40 shadow-xl shadow-slate-200/50">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-600/20">
              <img src="/logo.png" alt="Kingfisher VA" className="w-10 h-10 object-contain brightness-0 invert" />
            </div>
            <h1 className="text-2xl font-black italic tracking-tight text-slate-900 mb-1">
              Welcome Back
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Sign in to your Kingfisher Virtual account
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-5 px-4 py-3 rounded-xl text-sm font-medium text-red-700 bg-red-50 border border-red-200"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 tracking-wider uppercase">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="john@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm text-slate-900 bg-white/80 border border-slate-200 outline-none transition-all placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 tracking-wider uppercase">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Your password"
                className="w-full px-4 py-3 rounded-xl text-sm text-slate-900 bg-white/80 border border-slate-200 outline-none transition-all placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              style={{
                background: loading ? 'linear-gradient(135deg, #c0121e, #8b0000)' : 'linear-gradient(135deg, #c0121e, #8b0000)',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(192,18,30,0.3)',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-slate-400 text-xs font-medium mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-red-600 hover:text-red-700 font-bold transition-colors">
              Register for free
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-[10px] font-bold tracking-widest uppercase mt-6">
          Kingfisher Virtual Airline &middot; Not a real airline
        </p>
      </motion.div>
    </div>
  )
}
