
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, ThumbsUp } from "lucide-react";
import { statusColor } from "../data/laporan";
import { toggleReportVote } from "../../utils/api.js";

export default function ReportCard({ report, session }) {
  const ownerId = session?.userId || "";

  const [didukung, setDidukung] = useState(
    (report.voterIds || []).includes(ownerId)
  );
 const [dukungan, setDukungan] = useState(
  Number(report.votes ?? report.dukungan ?? 0)
);
  const [loadingVote, setLoadingVote] = useState(false);

 useEffect(() => {
  setDukungan(Number(report.votes ?? report.dukungan ?? 0));
  setDidukung((report.voterIds || []).includes(ownerId));
}, [report.votes, report.dukungan, report.voterIds, ownerId]);

  const toggleDukungan = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!ownerId) {
      alert("Silakan login terlebih dahulu untuk mendukung laporan.");
      return;
    }

    if (loadingVote) return;

    setLoadingVote(true);

    try {
      const result = await toggleReportVote(report.id, ownerId);

      setDidukung(result.supported);
      setDukungan(Number(result.votes || 0));
    } catch (error) {
      alert(error.message || "Gagal menyimpan dukungan.");
    } finally {
      setLoadingVote(false);
    }
  };
const jumlahKomentar = Number(
  report.comments ?? report.commentsList?.length ?? 0
);
  return (
    <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-sm space-y-2.5">
      <div className="flex justify-between items-start gap-2">
        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {report.id}
        </span>

        <div className="flex gap-1">
          <span className="text-[9px] font-bold bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
            {report.kategori}
          </span>

          <span className={`text-[9px] font-bold rounded-full px-2 py-0.5 ${statusColor[report.status]}`}>
            {report.status}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        {report.foto ? (
          <img
            src={report.foto}
            alt={report.judul}
            className="h-16 w-16 rounded-xl object-cover shrink-0"
          />
        ) : (
          <div className="h-16 w-16 rounded-xl bg-gray-100 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-800">{report.judul}</p>
          <p className="text-xs text-gray-600 leading-relaxed mt-1 line-clamp-2">
            {report.deskripsi}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
        <span className="flex items-center gap-1">
          <Calendar size={12} /> {report.tanggal}
        </span>

        <span className="flex items-center gap-1">
          <MapPin size={12} /> {report.lokasi}
        </span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
       <span className="text-xs text-gray-500">
      {dukungan} Dukungan Warga ·{" "} {Number(report.comments ?? report.commentsList?.length ?? report.komentar?.length ?? 0)} Komentar
      </span>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDukungan}
            disabled={loadingVote}
            aria-label={didukung ? "Batalkan dukungan" : "Dukung laporan"}
            className={`transition active:scale-90 disabled:opacity-50 ${
              didukung
                ? "text-emerald-600"
                : "text-gray-400 hover:text-emerald-600"
            }`}
          >
            <ThumbsUp
              size={16}
              fill={didukung ? "currentColor" : "none"}
            />
          </button>

          <Link
            to={`/lacak/${String(report.id).replace("#", "")}`}
            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-2.5 py-1 rounded-lg text-xs"
          >
            Detail &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
