import { Home, Users, FileCheck, Building2, Palette, Store } from "lucide-react";

export const edukasiList = [
  {
    slug: "pembangunan-desa",
    icon: Home,
    judul: "Pembangunan Desa",
    deskripsi: "Ciptakan desa yang ideal",
    subtitle: "Ciptakan desa yang unggul",
    sections: [
      {
        heading: "Pengertian Pembangunan Desa",
        paragraphs: [
          "Pembangunan desa merupakan upaya yang terencana untuk meningkatkan kualitas hidup dan kesejahteraan masyarakat desa melalui pemanfaatan sumber daya yang dimiliki, dengan tetap mengedepankan prinsip kebersamaan, kekeluargaan, dan gotong royong.",
        ],
      },
      {
        heading: "Tujuan Pembangunan Desa",
        paragraphs: [
          "Tujuan Pembangunan Desa di Indonesia secara resmi diatur dalam Undang-Undang Nomor 6 Tahun 2014 tentang Desa (Pasal 78 ayat 1).",
        ],
        bullets: [
          "Meningkatkan kesejahteraan masyarakat desa dan kualitas hidup manusia.",
          "Menanggulangi kemiskinan melalui pemenuhan kebutuhan dasar.",
          "Pembangunan sarana dan prasarana ekonomi lokal.",
          "Pemanfaatan sumber daya alam (SDA) dan lingkungan secara berkelanjutan.",
        ],
      },
      {
        heading: "Tips Pembangunan Desa",
        tips: [
          "Gunakan data riil (seperti IDM atau SDGs Desa) agar program dapat menjawab kebutuhan mendesak warga.",
          "Libatkan warga secara aktif lewat Musyawarah (Musdes) dari tahap perencanaan hingga pengawasan.",
          "Transparansi Anggaran.",
          "Kembangkan ekonomi desa yang bertumpu pada potensi lokal.",
          "Pengadaan infrastruktur ramah lingkungan dengan pelatihan untuk peningkatan kapasitas warga.",
        ],
      },
      {
        heading: "Prioritas Pembangunan Desa",
        priorities: [
          { icon: Building2, title: "Infrastruktur", desc: "Fasilitas Umum, Jalan, Pertanian" },
          { icon: Palette, title: "Budaya", desc: "Kesenian dan Tradisi" },
          { icon: Store, title: "UMKM", desc: "Pengembangan UMKM" },
        ],
      },
      {
        heading: "Peran Masyarakat",
        paragraphs: ["Masyarakat dapat berperan melalui:"],
        bullets: [
          "Menyampaikan aspirasi dan usulan pembangunan.",
          "Mengikuti musyawarah desa.",
          "Mengawasi pelaksanaan pembangunan.",
          "Menjaga dan merawat fasilitas desa.",
          "Mengikuti kegiatan desa.",
        ],
      },
    ],
  },
  {
    slug: "pendoman-aspirasi",
    icon: Users,
    judul: "Pendoman Aspirasi",
    deskripsi: "Cara menyampaikan aspirasi dengan benar",
    subtitle: "Sampaikan suara Anda",
    sections: [
      {
        heading: "Apa itu Aspirasi Masyarakat?",
        paragraphs: [
          "Aspirasi masyarakat adalah penyampaian pendapat, saran, kebutuhan maupun keluhan dari warga desa melalui website.",
        ],
      },
      {
        heading: "Bagaimana Cara Menyampaikannya?",
        paragraphs: [
          "Tujuan Pembangunan Desa di Indonesia secara resmi diatur dalam Undang-Undang Nomor 6 Tahun 2014 tentang Desa (Pasal 78 ayat 1).",
        ],
        steps: [
          { title: "Isi Formulir", badge: "2", desc: "Masuk ke menu aspirasi dapat dilakukan melalui dua cara: 1. Memindai kode QR (barcode) 2. Mengunjungi website resmi." },
          { title: "Isi Formulir", badge: "2", desc: "Lengkapi dan cek data dari lokasi (dapat melalui geotagging), detail aspirasi, hingga pelampiran gambar sebagai bukti pendukung." },
          { title: "Kirim", badge: "3", desc: "Setelah semua data terisi, klik tombol kirim. Anda akan mendapatkan nomor aspirasi dan notifikasi status aspirasi yang telah dikirimkan melalui WhatsApp." },
          { title: "Pantau", badge: "4", desc: "Cek status aspirasi Anda secara berkala melalui menu Riwayat aspirasi maupun notifikasi." },
        ],
      },
      {
        heading: "Peraturan Aspirasi",
        tips: [
          "Isi formulir dengan data real dan tidak manipulasi.",
          "Isi formulir dengan lengkap dan jelas.",
          "Menggunakan bahasa yang jelas dan sopan serta tidak mengandung unsur SARA.",
        ],
        tipsNote: {
          before: "Apabila Anda melanggar maka akun akan dinonaktifkan sesuai dengan ",
          linkText: "Syarat dan Ketentuan",
          linkTo: "/edukasi/syarat-dan-ketentuan",
          after: " E-Aspirasi.",
        },
      },
      {
        heading: "Jenis Aspirasi yang Dapat Disampaikan",
        bullets: [
          "Usulan pembangunan infrastruktur.",
          "Keluhan fasilitas umum.",
          "Saran untuk peningkatan pelayanan umum.",
          "Masukkan terkait program desa.",
          "Lainnya yang berkaitan dengan kepentingan desa.",
        ],
      },
    ],
  },
  {
    slug: "penggunaan-website",
    icon: FileCheck,
    judul: "Penggunaan Website",
    deskripsi: "Petunjuk lengkap menggunakan website",
    subtitle: "Kenali website E-Aspirasi dengan baik",
    sections: [
      {
        heading: "Siapa Saja Pengguna Website?",
        paragraphs: [
          "Aspirasi masyarakat adalah penyampaian pendapat, saran, kebutuhan maupun keluhan dari warga desa melalui website.",
        ],
        twoCol: [
          { icon: Users, title: "Warga Desa", desc: "Warga dapat mengakses informasi desa, menyampaikan pengaduan / aspirasi, serta memantau status pengajuan." },
          { icon: Users, title: "Perangkat Desa", desc: "Perangkat desa dapat mengelola informasi, memproses layanan dan pengaduan warga, menangani pengaduan, serta melihat laporan dan statistik desa." },
        ],
      },
      {
        heading: "Apa yang Bisa Dilakukan di Website?",
        bullets: [
          "Mencari informasi desa.",
          "Mengakses layanan.",
          "Menyampaikan aspirasi / pengaduan.",
          "Memantau perkembangan desa.",
          "Menggunakan AI Assistant.",
        ],
      },
    ],
  },
  {
    slug: "syarat-dan-ketentuan",
    icon: FileCheck,
    judul: "Syarat dan Ketentuan",
    deskripsi: "Aturan penggunaan E-Aspirasi",
    subtitle: "Pastikan Anda menyetujui dan paham",
    sections: [
      {
        heading: "Syarat dan Ketentuan Penggunaan",
        checklist: [
          { title: "Penggunaan Website", desc: "Website ini disediakan oleh Perangkat Desa untuk memberikan informasi, layanan publik, dan sarana pengaduan bagi warga. Dengan mengakses website ini, Anda dianggap telah menyetujui seluruh syarat dan ketentuan berlaku." },
          { title: "Akun Pengguna", desc: "Pengguna bertanggung jawab penuh atas keamanan akun dan data yang digunakan. Dilarang memberikan informasi palsu atau menyesatkan." },
          { title: "Konten dan Informasi", desc: "Seluruh informasi yang tersedia di website ini dapat berubah sewaktu-waktu sesuai dengan kebijakan Pemerintah Desa. Kami berusaha menjaga keakuratan informasi, namun tidak menjamin 100% bebas dari kesalahan." },
          { title: "Hak Kekayaan Intelektual", desc: "Seluruh konten, desain, dan material di website ini dilindungi oleh hak cipta. Dilarang menyalin, mendistribusikan, atau menggunakan tanpa izin tertulis." },
          { title: "Taggung Jawab Pengguna", desc: "Pengguna wajib menggunakan website ini dengan bijak, tidak melakukan tindakan yang melanggar hukum dan tidak menyalahgunakan fasilitas yang tersedia." },
          { title: "Perubahan Ketentuan", desc: "Pemerintah Desa berhak mengubah syarat dan ketentuan ini kapan saja dan perubahan akan diumumkan pada halaman ini." },
        ],
      },
      {
        heading: "Sanksi Pelanggaran",
        sanksi: [
          { title: "Peringatan Pertama", desc: "Pemberitahuan pelanggaran melalui notifikasi", color: "bg-brand-700" },
          { title: "Peringatan Kedua", desc: "Penonaktifan akun Anda", color: "bg-accent-500" },
          { title: "Peringatan Ketiga", desc: "Pelaporan kepada pihak berwajib.", color: "bg-red-500" },
        ],
      },
    ],
  },
];