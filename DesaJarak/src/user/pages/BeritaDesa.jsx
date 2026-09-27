import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Calendar, MapPin } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { mapAdminNews } from "../data/berita";
import { getNews } from "../../utils/api.js";

const kategoriWarna = {
  Pembangunan: "bg-accent-500 text-white",
  Keuangan: "bg-brand-700 text-white",
  Ekonomi: "bg-sky-500 text-white",
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

      <div className="px-4 sm:px-6 -mt-[150px]">
        <div className="flex gap-2.5 mb-3">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-full px-4 py-2.5 shadow-sm">
            <Search size={16} className="text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari judul berita..."
              className="flex-1 text-sm outline-none placeholder:text-gray-400"
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
              className={`shrink-0 text-xs font-medium rounded-full px-3 py-1 ${
                active === f ? "bg-brand-700 text-white" : "bg-white text-gray-500"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="relative h-36 bg-gray-200">
                <img src={b.image} alt={b.judul} className="w-full h-full object-cover" />
                <span
                  className={`absolute top-3 right-3 text-xs font-semibold rounded-full px-3 py-1 ${
                    kategoriWarna[b.kategori] ?? "bg-brand-700 text-white"
                  }`}
                >
                  {b.kategori}
                </span>
              </div>
              <div className="p-4">
                <p className="font-semibold text-gray-800">{b.judul}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                  {b.ringkasan}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} /> {b.tanggal}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={13} /> {b.lokasi}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <Link to={`/berita/${b.id}`} className="text-xs font-medium text-brand-700">
                    Komentar ({b.komentar.reduce((count, comment) => count + 1 + (comment.replies || []).length, 0)})
                  </Link>
                  <Link
                    to={`/berita/${b.id}`}
                    className="text-xs font-medium text-brand-700 flex items-center gap-0.5"
                  >
                    Lihat Detail &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="md:col-span-full text-center text-sm text-gray-400 py-10">
              Tidak ada berita ditemukan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
