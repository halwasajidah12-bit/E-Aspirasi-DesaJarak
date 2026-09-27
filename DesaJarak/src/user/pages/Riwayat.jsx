import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { getReports } from "../../utils/api.js";
import { mapApiReport } from "../data/laporan";

const tabs = ["Semua", "Masuk", "Diproses", "Selesai", "Ditolak"];

export default function Riwayat({ session }) {
  const [tab, setTab] = useState("Semua");
  const [reports, setReports] = useState([]);

  useEffect(() => {
    let mounted = true;
    const refreshReports = () => {
      getReports()
        .then((items) => {
          if (mounted) setReports(items.map(mapApiReport).filter((item) => item.ownerId === session?.userId));
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

      <div className="px-4 -mt-[140px]">
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 text-sm font-medium rounded-full px-4 py-1.5 ${
                tab === t ? "bg-brand-700 text-white" : "bg-white text-gray-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((report) => (
            <article key={report.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">#{report.id}</p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">{report.judul}</p>
                  <p className="mt-1 text-xs text-gray-400">{report.tanggal} · {report.lokasi}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  report.status === "Selesai" ? "bg-emerald-100 text-emerald-700" :
                  report.status === "Ditolak" ? "bg-rose-100 text-rose-700" :
                  report.status === "Diproses" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"
                }`}>{report.status}</span>
              </div>
              <div className="mt-3 border-l-2 border-brand-100 pl-3 space-y-2">
                {(report.statusHistory.length ? report.statusHistory : [{ status: report.status, time: "", reply: report.tanggapan }]).map((progress, index) => (
                  <div key={`${progress.time}-${index}`}>
                    <p className="text-xs font-semibold text-gray-700">{progress.status}</p>
                    {progress.time && <p className="text-[10px] text-gray-400">{new Date(progress.time).toLocaleString("id-ID")}</p>}
                    {progress.reply && <p className="mt-1 text-xs text-gray-600">Tanggapan admin: {progress.reply}</p>}
                  </div>
                ))}
              </div>
              <Link to={`/lacak/${String(report.id).replace("#", "")}`} className="mt-3 inline-block text-xs font-semibold text-brand-700">
                Buka laporan
              </Link>
            </article>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-10">Belum ada riwayat.</p>
          )}
        </div>
      </div>
    </div>
  );
}
