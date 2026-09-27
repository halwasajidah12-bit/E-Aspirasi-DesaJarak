import { useState } from 'react'
import { readFileAsDataURL } from '../utils/helpers.js'

export default function Berita({ namaDesa, newsData, onGenerateDraft, onOpenNewsModal, onSetNewsStatus }) {
  const [topic, setTopic] = useState('')
  const [style, setStyle] = useState('Formal & Resmi')
  const [category, setCategory] = useState('Pembangunan')
  const [imagePreview, setImagePreview] = useState('')

  const handleImage = async (e) => {
    const file = e.target.files?.[0]
    const data = await readFileAsDataURL(file)
    if (data) setImagePreview(data)
  }

  const handleGenerate = () => {
    const finalTopic = topic.trim() || `Pembangunan Sumur Bor Air Bersih Desa ${namaDesa}`
    onGenerateDraft({ topic: finalTopic, category, image: imagePreview })
    setTopic('')
    setImagePreview('')
  }

  return (
    <section className="space-y-3.5">
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-4 rounded-2xl shadow-sm space-y-1">
        <h2 className="text-base font-bold">Publikasi Berita Desa</h2>
        <p className="text-xs text-emerald-100">Kelola publikasi dan draf berita berbantu AI.</p>
      </div>

      {/* AI Generator Form */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 space-y-3">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <i className="fa-solid fa-wand-magic-sparkles text-emerald-600 text-base"></i>
          <div>
            <h3 className="text-xs font-bold text-gray-800">Generate Script Berita AI</h3>
            <p className="text-[10px] text-gray-400">Susun draf berita resmi desa secara otomatis</p>
          </div>
        </div>

        <div className="space-y-2.5 text-xs">
          <div>
            <label className="block text-gray-600 font-semibold mb-1">Topik Utama Berita</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              type="text"
              placeholder="Contoh: Peresmian Sumur Bor Desa Jarak"
              className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-gray-600 font-semibold mb-1">Gaya Bahasa</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none">
                <option value="Formal & Resmi">Formal &amp; Resmi</option>
                <option value="Informatif & Ringkas">Informatif &amp; Ringkas</option>
                <option value="Sosialisasi Warga">Sosialisasi Warga</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-1">Kategori</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none">
                <option value="Pembangunan">Pembangunan</option>
                <option value="Keuangan">Keuangan</option>
                <option value="Kegiatan">Kegiatan</option>
                <option value="Pengumuman">Pengumuman</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-600 font-semibold mb-1">Gambar Berita</label>
            <input type="file" accept="image/*" onChange={handleImage} className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50" />
            {imagePreview && <img src={imagePreview} className="upload-preview mt-2" alt="Preview gambar berita" />}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md"
        >
          <i className="fa-solid fa-robot"></i> Buat Draf Sekarang
        </button>
      </div>

      {/* News List */}
      <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-emerald-100 space-y-2.5">
        <h3 className="text-xs font-bold text-gray-800">Daftar Berita Desa</h3>

        <div className="space-y-2 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3 lg:items-start">
          {newsData.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
              <img src={item.image} className="w-full h-32 object-cover" alt="Gambar berita" />
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">{item.category}</span>
                    <h4 className="text-xs font-bold text-gray-800 mt-1 leading-snug">{item.title}</h4>
                  </div>
                  <span
                    className={`text-[9px] px-2 py-1 rounded-full font-bold flex-shrink-0 ${
                      item.status === 'Tayang' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">
                  {item.date} • <i className="fa-regular fa-comment"></i> {item.comments || 0} komentar
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                  <button onClick={() => onOpenNewsModal(item.id)} className="bg-emerald-50 text-emerald-700 font-bold py-2 rounded-xl text-[11px]">
                    <i className="fa-solid fa-pen mr-1"></i>Edit &amp; Komentar
                  </button>
                  <button
                    onClick={() => onSetNewsStatus(item.id, item.status === 'Tayang' ? 'Draft' : 'Tayang')}
                    className="bg-gray-50 text-gray-700 border border-gray-200 font-bold py-2 rounded-xl text-[11px]"
                  >
                    {item.status === 'Tayang' ? 'Jadikan Draft' : 'Publish'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
