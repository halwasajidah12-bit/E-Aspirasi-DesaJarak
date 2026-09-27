export default function Edukasi({ edukasiData, onAddNew, onEdit, onSetStatus, onDelete }) {
  const formatUpdatedAt = (item) => {
    const value = item.updatedAt || item.date
    if (!value) return 'Belum diperbarui'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: item.updatedAt ? 'short' : undefined })
  }

  return (
    <section className="space-y-3.5">
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-4 rounded-2xl shadow-sm space-y-1">
        <h2 className="text-base font-bold">Kelola Modul Edukasi</h2>
        <p className="text-xs text-emerald-100">Kelola panduan, regulasi, dan modul informasi bagi warga.</p>
      </div>

      <button
        onClick={onAddNew}
        className="w-full bg-white border-2 border-dashed border-emerald-500 hover:bg-emerald-50 text-emerald-700 font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
      >
        <i className="fa-solid fa-plus-circle text-base"></i> + Modul Edukasi Baru
      </button>

      <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-2 lg:gap-3 lg:items-start">
        {edukasiData.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
            {item.image ? (
              <img src={item.image} className="w-full h-40 object-cover" alt="Gambar modul edukasi" />
            ) : (
              <div className="h-24 bg-emerald-50 flex items-center justify-center text-emerald-700">
                <i className="fa-solid fa-book-open text-2xl"></i>
              </div>
            )}
            <div className="p-3.5 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">{item.category}</span>
                  <h4 className="text-sm font-bold text-gray-800 mt-1">{item.title}</h4>
                </div>
                <span
                  className={`text-[9px] px-2 py-1 rounded-full font-bold ${
                    item.status === 'Publish' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
              <p className="text-[10px] text-gray-400">Terakhir diperbarui: {formatUpdatedAt(item)}</p>
              <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-gray-100">
                <button onClick={() => onEdit(item.id)} className="border border-emerald-600 text-emerald-700 font-semibold py-1.5 rounded-xl text-[10px]">
                  Edit
                </button>
                <button onClick={() => onSetStatus(item.id, 'Draft')} className="bg-amber-50 text-amber-700 border border-amber-200 font-semibold py-1.5 rounded-xl text-[10px]">
                  Draft
                </button>
                <button onClick={() => onSetStatus(item.id, 'Publish')} className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold py-1.5 rounded-xl text-[10px]">
                  Publish
                </button>
                <button onClick={() => onDelete(item.id)} className="bg-rose-50 text-rose-600 border border-rose-200 font-semibold py-1.5 rounded-xl text-[10px]">
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
