import { getConnectedPool } from "@/lib/db/postgres";
import { ensurePgTrgm, fuzzyDistinct, rankDecision } from "@/lib/n8n-ai/fuzzy";
import { normalizeHrisEntity } from "@/lib/n8n-ai/hrisDictionary";
import { addPegawaiScope, checkN8nSecret, maskIdentifier } from "@/lib/n8n-ai/security";

export const runtime = "nodejs";

function toolResponse(payload, status = 200) {
  return Response.json(payload, { status });
}

async function resolveFilter(pool, field, rawValue, sourceSql) {
  const normalized = normalizeHrisEntity(field, rawValue);
  if (!normalized) return null;
  const result = await fuzzyDistinct(pool, sourceSql, normalized);
  return {
    field,
    input: rawValue,
    normalized,
    value: result.decision.selected?.value || "",
    action: result.decision.action,
    score: result.decision.score,
    candidates: result.candidates
  };
}

function addResolvedFilter(where, params, field, value) {
  if (!value) return;
  if (field === "status_pegawai") {
    if (String(value).toUpperCase() === "PNS") {
      where.push("UPPER(COALESCE(p.`jenis_pegawai`, '')) IN ('PNS', 'CPNS')");
      return;
    }
    where.push("LOWER(COALESCE(p.`jenis_pegawai`, '')) = LOWER(?)");
    params.push(value);
    return;
  }
  if (field === "wilayah") {
    where.push("LOWER(COALESCE(NULLIF(p.`wilayah`, ''), u.`wilayah`, '')) = LOWER(?)");
    params.push(value);
    return;
  }
  if (field === "ukpd") {
    where.push("LOWER(COALESCE(p.`nama_ukpd`, '')) = LOWER(?)");
    params.push(value);
    return;
  }
  if (field === "jabatan") {
    where.push("LOWER(COALESCE(NULLIF(p.`nama_jabatan_menpan`, ''), p.`nama_jabatan_orb`, '')) = LOWER(?)");
    params.push(value);
  }
}

function mapEmployee(row) {
  return {
    id: row.id_pegawai,
    id_pegawai: row.id_pegawai,
    nama: row.nama,
    nip: maskIdentifier(row.nip),
    nik: maskIdentifier(row.nik),
    nrk: maskIdentifier(row.nrk),
    status_pegawai: row.jenis_pegawai,
    jabatan: row.jabatan,
    nama_ukpd: row.nama_ukpd,
    ukpd: row.nama_ukpd,
    wilayah: row.wilayah,
    score: Number(row.score || 0)
  };
}

