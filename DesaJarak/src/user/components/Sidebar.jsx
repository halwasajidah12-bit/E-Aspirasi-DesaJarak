import { NavLink } from "react-router-dom";
import {
  X,
  Home,
  FileText,
  Search,
  ThumbsUp,
  Newspaper,
  MapPin,
  Bot,
  History,
  GraduationCap,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Landmark,
} from "lucide-react";

const utama = [
  { to: "/", icon: Home, label: "Beranda" },
  { to: "/aspirasi", icon: FileText, label: "Aspirasi" },
  { to: "/lacak", icon: Search, label: "Lacak Laporan" },
  { to: "/vote", icon: ThumbsUp, label: "Vote Prioritas" },
  { to: "/berita", icon: Newspaper, label: "Berita Desa" },
];

const layanan = [
  { to: "/info-desa", icon: MapPin, label: "Info Desa" },
  { to: "/ai-asisten", icon: Bot, label: "AI Asisten" },
  { to: "/riwayat", icon: History, label: "Riwayat" },
  { to: "/edukasi", icon: GraduationCap, label: "Edukasi" },
  { to: "/akun", icon: User, label: "Akun" },
  { to: "/pengaturan", icon: Settings, label: "Pengaturan" },
];

function Section({ title, links, onNavigate, collapsed }) {
  return (
    <div className="mt-2">
      {title && !collapsed && (
        <p className="px-4 pt-3 pb-2 text-[10px] font-bold uppercase tracking-wide text-gray-400 whitespace-nowrap">
          {title}
        </p>
      )}
      <ul className={`px-3 space-y-1 ${collapsed ? "lg:px-2" : ""}`}>
        {links.map(({ to, icon: Icon, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === "/"}
              onClick={onNavigate}
              title={label}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap overflow-hidden ${
                  collapsed ? "lg:justify-center lg:px-0" : ""
                } ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span className={collapsed ? "lg:hidden" : ""}>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Sidebar({ open, onClose, collapsed, onToggleCollapse }) {
  return (
    <>
      {/* backdrop — only relevant below the lg breakpoint, where the sidebar is a drawer */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity lg:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 left-0 h-full w-[270px] bg-white border-r border-emerald-100 shadow-xl lg:shadow-none z-50 flex flex-col transition-all duration-300 overflow-hidden
          lg:translate-x-0 lg:z-30 ${collapsed ? "lg:w-[76px]" : "lg:w-[270px]"}
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className={`flex items-center justify-between px-4 pt-5 pb-3 ${collapsed ? "lg:px-0 lg:justify-center" : ""}`}>
          <div className={`flex items-center gap-2.5 ${collapsed ? "lg:gap-0" : ""}`}>
            <span className="h-9 w-9 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Landmark size={16} />
            </span>
            <div className={collapsed ? "lg:hidden" : ""}>
              <p className="text-base font-bold leading-tight text-emerald-700 whitespace-nowrap">E-Aspirasi Desa</p>
              <p className="text-xs text-emerald-600 whitespace-nowrap">Aspirasi Desa Jarak</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup menu"
            className="text-gray-400 hover:text-emerald-700 lg:hidden shrink-0"
          >
            <X size={22} />
          </button>
        </div>

        {/* collapse/expand toggle — desktop only */}
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Perluas menu" : "Ciutkan menu"}
          className="hidden lg:flex items-center justify-center gap-1.5 mx-3 mb-2 py-1.5 rounded-lg text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-medium transition"
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /> Ciutkan</>}
        </button>

        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-4">
          <Section title="Menu Utama" links={utama} onNavigate={onClose} collapsed={collapsed} />
          <Section title="Layanan" links={layanan} onNavigate={onClose} collapsed={collapsed} />
        </div>

        <NavLink
          to="/akun"
          onClick={onClose}
          title="Budi Santoso"
          className={`m-3 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5 overflow-hidden ${
            collapsed ? "lg:justify-center lg:px-0 lg:mx-2" : ""
          }`}
        >
          <div className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <User size={16} fill="currentColor" />
          </div>
          <div className={`whitespace-nowrap ${collapsed ? "lg:hidden" : ""}`}>
            <p className="text-sm font-semibold text-gray-800">Budi Santoso</p>
            <p className="text-xs text-emerald-600">Pengguna Terverifikasi</p>
          </div>
        </NavLink>
      </aside>
    </>
  );
}
