# JuraganKos

Aplikasi manajemen rumah kos berbahasa Indonesia berdasarkan dokumen **JuraganKos.pdf**. Dibangun dengan Next.js, React, TypeScript, dan SQLite. Data operasional disimpan di server; browser hanya menyimpan cookie sesi HttpOnly.

## Menjalankan

Gunakan Node.js **22.13 atau lebih baru** (direkomendasikan Node.js 24 atau 26).

```bash
npm install
npm run dev
```

Buka **http://localhost:3000**. Dependensi sudah tersedia di workspace ini, sehingga `npm run dev` bisa langsung digunakan. Untuk mencoba tanpa mengisi data, pilih **Jelajahi dengan data demo**. Untuk penggunaan sendiri, pilih **Daftar sekarang**; akun baru dimulai dengan data kosong.

```bash
npm test
npm run typecheck
npm run build
npm start
```

`npm start` menjalankan build produksi pada port 3000. Server memakai `127.0.0.1` secara default. Untuk akses LAN, jalankan `npx next start --hostname 0.0.0.0` pada lingkungan yang Anda kelola.

## Cakupan sesuai sprint

| WBS | Modul | Implementasi |
| --- | --- | --- |
| 4.2 | Autentikasi | Pendaftaran pemilik, login, logout; password PBKDF2 dengan salt unik; sesi 7 hari; data terpisah per akun |
| 4.3 | Manajemen kamar | Tambah, edit, hapus; nomor unik; tipe, lantai, tarif, fasilitas; status tersedia/terisi/perawatan dihitung dari data |
| 4.4 | Pendataan penghuni | Tambah, edit, detail, pencarian, filter aktif/checkout; alokasi kamar kosong; riwayat tetap tersimpan |
| 4.5 | Pencatatan sewa | Pembayaran per penghuni dan periode; tunai/transfer/QRIS; cicilan; tanggal, catatan, kuitansi cetak |
| 4.6 | Status pembayaran | Lunas/sebagian/belum bayar, sisa tagihan; filter periode; catat pembayaran langsung dari tagihan |
| 4.7 | Dashboard | Total kamar, okupansi, pendapatan, tunggakan; grafik enam bulan dari transaksi; komposisi kamar; daftar tagihan |
| 5.2–5.3 | Pengujian | Unit aturan bisnis dan integrasi API dengan database sementara |
| 6.2 | Panduan | Panduan di aplikasi dan dokumentasi ini |

Tambahan: pengaturan nama/alamat properti, laporan CSV bulanan, desain responsif, pencarian, notifikasi penyimpanan, konfirmasi checkout/hapus, dan tampilan kosong.

## Alur penggunaan

1. Daftar akun pemilik, lalu atur nama dan alamat di **Pengaturan**.
2. Tambahkan kamar dengan tarif bulanan dan fasilitasnya.
3. Daftarkan penghuni pada kamar tersedia, lengkapi telepon dan tanggal masuk.
4. Catat pembayaran pada periode sewa yang benar. Pembayaran sebagian mengurangi sisa tagihan; kelebihan bayar ditolak.
5. Pantau tagihan di **Status pembayaran** dan unduh laporan dari dashboard/pembayaran.
6. Setelah tagihan bulan berjalan lunas, checkout penghuni agar kamar tersedia kembali.

Asumsi bisnis karena PDF tidak menetapkan detailnya: satu properti per akun, sewa bulanan penuh sejak bulan masuk, jatuh tempo tanggal 5, tanpa prorata/denda otomatis. Tarif kamar yang memiliki riwayat penghuni tidak boleh diubah agar histori tagihan konsisten. Untuk perpindahan kamar, checkout penghuni lalu daftarkan kembali. Kamar yang memiliki riwayat tidak bisa dihapus. Akun demo dibuat terpisah dengan data contoh; jangan gunakan akun demo untuk pencatatan riil karena tidak memiliki password yang diberikan kepada pengguna.

## Penyimpanan dan arsitektur

