import { useState, useEffect } from 'react'
import { StatusBadge, UrgencyBadge } from '../../utils/badges.jsx'

export default function ReportDetailModal({ report, onClose, onSave }) {
  const [status, setStatus] = useState('Masuk')
  const [reply, setReply] = useState('')

  useEffect(() => {
    if (report) {
      setStatus(report.status)
      setReply(report.officialReply || '')
    }
  }, [report])

  if (!report) return null

  const comments = report.commentsList || []
  const [tanggal = '-', ...rest] = (report.submittedAt || '-').split(' ')

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3.5">
      <div className="bg-white w-full sm:max-w-lg rounded-2xl p-4 shadow-2xl border border-emerald-100 space-y-3 modal-scroll">
        <div className="flex justify-between items-center border-b pb-2 border-gray-100">
          <div className="min-w-0">
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {report.id}
            </span>
            <h3 className="text-xs xs:text-sm font-bold text-gray-800 truncate mt-1">{report.title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <img src={report.image} alt="Foto Laporan" className="w-full h-40 object-cover rounded-xl border border-gray-200 shadow-inner" />
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-100">
              <p className="text-[9px] text-gray-400">Tanggal Laporan</p>
              <p className="font-bold text-gray-800 mt-0.5">{report.submittedAt ? tanggal : '-'}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-100">
              <p className="text-[9px] text-gray-400">Waktu Laporan</p>
              <p className="font-bold text-gray-800 mt-0.5">{report.submittedAt ? rest.join(' ') || '-' : '-'}</p>
            </div>
          </div>

          <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <div>
              <p className="text-[10px] text-gray-400">Pelapor:</p>
              <p className="font-bold text-gray-800">{report.author}</p>
            </div>
            <div className="flex gap-1 flex-wrap justify-end">
              <StatusBadge status={report.status} />
              <UrgencyBadge urgency={report.urgency} />
            </div>
          </div>

          <div>
            <p className="text-[10px] text-gray-400 font-semibold mb-0.5">Isi Deskripsi Laporan:</p>
            <p className="bg-emerald-50/50 p-2.5 rounded-xl text-gray-700 leading-relaxed border border-emerald-100/60">
              {report.description}
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-800">
                <i className="fa-regular fa-comments text-emerald-600 mr-1"></i> Komentar Warga
              </h4>
              <span className="text-[10px] text-gray-400">{comments.length} komentar</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments.length ? (
                comments.map((c, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-gray-800">{c.name}</span>
                      <span className="text-[9px] text-gray-400">{c.time}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">{c.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-gray-400 text-center py-3">Belum ada komentar.</p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-2.5 text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-800">
              <i className="fa-solid fa-lightbulb"></i> Rekomendasi AI Response:
            </div>
            <p className="text-[11px] text-amber-800/90 leading-relaxed">{report.aiSuggestion}</p>
          </div>

          <div className="space-y-2 border-t pt-2 border-gray-100">
            <label className="block font-bold text-gray-700">Tindak Lanjut Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 font-semibold text-gray-800 focus:outline-none focus:border-emerald-500"
            >
              <option value="Masuk">Masuk (Belum Diproses)</option>
              <option value="Diproses">Sedang Diproses (Petugas Ditunjuk)</option>
              <option value="Selesai">Selesai (Telah Ditangani)</option>
              <option value="Ditolak">Ditolak / Tidak Valid</option>
            </select>
            <label className="block font-bold text-gray-700 mt-2">Tanggapan Resmi ke Warga:</label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={2}
              placeholder="Tulis pesan atau perkembangan untuk warga pelapor..."
              className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => onSave(report.id, status, reply)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition active:scale-95 shadow-md"
            >
              <i className="fa-solid fa-floppy-disk mr-1"></i> Simpan &amp; Update Laporan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
