# Sistem Informasi SDM Kesehatan Dinas Kesehatan Provinsi DKI Jakarta

MVP aplikasi kepegawaian internal berbasis Next.js App Router, Tailwind CSS, JWT HttpOnly cookie, RBAC, mock API, dan struktur siap migrasi ke MySQL.

## Menjalankan Project

```bash
npm install
npm run dev
```

Aplikasi berjalan di `http://localhost:3000`.

## Deploy ke CasaOS (Docker Compose)

File untuk deploy sudah disiapkan:

- `Dockerfile`
- `docker-compose.yml`
- `docker-compose.casaos.yml`
- `.env.casaos.example`

Langkah cepat:

1. Salin `.env.casaos.example` jadi `.env`, lalu isi `MYSQL_HOST`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, dan `JWT_SECRET`.
2. Di CasaOS buka **App Store -> Custom Install -> Import docker-compose.yml**.
3. Jika memakai database `si_data` yang sudah ada di CasaOS/phpMyAdmin, upload/isi file `docker-compose.casaos.yml`.
4. Jika ingin membuat MySQL baru dari project ini, upload/isi file `docker-compose.yml`.
5. Jalankan stack.

Setelah berjalan:

- App: `http://IP-CASAOS:3000`
- MySQL: port `3306` (atau sesuai `MYSQL_PORT` di `.env`)

Catatan:

- Jika memakai database server yang sudah ada di CasaOS/phpMyAdmin, set `.env` seperti ini: `MYSQL_HOST=host.docker.internal`, `MYSQL_DATABASE=si_data`, lalu isi user dan password MySQL sesuai akun server.
- Jika memakai MySQL bawaan `docker-compose.yml`, pakai `MYSQL_HOST=db` dan `MYSQL_DATABASE=sisdmk2`.
- Script SQL import otomatis jalan saat container MySQL pertama kali dibuat.
- Kalau mau re-import dari nol, hapus volume `mysql_data` lalu start ulang stack.

## Import CSV Master Pegawai

File CSV pengguna sudah dipetakan dengan script:

```bash
node scripts/import-master-pegawai.mjs "c:\Users\Dinkes_laptop3\Downloads\MASTER DATA PEGAWAI (9).csv"
```

Hasil import disimpan di `src/data/generated/` dan dipakai langsung oleh API MVP:

- `pegawai.json`: 30.963 pegawai
- `ukpd.json`: 91 UKPD
- `alamat.json`: 57.074 alamat domisili/KTP
- `pasangan.json`: 19.645 data pasangan
- `anak.json`: 23.741 data anak
- `import-summary.json`: ringkasan header dan anomali

Ada 1 baris dengan nilai `WILAYAH` anomali yaitu `PUSKESMAS`; data ini ditandai di `import-summary.json`.

## Sinkronisasi Kode UKPD

Daftar UKPD resmi dapat disinkronkan dari CSV:

```bash
node scripts/sync-ukpd-csv.mjs "c:\Users\Dinkes_laptop3\Downloads\ukpd (5).csv"
```

Script ini menimpa `src/data/generated/ukpd.json` dengan daftar UKPD resmi dan mengisi `id_ukpd`/`ukpd_id` pada `pegawai.json` berdasarkan `nama_ukpd`.

Hasil sinkronisasi terakhir:

- 89 UKPD resmi
- 30.963 dari 30.963 pegawai berhasil mendapat kode UKPD
- 0 nama UKPD tidak cocok

Alias nama yang disamakan:

- `Puskesmas Mampang Perapatan` -> `Puskesmas Mampang Prapatan`
- `UPT Pusdatin` -> `UPT Pusat Data dan Informasi Kesehatan`
- `UPT Pusat Pelatihan Kesehatan Daerah` -> `UPT Pusat Pelatihan Pegawai`

## Normalisasi Jenjang Pendidikan

Nilai pendidikan dari CSV distandarkan untuk dashboard agar grafik tidak pecah oleh variasi penulisan:

```bash
node scripts/normalize-generated-education.mjs
```

Kelompok standar: `SD`, `SMP`, `SMA/SMK`, `D1`, `D2`, `D3`, `D4`, `S1`, `Profesi`, `S2`, `Spesialis`, `S3`, dan `Tidak Diketahui`. Nilai asli tetap disimpan di `jenjang_pendidikan_raw`.

## Normalisasi Rumpun Jabatan

Rumpun jabatan PJLP distandarkan menjadi `PJLP` agar grafik tidak pecah menjadi `PJLP Kebersihan`, `PJLP Keamanan`, `Petugas Kebersihan`, dan variasi lain.

```bash
node scripts/normalize-generated-rumpun.mjs
```

Nilai asli tetap disimpan di `status_rumpun_raw`.

## Normalisasi Jabatan Kepmenpan 11

Jabatan Kepmenpan/Permenpan 11 distandarkan dari variasi penulisan mentah ke nama jabatan baku:

```bash
node scripts/normalize-generated-jabatan-menpan.mjs
```

Nilai asli tetap disimpan di `nama_jabatan_menpan_raw`, sedangkan `nama_jabatan_menpan` dipakai dashboard dan tabel sebagai nilai standar.

## Normalisasi Jenis Kelamin

Jenis kelamin distandarkan menjadi `Laki-laki`, `Perempuan`, atau `Tidak Diketahui`:

```bash
node scripts/normalize-generated-gender.mjs
```

Nilai asli tetap disimpan di `jenis_kelamin_raw`.

## Akun Demo

Semua akun memakai password `password123`.

| Role | Username |
| --- | --- |
| Super Admin | `superadmin` |
| Admin Wilayah | `admin-timur` |
| Admin UKPD | `admin-cakung` |

## Struktur Utama

```text
src/
  app/
    (app)/
      dashboard/
      pegawai/
      usulan/
      import-drh/
      duk/
      qna-admin/
      profil/
    api/
    login/
  components/
    layout/
    cards/
    charts/
    forms/
    profile/
    tables/
    ui/
  data/
    menu/
  lib/
    auth/
    constants/
    db/
    helpers/
database/
  schema.sql
```

## Catatan Arsitektur

- RBAC diterapkan pada middleware, sidebar, dan API.
- `filterPegawaiByRole` memastikan Super Admin, Admin Wilayah, dan Admin UKPD hanya menerima data sesuai kewenangan.
- Auth memakai JWT melalui HttpOnly cookie.
- Password demo di-hash dengan bcrypt-compatible `bcryptjs`.
- API pegawai, dashboard, DUK, drilldown, dan pivot akan membaca tabel MySQL `pegawai` dan `ukpd` jika variabel `MYSQL_HOST`, `MYSQL_USER`, dan `MYSQL_DATABASE` tersedia. Jika koneksi belum tersedia, aplikasi fallback ke data JSON lokal.
- Query MySQL memakai `mysql2/promise` dari `src/lib/db/mysql.js`.
- Untuk produksi, gunakan `id_ukpd` sebagai foreign key utama dan pertahankan `nama_ukpd` sebagai label laporan bila diperlukan.
