-- Mengganti semua password login UKPD menjadi admin123 dalam bentuk SHA-256.
-- Setelah dijalankan, login UKPD memakai password: admin123
-- Aplikasi sudah mendukung verifikasi password SHA-256 dan bcrypt.

UPDATE `ukpd`
SET `password` = SHA2('admin123', 256);

