-- Auto generated on 2026-04-22T10:12:38.317Z
-- UKPD: UPT Jaminan Kesehatan Jakarta (id_ukpd=26003)
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
CREATE DATABASE IF NOT EXISTS `sisdmk2` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `sisdmk2`;

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

CREATE TABLE IF NOT EXISTS `pegawai` (
  `id_pegawai` INT NOT NULL,
  `nama` VARCHAR(255) NOT NULL,
  `jenis_kelamin` VARCHAR(30) NULL,
  `tempat_lahir` VARCHAR(150) NULL,
  `tanggal_lahir` VARCHAR(30) NULL,
  `nik` VARCHAR(64) NULL,
  `agama` VARCHAR(50) NULL,
  `nama_ukpd` VARCHAR(255) NULL,
  `jenis_ukpd` VARCHAR(100) NULL,
  `wilayah` VARCHAR(100) NULL,
  `jenis_pegawai` VARCHAR(80) NULL,
  `status_rumpun` VARCHAR(255) NULL,
  `jenis_kontrak` VARCHAR(80) NULL,
  `nrk` VARCHAR(64) NULL,
  `nip` VARCHAR(64) NULL,
  `nama_jabatan_orb` VARCHAR(255) NULL,
  `nama_jabatan_menpan` VARCHAR(255) NULL,
  `struktur_atasan_langsung` VARCHAR(255) NULL,
  `pangkat_golongan` VARCHAR(120) NULL,
  `tmt_pangkat_terakhir` VARCHAR(30) NULL,
  `jenjang_pendidikan` VARCHAR(80) NULL,
  `program_studi` VARCHAR(255) NULL,
  `nama_universitas` VARCHAR(255) NULL,
  `no_hp_pegawai` VARCHAR(64) NULL,
  `email` VARCHAR(255) NULL,
  `no_bpjs` VARCHAR(100) NULL,
  `kondisi` VARCHAR(50) NULL,
  `status_perkawinan` VARCHAR(50) NULL,
  `gelar_depan` VARCHAR(120) NULL,
  `gelar_belakang` VARCHAR(255) NULL,
  `tmt_kerja_ukpd` VARCHAR(30) NULL,
  `created_at` DATE NULL,
  `id_ukpd` INT NULL,
  `ukpd_id` INT NULL,
  `jenjang_pendidikan_raw` VARCHAR(80) NULL,
  `status_rumpun_raw` VARCHAR(255) NULL,
  `nama_jabatan_menpan_raw` VARCHAR(255) NULL,
  `jenis_kelamin_raw` VARCHAR(80) NULL,
  PRIMARY KEY (`id_pegawai`),
  KEY `idx_pegawai_nip` (`nip`),
  KEY `idx_pegawai_ukpd` (`id_ukpd`),
  CONSTRAINT `fk_pegawai_ukpd` FOREIGN KEY (`id_ukpd`) REFERENCES `ukpd` (`id_ukpd`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `pegawai`
  MODIFY `tanggal_lahir` VARCHAR(30) NULL,
  MODIFY `tmt_kerja_ukpd` VARCHAR(30) NULL;

INSERT INTO `ukpd` (`id_ukpd`, `ukpd_id`, `nama_ukpd`, `password`, `jenis_ukpd`, `role`, `wilayah`, `created_at`) VALUES
(26003, 26003, 'UPT Jaminan Kesehatan Jakarta', NULL, 'UPT', 'ADMIN_UKPD', 'Jakarta Pusat', '2026-04-22')
ON DUPLICATE KEY UPDATE `ukpd_id` = VALUES(`ukpd_id`), `nama_ukpd` = VALUES(`nama_ukpd`), `password` = VALUES(`password`), `jenis_ukpd` = VALUES(`jenis_ukpd`), `role` = VALUES(`role`), `wilayah` = VALUES(`wilayah`), `created_at` = VALUES(`created_at`);

INSERT INTO `pegawai` (`id_pegawai`, `nama`, `jenis_kelamin`, `tempat_lahir`, `tanggal_lahir`, `nik`, `agama`, `nama_ukpd`, `jenis_ukpd`, `wilayah`, `jenis_pegawai`, `status_rumpun`, `jenis_kontrak`, `nrk`, `nip`, `nama_jabatan_orb`, `nama_jabatan_menpan`, `struktur_atasan_langsung`, `pangkat_golongan`, `tmt_pangkat_terakhir`, `jenjang_pendidikan`, `program_studi`, `nama_universitas`, `no_hp_pegawai`, `email`, `no_bpjs`, `kondisi`, `status_perkawinan`, `gelar_depan`, `gelar_belakang`, `tmt_kerja_ukpd`, `created_at`, `id_ukpd`, `ukpd_id`, `jenjang_pendidikan_raw`, `status_rumpun_raw`, `nama_jabatan_menpan_raw`, `jenis_kelamin_raw`) VALUES
(30337, 'Ratna Sari', 'Perempuan', 'Jakarta', '1978-04-22', '3174056204780000', 'Islam', 'UPT Jaminan Kesehatan Jakarta', 'UPT', 'Jakarta Pusat', 'PNS', 'Jabatan Administrator', NULL, '165502', '197804222006042025', 'Kepala Unit Pengelola Jaminan Kesehatan Jakarta', 'Pengolah Data dan Informasi', 'Kepala Dinas Kesehatan', 'Pembina (IV/a)', '2023-04-01', 'S2', 'Manajemen Kesehatan Masyarakat', 'Universitas Indonesia', '081213410652', 'ratna.sugito78@gmail.com', NULL, 'AKTIF', NULL, NULL, NULL, '2022-05-30', '2026-04-22', 26003, 26003, 'S2', 'Jabatan Administrator', 'Kepala Unit Pengelola Jaminan Kesehatan Jakarta', 'Perempuan'),
(30338, 'Endah Saraswati', 'Perempuan', 'Jakarta', '1982-12-25', '3173086512820007', 'Islam', 'UPT Jaminan Kesehatan Jakarta', 'UPT', 'Jakarta Pusat', 'PNS', 'Jabatan Fungsional Keahlian Kesehatan', NULL, '188660', '198212252014082003', 'Administrasi Kesehatan Pertama', 'Administrator Kesehatan Ahli Pertama', 'Kepala Sub Bagian Tata Usaha', 'Penata Muda Tk.I (III/b)', '2023-04-01', 'S1', 'Keperawatan', 'Universitas Esa Unggul', '085711644453', 'bundaputrie@gmail.com', NULL, 'AKTIF', NULL, NULL, 'S.Kep, Ners', '2024-01-02', '2026-04-22', 26003, 26003, 'S1', 'Jabatan Fungsional Keahlian Kesehatan', 'Administrator Kesehatan Ahli Pertama', 'Perempuan'),
(30339, 'Apt. Ali Muhammad Shodiq', 'Laki-laki', 'Bogor', '1990-09-27', '3276052709900006', 'Islam', 'UPT Jaminan Kesehatan Jakarta', 'UPT', 'Jakarta Pusat', 'CPNS', 'Jabatan Fungsional Keahlian Kesehatan', NULL, '221214', '199009272025061003', 'Administrasi Kesehatan Pertama', 'Administrator Kesehatan Ahli Pertama', 'Kepala Sub Bagian Tata Usaha', 'Penata Muda (III/a)', '2025-06-01', 'S1', 'Farmasi Apt', 'UI', '08115233658', 'ali.muhammad.shodiq@gmail.com', NULL, 'AKTIF', NULL, NULL, 'S. Farm', '2025-06-01', '2026-04-22', 26003, 26003, 'S1', 'Jabatan Fungsional Keahlian Kesehatan', 'Administrator Kesehatan Ahli Pertama', 'Laki-laki'),
(30340, 'Seni Ryegina', 'Perempuan', 'Bandung', '1981-10-26', '3171056610810003', 'Islam', 'UPT Jaminan Kesehatan Jakarta', 'UPT', 'Jakarta Pusat', 'PNS', 'Jabatan Pengawas', NULL, '178824', '198110262010012017', 'Kepala Sub Bagian Tata Usaha', 'Kepala Sub Bagian Tata Usaha', 'Kepala Unit Pengelola Jaminan Kesehatan Jakarta', 'Pembina (IV/a)', '2025-12-01', 'S1', 'Kedokteran Umum', NULL, '081932193256', 'ryegina@gmail.com', NULL, 'AKTIF', NULL, NULL, NULL, '2021-09-09', '2026-04-22', 26003, 26003, 'S1', 'Jabatan Pengawas', 'Kepala Sub Bagian Tata Usaha', 'Perempuan'),
(30341, 'Nabila Aisyah Amin', 'Perempuan', 'Semarang', '1993-09-13', '3374075309930002', 'Islam', 'UPT Jaminan Kesehatan Jakarta', 'UPT', 'Jakarta Pusat', 'CPNS', 'Jabatan Fungsional Keterampilan Non Kesehatan', NULL, '221216', '199309132025062004', 'Arsiparis Terampil', 'Arsiparis Terampil', 'Kepala Sub Bagian Tata Usaha', 'Pengatur (II/c)', '2025-06-01', 'D3', 'Rekam Medis', 'STIKES HAKLI', '08999418742', 'gembila93@gmail.com', NULL, 'AKTIF', NULL, NULL, 'Amd, RMIK', '2025-06-01', '2026-04-22', 26003, 26003, 'D3', 'Jabatan Fungsional Keterampilan Non Kesehatan', 'Arsiparis Terampil', 'Perempuan'),
(30342, 'Mimin Rini Purwatiningsih', 'Perempuan', 'Purworejo', '1973-10-23', '3171036310730010', 'Islam', 'UPT Jaminan Kesehatan Jakarta', 'UPT', 'Jakarta Pusat', 'PNS', 'Jabatan Pelaksana Teknis Tingkat Ahli', NULL, '187590', '197310232014082001', 'Bendahara Pembantu', 'Penelaah Teknis Kebijakan', 'Kepala Sub Bagian Tata Usaha', 'Penata Muda (III/a)', '2023-04-01', 'D3', 'Akuntansi', 'Universitas Teknologi Yogyakarta', '081290087973', 'rinimimin@gmail.com', NULL, 'AKTIF', NULL, NULL, NULL, '2021-02-01', '2026-04-22', 26003, 26003, 'D3', 'Jabatan Pelaksana Teknis Tingkat Ahli', 'AKPD Ahli Pertama', 'Perempuan'),
(30343, 'Desy Margaret Teacher', 'Perempuan', 'Jakarta', '1994-12-22', '3172036212940000', 'Kristen Protestan', 'UPT Jaminan Kesehatan Jakarta', 'UPT', 'Jakarta Pusat', 'PNS', 'Jabatan Pelaksana Teknis Tingkat Ahli', NULL, '198575', '199412222020122021', 'Pengurus Barang Pembantu', 'Penata Laksana Barang Terampil', 'Kepala Sub Bagian Tata Usaha', 'Pengatur (II/c)', '2022-11-01', 'D3', 'Akuntansi', 'Universitas Indonesia', '081218132566', 'dsy.margaret@gmail.com', NULL, 'AKTIF', NULL, NULL, NULL, '2021-03-01', '2026-04-22', 26003, 26003, 'D3', 'Jabatan Pelaksana Teknis Tingkat Ahli', 'Penata Laksana Barang Terampil', 'Perempuan'),
(30344, 'Indriati Ratna Puspitasari', 'Perempuan', 'Banjarnegara', '1976-04-10', '3174045004760000', 'Islam', 'UPT Jaminan Kesehatan Jakarta', 'UPT', 'Jakarta Pusat', 'PNS', 'Jabatan Pelaksana Teknis Tingkat Terampil', NULL, '187859', '197604102014122005', 'Pengolah Data', 'Pengolah Data dan Informasi', 'Kepala Sub Bagian Tata Usaha', 'Penata Muda (III/a)', '2023-04-01', 'D3', 'Akuntansi', 'Universitas Teknologi Yogyakarta', '081298259076', 'indriapuspita5@gmail.com', NULL, 'AKTIF', NULL, NULL, NULL, '2021-04-01', '2026-04-22', 26003, 26003, 'D3', 'Jabatan Pelaksana Teknis Tingkat Terampil', 'Pengolah Data dan Informasi', 'Perempuan'),
(30345, 'Lukman Hakim', 'Laki-laki', 'Jakarta', '1990-05-09', '3175070905900004', 'Islam', 'UPT Jaminan Kesehatan Jakarta', 'UPT', 'Jakarta Pusat', 'CPNS', 'Jabatan Pelaksana Teknis Tingkat Ahli', NULL, '221213', '199005092025061004', 'Penata Kelola Sistem dan Teknologi Informasi', 'Penata Kelola Sistem dan Teknologi Informasi', 'Kepala Sub Bagian Tata Usaha', 'Penata Muda (III/a)', '2025-06-01', 'S1', 'Sistem Informasi', 'UIN Syarif Hidayatullah Jakarta', '081385172043', 'jeniusperadaban@gmail.com', NULL, 'AKTIF', NULL, NULL, 'S. SI', '2025-06-01', '2026-04-22', 26003, 26003, 'S1', 'Jabatan Pelaksana Teknis Tingkat Ahli', 'Penata Kelola Sistem dan Teknologi Informasi', 'Laki-laki'),
(30346, 'Fauzia Filardi', 'Laki-laki', 'Bogor', '1992-10-11', '3271051110920013', 'Islam', 'UPT Jaminan Kesehatan Jakarta', 'UPT', 'Jakarta Pusat', 'CPNS', 'Jabatan Pelaksana Teknis Tingkat Ahli', NULL, '221215', '199210112025061007', 'Penata Kelola Sistem dan Teknologi Informasi', 'Penata Kelola Sistem dan Teknologi Informasi', 'Kepala Sub Bagian Tata Usaha', 'Penata Muda (III/a)', '2025-06-01', 'S1', 'Sistem Informasi', 'STIKOM Bina Niaga Bogor', '08989577287', 'filardifauzia@gmail.com', NULL, 'AKTIF', NULL, NULL, 'S. Kom', '2025-06-01', '2026-04-22', 26003, 26003, 'S1', 'Jabatan Pelaksana Teknis Tingkat Ahli', 'Penata Kelola Sistem dan Teknologi Informasi', 'Laki-laki'),
(30347, 'Sri Widiastuti', 'Perempuan', 'Jakarta', '1983-03-14', '3171075403830000', 'Islam', 'UPT Jaminan Kesehatan Jakarta', 'UPT', 'Jakarta Pusat', 'PNS', 'Jabatan Pelaksana Administrasi Tingkat Terampil', NULL, '188247', '198303142014122004', 'Pengadministrasi Umum', 'Pengadministrasi Perkantoran', 'Kepala Sub Bagian Tata Usaha', 'Pengatur (II/c)', '2023-04-01', 'SMA/SMK', 'IPA', NULL, '087887623646', 'widienita83@gmail.com', NULL, 'AKTIF', NULL, NULL, NULL, '2022-01-01', '2026-04-22', 26003, 26003, 'SMA', 'Jabatan Pelaksana Administrasi Tingkat Terampil', 'Pengadministrasi Perkantoran', 'Perempuan'),
(30348, 'Ari Putera Negara', 'Laki-laki', 'Karawang', '1976-05-15', '3201011505760011', 'Islam', 'UPT Jaminan Kesehatan Jakarta', 'UPT', 'Jakarta Pusat', 'PNS', 'Jabatan Pelaksana Teknis Tingkat Terampil', NULL, '188471', '197605152014081000', 'Pengolah Data (Verifikator Medis)', 'Pengolah Data dan Informasi', 'Kepala Sub Bagian Tata Usaha', 'Penata Muda (III/a)', '2023-04-01', 'S1', 'Kesehatan Masyarakat', 'Universitas Indonesia', '085718596506', 'ariputera19@gmail.com', NULL, 'AKTIF', NULL, NULL, 'SKM', '2024-10-01', '2026-04-22', 26003, 26003, 'S1', 'Jabatan Pelaksana Teknis Tingkat Terampil', 'Pengolah Data dan Informasi', 'Laki-laki'),
(30349, 'Ernawati Sitepu', 'Perempuan', 'Selesai', '1972-01-01', '3175084101720013', 'Kristen Protestan', 'UPT Jaminan Kesehatan Jakarta', 'UPT', 'Jakarta Pusat', 'PNS', 'Jabatan Pelaksana Teknis Tingkat Terampil', NULL, '182764', '197201011997032006', 'Pengolah Data (Verifikator Medis)', 'Pengolah Data dan Informasi', 'Kepala Sub Bagian Tata Usaha', 'Penata Tk.I (III/d)', '2014-10-01', 'S1', 'Kesehatan Lingkungan', 'Universitas Sumatera Utara', '081310153335', 'sitepu.erna72@gmail.com', NULL, 'AKTIF', NULL, NULL, NULL, '2020-02-03', '2026-04-22', 26003, 26003, 'S1', 'Jabatan Pelaksana Teknis Tingkat Terampil', 'Pengolah Data dan Informasi', 'Perempuan'),
(30350, 'Suhaeni Hamzah', 'Perempuan', 'Ambon', '1975-04-05', '8101014504750006', 'Islam', 'UPT Jaminan Kesehatan Jakarta', 'UPT', 'Jakarta Pusat', 'PNS', 'Jabatan Pelaksana Teknis Tingkat Terampil', NULL, '165105', '197504052000122003', 'Pengolah Data (Kepesertaan)', 'Pengolah Data dan Informasi', 'Kepala Sub Bagian Tata Usaha', 'Penata Muda Tk.I (III/b)', '2022-04-01', 'D3', 'Keperawatan', 'Akper Ambon', '081349767352', NULL, NULL, 'AKTIF', NULL, NULL, NULL, '2020-12-01', '2026-04-22', 26003, 26003, 'D3', 'Jabatan Pelaksana Teknis Tingkat Terampil', 'Pengolah Data (Kepesertaan)', 'Perempuan'),
(30351, 'Nilam Winda Amelia Wahyuni', 'Perempuan', 'Padang', '1987-03-27', '1371116703870008', 'Islam', 'UPT Jaminan Kesehatan Jakarta', 'UPT', 'Jakarta Pusat', 'PNS', 'Jabatan Pelaksana Satuan', NULL, '182766', '198703272008032001', 'Kepala Satuan Pelaksana Pemasaran Dan Pengelolaan Aduan', 'Jabatan Pelaksana Satuan', 'Kepala Unit Pengelola Jaminan Kesehatan Jakarta', 'Penata (III/c)', '2023-04-01', 'S1', 'Kesehatan Masyarakat', 'Universitas Respati Indonesia', '085216690808', 'wahyuni.nilam@ymail.com', NULL, 'AKTIF', NULL, NULL, NULL, '2020-02-03', '2026-04-22', 26003, 26003, 'S1', 'Jabatan Pelaksana Satuan', 'Kepala Satuan Pelaksana Pemasaran Dan Pengelolaan Aduan', 'Perempuan'),
(30352, 'Erwin Ramlan Nasution', 'Laki-laki', 'Tapanuli selatan', '1978-06-21', '3201022106780010', 'Islam', 'UPT Jaminan Kesehatan Jakarta', 'UPT', 'Jakarta Pusat', 'PNS', 'Jabatan Pelaksana Teknis Tingkat Terampil', NULL, '171203', '197806212008011016', 'Pengolah Data (Pemasaran)', 'Pengolah Data dan Informasi', 'Kepala Sub Bagian Tata Usaha', 'Penata Muda Tk 1/III B', '2020-10-01', 'D3', 'Keperawatan', 'Akper POLRI', '085312349091', 'erwinjamkesjak7@gmail.com', NULL, 'AKTIF', NULL, NULL, NULL, '2024-01-02', '2026-04-22', 26003, 26003, 'D III', 'Jabatan Pelaksana Teknis Tingkat Terampil', 'Pengolah Data (Pemasaran)', 'Laki-laki'),
(30353, 'Maulani Pratiwi', 'Perempuan', 'Palembang', '1985-11-25', '3.27603E+15', 'Islam', 'UPT Jaminan Kesehatan Jakarta', 'UPT', 'Jakarta Pusat', 'PNS', 'Jabatan Pelaksana Teknis Tingkat Terampil', NULL, '178428', '198511252010012041', 'Pengolah Data (Pemasaran)', 'Pengolah Data dan Informasi', 'Kepala Sub Bagian Tata Usaha', 'Penata (III/c)', '2025-10-01', 'D3', 'Kebidanan', 'Poltekkes Palembang', '81281116539', 'maulanipratiwi85@gmail.com', NULL, 'AKTIF', NULL, NULL, 'A.Md.Keb', '2025-10-01', '2026-04-22', 26003, 26003, 'D III', 'Jabatan Pelaksana Teknis Tingkat Terampil', 'Pengolah Data (Pemasaran)', 'Perempuan')
ON DUPLICATE KEY UPDATE `nama` = VALUES(`nama`), `jenis_kelamin` = VALUES(`jenis_kelamin`), `tempat_lahir` = VALUES(`tempat_lahir`), `tanggal_lahir` = VALUES(`tanggal_lahir`), `nik` = VALUES(`nik`), `agama` = VALUES(`agama`), `nama_ukpd` = VALUES(`nama_ukpd`), `jenis_ukpd` = VALUES(`jenis_ukpd`), `wilayah` = VALUES(`wilayah`), `jenis_pegawai` = VALUES(`jenis_pegawai`), `status_rumpun` = VALUES(`status_rumpun`), `jenis_kontrak` = VALUES(`jenis_kontrak`), `nrk` = VALUES(`nrk`), `nip` = VALUES(`nip`), `nama_jabatan_orb` = VALUES(`nama_jabatan_orb`), `nama_jabatan_menpan` = VALUES(`nama_jabatan_menpan`), `struktur_atasan_langsung` = VALUES(`struktur_atasan_langsung`), `pangkat_golongan` = VALUES(`pangkat_golongan`), `tmt_pangkat_terakhir` = VALUES(`tmt_pangkat_terakhir`), `jenjang_pendidikan` = VALUES(`jenjang_pendidikan`), `program_studi` = VALUES(`program_studi`), `nama_universitas` = VALUES(`nama_universitas`), `no_hp_pegawai` = VALUES(`no_hp_pegawai`), `email` = VALUES(`email`), `no_bpjs` = VALUES(`no_bpjs`), `kondisi` = VALUES(`kondisi`), `status_perkawinan` = VALUES(`status_perkawinan`), `gelar_depan` = VALUES(`gelar_depan`), `gelar_belakang` = VALUES(`gelar_belakang`), `tmt_kerja_ukpd` = VALUES(`tmt_kerja_ukpd`), `created_at` = VALUES(`created_at`), `ukpd_id` = VALUES(`ukpd_id`), `jenjang_pendidikan_raw` = VALUES(`jenjang_pendidikan_raw`), `status_rumpun_raw` = VALUES(`status_rumpun_raw`), `nama_jabatan_menpan_raw` = VALUES(`nama_jabatan_menpan_raw`), `jenis_kelamin_raw` = VALUES(`jenis_kelamin_raw`);

SET FOREIGN_KEY_CHECKS = 1;
