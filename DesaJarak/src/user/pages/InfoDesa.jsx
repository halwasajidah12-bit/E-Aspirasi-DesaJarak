import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { profilDesa } from "../data/profilDesa";
import { getVillageProfile } from "../../utils/api.js";

const tabs = ["Informasi Desa", "Perangkat Desa", "Laporan Tahunan"];

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
    image: profile.image?.startsWith("public/") ? `/${profile.image.slice("public/".length)}` : profile.image || profilDesa.image,
    perangkatDesa: Array.isArray(profile.perangkatDesa) ? profile.perangkatDesa.map((item) => Array.isArray(item) ? item : [item.jabatan || "Perangkat Desa", item.nama || "-"]) : [],
    laporanTahunan: Array.isArray(profile.laporanTahunan) ? profile.laporanTahunan.map((item) => Array.isArray(item) ? item : [item.label || item.judul || "Laporan", item.nilai || item.value || "-"]) : [],
  };
};

function InfoTable({ title, rows }) {
  return (
    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-3.5">
      {title && <p className="text-sm font-bold text-emerald-900 mb-2">{title}</p>}
      <div className="divide-y divide-gray-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0">
            <span className="text-xs text-gray-500">{label}</span>
            <span className="text-xs font-semibold text-gray-800">{value}</span>
          </div>
        ))}
        {rows.length === 0 && <p className="py-2 text-xs text-gray-500">Data belum tersedia pada profil admin.</p>}
      </div>
    </div>
  );
}

export default function InfoDesa() {
  const [tab, setTab] = useState(tabs[0]);
  const [active, setActive] = useState(0);
  const [profil, setProfil] = useState(profilDesa);
  const slides = [profil.image || "/images/jarak.jpg", "/images/jembatan.jpg", "/images/air.jpg"];
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const refreshProfile = () => {
      getVillageProfile()
        .then((data) => {
          if (mounted && data) setProfil(fromAdminProfile(data));
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
    <div className="px-4 sm:px-6 py-4 pb-8 space-y-3.5">
      <div className="relative w-full h-52 sm:h-[360px] overflow-hidden rounded-2xl shadow-sm">
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

      <div className="space-y-3.5">
        <div className="bg-white rounded-xl border border-emerald-100 shadow-sm p-1 flex">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 text-xs font-semibold rounded-lg py-2 transition ${
                tab === t ? "bg-emerald-600 text-white shadow-sm" : "text-gray-600 hover:bg-emerald-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Informasi Desa" && (
          <div className="space-y-3.5">
            <InfoTable title="Data Kependudukan" rows={kependudukan} />
            <InfoTable title="Informasi Umum" rows={umum} />
          </div>
        )}

        {tab === "Perangkat Desa" && (
          <InfoTable title="Struktur Perangkat Desa" rows={profil.perangkatDesa || []} />
        )}

        {tab === "Laporan Tahunan" && (
          <InfoTable title="Ringkasan Laporan Tahunan" rows={profil.laporanTahunan || []} />
        )}
      </div>
    </div>
  );
}
