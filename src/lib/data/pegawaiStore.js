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

const ADDRESS_FIELDS = [
  "jalan",
  "kelurahan",
  "kecamatan",
  "kota_kabupaten",
  "provinsi",
  "kode_provinsi",
  "kode_kota_kab",
  "kode_kecamatan",
  "kode_kelurahan"
];

const PASANGAN_FIELDS = ["status_punya", "nama", "no_tlp", "email", "pekerjaan"];

const ANAK_FIELDS = ["nama", "jenis_kelamin", "tempat_lahir", "tanggal_lahir", "pekerjaan"];

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

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeNullableText(value) {
  const text = normalizeText(value);
  return text || null;
}

function normalizeDateInput(value) {
  const text = normalizeText(value);
  return text || null;
}

function buildAlamatLengkap(row) {
  const jalan = normalizeText(row.jalan);
  const jalanLower = jalan.toLowerCase();
  const tail = [row.kelurahan, row.kecamatan, row.kota_kabupaten, row.provinsi]
    .map(normalizeText)
    .filter(Boolean)
    .filter((part, index, all) => all.findIndex((candidate) => candidate.toLowerCase() === part.toLowerCase()) === index)
    .filter((part) => !jalanLower || !jalanLower.includes(part.toLowerCase()));

  return [jalan, ...tail].filter(Boolean).join(", ");
}

async function queryRows(sql, params = []) {
  const pool = await getConnectedPool();
  const [rows] = await pool.query(sql, params);
  return rows.map(normalizeRow);
}

async function nextTableId(connection, table) {
  const [[row]] = await connection.query(`SELECT COALESCE(MAX(\`id\`), 0) + 1 AS next_id FROM \`${table}\``);
  return Number(row?.next_id || 1);
}

function emptyAlamat(tipe) {
  return {
    id: null,
    tipe,
    jalan: "",
    kelurahan: "",
    kecamatan: "",
    kota_kabupaten: "",
    provinsi: "",
    kode_provinsi: "",
    kode_kota_kab: "",
    kode_kecamatan: "",
    kode_kelurahan: ""
  };
}

function normalizeAlamatEntry(entry, tipe) {
  const base = emptyAlamat(tipe);
  if (!entry || typeof entry !== "object") return base;
  return {
    ...base,
    id: entry.id ? Number(entry.id) : null,
    tipe,
    jalan: normalizeText(entry.jalan),
    kelurahan: normalizeText(entry.kelurahan),
    kecamatan: normalizeText(entry.kecamatan),
    kota_kabupaten: normalizeText(entry.kota_kabupaten),
    provinsi: normalizeText(entry.provinsi),
    kode_provinsi: normalizeText(entry.kode_provinsi),
    kode_kota_kab: normalizeText(entry.kode_kota_kab),
    kode_kecamatan: normalizeText(entry.kode_kecamatan),
    kode_kelurahan: normalizeText(entry.kode_kelurahan)
  };
}

function hasAlamatContent(entry) {
  return ADDRESS_FIELDS.some((field) => normalizeText(entry?.[field]));
}

function defaultPasangan() {
  return {
    id: null,
    status_punya: "Tidak",
    nama: "",
    no_tlp: "",
    email: "",
    pekerjaan: ""
  };
}

function normalizePasanganEntry(entry) {
  const base = defaultPasangan();
  if (!entry || typeof entry !== "object") return base;
  return {
    ...base,
    id: entry.id ? Number(entry.id) : null,
    status_punya: normalizeText(entry.status_punya) || "Tidak",
    nama: normalizeText(entry.nama),
    no_tlp: normalizeText(entry.no_tlp),
    email: normalizeText(entry.email),
    pekerjaan: normalizeText(entry.pekerjaan)
  };
}

function hasPasanganContent(entry) {
  return PASANGAN_FIELDS.some((field) => normalizeText(entry?.[field])) && String(entry?.status_punya || "").toLowerCase() !== "tidak";
}

function normalizeAnakEntries(entries) {
  if (!Array.isArray(entries)) return [];
  return entries
    .filter((entry) => entry && typeof entry === "object")
    .map((entry, index) => ({
      id: entry.id ? Number(entry.id) : null,
      urutan: Number(entry.urutan) || index + 1,
      nama: normalizeText(entry.nama),
      jenis_kelamin: normalizeText(entry.jenis_kelamin),
      tempat_lahir: normalizeText(entry.tempat_lahir),
      tanggal_lahir: normalizeText(entry.tanggal_lahir),
      pekerjaan: normalizeText(entry.pekerjaan)
    }))
    .filter((entry) => ANAK_FIELDS.some((field) => normalizeText(entry[field])));
}

