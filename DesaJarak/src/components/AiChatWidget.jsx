import { useState } from 'react'

const QUICK_QUESTIONS = [
  { label: 'Cek Urgensi Tinggi', text: 'Berapa jumlah laporan urgensi tinggi hari ini?' },
  { label: 'Cara Balas Laporan', text: 'Bagaimana cara membalas laporan warga?' },
  { label: 'Saran Tanggapan AI', text: 'Buatkan saran tanggapan untuk jembatan rusak' },
]

function buildReply(userMsg, namaDesa) {
  const lower = userMsg.toLowerCase()
  if (lower.includes('urgensi')) {
    return 'Terdapat 2 laporan dengan status Urgensi Tinggi saat ini (#JR-001 dan #JR-021) terkait perbaikan fasilitas penyeberangan jalan.'
  }
  if (lower.includes('balas')) {
    return "Untuk membalas laporan warga, Anda dapat mengklik tombol 'Detail' pada kartu laporan di tab 'Laporan' lalu masukkan tanggapan resmi pada form yang tersedia."
  }
  return `Pertanyaan '${userMsg}' telah diproses oleh AI Assistant Desa ${namaDesa}.`
}

export default function AiChatWidget({ namaDesa }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Halo Pak Admin! Saya Asisten AI Desa. Saya dapat membantu menganalisis duplikat laporan, menyusun tanggapan resmi, atau membuat draf berita desa. Ada yang bisa saya bantu? 😊' },
  ])

  const sendMessage = (text) => {
    const value = (text ?? input).trim()
    if (!value) return
    setMessages((prev) => [...prev, { role: 'user', text: value }])
    setInput('')
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'ai', text: buildReply(value, namaDesa) }])
    }, 600)
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 right-3.5 md:bottom-6 md:right-6 z-30 w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl shadow-xl ai-float-glow active:scale-90 transition"
      >
        <i className="fa-solid fa-robot"></i>
      </button>

      <div
        className={`fixed inset-x-3 bottom-20 top-14 md:inset-x-auto md:top-auto md:bottom-24 md:right-6 md:w-96 md:h-[540px] z-40 bg-white rounded-2xl shadow-2xl border border-emerald-200 flex flex-col transition-all ${
          open ? '' : 'hidden'
        }`}
      >
        <div className="header-gradient text-white p-3 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs">
              <i className="fa-solid fa-robot"></i>
            </div>
            <div>
              <h4 className="text-xs font-bold">Asisten AI E-Aspirasi</h4>
              <p className="text-[9px] text-emerald-100">Virtual Assistant Admin Desa {namaDesa}</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-white hover:text-emerald-200 p-1">
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
          {messages.map((m, i) =>
            m.role === 'ai' ? (
              <div key={i} className="bg-emerald-50 text-emerald-950 p-2.5 rounded-2xl rounded-tl-none max-w-[85%] border border-emerald-100 leading-relaxed">
                {m.text}
              </div>
            ) : (
              <div key={i} className="bg-emerald-600 text-white p-2.5 rounded-2xl rounded-tr-none max-w-[85%] ml-auto text-right leading-relaxed">
                {m.text}
              </div>
            )
          )}
        </div>

        <div className="p-2 border-t border-gray-100 bg-gray-50 overflow-x-auto no-scrollbar flex gap-1.5 text-[10px]">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q.label}
              onClick={() => sendMessage(q.text)}
              className="bg-white border border-emerald-300 text-emerald-800 px-2.5 py-1 rounded-full whitespace-nowrap hover:bg-emerald-50"
            >
              {q.label}
            </button>
          ))}
        </div>

        <div className="p-2 border-t border-gray-100 bg-white rounded-b-2xl flex gap-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            type="text"
            placeholder="Kirim pesan ke AI..."
            className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          />
          <button onClick={() => sendMessage()} className="bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold active:scale-95">
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </>
  )
}
