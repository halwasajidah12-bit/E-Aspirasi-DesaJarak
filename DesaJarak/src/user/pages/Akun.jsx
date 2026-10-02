import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, History, FileText, GraduationCap } from "lucide-react";

const fields = [
  { label: "Nama Lengkap", value: "Adit Mustopo" },
  { label: "NIK", value: "356802846889" },
  { label: "No. Telepon", value: "08234246565" },
  { label: "Alamat", value: "RT06/RW78 Jarak Lor" },
];

const shortcuts = [
  { to: "/riwayat", icon: History, label: "Riwayat Anda", bg: "bg-amber-50 text-amber-600 border border-amber-100" },
  { to: "/aspirasi", icon: FileText, label: "Mulai Aspirasi", bg: "bg-rose-50 text-rose-600 border border-rose-100" },
  { to: "/edukasi", icon: GraduationCap, label: "Edukasi Anda", bg: "bg-blue-50 text-blue-600 border border-blue-100" },
];

export default function Akun() {
  const navigate = useNavigate();

  return (
    <div className="px-4 sm:px-6 py-4 pb-8 space-y-3.5">
      <div className="relative bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-2xl shadow-sm px-4 pt-4 pb-5 text-center text-white">
        <button
          onClick={() => navigate(-1)}
          aria-label="Kembali"
          className="absolute left-4 top-4 h-9 w-9 rounded-full bg-white/90 hover:bg-white text-emerald-700 flex items-center justify-center transition active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <img
          src="https://i.pravatar.cc/200?img=12"
          alt="Foto Profil"
          className="h-20 w-20 rounded-full bg-gray-300 mx-auto border-4 border-white/80 shadow-md object-cover"
        />
        <p className="font-bold text-base mt-3">Adit Mustopo</p>
        <p className="text-xs text-emerald-100">Warga Dusun Jarak Lor</p>
        <button className="mt-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs font-bold rounded-xl px-6 py-2 transition active:scale-95">
          Edit Profil
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4">
        {fields.map((f) => (
          <div key={f.label} className="mb-4 last:mb-0">
            <p className="text-xs font-semibold text-gray-700 mb-1">{f.label}</p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs">{f.value}</div>
          </div>
        ))}

        <div className="grid grid-cols-3 gap-3 mt-5">
          {shortcuts.map(({ to, icon: Icon, label, bg }) => (
            <Link
              key={label}
              to={to}
              className={`rounded-2xl ${bg} flex flex-col items-center justify-center gap-2 py-4 text-xs font-bold text-center transition active:scale-95`}
            >
              <Icon size={22} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