async function savePegawaiAlamat(connection, idPegawai, alamatInput) {
  const alamat = {
    domisili: normalizeAlamatEntry(alamatInput?.domisili, "domisili"),
    ktp: normalizeAlamatEntry(alamatInput?.ktp, "ktp")
  };

  for (const tipe of ["domisili", "ktp"]) {
    const item = alamat[tipe];
    const [existingRows] = await connection.query(
      "SELECT * FROM `alamat` WHERE `id_pegawai` = ? AND LOWER(`tipe`) = ? ORDER BY `id` ASC",
      [Number(idPegawai), tipe]
    );
    const existing = existingRows[0] || null;
    const extraRows = existingRows.slice(1);

    if (!hasAlamatContent(item)) {
      if (existing) {
        await connection.query("DELETE FROM `alamat` WHERE `id_pegawai` = ? AND LOWER(`tipe`) = ?", [Number(idPegawai), tipe]);
      }
      continue;
    }

    const values = ADDRESS_FIELDS.map((field) => normalizeNullableText(item[field]));

    if (existing) {
      await connection.query(
        `UPDATE \`alamat\`
         SET ${ADDRESS_FIELDS.map((field) => `\`${field}\` = ?`).join(", ")}
         WHERE \`id\` = ?`,
        [...values, Number(existing.id)]
      );
      if (extraRows.length) {
        await connection.query(
          `DELETE FROM \`alamat\` WHERE \`id\` IN (${extraRows.map(() => "?").join(", ")})`,
          extraRows.map((row) => Number(row.id))
        );
      }
      continue;
    }

    const nextId = await nextTableId(connection, "alamat");
    await connection.query(
      `INSERT INTO \`alamat\` (\`id\`, \`id_pegawai\`, \`tipe\`, ${ADDRESS_FIELDS.map((field) => `\`${field}\``).join(", ")}, \`created_at\`)
       VALUES (?, ?, ?, ${ADDRESS_FIELDS.map(() => "?").join(", ")}, ?)`,
      [nextId, Number(idPegawai), tipe, ...values, new Date().toISOString().slice(0, 10)]
    );
  }
}

async function savePegawaiPasangan(connection, idPegawai, pasanganInput) {
  const pasangan = normalizePasanganEntry(pasanganInput);
  const [rows] = await connection.query(
    "SELECT * FROM `pasangan` WHERE `id_pegawai` = ? ORDER BY `id` ASC",
    [Number(idPegawai)]
  );
  const existing = rows[0] || null;
  const extraRows = rows.slice(1);

  if (!hasPasanganContent(pasangan)) {
    if (rows.length) {
      await connection.query("DELETE FROM `pasangan` WHERE `id_pegawai` = ?", [Number(idPegawai)]);
    }
    return;
  }

  const values = PASANGAN_FIELDS.map((field) => normalizeNullableText(pasangan[field]));

  if (existing) {
    await connection.query(
      `UPDATE \`pasangan\`
       SET ${PASANGAN_FIELDS.map((field) => `\`${field}\` = ?`).join(", ")}
       WHERE \`id\` = ?`,
      [...values, Number(existing.id)]
    );
    if (extraRows.length) {
      await connection.query(
        `DELETE FROM \`pasangan\` WHERE \`id\` IN (${extraRows.map(() => "?").join(", ")})`,
        extraRows.map((row) => Number(row.id))
      );
    }
    return;
  }

  const nextId = await nextTableId(connection, "pasangan");
  await connection.query(
    `INSERT INTO \`pasangan\` (\`id\`, \`id_pegawai\`, ${PASANGAN_FIELDS.map((field) => `\`${field}\``).join(", ")}, \`created_at\`)
     VALUES (?, ?, ${PASANGAN_FIELDS.map(() => "?").join(", ")}, ?)`,
    [nextId, Number(idPegawai), ...values, new Date().toISOString().slice(0, 10)]
  );
}

async function savePegawaiAnak(connection, idPegawai, anakInput) {
  const anak = normalizeAnakEntries(anakInput);
  await connection.query("DELETE FROM `anak` WHERE `id_pegawai` = ?", [Number(idPegawai)]);
  if (!anak.length) return;

  let nextId = await nextTableId(connection, "anak");
  for (const [index, item] of anak.entries()) {
    await connection.query(
      `INSERT INTO \`anak\` (\`id\`, \`id_pegawai\`, \`urutan\`, ${ANAK_FIELDS.map((field) => `\`${field}\``).join(", ")}, \`created_at\`)
       VALUES (?, ?, ?, ${ANAK_FIELDS.map(() => "?").join(", ")}, ?)`,
      [
        nextId,
        Number(idPegawai),
        index + 1,
        ...ANAK_FIELDS.map((field) => field === "tanggal_lahir" ? normalizeDateInput(item[field]) : normalizeNullableText(item[field])),
        new Date().toISOString().slice(0, 10)
      ]
    );
    nextId += 1;
  }
}

