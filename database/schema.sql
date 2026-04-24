CREATE TABLE ukpd (
  id_ukpd INT AUTO_INCREMENT PRIMARY KEY,
  nama_ukpd VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  jenis_ukpd VARCHAR(100),
  role ENUM('SUPER_ADMIN', 'ADMIN_WILAYAH', 'ADMIN_UKPD') NOT NULL,
  wilayah VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pegawai (
  id_pegawai INT AUTO_INCREMENT PRIMARY KEY,
  id_ukpd INT NULL,
  nama VARCHAR(255) NOT NULL,
  jenis_kelamin VARCHAR(30),
  tempat_lahir VARCHAR(100),
  tanggal_lahir DATE,
  nik VARCHAR(32),
  agama VARCHAR(50),
  nama_ukpd VARCHAR(255),
  jenis_pegawai VARCHAR(100),
  status_rumpun VARCHAR(100),
  jenis_kontrak VARCHAR(100),
  nrk VARCHAR(50),
  nip VARCHAR(50),
  nama_jabatan_orb VARCHAR(255),
  nama_jabatan_menpan VARCHAR(255),
  struktur_atasan_langsung VARCHAR(255),
  pangkat_golongan VARCHAR(100),
  tmt_pangkat_terakhir DATE,
  jenjang_pendidikan VARCHAR(100),
  program_studi VARCHAR(255),
  nama_universitas VARCHAR(255),
  no_hp_pegawai VARCHAR(50),
  email VARCHAR(255),
  no_bpjs VARCHAR(100),
  kondisi VARCHAR(100),
  status_perkawinan VARCHAR(100),
  gelar_depan VARCHAR(50),
  gelar_belakang VARCHAR(50),
  tmt_kerja_ukpd DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pegawai_id_ukpd (id_ukpd),
  INDEX idx_pegawai_nama_ukpd (nama_ukpd),
  INDEX idx_pegawai_nip (nip),
  CONSTRAINT fk_pegawai_ukpd_id FOREIGN KEY (id_ukpd) REFERENCES ukpd(id_ukpd),
  CONSTRAINT fk_pegawai_ukpd_nama FOREIGN KEY (nama_ukpd) REFERENCES ukpd(nama_ukpd)
);

CREATE TABLE alamat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_pegawai INT NOT NULL,
  tipe ENUM('domisili', 'ktp') NOT NULL,
  jalan TEXT,
  kelurahan VARCHAR(100),
  kecamatan VARCHAR(100),
  kota_kabupaten VARCHAR(100),
  provinsi VARCHAR(100),
  kode_provinsi VARCHAR(20),
  kode_kota_kab VARCHAR(20),
  kode_kecamatan VARCHAR(20),
  kode_kelurahan VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_pegawai) REFERENCES pegawai(id_pegawai) ON DELETE CASCADE
);

CREATE TABLE pasangan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_pegawai INT NOT NULL,
  status_punya VARCHAR(30),
  nama VARCHAR(255),
  no_tlp VARCHAR(50),
  email VARCHAR(255),
  pekerjaan VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_pegawai) REFERENCES pegawai(id_pegawai) ON DELETE CASCADE
);

CREATE TABLE anak (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_pegawai INT NOT NULL,
  urutan TINYINT NOT NULL,
  nama VARCHAR(255),
  jenis_kelamin VARCHAR(30),
  tempat_lahir VARCHAR(100),
  tanggal_lahir DATE,
  pekerjaan VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_pegawai) REFERENCES pegawai(id_pegawai) ON DELETE CASCADE
);

CREATE TABLE keluarga (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_pegawai INT NOT NULL,
  hubungan ENUM('pasangan', 'anak') NOT NULL,
  status_punya VARCHAR(30),
  urutan TINYINT,
  nama VARCHAR(255),
  jenis_kelamin VARCHAR(30),
  tempat_lahir VARCHAR(100),
  tanggal_lahir DATE,
  no_tlp VARCHAR(50),
  email VARCHAR(255),
  pekerjaan VARCHAR(255),
  sumber_tabel VARCHAR(30),
  sumber_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_keluarga_sumber (sumber_tabel, sumber_id),
  INDEX idx_keluarga_pegawai (id_pegawai),
  INDEX idx_keluarga_hubungan (hubungan),
  FOREIGN KEY (id_pegawai) REFERENCES pegawai(id_pegawai) ON DELETE CASCADE
);

-- id_ukpd sudah disiapkan sebagai FK utama.
-- Kolom nama_ukpd tetap disimpan sebagai denormalized label untuk kebutuhan laporan.
