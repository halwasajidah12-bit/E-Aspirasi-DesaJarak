import { useState, useEffect } from 'react'
import { readFileAsDataURL } from '../../utils/helpers.js'

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=700&auto=format&fit=crop&q=80'

const emptyForm = {
  title: '',
  category: 'Panduan Layanan',
  status: 'Draft',
  desc: '',
  image: '',
}

export default function EdukasiModal({ visible, editingItem, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (visible) setForm(editingItem ? { ...editingItem } : emptyForm)
  }, [visible, editingItem])

  if (!visible) return null

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleImage = async (e) => {
    const file = e.target.files?.[0]
    const data = await readFileAsDataURL(file)
    if (data) setForm((f) => ({ ...f, image: data }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...form, image: form.image || DEFAULT_IMAGE }, editingItem?.id)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3.5">
      <div className="bg-white w-full sm:max-w-lg rounded-2xl p-4 shadow-2xl border border-emerald-100 space-y-3.5 modal-scroll">
        <div className="flex justify-between items-center border-b pb-2 border-gray-100">
          <h3 className="text-xs xs:text-sm font-bold text-gray-800">
            {editingItem ? 'Edit Modul Edukasi' : 'Tambah Modul Edukasi Baru'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Gambar Modul</label>
            <input type="file" accept="image/*" onChange={handleImage} className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50" />
            {form.image && <img src={form.image} className="upload-preview mt-2" alt="Preview gambar modul" />}
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Judul Modul Panduan</label>
            <input
              value={form.title}
              onChange={set('title')}
              type="text"
              placeholder="Contoh: Tata Cara Pengajuan Bansos Desa"
              required
              className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Kategori Modul</label>
              <select value={form.category} onChange={set('category')} className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none">
                <option value="Panduan Layanan">Panduan Layanan</option>
                <option value="Pembangunan">Pembangunan</option>
                <option value="Kesehatan & Posyandu">Kesehatan &amp; Posyandu</option>
                <option value="Regulasi Desa">Regulasi Desa</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={set('status')} className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none">
                <option value="Draft">Draft</option>
                <option value="Publish">Publish</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Ringkasan Konten</label>
            <textarea
              value={form.desc}
              onChange={set('desc')}
              rows={3}
              placeholder="Tuliskan petunjuk singkat modul edukasi..."
              required
              className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition active:scale-95 shadow-md">
            <i className="fa-solid fa-floppy-disk mr-1"></i> Simpan Modul
          </button>
        </form>
      </div>
    </div>
  )
}
