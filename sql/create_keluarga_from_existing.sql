-- Membuat tabel keluarga dan mengisi data existing dari tabel pasangan + anak.
-- Aman dijalankan berulang.
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `si_data` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `si_data`;

CREATE TABLE IF NOT EXISTS `keluarga` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_pegawai` INT NOT NULL,
  `hubungan` ENUM('pasangan', 'anak') NOT NULL,
  `status_punya` VARCHAR(30) NULL,
  `urutan` TINYINT NULL,
  `nama` VARCHAR(255) NULL,
  `jenis_kelamin` VARCHAR(30) NULL,
  `tempat_lahir` VARCHAR(100) NULL,
  `tanggal_lahir` DATE NULL,
  `no_tlp` VARCHAR(50) NULL,
  `email` VARCHAR(255) NULL,
  `pekerjaan` VARCHAR(255) NULL,
  `sumber_tabel` VARCHAR(30) NOT NULL,
  `sumber_id` INT NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_keluarga_sumber` (`sumber_tabel`, `sumber_id`),
  KEY `idx_keluarga_pegawai` (`id_pegawai`),
  KEY `idx_keluarga_hubungan` (`hubungan`),
  CONSTRAINT `fk_keluarga_pegawai` FOREIGN KEY (`id_pegawai`) REFERENCES `pegawai` (`id_pegawai`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `keluarga`
  (`id_pegawai`, `hubungan`, `status_punya`, `urutan`, `nama`, `jenis_kelamin`, `tempat_lahir`, `tanggal_lahir`, `no_tlp`, `email`, `pekerjaan`, `sumber_tabel`, `sumber_id`, `created_at`)
SELECT
  `id_pegawai`,
  'pasangan',
  `status_punya`,
  NULL,
  NULLIF(TRIM(`nama`), ''),
  NULL,
  NULL,
  NULL,
  NULLIF(TRIM(`no_tlp`), ''),
  NULLIF(TRIM(`email`), ''),
  NULLIF(TRIM(`pekerjaan`), ''),
  'pasangan',
  `id`,
  COALESCE(`created_at`, CURRENT_TIMESTAMP)
FROM `pasangan`
ON DUPLICATE KEY UPDATE
  `id_pegawai` = VALUES(`id_pegawai`),
  `hubungan` = VALUES(`hubungan`),
  `status_punya` = VALUES(`status_punya`),
  `nama` = VALUES(`nama`),
  `no_tlp` = VALUES(`no_tlp`),
  `email` = VALUES(`email`),
  `pekerjaan` = VALUES(`pekerjaan`);

INSERT INTO `keluarga`
  (`id_pegawai`, `hubungan`, `status_punya`, `urutan`, `nama`, `jenis_kelamin`, `tempat_lahir`, `tanggal_lahir`, `no_tlp`, `email`, `pekerjaan`, `sumber_tabel`, `sumber_id`, `created_at`)
SELECT
  `id_pegawai`,
  'anak',
  NULL,
  `urutan`,
  NULLIF(TRIM(`nama`), ''),
  NULLIF(TRIM(`jenis_kelamin`), ''),
  NULLIF(TRIM(`tempat_lahir`), ''),
  `tanggal_lahir`,
  NULL,
  NULL,
  NULLIF(TRIM(`pekerjaan`), ''),
  'anak',
  `id`,
  COALESCE(`created_at`, CURRENT_TIMESTAMP)
FROM `anak`
ON DUPLICATE KEY UPDATE
  `id_pegawai` = VALUES(`id_pegawai`),
  `hubungan` = VALUES(`hubungan`),
  `urutan` = VALUES(`urutan`),
  `nama` = VALUES(`nama`),
  `jenis_kelamin` = VALUES(`jenis_kelamin`),
  `tempat_lahir` = VALUES(`tempat_lahir`),
  `tanggal_lahir` = VALUES(`tanggal_lahir`),
  `pekerjaan` = VALUES(`pekerjaan`);

SELECT 'pasangan' AS `sumber`, COUNT(*) AS `jumlah` FROM `pasangan`
UNION ALL
SELECT 'anak', COUNT(*) FROM `anak`
UNION ALL
SELECT 'keluarga', COUNT(*) FROM `keluarga`;
