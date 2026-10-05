import { useState, useMemo, useEffect } from 'react'
import { StatusBadge, UrgencyBadge } from '../utils/badges.jsx'

const FILTERS = ['semua', 'Masuk', 'Diproses', 'Selesai', 'Ditolak']

export default function Laporan({ reports, onOpenReportDetail, onUpdateReportStatus }) {
  const [filter, setFilter] = useState('semua')
  const [search, setSearch] = useState('')
  
  // State khusus untuk panel kategori
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState('')

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if(res.ok) setCategories(await res.json())
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    if(showCategoryManager) fetchCategories()
  }, [showCategoryManager])

  const handleAddCategory = async () => {
    if(!newCategory.trim()) return
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama_kategori: newCategory })
      })
      
      // PERBAIKAN: Menangkap jika ada error dari database
      if (!res.ok) {
        const err = await res.json()
        alert("Gagal menyimpan: " + err.message)
        return
      }
      
      setNewCategory('')
      fetchCategories()
    } catch(e) { 
      alert("Gagal menghubungi server backend") 
    }
  }

  const handleDeleteCategory = async (id) => {
    if(!confirm("Hapus kategori ini? Data yang terhapus tidak bisa dikembalikan.")) return
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      fetchCategories()
    } catch(e) { alert("Gagal menghapus kategori") }
  }

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return reports.filter((r) => {
      const matchFilter = filter === 'semua' || r.status === filter
      const matchSearch =
        r.title.toLowerCase().includes(s) || String(r.id).toLowerCase().includes(s) || r.author.toLowerCase().includes(s)
      return matchFilter && matchSearch
    })
  }, [reports, filter, search])

  return (
    <section className="space-y-3.5">
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-4 rounded-2xl shadow-sm flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-base font-bold">Pelaporan Warga</h2>
          <p className="text-xs text-emerald-100">Manajemen, verifikasi, dan tindak lanjut laporan warga desa.</p>
        </div>
        <button 
          onClick={() => setShowCategoryManager(!showCategoryManager)} 
          className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 flex items-center gap-2"
        >
          <i className={`fa-solid ${showCategoryManager ? 'fa-times' : 'fa-list-check'}`}></i>
          {showCategoryManager ? 'Tutup Kelola Kategori' : 'Kelola Kategori'}
        </button>
      </div>

      {showCategoryManager && (
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <h3 className="text-sm font-bold text-emerald-900 mb-3">Kelola Kategori Infrastruktur</h3>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={newCategory} 
              onChange={e => setNewCategory(e.target.value)} 
              placeholder="Masukkan nama kategori baru (misal: Keamanan)" 
              className="flex-1 text-xs p-2.5 border border-emerald-200 rounded-xl outline-none focus:border-emerald-500 bg-emerald-50/30" 
            />
            <button onClick={handleAddCategory} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm">
              <i className="fa-solid fa-plus mr-1.5"></i>Tambah
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <div key={c.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 pl-3 pr-1 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                {c.nama_kategori}
                <button 
                  onClick={() => handleDeleteCategory(c.id)} 
                  className="h-6 w-6 rounded-full hover:bg-rose-100 text-gray-400 hover:text-rose-600 flex items-center justify-center transition"
                  title="Hapus Kategori"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            ))}
            {categories.length === 0 && <p className="text-xs text-gray-400 italic">Belum ada kategori di database.</p>}
          </div>
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-xl flex-shrink-0 transition ${
              filter === f ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'bg-white border border-gray-200 text-gray-700 font-medium'
            }`}
          >
            {f === 'semua' ? 'Semua' : f}
          </button>
        ))}
      </div>

      <div className="relative">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          type="text"
          placeholder="Cari kode ID, lokasi, atau judul laporan..."
          className="w-full text-xs p-2.5 pl-8 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-emerald-500 shadow-sm"
        />
        <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-gray-400 text-xs"></i>
      </div>

      <div className="space-y-2.5 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3 lg:items-start">
        {filtered.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border border-gray-100 p-4 lg:col-span-full">
            <i className="fa-solid fa-folder-open text-gray-300 text-3xl mb-2"></i>
            <p className="text-xs text-gray-500 font-medium">Tidak ada laporan sesuai filter/pencarian.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-sm space-y-2.5">
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {item.id}
                </span>
                <div className="flex gap-1">
                  <StatusBadge status={item.status} />
                  <UrgencyBadge urgency={item.urgency} />
                </div>
              </div>
              <div>
                <h4 onClick={() => onOpenReportDetail(item.id)} className="text-xs font-bold text-gray-800 cursor-pointer hover:text-emerald-600">
                  {item.title}
                </h4>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">Oleh: {item.author}</p>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{item.description}</p>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                <span className="text-[10px] bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded-full">{item.category}</span>
                <div className="flex items-center gap-2">
                  <select
                    defaultValue=""
                    onChange={(e) => e.target.value && onUpdateReportStatus(item.id, e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg text-xs p-1 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="" disabled>Ubah Status ▾</option>
                    <option value="Masuk">Masuk</option>
                    <option value="Diproses">Diproses</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                  <button onClick={() => onOpenReportDetail(item.id)} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-2.5 py-1 rounded-lg text-xs">
                    Detail &gt;
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}