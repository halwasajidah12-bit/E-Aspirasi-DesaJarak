import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import UserApp from './user/App.jsx'
import AdminDashboard from './AdminDashboard.jsx'

// Dummy backend — the ONLY admin account. Admin accounts can never be
// created through the register page; they only exist here, seeded by the program.
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin' }

export default function App() {
  const navigate = useNavigate()
  const [screen, setScreen] = useState('login') // 'login' | 'register' | 'admin' | 'user'
  const [session, setSession] = useState(null) // { role: 'admin' | 'user' | 'guest', name }

  // Dummy in-memory "database" of registered citizen (user) accounts.
  // One sample account is pre-seeded so the login flow can be tried immediately:
  // username "warga" / password "warga".
  const [registeredUsers, setRegisteredUsers] = useState([
    { username: 'warga', password: 'warga', fullname: 'Warga Desa' },
  ])

  const handleLogin = ({ username, password }) => {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      setSession({ role: 'admin', name: 'Admin Desa' })
      setScreen('admin')
      return { success: true }
    }

    const found = registeredUsers.find((u) => u.username === username && u.password === password)
    if (found) {
      setSession({ role: 'user', name: found.fullname || found.username })
      setScreen('user')
      return { success: true }
    }

    return { success: false, message: 'Username atau password salah.' }
  }

  const handleRegister = ({ fullname, username, password }) => {
    if (username === ADMIN_CREDENTIALS.username || registeredUsers.some((u) => u.username === username)) {
      return { success: false, message: 'Username sudah digunakan, silakan pilih username lain.' }
    }
    const newUser = { fullname, username, password }
    setRegisteredUsers((prev) => [...prev, newUser])
    setSession({ role: 'user', name: fullname || username })
    setScreen('user')
    return { success: true }
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
