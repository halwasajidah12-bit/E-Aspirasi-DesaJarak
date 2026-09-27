import { useState } from "react";
import PageHeader from "../components/PageHeader";

const tabs = ["Semua", "Aspirasi", "Vote", "Komentar"];

const items = [
  { tag: "Laporan", judul: "Kehilangan KTP", tanggal: "5 Sep 2026" },
  { tag: "Komentar", judul: "Antusias Warga pada Lomba Agustus", tanggal: "18 Agustus 2026" },
  { tag: "Vote", judul: "Pelatihan UMKM Desa Diikuti 85 Peserta", tanggal: "2 Agustus 2026" },
];

const tagFor = { Laporan: "Aspirasi", Komentar: "Komentar", Vote: "Vote" };

export default function Riwayat() {
  const [tab, setTab] = useState("Semua");
  const filtered = items.filter((i) => tab === "Semua" || tagFor[i.tag] === tab);

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
          {filtered.map((i, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-3 flex gap-3 items-center shadow-sm">
              <div className="h-14 w-14 rounded-xl bg-gray-200 shrink-0" />
              <div>
                <span className="inline-block text-xs bg-sky-100 text-sky-600 rounded-full px-2 py-0.5 font-medium">
                  {i.tag}
                </span>
                <p className="text-sm font-semibold text-gray-800 mt-1">{i.judul}</p>
                <p className="text-xs text-gray-400 mt-0.5">{i.tanggal}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-10">Belum ada riwayat.</p>
          )}
        </div>
      </div>
    </div>
  );
}
