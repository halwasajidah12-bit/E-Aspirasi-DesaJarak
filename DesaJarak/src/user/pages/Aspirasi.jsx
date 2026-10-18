import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ScanLine, Camera } from "lucide-react";
import { createReport, getCategories, uploadImage } from "../../utils/api.js";

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
    infrastructureId: "",
    latitude: "",
    longitude: "",
    locationAccuracy: "",
    locationSource: "",
    waktu: "",
    tanggal: "",
    judul: "",
    kategori: "",
    deskripsi: "",
  });
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [scanActive, setScanActive] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanMessage, setScanMessage] = useState("");
  const [gpsBusy, setGpsBusy] = useState(false);
  const videoRef = useRef(null);

  const captureGpsLocation = useCallback((source) => {
    setScanError("");
    setScanMessage(source === "qr" ? "QR terbaca. Meminta lokasi GPS perangkat..." : "Meminta lokasi GPS perangkat...");
    setGpsBusy(true);
    setForm((current) => ({
      ...current,
      ...(current.locationSource ? { lokasi: "" } : {}),
      latitude: "",
      longitude: "",
      locationAccuracy: "",
      locationSource: "",
    }));

    if (!navigator.geolocation) {
      setScanMessage("");
      setScanError("GPS/lokasi tidak tersedia di browser ini. Isi lokasi laporan secara manual.");
      setGpsBusy(false);
      return;
    }
    if (!window.isSecureContext) {
      setScanMessage("");
      setScanError("GPS hanya dapat digunakan melalui HTTPS atau localhost.");
      setGpsBusy(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const locationAccuracy = Number.isFinite(accuracy) ? Math.max(0, Math.round(accuracy)) : "";
        setForm((current) => ({
          ...current,
          lokasi: `GPS ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          latitude,
          longitude,
          locationAccuracy,
          locationSource: source === "qr" ? "qr-gps" : "gps",
        }));
        setScanMessage(`Lokasi GPS berhasil diambil${locationAccuracy !== "" ? ` (akurasi sekitar ${locationAccuracy} m)` : ""}.`);
        setScanError("");
        setGpsBusy(false);
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? "Izin lokasi ditolak. Izinkan akses lokasi di browser, lalu coba lagi."
          : error.code === error.POSITION_UNAVAILABLE
            ? "Posisi GPS belum tersedia. Aktifkan lokasi/GPS perangkat dan coba lagi."
            : error.code === error.TIMEOUT
              ? "Pengambilan lokasi GPS melewati batas waktu. Coba lagi di area dengan sinyal GPS lebih baik."
              : "Lokasi GPS gagal diambil. Isi lokasi laporan secara manual.";
        setScanMessage("");
        setScanError(message);
        setGpsBusy(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }, []);

  useEffect(() => {
    if (!scanActive) return undefined;
    let cancelled = false;
    let controls;
    let decoded = false;
    const startScanner = async () => {
      if (!window.isSecureContext) {
        setScanError("Kamera hanya dapat digunakan melalui HTTPS atau localhost.");
        setScanActive(false);
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setScanError("Kamera tidak tersedia di browser ini. Isi lokasi secara manual.");
        setScanActive(false);
        return;
      }

      try {
        const { BrowserQRCodeReader } = await import("@zxing/browser");
        if (cancelled) return;
        const reader = new BrowserQRCodeReader();
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } }, audio: false },
          videoRef.current,
          (result) => {
            if (cancelled || !result || decoded) return;
            decoded = true;
            controls?.stop();
            setScanActive(false);
            captureGpsLocation("qr");
          },
        );
        if (cancelled || decoded) controls.stop();
      } catch (error) {
        const message = error.name === "NotAllowedError"
          ? "Izin kamera ditolak. Izinkan akses kamera di browser, lalu coba lagi."
          : error.name === "NotFoundError"
            ? "Kamera tidak ditemukan di perangkat ini."
            : "Kamera gagal dibuka. Periksa izin kamera atau isi lokasi secara manual.";
        setScanError(message);
        setScanActive(false);
      }
    };

    startScanner();
    return () => {
      cancelled = true;
      controls?.stop();
      const stream = videoRef.current?.srcObject;
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [scanActive, captureGpsLocation]);

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
            <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-2xl flex flex-col items-center py-5 px-4">
              {scanActive ? (
                <>
                  <video ref={videoRef} muted playsInline className="w-full max-w-sm aspect-video rounded-xl bg-black object-cover" />
                  <p className="text-xs text-gray-600 text-center mt-3">Pindai QR di lokasi laporan. Setelah terbaca, aplikasi mengambil posisi GPS ponsel.</p>
                  <button type="button" onClick={() => setScanActive(false)} className="mt-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700">Tutup kamera</button>
                </>
              ) : (
                <>
                  <ScanLine size={40} className="text-emerald-600" />
                  <p className="text-sm font-bold text-gray-800 mt-3">Scan QR CODE</p>
                  <p className="text-xs text-gray-500 text-center mt-1">QR yang sama bisa dipakai di tiap tempat. Lokasi laporan ditentukan dari GPS ponsel saat dipindai.</p>
                  <button type="button" disabled={gpsBusy} onClick={() => { setScanError(""); setScanMessage(""); setScanActive(true); }} className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-60">Buka pemindai QR</button>
                </>
              )}
            </div>
            {scanError && <p role="alert" className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{scanError}</p>}
            {scanMessage && <p role="status" className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{scanMessage}</p>}
            {form.latitude !== "" && form.longitude !== "" && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${form.latitude},${form.longitude}`)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block text-center text-xs font-medium text-emerald-700 underline"
              >
                Lihat titik GPS di peta{form.locationAccuracy !== "" ? ` · akurasi ±${form.locationAccuracy} m` : ""}
              </a>
            )}

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
              <p className="text-xs text-gray-400 mt-1">1 foto, maksimal 5 MB</p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  if (selected) {
                    setPhoto(selected);
                    setPhotoPreview(URL.createObjectURL(selected));
                    setSubmitError("");
                  }
                }}
              />
            </label>
            {photoPreview && <img src={photoPreview} alt="Foto laporan" className="mt-3 w-full max-h-56 rounded-xl object-cover" />}

            {submitError && <p role="alert" className="mt-4 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">{submitError}</p>}

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
                  setSubmitError("")
                  if (step === 0 && !form.lokasi.trim()) return setSubmitError("Lokasi laporan wajib diisi.")
                  if (step === 1 && (!form.judul.trim() || !form.kategori || !form.deskripsi.trim())) {
                    return setSubmitError("Judul, kategori, dan deskripsi laporan wajib diisi.")
                  }
                  if (step < 2) return setStep((s) => s + 1)
                  if (session?.role === "guest") return setSubmitError("Masuk atau buat akun warga sebelum mengirim laporan.")
                  setSubmitting(true)
                  try {
                    const image = photo ? (await uploadImage(photo)).image : ""
                    await createReport({ ...form, image }, { ownerId: session?.userId, ownerName: session?.name })
                    navigate("/lacak")
                  } catch (error) {
                    setSubmitError(error.message || "Laporan gagal dikirim.")
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
