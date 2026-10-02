import { Menu, Bell, User, Landmark } from "lucide-react";

export default function Header({ onMenuClick, collapsed }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-2 px-3.5 py-3 bg-white text-emerald-700 shadow-md rounded-b-2xl lg:rounded-none">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onMenuClick}
          aria-label="Buka/ciutkan menu"
          className="w-9 h-9 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition active:scale-95 flex-shrink-0"
        >
          <Menu size={18} strokeWidth={2.2} />
        </button>

        <div
          className={`items-center gap-2.5 min-w-0 ${
            collapsed ? "hidden lg:flex" : "hidden"
          }`}
        >
          <span className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Landmark size={16} />
          </span>
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight truncate">E-Aspirasi Desa</h1>
            <p className="text-xs text-emerald-600 flex items-center gap-1 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block flex-shrink-0"></span>
              <span className="truncate">Desa Jarak</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1.5 flex-shrink-0">
        <button
          aria-label="Notifikasi"
          className="w-9 h-9 rounded-full bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-700 transition active:scale-95"
        >
          <Bell size={16} fill="currentColor" />
        </button>
        <button
          aria-label="Akun"
          className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center transition active:scale-95"
        >
          <User size={16} fill="currentColor" />
        </button>
      </div>
    </header>
  );
}
