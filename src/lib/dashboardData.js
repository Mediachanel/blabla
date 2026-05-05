import { filterPegawaiByRole } from "@/lib/auth/access";
import { getPegawaiDashboardData, getUkpdData } from "@/lib/data/pegawaiStore";

export async function getScopedDashboardData(user) {
  const ukpdList = await getUkpdData();
  const pegawaiMaster = await getPegawaiDashboardData({ user, ukpdList });
  const data = filterPegawaiByRole(pegawaiMaster, user, ukpdList);
  return { data, ukpdList };
}
