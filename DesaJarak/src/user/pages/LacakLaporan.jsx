import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Filter } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ReportCard from "../components/ReportCard";
import { mapApiReport } from "../data/laporan";
import { getReports, getCategories } from "../../utils/api.js";

const statusFilters = ["Semua", "Masuk", "Diproses", "Selesai", "Ditolak"];

export default function LacakLaporan({ session }) {
  const [laporanData, setLaporanData] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [status, setStatus] = useState("Semua");
  const [kategori, setKategori] = useState("Semua");
  const [query, setQuery] = useState("");

  const handleReportUpdate = (updated) => {
    setLaporanData((items) => items.map((item) => (
      String(item.id) === String(updated.id) ? mapApiReport(updated) : item
    )));
  };

  useEffect(() => {
    let mounted = true;
    
    // Tarik Kategori dari API/Database
    getCategories()
      .then((items) => {
        if (mounted) setDbCategories(items.map(item => item.nama_kategori));
      })
      .catch(() => {});

    // Tarik Laporan
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

  // Filter gabungan dinamis: Ambil dari Master Database + Ambil unik dari laporan yg sudah ada
  const kategoriFilters = ["Semua", ...new Set([...dbCategories, ...laporanData.map((item) => item.kategori)])];

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

      <div className="px-4 sm:px-6 mt-3.5">
        <div className="flex gap-2.5 mb-3">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2.5 shadow-sm focus-within:border-emerald-500">
            <Search size={16} className="text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari Judul, Jalan, nomor, RT/RW...."
              className="flex-1 text-xs outline-none bg-transparent placeholder:text-gray-400"
            />
          </div>
          <Link
            to="/aspirasi"
            aria-label="Buat laporan"
            className="h-10 w-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm transition active:scale-95"
          >
            <Plus size={20} />
          </Link>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-2">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`shrink-0 text-xs rounded-xl px-3.5 py-1.5 transition ${
                status === s ? "bg-emerald-600 text-white font-bold shadow-sm" : "bg-white border border-gray-200 text-gray-700 font-medium"
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
              className={`shrink-0 text-xs rounded-xl px-3 py-1.5 transition ${
                kategori === k ? "bg-emerald-600 text-white font-bold shadow-sm" : "bg-white border border-gray-200 text-gray-700 font-medium"
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <ReportCard key={r.id} report={r} session={session} onReportUpdate={handleReportUpdate} />
          ))}
          {filtered.length === 0 && (
            <p className="md:col-span-full text-center text-xs text-gray-500 font-medium py-8 bg-white rounded-2xl border border-gray-100">Tidak ada laporan ditemukan.</p>
          )}
        </div>
      </div>
    </div>
  );
}