import { formatNumber } from '../utils/helpers.js'

export default function Profil({ profil, onOpenEdit }) {
  return (
    <section className="space-y-3.5">
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <img src="/images/jarak.jpg" className="w-full h-40 xs:h-48 object-cover" alt="Foto Profil Desa" />
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 text-white p-4 flex items-center justify-between">
          <div className="space-y-0.5 min-w-0 pr-2">
            <h2 className="text-base font-bold truncate">Profil Desa {profil.namaDesa}</h2>
            <p className="text-xs text-emerald-100">Pusat data kependudukan dan administratif desa.</p>
          </div>
          <button
            onClick={onOpenEdit}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl text-xs font-bold border border-white/30 flex items-center gap-1.5 transition active:scale-95 flex-shrink-0"
          >
            <i className="fa-solid fa-pen-to-square"></i> Edit Data
          </button>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-3.5 lg:items-start space-y-3.5 lg:space-y-0">
      <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-emerald-100 space-y-3">
        <h3 className="text-xs font-bold text-emerald-900 border-b pb-1.5 flex justify-between items-center">
          <span>Statistik Kependudukan</span>
          <i className="fa-solid fa-users text-emerald-600"></i>
        </h3>
        <div className="divide-y divide-gray-100 text-xs">
          <Row label="Total Penduduk" value={`${formatNumber(profil.totalPenduduk)} Orang`} />
          <Row label="Laki-laki" value={`${formatNumber(profil.laki)} Orang`} />
          <Row label="Perempuan" value={`${formatNumber(profil.perempuan)} Orang`} />
          <Row label="Kepala Keluarga (KK)" value={`${formatNumber(profil.kk)} KK`} />
          <Row label="Usia Produktif (15-64)" value={`${formatNumber(profil.produktif)} Orang`} />
          <Row label="Lansia (65+)" value={`${formatNumber(profil.lansia)} Orang`} />
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-emerald-100 space-y-3">
        <h3 className="text-xs font-bold text-emerald-900 border-b pb-1.5 flex justify-between items-center">
          <span>Informasi Wilayah &amp; Administrasi</span>
          <i className="fa-solid fa-map-location-dot text-emerald-600"></i>
        </h3>
        <div className="divide-y divide-gray-100 text-xs">
          <Row label="Nama Desa" value={profil.namaDesa} />
          <Row label="Kecamatan" value={profil.kecamatan} />
          <Row label="Kabupaten" value={profil.kabupaten} />
          <Row label="Provinsi" value={profil.provinsi} />
          <Row label="Kode Desa" value={profil.kodeDesa} mono />
          <Row label="Luas Wilayah" value={profil.luasWilayah} />
          <Row label="Wilayah Dusun" value={profil.wilayahDusun} />
          <Row label="Jumlah RT / RW" value={profil.jumlahRtRw} />
        </div>
      </div>
      </div>

      <button
        onClick={onOpenEdit}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md"
      >
        <i className="fa-solid fa-pen-to-square"></i> Edit Seluruh Profil Desa
      </button>
    </section>
  )
}

function Row({ label, value, mono }) {
  return (
    <div className="py-1.5 flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold text-gray-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}
