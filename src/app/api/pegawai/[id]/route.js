import { z } from "zod";
import { filterPegawaiByRole, getPegawaiWilayah } from "@/lib/auth/access";
import { requireAuth } from "@/lib/auth/requireAuth";
import { fail, ok } from "@/lib/helpers/response";
import { getConnectedPool, isClosedConnectionError, resetMysqlPools } from "@/lib/db/mysql";
import { ensureDrhSchema } from "@/lib/db/ensureDrhSchema";
import {
  deletePegawaiData,
  getPegawaiAlamat,
  getPegawaiAnak,
  getPegawaiById,
  getPegawaiKeluarga,
  getPegawaiPasangan,
  getPegawaiRiwayatGajiPokok,
  getPegawaiRiwayatHukumanDisiplin,
  getPegawaiRiwayatJabatan,
  getPegawaiRiwayatKeberhasilan,
  getPegawaiRiwayatKegiatanStrategis,
  getPegawaiRiwayatNarasumber,
  getPegawaiRiwayatPangkat,
  getPegawaiRiwayatPendidikan,
  getPegawaiRiwayatPenghargaan,
  getPegawaiRiwayatPrestasiPendidikan,
  getPegawaiRiwayatSkp,
  getUkpdData,
  updatePegawaiData
} from "@/lib/data/pegawaiStore";
import { validatePegawaiReferenceFields } from "@/lib/pegawaiFormOptions";
import { normalizePegawaiReferencePayload } from "@/lib/pegawaiReferenceOptions";

const schema = z.object({
  nama: z.string().min(3),
  nama_ukpd: z.string().min(3),
  jenis_pegawai: z.string().min(2),
  email: z.string().email().optional().or(z.literal(""))
}).passthrough();

async function findAllowedById(id, user, ukpdList) {
  const item = await getPegawaiById(id);
  if (!item) return null;
  return filterPegawaiByRole([item], user, ukpdList).find((entry) => entry.id_pegawai === Number(id)) || null;
}

function cleanNip(value) {
  return String(value || "").trim().replace(/^`+/, "");
}

async function ensureSchemaWithFreshConnection() {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const pool = await getConnectedPool();
    let connection;
    try {
      connection = await pool.getConnection();
      await ensureDrhSchema(connection);
      return;
    } catch (error) {
      if (attempt === 0 && isClosedConnectionError(error)) {
        await resetMysqlPools();
        continue;
      }
      throw error;
    } finally {
      connection?.release();
    }
  }
}

export async function GET(_request, { params }) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    await ensureSchemaWithFreshConnection();
    const { id } = await params;
    const ukpdList = await getUkpdData();
    const item = await findAllowedById(id, user, ukpdList);
    if (!item) return fail("Data pegawai tidak ditemukan atau tidak dapat diakses.", 404);

    const [alamat, pasangan, anak, keluarga, riwayatPendidikan, riwayatJabatan, riwayatGajiPokok, riwayatPangkat, riwayatPenghargaan, riwayatSkp, riwayatHukumanDisiplin, riwayatPrestasiPendidikan, riwayatNarasumber, riwayatKegiatanStrategis, riwayatKeberhasilan] = await Promise.all([
      getPegawaiAlamat(id),
      getPegawaiPasangan(id),
      getPegawaiAnak(id),
      getPegawaiKeluarga(id),
      getPegawaiRiwayatPendidikan(id),
      getPegawaiRiwayatJabatan(id),
      getPegawaiRiwayatGajiPokok(id),
      getPegawaiRiwayatPangkat(id),
      getPegawaiRiwayatPenghargaan(id),
      getPegawaiRiwayatSkp(id),
      getPegawaiRiwayatHukumanDisiplin(id),
      getPegawaiRiwayatPrestasiPendidikan(id),
      getPegawaiRiwayatNarasumber(id),
      getPegawaiRiwayatKegiatanStrategis(id),
      getPegawaiRiwayatKeberhasilan(id)
    ]);
    const latestRiwayatPangkat = riwayatPangkat[0] || null;
    const alamatKtp = alamat.find((entry) => String(entry.tipe || "").toLowerCase() === "ktp");
    const alamatDomisili = alamat.find((entry) => String(entry.tipe || "").toLowerCase() === "domisili");

    return ok({
      ...item,
      nip: cleanNip(item.nip),
      wilayah: getPegawaiWilayah(item, ukpdList),
      pangkat_golongan: latestRiwayatPangkat?.pangkat_golongan || item.pangkat_golongan || null,
      tmt_pangkat_terakhir: latestRiwayatPangkat?.tmt_pangkat || latestRiwayatPangkat?.tanggal_sk || item.tmt_pangkat_terakhir || null,
      alamat: {
        domisili: alamatDomisili || null,
        ktp: alamatKtp || null
      },
      alamat_list: alamat,
      alamat_ktp: alamatKtp?.alamat_lengkap || null,
      alamat_domisili: alamatDomisili?.alamat_lengkap || null,
      pasangan,
      anak,
      keluarga,
      riwayat_pendidikan: riwayatPendidikan,
      riwayat_jabatan: riwayatJabatan,
      riwayat_gaji_pokok: riwayatGajiPokok,
      riwayat_pangkat: riwayatPangkat,
      riwayat_penghargaan: riwayatPenghargaan,
      riwayat_skp: riwayatSkp,
      riwayat_hukuman_disiplin: riwayatHukumanDisiplin,
      riwayat_prestasi_pendidikan: riwayatPrestasiPendidikan,
      riwayat_narasumber: riwayatNarasumber,
      riwayat_kegiatan_strategis: riwayatKegiatanStrategis,
      riwayat_keberhasilan: riwayatKeberhasilan
    });
  } catch (routeError) {
    return fail(routeError.message || "Terjadi kesalahan saat memuat detail pegawai.", 500);
  }
}

export async function PUT(request, { params }) {
  try {
    const { user, error } = await requireAuth([], request);
    if (error) return error;
    const { id } = await params;
    const ukpdList = await getUkpdData();
    const current = await findAllowedById(id, user, ukpdList);
    if (!current) return fail("Data pegawai tidak ditemukan atau tidak dapat diakses.", 404);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return fail("Validasi data pegawai gagal.", 422, parsed.error.flatten());
    const data = normalizePegawaiReferencePayload(parsed.data);
    const referenceValidation = await validatePegawaiReferenceFields(data);
    if (!referenceValidation.valid) {
      return fail("Validasi referensi pegawai gagal.", 422, referenceValidation.errors);
    }

    const updated = { ...current, ...data, id_pegawai: Number(id) };
    const allowed = filterPegawaiByRole([updated], user, ukpdList).length === 1;
    if (!allowed) return fail("Anda tidak boleh memindahkan pegawai ke UKPD atau wilayah lain.", 403);
    const saved = await updatePegawaiData(id, data);
    return ok(saved, "Pegawai berhasil diperbarui");
  } catch (routeError) {
    return fail(routeError.message || "Terjadi kesalahan saat memperbarui pegawai.", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, error } = await requireAuth([], request);
    if (error) return error;
    const { id } = await params;
    const ukpdList = await getUkpdData();
    const current = await findAllowedById(id, user, ukpdList);
    if (!current) return fail("Data pegawai tidak ditemukan atau tidak dapat diakses.", 404);
    return ok(await deletePegawaiData(id), "Pegawai berhasil dihapus");
  } catch (routeError) {
    return fail(routeError.message || "Terjadi kesalahan saat menghapus pegawai.", 500);
  }
}
