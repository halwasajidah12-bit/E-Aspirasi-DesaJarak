import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Send, ThumbsUp, MessageSquare } from "lucide-react";

const leaderboard = [
  { nama: "Antoneli", poin: 1000 },
  { nama: "Gomez", poin: 997 },
  { nama: "Lasso", poin: 990 },
];

const aktivitas = [
  { icon: Send, label: "Pengaduan #JR-89", poin: 20 },
  { icon: ThumbsUp, label: "Vote pengaduan #S-80", poin: 50 },
  { icon: MessageSquare, label: "Komentar pada berita", poin: 50 },
];

const cara = [
  { icon: ThumbsUp, label: "Berikan Vote", poin: 50 },
  { icon: MessageSquare, label: "Kirim Komentar", poin: 50 },
  { icon: Send, label: "Kirim Pengaduan", poin: 20 },
];

export default function DetailReward() {
  const navigate = useNavigate();

  return (
    <div className="pb-8">
      <div className="bg-gradient-to-b from-brand-900 via-brand-700 to-brand-600 rounded-b-[28px] px-5 pt-3 pb-6 text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="h-9 w-9 rounded-full bg-white/90 text-brand-700 flex items-center justify-center shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <p className="text-sm text-white/80">Poin Anda Saat Ini</p>
            <p className="text-3xl font-bold">1.000</p>
            <p className="text-xs text-white/80">Peringkat #15 dari 500 warga</p>
          </div>
          <span className="h-11 w-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Trophy size={22} className="text-accent-500" />
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mt-4">
          {[["12", "Pengaduan"], ["48", "Vote"], ["23", "Komentar"]].map(([v, l]) => (
            <div key={l} className="bg-white/15 rounded-xl py-3 text-center">
              <p className="font-bold text-lg">{v}</p>
              <p className="text-xs text-white/80">{l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="font-semibold text-brand-700 mb-3">Warga Paling Aktif (Anonim)</p>
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

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="font-semibold text-brand-700 mb-3">Aktivitas Poin Terbaru</p>
          <div className="space-y-3">
            {aktivitas.map(({ icon: Icon, label, poin }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-700">
                  <Icon size={15} className="text-brand-700" /> {label}
                </span>
                <span className="font-semibold text-brand-700">{poin}</span>
              </div>
            ))}
          </div>
          <p className="text-right text-xs text-brand-700 font-medium mt-3">Lihat Semua</p>
        </div>

        <div className="bg-brand-100 rounded-2xl p-4">
          <p className="font-semibold text-gray-800 mb-3">Cara Mendapatkan Poin</p>
          <div className="space-y-2.5">
            {cara.map(({ icon: Icon, label, poin }) => (
              <div key={label} className="bg-white rounded-xl px-3.5 py-2.5 flex items-center gap-3">
                <span className="h-9 w-9 rounded-lg bg-brand-700 text-white flex items-center justify-center">
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
