-- Mengganti semua password login UKPD menjadi admin123 dalam bentuk SHA-256.
-- Setelah dijalankan, login UKPD memakai password: admin123
-- Aplikasi sudah mendukung verifikasi password SHA-256 dan bcrypt.

CREATE DATABASE IF NOT EXISTS `si_data` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `si_data`;

UPDATE `ukpd`
SET `password` = SHA2('admin123', 256);

