import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, ThumbsUp } from "lucide-react";
import { statusColor } from "../data/laporan";
import { toggleReportVote } from "../../utils/api.js";

export default function ReportCard({ report }) {
  const [didukung, setDidukung] = useState(Boolean(report.votedByMe));
  const [dukungan, setDukungan] = useState(report.dukungan);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDidukung(Boolean(report.votedByMe));
    setDukungan(report.dukungan);
  }, [report.votedByMe, report.dukungan]);

  const toggleDukungan = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    setError("");
    try {
      const updated = await toggleReportVote(report.id);
      setDukungan(updated.votes || 0);
      setDidukung(Boolean(updated.votedByMe));
    } catch (requestError) {
      setError(requestError.message || "Dukungan gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

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
          <p className="text-xs text-gray-600 leading-relaxed mt-1 line-clamp-2">{report.deskripsi}</p>
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
        <span className="text-xs text-gray-500">{dukungan} Dukungan Warga</span>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDukungan}
            disabled={saving}
            aria-label={didukung ? "Batalkan dukungan" : "Dukung laporan"}
            className={`transition active:scale-90 disabled:opacity-50 ${didukung ? "text-emerald-600" : "text-gray-400 hover:text-emerald-600"}`}
          >
            <ThumbsUp size={16} fill={didukung ? "currentColor" : "none"} />
          </button>
          <Link
            to={`/lacak/${String(report.id).replace("#", "")}`}
            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-2.5 py-1 rounded-lg text-xs"
          >
            Detail &rarr;
          </Link>
        </div>
      </div>
      {error && <p className="text-[10px] text-rose-600">{error}</p>}
    </div>
  );
}
