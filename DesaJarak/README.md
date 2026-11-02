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

Untuk mengarahkan permintaan `/api` dari Vite ke backend yang sudah online saat pengembangan, atur `API_PROXY_TARGET` ke URL backend sebelum menjalankan Vite. Tanpa variabel ini, Vite tidak memakai alamat backend bawaan.

Untuk build produksi:

```bash
npm run build
npm run preview
```

### Railway PostgreSQL

Di **service aplikasi** Railway (bukan service PostgreSQL), tambahkan satu variable reference:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

Ganti `Postgres` dengan nama service PostgreSQL persis seperti yang tampil di project Railway. Nilai ini otomatis memakai host internal `postgres.railway.internal`. Jangan menyalin `DATABASE_PUBLIC_URL` atau URL `*.proxy.rlwy.net` ke service aplikasi. Jangan set `PORT` manual karena Railway mengisinya otomatis.

Pastikan service aplikasi dan PostgreSQL berada di project/environment Railway yang sama. Alternatifnya, tambahkan `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, dan `PGDATABASE` ke service aplikasi menggunakan Variable Reference ke service PostgreSQL. Jangan menaruh password langsung di source code atau repository. `PGDATA` dan `SSL_CERT_DAYS` adalah konfigurasi service PostgreSQL dan tidak dibaca oleh backend.

Untuk pengembangan lokal, gunakan `DATABASE_PUBLIC_URL` dari service PostgreSQL Railway atau PostgreSQL lokal. Host `*.railway.internal` hanya bisa diakses dari dalam Railway. Saat pertama kali berjalan, server membuat tabel `users` dan `app_data`, lalu memasukkan data awal dari `src/data/initialData.js` dan `src/user/data/`.

### Upload Foto di Railway

Foto disimpan di folder `uploads/` pada disk container. Agar foto tetap tersedia setelah redeploy atau restart, tambahkan volume pada **service aplikasi** Railway dan mount di:

```text
/app/DesaJarak/uploads
```

Jangan mount volume di `/app` atau `/app/DesaJarak` karena dapat menimpa file aplikasi. Format foto yang didukung adalah JPG, PNG, WebP, dan GIF dengan ukuran maksimal 5 MB. Foto yang lebih besar akan dikompres otomatis di browser sebelum diunggah.
