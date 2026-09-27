// Sinkron dengan sisi admin (src/data/initialData.js -> initialNews).
// id, title/judul, category/kategori, date/tanggal, image, dan content
// dibuat sama persis dengan versi admin supaya berita yang tampil di user
// & admin konsisten.
export const beritaData = [
  {
    id: 1,
    judul: "Pembangunan Posyandu Baru Dusun Jarak Lor",
    kategori: "Pembangunan",
    tanggal: "5 Sep 2026",
    lokasi: "Dusun Jarak Lor",
    image:
      "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=900&auto=format&fit=crop&q=80",
    ringkasan:
      "Pembangunan Posyandu Baru Dusun Jarak Lor terus dilakukan untuk meningkatkan pelayanan kesehatan warga.",
    konten:
      "Pembangunan Posyandu Baru Dusun Jarak Lor terus dilakukan untuk meningkatkan pelayanan kesehatan warga. Pembangunan ini merupakan bagian dari program prioritas desa tahun ini dan diharapkan dapat mempercepat layanan kesehatan ibu, bayi, dan lansia di Dusun Jarak Lor.",
    komentar: [
      { nama: "Ani", waktu: "5 Sep 2026 10:15", teks: "Semoga segera selesai dan bisa digunakan warga." },
      { nama: "Budi", waktu: "5 Sep 2026 12:40", teks: "Terima kasih informasinya." },
    ],
  },
  {
    id: 2,
    judul: "Dana Desa Tahap II Rp 240 Juta Disalurkan",
    kategori: "Keuangan",
    tanggal: "2 Sep 2026",
    lokasi: "Desa Jarak",
    image:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=900&auto=format&fit=crop&q=80",
    ringkasan:
      "Informasi penyaluran Dana Desa Tahap II untuk mendukung program prioritas desa.",
    konten:
      "Informasi penyaluran Dana Desa Tahap II untuk mendukung program prioritas desa. Dana ini akan digunakan untuk pembangunan infrastruktur, program UMKM, serta bantuan sosial bagi warga yang membutuhkan.",
    komentar: [
      { nama: "Rudi", waktu: "2 Sep 2026 09:20", teks: "Apakah rincian penggunaannya akan dipublikasikan?" },
      { nama: "Dewi", waktu: "2 Sep 2026 11:05", teks: "Terima kasih transparansinya." },
    ],
  },
];
