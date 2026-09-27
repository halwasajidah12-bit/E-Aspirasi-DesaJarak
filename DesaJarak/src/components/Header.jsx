export default function Header({ namaDesa, notificationCount = 0, onGoHome, onOpenNotifications, onToggleProfileMenu }) {
  return (
    <header className="bg-white text-emerald-700 p-3.5 pt-4 md:py-3 rounded-b-2xl md:rounded-none shadow-md z-20 flex-shrink-0 relative sticky top-0">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
        <button
          onClick={onGoHome}
          title="Kembali ke Beranda"
          className="flex items-center space-x-2.5 min-w-0 text-left active:scale-95 transition"
        >
          <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 text-emerald-600 font-bold flex-shrink-0">
            <i className="fa-solid fa-building-columns text-sm"></i>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm xs:text-base font-bold leading-tight truncate">E-Aspirasi Desa</h1>
            <p className="text-[10px] xs:text-xs text-emerald-600 flex items-center gap-1 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block flex-shrink-0"></span>
              <span className="truncate">Desa {namaDesa} • Admin</span>
            </p>
          </div>
        </button>

        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <button
            onClick={onOpenNotifications}
            title="Notifikasi"
            className="w-9 h-9 rounded-full bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-700 transition active:scale-95 relative"
          >
            <i className="fa-solid fa-bell text-sm"></i>
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 bg-rose-500 text-white rounded-full border-2 border-white text-[8px] font-bold flex items-center justify-center">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>
          <button
            onClick={onToggleProfileMenu}
            title="Akun Admin"
            className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center transition active:scale-95"
          >
            <i className="fa-solid fa-user text-sm"></i>
          </button>
        </div>
      </div>
    </header>
  )
}
