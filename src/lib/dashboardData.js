import { filterPegawaiByRole } from "@/lib/auth/access";
import { getPegawaiDashboardData, getUkpdData } from "@/lib/data/pegawaiStore";

const DASHBOARD_DATA_CACHE_TTL = 60_000;

function getDashboardDataCache() {
  if (!globalThis.__sisdmkDashboardDataCache) {
    globalThis.__sisdmkDashboardDataCache = new Map();
  }
  return globalThis.__sisdmkDashboardDataCache;
}

function cacheKeyForUser(user) {
  return [user?.role || "", user?.wilayah || "", user?.nama_ukpd || "", user?.username || ""].join("|");
}

export async function getScopedDashboardData(user) {
  const cache = getDashboardDataCache();
  const cacheKey = cacheKeyForUser(user);
  const cached = cache.get(cacheKey);
  if (cached?.data && Date.now() - cached.createdAt < DASHBOARD_DATA_CACHE_TTL) {
    return cached.data;
  }
  if (cached?.promise) {
    return cached.promise;
  }

  const promise = Promise.all([
    getPegawaiDashboardData(),
    getUkpdData()
  ]).then(([pegawaiMaster, ukpdList]) => {
    const data = filterPegawaiByRole(pegawaiMaster, user, ukpdList);
    const payload = { data, ukpdList };
    cache.set(cacheKey, { createdAt: Date.now(), data: payload });
    return payload;
  }).catch((error) => {
    cache.delete(cacheKey);
    throw error;
  });

  cache.set(cacheKey, { createdAt: Date.now(), promise });
  return promise;
}
