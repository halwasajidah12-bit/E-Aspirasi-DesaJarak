import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ScanLine, Camera } from "lucide-react";
import { createReport, getCategories } from "../../utils/api.js";

const steps = ["Lokasi", "Detail", "Foto"];

function Stepper({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-1">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                i <= current ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-400"
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-xs font-medium ${i <= current ? "text-emerald-700" : "text-gray-400"}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && <span className="w-6 h-px bg-gray-300" />}
        </div>
      ))}
    </div>
  );
}

export default function Aspirasi({ session }) {
  const [step, setStep] = useState(0);
  const [dbCategories, setDbCategories] = useState([]);
  const [form, setForm] = useState({
    lokasi: "",
    rt: "",
    rw: "",
    waktu: "",
    tanggal: "",
    judul: "",
    kategori: "",
    deskripsi: "",
  });
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  // Tarik data kategori dinamis dari database saat form dibuka
  useEffect(() => {
    let mounted = true;
    getCategories()
      .then((items) => {
        if (mounted) {
          // Ambil hanya nama_kategori
          setDbCategories(items.map(item => item.nama_kategori));
        }
      })
      .catch(() => {
        if (mounted) {
          // Fallback jika API gagal
          setDbCategories(["Jalan", "Jembatan", "Listrik", "Air", "Drainase", "Lainya"]);
        }
      });
    return () => (mounted = false);
  }, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const titleByStep = ["Aspirasi", "Aspirasi", "Buat Pengaduan"];
  const subtitleByStep = [
    "Sampaikan aspirasi/pengaduan",
    "Sampaikan Aspirasi/Pengaduan",
    "Laporkan masalah melalui form",
  ];

  return (
    <div className="px-4 sm:px-6 py-4 pb-8 space-y-3.5">
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (step === 0 ? navigate(-1) : setStep((s) => s - 1))}
            aria-label="Kembali"
            className="h-9 w-9 rounded-full bg-white/90 hover:bg-white text-emerald-700 flex items-center justify-center shrink-0 transition active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 space-y-1">
            <h1 className="text-base font-bold leading-tight">{titleByStep[step]}</h1>
            <p className="text-xs text-emerald-100">{subtitleByStep[step]}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4">
        <Stepper current={step} />

        {step === 0 && (
          <div className="mt-6">
            <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-2xl flex flex-col items-center py-8 px-4">
              <ScanLine size={40} className="text-emerald-600" />
              <p className="text-sm font-bold text-gray-800 mt-3">Scan QR CODE</p>
              <p className="text-xs text-gray-500 text-center mt-1">
                Scan QR di titik infrastruktur
              </p>
            </div>

            <div className="flex items-center gap-3 my-5">
              <span className="h-px bg-gray-200 flex-1" />
              <span className="text-[10px] text-gray-400">atau isi manual</span>
              <span className="h-px bg-gray-200 flex-1" />
            </div>

            <Field label="Lokasi" required>
              <input
                value={form.lokasi}
                onChange={update("lokasi")}
                placeholder="Contoh: Jl Pegangsaan Timur no 98"
                className="input"
              />
            </Field>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <Field label="RT">
                <input value={form.rt} onChange={update("rt")} placeholder="05" className="input" />
              </Field>
              <Field label="RW">
                <input value={form.rw} onChange={update("rw")} placeholder="04" className="input" />
              </Field>
              <Field label="Waktu">
                <input value={form.waktu} onChange={update("waktu")} placeholder="08.00" className="input" />
              </Field>
            </div>

            <Field label="Tanggal" className="mt-4">
              <input
                value={form.tanggal}
                onChange={update("tanggal")}
                placeholder="Contoh: 08-09-2026"
                className="input"
              />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="mt-6">
            <p className="text-center text-xs text-gray-400 mb-4">Detail Laporan</p>

            <Field label="Judul laporan" required>
              <input
                value={form.judul}
                onChange={update("judul")}
                placeholder="Contoh: Jalan berlubang di depan SDN 2"
                className="input"
              />
            </Field>

            <p className="text-xs font-semibold text-gray-700 mt-4 mb-1">
              <span className="text-rose-500">*</span>Kategori
            </p>
            {/* Tombol Kategori Dinamis dari Database */}
            <div className="grid grid-cols-3 gap-2">
              {dbCategories.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, kategori: k }))}
                  className={`rounded-xl border py-2 text-xs font-semibold transition active:scale-95 ${
                    form.kategori === k
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-emerald-50"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            <Field label="Deskripsi" required className="mt-4">
              <textarea
                value={form.deskripsi}
                onChange={update("deskripsi")}
                placeholder="Deskripsi masalah yang terjadi"
                rows={4}
                className="input resize-none"
              />
            </Field>
          </div>
        )}

          {step === 2 && (
            <div className="mt-6">
              <p className="text-center text-xs text-gray-400 mb-4">Foto Laporan</p>
              <p className="text-xs font-semibold text-gray-700 mb-1">Foto Lokasi (Opsional)</p>
              <label className="border-2 border-dashed border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 transition rounded-2xl flex flex-col items-center justify-center py-10 cursor-pointer">
                <Camera size={34} className="text-emerald-600" />
                <p className="text-sm font-bold mt-3 text-gray-700">ambil foto/pilih dari galeri</p>
                <p className="text-xs text-gray-400 mt-1">maks 5 foto, 5 MB .jpg .png .gif</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  max={5}
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const newFiles = Array.from(e.target.files || []).slice(0, 5);
                    const validFiles = newFiles.filter((f) => f.size <= 5 * 1024 * 1024);
                    setFiles(validFiles);
                    setPreviews(validFiles.map((f) => URL.createObjectURL(f)));
                  }}
                />
              </label>

              {previews.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-4">
                  {previews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                      <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = files.filter((_, idx) => idx !== i);
                          setFiles(updated);
                          const newPreviews = updated.map((f) => URL.createObjectURL(f));
                          previews.forEach((p) => URL.revokeObjectURL(p));
                          setPreviews(newPreviews);
                        }}
                        className="absolute top-0.5 right-0.5 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        <div className="flex gap-3 mt-6">
            {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 rounded-xl border border-emerald-300 text-emerald-700 hover:bg-emerald-50 py-3 text-xs font-semibold transition active:scale-95"
            >
              Kembali
            </button>
          )}
          <button
            onClick={async () => {
              if (step < 2) return setStep((s) => s + 1)
              setSubmitting(true)
              try {

                await createReport(form, { ownerId: session?.userId, ownerName: session?.name }, files)
                files.forEach((f) => URL.revokeObjectURL(URL.createObjectURL(f)));
                setFiles([]);
                setPreviews([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
                navigate("/lacak")
              } finally {
                setSubmitting(false)
              }
            }}
            disabled={submitting}
            className={`flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-3 text-xs font-bold shadow-md transition active:scale-95 disabled:opacity-60 ${
              step === 0 ? "w-full" : ""
            }`}
          >
            {submitting ? "Mengirim..." : step < 2 ? "Lanjutkan" : "Kirim Laporan"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold text-gray-700">
        {required && <span className="text-rose-500">*</span>}
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}