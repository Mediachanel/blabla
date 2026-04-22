import { z } from "zod";
import { alamat, anak, pasangan } from "@/data/mock";
import { filterPegawaiByRole, getPegawaiWilayah } from "@/lib/auth/access";
import { requireAuth } from "@/lib/auth/requireAuth";
import { fail, ok } from "@/lib/helpers/response";
import { deletePegawaiData, getPegawaiData, updatePegawaiData } from "@/lib/data/pegawaiStore";

const schema = z.object({
  nama: z.string().min(3),
  nama_ukpd: z.string().min(3),
  jenis_pegawai: z.string().min(2),
  email: z.string().email().optional().or(z.literal(""))
}).passthrough();

function findAllowed(id, user, pegawaiMaster) {
  return filterPegawaiByRole(pegawaiMaster, user).find((item) => item.id_pegawai === Number(id));
}

export async function GET(_request, { params }) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const pegawaiMaster = await getPegawaiData();
  const item = findAllowed(params.id, user, pegawaiMaster);
  if (!item) return fail("Data pegawai tidak ditemukan atau tidak dapat diakses.", 404);
  return ok({
    ...item,
    wilayah: getPegawaiWilayah(item),
    alamat: alamat.filter((row) => row.id_pegawai === item.id_pegawai),
    pasangan: pasangan.find((row) => row.id_pegawai === item.id_pegawai) || null,
    anak: anak.filter((row) => row.id_pegawai === item.id_pegawai)
  });
}

export async function PUT(request, { params }) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const pegawaiMaster = await getPegawaiData();
  const current = findAllowed(params.id, user, pegawaiMaster);
  if (!current) return fail("Data pegawai tidak ditemukan atau tidak dapat diakses.", 404);
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return fail("Validasi data pegawai gagal.", 422, parsed.error.flatten());

  const updated = { ...current, ...parsed.data, id_pegawai: Number(params.id) };
  const allowed = filterPegawaiByRole([updated], user).length === 1;
  if (!allowed) return fail("Anda tidak boleh memindahkan pegawai ke UKPD atau wilayah lain.", 403);
  const saved = await updatePegawaiData(params.id, parsed.data);
  return ok(saved, "Pegawai berhasil diperbarui");
}

export async function DELETE(_request, { params }) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const pegawaiMaster = await getPegawaiData();
  const current = findAllowed(params.id, user, pegawaiMaster);
  if (!current) return fail("Data pegawai tidak ditemukan atau tidak dapat diakses.", 404);
  return ok(await deletePegawaiData(params.id), "Pegawai berhasil dihapus");
}
