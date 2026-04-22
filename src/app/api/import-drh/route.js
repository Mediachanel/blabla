import { ROLES } from "@/lib/constants/roles";
import { requireAuth } from "@/lib/auth/requireAuth";
import { ok } from "@/lib/helpers/response";
import importSummary from "@/data/generated/import-summary.json";

export async function POST() {
  const { error } = await requireAuth([ROLES.SUPER_ADMIN]);
  if (error) return error;
  return ok({
    totalRows: importSummary.total_rows,
    successRows: importSummary.total_rows,
    failedRows: 0,
    totalUkpd: importSummary.total_ukpd,
    totalAlamat: importSummary.total_alamat,
    totalPasangan: importSummary.total_pasangan,
    totalAnak: importSummary.total_anak,
    mappedColumns: importSummary.headers,
    wilayahAnomalies: importSummary.wilayah_anomalies
  }, "Ringkasan import CSV master pegawai berhasil dibaca");
}
