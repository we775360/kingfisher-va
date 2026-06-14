import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import api from '../lib/axios'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  const checkRole = async () => {
    try {
      const res = await api.get('/auth/me')
      const role = res.data.role
      if (role === 'ADMIN' || role === 'STAFF') {
        setAuthorized(true)
      } else {
        navigate('/dashboard')
      }
    } catch {
      logout()
      navigate('/login')
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    checkRole()
  }, [checkRole, isAuthenticated, navigate])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 animate-spin mx-auto mb-4"
            style={{ borderColor: '#c0121e', borderTopColor: 'transparent' }} />
          <p className="text-gray-500 text-sm">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!authorized) return null

  return <>{children}</>
}