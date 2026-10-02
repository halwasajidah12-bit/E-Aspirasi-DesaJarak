import { useState } from "react";
import { ChevronRight } from "lucide-react";
import PageHeader from "../components/PageHeader";

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`h-6 w-11 shrink-0 rounded-full relative transition-colors ${
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

export default function Pengaturan({ session, onLogout }) {
  const [email, setEmail] = useState(true);
  const [push, setPush] = useState(false);

  return (
    <div className="pb-8">
      <PageHeader title="Pengaturan" subtitle="Kelola preferensi dan informasi akun Anda" />

      <div className="px-4 sm:px-6 mt-3.5 space-y-3.5">
        <Card title="Notifikasi">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-xs font-semibold text-gray-800">Notifikasi Email</p>
              <p className="text-xs text-gray-500">Terima update status pengaduan via email</p>
            </div>
            <Toggle checked={email} onChange={() => setEmail((v) => !v)} />
          </div>
          <div className="flex items-center justify-between py-1 mt-3 border-t border-gray-100 pt-3">
            <div>
              <p className="text-xs font-semibold text-gray-800">Notifikasi Push</p>
              <p className="text-xs text-gray-500">Terima semua notifikasi pada perangkat</p>
            </div>
            <Toggle checked={push} onChange={() => setPush((v) => !v)} />
          </div>
        </Card>

        <Card title="Keamanan dan Privasi">
          {[
            ["Kelola Akun", "Manajemen akun Anda"],
            ["Kebijakan Privasi", "Syarat dan ketentuan pengguna"],
          ].map(([t, d], i) => (
            <button
              key={t}
              className={`w-full flex items-center justify-between py-2 ${i > 0 ? "border-t border-gray-100 mt-2 pt-3" : ""}`}
            >
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-800">{t}</p>
                <p className="text-xs text-gray-500">{d}</p>
              </div>
              <ChevronRight size={16} className="text-emerald-600" />
            </button>
          ))}
        </Card>

        <Card title="E-Aspirasi">
          {[
            ["Tentang E-Aspirasi", "Penjelasan website"],
            ["Panduan E-Aspirasi", "Panduan Penggunaan E-Aspirasi"],
          ].map(([t, d], i) => (
            <button
              key={t}
              className={`w-full flex items-center justify-between py-2 ${i > 0 ? "border-t border-gray-100 mt-2 pt-3" : ""}`}
            >
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-800">{t}</p>
                <p className="text-xs text-gray-500">{d}</p>
              </div>
              <ChevronRight size={16} className="text-emerald-600" />
            </button>
          ))}
        </Card>

        {session && (
          <button
            onClick={onLogout}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl py-3 shadow-md transition active:scale-95"
          >
            Keluar {session.role === "guest" ? "dari Mode Tamu" : "Akun"}
          </button>
        )}

        <button className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs rounded-xl py-3 transition active:scale-95">
          Hapus Akun
        </button>
      </div>
    </div>
  );
}