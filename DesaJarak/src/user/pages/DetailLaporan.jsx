import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  ThumbsUp,
  Share2,
  CheckCircle2,
  Image as ImageIcon,
  MessageCircle,
} from "lucide-react";
import { mapApiReport } from "../data/laporan";
import { addReportComment, getReports, toggleReportVote } from "../../utils/api.js";
import ProtectedImage from "../components/ProtectedImage.jsx";

const statusStyle = {
  Selesai: "bg-emerald-100 text-emerald-800",
  Diproses: "bg-amber-100 text-amber-800",
  Masuk: "bg-blue-100 text-blue-800",
  Ditolak: "bg-gray-200 text-gray-700",
};

export default function DetailLaporan({ session }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [voteError, setVoteError] = useState("");
  const [sendingVote, setSendingVote] = useState(false);

  useEffect(() => {
    let mounted = true;
    const refreshReport = () => {
      getReports("accessible")
        .then((items) => {
          const item = items.find((entry) => String(entry.id).replace("#", "") === String(id).replace("#", ""));
          if (mounted) {
            setReport(item ? mapApiReport(item) : null);
            setLoading(false);
          }
        })
        .catch(() => {
          if (mounted) setLoading(false);
        });
    };
    refreshReport();
    const interval = setInterval(refreshReport, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [id]);

  const didukung = Boolean(report?.votedByMe);
  const dukungan = Number(report?.dukungan) || 0;

  const toggleDukungan = async () => {
    setSendingVote(true);
    setVoteError("");
    try {
      const updated = await toggleReportVote(report.id);
      setReport(mapApiReport(updated));
    } catch (error) {
      setVoteError(error.message || "Dukungan gagal disimpan.");
    } finally {
      setSendingVote(false);
    }
  };

  const bagikan = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: report?.judul ?? "Laporan Desa",
          text: `Dukung laporan: ${report?.judul ?? ""}`,
          url,
        });
      } catch {
        /* dibatalkan pengguna */
      }
    } else {
      await navigator.clipboard?.writeText(url);
      alert("Tautan laporan disalin.");
    }
  };

  const kirimKomentar = async (event) => {
    event.preventDefault();
    if (!commentText.trim()) return;
    setSendingComment(true);
    setCommentError("");
    try {
      const updated = await addReportComment(report.id, {
        ownerId: session?.userId,
        name: session?.name || "Warga Desa",
        text: commentText.trim(),
      });
      setReport(mapApiReport(updated));
      setCommentText("");
    } catch (error) {
      setCommentError(error.message || "Komentar gagal dikirim.");
    } finally {
      setSendingComment(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-sm text-gray-500">Memuat laporan...</div>;

  if (!report) {
    return (
      <div className="px-4 sm:px-6 py-4 pb-8 space-y-3.5">
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              aria-label="Kembali"
              className="h-9 w-9 rounded-full bg-white/90 hover:bg-white text-emerald-700 flex items-center justify-center shrink-0 transition active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-base font-bold leading-tight">Detail Laporan</h1>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 text-center">
          <p className="text-sm text-gray-500">
            Laporan dengan ID <b>#{id}</b> tidak ditemukan.
          </p>
          <button
            onClick={() => navigate("/lacak")}
            className="mt-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 font-bold text-xs shadow-md transition active:scale-95"
          >
            Kembali ke Lacak Laporan
          </button>
        </div>
      </div>
    );
  }

  const history = report.statusHistory.length
    ? report.statusHistory
    : [{ status: report.status, time: "", reply: report.tanggapan }];

  return (
    <div className="px-4 sm:px-6 py-4 pb-8 space-y-3.5">
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="h-9 w-9 rounded-full bg-white/90 hover:bg-white text-emerald-700 flex items-center justify-center shrink-0 transition active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="text-base font-bold leading-tight">Detail Laporan</h1>
            <p className="text-xs text-emerald-100">
              #{String(report.id).replace("#", "")} · {report.kategori}
            </p>
          </div>
          <button
            onClick={bagikan}
            aria-label="Bagikan"
            className="h-9 w-9 rounded-full bg-white/90 hover:bg-white text-emerald-700 flex items-center justify-center shrink-0 transition active:scale-95"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            #{String(report.id).replace("#", "")}
          </span>
          <span className="text-[9px] font-bold rounded-full bg-gray-100 text-gray-700 px-2 py-0.5">
            {report.kategori}
          </span>
          <span
            className={`text-[9px] font-bold rounded-full px-2 py-0.5 ${
              statusStyle[report.status] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {report.status}
          </span>
        </div>

        <h2 className="text-sm font-bold text-gray-800 mt-3 leading-snug">
          {report.judul}
        </h2>

        <div className="grid grid-cols-2 gap-2 mt-3 text-[10px] text-gray-400 font-medium">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} /> {report.tanggal ?? "-"}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={13} /> {report.lokasi ?? "-"}
          </span>
        </div>

        <div className="mt-4 rounded-2xl overflow-hidden bg-gray-100 h-44 flex items-center justify-center">
          {report.foto ? (
            <ProtectedImage
              src={report.foto}
              privateAccess={report.visibility === "private"}
              alt={report.judul}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <ImageIcon size={30} />
              <span className="text-xs mt-1">Belum ada foto</span>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-600 leading-relaxed mt-4">
          {report.deskripsi ?? "Tidak ada deskripsi."}
        </p>

        <div className="mt-5 rounded-xl bg-gray-50 p-3.5 grid grid-cols-2 gap-y-3 text-xs">
          <Info label="RT / RW" value={`${report.rt ?? "-"} / ${report.rw ?? "-"}`} />
          <Info label="Waktu" value={report.waktu ?? "-"} />
          <Info label="Tanggal" value={report.tanggal ?? "-"} />
          <Info label="Kategori" value={report.kategori ?? "-"} />
          <Info label="Lokasi" value={report.lokasi ?? "-"} className="col-span-2" />
          {Number.isFinite(report.coordinates?.latitude) && Number.isFinite(report.coordinates?.longitude) && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${report.coordinates.latitude},${report.coordinates.longitude}`)}`}
              target="_blank"
              rel="noreferrer"
              className="col-span-2 text-emerald-700 font-semibold underline"
            >
              Buka titik GPS di peta{report.locationAccuracy != null ? ` · akurasi ±${report.locationAccuracy} m` : ""}
            </a>
          )}
        </div>

        <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs font-bold text-emerald-800">
              {dukungan} Dukungan Warga
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Beri dukungan agar laporan ini diprioritaskan.
            </p>
          </div>
          <button
            onClick={toggleDukungan}
            disabled={sendingVote || session?.role === "guest"}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition active:scale-95 disabled:opacity-50 ${
              didukung
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
            }`}
          >
            <ThumbsUp size={15} /> {sendingVote ? "Menyimpan..." : didukung ? "Didukung" : "Dukung"}
          </button>
        </div>
        {voteError && <p className="mt-2 text-xs text-rose-600">{voteError}</p>}
        {session?.role === "guest" && <p className="mt-2 text-xs text-gray-500">Masuk ke akun warga untuk mendukung laporan.</p>}

        <div className="mt-6">
          <p className="text-sm font-bold text-emerald-900 mb-4">
            Status Penanganan
          </p>
          <div className="relative">
            {history.map((entry, i) => {
              const last = i === history.length - 1;
              return (
                <div key={`${entry.time}-${i}`} className="relative flex gap-3 pb-5 last:pb-0">
                  {!last && (
                    <span
                      className="absolute left-[11px] top-6 bottom-0 w-px bg-emerald-200"
                    />
                  )}
                  <span
                    className="relative z-10 h-6 w-6 rounded-full flex items-center justify-center shrink-0 bg-emerald-600 text-white"
                  >
                    <CheckCircle2 size={14} />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{entry.status}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{entry.time ? new Date(entry.time).toLocaleString("id-ID") : "Status terkini"}</p>
                    {entry.reply && <p className="mt-1 rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-xs text-gray-600">Tanggapan admin: {entry.reply}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <section className="mt-6 rounded-xl border border-gray-100 p-3.5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-900"><MessageCircle size={16} className="text-emerald-600" /> Komentar Warga</h3>
            <span className="text-[10px] text-gray-400">{report.komentar.length} komentar</span>
          </div>
          <div className="space-y-2">
            {report.komentar.map((comment) => (
              <article key={comment.id} className="rounded-xl bg-gray-50 p-3">
                <div className="flex justify-between gap-2 text-xs">
                  <span className="font-bold text-gray-800">{comment.name}</span>
                  <time className="text-gray-400">{comment.time}</time>
                </div>
                <p className="mt-1 text-xs text-gray-600">{comment.text}</p>
              </article>
            ))}
            {!report.komentar.length && <p className="py-3 text-center text-sm text-gray-400">Belum ada komentar.</p>}
          </div>
          {commentError && <p className="mt-2 text-xs text-rose-600">{commentError}</p>}
          {session?.role === "guest" && <p className="mt-3 text-xs text-gray-500">Masuk ke akun warga untuk mengirim komentar.</p>}
          <form onSubmit={kirimKomentar} className="mt-3 flex gap-2">
            <input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Tulis komentar atau masukan warga..."
              disabled={session?.role === "guest"}
              className="input min-w-0 flex-1"
            />
            <button disabled={sendingComment || !commentText.trim() || session?.role === "guest"} className="shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50">
              {sendingComment ? "Mengirim..." : "Kirim"}
            </button>
          </form>
        </section>

        <div className="flex gap-3 mt-6">
          <button
            onClick={bagikan}
            className="flex-1 rounded-xl border border-emerald-300 text-emerald-700 hover:bg-emerald-50 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Share2 size={16} /> Bagikan
          </button>
          <button
            onClick={() => navigate("/lacak")}
            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-3 text-xs font-bold shadow-md transition active:scale-95"
          >
            Lacak Laporan Lain
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, className = "" }) {
  return (
    <div className={className}>
      <p className="text-gray-400">{label}</p>
      <p className="font-medium text-gray-700 mt-0.5">{value}</p>
    </div>
  );
}
