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
        <p className="px-5 pt-4 pb-2 text-xs tracking-wide text-brand-100/70 uppercase whitespace-nowrap">
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
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] font-medium transition-colors whitespace-nowrap overflow-hidden ${
                  collapsed ? "lg:justify-center lg:px-0" : ""
                } ${
                  isActive
                    ? "bg-mint-50 text-brand-800"
                    : "text-white hover:bg-white/10"
                }`
              }
            >
              <Icon size={19} className="shrink-0" />
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
        className={`fixed top-0 left-0 h-full w-[270px] bg-brand-700 z-50 flex flex-col transition-all duration-300 overflow-hidden
          lg:translate-x-0 lg:z-30 ${collapsed ? "lg:w-[76px]" : "lg:w-[270px]"}
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className={`flex items-center justify-between px-5 pt-6 pb-4 text-white ${collapsed ? "lg:px-0 lg:justify-center" : ""}`}>
          <div className={`flex items-center gap-2.5 ${collapsed ? "lg:gap-0" : ""}`}>
            <span className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <MapPin size={18} />
            </span>
            <div className={collapsed ? "lg:hidden" : ""}>
              <p className="font-semibold leading-tight whitespace-nowrap">E-Aspirasi</p>
              <p className="text-xs text-white/70 whitespace-nowrap">Aspirasi Desa Jarak</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup menu"
            className="text-white/80 lg:hidden shrink-0"
          >
            <X size={22} />
          </button>
        </div>

        {/* collapse/expand toggle — desktop only */}
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Perluas menu" : "Ciutkan menu"}
          className="hidden lg:flex items-center justify-center gap-1.5 mx-3 mb-2 py-1.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white text-xs font-medium"
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /> Ciutkan</>}
        </button>

        <div className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scrollbar pb-4">
          <Section title="Menu Utama" links={utama} onNavigate={onClose} collapsed={collapsed} />
          <Section title="Layanan" links={layanan} onNavigate={onClose} collapsed={collapsed} />
        </div>

        <NavLink
          to="/akun"
          onClick={onClose}
          title="Budi Santoso"
          className={`m-4 flex items-center gap-3 rounded-xl bg-white/10 px-3.5 py-3 overflow-hidden ${
            collapsed ? "lg:justify-center lg:px-0 lg:mx-2" : ""
          }`}
        >
          <div className="h-9 w-9 rounded-full bg-white/20 shrink-0" />
          <div className={`whitespace-nowrap ${collapsed ? "lg:hidden" : ""}`}>
            <p className="text-sm font-semibold text-white">Budi Santoso</p>
            <p className="text-xs text-white/70">Pengguna Terverifikasi</p>
          </div>
        </NavLink>
      </aside>
    </>
  );
}
