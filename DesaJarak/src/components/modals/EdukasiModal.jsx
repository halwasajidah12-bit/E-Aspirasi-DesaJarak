import { useState, useEffect } from 'react'
import { readFileAsDataURL } from '../../utils/helpers.js'
import { educationCategories, educationContentText } from '../../data/education.js'

const emptyForm = {
  title: '',
  category: educationCategories[0],
  status: 'Draft',
  desc: '',
  subtitle: '',
  content: '',
  image: '',
}

export default function EdukasiModal({ visible, editingItem, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (visible) {
      setForm(editingItem
        ? { ...editingItem, content: editingItem.content || educationContentText(editingItem.sections) }
        : emptyForm)
    }
  }, [visible, editingItem?.id])

  if (!visible) return null

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleImage = async (e) => {
    const file = e.target.files?.[0]
    const data = await readFileAsDataURL(file)
    if (data) setForm((f) => ({ ...f, image: data }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form, editingItem?.id)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3.5">
      <div className="bg-white w-full sm:max-w-lg rounded-2xl p-4 shadow-2xl border border-emerald-100 space-y-3.5 modal-scroll">
        <div className="flex justify-between items-center border-b pb-2 border-gray-100">
          <h3 className="text-xs xs:text-sm font-bold text-gray-800">
            {editingItem ? 'Edit Edukasi Warga' : 'Tambah Edukasi Baru'}
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
            <label className="block font-semibold text-gray-700 mb-1">Judul Edukasi</label>
            <input
              value={form.title}
              onChange={set('title')}
              type="text"
              placeholder="Contoh: Pembangunan Desa"
              required
              className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Box Edukasi</label>
              <select value={form.category} onChange={set('category')} className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none">
                {educationCategories.map((category) => <option key={category}>{category}</option>)}
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
            <label className="block font-semibold text-gray-700 mb-1">Deskripsi Box</label>
            <textarea
              value={form.desc}
              onChange={set('desc')}
              rows={2}
              placeholder="Ringkasan yang tampil pada box edukasi warga..."
              required
              className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Subjudul Halaman</label>
            <input value={form.subtitle} onChange={set('subtitle')} className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Isi Edukasi</label>
            <textarea
              value={form.content}
              onChange={set('content')}
              rows={10}
              placeholder="Tulis materi edukasi. Pisahkan paragraf dengan baris kosong."
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
