# PLAN: Website Pengatur Keuangan Pribadi

> Aplikasi web untuk mencatat dan memantau keuangan pribadi. Di-host di **Vercel**, database **gratis tanpa langganan**.

---

## Daftar Isi

1. [Ringkasan Proyek](#1-ringkasan-proyek)
2. [Tech Stack](#2-tech-stack)
3. [Fitur](#3-fitur)
4. [Arsitektur](#4-arsitektur)
5. [Desain Database](#5-desain-database)
6. [Logika Bisnis Penting](#6-logika-bisnis-penting)
7. [Halaman dan Navigasi](#7-halaman-dan-navigasi)
8. [Struktur Folder](#8-struktur-folder)
9. [Setup Awal (Langkah demi Langkah)](#9-setup-awal-langkah-demi-langkah)
10. [Autentikasi](#10-autentikasi)
11. [Roadmap dan Checklist](#11-roadmap-dan-checklist)
12. [Deploy ke Vercel](#12-deploy-ke-vercel)
13. [Keamanan](#13-keamanan)
14. [Testing](#14-testing)
15. [Backup dan Pemeliharaan](#15-backup-dan-pemeliharaan)
16. [Risiko dan Solusi](#16-risiko-dan-solusi)
17. [Ide Pengembangan Lanjutan](#17-ide-pengembangan-lanjutan)

---

## 1. Ringkasan Proyek

**Tujuan:** membangun website pribadi untuk mencatat pemasukan, pengeluaran, dan transfer antar dompet, lengkap dengan dashboard, budget bulanan, dan laporan.

**Prinsip:**
- **Gratis total**: hosting, database, dan autentikasi tanpa biaya langganan.
- **Pribadi**: hanya satu pengguna (pemilik) yang bisa login.
- **Mobile-first**: sebagian besar pencatatan dilakukan dari HP, jadi input harus cepat.
- **Sederhana dan awet**: stack minimalis agar mudah dirawat sendiri.

**Target pengguna:** satu orang (pemilik aplikasi).

**Kriteria sukses:**
- Mencatat satu transaksi bisa dilakukan dalam kurang dari 10 detik.
- Saldo dan laporan selalu akurat.
- Berjalan stabil di paket gratis Vercel dan Neon.

---

## 2. Tech Stack

| Bagian | Pilihan | Alasan |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Terintegrasi sempurna dengan Vercel, frontend dan backend satu proyek |
| Styling | **Tailwind CSS** | Cepat dan konsisten |
| Komponen UI | **shadcn/ui** | Komponen rapi, bisa dikustomisasi penuh |
| Grafik | **Recharts** | Ringan, cocok untuk pie, bar, dan line chart |
| Form | **React Hook Form + Zod** | Validasi di client dan server memakai skema yang sama |
| Database | **Neon (PostgreSQL)** | Free tier tanpa kartu kredit, tidak dihapus karena tidak aktif |
| ORM | **Drizzle ORM** | Ringan, type-safe, cocok untuk serverless |
| Auth | **Auth.js v5 (NextAuth)** | Login Google, dibatasi ke satu email |
| Hosting | **Vercel (Hobby)** | Gratis untuk proyek non-komersial |
| Tanggal | **date-fns** | Ringan dan mudah dipakai |

**Alternatif database (jika Neon tidak cocok):**

| Opsi | Kelebihan | Kekurangan |
|---|---|---|
| Supabase | Fitur lengkap, auth bawaan | Proyek gratis di-*pause* jika tidak aktif sekitar 1 minggu |
| Turso (SQLite) | Sangat ringan, cepat | Sintaks dan tipe data SQLite, fitur lebih terbatas |

> Batas paket gratis dapat berubah. Cek halaman pricing Vercel, Neon, dan Google Cloud sebelum mulai.

---

## 3. Fitur

### 3.1 MVP (wajib)

- [ ] Login Google, hanya email yang diizinkan
- [ ] CRUD **dompet/akun** (tunai, bank, e-wallet) dengan saldo awal
- [ ] CRUD **kategori** pemasukan dan pengeluaran (ikon + warna)
- [ ] Catat **pemasukan**, **pengeluaran**, dan **transfer** antar dompet
- [ ] Daftar transaksi dengan filter (tanggal, kategori, dompet, tipe) dan pencarian catatan
- [ ] **Dashboard**: total saldo, pemasukan vs pengeluaran bulan ini, grafik pengeluaran per kategori, transaksi terbaru
- [ ] Format **Rupiah** di seluruh aplikasi
- [ ] Tampilan responsif (mobile-first)

### 3.2 Tahap 2

- [ ] **Budget bulanan** per kategori dengan progress bar dan peringatan (80% dan 100%)
- [ ] **Transaksi berulang** (gaji, langganan, cicilan)
- [ ] **Ekspor CSV** dan impor CSV
- [ ] Dark mode
- [ ] Grafik tren 6 atau 12 bulan terakhir

### 3.3 Tahap 3 (opsional)

- [ ] **Target tabungan** (goals) dengan progress
- [ ] Laporan bulanan dan tahunan (bisa dicetak sebagai PDF)
- [ ] **PWA** agar bisa di-install di HP
- [ ] Tombol tambah cepat (FAB) yang selalu terlihat
- [ ] Lampiran foto struk (butuh storage, lihat bagian 17)
- [ ] Pencatatan utang dan piutang

---

## 4. Arsitektur

```
┌──────────────┐     HTTPS      ┌─────────────────────────┐
│  Browser /   │ ─────────────► │  Vercel                 │
│  HP (PWA)    │                │  Next.js (SSR + Server  │
└──────────────┘                │  Actions + Route Handler)│
                                └───────────┬─────────────┘
                                            │ Drizzle (HTTP / pooled)
                                            ▼
                                ┌─────────────────────────┐
                                │  Neon PostgreSQL        │
                                └─────────────────────────┘

        Auth: Google OAuth ──► Auth.js (session JWT)
```

**Keputusan arsitektur:**
- **Server Components** untuk membaca data (cepat, tanpa API tambahan).
- **Server Actions** untuk menulis data (create, update, delete).
- **Route Handler** hanya dipakai untuk auth, ekspor CSV, dan cron.
- **Vercel Cron** (gratis, terbatas) untuk membuat transaksi berulang otomatis.
- Semua query selalu difilter `user_id` dari sesi.

---

## 5. Desain Database

### 5.1 ERD ringkas

```
users 1───* accounts
users 1───* categories
users 1───* transactions
accounts 1───* transactions (account_id, to_account_id)
categories 1───* transactions
categories 1───* budgets
users 1───* recurring_transactions
users 1───* goals
```

### 5.2 Skema Drizzle (`src/db/schema.ts`)

```ts
import {
  pgTable, pgEnum, uuid, text, bigint, date, integer,
  boolean, timestamp, index, uniqueIndex,
} from "drizzle-orm/pg-core";

export const txType = pgEnum("tx_type", ["income", "expense", "transfer"]);
export const catType = pgEnum("cat_type", ["income", "expense"]);
export const accType = pgEnum("acc_type", ["cash", "bank", "ewallet", "other"]);
export const freq = pgEnum("freq", ["daily", "weekly", "monthly", "yearly"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: accType("type").notNull().default("bank"),
  initialBalance: bigint("initial_balance", { mode: "number" }).notNull().default(0),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: catType("type").notNull(),
  icon: text("icon"),
  color: text("color"),
  isArchived: boolean("is_archived").notNull().default(false),
});

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: txType("type").notNull(),
    accountId: uuid("account_id").notNull().references(() => accounts.id),
    toAccountId: uuid("to_account_id").references(() => accounts.id), // khusus transfer
    categoryId: uuid("category_id").references(() => categories.id), // null untuk transfer
    amount: bigint("amount", { mode: "number" }).notNull(), // selalu positif, dalam Rupiah
    note: text("note"),
    date: date("date").notNull(),
    recurringId: uuid("recurring_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    byUserDate: index("tx_user_date_idx").on(t.userId, t.date),
    byAccount: index("tx_account_idx").on(t.accountId),
    byCategory: index("tx_category_idx").on(t.categoryId),
  })
);

export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
    month: text("month").notNull(), // format "2026-10"
    amount: bigint("amount", { mode: "number" }).notNull(),
  },
  (t) => ({
    uniq: uniqueIndex("budget_unique").on(t.userId, t.categoryId, t.month),
  })
);

export const recurringTransactions = pgTable("recurring_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: txType("type").notNull(),
  accountId: uuid("account_id").notNull().references(() => accounts.id),
  categoryId: uuid("category_id").references(() => categories.id),
  amount: bigint("amount", { mode: "number" }).notNull(),
  note: text("note"),
  frequency: freq("frequency").notNull(),
  nextDate: date("next_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").notNull().default(true),
});

export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  targetAmount: bigint("target_amount", { mode: "number" }).notNull(),
  currentAmount: bigint("current_amount", { mode: "number" }).notNull().default(0),
  deadline: date("deadline"),
});
```

### 5.3 Aturan data

| Aturan | Penjelasan |
|---|---|
| Nominal = integer | Rupiah tidak butuh desimal, hindari float |
| `amount` selalu positif | Arah uang ditentukan oleh `type` |
| Saldo **tidak disimpan** | Dihitung dari `initial_balance` + transaksi |
| Transfer | Wajib `to_account_id`, tanpa `category_id`, dan tidak dihitung sebagai pemasukan/pengeluaran di laporan |
| Hapus dompet/kategori | Gunakan **arsip** (`is_archived`), bukan hapus, supaya riwayat tetap utuh |
| Budget per bulan | Unik per (user, kategori, bulan) |

---

## 6. Logika Bisnis Penting

### 6.1 Perhitungan saldo dompet

```
saldo = initial_balance
      + SUM(income  dengan account_id = dompet)
      - SUM(expense dengan account_id = dompet)
      - SUM(transfer keluar: account_id = dompet)
      + SUM(transfer masuk:  to_account_id = dompet)
```

### 6.2 Ringkasan bulanan

- **Pemasukan** = SUM `income` pada bulan itu
- **Pengeluaran** = SUM `expense` pada bulan itu
- **Selisih (net)** = pemasukan - pengeluaran
- Transfer **dikecualikan**

### 6.3 Budget

- Terpakai = SUM `expense` kategori tersebut pada bulan itu
- Persentase = terpakai / budget × 100
- Status: **aman** (<80%), **waspada** (80–99%), **melebihi** (≥100%)

### 6.4 Transaksi berulang

1. Vercel Cron memanggil `/api/cron/recurring` setiap hari.
2. Endpoint dilindungi `CRON_SECRET`.
3. Ambil semua rule aktif dengan `next_date <= hari ini`.
4. Buat transaksi (ulangi jika ada beberapa periode yang terlewat), lalu majukan `next_date`.
5. Nonaktifkan rule jika melewati `end_date`.

> Cron pada paket Hobby terbatas frekuensinya (cek dokumentasi Vercel). Cukup untuk 1x per hari.

### 6.5 Zona waktu

- Simpan `date` sebagai tanggal murni (tanpa jam).
- Gunakan zona waktu **Asia/Jakarta** saat menentukan "hari ini" dan batas bulan, agar transaksi malam hari tidak pindah bulan.

---

## 7. Halaman dan Navigasi

| Route | Fungsi |
|---|---|
| `/login` | Tombol "Masuk dengan Google" |
| `/dashboard` | Ringkasan saldo, grafik, transaksi terbaru |
| `/transactions` | Daftar, filter, tambah/edit/hapus transaksi |
| `/accounts` | Daftar dompet dan saldo masing-masing |
| `/categories` | Kelola kategori |
| `/budgets` | Budget bulanan dan progress |
| `/recurring` | Transaksi berulang (tahap 2) |
| `/goals` | Target tabungan (tahap 3) |
| `/reports` | Laporan bulanan/tahunan |
| `/settings` | Profil, ekspor/impor data, tema |

**Navigasi:**
- **Mobile:** bottom navigation (Dashboard, Transaksi, + Tambah, Budget, Lainnya).
- **Desktop:** sidebar kiri.

### Wireframe dashboard

```
┌────────────────────────────────────────────┐
│  Total Saldo           Rp 12.450.000       │
├──────────────┬──────────────┬──────────────┤
│ Pemasukan    │ Pengeluaran  │ Selisih      │
│ Rp 8.000.000 │ Rp 3.250.000 │ +Rp 4.750.000│
├──────────────┴──────────────┴──────────────┤
│  [Pie] Pengeluaran per kategori            │
├────────────────────────────────────────────┤
│  [Bar] Tren 6 bulan terakhir               │
├────────────────────────────────────────────┤
│  Transaksi terbaru                         │
│  • Makan siang      -Rp 35.000             │
│  • Gaji             +Rp 8.000.000          │
└────────────────────────────────────────────┘
```

### Form tambah transaksi (diutamakan cepat)

1. Toggle tipe: **Pengeluaran / Pemasukan / Transfer**
2. Input nominal (keyboard angka, auto-format ribuan)
3. Pilih kategori (grid ikon) atau dompet tujuan untuk transfer
4. Pilih dompet (default: dompet terakhir dipakai)
5. Tanggal (default: hari ini) dan catatan opsional
6. Simpan

---

## 8. Struktur Folder

```
finance-app/
├─ drizzle/                    # file migrasi (auto-generate)
├─ public/
│  ├─ icons/                   # ikon PWA
│  └─ manifest.json
├─ src/
│  ├─ app/
│  │  ├─ (auth)/
│  │  │  └─ login/page.tsx
│  │  ├─ (app)/
│  │  │  ├─ layout.tsx         # sidebar + bottom nav + cek sesi
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ transactions/page.tsx
│  │  │  ├─ accounts/page.tsx
│  │  │  ├─ categories/page.tsx
│  │  │  ├─ budgets/page.tsx
│  │  │  ├─ recurring/page.tsx
│  │  │  ├─ goals/page.tsx
│  │  │  ├─ reports/page.tsx
│  │  │  └─ settings/page.tsx
│  │  ├─ api/
│  │  │  ├─ auth/[...nextauth]/route.ts
│  │  │  ├─ export/route.ts    # ekspor CSV
│  │  │  └─ cron/recurring/route.ts
│  │  ├─ layout.tsx
│  │  └─ globals.css
│  ├─ actions/                 # Server Actions
│  │  ├─ transactions.ts
│  │  ├─ accounts.ts
│  │  ├─ categories.ts
│  │  └─ budgets.ts
│  ├─ components/
│  │  ├─ ui/                   # shadcn/ui
│  │  ├─ charts/               # PieChart, BarChart wrapper
│  │  ├─ forms/                # TransactionForm, AccountForm, ...
│  │  └─ layout/               # Sidebar, BottomNav
│  ├─ db/
│  │  ├─ index.ts              # koneksi Drizzle + Neon
│  │  ├─ schema.ts
│  │  └─ queries/              # fungsi baca data (saldo, ringkasan, dll.)
│  ├─ lib/
│  │  ├─ auth.ts               # konfigurasi Auth.js
│  │  ├─ format.ts             # formatRupiah, formatTanggal
│  │  ├─ date.ts               # helper zona waktu Jakarta
│  │  ├─ validators.ts         # skema Zod
│  │  └─ utils.ts
│  └─ middleware.ts            # proteksi route
├─ drizzle.config.ts
├─ .env.local                  # JANGAN di-commit
├─ .env.example
├─ next.config.ts
├─ vercel.json                 # jadwal cron
└─ package.json
```

---

## 9. Setup Awal (Langkah demi Langkah)

### 9.1 Prasyarat

- Node.js LTS terbaru dan npm/pnpm
- Akun **GitHub**, **Vercel**, **Neon**, dan **Google Cloud Console**
- Git terpasang

### 9.2 Buat proyek

```bash
npx create-next-app@latest finance-app --typescript --tailwind --eslint --app --src-dir
cd finance-app
npx shadcn@latest init
```

### 9.3 Pasang dependensi

```bash
npm i drizzle-orm @neondatabase/serverless next-auth@beta
npm i zod react-hook-form @hookform/resolvers recharts date-fns
npm i -D drizzle-kit dotenv
```

### 9.4 Siapkan Neon

1. Daftar di neon.tech, buat project baru (pilih region terdekat, misalnya Singapore).
2. Salin **connection string** (pakai versi *pooled*).
3. Simpan di `.env.local` sebagai `DATABASE_URL`.

### 9.5 Koneksi database (`src/db/index.ts`)

```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### 9.6 Konfigurasi Drizzle (`drizzle.config.ts`)

```ts
import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

### 9.7 Migrasi

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 9.8 Seed kategori default

Buat skrip seed untuk kategori awal.

- **Pengeluaran:** Makan & Minum, Transportasi, Belanja, Tagihan, Hiburan, Kesehatan, Pendidikan, Lainnya
- **Pemasukan:** Gaji, Bonus, Hadiah, Lainnya

### 9.9 `.env.example`

```
DATABASE_URL=
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
ALLOWED_EMAIL=
CRON_SECRET=
```

Buat `AUTH_SECRET` dengan: `npx auth secret`

---

## 10. Autentikasi

### 10.1 Google OAuth

1. Buka Google Cloud Console, buat project, lalu **APIs & Services → Credentials → Create OAuth client ID** (Web application).
2. **Authorized redirect URI:**
   - Lokal: `http://localhost:3000/api/auth/callback/google`
   - Produksi: `https://NAMA-APP.vercel.app/api/auth/callback/google`
3. Salin Client ID dan Client Secret ke environment variables.

### 10.2 Konfigurasi (`src/lib/auth.ts`)

```ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      // hanya email pemilik yang boleh masuk
      return user.email === process.env.ALLOWED_EMAIL;
    },
  },
});
```

### 10.3 Proteksi

- `middleware.ts` mengarahkan pengguna yang belum login ke `/login`.
- Setiap Server Action dan query **wajib** memanggil `auth()` dan memakai `user_id`-nya.
- Saat login pertama, buat baris `users` jika belum ada, lalu isi kategori default.

---

## 11. Roadmap dan Checklist

### Fase 0 — Persiapan (±1 hari)
- [ ] Buat repo GitHub
- [ ] Buat akun Neon, Vercel, Google Cloud
- [ ] Inisialisasi proyek Next.js + Tailwind + shadcn/ui

### Fase 1 — Fondasi (±2–3 hari)
- [ ] Skema Drizzle dan migrasi pertama
- [ ] Koneksi Neon berhasil
- [ ] Auth Google + pembatasan email
- [ ] Middleware proteksi route
- [ ] Layout utama (sidebar + bottom nav)
- [ ] Helper `formatRupiah` dan zona waktu Jakarta

### Fase 2 — CRUD inti (±4–5 hari)
- [ ] Halaman dompet (CRUD + arsip)
- [ ] Halaman kategori (CRUD + arsip, seed default)
- [ ] Form transaksi (pengeluaran, pemasukan, transfer)
- [ ] Daftar transaksi + filter + pencarian + paginasi
- [ ] Edit dan hapus transaksi
- [ ] Validasi Zod di server

### Fase 3 — Dashboard (±3 hari)
- [ ] Query saldo per dompet dan total
- [ ] Kartu ringkasan bulan ini
- [ ] Pie chart pengeluaran per kategori
- [ ] Bar chart tren bulanan
- [ ] Transaksi terbaru
- [ ] Pemilih bulan

**Target MVP selesai di akhir Fase 3.**

### Fase 4 — Budget dan otomatisasi (±1 minggu)
- [ ] CRUD budget per kategori per bulan
- [ ] Progress bar dan status peringatan
- [ ] Transaksi berulang + Vercel Cron
- [ ] Ekspor CSV
- [ ] Impor CSV
- [ ] Dark mode

### Fase 5 — Penyempurnaan (±1 minggu)
- [ ] Halaman laporan bulanan/tahunan
- [ ] Target tabungan
- [ ] PWA (manifest, ikon, service worker)
- [ ] Tombol tambah cepat (FAB)
- [ ] Loading state, error state, empty state
- [ ] Optimasi performa dan audit aksesibilitas

---

## 12. Deploy ke Vercel

1. Push kode ke GitHub.
2. Di Vercel: **Add New → Project**, pilih repo.
3. Isi **Environment Variables** (Production dan Preview):

| Variabel | Sumber |
|---|---|
| `DATABASE_URL` | Neon (pooled connection) |
| `AUTH_SECRET` | hasil `npx auth secret` |
| `AUTH_GOOGLE_ID` | Google Cloud Console |
| `AUTH_GOOGLE_SECRET` | Google Cloud Console |
| `ALLOWED_EMAIL` | emailmu |
| `CRON_SECRET` | string acak panjang |

4. Deploy. Setiap `git push` ke `main` akan otomatis deploy ulang.
5. Tambahkan URL produksi ke **Authorized redirect URI** di Google Cloud.
6. Jalankan migrasi ke database produksi (`npx drizzle-kit migrate` dengan `DATABASE_URL` produksi).

### `vercel.json` (cron)

```json
{
  "crons": [
    { "path": "/api/cron/recurring", "schedule": "0 17 * * *" }
  ]
}
```

> Jadwal cron memakai UTC. `0 17 * * *` = pukul 00:00 WIB.

**Tips:** gunakan satu branch Neon untuk development dan satu untuk produksi agar data asli tidak tercampur saat bereksperimen.

---

## 13. Keamanan

- [ ] Semua query difilter `user_id` dari sesi, tidak pernah dari input client
- [ ] Validasi semua input dengan **Zod** di server
- [ ] Login dibatasi ke `ALLOWED_EMAIL`
- [ ] `.env*` masuk `.gitignore`, jangan pernah di-commit
- [ ] Endpoint cron dilindungi `CRON_SECRET`
- [ ] Gunakan Drizzle (query terparameter) untuk mencegah SQL injection
- [ ] Pastikan `account_id` dan `category_id` pada transaksi milik user yang sama
- [ ] Aktifkan 2FA pada akun GitHub, Vercel, Neon, dan Google
- [ ] Jangan tampilkan detail error database ke client

---

## 14. Testing

| Jenis | Alat | Yang diuji |
|---|---|---|
| Unit | Vitest | Helper format, perhitungan saldo, logika budget, tanggal berulang |
| Validasi | Vitest + Zod | Skema input (nominal negatif, transfer tanpa tujuan, dll.) |
| E2E (opsional) | Playwright | Alur login, tambah transaksi, filter |
| Manual | Browser + HP | Responsif, form cepat, grafik |

**Kasus uji penting:**
- Transfer tidak mengubah total saldo, hanya memindahkan antar dompet
- Transaksi pada tanggal 31 pukul 23:59 WIB masuk ke bulan yang benar
- Menghapus transaksi memperbarui saldo dan budget
- Transaksi berulang tanggal 31 pada bulan yang hanya punya 30 hari
- Dompet yang diarsipkan tetap muncul di riwayat

---

## 15. Backup dan Pemeliharaan

- **Ekspor CSV** manual setiap bulan, simpan di Google Drive.
- Manfaatkan fitur **point-in-time restore / branching** Neon (cek batas retensi di paket gratis).
- Jadwalkan pengecekan bulanan: update dependensi, cek batas kuota gratis.
- Gunakan Dependabot atau `npm audit` untuk menjaga keamanan paket.
- Catat setiap perubahan skema lewat file migrasi Drizzle yang di-commit.

---

## 16. Risiko dan Solusi

| Risiko | Dampak | Solusi |
|---|---|---|
| Kuota gratis berubah | Biaya atau pembatasan | Pantau pricing, siapkan ekspor CSV, schema standar PostgreSQL mudah dipindah |
| Cold start database | Request pertama lambat | Neon pulih otomatis dalam beberapa detik, tambahkan loading state |
| Data salah input | Laporan tidak akurat | Fitur edit/hapus mudah, konfirmasi sebelum hapus |
| Akun Google terkunci | Tidak bisa login | Tambahkan provider cadangan (email magic link) bila perlu |
| Kehilangan data | Riwayat hilang | Backup CSV rutin dan branch Neon |
| Cron terlewat | Transaksi berulang tidak muncul | Proses catch-up: buat semua periode yang terlewat saat cron berikutnya jalan |

---

## 17. Ide Pengembangan Lanjutan

- **Foto struk** memakai Vercel Blob atau Cloudflare R2 (cek kuota gratis).
- **Multi-mata uang** dengan kurs manual.
- **Notifikasi** pengingat catat transaksi harian (PWA push).
- **Input suara** atau input teks cepat, misalnya "makan siang 35rb".
- **Tag** transaksi selain kategori.
- **Patungan / split bill** sederhana.
- **Pencatatan aset dan investasi** (reksa dana, emas, saham).
- **Insight otomatis**, misalnya "pengeluaran makan naik 20% dari bulan lalu".

---

## Ringkasan Cepat

```
Next.js + TypeScript + Tailwind + shadcn/ui
Drizzle ORM → Neon PostgreSQL (gratis)
Auth.js (Google, hanya email sendiri)
Deploy: GitHub → Vercel (Hobby, gratis)
MVP: ±2 minggu | Lengkap: ±4 minggu (santai)
```
