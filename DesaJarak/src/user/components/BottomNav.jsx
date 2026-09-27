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
    <nav className="lg:hidden sticky bottom-0 left-0 right-0 bg-mint-50 border-t border-brand-100 px-4 py-2.5">
      <ul className="flex items-center justify-between">
        {items.map(({ to, icon: Icon, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === "/"}
              aria-label={label}
              className={({ isActive }) =>
                `flex items-center justify-center h-10 w-10 rounded-full transition-colors ${
                  isActive
                    ? "bg-brand-700 text-white"
                    : "text-brand-700"
                }`
              }
            >
              <Icon size={20} strokeWidth={2.3} />
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
