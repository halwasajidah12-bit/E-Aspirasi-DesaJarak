import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Bell, User, Landmark, X } from "lucide-react";
import { getUserNotifications, markUserNotificationsRead } from "../../utils/api.js";

export default function Header({ onMenuClick, collapsed, session, onLogout }) {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  useEffect(() => {
    if (!session || session.role === "guest") {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    let mounted = true;
    const refreshNotifications = async () => {
      try {
        const result = await getUserNotifications();
        if (!mounted) return;
        setNotifications(result.items || []);
        setUnreadCount(Number(result.unreadCount || 0));
      } catch {
        // Saat lonceng dibuka, permintaan langsung akan menampilkan pesan error kepada warga.
      }
    };

    refreshNotifications();
    window.addEventListener("user-notifications-updated", refreshNotifications);
    const interval = window.setInterval(refreshNotifications, 15000);
    return () => {
      mounted = false;
      window.removeEventListener("user-notifications-updated", refreshNotifications);
      window.clearInterval(interval);
    };
  }, [session?.userId, session?.role]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) setShowProfileMenu(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setShowProfileMenu(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggleNotifications = async () => {
    if (showNotifications) {
      setShowNotifications(false);
      return;
    }

    setShowProfileMenu(false);
    setShowNotifications(true);
    setNotificationsError("");
    if (!session || session.role === "guest") {
      setNotificationsError("Masuk ke akun warga untuk menerima notifikasi laporan.");
      return;
    }

    setLoadingNotifications(true);
    try {
      const result = await getUserNotifications();
      const items = result.items || [];
      setNotifications(items);
      setUnreadCount(Number(result.unreadCount || 0));

      if (Number(result.unreadCount || 0) > 0) {
        try {
          const readResult = await markUserNotificationsRead();
          setNotifications(items.map((item) => ({ ...item, readAt: item.readAt || readResult.readAt })));
          setUnreadCount(0);
        } catch {
          setNotificationsError("Notifikasi tampil, tetapi status dibaca belum tersimpan.");
        }
      }
    } catch (error) {
      setNotificationsError(error.message || "Notifikasi gagal dimuat.");
    } finally {
      setLoadingNotifications(false);
    }
  };

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

        <div className={`items-center gap-2.5 min-w-0 ${collapsed ? "hidden lg:flex" : "hidden"}`}>
          <span className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Landmark size={16} />
          </span>
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight truncate">E-Aspirasi Desa</h1>
            <p className="text-xs text-emerald-600 flex items-center gap-1 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block flex-shrink-0" />
              <span className="truncate">Desa Jarak</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1.5 flex-shrink-0">
        <button
          aria-label={unreadCount ? `Notifikasi, ${unreadCount} belum dibaca` : "Notifikasi"}
          aria-expanded={showNotifications}
          onClick={toggleNotifications}
          className="relative w-9 h-9 rounded-full bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-700 transition active:scale-95"
        >
          <Bell size={16} fill="currentColor" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold leading-4">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
        <div ref={profileMenuRef} className="relative">
          <button
            type="button"
            aria-label="Menu akun"
            aria-haspopup="menu"
            aria-expanded={showProfileMenu}
            onClick={() => { setShowNotifications(false); setShowProfileMenu((open) => !open); }}
            className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center transition active:scale-95"
          >
            <User size={16} fill="currentColor" />
          </button>
          {showProfileMenu && (
            <section role="menu" aria-label="Menu akun warga" className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-emerald-100 bg-white text-gray-800 shadow-2xl">
              <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white/60 bg-white/20">
                    <User size={19} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{session?.name || "Warga Desa"}</p>
                    <p className="truncate text-[11px] text-emerald-100">{session?.role === "guest" ? "Pengguna Tamu" : session?.email || "Akun Warga"}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1 p-2 text-xs">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setShowProfileMenu(false); navigate("/akun"); }}
                  className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-emerald-50"
                >
                  <User size={16} className="w-5 text-center text-emerald-600" />
                  Akun Saya
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setShowProfileMenu(false); onLogout?.(); }}
                  className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left text-rose-600 hover:bg-rose-50"
                >
                  <i className="fa-solid fa-right-from-bracket w-5 text-center" aria-hidden="true" />
                  {session?.role === "guest" ? "Keluar dari Mode Tamu" : "Keluar Akun"}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      {showNotifications && (
        <section className="absolute right-3 top-full mt-2 z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-emerald-100 bg-white p-3 shadow-xl" aria-label="Notifikasi laporan Anda">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-emerald-900">Notifikasi</h2>
            <button onClick={() => setShowNotifications(false)} aria-label="Tutup" className="rounded-full p-1 text-gray-500 hover:bg-gray-100">
              <X size={16} />
            </button>
          </div>
          {loadingNotifications ? <p className="py-3 text-xs text-gray-500">Memuat notifikasi...</p> : null}
          {notificationsError ? <p role="status" className="py-2 text-xs text-rose-600">{notificationsError}</p> : null}
          {!loadingNotifications && !notificationsError && notifications.length === 0 ? (
            <p className="py-3 text-xs text-gray-500">Belum ada notifikasi. Konfirmasi laporan dan pembaruan status akan muncul di sini.</p>
          ) : null}
          {!loadingNotifications && notifications.length > 0 && (
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {notifications.map((notification) => {
                const createdAt = new Date(notification.createdAt);
                const dateLabel = Number.isNaN(createdAt.getTime()) ? "" : createdAt.toLocaleString("id-ID");
                return (
                  <button
                    key={notification.id}
                    onClick={() => { setShowNotifications(false); navigate("/riwayat"); }}
                    className={`block w-full rounded-xl px-3 py-2 text-left hover:bg-emerald-100 ${notification.readAt ? "bg-white" : "bg-emerald-50"}`}
                  >
                    <span className="block text-xs font-semibold text-emerald-800">{notification.title}</span>
                    <span className="mt-0.5 block text-xs text-gray-700">{notification.description}</span>
                    {dateLabel && <span className="mt-1 block text-[10px] text-gray-500">{dateLabel}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}
    </header>
  );
}
