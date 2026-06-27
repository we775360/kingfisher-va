import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useATCStore } from '../store/atc.store'
import api from '../lib/axios'

export default function ATCRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useATCStore()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  const checkATC = async () => {
    try {
      const res = await api.get('/atc/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('kf_atc_token')}` },
      })
      if (res.data) {
        setAuthorized(true)
      } else {
        navigate('/atc/login')
      }
    } catch {
      logout()
      navigate('/atc/login')
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/atc/login')
      return
    }
    checkATC()
  }, [checkATC, isAuthenticated, navigate])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 animate-spin mx-auto mb-4"
            style={{ borderColor: '#c0121e', borderTopColor: 'transparent' }} />
          <p className="text-gray-500 text-sm">Verifying ATC access...</p>
        </div>
      </div>
    )
  }

  if (!authorized) return null

  return <>{children}</>
}
