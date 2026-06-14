import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/axios'
import { useAuthStore } from '../store/auth.store'

export default function Register() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
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
      const res = await api.post('/auth/register', form)
      setAuth(res.data.user, res.data.token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6"
      style={{ background: 'radial-gradient(ellipse at 60% 30%, rgba(192,18,30,0.1) 0%, #0a0a0a 70%)' }}>

      {/* Back to home */}
      <Link to="/" className="fixed top-6 left-8 flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm">
        ← Back to Home
      </Link>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }} className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Kingfisher VA" className="w-16 h-16 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-1">Join Kingfisher Virtual</h1>
          <p className="text-gray-500 text-sm">Begin your journey from Student Pilot to ATPL</p>
        </div>

        {/* Form */}
        <div className="rounded-2xl p-8"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl text-sm text-red-400"
              style={{ background: 'rgba(192,18,30,0.1)', border: '1px solid rgba(192,18,30,0.3)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-2 tracking-wide uppercase">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  placeholder="John"
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(192,18,30,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2 tracking-wide uppercase">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Doe"
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(192,18,30,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-2 tracking-wide uppercase">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="john@example.com"
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(192,18,30,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>


            <div>
              <label className="block text-xs text-gray-500 mb-2 tracking-wide uppercase">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Minimum 8 characters"
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={e => e.target.style.borderColor = 'rgba(192,18,30,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:scale-[1.02] mt-2"
              style={{
                background: loading ? 'rgba(192,18,30,0.5)' : 'linear-gradient(135deg, #c0121e, #8b0000)',
                boxShadow: loading ? 'none' : '0 0 20px rgba(192,18,30,0.3)'
              }}>
              {loading ? 'Creating your account...' : 'Create Account — Free'}
            </button>
          </form>

          <p className="text-center text-gray-600 text-xs mt-6">
            Already have an account?{' '}
            <Link to="/login" className="hover:text-white transition-colors" style={{ color: '#c0121e' }}>
              Sign in here
            </Link>
          </p>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          By registering you agree to our terms of service and community guidelines.
        </p>
      </motion.div>
    </div>
  )
}