- `app/page.tsx`: antarmuka, modal profil/akun (pada avatar kanan atas), dan navigasi modul.
- `app/globals.css`: gaya antarmuka dan tata letak responsif desktop maupun ponsel.
- `app/api/manage/route.ts`: endpoint autentikasi dan mutasi dengan validasi sesi serta pemeriksaan origin.
- `lib/kos.ts`: aturan bisnis, tipe data, perhitungan tagihan, dan data demo.
- `db/index.ts`: adaptor database untuk SQLite lokal (`node:sqlite`, WAL) dan Turso (`@libsql/client`), inisialisasi skema otomatis, transaksi, dan prepared statements.
- `db/migrations/001_initial.sql`: referensi skema tabel `users`, `sessions`, dan `records`. Kamar, penghuni, dan pembayaran tersimpan sebagai agregat JSON per pemilik di `records` dengan nomor versi untuk menolak pembaruan bersamaan yang memakai data lama.

Database lokal otomatis dibuat di `data/juragankos.sqlite`. Folder `data/` tidak masuk Git. Untuk lokasi berbeda, set variabel `DATABASE_PATH` ke path absolut pada disk persisten. Cadangkan database menggunakan mekanisme backup SQLite saat server berjalan, atau hentikan server sebelum menyalin seluruh folder `data/`.

## Hosting Gratis (Vercel + Turso)

Aplikasi ini juga mendukung database SQLite awan **Turso** (`@libsql/client`) sehingga dapat di-deploy gratis ke **Vercel** tanpa server/disk lokal:

1. **Buat database gratis di Turso** (tanpa kartu kredit):
   - Daftar di [turso.tech](https://turso.tech) atau jalankan Turso CLI:
     ```bash
     turso auth signup
     turso db create juragankos
     turso db show juragankos --url
     turso db tokens create juragankos
     ```
   - Catat nilai `TURSO_DATABASE_URL` dan `TURSO_AUTH_TOKEN` (lihat `.env.example`). Tabel (`users`, `sessions`, `records`) dibuat otomatis saat permintaan pertama masuk.
2. **Push kode ke GitHub** (pastikan `node_modules/`, `.next/`, `data/`, dan `.env*` tetap diabaikan oleh `.gitignore`).
3. **Deploy gratis di Vercel**:
   - Masuk ke [vercel.com](https://vercel.com) dengan akun GitHub, klik **Add New → Project**, lalu pilih repositori Anda.
   - Biarkan **Root Directory** pada root repositori (`.`) dan atur **Node.js Version** menjadi `22.x`.
   - Tambahkan Environment Variables: `TURSO_DATABASE_URL` dan `TURSO_AUTH_TOKEN`.
   - Klik **Deploy** untuk mendapatkan URL HTTPS gratis (`*.vercel.app`). Akun demo yang kedaluwarsa akan dibersihkan otomatis setiap ada sesi demo baru.
4. **Memperbarui aplikasi di Vercel**:
   - Commit perubahan ke branch `main` lalu jalankan `git push origin main`; Vercel akan otomatis menjalankan `npm run build` dan merilis pembaruan.
   - Alternatif manual jika tidak terhubung ke Git: jalankan `npx vercel --prod`.

## Validasi

- Build produksi Next.js (`npm run build`): berhasil.
- Pemeriksaan TypeScript (`npm run typecheck`): berhasil.
- Tujuh pengujian unit & adaptor (`tests/kos.test.ts`): aturan bisnis, konsistensi data demo, dan adaptor libSQL/Turso: berhasil.
- Integrasi API (`scripts/test-api.mjs`): pendaftaran/login, penyimpanan kamar/penghuni/pembayaran, pembayaran sebagian, validasi checkout, konflik versi, pemeriksaan origin, alias `Host`, cookie HTTPS di balik proxy, penolakan tanpa autentikasi, isolasi akun, logout, dan pembersihan demo kedaluwarsa: berhasil.

`experimental.useTypeScriptCli: false` di `next.config.ts` memakai API TypeScript untuk build tanpa bergantung pada proses CLI terpisah, sementara pemeriksaan tipe build tetap aktif.
