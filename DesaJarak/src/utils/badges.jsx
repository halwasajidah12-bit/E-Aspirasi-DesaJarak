export function StatusBadge({ status }) {
  const map = {
    Masuk: 'bg-blue-100 text-blue-800',
    Diproses: 'bg-amber-100 text-amber-800',
    Selesai: 'bg-emerald-100 text-emerald-800',
    Ditolak: 'bg-gray-200 text-gray-700',
  }
  if (!map[status]) return null
  return (
    <span className={`${map[status]} text-[9px] font-bold px-2 py-0.5 rounded-full`}>
      {status}
    </span>
  )
}

export function UrgencyBadge({ urgency }) {
  const map = {
    Tinggi: { cls: 'bg-rose-100 text-rose-800', label: 'Urgensi Tinggi' },
    Sedang: { cls: 'bg-amber-100 text-amber-800', label: 'Sedang' },
  }
  const item = map[urgency] || { cls: 'bg-slate-100 text-slate-700', label: 'Biasa' }
  return (
    <span className={`${item.cls} text-[9px] font-bold px-2 py-0.5 rounded-full`}>
      {item.label}
    </span>
  )
}
