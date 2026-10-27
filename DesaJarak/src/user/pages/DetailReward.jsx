import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Send, ThumbsUp, MessageSquare } from "lucide-react";
import { getRewards } from "../../utils/api.js";

const cara = [
  { icon: ThumbsUp, label: "Berikan Vote", poin: 10 },
  { icon: MessageSquare, label: "Kirim Komentar", poin: 10 },
  { icon: Send, label: "Kirim Pengaduan", poin: 50 },
];

export default function DetailReward() {
  const navigate = useNavigate();
  const [reward, setReward] = useState(null);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [loadingAllActivities, setLoadingAllActivities] = useState(false);
  const [activityError, setActivityError] = useState("");
  useEffect(() => {
    let active = true;
    getRewards().then((data) => { if (active) setReward(data); }).catch(() => {});
    return () => { active = false; };
  }, []);
  const leaderboard = (reward?.leaderboard || []).map((entry) => ({ nama: entry.name, poin: entry.points }));
  const aktivitas = (reward?.activities || []).map((entry) => ({
    icon: entry.type === "report" ? Send : entry.type === "vote" ? ThumbsUp : MessageSquare,
    label: entry.description,
    poin: entry.points,
    key: `${entry.type}-${entry.referenceId}`,
  }));
  const visibleActivities = showAllActivities ? aktivitas : aktivitas.slice(0, 5);

  const toggleAllActivities = async () => {
    if (showAllActivities) {
      setShowAllActivities(false);
      setActivityError("");
      return;
    }

    setLoadingAllActivities(true);
    setActivityError("");
    try {
      const data = await getRewards({ allActivities: true });
      setReward((current) => ({ ...(current || {}), activities: data.activities || [] }));
      setShowAllActivities(true);
    } catch (error) {
      setActivityError(error.message || "Riwayat aktivitas poin gagal dimuat.");
    } finally {
      setLoadingAllActivities(false);
    }
  };

  return (
    <div className="pb-8">
      <div className="px-4 sm:px-6 pt-4">
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-2xl shadow-sm p-4 text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="h-9 w-9 rounded-full bg-white/90 text-brand-700 flex items-center justify-center shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <p className="text-xs text-emerald-100">Poin Anda Saat Ini</p>
            <p className="text-2xl font-extrabold">{Number(reward?.points || 0).toLocaleString("id-ID")}</p>
            <p className="text-[10px] text-emerald-100">Peringkat #{reward?.rank || "–"} dari {reward?.citizenCount || 0} warga</p>
          </div>
          <span className="h-11 w-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Trophy size={22} className="text-amber-300" />
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mt-4">
          {[[reward?.counts?.reports || 0, "Pengaduan"], [reward?.counts?.votes || 0, "Vote"], [reward?.counts?.comments || 0, "Komentar"]].map(([v, l]) => (
            <div key={l} className="bg-white/15 rounded-xl py-3 text-center">
              <p className="font-bold text-lg">{v}</p>
              <p className="text-[10px] text-emerald-100">{l}</p>
            </div>
          ))}
        </div>
      </div>
      </div>

      <div className="px-4 sm:px-6 mt-3.5 space-y-3.5">
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-3.5">
          <p className="text-sm font-bold text-emerald-900 mb-3">Warga Paling Aktif (Anonim)</p>
          <div className="space-y-2.5">
            {leaderboard.map((w, i) => (
              <div key={w.nama} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-700">
                  <span>{["🥇", "🥈", "🥉"][i]}</span> {w.nama}
                </span>
                <span className="font-semibold text-brand-700">{w.poin}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-3.5">
          <p className="text-sm font-bold text-emerald-900 mb-3">Aktivitas Poin Terbaru</p>
          <div className="space-y-3">
            {visibleActivities.map(({ icon: Icon, label, poin, key }) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-700">
                  <Icon size={15} className="text-brand-700" /> {label}
                </span>
                <span className="font-semibold text-brand-700">{poin}</span>
              </div>
            ))}
          </div>
          {!aktivitas.length && <p className="text-xs text-gray-500">Belum ada aktivitas berpoin.</p>}
          {activityError && <p role="alert" className="mt-2 text-xs text-rose-700">{activityError}</p>}
          <button
            type="button"
            onClick={toggleAllActivities}
            disabled={loadingAllActivities}
            className="ml-auto mt-3 block text-right text-xs font-medium text-brand-700 hover:underline disabled:cursor-wait disabled:opacity-60"
          >
            {loadingAllActivities ? "Memuat..." : showAllActivities ? "Tampilkan Lebih Sedikit" : "Lihat Semua"}
          </button>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5">
          <p className="text-sm font-bold text-emerald-900 mb-3">Cara Mendapatkan Poin</p>
          <div className="space-y-2.5">
            {cara.map(({ icon: Icon, label, poin }) => (
              <div key={label} className="bg-white rounded-xl px-3.5 py-2.5 flex items-center gap-3">
                <span className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Icon size={16} />
                </span>
                <div>
                  <p className="text-sm text-gray-700">{label}</p>
                  <p className="text-sm font-semibold text-brand-700">+{poin} poin</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
