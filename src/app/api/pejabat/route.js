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

export async function GET(request) {
  const { error } = await requireAuth([ROLES.SUPER_ADMIN], request);
  if (error) return error;

  const pool = await getConnectedPool();
  const rumpunExpr = "LOWER(COALESCE(p.`status_rumpun`, ''))";
  const jabatanExpr = "LOWER(COALESCE(NULLIF(p.`nama_jabatan_menpan`, ''), p.`nama_jabatan_orb`, ''))";
  const pejabatWhere = [
    `${rumpunExpr} LIKE '%tinggi pratama%'`,
    `${rumpunExpr} LIKE '%administrator%'`,
    `${rumpunExpr} LIKE '%pengawas%'`,
    `${jabatanExpr} LIKE '%kepala puskesmas%'`
  ].join(" OR ");

  const [rows] = await pool.query(
    `SELECT
       p.\`id_pegawai\`,
       p.\`nama\`,
       p.\`nama_ukpd\`,
       p.\`jenjang_pendidikan\` AS \`pendidikan\`,
       p.\`pangkat_golongan\`,
       p.\`no_hp_pegawai\`
     FROM \`pegawai\` p
     WHERE ${pejabatWhere}
     ORDER BY
       CASE
         WHEN ${rumpunExpr} LIKE '%tinggi pratama%' THEN 1
         WHEN ${rumpunExpr} LIKE '%administrator%' OR ${jabatanExpr} LIKE '%kepala puskesmas%' THEN 2
         WHEN ${rumpunExpr} LIKE '%pengawas%' THEN 3
         ELSE 4
       END,
       p.\`nama_ukpd\` ASC,
       p.\`nama\` ASC`
  );

  return ok({
    rows: rows.map((row) => ({
      id_pegawai: row.id_pegawai,
      nama: cleanText(row.nama),
      nama_ukpd: cleanText(row.nama_ukpd),
      pendidikan: cleanText(row.pendidikan),
      pangkat_golongan: cleanText(row.pangkat_golongan),
      no_hp_pegawai: cleanPhone(row.no_hp_pegawai)
    }))
  });
}
