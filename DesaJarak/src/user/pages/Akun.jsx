import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, History, FileText, GraduationCap } from "lucide-react";

const fields = [
  { label: "Nama Lengkap", value: "Adit Mustopo" },
  { label: "NIK", value: "356802846889" },
  { label: "No. Telepon", value: "08234246565" },
  { label: "Alamat", value: "RT06/RW78 Jarak Lor" },
];

const shortcuts = [
  { to: "/riwayat", icon: History, label: "Riwayat Anda", bg: "bg-amber-100 text-amber-600" },
  { to: "/aspirasi", icon: FileText, label: "Mulai Aspirasi", bg: "bg-red-100 text-red-500" },
  { to: "/edukasi", icon: GraduationCap, label: "Edukasi Anda", bg: "bg-sky-100 text-sky-600" },
];

export default function Akun() {
  const navigate = useNavigate();

  return (
    <div className="pb-8">
      <div  className="relative bg-gradient-to-b from-brand-700 via-brand-500 to-mint-50 px-5 pt-3 pb-[210px] text-center text-white">
        <button
          onClick={() => navigate(-1)}
          aria-label="Kembali"
          className="absolute left-5 top-3 h-9 w-9 rounded-full bg-white/90 text-brand-700 flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </button>
        <img
          src="https://i.pravatar.cc/200?img=12"
          alt="Foto Profil"
          className="h-28 w-28 rounded-full bg-gray-300 mx-auto mt-2 border-4 border-white shadow-md object-cover"
        />
        <p className="font-bold text-3xl mt-3">Adit Mustopo</p>
        <p className="text-lg text-white/80">Warga Dusun Jarak Lor</p>
        <button className="mt-3 bg-accent-500 text-sm font-semibold rounded-full px-8 py-2">
          Edit Profil
        </button>
      </div>

      <div className="relative z-10 mx-4 -mt-[140px] bg-white rounded-3xl shadow-sm p-5">
        {fields.map((f) => (
          <div key={f.label} className="mb-4 last:mb-0">
            <p className="text-sm text-gray-500 mb-1.5">{f.label}</p>
            <div className="border border-brand-600 rounded-xl px-3.5 py-2.5 text-sm">{f.value}</div>
          </div>
        ))}

        <div className="grid grid-cols-3 gap-3 mt-5">
          {shortcuts.map(({ to, icon: Icon, label, bg }) => (
            <Link
              key={label}
              to={to}
              className={`rounded-2xl ${bg} flex flex-col items-center justify-center gap-2 py-5 text-xs font-semibold text-center`}
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
