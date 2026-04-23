-- Membuat tabel alamat dan riwayat pegawai untuk database produksi CasaOS.
-- Aman dijalankan berulang: tidak DROP tabel, tidak menghapus data pegawai.
-- Data alamat lengkap diimpor lewat sql/import_alamat_generated.sql.
-- Riwayat awal dibuat dari data terkini pada tabel pegawai.

CREATE DATABASE IF NOT EXISTS `si_data` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `si_data`;

CREATE TABLE IF NOT EXISTS `alamat` (
  `id` INT NOT NULL,
  `id_pegawai` INT NOT NULL,
  `tipe` VARCHAR(30) NOT NULL,
  `jalan` TEXT NULL,
  `kelurahan` VARCHAR(150) NULL,
  `kecamatan` VARCHAR(150) NULL,
  `kota_kabupaten` VARCHAR(150) NULL,
  `provinsi` VARCHAR(150) NULL,
  `kode_provinsi` VARCHAR(20) NULL,
  `kode_kota_kab` VARCHAR(20) NULL,
  `kode_kecamatan` VARCHAR(20) NULL,
  `kode_kelurahan` VARCHAR(20) NULL,
  `created_at` DATE NULL,
  PRIMARY KEY (`id`),
  KEY `idx_alamat_pegawai` (`id_pegawai`),
  KEY `idx_alamat_tipe` (`tipe`),
  KEY `idx_alamat_wilayah` (`provinsi`, `kota_kabupaten`, `kecamatan`, `kelurahan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `riwayat_jabatan` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_pegawai` INT NOT NULL,
  `nip` VARCHAR(64) NULL,
  `nama_pegawai` VARCHAR(255) NOT NULL,
  `gelar_depan` VARCHAR(120) NULL,
  `gelar_belakang` VARCHAR(255) NULL,
  `nama_jabatan_orb` VARCHAR(255) NULL,
  `nama_jabatan_menpan` VARCHAR(255) NULL,
  `struktur_atasan_langsung` VARCHAR(255) NULL,
  `nama_ukpd` VARCHAR(255) NULL,
  `wilayah` VARCHAR(100) NULL,
  `jenis_pegawai` VARCHAR(80) NULL,
  `status_rumpun` VARCHAR(255) NULL,
  `tmt_jabatan` VARCHAR(30) NULL,
  `nomor_sk` VARCHAR(120) NULL,
  `tanggal_sk` VARCHAR(30) NULL,
  `keterangan` TEXT NULL,
  `sumber` VARCHAR(80) NULL,
  `source_key` VARCHAR(191) NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_riwayat_jabatan_source` (`source_key`),
  KEY `idx_riwayat_jabatan_pegawai` (`id_pegawai`),
  KEY `idx_riwayat_jabatan_ukpd` (`nama_ukpd`),
  KEY `idx_riwayat_jabatan_wilayah` (`wilayah`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `riwayat_pangkat` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_pegawai` INT NOT NULL,
  `nip` VARCHAR(64) NULL,
  `nama_pegawai` VARCHAR(255) NOT NULL,
  `pangkat_golongan` VARCHAR(120) NULL,
  `tmt_pangkat` VARCHAR(30) NULL,
  `nomor_sk` VARCHAR(120) NULL,
  `tanggal_sk` VARCHAR(30) NULL,
  `keterangan` TEXT NULL,
  `sumber` VARCHAR(80) NULL,
  `source_key` VARCHAR(191) NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_riwayat_pangkat_source` (`source_key`),
  KEY `idx_riwayat_pangkat_pegawai` (`id_pegawai`),
  KEY `idx_riwayat_pangkat_golongan` (`pangkat_golongan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `riwayat_pendidikan` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_pegawai` INT NOT NULL,
  `nip` VARCHAR(64) NULL,
  `nama_pegawai` VARCHAR(255) NOT NULL,
  `jenjang_pendidikan` VARCHAR(80) NULL,
  `program_studi` VARCHAR(255) NULL,
  `nama_universitas` VARCHAR(255) NULL,
  `tahun_lulus` VARCHAR(10) NULL,
  `nomor_ijazah` VARCHAR(120) NULL,
  `tanggal_ijazah` VARCHAR(30) NULL,
  `keterangan` TEXT NULL,
  `sumber` VARCHAR(80) NULL,
  `source_key` VARCHAR(191) NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_riwayat_pendidikan_source` (`source_key`),
  KEY `idx_riwayat_pendidikan_pegawai` (`id_pegawai`),
  KEY `idx_riwayat_pendidikan_jenjang` (`jenjang_pendidikan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `riwayat_jabatan`
  (`id_pegawai`, `nip`, `nama_pegawai`, `gelar_depan`, `gelar_belakang`,
   `nama_jabatan_orb`, `nama_jabatan_menpan`, `struktur_atasan_langsung`,
   `nama_ukpd`, `wilayah`, `jenis_pegawai`, `status_rumpun`, `tmt_jabatan`,
   `keterangan`, `sumber`, `source_key`)
SELECT
  `id_pegawai`,
  `nip`,
  `nama`,
  `gelar_depan`,
  `gelar_belakang`,
  `nama_jabatan_orb`,
  `nama_jabatan_menpan`,
  `struktur_atasan_langsung`,
  `nama_ukpd`,
  `wilayah`,
  `jenis_pegawai`,
  `status_rumpun`,
  `tmt_kerja_ukpd`,
  'Seed dari data pegawai aktif saat tabel riwayat dibuat',
  'pegawai_existing',
  MD5(CONCAT_WS('|', `id_pegawai`, 'jabatan', COALESCE(`nama_jabatan_orb`, ''), COALESCE(`nama_jabatan_menpan`, ''), COALESCE(`nama_ukpd`, ''), COALESCE(`tmt_kerja_ukpd`, '')))
FROM `pegawai`
WHERE COALESCE(`nama_jabatan_orb`, `nama_jabatan_menpan`, `nama_ukpd`, `tmt_kerja_ukpd`) IS NOT NULL
ON DUPLICATE KEY UPDATE
  `nip` = VALUES(`nip`),
  `nama_pegawai` = VALUES(`nama_pegawai`),
  `gelar_depan` = VALUES(`gelar_depan`),
  `gelar_belakang` = VALUES(`gelar_belakang`),
  `nama_jabatan_orb` = VALUES(`nama_jabatan_orb`),
  `nama_jabatan_menpan` = VALUES(`nama_jabatan_menpan`),
  `struktur_atasan_langsung` = VALUES(`struktur_atasan_langsung`),
  `nama_ukpd` = VALUES(`nama_ukpd`),
  `wilayah` = VALUES(`wilayah`),
  `jenis_pegawai` = VALUES(`jenis_pegawai`),
  `status_rumpun` = VALUES(`status_rumpun`),
  `tmt_jabatan` = VALUES(`tmt_jabatan`);

INSERT INTO `riwayat_pangkat`
  (`id_pegawai`, `nip`, `nama_pegawai`, `pangkat_golongan`, `tmt_pangkat`, `keterangan`, `sumber`, `source_key`)
SELECT
  `id_pegawai`,
  `nip`,
  `nama`,
  `pangkat_golongan`,
  `tmt_pangkat_terakhir`,
  'Seed dari data pegawai aktif saat tabel riwayat dibuat',
  'pegawai_existing',
  MD5(CONCAT_WS('|', `id_pegawai`, 'pangkat', COALESCE(`pangkat_golongan`, ''), COALESCE(`tmt_pangkat_terakhir`, '')))
FROM `pegawai`
WHERE COALESCE(`pangkat_golongan`, `tmt_pangkat_terakhir`) IS NOT NULL
ON DUPLICATE KEY UPDATE
  `nip` = VALUES(`nip`),
  `nama_pegawai` = VALUES(`nama_pegawai`),
  `pangkat_golongan` = VALUES(`pangkat_golongan`),
  `tmt_pangkat` = VALUES(`tmt_pangkat`);

INSERT INTO `riwayat_pendidikan`
  (`id_pegawai`, `nip`, `nama_pegawai`, `jenjang_pendidikan`, `program_studi`, `nama_universitas`, `keterangan`, `sumber`, `source_key`)
SELECT
  `id_pegawai`,
  `nip`,
  `nama`,
  `jenjang_pendidikan`,
  `program_studi`,
  `nama_universitas`,
  'Seed dari data pegawai aktif saat tabel riwayat dibuat',
  'pegawai_existing',
  MD5(CONCAT_WS('|', `id_pegawai`, 'pendidikan', COALESCE(`jenjang_pendidikan`, ''), COALESCE(`program_studi`, ''), COALESCE(`nama_universitas`, '')))
FROM `pegawai`
WHERE COALESCE(`jenjang_pendidikan`, `program_studi`, `nama_universitas`) IS NOT NULL
ON DUPLICATE KEY UPDATE
  `nip` = VALUES(`nip`),
  `nama_pegawai` = VALUES(`nama_pegawai`),
  `jenjang_pendidikan` = VALUES(`jenjang_pendidikan`),
  `program_studi` = VALUES(`program_studi`),
  `nama_universitas` = VALUES(`nama_universitas`);

SELECT 'alamat' AS `tabel`, COUNT(*) AS `jumlah` FROM `alamat`
UNION ALL
SELECT 'riwayat_jabatan', COUNT(*) FROM `riwayat_jabatan`
UNION ALL
SELECT 'riwayat_pangkat', COUNT(*) FROM `riwayat_pangkat`
UNION ALL
SELECT 'riwayat_pendidikan', COUNT(*) FROM `riwayat_pendidikan`;
