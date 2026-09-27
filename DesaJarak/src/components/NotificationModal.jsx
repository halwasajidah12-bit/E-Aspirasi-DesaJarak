const timeAgo = (timestamp) => {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000))
  if (!Number.isFinite(elapsedSeconds)) return 'Waktu tidak tersedia'
  if (elapsedSeconds < 60) return 'Baru saja'
  const minutes = Math.floor(elapsedSeconds / 60)
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} hari lalu`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} bulan lalu`
  return `${Math.floor(months / 12)} tahun lalu`
}

export default function NotificationModal({ visible, notifications = [], onClose, onAction }) {
  return (
    <div className={`fixed inset-0 z-50 bg-[#e6faf0] ${visible ? '' : 'hidden'}`}>
      <div className="h-full flex flex-col">
        <div className="header-gradient text-white p-4 flex items-center gap-3 shadow-md">
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h2 className="font-bold text-base">Notifikasi</h2>
            <p className="text-[10px] text-emerald-100">Pembaruan laporan, berita, dan aktivitas admin</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="rounded-2xl border border-emerald-100 bg-white p-8 text-center text-sm text-gray-500">
              Belum ada notifikasi.
            </div>
          ) : notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => onAction(n.action)}
              className="w-full text-left bg-white border border-emerald-100 rounded-2xl p-3 flex gap-3 shadow-sm"
            >
              <div className={`w-10 h-10 rounded-xl ${n.color} flex items-center justify-center flex-shrink-0`}>
                <i className={`fa-solid ${n.icon}`}></i>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-800">{n.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{n.desc}</p>
                <p className="text-[9px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
