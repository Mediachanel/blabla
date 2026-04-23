-- Membersihkan nilai NIP hasil impor yang diawali karakter backtick (`) atau spasi.
-- Jalankan di database lokal/produksi yang memakai tabel pegawai.

UPDATE `pegawai`
SET `nip` = TRIM(LEADING '`' FROM TRIM(`nip`))
WHERE `nip` IS NOT NULL AND `nip` <> '';

