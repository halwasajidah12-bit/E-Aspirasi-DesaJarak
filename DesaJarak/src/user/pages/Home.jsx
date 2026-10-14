import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, History, FileText, FolderOpen, Loader2, Users, ThumbsUp, ChevronRight, Trophy } from "lucide-react";
import { mapApiReport, statusColor } from "../data/laporan";
import { mapAdminNews } from "../data/berita";
import { profilDesa } from "../data/profilDesa";
import { getNews, getReports, getRewards, getVillageProfile } from "../../utils/api.js";

export default function Home() {
  const [laporanData, setLaporanData] = useState([]);
  const [berita, setBerita] = useState([]);
  const [profil, setProfil] = useState(profilDesa);
  const [reward, setReward] = useState({ points: 0, rank: 0, citizenCount: 0 });

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const [reportsResult, newsResult, profileResult, rewardResult] = await Promise.allSettled([
        getReports("public"), getNews(), getVillageProfile(), getRewards(),
      ]);
      if (!mounted) return;
      if (reportsResult.status === "fulfilled") setLaporanData(reportsResult.value.map(mapApiReport));
      if (newsResult.status === "fulfilled") setBerita(newsResult.value.map(mapAdminNews).slice(0, 3));
      if (rewardResult.status === "fulfilled") setReward(rewardResult.value);
      if (profileResult.status === "fulfilled") {
        const value = profileResult.value;
        const rtRw = String(value.jumlahRtRw || "").match(/\d+/g) || [];
        setProfil((previous) => ({
          ...previous,
          namaDesa: value.namaDesa ?? previous.namaDesa,
          kecamatan: value.kecamatan ?? previous.kecamatan,
          kabupaten: value.kabupaten ?? previous.kabupaten,
          luasWilayah: value.luasWilayah ?? previous.luasWilayah,
          jumlahRt: Number(rtRw[0] ?? previous.jumlahRt),
          totalPenduduk: Number(value.totalPenduduk ?? previous.totalPenduduk),
          kk: Number(value.kk ?? previous.kk),
        }));
      }
    };
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const laporanTerbaru = laporanData.slice(0, 2);
  const stats = [
    { icon: FileText, value: laporanData.length, label: "Total Aspirasi Publik", iconBg: "bg-emerald-50 text-emerald-600", valueClass: "text-gray-800" },
    { icon: FolderOpen, value: laporanData.filter((item) => item.status === "Masuk").length, label: "Aspirasi Masuk", iconBg: "bg-emerald-50 text-emerald-600", valueClass: "text-emerald-600" },
    { icon: Loader2, value: laporanData.filter((item) => item.status === "Diproses").length, label: "Sedang Diproses", iconBg: "bg-amber-50 text-amber-600", valueClass: "text-amber-600" },
    { icon: Users, value: laporanData.filter((item) => item.status === "Selesai").length, label: "Terselesaikan", iconBg: "bg-blue-50 text-blue-600", valueClass: "text-emerald-600" },
  ];

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
              <span className={`text-[9px] font-bold rounded-full px-2 py-0.5 ${statusColor[l.status] || "bg-gray-100 text-gray-700"}`}>
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
        </div>
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
              {b.image && <img src={b.image} alt={b.judul} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
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
              <span className="font-semibold text-gray-800 text-right">{profil.namaDesa}</span>
            </div>
            <div className="py-1.5 flex justify-between gap-3">
              <span className="text-gray-500">Kecamatan / Kabupaten</span>
              <span className="font-semibold text-gray-800 text-right">{profil.kecamatan}, {profil.kabupaten}</span>
            </div>
            <div className="py-1.5 flex justify-between gap-3">
              <span className="text-gray-500">Luas Wilayah</span>
              <span className="font-semibold text-gray-800 text-right">{profil.luasWilayah}</span>
            </div>
            <div className="py-1.5 flex justify-between gap-3">
              <span className="text-gray-500">Total Penduduk</span>
              <span className="font-semibold text-gray-800 text-right">{profil.totalPenduduk.toLocaleString("id-ID")} Jiwa</span>
            </div>
            <div className="py-1.5 flex justify-between gap-3">
              <span className="text-gray-500">Kartu Keluarga</span>
              <span className="font-semibold text-gray-800 text-right">{profil.kk.toLocaleString("id-ID")}</span>
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
          <p className="text-2xl font-extrabold text-gray-800">{Number(reward.points || 0).toLocaleString("id-ID")}</p>
          <p className="text-[10px] text-gray-500">Peringkat #{reward.rank || "–"} dari {reward.citizenCount || 0} warga</p>
          <div className="h-1.5 rounded-full bg-amber-100 mt-2 overflow-hidden">
            <div className="h-full w-[55%] bg-amber-500 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
