import { z } from "zod";
import { usulanMutasi } from "@/data/mock";
import { ROLES } from "@/lib/constants/roles";
import { requireAuth } from "@/lib/auth/requireAuth";
import { fail, ok } from "@/lib/helpers/response";

const schema = z.object({
  nip: z.string().optional().default(""),
  nama_pegawai: z.string().min(3),
  nama_ukpd: z.string().min(3),
  ukpd_tujuan: z.string().min(3),
  jabatan: z.string().optional().default(""),
  jabatan_baru: z.string().optional().default(""),
  alasan: z.string().min(5)
});

export async function GET() {
  const { error } = await requireAuth([ROLES.SUPER_ADMIN, ROLES.ADMIN_WILAYAH]);
  if (error) return error;
  return ok(usulanMutasi);
}

export async function POST(request) {
  const { error } = await requireAuth([ROLES.SUPER_ADMIN, ROLES.ADMIN_WILAYAH]);
  if (error) return error;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return fail("Validasi usulan mutasi gagal.", 422, parsed.error.flatten());
  const item = {
    id: usulanMutasi.length + 1,
    status: "Diusulkan",
    tanggal_usulan: new Date().toISOString().slice(0, 10),
    ...parsed.data,
    nama: parsed.data.nama_pegawai,
    asal: parsed.data.nama_ukpd,
    tujuan: parsed.data.ukpd_tujuan
  };
  usulanMutasi.unshift(item);
  return ok(item, "Usulan mutasi berhasil dibuat");
}
