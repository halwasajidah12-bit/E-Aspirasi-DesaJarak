import { NavLink } from "react-router-dom";
import { Home, FileText, Search, ThumbsUp, History } from "lucide-react";

const items = [
  { to: "/", icon: Home, label: "Beranda" },
  { to: "/aspirasi", icon: FileText, label: "Aspirasi" },
  { to: "/lacak", icon: Search, label: "Lacak" },
  { to: "/vote", icon: ThumbsUp, label: "Vote" },
  { to: "/riwayat", icon: History, label: "Riwayat" },
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden sticky bottom-0 inset-x-0 bg-white border-t border-emerald-100 shadow-lg z-30 px-1 py-1 pb-safe">
      <ul className="flex justify-between items-center">
        {items.map(({ to, icon: Icon, label }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === "/"}
              aria-label={label}
              className={({ isActive }) =>
                `flex flex-col items-center py-1.5 px-0.5 transition active:scale-95 ${
                  isActive
                    ? "text-emerald-600 font-bold"
                    : "text-gray-400 hover:text-emerald-600 font-medium"
                }`
              }
            >
              <Icon size={18} strokeWidth={2.3} />
              <span className="text-[9px] xs:text-[10px] mt-0.5 truncate max-w-full">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
