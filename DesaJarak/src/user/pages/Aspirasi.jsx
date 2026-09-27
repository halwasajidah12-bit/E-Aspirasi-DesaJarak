import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ScanLine, Camera } from "lucide-react";
import { createReport } from "../../utils/api.js";

const steps = ["Lokasi", "Detail", "Foto"];
const kategoriList = ["Jalan", "Jembatan", "Listrik", "Air", "Drainase", "Lainya"];

function Stepper({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-1">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                i <= current ? "bg-brand-700 text-white" : "bg-gray-200 text-gray-400"
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-xs font-medium ${i <= current ? "text-brand-700" : "text-gray-400"}`}>
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

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const titleByStep = ["Aspirasi", "Aspirasi", "Buat Pengaduan"];
  const subtitleByStep = [
    "Sampaikan aspirasi/pengaduan",
    "Sampaikan Aspirasi/Pengaduan",
    "Laporkan masalah melalui form",
  ];

  return (
    <div className="pb-8">
      <div  className="bg-gradient-to-b from-brand-700 via-brand-500 to-mint-50 px-5 pt-3 pb-[160px] text-center text-white">
        <button
          onClick={() => (step === 0 ? navigate(-1) : setStep((s) => s - 1))}
          aria-label="Kembali"
          className="h-9 w-9 rounded-full bg-white/90 text-brand-700 flex items-center justify-center mb-3"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-3xl font-bold text-center">{titleByStep[step]}</h1>
        <p className="text-center text-white/80 text-lg mt-1">{subtitleByStep[step]}</p>
      </div>

      <div className="mx-4 -mt-[145px] bg-white rounded-3xl shadow-sm p-5">
        <Stepper current={step} />

        {step === 0 && (
          <div className="mt-6">
            <div className="border-2 border-dashed border-brand-200 rounded-2xl flex flex-col items-center py-8 px-4">
              <ScanLine size={40} className="text-brand-700" />
              <p className="font-semibold mt-3">Scan QR CODE</p>
              <p className="text-xs text-gray-500 text-center mt-1">
                Scan QR di titik infrastruktur
              </p>
            </div>

            <div className="flex items-center gap-3 my-5">
              <span className="h-px bg-gray-200 flex-1" />
              <span className="text-xs text-gray-400">atau isi manual</span>
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

            <p className="text-sm font-medium mt-4 mb-2">
              <span className="text-red-500">*</span>Kategori
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {kategoriList.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, kategori: k }))}
                  className={`rounded-xl border py-2.5 text-sm font-medium ${
                    form.kategori === k
                      ? "border-brand-700 bg-brand-50 text-brand-800"
                      : "border-gray-200 text-gray-600"
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
            <p className="text-sm font-medium mb-2">Foto Lokasi (Opsional)</p>
            <label className="border border-gray-200 rounded-2xl flex flex-col items-center justify-center py-10 cursor-pointer">
              <Camera size={34} className="text-gray-400" />
              <p className="font-semibold mt-3 text-gray-700">ambil foto/pilih dari galeri</p>
              <p className="text-xs text-gray-400 mt-1">maks 5 foto, 10 MB .jpg .png</p>
              <input type="file" accept="image/*" multiple className="hidden" />
            </label>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 rounded-full border border-gray-200 py-2.5 font-semibold text-gray-500"
            >
              Kembali
            </button>
          )}
          <button
            onClick={async () => {
              if (step < 2) return setStep((s) => s + 1)
              setSubmitting(true)
              try {
                await createReport(form, { ownerId: session?.userId, ownerName: session?.name })
                navigate("/lacak")
              } finally {
                setSubmitting(false)
              }
            }}
            disabled={submitting}
            className={`flex-1 rounded-full bg-brand-700 text-white py-2.5 font-semibold ${
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
      <span className="text-sm font-medium">
        {required && <span className="text-red-500">*</span>}
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
