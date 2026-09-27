import { useState, useEffect } from 'react'
import { readFileAsDataURL } from '../../utils/helpers.js'

export default function ProfilEditModal({ visible, profil, onClose, onSave }) {
  const [form, setForm] = useState(profil)

  useEffect(() => {
    if (visible) setForm(profil)
  }, [visible, profil])

  if (!visible) return null

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const setNum = (key) => (e) => setForm((f) => ({ ...f, [key]: parseInt(e.target.value) || 0 }))

  const handleImage = async (e) => {
    const file = e.target.files?.[0]
    const data = await readFileAsDataURL(file)
    if (data) setForm((f) => ({ ...f, image: data }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3.5">
      <div className="bg-white w-full sm:max-w-lg rounded-2xl p-4 shadow-2xl border border-emerald-100 space-y-3.5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-2 border-gray-100">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-pen-to-square text-emerald-600"></i>
            <h3 className="text-xs xs:text-sm font-bold text-gray-800">Edit Profil &amp; Data Desa</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="space-y-2 border-b border-gray-100 pb-3">
            <h4 className="font-bold text-emerald-800 text-[11px] flex items-center gap-1">
              <i className="fa-solid fa-image"></i> Foto Profil Desa
            </h4>
            <input type="file" accept="image/*" onChange={handleImage} className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50" />
            <img src={form.image} className="upload-preview" alt="Preview foto desa" />
          </div>

          <div className="space-y-2 border-b border-gray-100 pb-3">
            <h4 className="font-bold text-emerald-800 text-[11px] flex items-center gap-1">
              <i className="fa-solid fa-map-pin"></i> Informasi Wilayah &amp; Administrasi
            </h4>
            <div>
              <label className="block text-gray-600 font-medium mb-1">Nama Desa</label>
              <input value={form.namaDesa} onChange={set('namaDesa')} required className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Kecamatan</label>
                <input value={form.kecamatan} onChange={set('kecamatan')} required className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-1">Kabupaten</label>
                <input value={form.kabupaten} onChange={set('kabupaten')} required className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Provinsi</label>
                <input value={form.provinsi} onChange={set('provinsi')} required className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-1">Kode Desa</label>
                <input value={form.kodeDesa} onChange={set('kodeDesa')} required className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500 font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Luas Wilayah</label>
                <input value={form.luasWilayah} onChange={set('luasWilayah')} required className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-1">Jumlah RT/RW</label>
                <input value={form.jumlahRtRw} onChange={set('jumlahRtRw')} required className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>
            <div>
              <label className="block text-gray-600 font-medium mb-1">Wilayah Dusun</label>
              <input value={form.wilayahDusun} onChange={set('wilayahDusun')} required className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500" />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-emerald-800 text-[11px] flex items-center gap-1">
              <i className="fa-solid fa-users"></i> Statistik Kependudukan
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Total Penduduk</label>
                <input type="number" value={form.totalPenduduk} onChange={setNum('totalPenduduk')} required className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-1">Kepala Keluarga (KK)</label>
                <input type="number" value={form.kk} onChange={setNum('kk')} required className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Laki-Laki</label>
                <input type="number" value={form.laki} onChange={setNum('laki')} required className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-1">Perempuan</label>
                <input type="number" value={form.perempuan} onChange={setNum('perempuan')} required className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Usia Produktif (15-64)</label>
                <input type="number" value={form.produktif} onChange={setNum('produktif')} required className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-1">Lansia (65+)</label>
                <input type="number" value={form.lansia} onChange={setNum('lansia')} required className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition active:scale-95 shadow-md flex items-center justify-center gap-1.5">
              <i className="fa-solid fa-floppy-disk"></i> Simpan Perubahan Profil
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
