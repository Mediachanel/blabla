import { getConnectedPool } from "@/lib/db/postgres";
import { addPegawaiScope, checkN8nSecret } from "@/lib/n8n-ai/security";

export const runtime = "nodejs";

function toolResponse(payload, status = 200) {
  return Response.json(payload, { status });
}

export async function POST(request) {
  if (!checkN8nSecret(request)) {
    return toolResponse({ error: "Forbidden" }, 403);
  }

  const body = await request.json().catch(() => ({}));
  const pool = await getConnectedPool();
  const where = ["1=1"];
  const params = [];
  addPegawaiScope(where, params, body.user, { pegawaiAlias: "p", ukpdAlias: "u" });
  const whereSql = where.join(" AND ");
  const joinSql = "FROM `pegawai` p LEFT JOIN `ukpd` u ON u.`nama_ukpd` = p.`nama_ukpd`";

  const [totalRows] = await pool.query(
    `SELECT COUNT(*) AS total ${joinSql} WHERE ${whereSql}`,
    params
  );

  const [byStatus] = await pool.query(
    `SELECT COALESCE(NULLIF(p.` + "`jenis_pegawai`" + `, ''), 'Tidak tercatat') AS status_pegawai,
            COUNT(*) AS total
     ${joinSql}
     WHERE ${whereSql}
     GROUP BY COALESCE(NULLIF(p.` + "`jenis_pegawai`" + `, ''), 'Tidak tercatat')
     ORDER BY total DESC`,
    params
  );

  const [byWilayah] = await pool.query(
    `SELECT COALESCE(NULLIF(p.` + "`wilayah`" + `, ''), u.` + "`wilayah`" + `, 'Tidak tercatat') AS wilayah,
            COUNT(*) AS total
     ${joinSql}
     WHERE ${whereSql}
     GROUP BY COALESCE(NULLIF(p.` + "`wilayah`" + `, ''), u.` + "`wilayah`" + `, 'Tidak tercatat')
     ORDER BY total DESC`,
    params
  );

  const [byUkpd] = await pool.query(
    `SELECT COALESCE(NULLIF(p.` + "`nama_ukpd`" + `, ''), 'Tidak tercatat') AS ukpd,
            COUNT(*) AS total
     ${joinSql}
     WHERE ${whereSql}
     GROUP BY COALESCE(NULLIF(p.` + "`nama_ukpd`" + `, ''), 'Tidak tercatat')
     ORDER BY total DESC
     LIMIT 20`,
    params
  );

  return toolResponse({
    source: "database",
    tool: "dashboard-summary",
    total: Number(totalRows[0]?.total || 0),
    by_status: byStatus.map((row) => ({ status_pegawai: row.status_pegawai, total: Number(row.total || 0) })),
    by_wilayah: byWilayah.map((row) => ({ wilayah: row.wilayah, total: Number(row.total || 0) })),
    by_ukpd: byUkpd.map((row) => ({ ukpd: row.ukpd, total: Number(row.total || 0) })),
    filter: {
      role: body.user?.role || null,
      wilayah_id: body.user?.wilayah_id || body.user?.wilayah || null,
      ukpd_id: body.user?.ukpd_id || body.user?.nama_ukpd || null
    }
  });
}
