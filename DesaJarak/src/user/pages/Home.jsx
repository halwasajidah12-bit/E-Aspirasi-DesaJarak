import { Link } from "react-router-dom";
import { Plus, History, FileText, FolderOpen, Loader2, Users, ThumbsUp, ChevronRight, Trophy } from "lucide-react";
import { laporanData, laporanStats, statusColor } from "../data/laporan";
import { beritaData } from "../data/berita";
import { profilDesa } from "../data/profilDesa";

// Statistik dihitung dari laporanData (satu sumber data yang sama dengan
// dashboard admin) supaya angkanya tidak asal/berbeda sendiri.
const stats = [
  { icon: FileText, value: laporanStats.total, label: "Total Aspirasi", bg: "bg-brand-700" },
  { icon: FolderOpen, value: laporanStats.masuk, label: "Aspirasi Masuk", bg: "bg-red-500" },
  { icon: Loader2, value: laporanStats.diproses, label: "Sedang Diproses", bg: "bg-accent-500" },
  { icon: Users, value: laporanStats.selesai, label: "Terselesaikan", bg: "bg-sky-500" },
];

const laporanTerbaru = laporanData.slice(0, 2);
const berita = beritaData.slice(0, 3);

export default function Home() {
  return (
    <div className="pb-6">
      {/* Hero */}
      <div  className="bg-gradient-to-b from-brand-700 via-brand-500 to-mint-50 px-5 pt-3 pb-[160px] text-center text-white">
        <span className="inline-flex items-center gap-1.5 text-xs bg-white/15 rounded-full px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
          Platform Aspirasi Warga Digital
        </span>

        <h1 className="mt-3 text-3xl font-bold leading-tight">
          Suara Warga,
          <br />
          Aksi Nyata
        </h1>

        <p className="mt-3 text-sm text-white/85 leading-relaxed">
          Sampaikan aspirasi atau laporkan masalah, dan pantau pembangunan desa
          Anda secara <span className="italic">real-time</span>. Bersama
          membangun Desa Jarak yang lebih baik.
        </p>

        <div className="mt-4 flex gap-3">
          <Link
            to="/aspirasi"
            className="flex-1 flex items-center justify-center gap-1.5 bg-accent-500 text-white font-semibold text-sm rounded-full py-2.5"
          >
            <Plus size={16} /> Buat Pengaduan
          </Link>
          <Link
            to="/riwayat"
            className="flex-1 flex items-center justify-center gap-1.5 bg-white/15 text-white font-semibold text-sm rounded-full py-2.5"
          >
            <History size={16} /> Riwayat Aspirasi
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 sm:px-6 -mt-[150px]">
        {stats.map(({ icon: Icon, value, label, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <span className={`h-9 w-9 rounded-xl ${bg} text-white flex items-center justify-center shrink-0`}>
              <Icon size={18} />
            </span>
            <div>
              <p className="text-lg font-bold leading-none">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pengaduan Terbaru */}
      <div className="flex items-center justify-between px-4 sm:px-6 mt-6 mb-2">
        <h2 className="font-semibold text-brand-800">Pengaduan Terbaru</h2>
        <Link to="/lacak" className="text-sm text-brand-700 flex items-center gap-0.5">
          Lihat semua <ChevronRight size={15} />
        </Link>
      </div>
      <div className="px-4 sm:px-6 grid gap-3 md:grid-cols-2">
        {laporanTerbaru.map((l) => (
          <Link
            key={l.id}
            to={`/lacak/${String(l.id).replace("#", "")}`}
            className="bg-white rounded-2xl p-4 shadow-sm block"
          >
            <div className="flex items-center gap-2 text-xs mb-2">
              <span className="text-gray-500">{l.id}</span>
              <span className={`rounded-full px-2 py-0.5 font-medium ${statusColor[l.status]}`}>
                {l.status}
              </span>
              <span className="bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 font-medium">{l.kategori}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-gray-800">{l.judul}</p>
              <span className="flex flex-col items-center text-brand-700 shrink-0">
                <ThumbsUp size={16} />
                <span className="text-xs mt-0.5">{l.dukungan}</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">{l.lokasi} &nbsp;·&nbsp; {l.tanggal}</p>
          </Link>
        ))}
      </div>

      {/* CTA laporkan */}
      <div className="mx-4 sm:mx-6 mt-5 rounded-2xl bg-gradient-to-br from-brand-800 to-brand-600 p-5 text-white relative overflow-hidden">
        <p className="font-semibold text-base">Punya keluhan atau aspirasi?</p>
        <p className="text-sm text-white/80 mt-1 leading-relaxed max-w-[85%]">
          Laporkan masalah di sekitar Anda lengkap dengan foto dan lokasi GPS
          melalui <span className="italic">Geotagging</span> untuk penanganan
          lebih cepat.
        </p>
        <Link
          to="/aspirasi"
          className="inline-block mt-3 bg-accent-500 text-sm font-semibold rounded-full px-5 py-2"
        >
          Mulai Laporan
        </Link>
      </div>

      {/* Berita Desa */}
      <div className="flex items-center justify-between px-4 sm:px-6 mt-6 mb-2">
        <h2 className="font-semibold text-brand-800">Berita Desa</h2>
        <Link to="/berita" className="text-sm text-brand-700 flex items-center gap-0.5">
          Lihat semua <ChevronRight size={15} />
        </Link>
      </div>
      <div className="px-4 sm:px-6 grid gap-3 md:grid-cols-3">
        {berita.map((b) => (
          <Link
            key={b.id}
            to={`/berita/${b.id}`}
            className="bg-white rounded-2xl p-3 flex gap-3 items-center shadow-sm"
          >
            <img src={b.image} alt={b.judul} className="h-14 w-14 rounded-xl object-cover shrink-0" />
            <div>
              <span className="inline-block text-xs bg-sky-100 text-sky-600 rounded-full px-2 py-0.5 font-medium">
                {b.kategori}
              </span>
              <p className="text-sm font-semibold text-gray-800 mt-1">{b.judul}</p>
              <p className="text-xs text-gray-400 mt-0.5">{b.tanggal}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 px-4 sm:px-6 mt-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-brand-800">Informasi Desa</h2>
            <Link to="/info-desa" className="text-sm text-brand-700 flex items-center gap-0.5">
              Lihat semua <ChevronRight size={15} />
            </Link>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 p-5 text-white h-[calc(100%-2rem)]">
            <div className="flex items-center gap-3">
              <span className="h-11 w-11 rounded-full bg-white/20 flex items-center justify-center text-lg">
                🏠
              </span>
              <div>
                <p className="font-semibold">Desa {profilDesa.namaDesa}</p>
                <p className="text-xs text-white/80">
                  Kec. {profilDesa.kecamatan}, Kab. {profilDesa.kabupaten}
                </p>
                <p className="text-xs text-white/80">Luas {profilDesa.luasWilayah}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-white/15 rounded-xl px-3 py-2.5">
                <p className="font-bold">{profilDesa.totalPenduduk.toLocaleString("id-ID")}</p>
                <p className="text-xs text-white/80">Total Penduduk</p>
              </div>
              <div className="bg-white/15 rounded-xl px-3 py-2.5">
                <p className="font-bold">{profilDesa.kk.toLocaleString("id-ID")}</p>
                <p className="text-xs text-white/80">Kartu Keluarga</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-brand-800">Reward</h2>
            <Link to="/reward" className="text-sm text-brand-700 flex items-center gap-0.5">
              Lihat detail <ChevronRight size={15} />
            </Link>
          </div>
          <div className="rounded-2xl border border-accent-500/40 bg-amber-50 p-5 h-[calc(100%-2rem)]">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              <Trophy size={16} className="text-accent-500" /> Poin Reward Anda
            </p>
            <p className="text-3xl font-bold mt-1">1.000</p>
            <p className="text-xs text-gray-500">Peringkat #12 dari 500 warga</p>
            <div className="h-1.5 rounded-full bg-amber-100 mt-3 overflow-hidden">
              <div className="h-full w-[55%] bg-accent-500 rounded-full" />
            </div>
            <Link to="/reward" className="block text-right text-xs font-medium text-accent-600 mt-2">
              Lihat detail reward &gt;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
