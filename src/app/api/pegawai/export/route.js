import { requireAuth } from "@/lib/auth/requireAuth";
import { getPegawaiExportData } from "@/lib/export/pegawaiExport";
import { buildPegawaiExportWorkbook } from "@/lib/import/pegawaiExcel";

export const runtime = "nodejs";

export async function GET(request) {
  const { user, error } = await requireAuth([], request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const rows = await getPegawaiExportData({
    user,
    q: searchParams.get("q") || "",
    status: searchParams.get("status") || "",
    wilayah: searchParams.get("wilayah") || "",
    ukpd: searchParams.get("ukpd") || ""
  });
  const buffer = await buildPegawaiExportWorkbook({ rows });
  const date = new Date().toISOString().slice(0, 10);

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="data-pegawai-${date}.xlsx"`,
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