export async function POST(request) {
  if (!checkN8nSecret(request)) {
    return toolResponse({ error: "Forbidden" }, 403);
  }

  const body = await request.json().catch(() => ({}));
  const nama = String(body.nama || body.query || "").trim();

  if (!nama) {
    return toolResponse({
      source: "database",
      tool: "search-employee",
      data: [],
      fuzzy_candidates: [],
      selected_candidate: null,
      confidence_score: 0
    });
  }

  const pool = await getConnectedPool();
  await ensurePgTrgm(pool);

  const where = ["1=1"];
  const params = [];
  const fuzzyByField = {};
  const selectedFilters = {};

  addPegawaiScope(where, params, body.user, { pegawaiAlias: "p", ukpdAlias: "u" });

  const filters = [
    ["status_pegawai", body.status_pegawai, "SELECT DISTINCT `jenis_pegawai` AS value FROM `pegawai`"],
    ["wilayah", body.wilayah, "SELECT DISTINCT `wilayah` AS value FROM `ukpd` UNION SELECT DISTINCT `wilayah` AS value FROM `pegawai`"],
    ["ukpd", body.ukpd, "SELECT DISTINCT `nama_ukpd` AS value FROM `ukpd` UNION SELECT DISTINCT `nama_ukpd` AS value FROM `pegawai`"],
    ["jabatan", body.jabatan, "SELECT DISTINCT COALESCE(NULLIF(`nama_jabatan_menpan`, ''), `nama_jabatan_orb`) AS value FROM `pegawai`"]
  ];

  for (const [field, rawValue, sourceSql] of filters) {
    if (!String(rawValue || "").trim()) continue;
    const resolution = await resolveFilter(pool, field, rawValue, sourceSql);
    fuzzyByField[field] = resolution.candidates;

    if (resolution.action === "clarification_required") {
      return toolResponse({
        source: "database",
        tool: "search-employee",
        data: [],
        requires_clarification: true,
        clarification_field: field,
        fuzzy_candidates: fuzzyByField,
        selected_candidate: selectedFilters,
        confidence_score: resolution.score,
        message: "Kandidat ditemukan dengan confidence sedang. Minta user memilih salah satu kandidat."
      });
    }

    if (resolution.action === "not_found") {
      return toolResponse({
        source: "database",
        tool: "search-employee",
        data: [],
        fuzzy_candidates: fuzzyByField,
        selected_candidate: selectedFilters,
        confidence_score: resolution.score,
        message: "Data tidak ditemukan."
      });
    }

    selectedFilters[field] = resolution.value;
    addResolvedFilter(where, params, field, resolution.value);
  }

  const scoreParams = [
    nama,
    nama,
    nama,
    nama
  ];
  const matchParams = [
    nama,
    nama,
    nama,
    nama,
    `%${nama}%`,
    `%${nama}%`,
    `%${nama}%`
  ];

  const [rows] = await pool.query(
    `SELECT
       p.` + "`id_pegawai`" + `,
       p.` + "`nama`" + `,
       CAST(p.` + "`nip`" + ` AS TEXT) AS nip,
       CAST(p.` + "`nik`" + ` AS TEXT) AS nik,
       CAST(p.` + "`nrk`" + ` AS TEXT) AS nrk,
       p.` + "`jenis_pegawai`" + `,
       COALESCE(NULLIF(p.` + "`nama_jabatan_menpan`" + `, ''), p.` + "`nama_jabatan_orb`" + `) AS jabatan,
       p.` + "`nama_ukpd`" + `,
       COALESCE(NULLIF(p.` + "`wilayah`" + `, ''), u.` + "`wilayah`" + `) AS wilayah,
       GREATEST(
         similarity(COALESCE(p.` + "`nama`" + `, ''), ?),
         similarity(COALESCE(CAST(p.` + "`nip`" + ` AS TEXT), ''), ?),
         similarity(COALESCE(CAST(p.` + "`nik`" + ` AS TEXT), ''), ?),
         similarity(COALESCE(CAST(p.` + "`nrk`" + ` AS TEXT), ''), ?)
       ) AS score
     FROM ` + "`pegawai`" + ` p
     LEFT JOIN ` + "`ukpd`" + ` u ON u.` + "`nama_ukpd`" + ` = p.` + "`nama_ukpd`" + `
     WHERE ${where.join(" AND ")}
       AND (
         COALESCE(p.` + "`nama`" + `, '') % ?
         OR COALESCE(CAST(p.` + "`nip`" + ` AS TEXT), '') % ?
         OR COALESCE(CAST(p.` + "`nik`" + ` AS TEXT), '') % ?
         OR COALESCE(CAST(p.` + "`nrk`" + ` AS TEXT), '') % ?
         OR LOWER(COALESCE(p.` + "`nama`" + `, '')) LIKE LOWER(?)
         OR LOWER(COALESCE(CAST(p.` + "`nip`" + ` AS TEXT), '')) LIKE LOWER(?)
         OR LOWER(COALESCE(CAST(p.` + "`nrk`" + ` AS TEXT), '')) LIKE LOWER(?)
       )
     ORDER BY score DESC, p.` + "`nama`" + ` ASC
     LIMIT 5`,
    [...scoreParams, ...params, ...matchParams]
  );

  const candidates = rows.map(mapEmployee);
  const decision = rankDecision(candidates);

  return toolResponse({
    source: "database",
    tool: "search-employee",
    data: decision.action === "selected" ? [decision.selected] : [],
    candidates,
    fuzzy_candidates: {
      nama: candidates.map((item) => ({ value: item.nama, id: item.id_pegawai, score: item.score })),
      ...fuzzyByField
    },
    selected_candidate: decision.selected || null,
    selected_filters: selectedFilters,
    confidence_score: decision.score,
    requires_clarification: decision.action === "clarification_required",
    not_found: decision.action === "not_found"
  });
}
