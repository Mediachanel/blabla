-- Index tambahan untuk mempercepat halaman Data Pegawai.
-- Jalankan hanya jika index belum ada.

ALTER TABLE `pegawai`
  ADD INDEX `idx_pegawai_nama_ukpd` (`nama_ukpd`),
  ADD INDEX `idx_pegawai_jenis_pegawai` (`jenis_pegawai`),
  ADD INDEX `idx_pegawai_wilayah` (`wilayah`);

ALTER TABLE `ukpd`
  ADD INDEX `idx_ukpd_nama_ukpd` (`nama_ukpd`),
  ADD INDEX `idx_ukpd_wilayah` (`wilayah`);
