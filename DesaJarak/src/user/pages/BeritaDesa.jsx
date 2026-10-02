import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Calendar, MapPin } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { mapAdminNews } from "../data/berita";
import { getNews } from "../../utils/api.js";

const kategoriWarna = {
  Pembangunan: "bg-amber-100 text-amber-800",
  Keuangan: "bg-emerald-100 text-emerald-800",
  Ekonomi: "bg-blue-100 text-blue-800",
};

export default function BeritaDesa() {
  const [beritaData, setBeritaData] = useState([]);
  const [active, setActive] = useState("Semua");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    const refreshNews = () => {
      getNews()
        .then((items) => {
          if (mounted) setBeritaData(items.filter((item) => ["Tayang", "Publish"].includes(item.status)).map(mapAdminNews));
        })
        .catch(() => {});
    };
    refreshNews();
    const interval = setInterval(refreshNews, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const kategoriFilters = ["Semua", ...new Set(beritaData.map((b) => b.kategori))];

  const filtered = beritaData.filter(
    (b) =>
      (active === "Semua" || b.kategori === active) &&
      b.judul.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="pb-8">
      <PageHeader title="Berita Desa" subtitle="Kegiatan pada desa" />

      <div className="px-4 sm:px-6 mt-3.5">
        <div className="flex gap-2.5 mb-3">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2.5 shadow-sm focus-within:border-emerald-500">
            <Search size={16} className="text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari judul berita..."
              className="flex-1 text-xs outline-none bg-transparent placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-4">
          <span className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
            <Filter size={13} /> Kategori :
          </span>
          {kategoriFilters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`shrink-0 text-xs rounded-xl px-3 py-1.5 transition ${
                active === f ? "bg-emerald-600 text-white font-bold shadow-sm" : "bg-white border border-gray-200 text-gray-700 font-medium"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
              <div className="relative h-36 bg-gray-200">
                <img src={b.image} alt={b.judul} className="w-full h-full object-cover" />
                <span
                  className={`absolute top-3 right-3 text-[10px] font-bold rounded-full px-2.5 py-1 shadow-sm ${
                    kategoriWarna[b.kategori] ?? "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {b.kategori}
                </span>
              </div>
              <div className="p-3.5">
                <p className="text-xs font-bold text-gray-800">{b.judul}</p>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">
                  {b.ringkasan}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} /> {b.tanggal}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={13} /> {b.lokasi}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100">
                  <Link to={`/berita/${b.id}`} className="text-xs font-semibold text-emerald-700 hover:underline">
                    Komentar ({b.komentar.reduce((count, comment) => count + 1 + (comment.replies || []).length, 0)})
                  </Link>
                  <Link
                    to={`/berita/${b.id}`}
                    className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-0.5"
                  >
                    Lihat Detail &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="md:col-span-full text-center text-xs text-gray-500 font-medium py-8 bg-white rounded-2xl border border-gray-100">
              Tidak ada berita ditemukan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}