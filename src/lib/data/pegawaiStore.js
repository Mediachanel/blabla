import { ROLES } from "@/lib/constants/roles";
import { getConnectedPool } from "@/lib/db/mysql";

const PEGAWAI_COLUMNS = [
  "id_pegawai",
  "nama",
  "jenis_kelamin",
  "tempat_lahir",
  "tanggal_lahir",
  "nik",
  "agama",
  "nama_ukpd",
  "jenis_ukpd",
  "wilayah",
  "jenis_pegawai",
  "status_rumpun",
  "jenis_kontrak",
  "nrk",
  "nip",
  "nama_jabatan_orb",
  "nama_jabatan_menpan",
  "struktur_atasan_langsung",
  "pangkat_golongan",
  "tmt_pangkat_terakhir",
  "jenjang_pendidikan",
  "program_studi",
  "nama_universitas",
  "no_hp_pegawai",
  "email",
  "no_bpjs",
  "kondisi",
  "status_perkawinan",
  "gelar_depan",
  "gelar_belakang",
  "tmt_kerja_ukpd",
  "created_at",
  "id_ukpd",
  "ukpd_id",
  "jenjang_pendidikan_raw",
  "status_rumpun_raw",
  "nama_jabatan_menpan_raw",
  "jenis_kelamin_raw"
];

const PEGAWAI_MUTABLE_COLUMNS = PEGAWAI_COLUMNS.filter((column) => column !== "id_pegawai");

function toDateString(value) {
  if (!value || typeof value !== "object" || !("toISOString" in value)) return value;
  return value.toISOString().slice(0, 10);
}

function normalizeRow(row) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, toDateString(value)]));
}

function normalizeUkpd(row) {
  return {
    ...normalizeRow(row),
    role: row.role || ROLES.ADMIN_UKPD
  };
}

async function queryRows(sql, params = []) {
  const pool = await getConnectedPool();
  const [rows] = await pool.query(sql, params);
  return rows.map(normalizeRow);
}

export async function getUkpdData() {
  const rows = await queryRows("SELECT * FROM `ukpd` ORDER BY `nama_ukpd` ASC");
  return rows.map(normalizeUkpd);
}

export async function getPegawaiData() {
  return queryRows("SELECT * FROM `pegawai` ORDER BY `id_pegawai` DESC");
}

export async function createPegawaiData(data) {
  const pool = await getConnectedPool();
  const [[maxRow]] = await pool.query("SELECT COALESCE(MAX(`id_pegawai`), 0) + 1 AS next_id FROM `pegawai`");
  const item = {
    id_pegawai: Number(maxRow.next_id),
    created_at: new Date().toISOString().slice(0, 10),
    ...data
  };
  const columns = PEGAWAI_COLUMNS.filter((column) => Object.prototype.hasOwnProperty.call(item, column));
  const placeholders = columns.map(() => "?").join(", ");
  const values = columns.map((column) => item[column] ?? null);
  await pool.query(
    `INSERT INTO \`pegawai\` (${columns.map((column) => `\`${column}\``).join(", ")}) VALUES (${placeholders})`,
    values
  );
  return item;
}

export async function updatePegawaiData(id, data) {
  const pool = await getConnectedPool();
  const columns = PEGAWAI_MUTABLE_COLUMNS.filter((column) => Object.prototype.hasOwnProperty.call(data, column));
  if (columns.length) {
    await pool.query(
      `UPDATE \`pegawai\` SET ${columns.map((column) => `\`${column}\` = ?`).join(", ")} WHERE \`id_pegawai\` = ?`,
      [...columns.map((column) => data[column] ?? null), Number(id)]
    );
    }
  const [rows] = await pool.query("SELECT * FROM `pegawai` WHERE `id_pegawai` = ? LIMIT 1", [Number(id)]);
  return rows[0] ? normalizeRow(rows[0]) : null;
}

export async function deletePegawaiData(id) {
  const pool = await getConnectedPool();
  await pool.query("DELETE FROM `pegawai` WHERE `id_pegawai` = ?", [Number(id)]);
  return { id_pegawai: Number(id) };
}
