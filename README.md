# Ruang Uang

Aplikasi pencatatan keuangan pribadi. Pengguna dapat mengelola dompet, kategori, pemasukan, pengeluaran, transfer, dan budget bulanan.

## Teknologi

- Next.js App Router dan TypeScript
- Neon Postgres dan Neon Auth
- Drizzle ORM
- Tailwind CSS

## Menjalankan secara lokal

1. Pasang dependensi:

   ```bash
   npm install
   ```

2. Salin `.env.example` menjadi `.env.local`, lalu isi koneksi Neon, `NEON_AUTH_BASE_URL`, dan `NEON_AUTH_COOKIE_SECRET`. Jangan commit `.env.local`.

3. Jalankan migrasi dan server:

   ```bash
   npm run db:migrate
   npm run dev
   ```

4. Buka `http://localhost:3000`, buat akun, lalu verifikasi email.

## Migrasi database

Schema berada di `src/db/schema.ts`; migrasi SQL berada di `drizzle/`.

```bash
npm run db:generate
npm run db:migrate
```

Gunakan `DATABASE_URL_UNPOOLED` untuk migrasi dan `DATABASE_URL` pooled untuk aplikasi.

## Build production

```bash
npm run build
npm run start
```

## Email verifikasi

Neon Auth saat ini menggunakan shared email provider untuk development. Untuk deployment publik, atur SMTP transaksional sendiri melalui konfigurasi Neon Auth agar kode verifikasi dapat dikirim dengan andal. Kredensial SMTP disimpan pada konfigurasi Neon, bukan di repository.
