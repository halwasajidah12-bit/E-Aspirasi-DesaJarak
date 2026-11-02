// Sinkron dengan sisi admin (src/data/initialData.js -> initialReports).
// id, kategori, status, judul, dan lokasi dibuat SAMA PERSIS dengan versi
// admin supaya data yang tampil di user & admin konsisten (satu "dunia" data
// dummy). Field tambahan (deskripsi, rt/rw, waktu, dukungan, foto) khusus
// untuk kebutuhan tampilan sisi user dan boleh berbeda karena memang dummy.
export const laporanData = [
  {
    id: "#JR-001",
    kategori: "Jalan & Fasilitas",
    status: "Diproses",
    judul: "Jembatan Kayu RT 03 Rusak Parah",
    deskripsi:
      "Papan jembatan kayu di RT 03 sudah lapuk dan berlubang, sangat membahayakan warga dan anak-anak yang setiap pagi lewat untuk berangkat sekolah.",
    tanggal: "20-8-2026",
    waktu: "08.00",
    rt: "03",
    rw: "01",
    lokasi: "Dusun Jarak Lor",
    dukungan: 42,
    foto: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "#JR-021",
    kategori: "Jalan & Fasilitas",
    status: "Diproses",
    judul: "Jembatan Penyeberangan Saluran Irigasi",
    deskripsi:
      "Pondasi jembatan penyeberangan saluran irigasi retak akibat terkikis air hujan deras minggu lalu, warga diminta berhati-hati saat melintas.",
    tanggal: "22-8-2026",
    waktu: "09.30",
    rt: "05",
    rw: "01",
    lokasi: "Dusun Jarak Lor",
    dukungan: 35,
    foto: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "#JB-021",
    kategori: "Lingkungan",
    status: "Masuk",
    judul: "Penumpukan Sampah di Jalur Pasar",
    deskripsi:
      "TPS pasar meluber hingga ke pinggir jalan utama dan menimbulkan bau tidak sedap, warga berharap segera diangkut oleh petugas kebersihan.",
    tanggal: "24-8-2026",
    waktu: "07.15",
    rt: "-",
    rw: "-",
    lokasi: "Pasar Desa",
    dukungan: 20,
    foto: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "#PL-009",
    kategori: "Penerangan",
    status: "Selesai",
    judul: "Lampu Penerangan Jalan RT 01 Mati",
    deskripsi:
      "Dua titik lampu penerangan jalan di RT 01 sempat padam selama 3 hari, namun kini sudah diganti oleh teknisi BUMDes.",
    tanggal: "15-8-2026",
    waktu: "16.00",
    rt: "01",
    rw: "01",
    lokasi: "RT 01, Dusun Jarak Lor",
    dukungan: 18,
    foto: "https://images.unsplash.com/photo-1516880711640-ef7db81be3e1?w=600&auto=format&fit=crop&q=80",
  },
];

export const mapApiReport = (report) => ({
  id: report.id,
  submittedAt: report.submittedAt || "",
  kategori: report.category,
  status: report.status,
  judul: report.title,
  deskripsi: report.description,
  tanggal: report.reportDate || (report.submittedAt ? new Date(report.submittedAt).toLocaleDateString("id-ID") : "-"),
  waktu: report.time || (report.submittedAt ? new Date(report.submittedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"),
  rt: report.rt || "-",
  rw: report.rw || "-",
  lokasi: report.location || "-",
coordinates: report.coordinates || null,
locationAccuracy: report.locationAccuracy ?? null,
dukungan: Number(
  report.votes ?? report.voterIds?.length ?? 0
),
voterIds: report.voterIds || [],

  foto: report.image || "",
  pelapor: report.author || "Warga Desa",
  ownerId: report.ownerId || "",
  ownerName: report.ownerName || report.author || "Warga Desa",
 comments: Number(
  report.comments ?? report.commentsList?.length ?? 0
),
commentsList: report.commentsList || [],
komentar: report.commentsList || [],
  commentsList: report.commentsList || [],
  jumlahKomentar: report.commentsList?.length || 0,
  urgency: report.urgency || "Rendah",
  priorityReason: report.priorityReason || "",
  tanggapan: report.officialReply || "",
  aiSuggestion: report.aiSuggestion || "Belum ada komentar warga.",
  statusHistory: report.statusHistory || [],
hasPossibleDuplicate: report.hasPossibleDuplicate ?? false,
possibleDuplicates: report.possibleDuplicates ?? [],
votedByMe: Boolean(report.votedByMe),
})


export const statusColor = {
  Masuk: "bg-blue-100 text-blue-800",
  Diproses: "bg-amber-100 text-amber-800",
  Selesai: "bg-emerald-100 text-emerald-800",
  Ditolak: "bg-gray-200 text-gray-700",
};

export const kategoriList = ["Jalan & Fasilitas", "Lingkungan", "Penerangan"];

// Ringkasan angka laporan, dihitung dari laporanData supaya statistik yang
// tampil di halaman Home selalu konsisten dengan daftar laporan itu sendiri
// (dan dengan statistik dashboard admin, karena sumber datanya sama-sama 4
// laporan contoh).
export const laporanStats = {
  total: laporanData.length,
  masuk: laporanData.filter((l) => l.status === "Masuk").length,
  diproses: laporanData.filter((l) => l.status === "Diproses").length,
  selesai: laporanData.filter((l) => l.status === "Selesai").length,
};
