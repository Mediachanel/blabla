# Sistem Informasi SDM Kesehatan Dinas Kesehatan Provinsi DKI Jakarta

MVP aplikasi kepegawaian internal berbasis Next.js App Router, Tailwind CSS, JWT HttpOnly cookie, RBAC, mock API, dan struktur siap migrasi ke MySQL.

## Menjalankan Project

```bash
npm install
npm run dev
```

Aplikasi berjalan di `http://localhost:3000`.

## Pakai Database Offline Lokal

Bisa. Untuk cek sistem sebelum deploy, pakai MySQL/MariaDB lokal saja selama nama database dan struktur tabel sama dengan server.

Langkah yang disarankan untuk XAMPP/phpMyAdmin lokal:

```bash
copy .env.local.example .env.local
npm run check:mysql:local
npm run dev
```

Isi `.env.local` untuk koneksi lokal. Default project ini sudah cocok untuk phpMyAdmin lokal umum:

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=si_data
JWT_SECRET=dev-local-only-change-me
APP_ORIGIN=http://localhost:3000
```

Lalu import SQL ke database lokal `si_data` dengan urutan:

```bash
sql/ukpd_password_generated.sql
sql/export_pegawai_ukpd.sql
sql/create_alamat_riwayat_tables.sql
sql/import_alamat_generated_20_parts/import_alamat_part_01.sql s.d. part_20.sql
sql/create_keluarga_from_existing.sql
sql/import_keluarga_generated_parts/import_keluarga_part_01.sql s.d. part_20.sql
```

Catatan:

- `create_keluarga_from_existing.sql` hanya membuat tabel `keluarga` dan seed dari tabel lama `pasangan` + `anak` jika tabel itu ada. Kalau lokal Anda hanya memakai hasil generate, lanjutkan juga dengan import file part `import_keluarga_generated_parts`.
- App sudah mencoba host lokal otomatis seperti `127.0.0.1` dan `localhost`, plus database `si_data`, jadi untuk test offline ini memang didukung.
- Jika `npm run check:mysql:local` sukses, aplikasi pada umumnya sudah bisa membaca database lokal yang sama polanya dengan server.

## Deploy ke CasaOS

Ada dua skenario. Pilih salah satu, jangan dicampur:

- `docker-compose.casaos.yml`: app memakai MariaDB yang sudah ada di CasaOS/phpMyAdmin.
- `docker-compose.yml`: app dan MySQL berjalan dalam satu stack compose baru.

### Skenario A: Pakai MariaDB CasaOS yang sudah ada

Screenshot phpMyAdmin menunjukkan database `si_data` bisa diakses dari container lewat `host.docker.internal:3306`. Untuk skenario ini, pakai `docker-compose.casaos.yml`.

Di phpMyAdmin, jalankan/import sekali file ini agar app tidak perlu login sebagai root:

```bash
sql/create_app_user_casaos.sql
```

Lalu deploy:

```bash
git pull origin sisdmk2-casaos
docker compose -f docker-compose.casaos.yml down
docker compose -f docker-compose.casaos.yml build --no-cache app
docker compose -f docker-compose.casaos.yml up -d
```

Tes koneksi dari container app:

```bash
docker exec sisdmk2-app npm run check:mysql
```

Jika `sisdmk2_app` belum dibuat, app akan gagal dengan pesan akses user. Jalankan/import `sql/create_app_user_casaos.sql` dari phpMyAdmin.

### Skenario B: App dan MySQL satu stack compose

Pakai `docker-compose.yml`. Dalam skenario ini host MySQL untuk app adalah `db:3306`, bukan `host.docker.internal`.

```bash
docker compose down
docker compose build --no-cache app
docker compose up -d
docker exec -i sisdmk2-db mysql -uroot -p"$MYSQL_ROOT_PASSWORD" si_data < sql/ukpd_password_generated.sql
docker exec -i sisdmk2-db mysql -uroot -p"$MYSQL_ROOT_PASSWORD" si_data < sql/export_pegawai_ukpd.sql
docker exec sisdmk2-app npm run check:mysql
```

Setelah berjalan, app tersedia di `http://IP-CASAOS:8080`.

Catatan troubleshooting:

- Di dalam container, `localhost` dan `127.0.0.1` menunjuk ke container itu sendiri. Untuk database di host/CasaOS, pakai `host.docker.internal` dengan `extra_hosts: host.docker.internal:host-gateway`.
- Kalau database berada dalam compose yang sama, pakai nama service `db`.
- Kolom `ukpd.password` harus memakai hash bcrypt atau SHA-256, bukan plaintext.
- Jangan pakai password seed/default di production. Aplikasi production menolak password umum seperti `admin123` dan `password123`.
- Jika muncul pesan gagal konek database, cek `MYSQL_HOSTS`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, dan `MYSQL_DATABASES` pada container app.
- Jika volume `sisdmk2_mysql_data` sudah pernah dibuat dengan password root lama, mengganti `MYSQL_ROOT_PASSWORD` di compose tidak otomatis mengubah password MySQL. Pakai password lama, ubah password root manual dari MySQL, atau buat volume baru bila data lama boleh dihapus.
- Aplikasi mencoba beberapa host MySQL secara berurutan dari `MYSQL_HOSTS`, lalu fallback lokal/CasaOS: `127.0.0.1`, `localhost`, `db`, `mariadb`, `mysql`, `host.docker.internal`, `172.17.0.1`, dan `172.31.254.56`. Database yang dicoba berasal dari `MYSQL_DATABASES`/`MYSQL_DATABASE`, lalu fallback `sisdmk2` dan `si_data`.

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

## Akun Login

Jika MySQL aktif, login membaca tabel `ukpd`. Buat seed password dengan `UKPD_DEFAULT_PASSWORD="password-kuat-minimal-12" node scripts/generate-ukpd-password-sql.mjs`, lalu import `sql/ukpd_password_generated.sql`.

| Role | Username / Nama UKPD | Password |
| --- | --- | --- |
| Super Admin | `SUPER ADMIN` | password unik yang sudah diganti |
| Dinas Kesehatan | `Dinas Kesehatan` | password unik yang sudah diganti |
| Admin UKPD | nama UKPD, contoh `Puskesmas Tebet` | password unik yang sudah diganti |
| Admin UKPD | kode UKPD, contoh `4` | password unik yang sudah diganti |

Di production, `JWT_SECRET`, `MYSQL_PASSWORD`, dan password akun wajib diset kuat. Secret lokal/contoh tidak boleh dipakai untuk deploy.

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
- Password UKPD diverifikasi dari tabel MySQL `ukpd`; format bcrypt dan SHA-256 didukung.
- API pegawai, dashboard, DUK, drilldown, dan pivot membaca tabel MySQL `pegawai` dan `ukpd`. Jika koneksi database gagal, API mengembalikan error dan tidak memakai data JSON dummy.
- Query MySQL memakai `mysql2/promise` dari `src/lib/db/mysql.js`.
- Untuk produksi, gunakan `id_ukpd` sebagai foreign key utama dan pertahankan `nama_ukpd` sebagai label laporan bila diperlukan.
