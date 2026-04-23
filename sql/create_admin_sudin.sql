-- Membuat/memperbaiki akun khusus Admin Sudin per wilayah.
-- Role ADMIN_WILAYAH membuat user bisa melihat semua UKPD dalam wilayahnya saja.
-- Login memakai username admin_Sudin_* atau ukpd_id, password: admin123.
-- Script ini hanya menyentuh tabel akun `ukpd`, tidak mengubah data pegawai.

CREATE DATABASE IF NOT EXISTS `si_data` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `si_data`;

CREATE TABLE IF NOT EXISTS `ukpd` (
  `id_ukpd` INT NOT NULL,
  `ukpd_id` INT NULL,
  `nama_ukpd` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NULL,
  `jenis_ukpd` VARCHAR(100) NULL,
  `role` VARCHAR(50) NULL,
  `wilayah` VARCHAR(100) NULL,
  `created_at` DATE NULL,
  PRIMARY KEY (`id_ukpd`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `ukpd`
  (`id_ukpd`, `ukpd_id`, `nama_ukpd`, `password`, `jenis_ukpd`, `role`, `wilayah`, `created_at`)
VALUES
  (250001, 250001, 'admin_Sudin_KepSeribu', SHA2('admin123', 256), 'Sudinkes', 'ADMIN_WILAYAH', 'Kepulauan Seribu', CURDATE()),
  (250002, 250002, 'admin_Sudin_Jakbar', SHA2('admin123', 256), 'Sudinkes', 'ADMIN_WILAYAH', 'Jakarta Barat', CURDATE()),
  (250003, 250003, 'admin_Sudin_Jakpus', SHA2('admin123', 256), 'Sudinkes', 'ADMIN_WILAYAH', 'Jakarta Pusat', CURDATE()),
  (250004, 250004, 'admin_Sudin_Jaktim', SHA2('admin123', 256), 'Sudinkes', 'ADMIN_WILAYAH', 'Jakarta Timur', CURDATE()),
  (250005, 250005, 'admin_Sudin_Jakut', SHA2('admin123', 256), 'Sudinkes', 'ADMIN_WILAYAH', 'Jakarta Utara', CURDATE()),
  (250006, 250006, 'admin_Sudin_Jaksel', SHA2('admin123', 256), 'Sudinkes', 'ADMIN_WILAYAH', 'Jakarta Selatan', CURDATE())
ON DUPLICATE KEY UPDATE
  `ukpd_id` = VALUES(`ukpd_id`),
  `nama_ukpd` = VALUES(`nama_ukpd`),
  `password` = VALUES(`password`),
  `jenis_ukpd` = VALUES(`jenis_ukpd`),
  `role` = VALUES(`role`),
  `wilayah` = VALUES(`wilayah`);

SELECT `id_ukpd`, `ukpd_id`, `nama_ukpd`, `role`, `wilayah`
FROM `ukpd`
WHERE `id_ukpd` BETWEEN 250001 AND 250006
ORDER BY `id_ukpd`;
