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

Backend membaca `DATABASE_URL` atau variabel koneksi `PG*` dari environment service aplikasi. Di **service aplikasi** Railway, tambahkan `DATABASE_URL` sebagai Variable Reference ke service PostgreSQL. Ganti `Postgres` di bawah dengan nama service PostgreSQL persis seperti yang tampil di project Railway:

```text
DATABASE_URL=postgresql://${{Postgres.POSTGRES_USER}}:${{Postgres.POSTGRES_PASSWORD}}@${{Postgres.RAILWAY_PRIVATE_DOMAIN}}:5432/${{Postgres.POSTGRES_DB}}
```

Pastikan service aplikasi dan PostgreSQL berada di project/environment Railway yang sama dan terhubung melalui private network. `DATABASE_URL` diprioritaskan jika tersedia. Alternatifnya, tambahkan `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, dan `PGDATABASE` ke service aplikasi menggunakan Variable Reference ke service PostgreSQL. Jangan menaruh password langsung di source code atau repository. `PGDATA` dan `SSL_CERT_DAYS` adalah konfigurasi service PostgreSQL dan tidak dibaca oleh backend. Saat pertama kali berjalan, server membuat tabel `users` dan `app_data`, lalu memasukkan data awal dari `src/data/initialData.js` dan `src/user/data/`.

### Akun Warga dan Login Google

Pendaftaran username/password membuat akun warga dan menyimpan kata sandi dalam bentuk hash. Login Google menggunakan Google Identity Services; server memverifikasi ID token dan membuat sesi warga yang berlaku 30 hari. Untuk mengaktifkannya:

1. Buat OAuth Client ID bertipe **Web application** di Google Cloud Console.
2. Daftarkan origin lokal dan domain produksi aplikasi sebagai authorized JavaScript origins.
3. Isi `GOOGLE_CLIENT_ID` pada environment service backend (contoh formatnya ada di `.env.example`). Client ID bukan rahasia; jangan menaruh client secret di frontend.

Jika `GOOGLE_CLIENT_ID` belum disetel, tombol Google menampilkan bahwa integrasi belum dikonfigurasi. Database menyimpan sesi, data laporan, dan pilihan privasi: laporan pribadi terlihat oleh pelapor dan admin, sedangkan halaman Lacak Laporan hanya menerima laporan publik. Halaman Riwayat mengambil laporan milik akun yang sedang masuk.
