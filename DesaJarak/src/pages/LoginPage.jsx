import { useState } from 'react'

export default function LoginPage({ onLogin, onGuest, onGoRegister, onGoogleClick }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Username dan password wajib diisi.')
      return
    }
    try {
      const result = await onLogin({ username: username.trim(), password })
      if (!result?.success) setError(result?.message || 'Username atau password salah.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div className="min-h-screen min-h-dvh w-full bg-[#e6faf0] md:bg-gradient-to-br md:from-emerald-50 md:via-[#e6faf0] md:to-teal-50 flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-lg">
            <i className="fa-solid fa-building-columns"></i>
          </div>
          <h1 className="text-xl font-extrabold text-emerald-900 mt-3">E-Aspirasi Desa</h1>
          <p className="text-xs text-gray-500">Masuk untuk mengelola atau memantau aspirasi warga.</p>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-xl border border-emerald-100 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500"
                placeholder="Masukkan username"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pr-10 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {error && (
              <p className="text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-[11px] font-medium">
                {error}
              </p>
            )}

            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-md transition active:scale-95">
              Masuk
            </button>
          </form>

          <button
            onClick={onGuest}
            className="w-full border border-emerald-300 text-emerald-700 font-semibold py-2.5 rounded-xl text-xs hover:bg-emerald-50 transition active:scale-95"
          >
            Lanjutkan sebagai Tamu
          </button>

          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span className="flex-1 h-px bg-gray-200"></span>
            atau
            <span className="flex-1 h-px bg-gray-200"></span>
          </div>

          <button
            onClick={onGoogleClick}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-xs hover:bg-gray-50 transition active:scale-95"
          >
            <i className="fa-brands fa-google text-rose-500"></i> Masuk dengan Google
          </button>

          <p className="text-center text-[11px] text-gray-500 pt-1">
            Belum punya akun?{' '}
            <button onClick={onGoRegister} className="text-emerald-600 font-bold hover:underline">
              Daftar sebagai Warga
            </button>
          </p>
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-4">
          Akun Admin dikelola langsung oleh sistem dan tidak dapat didaftarkan di sini.
        </p>
      </div>
    </div>
  )
}
