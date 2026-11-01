
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Filter } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ReportCard from "../components/ReportCard";
import { mapApiReport } from "../data/laporan";
import { getReports } from "../../utils/api.js";

const filters = ["Terbaru", "2 Bulan Terakhir", "Prioritas"];

export default function VotePrioritas({ session }) {
  const [active, setActive] = useState("Terbaru");
  const [query, setQuery] = useState("");
  const [laporanData, setLaporanData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mengambil laporan langsung dari backend
  useEffect(() => {
    let mounted = true;

    const refreshReports = () => {
      getReports()
        .then((items) => {
          if (mounted) {
            setLaporanData(items.map(mapApiReport));
            setLoading(false);
          }
        })
        .catch((error) => {
          console.error("Gagal mengambil laporan:", error);
          if (mounted) setLoading(false);
        });
    };

    refreshReports();

    // Memperbarui data setiap 3 detik
    const interval = setInterval(refreshReports, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
  };
  }, []);

  const laporan = useMemo(() => {
    const q = query.toLowerCase();

    let list = laporanData.filter(
      (l) =>
        !q ||
        String(l.judul || "").toLowerCase().includes(q) ||
        String(l.lokasi || "").toLowerCase().includes(q)
    );

    if (active === "Prioritas") {
  const urgencyWeight = {
    Tinggi: 3,
    Sedang: 2,
    Rendah: 1,
    Biasa: 1,
  };

  list = [...list].sort((a, b) => {
    const priorityA = urgencyWeight[a.urgency] || 0;
    const priorityB = urgencyWeight[b.urgency] || 0;

    // Prioritas AI menjadi pertimbangan utama
    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }

    // Jika prioritas sama, hitung dukungan dan komentar
    const engagementA =
      Number(a.dukungan || 0) * 2 +
      Number(a.comments || 0);

    const engagementB =
      Number(b.dukungan || 0) * 2 +
      Number(b.comments || 0);

    return engagementB - engagementA;
  });
}

    return list;
  }, [active, query, laporanData]);

  return (
    <div className="pb-8">
      <PageHeader
        title="Aspirasi Prioritas"
        subtitle="Suaramu menjadi satu pertimbangan"
      />

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

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-4">
          <span className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
            <Filter size={13} /> Kategori :
          </span>

          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`shrink-0 text-xs rounded-xl px-3 py-1.5 transition ${
                active === f
                  ? "bg-emerald-600 text-white font-bold shadow-sm"
                  : "bg-white border border-gray-200 text-gray-700 font-medium"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <p className="md:col-span-full text-center text-xs text-gray-500 py-8">
              Memuat laporan...
            </p>
          ) : (
            <>
              {laporan.map((r) => (
                <ReportCard key={r.id} report={r} session={session} />
              ))}

              {laporan.length === 0 && (
                <p className="md:col-span-full text-center text-xs text-gray-500 font-medium py-8 bg-white rounded-2xl border border-gray-100">
                  Tidak ada laporan ditemukan.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
