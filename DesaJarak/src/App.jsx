import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  authenticateWithGoogle,
  clearStoredAuthSession,
  getAuthSession,
  getStoredAuthSession,
  login,
  logout,
  register,
} from './utils/api.js'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import UserApp from './user/App.jsx'
import AdminDashboard from './AdminDashboard.jsx'

export default function App() {
  const navigate = useNavigate()
  const [screen, setScreen] = useState('login')
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const stored = getStoredAuthSession()
    if (!stored?.token) {
      setAuthLoading(false)
      return
    }
    getAuthSession()
      .then((user) => {
        setSession({ ...user, token: stored.token })
        setScreen(user.role === 'admin' ? 'admin' : 'user')
      })
      .catch(() => {
        clearStoredAuthSession()
        setSession(null)
      })
      .finally(() => setAuthLoading(false))
  }, [])

  const startSession = (result) => {
    setSession(result)
    setScreen(result.role === 'admin' ? 'admin' : 'user')
  }

  const handleLogin = async (credentials) => {
    const result = await login(credentials)
    startSession(result)
    return result
  }

  const handleRegister = async (credentials) => {
    const result = await register(credentials)
    startSession(result)
    return result
  }

  const handleGoogleAuth = useCallback(async (credential) => {
    const result = await authenticateWithGoogle(credential)
    startSession(result)
    return result
  }, [])

  const handleGuest = () => {
    clearStoredAuthSession()
    const userId = globalThis.crypto?.randomUUID?.() || `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setSession({ role: 'guest', name: 'Tamu', userId })
    setScreen('user')
  }

  const handleLogout = async () => {
    try { await logout() } catch { /* local logout still works if the server is offline */ }
    clearStoredAuthSession()
    setSession(null)
    setScreen('login')
    navigate('/')
  }

  if (authLoading) {
    return <div className="min-h-dvh flex items-center justify-center text-sm text-gray-500">Memeriksa sesi akun...</div>
  }

  if (screen === 'register') {
    return <RegisterPage onRegister={handleRegister} onGoLogin={() => setScreen('login')} onGoogleAuth={handleGoogleAuth} />
  }

  if (screen === 'user' && session) {
    return <UserApp session={session} onLogout={handleLogout} />
  }

  if (screen === 'admin' && session?.role === 'admin') {
    return <AdminDashboard adminName={session.name} onLogout={handleLogout} />
  }

  return (
    <LoginPage
      onLogin={handleLogin}
      onGuest={handleGuest}
      onGoRegister={() => setScreen('register')}
      onGoogleAuth={handleGoogleAuth}
    />
  )
}
