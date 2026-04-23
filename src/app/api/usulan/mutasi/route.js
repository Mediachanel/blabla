import { z } from "zod";
import { ROLES } from "@/lib/constants/roles";
import { requireAuth } from "@/lib/auth/requireAuth";
import { fail, ok } from "@/lib/helpers/response";
import { getConnectedPool } from "@/lib/db/mysql";

const schema = z.object({
  nip: z.string().optional().default(""),
  nama_pegawai: z.string().min(3),
  gelar_depan: z.string().optional().default(""),
  gelar_belakang: z.string().optional().default(""),
  nama_ukpd: z.string().min(3),
  ukpd_tujuan: z.string().min(3),
  jabatan: z.string().optional().default(""),
  jabatan_baru: z.string().optional().default(""),
  pangkat_golongan: z.string().optional().default(""),
  abk_j_lama: z.coerce.number().int().nonnegative().optional().nullable(),
  bezetting_j_lama: z.coerce.number().int().nonnegative().optional().nullable(),
  nonasn_bezetting_lama: z.coerce.number().int().nonnegative().optional().nullable(),
  nonasn_abk_lama: z.coerce.number().int().nonnegative().optional().nullable(),
  abk_j_baru: z.coerce.number().int().nonnegative().optional().nullable(),
  bezetting_j_baru: z.coerce.number().int().nonnegative().optional().nullable(),
  nonasn_bezetting_baru: z.coerce.number().int().nonnegative().optional().nullable(),
  nonasn_abk_baru: z.coerce.number().int().nonnegative().optional().nullable(),
  jenis_mutasi: z.string().optional().default(""),
  berkas_path: z.string().optional().default(""),
  keterangan: z.string().optional().default(""),
  alasan: z.string().min(5)
});

function addScope(where, params, user) {
  if (user.role === ROLES.ADMIN_UKPD) {
    where.push("(m.`nama_ukpd` = ? OR m.`created_by_ukpd` = ?)");
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
    `SELECT m.*
     FROM \`usulan_mutasi\` m
     LEFT JOIN \`pegawai\` p ON p.\`nip\` = m.\`nip\`
     LEFT JOIN \`ukpd\` u ON u.\`nama_ukpd\` = m.\`nama_ukpd\`
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY m.\`created_at\` DESC, m.\`id\` DESC
     LIMIT 500`,
    params
  );
  return ok(rows);
}

export async function POST(request) {
  const { user, error } = await requireAuth([ROLES.SUPER_ADMIN, ROLES.ADMIN_WILAYAH, ROLES.ADMIN_UKPD]);
  if (error) return error;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return fail("Validasi usulan mutasi gagal.", 422, parsed.error.flatten());
  if (user.role === ROLES.ADMIN_UKPD && parsed.data.nama_ukpd !== user.nama_ukpd) {
    return fail("Admin UKPD hanya dapat mengusulkan mutasi dari UKPD asalnya.", 403);
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
    `INSERT INTO \`usulan_mutasi\` (${columns.map((column) => `\`${column}\``).join(", ")})
     VALUES (${columns.map(() => "?").join(", ")})`,
    columns.map((column) => data[column] ?? null)
  );
  const [[item]] = await pool.query("SELECT * FROM `usulan_mutasi` WHERE `id` = ? LIMIT 1", [result.insertId]);
  return ok(item, "Usulan mutasi berhasil dibuat");
}
