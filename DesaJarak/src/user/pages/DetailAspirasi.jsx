import PageHeader from "../components/PageHeader";

export default function DetailAspirasi() {
  return (
    <div className="pb-8">
      <PageHeader title="Detail Aspirasi" subtitle="Detail aspirasi Anda" />

      <div className="px-4 mt-3.5">
        <div className="rounded-2xl overflow-hidden aspect-[3/4] max-h-72 bg-gray-100 border border-emerald-100" />

        <div className="flex items-center justify-between mt-5">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-700 mb-1">Kategori</p>
            <div className="input text-center font-medium">Jalan</div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-xs font-semibold text-gray-700">Status</p>
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full px-3 py-1">
            Proses
          </span>
        </div>

        <p className="text-xs font-semibold text-gray-700 mt-4 mb-1">Judul Laporan</p>
        <div className="input">Jalan berlubang di depan SDN 2</div>

        <p className="text-xs font-semibold text-gray-700 mt-4 mb-1">Lokasi</p>
        <div className="input">Jl Pegangsaan Timur no 98</div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">RT</p>
            <div className="input text-center">RT 04</div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">RW</p>
            <div className="input text-center">RW 04</div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Waktu</p>
            <div className="input text-center">08.00</div>
          </div>
        </div>
      </div>
    </div>
  );
}
