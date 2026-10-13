import { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Send } from "lucide-react";
import { countNewsComments, mapAdminNews } from "../data/berita";
import { addNewsComment, getNews } from "../../utils/api.js";

export default function BeritaDetail({ session, onRequireLogin }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [berita, setBerita] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teks, setTeks] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

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
    setSending(true);
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
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 py-4 pb-8 space-y-3.5">
      <div className="relative h-52 sm:h-72 rounded-2xl overflow-hidden bg-gray-200 shadow-sm">
        <img src={berita.image} alt={berita.judul} className="w-full h-full object-cover" />
        <button
          onClick={() => navigate(-1)}
          aria-label="Kembali"
          className="absolute top-4 left-4 h-9 w-9 rounded-full bg-white/90 text-brand-700 flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="absolute top-4 right-4 text-[10px] font-bold rounded-full px-2.5 py-1 bg-emerald-100 text-emerald-800 shadow-sm">
          {berita.kategori}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4">
        <h1 className="text-base font-bold text-gray-800 leading-snug">{berita.judul}</h1>
        <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium mt-2">
          <span className="flex items-center gap-1">
            <Calendar size={13} /> {berita.tanggal}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={13} /> {berita.lokasi}
          </span>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mt-4">{berita.konten}</p>

        <div className="mt-6">
          <p className="text-sm font-bold text-emerald-900 mb-3">
            Komentar ({countNewsComments(berita.komentar)})
          </p>
          <div className="space-y-3">
            {berita.komentar.map((k, i) => (
              <div key={k.id || i} className="bg-gray-50 rounded-xl p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">{k.name}</span>
                  <span className="text-xs text-gray-400">{k.time}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{k.text}</p>
                {(k.replies || []).map((reply) => (
                  <div key={reply.id} className="ml-3 mt-3 border-l-2 border-emerald-200 pl-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-gray-800">{reply.name}</span>
                      <span className="text-xs text-gray-400">{reply.time}</span>
                    </div>
                    {reply.quotedText && (
                      <blockquote className="mt-1 border-l-2 border-gray-300 pl-2 text-xs text-gray-500">
                        {reply.quotedName}: {reply.quotedText}
                      </blockquote>
                    )}
                    <p className="text-xs text-gray-600 mt-1">{reply.text}</p>
                  </div>
                ))}
              </div>
            ))}
            {berita.komentar.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-4">Belum ada komentar.</p>
            )}
          </div>

          {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}

          {session?.role === "guest" ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
              <p className="text-xs text-amber-800">Komentar hanya bisa dikirim dengan akun warga.</p>
              <button
                type="button"
                onClick={onRequireLogin}
                className="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
              >
                Masuk atau Daftar Warga
              </button>
            </div>
          ) : (
            <form onSubmit={kirimKomentar} className="flex items-center gap-2 mt-4">
              <input
                value={teks}
                onChange={(e) => setTeks(e.target.value)}
                placeholder="Tulis komentar..."
                disabled={sending}
                className="input flex-1"
              />
              <button
                type="submit"
                disabled={sending || !teks.trim()}
                aria-label="Kirim komentar"
                className="h-10 w-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
