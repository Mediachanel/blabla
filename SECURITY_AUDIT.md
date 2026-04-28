# Audit Keamanan

Tanggal audit: 2026-04-26

## Ruang Lingkup

Audit ini mencakup aplikasi Next.js App Router, API routes, autentikasi JWT cookie, RBAC, koneksi MySQL, upload PDF, Docker/Compose, file env, dan dependency npm.

## Celah Prioritas Tinggi yang Ditutup

1. Secret JWT default mudah ditebak.
   - Sebelumnya aplikasi bisa memakai fallback seperti `dev-secret-change-me` atau secret compose yang bisa ditebak.
   - Production sekarang wajib memakai `JWT_SECRET` kuat minimal 32 karakter dan menolak nilai contoh/default.

2. Cookie sesi kurang ketat.
   - Cookie sesi sekarang `HttpOnly`, `SameSite=Strict`, `Secure` di production, dan memakai helper terpusat.

3. Endpoint mutasi data belum punya proteksi CSRF/origin.
   - POST/PUT/DELETE login, logout, pegawai, usulan, upload dokumen, import DRH, dan QnA admin sekarang divalidasi same-origin.
   - `APP_ORIGIN` atau `ALLOWED_ORIGINS` bisa dipakai saat aplikasi berada di balik reverse proxy/domain publik.

4. Brute force login.
   - Login sekarang punya rate limit per IP dan username.
   - Error koneksi DB tidak lagi membocorkan detail host/user/password/database ke response publik.

5. Password default/seed.
   - Production menolak password umum seperti `admin123`, `password123`, `123456`, dan `12345678`.
   - Script generator seed UKPD sekarang wajib diberi `UKPD_DEFAULT_PASSWORD` kuat, lalu menghasilkan hash bcrypt baru.

6. Upload PDF DRH.
   - Import DRH sekarang membatasi ukuran file, memeriksa magic header `%PDF-`, dan membersihkan file sementara.

7. Upload dan akses dokumen usulan.
   - File PDF checklist punya batas ukuran dan magic-header check.
   - Response PDF sekarang memakai `Cache-Control: private, no-store` dan `X-Content-Type-Options: nosniff`.
   - Admin UKPD tidak lagi bisa menandai checklist verifikasi hanya dengan upload dokumen.

8. Eskalasi status usulan.
   - Admin UKPD tidak bisa mengubah `status`, `verif_checklist`, atau `tanggal_usulan` melalui request forged.
   - Status usulan dibatasi ke daftar nilai valid.

9. Secret masuk Docker image.
   - `.dockerignore` sekarang mengecualikan `.env*`, log, storage, dan tmp.
   - Docker runtime berjalan sebagai user `node`, bukan root.

10. Default credential compose.
    - `docker-compose.yml` dan `docker-compose.casaos.yml` tidak lagi memberi default password/JWT production.
    - MySQL compose dibind ke `127.0.0.1` agar tidak terbuka ke jaringan luar secara default.

11. Header keamanan.
    - Ditambahkan `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS, dan CSP dasar.

12. Dependency rentan.
    - `npm audit` awal menemukan advisori PostCSS.
    - Next.js disegarkan ke 15.5.15 dan PostCSS dioverride ke 8.5.10.
    - `npm audit` final: 0 vulnerability.

## Sisa Risiko Operasional

1. Rotasi credential wajib dilakukan di server sebenarnya.
   - Ganti semua password akun UKPD/Admin yang pernah memakai seed lama.
   - Ganti `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`, dan `JWT_SECRET` bila pernah tersimpan di file lokal, chat, atau repository.

2. File SQL lama yang berisi hash seed masih ada untuk kebutuhan historis/dev.
   - Jangan import file seed lama ke production.
   - Gunakan `UKPD_DEFAULT_PASSWORD="password-kuat-minimal-12" node scripts/generate-ukpd-password-sql.mjs`.

3. Rate limit login masih in-memory.
   - Untuk multi-container atau serverless, pindahkan rate limit ke Redis/database agar konsisten di semua instance.

4. Belum ada audit log permanen.
   - Aksi login gagal, upload dokumen, import DRH, perubahan pegawai, dan perubahan status usulan sebaiknya dicatat ke tabel audit.

5. Password SHA-256 legacy masih diterima.
   - Setelah semua akun bisa login, migrasikan semua password ke bcrypt dan hapus dukungan SHA-256 legacy.

## Verifikasi

- `npm.cmd run build`: berhasil.
- `npm.cmd audit --json`: 0 vulnerability.
