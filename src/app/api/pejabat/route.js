import { requireAuth } from "@/lib/auth/requireAuth";
import { ROLES } from "@/lib/constants/roles";
import { getConnectedPool } from "@/lib/db/postgres";
import { ok } from "@/lib/helpers/response";

function cleanText(value, fallback = "-") {
  const text = String(value || "").trim();
  return text || fallback;
}

function cleanPhone(value) {
  return String(value || "").trim();
}

function numberParam(value, fallback, min, max) {
  const number = Number.parseInt(value || "", 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

export async function GET(request) {
  const { error } = await requireAuth([ROLES.SUPER_ADMIN], request);
  if (error) return error;

  const pool = await getConnectedPool();
  const { searchParams } = new URL(request.url);
  const ukpd = searchParams.get("ukpd") || "";
  const page = numberParam(searchParams.get("page"), 1, 1, 100000);
  const pageSize = numberParam(searchParams.get("pageSize"), 10, 10, 100);
  const offset = (page - 1) * pageSize;
  const rumpunExpr = "LOWER(COALESCE(p.`status_rumpun`, ''))";
  const jabatanExpr = "LOWER(COALESCE(NULLIF(p.`nama_jabatan_menpan`, ''), p.`nama_jabatan_orb`, ''))";
  const pejabatWhere = [
    `${rumpunExpr} LIKE '%tinggi pratama%'`,
    `${rumpunExpr} LIKE '%administrator%'`,
    `${rumpunExpr} LIKE '%pengawas%'`,
    `${jabatanExpr} LIKE '%kepala puskesmas%'`
  ].join(" OR ");
  const where = [`(${pejabatWhere})`];
  const params = [];

  if (ukpd) {
    where.push("p.`nama_ukpd` = ?");
    params.push(ukpd);
  }

  const whereSql = `WHERE ${where.join(" AND ")}`;
  const countRows = (await pool.query(
    `SELECT COUNT(*) AS total
     FROM \`pegawai\` p
     ${whereSql}`,
    params
  ))[0];

  const [rows] = await pool.query(
    `SELECT
       p.\`id_pegawai\`,
       p.\`nama\`,
       p.\`nama_ukpd\`,
       p.\`nama_jabatan_menpan\`,
       p.\`nama_jabatan_orb\`,
       p.\`status_rumpun\`,
       p.\`jenjang_pendidikan\` AS \`pendidikan\`,
       p.\`pangkat_golongan\`,
       p.\`no_hp_pegawai\`
     FROM \`pegawai\` p
     ${whereSql}
     ORDER BY
       CASE
         WHEN ${rumpunExpr} LIKE '%tinggi pratama%' THEN 1
         WHEN ${rumpunExpr} LIKE '%administrator%' OR ${jabatanExpr} LIKE '%kepala puskesmas%' THEN 2
         WHEN ${rumpunExpr} LIKE '%pengawas%' THEN 3
         ELSE 4
       END,
       p.\`nama_ukpd\` ASC,
       p.\`nama\` ASC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  const [ukpdRows] = await pool.query(
    `SELECT DISTINCT p.\`nama_ukpd\`
     FROM \`pegawai\` p
     WHERE (${pejabatWhere})
       AND p.\`nama_ukpd\` IS NOT NULL
       AND p.\`nama_ukpd\` <> ''
     ORDER BY p.\`nama_ukpd\` ASC`
  );

  return ok({
    rows: rows.map((row) => ({
      id_pegawai: row.id_pegawai,
      nama: cleanText(row.nama),
      nama_ukpd: cleanText(row.nama_ukpd),
      nama_jabatan_menpan: cleanText(row.nama_jabatan_menpan || row.nama_jabatan_orb),
      status_rumpun: cleanText(row.status_rumpun),
      pendidikan: cleanText(row.pendidikan),
      pangkat_golongan: cleanText(row.pangkat_golongan),
      no_hp_pegawai: cleanPhone(row.no_hp_pegawai)
    })),
    total: Number(countRows[0]?.total || 0),
    page,
    pageSize,
    filters: {
      ukpdOptions: ukpdRows.map((row) => row.nama_ukpd).filter(Boolean)
    }
  });
}
