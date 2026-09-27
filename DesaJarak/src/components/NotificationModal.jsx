import { notifications } from '../data/initialData.js'

export default function NotificationModal({ visible, onClose, onAction }) {
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
          {notifications.map((n, i) => (
            <button
              key={i}
              onClick={() => onAction(n.action)}
              className="w-full text-left bg-white border border-emerald-100 rounded-2xl p-3 flex gap-3 shadow-sm"
            >
              <div className={`w-10 h-10 rounded-xl ${n.color} flex items-center justify-center flex-shrink-0`}>
                <i className={`fa-solid ${n.icon}`}></i>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-800">{n.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{n.desc}</p>
                <p className="text-[9px] text-gray-400 mt-1">{n.time}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
