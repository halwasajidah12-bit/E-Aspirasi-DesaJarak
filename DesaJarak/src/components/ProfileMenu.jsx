export default function ProfileMenu({ visible, adminName, onGoProfil, onLogout }) {
  if (!visible) return null
  return (
    <div className="profile-menu">
      <div className="bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/60 flex items-center justify-center text-xl">
              <i className="fa-solid fa-user"></i>
            </div>
            <div className="min-w-0">
              <p className="font-bold truncate">{adminName}</p>
              <p className="text-[10px] text-emerald-100">Administrator E-Aspirasi</p>
            </div>
          </div>
        </div>
        <div className="p-2 space-y-1 text-xs">
          <button onClick={onGoProfil} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-50 text-left">
            <i className="fa-solid fa-id-card text-emerald-600 w-5 text-center"></i> Profil Desa
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-rose-50 text-rose-600 text-left">
            <i className="fa-solid fa-right-from-bracket w-5 text-center"></i> Keluar
          </button>
        </div>
      </div>
    </div>
  )
}
