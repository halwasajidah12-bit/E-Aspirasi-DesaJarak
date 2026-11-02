import { useCallback, useEffect, useState } from 'react'
import { getPriorities } from '../utils/api'

const scoreColor = (score) =>
  score >= 70
    ? 'bg-rose-50 text-rose-700 border-rose-200'
    : score >= 40
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200'

export default function AiPriorityPanel({ onOpenReportDetail }) {
  const [state, setState] = useState({ loading: false, error: '', items: null, at: null })

  const load = useCallback(() => {
    setState({ loading: true, error: '', items: null, at: null })
    getPriorities()
      .then((data) =>
        setState({ loading: false, error: '', items: data.priorityList || [], at: data.generatedAt }),
      )
      .catch((error) =>
        setState({ loading: false, error: error.message || 'Gagal memuat analisis prioritas.', items: null, at: null }),
      )
  }, [])

  useEffect(load, [load])

  return (
    <section className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
            <i className="fa-solid fa-ranking-star text-sm"></i>
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-800 truncate">Prioritas AI Penanganan</h3>
            <p className="text-[10px] text-gray-400">
              votes 35% &middot; urgensi 25% &middot; komentar 20% &middot; sentimen 15% &middot; umur 5%
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={state.loading}
          className="rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1.5 text-[10px] font-bold disabled:opacity-60 shrink-0"
        >
          {state.loading ? 'Memuat...' : 'Refresh'}
        </button>
      </div>

      {state.loading ? (
        <p className="text-xs text-gray-400 text-center py-6">Menganalisis laporan &amp; menyusun ringkasan AI...</p>
      ) : state.error ? (
        <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
          {state.error}
        </div>
      ) : !state.items?.length ? (
        <p className="text-xs text-gray-400 text-center py-6">Belum ada laporan aktif untuk diprioritaskan.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {state.items.map((item, index) => (
            <article
              key={item.reportId}
              className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 space-y-1.5 hover:border-emerald-200 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800">
                    <span className="text-gray-400 mr-1">#{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => onOpenReportDetail?.(item.reportId)}
                      className="hover:text-emerald-700 hover:underline text-left"
                    >
                      {item.title}
                    </button>
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono">
                    {item.reportId} &middot; {item.status} &middot; urgensi {item.urgency}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full border ${scoreColor(item.score)}`}
                >
                  {item.score}
                </span>
              </div>
              <p className="text-[10px] text-gray-500">
                {item.votes} vote &middot; {item.commentCount} komentar &middot; sentimen{' '}
                <span
                  className={
                    item.sentiment === 'Negatif'
                      ? 'text-rose-600 font-semibold'
                      : item.sentiment === 'Positif'
                        ? 'text-emerald-600 font-semibold'
                        : 'text-gray-600 font-semibold'
                  }
                >
                  {item.sentiment}
                </span>
                {item.duplicateOf ? ` &middot; serupa dengan ${item.duplicateOf}` : ''}
              </p>
              <p className="text-[11px] text-gray-700 leading-relaxed">{item.ringkasan}</p>
              <p className="text-[10px] text-gray-400">
                Alasan prioritas: {item.alasan}
              </p>
            </article>
          ))}
          {state.at && (
            <p className="text-[10px] text-gray-400 text-right">
              Dibuat: {new Date(state.at).toLocaleString('id-ID')}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
