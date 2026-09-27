import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Filter } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ReportCard from "../components/ReportCard";
import { kategoriList, mapApiReport } from "../data/laporan";
import { getReports } from "../../utils/api.js";

const statusFilters = ["Semua", "Masuk", "Diproses", "Selesai", "Ditolak"];

export default function LacakLaporan() {
  const [laporanData, setLaporanData] = useState([]);
  const [status, setStatus] = useState("Semua");
  const [kategori, setKategori] = useState("Semua");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    const refreshReports = () => {
      getReports()
        .then((items) => {
          if (mounted) setLaporanData(items.map(mapApiReport));
        })
        .catch(() => {});
    };
    refreshReports();
    const interval = setInterval(refreshReports, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const kategoriFilters = ["Semua", ...new Set([...kategoriList, ...laporanData.map((item) => item.kategori)])];

  const filtered = laporanData.filter((l) => {
    const q = query.toLowerCase();
    const matchQuery =
      !q ||
      l.judul.toLowerCase().includes(q) ||
      l.lokasi.toLowerCase().includes(q) ||
      String(l.id).toLowerCase().includes(q);
    return (
      matchQuery &&
      (status === "Semua" || l.status === status) &&
      (kategori === "Semua" || l.kategori === kategori)
    );
  });

  return (
    <div className="pb-8">
      <PageHeader title="Lacak Laporan" subtitle="Cari laporan dan beri vote prioritas"/>

      <div className="px-4 sm:px-6 -mt-[150px]">
        <div className="flex gap-2.5 mb-3">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-full px-4 py-2.5 shadow-sm">
            <Search size={16} className="text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari Judul, Jalan, nomor, RT/RW...."
              className="flex-1 text-sm outline-none placeholder:text-gray-400"
            />
          </div>
          <Link
            to="/aspirasi"
            aria-label="Buat laporan"
            className="h-10 w-10 rounded-full bg-brand-700 text-white flex items-center justify-center shrink-0"
          >
            <Plus size={20} />
          </Link>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-2">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`shrink-0 text-sm font-medium rounded-full px-4 py-1.5 ${
                status === s ? "bg-brand-700 text-white" : "bg-white text-gray-500"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-4">
          <span className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
            <Filter size={13} /> Kategori :
          </span>
          {kategoriFilters.map((k) => (
            <button
              key={k}
              onClick={() => setKategori(k)}
              className={`shrink-0 text-xs font-medium rounded-full px-3 py-1 ${
                kategori === k ? "bg-brand-700 text-white" : "bg-white text-gray-500"
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r, i) => (
            <ReportCard key={i} report={r} />
          ))}
          {filtered.length === 0 && (
            <p className="md:col-span-full text-center text-sm text-gray-400 py-10">Tidak ada laporan ditemukan.</p>
          )}
        </div>
      </div>
    </div>
  );
}