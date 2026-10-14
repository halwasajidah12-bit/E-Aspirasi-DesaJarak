import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import ProtectedImage from "../components/ProtectedImage.jsx";
import { getReports } from "../../utils/api.js";
import { mapApiReport } from "../data/laporan";

const tabs = ["Semua", "Masuk", "Diproses", "Selesai", "Ditolak"];

export default function Riwayat({ session }) {
  const [tab, setTab] = useState("Semua");
  const [reports, setReports] = useState([]);

  useEffect(() => {
    let mounted = true;
    const refreshReports = () => {
      getReports('mine')
        .then((items) => {
          if (mounted) setReports(items.map(mapApiReport));
        })
        .catch(() => {});
    };
    refreshReports();
    const interval = setInterval(refreshReports, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [session?.userId]);

  const filtered = reports.filter((report) => tab === "Semua" || report.status === tab);

  return (
    <div className="pb-8">
      <PageHeader title="Riwayat" subtitle="Pantau riwayat Anda" />

      <div className="px-4 sm:px-6 mt-3.5">
        {session?.role === "guest" && <p className="mb-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">Masuk ke akun warga untuk melihat riwayat aspirasi pribadi.</p>}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 text-xs rounded-xl px-3.5 py-1.5 transition ${
                tab === t ? "bg-emerald-600 text-white font-bold shadow-sm" : "bg-white border border-gray-200 text-gray-700 font-medium"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((report) => (
            <article key={report.id} className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-block text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">#{report.id}</span>
                  <p className="mt-1.5 text-xs font-bold text-gray-800">{report.judul}</p>
                  <p className="mt-1 text-[10px] text-gray-400 font-medium">{report.tanggal} · {report.lokasi}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                  report.status === "Selesai" ? "bg-emerald-100 text-emerald-800" :
                  report.status === "Ditolak" ? "bg-gray-200 text-gray-700" :
                  report.status === "Diproses" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                }`}>{report.status}</span>
              </div>
              <div className="mt-3 border-l-2 border-emerald-200 pl-3 space-y-2">
                {(report.statusHistory.length ? report.statusHistory : [{ status: report.status, time: "", reply: report.tanggapan }]).map((progress, index) => (
                  <div key={`${progress.time}-${index}`}>
                    <p className="text-xs font-semibold text-gray-700">{progress.status}</p>
                    {progress.time && <p className="text-[10px] text-gray-400">{new Date(progress.time).toLocaleString("id-ID")}</p>}
                    {progress.reply && <p className="mt-1 text-xs text-gray-600">Tanggapan admin: {progress.reply}</p>}
                  </div>
                ))}
              </div>
              {report.foto && (
                <div className="mt-3 overflow-hidden rounded-xl bg-gray-100">
                  <ProtectedImage
                    src={report.foto}
                    privateAccess={report.visibility === "private"}
                    alt={`Foto laporan ${report.judul}`}
                    className="max-h-64 w-full object-contain"
                  />
                </div>
              )}
              <Link to={`/lacak/${String(report.id).replace("#", "")}`} className="mt-3 inline-block text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg">
                Buka laporan
              </Link>
            </article>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-xs text-gray-500 font-medium py-8 bg-white rounded-2xl border border-gray-100">Belum ada riwayat.</p>
          )}
        </div>
      </div>
    </div>
  );
}
