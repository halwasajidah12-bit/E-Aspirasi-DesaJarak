import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  ThumbsUp,
  Share2,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import { laporanData } from "../data/laporan";

const statusStyle = {
  Selesai: "bg-emerald-100 text-emerald-700",
  Diproses: "bg-amber-100 text-amber-700",
  Masuk: "bg-sky-100 text-sky-700",
};

const alur = [
  { label: "Masuk", desc: "Laporan berhasil masuk ke sistem desa" },
  { label: "Diproses", desc: "Petugas sedang menindaklanjuti laporan" },
  { label: "Selesai", desc: "Laporan telah selesai ditangani" },
];

export default function DetailLaporan() {
  const { id } = useParams();
  const navigate = useNavigate();

  const report = laporanData.find(
    (l) => String(l.id).replace("#", "") === String(id).replace("#", "")
  );

  const angkaAwal =
    Number(
      String(report?.dukungan ?? report?.dukunganWarga ?? "").replace(/\D/g, "")
    ) || 0;

  const [didukung, setDidukung] = useState(false);
  const [dukungan, setDukungan] = useState(angkaAwal);

  const toggleDukungan = () => {
    setDukungan((n) => (didukung ? n - 1 : n + 1));
    setDidukung((v) => !v);
  };

  const bagikan = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: report?.judul ?? "Laporan Desa",
          text: `Dukung laporan: ${report?.judul ?? ""}`,
          url,
        });
      } catch {
        /* dibatalkan pengguna */
      }
    } else {
      await navigator.clipboard?.writeText(url);
      alert("Tautan laporan disalin.");
    }
  };

  if (!report) {
    return (
      <div className="pb-8">
        <div className="bg-gradient-to-b from-brand-700 via-brand-500 to-mint-50 px-5 pt-3 pb-[160px] text-white">
          <button
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="h-9 w-9 rounded-full bg-white/90 text-brand-700 flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold text-center mt-2">Detail Laporan</h1>
        </div>
        <div className="mx-4 -mt-[135px] bg-white rounded-3xl shadow-sm p-6 text-center">
          <p className="text-sm text-gray-500">
            Laporan dengan ID <b>#{id}</b> tidak ditemukan.
          </p>
          <button
            onClick={() => navigate("/lacak")}
            className="mt-5 rounded-full bg-brand-700 text-white px-6 py-2.5 font-semibold text-sm"
          >
            Kembali ke Lacak Laporan
          </button>
        </div>
      </div>
    );
  }

  const activeStep =
    report.status === "Selesai" ? 2 : report.status === "Diproses" ? 1 : 0;

  return (
    <div className="pb-8">
      <div className="bg-gradient-to-b from-brand-700 via-brand-500 to-mint-50 px-5 pt-3 pb-[160px] text-white">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="h-9 w-9 rounded-full bg-white/90 text-brand-700 flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={bagikan}
            aria-label="Bagikan"
            className="ml-auto h-9 w-9 rounded-full bg-white/90 text-brand-700 flex items-center justify-center"
          >
            <Share2 size={18} />
          </button>
        </div>
        <h1 className="text-2xl font-bold text-center mt-2">Detail Laporan</h1>
        <p className="text-center text-white/80 text-sm mt-1">
          #{String(report.id).replace("#", "")} · {report.kategori}
        </p>
      </div>

      <div className="mx-4 -mt-[135px] bg-white rounded-3xl shadow-sm p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">
            #{String(report.id).replace("#", "")}
          </span>
          <span className="text-xs font-medium rounded-full bg-brand-50 text-brand-800 px-3 py-1">
            {report.kategori}
          </span>
          <span
            className={`text-xs font-semibold rounded-full px-3 py-1 ${
              statusStyle[report.status] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {report.status}
          </span>
        </div>

        <h2 className="text-lg font-bold text-gray-800 mt-3 leading-snug">
          {report.judul}
        </h2>

        <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} /> {report.tanggal ?? "-"}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={13} /> {report.lokasi ?? "-"}
          </span>
        </div>

        <div className="mt-4 rounded-2xl overflow-hidden bg-gray-100 h-44 flex items-center justify-center">
          {report.foto ? (
            <img
              src={report.foto}
              alt={report.judul}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <ImageIcon size={30} />
              <span className="text-xs mt-1">Belum ada foto</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mt-4">
          {report.deskripsi ?? "Tidak ada deskripsi."}
        </p>

        <div className="mt-5 rounded-2xl bg-gray-50 p-4 grid grid-cols-2 gap-y-3 text-xs">
          <Info label="RT / RW" value={`${report.rt ?? "-"} / ${report.rw ?? "-"}`} />
          <Info label="Waktu" value={report.waktu ?? "-"} />
          <Info label="Tanggal" value={report.tanggal ?? "-"} />
          <Info label="Kategori" value={report.kategori ?? "-"} />
          <Info label="Lokasi" value={report.lokasi ?? "-"} className="col-span-2" />
        </div>

        <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-brand-800">
              {dukungan} Dukungan Warga
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Beri dukungan agar laporan ini diprioritaskan.
            </p>
          </div>
          <button
            onClick={toggleDukungan}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold ${
              didukung
                ? "bg-brand-700 text-white"
                : "bg-white text-brand-700 border border-brand-200"
            }`}
          >
            <ThumbsUp size={15} /> {didukung ? "Didukung" : "Dukung"}
          </button>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-gray-700 mb-4">
            Status Penanganan
          </p>
          <div className="relative">
            {alur.map((s, i) => {
              const done = i <= activeStep;
              return (
                <div key={s.label} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < alur.length - 1 && (
                    <span
                      className={`absolute left-[11px] top-6 bottom-0 w-px ${
                        i < activeStep ? "bg-brand-700" : "bg-gray-200"
                      }`}
                    />
                  )}
                  <span
                    className={`relative z-10 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                      done ? "bg-brand-700 text-white" : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {done ? <CheckCircle2 size={14} /> : <Clock size={13} />}
                  </span>
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        done ? "text-gray-800" : "text-gray-400"
                      }`}
                    >
                      {s.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={bagikan}
            className="flex-1 rounded-full border border-gray-200 py-2.5 font-semibold text-gray-500 flex items-center justify-center gap-2"
          >
            <Share2 size={16} /> Bagikan
          </button>
          <button
            onClick={() => navigate("/lacak")}
            className="flex-1 rounded-full bg-brand-700 text-white py-2.5 font-semibold"
          >
            Lacak Laporan Lain
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, className = "" }) {
  return (
    <div className={className}>
      <p className="text-gray-400">{label}</p>
      <p className="font-medium text-gray-700 mt-0.5">{value}</p>
    </div>
  );
}