import { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Send } from "lucide-react";
import { countNewsComments, mapAdminNews } from "../data/berita";
import { addNewsComment, getNews } from "../../utils/api.js";

export default function BeritaDetail({ session }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [berita, setBerita] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teks, setTeks] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const refreshNews = () => {
      getNews()
        .then((items) => {
          const item = items.find((entry) => String(entry.id) === String(id) && ["Tayang", "Publish"].includes(entry.status));
          if (mounted) {
            setBerita(item ? mapAdminNews(item) : null);
            setLoading(false);
          }
        })
        .catch(() => {
          if (mounted) setLoading(false);
        });
    };
    refreshNews();
    const interval = setInterval(refreshNews, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [id]);

  if (loading) return <div className="p-8 text-center text-sm text-gray-500">Memuat berita...</div>;
  if (!berita) return <Navigate to="/berita" replace />;

  const kirimKomentar = async (e) => {
    e.preventDefault();
    if (!teks.trim()) return;
    setError("");
    try {
      const updated = await addNewsComment(id, {
        name: session?.name || "Warga Desa",
        role: "user",
        text: teks.trim(),
      });
      setBerita(mapAdminNews(updated));
      setTeks("");
    } catch (requestError) {
      setError(requestError.message || "Komentar gagal dikirim.");
    }
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
            Komentar ({countNewsComments(berita.komentar)})
          </p>
          <div className="space-y-3">
            {berita.komentar.map((k, i) => (
              <div key={k.id || i} className="bg-gray-50 rounded-2xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">{k.name}</span>
                  <span className="text-xs text-gray-400">{k.time}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{k.text}</p>
                {(k.replies || []).map((reply) => (
                  <div key={reply.id} className="ml-3 mt-3 border-l-2 border-brand-200 pl-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-800">{reply.name}</span>
                      <span className="text-xs text-gray-400">{reply.time}</span>
                    </div>
                    {reply.quotedText && (
                      <blockquote className="mt-1 border-l-2 border-gray-300 pl-2 text-xs text-gray-500">
                        {reply.quotedName}: {reply.quotedText}
                      </blockquote>
                    )}
                    <p className="text-sm text-gray-600 mt-1">{reply.text}</p>
                  </div>
                ))}
              </div>
            ))}
            {berita.komentar.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-4">Belum ada komentar.</p>
            )}
          </div>

          {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}

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
