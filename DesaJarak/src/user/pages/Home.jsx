import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, History, FileText, FolderOpen, Loader2, Users, ThumbsUp, ChevronRight, Trophy } from "lucide-react";
import { mapApiReport, statusColor } from "../data/laporan";
import { beritaData } from "../data/berita";
import { profilDesa } from "../data/profilDesa";
import { getReports } from "../../utils/api.js";

const berita = beritaData.slice(0, 3);

export default function Home() {
  const [laporanData, setLaporanData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      try {
        const items = await getReports();
        if (mounted) {
          setLaporanData(items.map(mapApiReport));
          setLoadError("");
        }
      } catch (error) {
        if (mounted) setLoadError(error.message || "Gagal memuat laporan.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const stats = useMemo(() => [
    { icon: FileText, value: laporanData.length, label: "Total Aspirasi", iconBg: "bg-emerald-50 text-emerald-600", valueClass: "text-gray-800" },
    { icon: FolderOpen, value: laporanData.filter((l) => l.status === "Masuk").length, label: "Aspirasi Masuk", iconBg: "bg-emerald-50 text-emerald-600", valueClass: "text-emerald-600" },
    { icon: Loader2, value: laporanData.filter((l) => l.status === "Diproses").length, label: "Sedang Diproses", iconBg: "bg-amber-50 text-amber-600", valueClass: "text-amber-600" },
    { icon: Users, value: laporanData.filter((l) => l.status === "Selesai").length, label: "Terselesaikan", iconBg: "bg-blue-50 text-blue-600", valueClass: "text-emerald-600" },
  ], [laporanData]);

  const laporanTerbaru = useMemo(() => [...laporanData]
    .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
    .slice(0, 2), [laporanData]);

  return (
    <div className="px-4 sm:px-6 py-4 pb-6 space-y-3.5">
      {/* Banner */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-4 rounded-2xl shadow-md space-y-2.5">
        <div className="flex items-center justify-between gap-2 border-b border-emerald-700/60 pb-2">
          <h1 className="text-sm font-bold">Suara Warga, Aksi Nyata</h1>
          <span className="text-[9px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full flex-shrink-0">
            Platform Aspirasi Warga Digital
          </span>
        </div>

        <p className="text-xs text-emerald-100 leading-relaxed">
          Sampaikan aspirasi atau laporkan masalah, dan pantau pembangunan desa
          Anda secara <span className="italic">real-time</span>. Bersama
          membangun Desa Jarak yang lebih baik.
        </p>

        <div className="flex flex-col xs:flex-row gap-2 pt-1">
          <Link
            to="/aspirasi"
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <Plus size={14} /> Buat Pengaduan
          </Link>
          <Link
            to="/riwayat"
            className="flex-1 bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 font-semibold py-2 px-3 rounded-xl text-xs border border-emerald-700 flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <History size={14} /> Riwayat Aspirasi
          </Link>
        </div>
      </div>

      {loadError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          Gagal memuat laporan: {loadError}
        </p>
      )}
      {loading && laporanData.length === 0 && (
        <p role="status" className="rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs text-gray-500">
          Memuat laporan...
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {stats.map(({ icon: Icon, value, label, iconBg, valueClass }) => (
          <div key={label} className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon size={14} />
              </span>
              <span className={`text-lg xs:text-xl font-extrabold ${valueClass}`}>{value}</span>
            </div>
            <h4 className="text-xs font-bold text-gray-800">{label}</h4>
          </div>
        ))}
      </div>

      {/* Pengaduan Terbaru */}
      <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-emerald-100 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-emerald-900">Pengaduan Terbaru</h2>
          <Link to="/lacak" className="text-[11px] text-emerald-600 font-semibold hover:underline flex items-center gap-0.5">
            Lihat semua <ChevronRight size={12} />
          </Link>
        </div>
        <div className="grid gap-2.5 md:grid-cols-2">
          {laporanTerbaru.map((l) => (
            <Link
              key={l.id}
              to={`/lacak/${String(l.id).replace("#", "")}`}
              className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm space-y-2 block"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {l.id}
                </span>
                <div className="flex gap-1">
                  <span className={`text-[9px] font-bold rounded-full px-2 py-0.5 ${statusColor[l.status]}`}>
                    {l.status}
                  </span>
                  <span className="text-[9px] font-bold bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">{l.kategori}</span>
                </div>
              </div>
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-bold text-gray-800">{l.judul}</p>
                <span className="flex flex-col items-center text-emerald-600 shrink-0">
                  <ThumbsUp size={14} />
                  <span className="text-[10px] mt-0.5">{l.dukungan}</span>
                </span>
              </div>
              <p className="text-[10px] text-gray-400 pt-2 border-t border-gray-100">{l.lokasi} &nbsp;·&nbsp; {l.tanggal}</p>
            </Link>
          ))}
          {!loading && laporanTerbaru.length === 0 && (
            <p className="md:col-span-full py-4 text-center text-xs text-gray-500">Belum ada laporan.</p>
          )}
        </div>
      </div>

      {/* CTA laporkan */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-4 rounded-2xl shadow-sm space-y-1">
        <h2 className="text-base font-bold">Punya keluhan atau aspirasi?</h2>
        <p className="text-xs text-emerald-100 leading-relaxed">
          Laporkan masalah di sekitar Anda lengkap dengan foto dan lokasi GPS
          melalui <span className="italic">Geotagging</span> untuk penanganan
          lebih cepat.
        </p>
        <Link
          to="/aspirasi"
          className="inline-block mt-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs rounded-xl px-4 py-2 transition active:scale-95"
        >
          Mulai Laporan
        </Link>
      </div>

            {/* Berita Desa */}
      <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-emerald-100 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-emerald-900">Berita Desa</h2>
          <Link to="/berita" className="text-[11px] text-emerald-600 font-semibold hover:underline flex items-center gap-0.5">
            Lihat semua <ChevronRight size={12} />
          </Link>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          {berita.map((b) => (
            <Link
              key={b.id}
              to={`/berita/${b.id}`}
              className="p-2.5 bg-gray-50 rounded-xl flex items-center gap-2.5"
            >
              <img src={b.image} alt={b.judul} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                  {b.kategori}
                </span>
                <p className="text-xs font-bold text-gray-800 mt-0.5">{b.judul}</p>
                <p className="text-[10px] text-gray-400">{b.tanggal}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-3.5">
        {/* Informasi Desa */}
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-emerald-100 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-emerald-900">Informasi Desa</h2>
            <Link to="/info-desa" className="text-[11px] text-emerald-600 font-semibold hover:underline flex items-center gap-0.5">
              Lihat semua <ChevronRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-100 text-xs">
            <div className="py-1.5 flex justify-between gap-3">
              <span className="text-gray-500">Desa</span>
              <span className="font-semibold text-gray-800 text-right">{profilDesa.namaDesa}</span>
            </div>
            <div className="py-1.5 flex justify-between gap-3">
              <span className="text-gray-500">Kecamatan / Kabupaten</span>
              <span className="font-semibold text-gray-800 text-right">{profilDesa.kecamatan}, {profilDesa.kabupaten}</span>
            </div>
            <div className="py-1.5 flex justify-between gap-3">
              <span className="text-gray-500">Luas Wilayah</span>
              <span className="font-semibold text-gray-800 text-right">{profilDesa.luasWilayah}</span>
            </div>
            <div className="py-1.5 flex justify-between gap-3">
              <span className="text-gray-500">Total Penduduk</span>
              <span className="font-semibold text-gray-800 text-right">{profilDesa.totalPenduduk.toLocaleString("id-ID")} Jiwa</span>
            </div>
            <div className="py-1.5 flex justify-between gap-3">
              <span className="text-gray-500">Kartu Keluarga</span>
              <span className="font-semibold text-gray-800 text-right">{profilDesa.kk.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>

        {/* Reward */}
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-amber-900">
              <Trophy size={15} className="text-amber-500" /> Poin Reward Anda
            </h2>
            <Link to="/reward" className="text-[11px] text-amber-700 font-semibold hover:underline flex items-center gap-0.5">
              Lihat detail <ChevronRight size={12} />
            </Link>
          </div>
          <p className="text-2xl font-extrabold text-gray-800">1.000</p>
          <p className="text-[10px] text-gray-500">Peringkat #12 dari 500 warga</p>
          <div className="h-1.5 rounded-full bg-amber-100 mt-2 overflow-hidden">
            <div className="h-full w-[55%] bg-amber-500 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
