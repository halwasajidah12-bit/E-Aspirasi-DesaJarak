import { useEffect, useRef, useState } from 'react'
import { getAuthConfig } from '../utils/api.js'

const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client'

const loadGoogleIdentity = () => new Promise((resolve, reject) => {
  if (window.google?.accounts?.id) return resolve(window.google.accounts.id)
  let script = document.querySelector('script[data-google-identity]')
  if (!script) {
    script = document.createElement('script')
    script.src = GOOGLE_SCRIPT
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    document.head.appendChild(script)
  }
  script.addEventListener('load', () => resolve(window.google?.accounts?.id), { once: true })
  script.addEventListener('error', () => reject(new Error('Layanan Google tidak dapat dimuat. Periksa koneksi internet Anda.')), { once: true })
})

export default function GoogleAuthButton({ text = 'signin_with', onCredential, onError }) {
  const containerRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('Memuat tombol Google...')

  useEffect(() => {
    let mounted = true
    const initialize = async () => {
      try {
        const { googleClientId } = await getAuthConfig()
        if (!mounted) return
        if (!googleClientId) {
          setMessage('Login Google belum dikonfigurasi.')
          return
        }
        const identity = await loadGoogleIdentity()
        if (!identity) throw new Error('Layanan Google tidak tersedia.')
        if (!mounted || !containerRef.current) return
        identity.initialize({
          client_id: googleClientId,
          callback: async ({ credential }) => {
            try {
              await onCredential(credential)
            } catch (error) {
              onError?.(error.message || 'Login Google gagal.')
            }
          },
        })
        containerRef.current.replaceChildren()
        identity.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          shape: 'rect',
          width: Math.min(containerRef.current.parentElement?.clientWidth || 350, 350),
          locale: 'id',
        })
        setReady(true)
        setMessage('')
      } catch (error) {
        if (mounted) {
          setReady(false)
          setMessage(error.message || 'Tombol Google gagal dimuat.')
        }
      }
    }
    initialize()
    return () => { mounted = false }
  }, [text, onCredential, onError])

  return (
    <div className="space-y-1">
      <div className="relative min-h-10">
        <div ref={containerRef} className="min-h-10 flex justify-center" />
        {!ready && (
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="absolute inset-0 z-10 w-full min-h-10 flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-600 opacity-75 cursor-not-allowed"
          >
            <span aria-hidden="true" className="font-bold text-base text-[#4285F4]">G</span>
            {text === 'signup_with' ? 'Daftar dengan Google' : 'Masuk dengan Google'}
          </button>
        )}
      </div>
      {message && <p className="text-center text-[10px] text-gray-500">{message}</p>}
    </div>
  )
}
