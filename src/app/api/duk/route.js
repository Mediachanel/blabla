import { filterPegawaiByRole } from "@/lib/auth/access";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getPegawaiData } from "@/lib/data/pegawaiStore";
import { ok } from "@/lib/helpers/response";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;
  const pegawaiMaster = await getPegawaiData();
  const pns = filterPegawaiByRole(pegawaiMaster, user)
    .filter((item) => item.jenis_pegawai === "PNS")
    .sort((a, b) => String(b.pangkat_golongan).localeCompare(String(a.pangkat_golongan)));
  return ok(pns);
}
