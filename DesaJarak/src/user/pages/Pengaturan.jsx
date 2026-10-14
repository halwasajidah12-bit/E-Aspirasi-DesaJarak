import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, X } from "lucide-react";
import {
  getEmailPreferences,
  getPushConfig,
  removePushSubscription,
  savePushSubscription,
  updateEmailPreferences,
} from "../../utils/api.js";
import PageHeader from "../components/PageHeader";

const decodeVapidPublicKey = (key) => {
  const padded = `${key}${"=".repeat((4 - (key.length % 4)) % 4)}`;
  const decoded = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
};

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`h-6 w-11 shrink-0 rounded-full relative transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-emerald-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-3.5">
      {title && <p className="text-sm font-bold text-emerald-900 mb-3">{title}</p>}
      {children}
    </div>
  );
}

export default function Pengaturan({ session }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(false);
  const [emailState, setEmailState] = useState({ loading: true, verified: false, address: "", configured: false, message: "", messageType: "" });
  const [savingEmail, setSavingEmail] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushState, setPushState] = useState({ loading: true, configured: false, publicKey: "", message: "", messageType: "" });
  const [savingPush, setSavingPush] = useState(false);
  const [activeDialog, setActiveDialog] = useState("");

  useEffect(() => {
    if (!session || session.role === "guest") {
      setEmailState((current) => ({ ...current, loading: false }));
      return;
    }
    getEmailPreferences()
      .then((preferences) => {
        setEmail(preferences.enabled);
        setEmailState({ loading: false, verified: preferences.emailVerified, address: preferences.email, configured: preferences.configured, message: "", messageType: "" });
      })
      .catch((error) => setEmailState((current) => ({ ...current, loading: false, message: error.message || "Preferensi email gagal dimuat.", messageType: "error" })));
  }, [session]);

  useEffect(() => {
    if (!session || session.role === "guest") {
      setPushEnabled(false);
      setPushState((current) => ({ ...current, loading: false }));
      return;
    }
    let mounted = true;
    const loadPushSettings = async () => {
      try {
        const config = await getPushConfig();
        let subscribed = false;
        if ("serviceWorker" in navigator && "PushManager" in window) {
          const registration = await navigator.serviceWorker.getRegistration();
          const subscription = await registration?.pushManager.getSubscription();
          if (subscription) {
            const current = await getPushConfig(subscription.endpoint);
            subscribed = Boolean(current.subscribed);
          }
        }
        if (mounted) {
          setPushEnabled(subscribed);
          setPushState({ loading: false, configured: Boolean(config.configured), publicKey: config.publicKey || "", message: "", messageType: "" });
        }
      } catch (error) {
        if (mounted) setPushState({ loading: false, configured: false, publicKey: "", message: error.message || "Status notifikasi HP gagal dimuat.", messageType: "error" });
      }
    };
    loadPushSettings();
    return () => { mounted = false; };
  }, [session]);

  useEffect(() => {
    if (!activeDialog) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setActiveDialog("");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeDialog]);

  const toggleEmail = async () => {
    setSavingEmail(true);
    setEmailState((current) => ({ ...current, message: "" }));
    try {
      const result = await updateEmailPreferences(!email);
      setEmail(Boolean(result.enabled));
      setEmailState((current) => ({
        ...current,
        verified: Boolean(result.emailVerified),
        address: result.email || current.address,
        message: result.verificationSent ? `Email konfirmasi dikirim ke ${result.email}. Klik tautan di email untuk mengaktifkan notifikasi.` : "",
        messageType: result.verificationSent ? "info" : "success",
      }));
    } catch (error) {
      setEmailState((current) => ({ ...current, message: error.message || "Pengaturan email gagal disimpan.", messageType: "error" }));
    } finally {
      setSavingEmail(false);
    }
  };

  const togglePushNotifications = async () => {
    setSavingPush(true);
    setPushState((current) => ({ ...current, message: "", messageType: "" }));
    try {
      if (pushEnabled) {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription) {
          await removePushSubscription(subscription.endpoint);
          await subscription.unsubscribe();
        }
        setPushEnabled(false);
        setPushState((current) => ({ ...current, message: "Notifikasi HP dinonaktifkan di perangkat ini.", messageType: "success" }));
        return;
      }

      if (!window.isSecureContext || !("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Browser atau alamat website ini belum mendukung notifikasi push. Gunakan browser yang mendukung dan website HTTPS.");
      }
      if (!pushState.configured || !pushState.publicKey) {
        throw new Error("Notifikasi HP belum dikonfigurasi pengelola website (kunci VAPID belum diatur).");
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Izin notifikasi belum diberikan. Ubah izin website melalui pengaturan browser HP.");

      const registration = await navigator.serviceWorker.register("/service-worker.js");
      await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidPublicKey(pushState.publicKey),
        });
      }
      await savePushSubscription(subscription.toJSON());
      setPushEnabled(true);
      setPushState((current) => ({ ...current, message: "Notifikasi push aktif di perangkat ini.", messageType: "success" }));
    } catch (error) {
      setPushState((current) => ({ ...current, message: error.message || "Pengaturan notifikasi HP gagal disimpan.", messageType: "error" }));
    } finally {
      setSavingPush(false);
    }
  };

  return (
    <div className="pb-8">
      <PageHeader title="Pengaturan" subtitle="Kelola preferensi dan informasi akun Anda" />

      <div className="px-4 sm:px-6 mt-3.5 space-y-3.5">
        <Card title="Notifikasi">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-xs font-semibold text-gray-800">Notifikasi Email</p>
              <p className="text-xs text-gray-500">Kirim pembaruan status aspirasi ke email akun</p>
            </div>
            <Toggle checked={email} onChange={toggleEmail} disabled={emailState.loading || savingEmail || session?.role === "guest" || (!emailState.configured && !email)} />
          </div>
          <p className="mt-2 text-[11px] text-gray-500">
            {emailState.loading ? "Memuat preferensi email..." : emailState.address ? `${emailState.address} (${emailState.verified ? "terverifikasi" : "belum terverifikasi"})` : "Email akun tidak tersedia."}
          </p>
          {!emailState.configured && session?.role !== "guest" && <p className="mt-1 text-[11px] text-amber-700">Layanan pengiriman email belum dikonfigurasi pengelola.</p>}
          {emailState.message && <p role={emailState.messageType === "error" ? "alert" : "status"} className={`mt-1 text-[11px] ${emailState.messageType === "error" ? "text-rose-700" : emailState.messageType === "info" ? "text-blue-700" : "text-emerald-700"}`}>{emailState.message}</p>}
          {session?.role === "guest" && <p className="mt-1 text-[11px] text-gray-500">Masuk ke akun warga untuk mengatur email.</p>}
          <div className="flex items-center justify-between py-1 mt-3 border-t border-gray-100 pt-3">
            <div>
              <p className="text-xs font-semibold text-gray-800">Notifikasi Push ke HP</p>
              <p className="text-xs text-gray-500">Pembaruan laporan tampil sebagai notifikasi HP meski website ditutup</p>
            </div>
            <Toggle
              checked={pushEnabled}
              onChange={togglePushNotifications}
              disabled={pushState.loading || savingPush || session?.role === "guest"}
            />
          </div>
          {pushState.loading ? <p className="mt-1 text-[11px] text-gray-500">Memeriksa notifikasi di perangkat ini...</p> : null}
          <p className="mt-1 text-[11px] text-gray-500">Riwayat notifikasi tetap tersedia di lonceng dashboard.</p>
          {!pushState.loading && session?.role !== "guest" && !pushState.configured && <p className="mt-1 text-[11px] text-amber-700">Notifikasi push belum dikonfigurasi pengelola website.</p>}
          {!pushState.loading && session?.role !== "guest" && pushState.configured && !pushEnabled && <p className="mt-1 text-[11px] text-gray-500">Belum aktif di perangkat ini. Aktifkan di sini lalu izinkan notifikasi dari browser.</p>}
          {pushState.message && <p role={pushState.messageType === "error" ? "alert" : "status"} className={`mt-1 text-[11px] ${pushState.messageType === "error" ? "text-rose-700" : "text-emerald-700"}`}>{pushState.message}</p>}
          {session?.role === "guest" && <p className="mt-1 text-[11px] text-gray-500">Masuk ke akun warga untuk mengatur notifikasi HP.</p>}
        </Card>

        <Card title="Keamanan dan Privasi">
          {[
            { title: "Kelola Akun", description: "Lihat dan ubah profil akun Anda", action: () => navigate("/akun") },
            { title: "Syarat dan Ketentuan", description: "Aturan penggunaan E-Aspirasi", action: () => navigate("/edukasi/syarat-dan-ketentuan") },
          ].map(({ title, description, action }, i) => (
            <button
              key={title}
              onClick={action}
              type="button"
              className={`w-full flex items-center justify-between py-2 ${i > 0 ? "border-t border-gray-100 mt-2 pt-3" : ""}`}
            >
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-800">{title}</p>
                <p className="text-xs text-gray-500">{description}</p>
              </div>
              <ChevronRight size={16} className="text-emerald-600" />
            </button>
          ))}
        </Card>

        <Card title="E-Aspirasi">
          {[
            { title: "Tentang E-Aspirasi", description: "Informasi tentang layanan ini", action: () => setActiveDialog("about") },
            { title: "Panduan E-Aspirasi", description: "Panduan penggunaan website", action: () => navigate("/edukasi/penggunaan-website") },
          ].map(({ title, description, action }, i) => (
            <button
              key={title}
              onClick={action}
              type="button"
              className={`w-full flex items-center justify-between py-2 ${i > 0 ? "border-t border-gray-100 mt-2 pt-3" : ""}`}
            >
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-800">{title}</p>
                <p className="text-xs text-gray-500">{description}</p>
              </div>
              <ChevronRight size={16} className="text-emerald-600" />
            </button>
          ))}
        </Card>

      </div>

      {activeDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveDialog(""); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="settings-dialog-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2 id="settings-dialog-title" className="text-base font-bold text-emerald-900">
                Tentang E-Aspirasi
              </h2>
              <button type="button" onClick={() => setActiveDialog("")} aria-label="Tutup" className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              E-Aspirasi Desa Jarak adalah layanan untuk memperoleh informasi desa, menyampaikan aspirasi, dan memantau tindak lanjut laporan warga.
            </p>
            <button type="button" onClick={() => setActiveDialog("")} className="mt-5 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">
              Mengerti
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
