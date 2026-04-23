import { z } from "zod";
import { filterPegawaiByRole, getPegawaiWilayah } from "@/lib/auth/access";
import { requireAuth } from "@/lib/auth/requireAuth";
import { fail, ok } from "@/lib/helpers/response";
import { deletePegawaiData, getPegawaiAlamat, getPegawaiData, getUkpdData, updatePegawaiData } from "@/lib/data/pegawaiStore";

const schema = z.object({
  nama: z.string().min(3),
  nama_ukpd: z.string().min(3),
  jenis_pegawai: z.string().min(2),
  email: z.string().email().optional().or(z.literal(""))
}).passthrough();

function findAllowed(id, user, pegawaiMaster, ukpdList) {
  return filterPegawaiByRole(pegawaiMaster, user, ukpdList).find((item) => item.id_pegawai === Number(id));
}

function cleanNip(value) {
  return String(value || "").trim().replace(/^`+/, "");
}

export async function GET(_request, { params }) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const [pegawaiMaster, ukpdList] = await Promise.all([getPegawaiData(), getUkpdData()]);
  const item = findAllowed(params.id, user, pegawaiMaster, ukpdList);
  if (!item) return fail("Data pegawai tidak ditemukan atau tidak dapat diakses.", 404);

  const alamat = await getPegawaiAlamat(params.id);
  const alamatKtp = alamat.find((entry) => String(entry.tipe || "").toLowerCase() === "ktp");
  const alamatDomisili = alamat.find((entry) => String(entry.tipe || "").toLowerCase() === "domisili");

  return ok({
    ...item,
    nip: cleanNip(item.nip),
    wilayah: getPegawaiWilayah(item, ukpdList),
    alamat,
    alamat_ktp: alamatKtp?.alamat_lengkap || null,
    alamat_domisili: alamatDomisili?.alamat_lengkap || null,
    pasangan: null,
    anak: []
  });
}

export async function PUT(request, { params }) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const [pegawaiMaster, ukpdList] = await Promise.all([getPegawaiData(), getUkpdData()]);
  const current = findAllowed(params.id, user, pegawaiMaster, ukpdList);
  if (!current) return fail("Data pegawai tidak ditemukan atau tidak dapat diakses.", 404);
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return fail("Validasi data pegawai gagal.", 422, parsed.error.flatten());

  const updated = { ...current, ...parsed.data, id_pegawai: Number(params.id) };
  const allowed = filterPegawaiByRole([updated], user, ukpdList).length === 1;
  if (!allowed) return fail("Anda tidak boleh memindahkan pegawai ke UKPD atau wilayah lain.", 403);
  const saved = await updatePegawaiData(params.id, parsed.data);
  return ok(saved, "Pegawai berhasil diperbarui");
}

export async function DELETE(_request, { params }) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const [pegawaiMaster, ukpdList] = await Promise.all([getPegawaiData(), getUkpdData()]);
  const current = findAllowed(params.id, user, pegawaiMaster, ukpdList);
  if (!current) return fail("Data pegawai tidak ditemukan atau tidak dapat diakses.", 404);
  return ok(await deletePegawaiData(params.id), "Pegawai berhasil dihapus");
}
