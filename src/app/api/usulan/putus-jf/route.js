import { z } from "zod";
import { ROLES } from "@/lib/constants/roles";
import { requireAuth } from "@/lib/auth/requireAuth";
import { fail, ok } from "@/lib/helpers/response";

const usulanPutusJf = [];

const schema = z.object({
  nip: z.string().optional().default(""),
  nama_pegawai: z.string().min(3),
  nama_ukpd: z.string().min(3),
  jabatan: z.string().min(3),
  jabatan_baru: z.string().optional().default(""),
  alasan_pemutusan: z.string().min(5)
});

export async function GET() {
  const { error } = await requireAuth([ROLES.SUPER_ADMIN, ROLES.ADMIN_WILAYAH]);
  if (error) return error;
  return ok(usulanPutusJf);
}

export async function POST(request) {
  const { error } = await requireAuth([ROLES.SUPER_ADMIN, ROLES.ADMIN_WILAYAH]);
  if (error) return error;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return fail("Validasi usulan putus JF gagal.", 422, parsed.error.flatten());
  const item = {
    id: usulanPutusJf.length + 1,
    status: "Diusulkan",
    tanggal_usulan: new Date().toISOString().slice(0, 10),
    ...parsed.data,
    nama: parsed.data.nama_pegawai,
    alasan: parsed.data.alasan_pemutusan
  };
  usulanPutusJf.unshift(item);
  return ok(item, "Usulan putus JF berhasil dibuat");
}
