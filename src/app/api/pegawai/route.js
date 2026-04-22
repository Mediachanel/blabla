import { z } from "zod";
import { filterPegawaiByRole, getPegawaiWilayah } from "@/lib/auth/access";
import { requireAuth } from "@/lib/auth/requireAuth";
import { fail, ok } from "@/lib/helpers/response";
import { normalizeJenisPegawai } from "@/lib/helpers/pegawaiStatus";
import { createPegawaiData, getPegawaiData } from "@/lib/data/pegawaiStore";

const schema = z.object({
  nama: z.string().min(3),
  nama_ukpd: z.string().min(3),
  jenis_pegawai: z.string().min(2),
  nip: z.string().optional(),
  nik: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  jenis_kelamin: z.string().optional(),
  kondisi: z.string().optional()
}).passthrough();

export async function GET(request) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const status = searchParams.get("status") || "";
  const wilayah = searchParams.get("wilayah") || "";
  const ukpd = searchParams.get("ukpd") || "";

  const pegawaiMaster = await getPegawaiData();
  let data = filterPegawaiByRole(pegawaiMaster, user).map((item) => ({ ...item, wilayah: getPegawaiWilayah(item) }));
  if (q) data = data.filter((item) => [item.nama, item.nip, item.nama_jabatan_menpan, item.nama_jabatan_orb, item.nama_ukpd].join(" ").toLowerCase().includes(q));
  if (status) data = data.filter((item) => normalizeJenisPegawai(item.jenis_pegawai) === status);
  if (wilayah) data = data.filter((item) => item.wilayah === wilayah);
  if (ukpd) data = data.filter((item) => item.nama_ukpd === ukpd);
  return ok(data);
}

export async function POST(request) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return fail("Validasi data pegawai gagal.", 422, parsed.error.flatten());

  const nextItem = { ...parsed.data };
  const allowed = filterPegawaiByRole([nextItem], user).length === 1;
  if (!allowed) return fail("Anda tidak boleh membuat pegawai untuk UKPD atau wilayah lain.", 403);
  const created = await createPegawaiData(nextItem);
  return ok(created, "Pegawai berhasil ditambahkan");
}
