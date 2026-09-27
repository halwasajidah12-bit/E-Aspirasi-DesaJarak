import { StatusBadge, UrgencyBadge } from '../utils/badges.jsx'
import { formatNumber } from '../utils/helpers.js'

export default function Beranda({ profil, reports, news, stats, onSwitchTab, onOpenReportDetail, onUpdateReportStatus }) {
  const newestFirst = (items, timestamp) => [...items].sort((a, b) => {
    const getTime = (item) => {
      const value = timestamp(item)
      const parsed = value ? new Date(value).getTime() : NaN
      if (!Number.isNaN(parsed)) return parsed
      const idTime = Number(item.id)
      return Number.isFinite(idTime) ? idTime : 0
    }
    return getTime(b) - getTime(a)
  })
  const homeReports = newestFirst(reports, (item) => item.submittedAt).slice(0, 3)
  const homeNews = newestFirst(news, (item) => item.createdAt || item.date).slice(0, 3)

  return (
    <section className="space-y-3.5">
      {/* Welcome Banner */}
      <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="inline-block text-[10px] xs:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 truncate">
            Halo, Admin 👋
          </span>
          <h2 className="text-xs xs:text-sm font-bold text-gray-800 mt-1 truncate">Dashboard Admin E-Aspirasi</h2>
          <p className="text-[10px] text-gray-400 truncate">Desa {profil.namaDesa} • Tanggap Warga</p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-xl xs:text-2xl font-black text-emerald-600">{stats.responseRate}%</span>
          <p className="text-[9px] text-gray-400">Respon Rate</p>
        </div>
      </div>

      {/* AI Analysis Card Banner */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-3.5 xs:p-4 rounded-2xl shadow-md relative overflow-hidden space-y-2.5">
        <div className="flex items-center justify-between border-b border-emerald-700/60 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
              <i className="fa-solid fa-robot text-xs"></i>
            </span>
            <h3 className="text-xs xs:text-sm font-bold truncate">Analisis AI Terbaru</h3>
          </div>
          <span className="text-[9px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full flex-shrink-0">
            Baru diperbarui
          </span>
        </div>

        <p className="text-xs text-emerald-100 leading-relaxed">
          Terdeteksi <span className="font-bold text-white underline decoration-amber-400">2 laporan duplikat</span> (JR-001 &amp; JR-021) terkait
          perbaikan fasilitas jalan. Teridentifikasi <span className="font-bold text-amber-300">2 laporan urgensi tinggi</span> berdasarkan lonjakan
          vote &amp; komentar 24 jam terakhir.
        </p>

        <div className="flex flex-col xs:flex-row gap-2 pt-1">
          <button
            onClick={() => onSwitchTab('berita')}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <i className="fa-solid fa-newspaper text-xs"></i> Script Berita AI
          </button>
          <button
            onClick={() => onSwitchTab('laporan')}
            className="bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 font-semibold py-2 px-3 rounded-xl text-xs border border-emerald-700 flex items-center justify-center gap-1 transition active:scale-95"
          >
            <i className="fa-solid fa-eye text-xs"></i> Lihat Detail
          </button>
        </div>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <StatCard icon="fa-file-alt" iconBg="bg-emerald-50 text-emerald-600" value={stats.total} title="Total Aspirasi" desc="Laporan keseluruhan" />
        <StatCard icon="fa-inbox" iconBg="bg-emerald-50 text-emerald-600" value={stats.masuk} title="Laporan Masuk" desc="Menunggu verifikasi" descClass="text-emerald-600 font-medium" />
        <StatCard icon="fa-triangle-exclamation" iconBg="bg-rose-50 text-rose-600" value={stats.prioritas} valueClass="text-rose-600" title="Urgensi Tinggi" desc="Perlu penanganan cepat" />
        <StatCard icon="fa-arrows-spin" iconBg="bg-amber-50 text-amber-600" value={stats.proses} valueClass="text-amber-600" title="Sedang Diproses" desc="Progres pengerjaan" />
        <StatCard icon="fa-circle-check" iconBg="bg-blue-50 text-blue-600" value={stats.selesai} valueClass="text-emerald-600" title="Terselesaikan" desc="Tuntas ditangani" />
        <StatCard icon="fa-ban" iconBg="bg-gray-100 text-gray-600" value={stats.ditolak} valueClass="text-gray-700" title="Ditolak / Tidak Valid" desc="Tidak sesuai kriteria" />
      </div>

      {/* Recent Reports + News preview side-by-side on larger screens */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-3.5 lg:items-start space-y-3.5 lg:space-y-0">
      <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-emerald-100 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs xs:text-sm font-bold text-emerald-900">Laporan Aspirasi Terbaru</h3>
          <button onClick={() => onSwitchTab('laporan')} className="text-[11px] text-emerald-600 font-semibold hover:underline flex items-center gap-0.5">
            Kelola semua <i className="fa-solid fa-chevron-right text-[9px]"></i>
          </button>
        </div>

        <div className="space-y-2.5">
          {homeReports.map((item, idx) => (
            <div key={item.id} className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-sky-600 min-w-[20px]">#{idx + 1}</span>
                  <img src={item.image} className="w-11 h-11 rounded-lg object-cover border border-gray-200 flex-shrink-0" alt="Foto Laporan" />
                  <div className="min-w-0">
                    <h4
                      className="text-xs font-bold text-gray-800 truncate cursor-pointer hover:text-emerald-600"
                      onClick={() => onOpenReportDetail(item.id)}
                    >
                      {item.title}
                    </h4>
                    <p className="text-[10px] font-mono text-gray-500 font-semibold">{item.id}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                      <span><i className="fa-regular fa-thumbs-up"></i> {item.votes}</span>
                      <span><i className="fa-regular fa-comment"></i> {item.comments}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <StatusBadge status={item.status} />
                  <UrgencyBadge urgency={item.urgency} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[10px]">
                <span className="bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-100">{item.category}</span>
                <div className="flex items-center gap-1.5">
                  <select
                    defaultValue=""
                    onChange={(e) => e.target.value && onUpdateReportStatus(item.id, e.target.value)}
                    className="bg-white border border-gray-200 text-gray-700 text-[10px] rounded-lg px-1.5 py-0.5 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="" disabled>Update Status</option>
                    <option value="Masuk">Set: Masuk</option>
                    <option value="Diproses">Set: Diproses</option>
                    <option value="Selesai">Set: Selesai</option>
                    <option value="Ditolak">Set: Ditolak</option>
                  </select>
                  <button onClick={() => onOpenReportDetail(item.id)} className="text-emerald-600 font-bold hover:underline">
                    Detail &gt;
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* News preview */}
      <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-emerald-100 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs xs:text-sm font-bold text-emerald-900">Berita Desa Terkini</h3>
          <button onClick={() => onSwitchTab('berita')} className="text-[11px] text-emerald-600 font-semibold hover:underline">
            Kelola &gt;
          </button>
        </div>

        <div className="space-y-2">
          {homeNews.map((item) => (
            <div key={item.id} className="p-2.5 bg-gray-50 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <img src={item.image} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" alt="News" />
                <div className="min-w-0">
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">{item.category}</span>
                  <h4 className="text-xs font-bold text-gray-800 truncate mt-0.5">{item.title}</h4>
                  <p className="text-[10px] text-gray-400">
                    {item.date} • <i className="fa-regular fa-comment"></i> {item.comments || 0}
                  </p>
                  <span className={`inline-block mt-1 text-[9px] font-semibold ${item.status === 'Draft' ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
              <button onClick={() => onSwitchTab('berita')} className="text-[11px] text-emerald-600 font-bold flex-shrink-0">
                Kelola &gt;
              </button>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* Village Info */}
      <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-emerald-100 space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-xs xs:text-sm font-bold text-emerald-900">Informasi Desa</h3>
          <button onClick={() => onSwitchTab('profil')} className="text-[11px] text-emerald-600 font-semibold">
            Detail &gt;
          </button>
        </div>
        <div className="divide-y divide-gray-100 text-xs">
          <div className="py-1.5 flex justify-between">
            <span className="text-gray-500">Wilayah Dusun</span>
            <span className="font-semibold text-gray-800">{profil.wilayahDusun}</span>
          </div>
          <div className="py-1.5 flex justify-between">
            <span className="text-gray-500">Jumlah RT / RW</span>
            <span className="font-semibold text-gray-800">{profil.jumlahRtRw}</span>
          </div>
          <div className="py-1.5 flex justify-between">
            <span className="text-gray-500">Total Penduduk</span>
            <span className="font-semibold text-gray-800">{formatNumber(profil.totalPenduduk)} Jiwa</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatCard({ icon, iconBg, value, valueClass = 'text-gray-800', title, desc, descClass = 'text-gray-400' }) {
  return (
    <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between space-y-1">
      <div className="flex items-center justify-between">
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center text-xs`}>
          <i className={`fa-solid ${icon}`}></i>
        </div>
        <span className={`text-lg xs:text-xl font-extrabold ${valueClass}`}>{value}</span>
      </div>
      <div>
        <h4 className="text-xs font-bold text-gray-800">{title}</h4>
        <p className={`text-[10px] truncate ${descClass}`}>{desc}</p>
      </div>
    </div>
  )
}
