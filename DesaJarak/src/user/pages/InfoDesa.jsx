import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { profilDesa } from "../data/profilDesa";
import { getAppData } from "../../utils/api.js";

const tabs = ["Informasi Desa", "Perangkat Desa", "Laporan Tahunan"];

const slides = [
  "/images/jarak.jpg",
  "/images/jembatan.jpg",
  "/images/air.jpg",
];

const fromAdminProfile = (profile) => {
  const rtRw = String(profile.jumlahRtRw || "").match(/\d+/g) || [];
  return {
    ...profilDesa,
    namaDesa: profile.namaDesa ?? profilDesa.namaDesa,
    kecamatan: profile.kecamatan ?? profilDesa.kecamatan,
    kabupaten: profile.kabupaten ?? profilDesa.kabupaten,
    provinsi: profile.provinsi ?? profilDesa.provinsi,
    luasWilayah: profile.luasWilayah ?? profilDesa.luasWilayah,
    wilayahDusun: profile.wilayahDusun ?? profilDesa.wilayahDusun,
    jumlahRt: Number(rtRw[0] ?? profilDesa.jumlahRt),
    jumlahRw: Number(rtRw[1] ?? profilDesa.jumlahRw),
    totalPenduduk: Number(profile.totalPenduduk ?? profilDesa.totalPenduduk),
    laki: Number(profile.laki ?? profilDesa.laki),
    perempuan: Number(profile.perempuan ?? profilDesa.perempuan),
    kk: Number(profile.kk ?? profilDesa.kk),
    produktif: Number(profile.produktif ?? profilDesa.produktif),
    lansia: Number(profile.lansia ?? profilDesa.lansia),
  };
};

const perangkat = [
  ["Kepala Desa", "Sutrisno, S.Sos"],
  ["Sekretaris Desa", "Wahyu Hidayat"],
  ["Bendahara Desa", "Siti Aminah"],
  ["Kasi Pemerintahan", "Agus Salim"],
];

const laporan = [
  ["Realisasi Dana Desa 2026", "Rp 1.240.000.000"],
  ["Serapan Anggaran", "82%"],
  ["Program Prioritas", "Infrastruktur & UMKM"],
];

function InfoTable({ title, rows }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      {title && <p className="font-semibold text-gray-800 mb-3">{title}</p>}
      <div className="divide-y divide-gray-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
            <span className="text-sm text-brand-700">{label}</span>
            <span className="text-sm font-medium text-gray-800">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InfoDesa() {
  const [tab, setTab] = useState(tabs[0]);
  const [active, setActive] = useState(0);
  const [profil, setProfil] = useState(profilDesa);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const refreshProfile = () => {
      getAppData()
        .then((data) => {
          if (mounted && data.profil) setProfil(fromAdminProfile(data.profil));
        })
        .catch(() => {});
    };

    refreshProfile();
    const id = setInterval(refreshProfile, 3000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const kependudukan = [
    ["Total Penduduk", `${profil.totalPenduduk.toLocaleString("id-ID")} jiwa`],
    ["Laki-laki", `${profil.laki.toLocaleString("id-ID")} jiwa`],
    ["Perempuan", `${profil.perempuan.toLocaleString("id-ID")} jiwa`],
    ["Kepala Keluarga", `${profil.kk.toLocaleString("id-ID")} KK`],
    ["Usia Produktif (15-59)", `${profil.produktif.toLocaleString("id-ID")} Jiwa`],
    ["Lansia (65+)", `${profil.lansia.toLocaleString("id-ID")} jiwa`],
  ];

  const umum = [
    ["Luas Wilayah", profil.luasWilayah],
    ["Dusun", profil.wilayahDusun],
    ["Jumlah RT / RW", `${profil.jumlahRt} RT / ${profil.jumlahRw} RW`],
    ["Kode Pos", "64175"],
  ];

  // auto-geser carousel setiap 4 detik
  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pb-8">
      
      <div className="relative w-full h-60 sm:h-[400px] overflow-hidden">
        {slides.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Foto Desa ${i + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-2000 ease-in-out ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        <button
          onClick={() => navigate(-1)}
          aria-label="Kembali"
          className="absolute top-4 left-4 z-10 h-9 w-9 rounded-full bg-white/90 text-brand-700 flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="absolute top-4 right-4 z-10 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-5 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>

        
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/75 via-black/25 to-transparent px-5 pt-16 pb-4 text-white">
          <p className="font-bold text-lg sm:text-xl">Desa {profil.namaDesa}</p>
          <p className="text-xs text-white/85 mt-0.5">
            Kecamatan {profil.kecamatan}, Kabupaten {profil.kabupaten}, Provinsi {profil.provinsi}
          </p>
          <div className="flex gap-6 mt-2">
            <div>
              <p className="font-bold">{profil.totalPenduduk.toLocaleString("id-ID")}</p>
              <p className="text-xs text-white/80">Jiwa</p>
            </div>
            <div>
              <p className="font-bold">{profil.kk.toLocaleString("id-ID")}</p>
              <p className="text-xs text-white/80">KK</p>
            </div>
            <div>
              <p className="font-bold">{profil.jumlahRt}</p>
              <p className="text-xs text-white/80">RT</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 pt-4">
        <div className="bg-white rounded-full shadow-sm p-1 flex mb-4">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 text-xs font-semibold rounded-full py-2 ${
                tab === t ? "bg-brand-700 text-white" : "text-gray-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Informasi Desa" && (
          <div className="space-y-4">
            <InfoTable title="Data Kependudukan" rows={kependudukan} />
            <InfoTable title="Informasi Umum" rows={umum} />
          </div>
        )}

        {tab === "Perangkat Desa" && (
          <InfoTable title="Struktur Perangkat Desa" rows={perangkat} />
        )}

        {tab === "Laporan Tahunan" && (
          <InfoTable title="Ringkasan Laporan Tahunan" rows={laporan} />
        )}
      </div>
    </div>
  );
}