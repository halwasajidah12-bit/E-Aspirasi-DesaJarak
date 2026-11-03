import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ScanLine, Camera } from "lucide-react";
import { checkDuplicates, createReport, getCategories, getReportQuota, uploadImage } from "../../utils/api.js";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const PHOTO_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);

const readPhoto = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Foto tidak dapat dibaca. Gunakan format JPG, PNG, WebP, atau GIF."));
    };
    image.src = url;
  });

const preparePhoto = async (file) => {
  if (!PHOTO_TYPES.has(file.type)) {
    throw new Error("Format foto harus JPG, PNG, WebP, atau GIF.");
  }
  if (file.size <= MAX_PHOTO_SIZE) return file;

  const image = await readPhoto(file);
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Foto gagal diproses. Coba pilih foto lain.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  if (!blob) throw new Error("Foto gagal diproses. Coba pilih foto lain.");
  if (blob.size > MAX_PHOTO_SIZE) throw new Error("Ukuran foto masih lebih dari 5 MB setelah dikompres.");
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "foto"}.jpg`, { type: "image/jpeg" });
};

function getCurrentReportDateTime() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return {
    tanggal: `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`,
    waktu: `${pad(now.getHours())}.${pad(now.getMinutes())}`,
  };
}

const Stepper = ({ current }) => (
  <div className="flex items-center justify-center gap-2 mb-5">
    {["Lokasi", "Detail", "Foto"].map((label, idx) => (
      <div key={label} className="flex items-center gap-2">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
            idx === current ? "bg-emerald-600 text-white" : idx < current ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"
          }`}
        >
          {idx + 1}
        </div>
        <span className="text-xs font-medium text-gray-600">{label}</span>
        {idx < 2 && <span className="w-8 h-px bg-gray-200" />}
      </div>
    ))}
  </div>
);