async function savePegawaiRelations(connection, idPegawai, relations = {}) {
  await savePegawaiAlamat(connection, idPegawai, relations.alamat);
  await savePegawaiPasangan(connection, idPegawai, relations.pasangan);
  await savePegawaiAnak(connection, idPegawai, relations.anak);
}

export async function getUkpdData() {
  const rows = await queryRows("SELECT * FROM `ukpd` ORDER BY `nama_ukpd` ASC");
  return rows.map(normalizeUkpd);
}

export async function getPegawaiData() {
  return queryRows("SELECT * FROM `pegawai` ORDER BY `id_pegawai` DESC");
}

export async function getPegawaiAlamat(id) {
  const rows = await queryRows(
    `SELECT * FROM \`alamat\`
     WHERE \`id_pegawai\` = ?
     ORDER BY CASE
       WHEN LOWER(\`tipe\`) = 'ktp' THEN 0
       WHEN LOWER(\`tipe\`) = 'domisili' THEN 1
       ELSE 2
     END, \`id\` ASC`,
    [Number(id)]
  );

  return rows.map((row) => ({
    ...row,
    alamat_lengkap: buildAlamatLengkap(row)
  }));
}

export async function getPegawaiPasangan(id) {
  const rows = await queryRows(
    `SELECT * FROM \`pasangan\`
     WHERE \`id_pegawai\` = ?
     ORDER BY \`id\` ASC
     LIMIT 1`,
    [Number(id)]
  );

  return rows[0] ? normalizePasanganEntry(rows[0]) : defaultPasangan();
}

export async function getPegawaiAnak(id) {
  const rows = await queryRows(
    `SELECT * FROM \`anak\`
     WHERE \`id_pegawai\` = ?
     ORDER BY \`urutan\` ASC, \`id\` ASC`,
    [Number(id)]
  );

  return normalizeAnakEntries(rows);
}

export async function createPegawaiData(data) {
  const pool = await getConnectedPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [[maxRow]] = await connection.query("SELECT COALESCE(MAX(`id_pegawai`), 0) + 1 AS next_id FROM `pegawai`");
    const relations = {
      alamat: data.alamat,
      pasangan: data.pasangan,
      anak: data.anak
    };
    const item = {
      id_pegawai: Number(maxRow.next_id),
      created_at: new Date().toISOString().slice(0, 10),
      ...data
    };
    const columns = PEGAWAI_COLUMNS.filter((column) => Object.prototype.hasOwnProperty.call(item, column));
    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((column) => item[column] ?? null);
    await connection.query(
      `INSERT INTO \`pegawai\` (${columns.map((column) => `\`${column}\``).join(", ")}) VALUES (${placeholders})`,
      values
    );
    await savePegawaiRelations(connection, item.id_pegawai, relations);
    await connection.commit();
    return normalizeRow(item);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updatePegawaiData(id, data) {
  const pool = await getConnectedPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const columns = PEGAWAI_MUTABLE_COLUMNS.filter((column) => Object.prototype.hasOwnProperty.call(data, column));
    if (columns.length) {
      await connection.query(
        `UPDATE \`pegawai\` SET ${columns.map((column) => `\`${column}\` = ?`).join(", ")} WHERE \`id_pegawai\` = ?`,
        [...columns.map((column) => data[column] ?? null), Number(id)]
      );
    }
    await savePegawaiRelations(connection, Number(id), {
      alamat: data.alamat,
      pasangan: data.pasangan,
      anak: data.anak
    });
    const [rows] = await connection.query("SELECT * FROM `pegawai` WHERE `id_pegawai` = ? LIMIT 1", [Number(id)]);
    await connection.commit();
    return rows[0] ? normalizeRow(rows[0]) : null;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deletePegawaiData(id) {
  const pool = await getConnectedPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query("DELETE FROM `alamat` WHERE `id_pegawai` = ?", [Number(id)]);
    await connection.query("DELETE FROM `pasangan` WHERE `id_pegawai` = ?", [Number(id)]);
    await connection.query("DELETE FROM `anak` WHERE `id_pegawai` = ?", [Number(id)]);
    await connection.query("DELETE FROM `pegawai` WHERE `id_pegawai` = ?", [Number(id)]);
    await connection.commit();
    return { id_pegawai: Number(id) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
