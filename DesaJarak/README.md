Berikut penjelasan profesional tentang proyek ini:

## Ringkasan Proyek

Ini adalah **platform aplikasi Desa berbasis React + Vite**, mencakup dua sisi pengguna dalam satu basis kode: **Admin** dan **Warga**.

### Arsitektur Umum

Proyek dibangun dengan:
- **React** sebagai library UI
- **Vite** sebagai build tool
- **Tailwind CSS** untuk styling
- **react-router-dom** untuk navigasi antar halaman di sisi Warga
- **lucide-react** untuk ikon di sisi Warga, dan Font Awesome untuk ikon di sisi Admin

### Struktur Folder

```
src/
├─ main.jsx        → entry point aplikasi, membungkus semuanya dengan BrowserRouter
├─ App.jsx         → router utama: mengarahkan ke Login/Register, lalu ke Admin atau Warga
├─ data/           → data awal (profil desa, laporan, berita, edukasi, notifikasi)
├─ utils/          → helper functions (format angka, badge status, baca gambar base64)
├─ pages/          → halaman-halaman Admin (Beranda, Laporan, Edukasi, Berita, Profil)
└─ user/           → seluruh halaman untuk sisi Warga
   ├─ App.jsx       → routing internal khusus Warga
   ├─ components/   → Header, Sidebar, BottomNav, ChatWidget, dll
   ├─ data/
   └─ pages/        → Home, Aspirasi, Lacak Laporan, Vote Prioritas, Berita Desa, Edukasi, Akun, Pengaturan, dll.
```

### Alur Aplikasi

1. **Login berhasil sebagai Warga** (atau klik "Tamu") → sistem set state layar ke `user` → merender antarmuka Warga lengkap dengan Sidebar dan routing miliknya sendiri.
2. **Login dengan kredensial Admin** (`admin/admin`) → tetap masuk ke dashboard Admin, tidak berubah dari sebelumnya.
3. **Tombol Keluar** tersedia di halaman Pengaturan pada sisi Warga, yang akan memanggil fungsi logout dan mengembalikan pengguna ke halaman Login sekaligus mereset URL.

### Menjalankan Proyek

```bash
npm install
npm run dev
```

Untuk build produksi:

```bash
npm run build
npm run preview
```