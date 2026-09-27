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
    image: "/images/posyandu.jpg",
    ringkasan:
      "Pembangunan Posyandu Baru Dusun Jarak Lor terus dilakukan untuk meningkatkan pelayanan kesehatan warga.",
    konten:
      "Pembangunan Posyandu Baru Dusun Jarak Lor terus dilakukan untuk meningkatkan pelayanan kesehatan warga. Pembangunan ini merupakan bagian dari program prioritas desa tahun ini dan diharapkan dapat mempercepat layanan kesehatan ibu, bayi, dan lansia di Dusun Jarak Lor.",
    komentar: [],
  },
  {
    id: 2,
    judul: "Dana Desa Tahap II Rp 240 Juta Disalurkan",
    kategori: "Keuangan",
    tanggal: "2 Sep 2026",
    lokasi: "Desa Jarak",
    image: "/images/dana.jpg",
    ringkasan:
      "Informasi penyaluran Dana Desa Tahap II untuk mendukung program prioritas desa.",
    konten:
      "Informasi penyaluran Dana Desa Tahap II untuk mendukung program prioritas desa. Dana ini akan digunakan untuk pembangunan infrastruktur, program UMKM, serta bantuan sosial bagi warga yang membutuhkan.",
    komentar: [],
  },
];

export const mapAdminNews = (item) => ({
  id: item.id,
  judul: item.title,
  kategori: item.category,
  tanggal: item.date,
  lokasi: item.location || "Desa Jarak",
  image: item.image,
  ringkasan: item.summary || item.content,
  konten: item.content,
  komentar: item.commentsList || [],
});

export const countNewsComments = (comments = []) =>
  comments.reduce((total, comment) => total + 1 + countNewsComments(comment.replies || []), 0);
