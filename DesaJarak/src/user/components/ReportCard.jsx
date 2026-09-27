import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, ThumbsUp } from "lucide-react";
import { statusColor } from "../data/laporan";

export default function ReportCard({ report }) {
  const [didukung, setDidukung] = useState(false);
  const [dukungan, setDukungan] = useState(report.dukungan);

  const toggleDukungan = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDukungan((n) => (didukung ? n - 1 : n + 1));
    setDidukung((v) => !v);
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold text-gray-500">{report.id}</span>
        <div className="flex gap-1.5">
          <span className="text-xs font-medium bg-brand-100 text-brand-800 rounded-full px-2.5 py-0.5">
            {report.kategori}
          </span>
          <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${statusColor[report.status]}`}>
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
          <div className="h-16 w-16 rounded-xl bg-gray-200 shrink-0" />
        )}
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-800">{report.judul}</p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{report.deskripsi}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar size={13} /> {report.tanggal}
        </span>
        <span className="flex items-center gap-1">
          <MapPin size={13} /> {report.lokasi}
        </span>
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-500">{dukungan} Dukungan Warga</span>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDukungan}
            aria-label={didukung ? "Batalkan dukungan" : "Dukung laporan"}
            className={didukung ? "text-brand-700" : "text-gray-400"}
          >
            <ThumbsUp size={16} fill={didukung ? "currentColor" : "none"} />
          </button>
          <Link
            to={`/lacak/${String(report.id).replace("#", "")}`}
            className="text-xs font-medium text-brand-700 flex items-center gap-0.5"
          >
            Lihat Detail &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
