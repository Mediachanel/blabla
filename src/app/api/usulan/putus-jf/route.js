import { z } from "zod";
import { ROLES } from "@/lib/constants/roles";
import { requireAuth } from "@/lib/auth/requireAuth";
import { fail, ok } from "@/lib/helpers/response";
import { getConnectedPool } from "@/lib/db/mysql";

const schema = z.object({
  nip: z.string().optional().default(""),
  nama_pegawai: z.string().min(3),
  pangkat_golongan: z.string().optional().default(""),
  nama_ukpd: z.string().min(3),
  jabatan: z.string().min(3),
  jabatan_baru: z.string().optional().default(""),
  angka_kredit: z.coerce.number().optional().nullable(),
  nomor_surat: z.string().optional().default(""),
  tanggal_surat: z.string().optional().default(""),
  hal: z.string().optional().default(""),
  pimpinan: z.string().optional().default(""),
  asal_surat: z.string().optional().default(""),
  berkas_path: z.string().optional().default(""),
  keterangan: z.string().optional().default(""),
  alasan_pemutusan: z.string().min(5)
});

function addScope(where, params, user) {
  if (user.role === ROLES.ADMIN_UKPD) {
    where.push("(s.`nama_ukpd` = ? OR s.`created_by_ukpd` = ?)");
    params.push(user.nama_ukpd, user.nama_ukpd);
  } else if (user.role === ROLES.ADMIN_WILAYAH) {
    where.push("COALESCE(p.`wilayah`, u.`wilayah`) = ?");
    params.push(user.wilayah);
  } else if (user.role !== ROLES.SUPER_ADMIN) {
    where.push("1 = 0");
  }
}

export async function GET() {
  const { user, error } = await requireAuth([ROLES.SUPER_ADMIN, ROLES.ADMIN_WILAYAH, ROLES.ADMIN_UKPD]);
  if (error) return error;
  const pool = await getConnectedPool();
  const where = [];
  const params = [];
  addScope(where, params, user);
  const [rows] = await pool.query(
    `SELECT s.*
     FROM \`usulan_pjf_stop\` s
     LEFT JOIN \`pegawai\` p ON p.\`nip\` = s.\`nip\`
     LEFT JOIN \`ukpd\` u ON u.\`nama_ukpd\` = s.\`nama_ukpd\`
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY s.\`created_at\` DESC, s.\`id\` DESC
     LIMIT 500`,
    params
  );
  return ok(rows);
}

export async function POST(request) {
  const { user, error } = await requireAuth([ROLES.SUPER_ADMIN, ROLES.ADMIN_WILAYAH, ROLES.ADMIN_UKPD]);
  if (error) return error;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return fail("Validasi usulan putus JF gagal.", 422, parsed.error.flatten());
  if (user.role === ROLES.ADMIN_UKPD && parsed.data.nama_ukpd !== user.nama_ukpd) {
    return fail("Admin UKPD hanya dapat mengusulkan putus JF dari UKPD-nya.", 403);
  }
  const pool = await getConnectedPool();
  const data = {
    ...parsed.data,
    status: "Diusulkan",
    tanggal_usulan: new Date(),
    created_by_ukpd: user.nama_ukpd
  };
  const columns = Object.keys(data);
  const [result] = await pool.query(
    `INSERT INTO \`usulan_pjf_stop\` (${columns.map((column) => `\`${column}\``).join(", ")})
     VALUES (${columns.map(() => "?").join(", ")})`,
    columns.map((column) => data[column] ?? null)
  );
  const [[item]] = await pool.query("SELECT * FROM `usulan_pjf_stop` WHERE `id` = ? LIMIT 1", [result.insertId]);
  return ok(item, "Usulan putus JF berhasil dibuat");
}