function Aspirasi({ session }) {
  const [step, setStep] = useState(0);
  const [dbCategories, setDbCategories] = useState([]);
  const [form, setForm] = useState(() => ({
    ...getCurrentReportDateTime(),
    lokasi: "",
    rt: "",
    rw: "",
    infrastructureId: "",
    latitude: "",
    longitude: "",
    locationAccuracy: "",
    locationSource: "",
    judul: "",
    kategori: "",
    kategoriLainnya: "",
    deskripsi: "",
  }));
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [reportQuota, setReportQuota] = useState(null);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [scanActive, setScanActive] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanMessage, setScanMessage] = useState("");
  const [gpsBusy, setGpsBusy] = useState(false);
  const videoRef = useRef(null);
  const photoInputRef = useRef(null);
  const scannerControlsRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const scannerAttemptRef = useRef(0);

  const stopScanner = useCallback(() => {
    scannerAttemptRef.current += 1;
    try {
      const stopResult = scannerControlsRef.current?.stop();
      stopResult?.catch?.(() => {});
    } catch {
      // Track kamera tetap dihentikan di bawah jika controls gagal ditutup.
    }
    scannerControlsRef.current = null;
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }, []);

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
          ...getCurrentReportDateTime(),
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

  const startScanner = useCallback(async () => {
    setScanError("");
    setScanMessage("");

    if (!window.isSecureContext) {
      setScanError("Kamera hanya dapat digunakan melalui HTTPS atau localhost. Buka web dengan alamat HTTPS di ponsel.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError("Kamera tidak tersedia di browser ini. Isi lokasi laporan secara manual.");
      return;
    }

    const attemptId = ++scannerAttemptRef.current;
    setScanActive(true);
    setScanMessage("Meminta izin kamera. Pilih Izinkan jika browser menanyakannya...");

    try {
      // Minta kamera langsung dari event klik agar browser mengaitkan izin kamera
      // dengan tindakan pengguna, terutama pada browser ponsel.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      if (attemptId !== scannerAttemptRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      cameraStreamRef.current = stream;
      if (!videoRef.current) throw new Error("Preview kamera belum siap.");

      const { BrowserQRCodeReader } = await import("@zxing/browser");
      if (attemptId !== scannerAttemptRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      let decoded = false;
      const reader = new BrowserQRCodeReader();
      const controls = await reader.decodeFromStream(stream, videoRef.current, (result) => {
        if (!result || decoded || attemptId !== scannerAttemptRef.current) return;
        decoded = true;
        stopScanner();
        setScanActive(false);
        setScanMessage("");
        captureGpsLocation("qr");
      });

      if (attemptId !== scannerAttemptRef.current || decoded) {
        controls.stop();
        return;
      }
      scannerControlsRef.current = controls;
      setScanMessage("Kamera aktif. Arahkan kamera ke QR code.");
    } catch (error) {
      if (attemptId !== scannerAttemptRef.current) return;
      stopScanner();
      const message = error.name === "NotAllowedError" || error.name === "PermissionDeniedError"
        ? "Izin kamera ditolak. Izinkan akses kamera di pengaturan browser, lalu coba lagi."
        : error.name === "NotFoundError" || error.name === "DevicesNotFoundError"
          ? "Kamera tidak ditemukan di perangkat ini."
          : error.name === "NotReadableError" || error.name === "TrackStartError"
            ? "Kamera sedang dipakai aplikasi lain. Tutup aplikasi kamera lain lalu coba lagi."
            : "Kamera gagal dibuka. Pastikan web memakai HTTPS, izin kamera aktif, lalu coba lagi.";
      setScanError(message);
      setScanMessage("");
      setScanActive(false);
    }
  }, [captureGpsLocation, stopScanner]);

  useEffect(() => {
    return () => stopScanner();
  }, [stopScanner]);

  useEffect(() => {
    if (!photoPreview) return undefined;
    return () => URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  // Tarik data kategori dinamis dari database saat form dibuka
  useEffect(() => {
    let mounted = true;
    getCategories()
      .then((items) => {
        if (mounted) {
          const names = items.map((item) => item.nama_kategori);
          if (!names.some((name) => ["lainya", "lainnya"].includes(String(name).trim().toLowerCase()))) {
            names.push("Lainnya");
          }
          setDbCategories(names);
        }
      })
      .catch(() => {
        if (mounted) {
          // Fallback jika API gagal
          setDbCategories(["Jalan", "Jembatan", "Listrik", "Air", "Drainase", "Lainnya"]);
        }
      });
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    if (!session?.userId || session.role === "guest") {
      setReportQuota(null);
      setQuotaLoading(false);
      return undefined;
    }
    let mounted = true;
    setQuotaLoading(true);
    getReportQuota()
      .then((quota) => {
        if (mounted) {
          setReportQuota(quota);
          if (quota.remaining === 0) setQuotaModalOpen(true);
        }
      })
      .catch(() => {
        if (mounted) setReportQuota(null);
      })
      .finally(() => {
        if (mounted) setQuotaLoading(false);
      });
    return () => { mounted = false; };
  }, [session?.userId, session?.role]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const [formErrors, setFormErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const validateStep = (stepNum) => {
    const errors = {};
    if (stepNum === 0) {
      if (!form.lokasi) errors.lokasi = "Lokasi laporan wajib diisi.";
    }
    if (stepNum === 1) {
      if (!form.judul) errors.judul = "Judul laporan wajib diisi.";
      if (!form.kategori) errors.kategori = "Kategori laporan wajib dipilih.";
      if (!form.deskripsi) errors.deskripsi = "Deskripsi laporan wajib diisi.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const titleByStep = ["Aspirasi", "Aspirasi", "Buat Pengaduan"];
  const subtitleByStep = [
    "Sampaikan aspirasi/pengaduan",
    "Sampaikan Aspirasi/Pengaduan",
    "Laporkan masalah melalui form",
  ];
  const quotaExhausted = reportQuota?.remaining === 0;
  const otherCategorySelected = ["lainnya", "lainya"].includes(form.kategori.trim().toLowerCase());

  const sendReport = async () => {
    setSubmitting(true);
    try {
      const image = photo ? (await uploadImage(photo)).image : "";
      await createReport({ ...form, image }, { ownerId: session?.userId, ownerName: session?.name });
      navigate(otherCategorySelected ? "/" : "/lacak");
    } catch (error) {
      if (error.status === 429) {
        if (error.data?.quota) setReportQuota(error.data.quota);
        setQuotaModalOpen(true);
      } else {
        setSubmitError(error.message || "Laporan gagal dikirim.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Tombol "Kirim Laporan": cek duplikasi dulu, tampilkan peringatan bila ada
  // laporan serupa, dan tetap kirim hanya setelah warga mengonfirmasi.
  const handleSubmitClick = async () => {
    setSubmitError("");
    if (quotaExhausted) {
      setQuotaModalOpen(true);
      return;
    }
    if (step === 0 && !form.lokasi.trim()) return setSubmitError("Lokasi laporan wajib diisi.");
    if (step === 1 && (!form.judul.trim() || !form.kategori || !form.deskripsi.trim() || (otherCategorySelected && !form.kategoriLainnya.trim()))) {
      return setSubmitError(otherCategorySelected
        ? "Judul, kategori lainnya, dan deskripsi laporan wajib diisi."
        : "Judul, kategori, dan deskripsi laporan wajib diisi.");
    }
    if (step < 2) return setStep((s) => s + 1);
    if (session?.role === "guest") return setSubmitError("Masuk atau buat akun warga sebelum mengirim laporan.");
    // Sudah dikonfirmasi lewat panel peringatan → langsung kirim.
    if (duplicateWarning) return sendReport();
    setSubmitting(true);
    try {
      const check = await checkDuplicates({
        judul: form.judul,
        deskripsi: form.deskripsi,
        lokasi: form.lokasi,
        rt: form.rt,
        rw: form.rw,
      }).catch(() => null);
      const duplicates = check?.duplicates || [];
      if (duplicates.length) {
        setDuplicateWarning(duplicates);
        return;
      }
      await sendReport();
    } catch (error) {
      setSubmitError(error.message || "Gagal memeriksa duplikasi laporan.");
    } finally {
      setSubmitting(false);
    }
  };

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

        {session?.role !== "guest" && (
          <div
            role="status"
            className={`mt-4 rounded-xl border px-3 py-2 text-xs ${
              quotaExhausted
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-emerald-100 bg-emerald-50 text-emerald-800"
            }`}
          >
            {reportQuota ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">Kuota laporan hari ini</span>
                  <span className="font-bold">{reportQuota.used}/{reportQuota.limit}</span>
                </div>
                <p className="mt-1">
                  {quotaExhausted
                    ? "Batas harian tercapai. Kuota tersedia kembali pukul 00.00 WIB."
                    : `Sisa ${reportQuota.remaining} laporan hari ini.`}
                </p>
              </>
            ) : (
              <p>{quotaLoading ? "Memeriksa kuota laporan hari ini..." : "Kuota akan diperiksa oleh server saat laporan dikirim."}</p>
            )}
          </div>
        )}

        {step === 0 && (
          <div className="mt-6">
            <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-2xl flex flex-col items-center py-5 px-4">
              {scanActive ? (
                <>
                  <video ref={videoRef} muted playsInline className="w-full max-w-sm aspect-video rounded-xl bg-black object-cover" />
                  <p className="text-xs text-gray-600 text-center mt-3">Pindai QR di lokasi laporan. Setelah terbaca, aplikasi mengambil posisi GPS ponsel.</p>
                  <button type="button" onClick={() => { stopScanner(); setScanActive(false); setScanMessage(""); }} className="mt-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700">Tutup kamera</button>
                </>
              ) : (
                <>
                  <ScanLine size={40} className="text-emerald-600" />
                  <p className="text-sm font-bold text-gray-800 mt-3">Scan QR CODE</p>
                  <p className="text-xs text-gray-500 text-center mt-1">QR yang sama bisa dipakai di tiap tempat. Lokasi laporan ditentukan dari GPS ponsel saat dipindai.</p>
                  <button type="button" disabled={gpsBusy} onClick={startScanner} className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-60">Buka pemindai QR</button>
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
            <button
              type="button"
              onClick={() => setForm((current) => ({ ...current, ...getCurrentReportDateTime() }))}
              className="mt-2 text-xs font-semibold text-emerald-700 underline underline-offset-2"
            >
              Isi waktu dan tanggal sekarang
            </button>
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

            {otherCategorySelected && (
              <>
                <Field label="Sebutkan kategori lainnya" required className="mt-4">
                  <input
                    value={form.kategoriLainnya}
                    onChange={update("kategoriLainnya")}
                    placeholder="Contoh: Keamanan lingkungan"
                    maxLength={80}
                    className="input"
                  />
                </Field>
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                  Laporan dengan kategori lainnya hanya dapat dilihat oleh admin desa.
                </p>
              </>
            )}

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
              <p className="text-sm font-bold mt-3 text-gray-700">Ambil foto / pilih dari galeri</p>
              <p className="text-xs text-gray-400 mt-1">1 foto, maksimal 5 MB (JPG, PNG, WebP, GIF)</p>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={photoBusy}
                onChange={async (event) => {
                  const selected = event.target.files?.[0];
                  if (!selected) return;
                  setSubmitError("");
                  setPhotoBusy(true);
                  try {
                    const prepared = await preparePhoto(selected);
                    setPhoto(prepared);
                    setPhotoPreview(URL.createObjectURL(prepared));
                  } catch (error) {
                    setSubmitError(error.message);
                    if (photoInputRef.current) photoInputRef.current.value = "";
                  } finally {
                    setPhotoBusy(false);
                  }
                }}
              />
            </label>
            {photoBusy && <p className="text-xs text-emerald-700 mt-2">Memproses foto...</p>}
            {photoPreview && (
              <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3">
                <img src={photoPreview} alt="Pratinjau foto laporan" className="w-full max-h-64 rounded-xl bg-gray-100 object-contain" />
                <p className="mt-2 break-all text-xs text-gray-600">{photo?.name}</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => photoInputRef.current?.click()} className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Ganti foto</button>
                  <button type="button" onClick={() => { setPhoto(null); setPhotoPreview(""); }} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700">Hapus</button>
                </div>
              </div>
            )}
            <p className="mt-2 text-[11px] text-gray-500">Foto akan diunggah saat Anda menekan “Kirim Laporan”.</p>

            {otherCategorySelected ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <p className="font-bold">Laporan khusus admin</p>
                <p className="mt-1">Laporan ini tidak akan ditampilkan kepada warga lain atau di Riwayat warga. Admin desa yang dapat melihat dan menindaklanjutinya.</p>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">
                Laporan kategori ini akan tampil di menu Lacak Laporan dan dapat dilihat warga lain.
              </div>
            )}
          </div>
        )}

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
            onClick={handleSubmitClick}
            disabled={submitting || photoBusy}
            aria-haspopup={quotaExhausted ? "dialog" : undefined}
            className={`flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-3 text-xs font-bold shadow-md transition active:scale-95 disabled:opacity-60 ${
              step === 0 ? "w-full" : ""
            }`}
          >
            {photoBusy ? "Memproses foto..." : submitting ? "Mengirim..." : quotaExhausted ? "Lihat pemberitahuan kuota" : step < 2 ? "Lanjutkan" : "Kirim Laporan"}
          </button>
        </div>

        {duplicateWarning && (
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-300 px-3 py-3 space-y-2" role="alert">
            <p className="text-xs font-bold text-amber-800">&#9888;&#65039; Laporan serupa terdeteksi</p>
            {duplicateWarning.map((item) => (
              <div key={item.reportId} className="rounded-lg bg-white border border-amber-200 px-2.5 py-2 text-[11px] text-gray-700 space-y-0.5">
                <p className="font-semibold text-gray-800">
                  {item.title} <span className="text-gray-400">({item.reportId} &middot; {item.status})</span>
                </p>
                {item.location && <p>Lokasi: {item.location}</p>}
                <p className="text-amber-700">
                  Kemiripan {Math.round((item.similarity ?? 0) * 100)}%{item.verified ? " &middot; dikonfirmasi AI" : " (pemeriksaan lokal)"}
                  {item.reason ? ` — ${item.reason}` : ""}
                </p>
              </div>
            ))}
            <p className="text-[11px] text-gray-600">
              Cek dulu menu <span className="font-semibold">Lacak Laporan</span> agar tidak ada pengaduan ganda. Tetap kirim hanya jika masalah Anda memang berbeda atau lebih parah.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setDuplicateWarning(null); sendReport(); }}
                disabled={submitting}
                className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white py-2 text-xs font-bold transition active:scale-95 disabled:opacity-60"
              >
                {submitting ? "Mengirim..." : "Tetap Kirim"}
              </button>
              <button
                type="button"
                onClick={() => setDuplicateWarning(null)}
                className="flex-1 rounded-lg border border-amber-400 text-amber-800 hover:bg-amber-100 py-2 text-xs font-semibold"
              >
                Periksa Kembali
              </button>
            </div>
          </div>
        )}
      </div>

      {quotaModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setQuotaModalOpen(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-quota-title"
            className="w-full max-w-sm rounded-2xl bg-white p-5 text-center shadow-2xl"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <i className="fa-solid fa-circle-exclamation text-2xl" aria-hidden="true" />
            </div>
            <h2 id="report-quota-title" className="mt-4 text-base font-bold text-gray-900">
              Maaf, kuota laporan hari ini sudah habis
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Satu akun warga dapat mengirim maksimal 3 laporan per hari. Silakan coba lagi besok setelah pukul 00.00 WIB.
            </p>
            <button
              type="button"
              autoFocus
              onClick={() => setQuotaModalOpen(false)}
              className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
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
export default Aspirasi;
