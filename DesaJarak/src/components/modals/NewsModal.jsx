import { useState, useEffect } from 'react'
import { readFileAsDataURL } from '../../utils/helpers.js'

export default function NewsModal({ item, onClose, onSave, onDelete, onReply }) {
  const [form, setForm] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replyTarget, setReplyTarget] = useState(null)

  useEffect(() => {
    if (item) {
      setForm({ ...item })
      setReplyText('')
      setReplyTarget(null)
    }
  }, [item?.id])

  useEffect(() => {
    if (item) {
      setForm((current) => current && String(current.id) === String(item.id)
        ? { ...current, comments: item.comments || 0, commentsList: item.commentsList || [] }
        : current)
    }
  }, [item])

  if (!item || !form) return null

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleImage = async (e) => {
    const file = e.target.files?.[0]
    const data = await readFileAsDataURL(file)
    if (data) setForm((f) => ({ ...f, image: data }))
  }

  const comments = form.commentsList || []
  const commentCount = comments.reduce((total, comment) => total + 1 + (comment.replies || []).length, 0)

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3.5">
      <div className="bg-white w-full sm:max-w-lg rounded-2xl p-4 shadow-2xl border border-emerald-100 space-y-3 modal-scroll">
        <div className="flex justify-between items-center border-b pb-2">
          <div>
            <p className="text-[9px] text-emerald-600 font-bold uppercase">Kelola Berita</p>
            <h3 className="text-sm font-bold text-gray-800">Edit Berita</h3>
          </div>
          <button onClick={onClose} className="text-gray-400">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Gambar Berita</label>
          <input type="file" accept="image/*" onChange={handleImage} className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 text-xs" />
          <img src={form.image} className="upload-preview mt-2" alt="Preview gambar berita" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Judul Berita</label>
          <input value={form.title} onChange={set('title')} className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Kategori</label>
            <select value={form.category} onChange={set('category')} className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs">
              <option>Pembangunan</option>
              <option>Keuangan</option>
              <option>Kegiatan</option>
              <option>Pengumuman</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={set('status')} className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs">
              <option>Draft</option>
              <option>Tayang</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Isi Berita</label>
          <textarea
            value={form.content}
            onChange={set('content')}
            rows={5}
            className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs"
            placeholder="Isi berita..."
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => onSave(form)} className="flex-1 bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs">
            Simpan Edit
          </button>
          <button onClick={() => onDelete(form.id)} className="bg-rose-50 text-rose-600 border border-rose-200 font-bold py-2.5 px-4 rounded-xl text-xs">
            Hapus
          </button>
        </div>
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-gray-800">
              <i className="fa-regular fa-comments text-emerald-600 mr-1"></i> Respon Komentar
            </h4>
            <span className="text-[10px] text-gray-400">{commentCount} komentar</span>
          </div>
          <div className="space-y-2">
            {comments.length ? (
              comments.map((c, i) => (
                <div key={c.id || i} className="bg-gray-50 rounded-xl border border-gray-100 p-2.5">
                  <div className="flex justify-between gap-2">
                    <span className="font-bold text-[11px]">{c.name}</span>
                    <span className="text-[9px] text-gray-400">{c.time}</span>
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1">{c.text}</p>
                  {c.role !== 'admin' && (
                    <button
                      onClick={() => setReplyTarget(c)}
                      className="mt-1 text-[10px] font-semibold text-emerald-700 hover:underline"
                    >
                      Balas
                    </button>
                  )}
                  {(c.replies || []).map((reply) => (
                    <div key={reply.id} className="ml-3 mt-2 border-l-2 border-emerald-200 pl-2">
                      <div className="flex justify-between gap-2">
                        <span className="font-bold text-[10px]">{reply.name}</span>
                        <span className="text-[9px] text-gray-400">{reply.time}</span>
                      </div>
                      {reply.quotedText && <p className="text-[9px] text-gray-400 mt-1">Kutipan: “{reply.quotedText}”</p>}
                      <p className="text-[10px] text-gray-600 mt-1">{reply.text}</p>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <p className="text-[10px] text-gray-400 text-center py-3">Belum ada komentar.</p>
            )}
          </div>
          {replyTarget && (
            <div className="mt-2 rounded-lg border-l-2 border-emerald-500 bg-emerald-50 p-2 text-[10px] text-emerald-900">
              <div className="flex items-center justify-between gap-2">
                <span>Membalas {replyTarget.name}</span>
                <button onClick={() => setReplyTarget(null)} aria-label="Batalkan balasan" className="font-bold">×</button>
              </div>
              <p className="mt-1 line-clamp-2">{replyTarget.text}</p>
            </div>
          )}
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs mt-2"
            placeholder={replyTarget ? `Balas komentar ${replyTarget.name}...` : 'Tulis komentar admin...'}
          />
          <button
            onClick={async () => {
              if (!replyText.trim()) return
              await onReply(form.id, replyText.trim(), replyTarget?.id || null)
              setReplyText('')
              setReplyTarget(null)
            }}
            className="w-full mt-2 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold py-2 rounded-xl text-xs"
          >
            {replyTarget ? 'Kirim Balasan' : 'Kirim Komentar Admin'}
          </button>
        </div>
      </div>
    </div>
  )
}
