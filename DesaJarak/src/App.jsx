import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from './utils/api.js'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import UserApp from './user/App.jsx'
import AdminDashboard from './AdminDashboard.jsx'

export default function App() {
  const navigate = useNavigate()
  const [screen, setScreen] = useState('login') // 'login' | 'register' | 'admin' | 'user'
  const [session, setSession] = useState(null) // { role: 'admin' | 'user' | 'guest', name }

  const handleLogin = async (credentials) => {
    const result = await login(credentials)
    setSession({ role: result.role, name: result.name })
    setScreen(result.role === 'admin' ? 'admin' : 'user')
    return result
  }

  const handleRegister = async (credentials) => {
    const result = await register(credentials)
    setSession({ role: 'user', name: result.name })
    setScreen('user')
    return result
  }

  const handleGuest = () => {
    setSession({ role: 'guest', name: 'Tamu' })
    setScreen('user')
  }

  const handleGoogleClick = () => {
    // Placeholder only — real Google OAuth will be wired up on the backend later.
    window.alert('Login/Registrasi dengan Google belum aktif. Fitur ini akan tersambung setelah integrasi backend selesai.')
  }

  const handleLogout = () => {
    setSession(null)
    setScreen('login')
    navigate('/') // reset citizen app's internal route so a fresh login starts at Home
  }

  if (screen === 'register') {
    return <RegisterPage onRegister={handleRegister} onGoLogin={() => setScreen('login')} onGoogleClick={handleGoogleClick} />
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
      onGoogleClick={handleGoogleClick}
    />
  )
}
