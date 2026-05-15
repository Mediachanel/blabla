import { getConnectedPool } from "@/lib/db/postgres";
import { fuzzyDistinct } from "@/lib/n8n-ai/fuzzy";
import { normalizeHrisEntity } from "@/lib/n8n-ai/hrisDictionary";
import { addPegawaiScope, checkN8nSecret } from "@/lib/n8n-ai/security";

export const runtime = "nodejs";

function toolResponse(payload, status = 200) {
  return Response.json(payload, { status });
}

async function resolveFilter(pool, field, rawValue, sourceSql) {
  const normalized = normalizeHrisEntity(field, rawValue);
  if (!normalized) {
    return { input: rawValue || "", value: "", candidates: [], action: "empty", score: 0 };
  }

  const result = await fuzzyDistinct(pool, sourceSql, normalized);
  return {
    input: rawValue,
    normalized,
    value: result.decision.selected?.value || "",
    candidates: result.candidates,
    action: result.decision.action,
    score: result.decision.score
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
  }
}

export async function POST(request) {
  if (!checkN8nSecret(request)) {
    return toolResponse({ error: "Forbidden" }, 403);
  }

  const body = await request.json().catch(() => ({}));
  const pool = await getConnectedPool();
  const where = ["1=1"];
  const params = [];
  const fuzzy_candidates = {};
  const selected_candidate = {};

  addPegawaiScope(where, params, body.user, { pegawaiAlias: "p", ukpdAlias: "u" });

  const filters = [
    ["status_pegawai", body.status_pegawai, "SELECT DISTINCT `jenis_pegawai` AS value FROM `pegawai`"],
    ["wilayah", body.wilayah, "SELECT DISTINCT `wilayah` AS value FROM `ukpd` UNION SELECT DISTINCT `wilayah` AS value FROM `pegawai`"],
    ["ukpd", body.ukpd, "SELECT DISTINCT `nama_ukpd` AS value FROM `ukpd` UNION SELECT DISTINCT `nama_ukpd` AS value FROM `pegawai`"]
  ];

  for (const [field, rawValue, sourceSql] of filters) {
    if (!String(rawValue || "").trim()) continue;
    const resolution = await resolveFilter(pool, field, rawValue, sourceSql);
    fuzzy_candidates[field] = resolution.candidates;

    if (resolution.action === "clarification_required") {
      return toolResponse({
        source: "database",
        tool: "employee-count",
        total: null,
        requires_clarification: true,
        clarification_field: field,
        fuzzy_candidates,
        selected_candidate,
        confidence_score: resolution.score,
        message: "Kandidat ditemukan dengan confidence sedang. Minta user memilih salah satu kandidat."
      });
    }

    if (resolution.action === "not_found") {
      return toolResponse({
        source: "database",
        tool: "employee-count",
        total: 0,
        data: [],
        fuzzy_candidates,
        selected_candidate,
        confidence_score: resolution.score,
        message: "Data tidak ditemukan."
      });
    }

    selected_candidate[field] = resolution.value;
    addResolvedFilter(where, params, field, resolution.value);
  }

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM ` + "`pegawai`" + ` p
     LEFT JOIN ` + "`ukpd`" + ` u ON u.` + "`nama_ukpd`" + ` = p.` + "`nama_ukpd`" + `
     WHERE ${where.join(" AND ")}`,
    params
  );

  const total = Number(rows[0]?.total || 0);
  return toolResponse({
    source: "database",
    tool: "employee-count",
    total,
    filter: {
      status_pegawai: selected_candidate.status_pegawai || null,
      wilayah: selected_candidate.wilayah || null,
      ukpd: selected_candidate.ukpd || null,
      role: body.user?.role || null,
      wilayah_id: body.user?.wilayah_id || body.user?.wilayah || null,
      ukpd_id: body.user?.ukpd_id || body.user?.nama_ukpd || null
    },
    fuzzy_candidates,
    selected_candidate,
    confidence_score: Math.max(0, ...Object.values(fuzzy_candidates).flat().map((item) => Number(item.score || 0)))
  });
}
