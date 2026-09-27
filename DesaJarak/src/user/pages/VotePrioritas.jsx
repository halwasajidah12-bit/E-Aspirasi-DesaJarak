import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Filter } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ReportCard from "../components/ReportCard";
import { laporanData } from "../data/laporan";

const filters = ["Terbaru", "2 Bulan Terakhir", "Prioritas"];

export default function VotePrioritas() {
  const [active, setActive] = useState("Terbaru");
  const [query, setQuery] = useState("");

  const laporan = useMemo(() => {
    const q = query.toLowerCase();
    let list = laporanData.filter(
      (l) => !q || l.judul.toLowerCase().includes(q) || l.lokasi.toLowerCase().includes(q)
    );
    if (active === "Prioritas") {
      list = [...list].sort((a, b) => b.dukungan - a.dukungan);
    }
    // "Terbaru" & "2 Bulan Terakhir" pakai urutan data apa adanya karena
    // semua contoh laporan dummy ini memang berada dalam 2 bulan terakhir.
    return list;
  }, [active, query]);

  return (
    <div className="pb-8">
      <PageHeader title="Aspirasi Prioritas" subtitle="Suaramu menjadi satu pertimbangan" />

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

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-4">
          <span className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
            <Filter size={13} /> Kategori :
          </span>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`shrink-0 text-xs font-medium rounded-full px-3 py-1 ${
                active === f ? "bg-brand-700 text-white" : "bg-white text-gray-500"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {laporan.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
          {laporan.length === 0 && (
            <p className="md:col-span-full text-center text-sm text-gray-400 py-10">
              Tidak ada laporan ditemukan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}