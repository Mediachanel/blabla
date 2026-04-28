import { ROLES } from "@/lib/constants/roles";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getUkpdData } from "@/lib/data/pegawaiStore";
import { buildPegawaiImportTemplate } from "@/lib/import/pegawaiExcel";

export const runtime = "nodejs";

export async function GET() {
  const { error } = await requireAuth([ROLES.SUPER_ADMIN]);
  if (error) return error;

  const ukpdRows = await getUkpdData();
  const buffer = await buildPegawaiImportTemplate({ ukpdRows });
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-import-pegawai.xlsx"',
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
