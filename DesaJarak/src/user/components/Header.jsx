import { Menu, Bell, User, MapPin } from "lucide-react";

export default function Header({ onMenuClick, collapsed }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-mint-50/95 backdrop-blur border-b border-brand-100">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Buka/ciutkan menu"
          className="text-brand-800"
        >
          <Menu size={24} strokeWidth={2.2} />
        </button>

        <div
          className={`items-center gap-2 text-brand-800 ${
            collapsed ? "hidden lg:flex" : "hidden"
          }`}
        >
          <span className="h-8 w-8 rounded-full bg-brand-700 text-white flex items-center justify-center">
            <MapPin size={16} />
          </span>
          <span className="font-semibold">E-Aspirasi Desa Jarak</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          aria-label="Notifikasi"
          className="h-9 w-9 rounded-full bg-brand-700 text-white flex items-center justify-center"
        >
          <Bell size={16} fill="currentColor" />
        </button>
        <button
          aria-label="Akun"
          className="h-9 w-9 rounded-full bg-brand-700 text-white flex items-center justify-center"
        >
          <User size={17} fill="currentColor" />
        </button>
      </div>
    </header>
  );
}
