import { useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Send } from "lucide-react";
import { beritaData } from "../data/berita";

export default function BeritaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const berita = beritaData.find((b) => String(b.id) === String(id));

  const [komentar, setKomentar] = useState(berita?.komentar ?? []);
  const [teks, setTeks] = useState("");

  if (!berita) return <Navigate to="/berita" replace />;

  const kirimKomentar = (e) => {
    e.preventDefault();
    if (!teks.trim()) return;
    setKomentar((k) => [
      ...k,
      { nama: "Anda", waktu: "Baru saja", teks: teks.trim() },
    ]);
    setTeks("");
  };

  return (
    <div className="pb-8">
      <div className="relative h-56 bg-gray-200">
        <img src={berita.image} alt={berita.judul} className="w-full h-full object-cover" />
        <button
          onClick={() => navigate(-1)}
          aria-label="Kembali"
          className="absolute top-4 left-4 h-9 w-9 rounded-full bg-white/90 text-brand-700 flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="absolute top-4 right-4 text-xs font-semibold rounded-full px-3 py-1 bg-brand-700 text-white">
          {berita.kategori}
        </span>
      </div>

      <div className="mx-4 -mt-6 bg-white rounded-3xl shadow-sm p-5">
        <h1 className="text-lg font-bold text-gray-800 leading-snug">{berita.judul}</h1>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
          <span className="flex items-center gap-1">
            <Calendar size={13} /> {berita.tanggal}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={13} /> {berita.lokasi}
          </span>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mt-4">{berita.konten}</p>

        <div className="mt-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Komentar ({komentar.length})
          </p>
          <div className="space-y-3">
            {komentar.map((k, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">{k.nama}</span>
                  <span className="text-xs text-gray-400">{k.waktu}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{k.teks}</p>
              </div>
            ))}
            {komentar.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-4">Belum ada komentar.</p>
            )}
          </div>

          <form onSubmit={kirimKomentar} className="flex items-center gap-2 mt-4">
            <input
              value={teks}
              onChange={(e) => setTeks(e.target.value)}
              placeholder="Tulis komentar..."
              className="input flex-1"
            />
            <button
              type="submit"
              aria-label="Kirim komentar"
              className="h-10 w-10 rounded-full bg-brand-700 text-white flex items-center justify-center shrink-0"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
