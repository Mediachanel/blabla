import { ROLES } from "@/lib/constants/roles";
import { requireAuth } from "@/lib/auth/requireAuth";
import { fail, ok } from "@/lib/helpers/response";
import { createPegawaiData, getUkpdData, updatePegawaiData } from "@/lib/data/pegawaiStore";
import { getConnectedPool } from "@/lib/db/mysql";
import {
  buildPegawaiImportError,
  normalizePegawaiImportRecord,
  parsePegawaiImportFile
} from "@/lib/import/pegawaiExcel";

export const runtime = "nodejs";

const PEGAWAI_EXCEL_MAX_BYTES = 8 * 1024 * 1024;

function cleanKey(value) {
  return String(value || "").trim().toLowerCase();
}

function removeBlankUpdateFields(data) {
  return Object.fromEntries(
    Object.entries(data).filter(([key, value]) => {
      if (key === "id_pegawai") return false;
      if (["nama", "nama_ukpd", "jenis_pegawai"].includes(key)) return true;
      return value !== "" && value !== null && value !== undefined;
    })
  );
}

async function findExistingPegawai(pool, data) {
  const clauses = [];
  const params = [];

  if (data.id_pegawai) {
    clauses.push("`id_pegawai` = ?");
    params.push(Number(data.id_pegawai));
  }
  for (const field of ["nip", "nrk", "nik"]) {
    if (!data[field]) continue;
    clauses.push(`\`${field}\` = ?`);
    params.push(String(data[field]));
  }
  if (!clauses.length) return null;

  const [rows] = await pool.query(
    `SELECT * FROM \`pegawai\` WHERE ${clauses.join(" OR ")} ORDER BY \`id_pegawai\` ASC LIMIT 1`,
    params
  );
  return rows[0] || null;
}

function duplicateKeysForRow(data) {
  return [
    data.id_pegawai ? `id:${data.id_pegawai}` : "",
    data.nip ? `nip:${cleanKey(data.nip)}` : "",
    data.nrk ? `nrk:${cleanKey(data.nrk)}` : "",
    data.nik ? `nik:${cleanKey(data.nik)}` : ""
  ].filter(Boolean);
}

export async function POST(request) {
  const { error } = await requireAuth([ROLES.SUPER_ADMIN], request);
  if (error) return error;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return fail("File Excel pegawai wajib dipilih.", 422);
  }

  const fileName = String(file.name || "").toLowerCase();
  if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".csv")) {
    return fail("Format file harus .xlsx atau .csv.", 422);
  }
  if (file.size <= 0) return fail("File Excel kosong atau tidak dapat dibaca.", 422);
  if (file.size > PEGAWAI_EXCEL_MAX_BYTES) {
    return fail(`Ukuran file maksimal ${PEGAWAI_EXCEL_MAX_BYTES / (1024 * 1024)} MB.`, 413);
  }

  let parsedRows;
  try {
    parsedRows = await parsePegawaiImportFile(Buffer.from(await file.arrayBuffer()), file.name);
  } catch (parseError) {
    return fail(parseError.message || "File Excel pegawai tidak dapat dibaca.", 422);
  }

  if (!parsedRows.length) {
    return fail("Sheet Pegawai tidak berisi data yang bisa diimport.", 422);
  }

  const ukpdList = await getUkpdData();
  const ukpdByName = new Map(ukpdList.map((row) => [cleanKey(row.nama_ukpd), row]));
  const seenKeys = new Map();
  const validationErrors = [];
  const validRows = [];

  for (const { rowNumber, record } of parsedRows) {
    const normalized = normalizePegawaiImportRecord(record);
    const data = normalized.data;
    const errors = [...normalized.errors];

    const ukpd = ukpdByName.get(cleanKey(data.nama_ukpd));
    if (!ukpd) {
      errors.push({ field: "nama_ukpd", message: "Nama UKPD tidak ditemukan di referensi sistem." });
    } else {
      data.nama_ukpd = ukpd.nama_ukpd;
      data.id_ukpd = ukpd.id_ukpd || data.id_ukpd || null;
      data.ukpd_id = ukpd.id_ukpd || data.ukpd_id || null;
      data.jenis_ukpd = ukpd.jenis_ukpd || data.jenis_ukpd || "";
      data.wilayah = ukpd.wilayah || data.wilayah || "";
    }

    for (const key of duplicateKeysForRow(data)) {
      if (seenKeys.has(key)) {
        errors.push({ field: key.split(":")[0], message: `Kunci ${key} duplikat dengan baris ${seenKeys.get(key)}.` });
      } else {
        seenKeys.set(key, rowNumber);
      }
    }

    if (errors.length) {
      validationErrors.push(buildPegawaiImportError(rowNumber, errors));
    } else {
      validRows.push({ rowNumber, data });
    }
  }

  if (validationErrors.length) {
    return fail("Import Excel pegawai dibatalkan. Perbaiki baris yang bermasalah lalu upload ulang.", 422, {
      rows: validationErrors,
      totalErrors: validationErrors.length,
      totalRows: parsedRows.length
    });
  }

  const pool = await getConnectedPool();
  const writeErrors = [];
  const imported = [];
  let created = 0;
  let updated = 0;

  for (const { rowNumber, data } of validRows) {
    try {
      const existing = await findExistingPegawai(pool, data);
      if (existing) {
        const updatePayload = removeBlankUpdateFields(data);
        await updatePegawaiData(existing.id_pegawai, {
          ...updatePayload,
          current_nip: existing.nip,
          current_nama: existing.nama
        });
        updated += 1;
        imported.push({ rowNumber, id_pegawai: existing.id_pegawai, nama: data.nama, status: "updated" });
      } else {
        const createPayload = { ...data };
        delete createPayload.id_pegawai;
        const createdRow = await createPegawaiData(createPayload);
        created += 1;
        imported.push({ rowNumber, id_pegawai: createdRow.id_pegawai, nama: data.nama, status: "created" });
      }
    } catch (writeError) {
      writeErrors.push({
        rowNumber,
        messages: [writeError.message || "Baris gagal disimpan."],
        fields: []
      });
    }
  }

  if (writeErrors.length) {
    return fail("Sebagian data gagal disimpan.", 500, {
      rows: writeErrors,
      totalErrors: writeErrors.length,
      totalRows: parsedRows.length,
      created,
      updated
    });
  }

  return ok({
    totalRows: parsedRows.length,
    created,
    updated,
    imported
  }, "Import Excel pegawai berhasil diproses.");
}
