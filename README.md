# Sistem Informasi SDM Kesehatan Dinas Kesehatan Provinsi DKI Jakarta

MVP aplikasi kepegawaian internal berbasis Next.js App Router, Tailwind CSS, JWT HttpOnly cookie, RBAC, mock API, dan struktur siap migrasi ke MySQL.

## Menjalankan Project

```bash
npm install
npm run dev
```

Aplikasi berjalan di `http://localhost:3000`.

## Deploy ke CasaOS (Docker Compose)

File utama untuk deploy:

- `Dockerfile`
- `docker-compose.yml`
- `sql/ukpd_password_123.sql`
- `sql/export_pegawai_ukpd.sql`

Branch deploy GitHub: `sisdmk2-casaos`.

Contoh `docker-compose.yml` untuk CasaOS dengan MySQL satu stack:

```yml
services:
  db:
    image: mysql:8.0
    container_name: sisdmk2-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: Tianh@27
      MYSQL_DATABASE: si_data
    ports:
      - "3307:3306"
    volumes:
      - sisdmk2_mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h localhost -uroot -p$${MYSQL_ROOT_PASSWORD} || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 20

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: sisdmk2-app
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 3000
      MYSQL_HOST: db
      MYSQL_HOSTS: db,mariadb,mysql,host.docker.internal,172.17.0.1,172.31.254.56,127.0.0.1
      MYSQL_PORT: 3306
      MYSQL_USER: root
      MYSQL_PASSWORD: Tianh@27
      MYSQL_DATABASE: si_data
      JWT_SECRET: sisdmk2-jwt-secret-2026-ganti-nanti
    ports:
      - "8080:3000"

volumes:
  sisdmk2_mysql_data:
```

Jalankan di folder project pada server CasaOS:

```bash
git pull origin sisdmk2-casaos
docker compose down
docker compose build --no-cache app
docker compose up -d
```

Setelah container hidup, import tabel akun UKPD dan data pegawai:

```bash
docker exec -i sisdmk2-db mysql -uroot -p'Tianh@27' si_data < sql/ukpd_password_123.sql
docker exec -i sisdmk2-db mysql -uroot -p'Tianh@27' si_data < sql/export_pegawai_ukpd.sql
```

Setelah berjalan:

- App: `http://IP-CASAOS:8080`
- MySQL internal app: `db:3306`
- MySQL dari host/phpMyAdmin: `IP-CASAOS:3307`

Catatan troubleshooting:

- Kolom `ukpd.password` bisa memakai hash bcrypt atau SHA-256 untuk password login `admin123`, bukan plaintext.
- Login super admin awal: username `SUPER ADMIN`, password `admin123`.
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

Jika MySQL aktif, login membaca tabel `ukpd`. Seed `sql/ukpd_password_123.sql` mengisi semua UKPD dengan hash bcrypt untuk password `admin123`.

| Role | Username / Nama UKPD | Password |
| --- | --- | --- |
| Super Admin | `SUPER ADMIN` | `admin123` |
| Dinas Kesehatan | `Dinas Kesehatan` | `admin123` |
| Admin UKPD | nama UKPD, contoh `Puskesmas Tebet` | `admin123` |
| Admin UKPD | kode UKPD, contoh `4` | `admin123` |

Jika MySQL belum dikonfigurasi, aplikasi fallback ke akun demo lokal dengan password `password123`.

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
