import { filterPegawaiByRole } from "@/lib/auth/access";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getPegawaiData } from "@/lib/data/pegawaiStore";
import { ok } from "@/lib/helpers/response";

const CACHE_TTL_MS = 5 * 60 * 1000;
const responseCache = new Map();

function sortText(a, b) {
  return String(a || "").localeCompare(String(b || ""), "id");
}

function mapEmployee(item) {
  return {
    id_pegawai: item.id_pegawai,
    nama: item.nama || "-",
    nip: item.nip || "-",
    jenis_pegawai: item.jenis_pegawai || "Tidak Diketahui",
    nama_ukpd: item.nama_ukpd || "-",
    rumpun_jabatan: item.status_rumpun || "Tidak Diketahui",
    jabatan_kepmenpan_11: item.nama_jabatan_menpan || item.nama_jabatan_orb || "Tidak Diketahui"
  };
}

function createCount() {
  return {
    total: 0,
    pnsCpns: 0,
    pppk: 0,
    pppkParuhWaktu: 0,
    nonPns: 0,
    pjlp: 0
  };
}

function bumpCount(counter, jenisPegawai) {
  counter.total += 1;
  if (jenisPegawai === "PNS" || jenisPegawai === "CPNS") counter.pnsCpns += 1;
  if (jenisPegawai === "PPPK") counter.pppk += 1;
  if (jenisPegawai === "PPPK Paruh Waktu") counter.pppkParuhWaktu += 1;
  if (jenisPegawai === "NON PNS") counter.nonPns += 1;
  if (jenisPegawai === "PJLP") counter.pjlp += 1;
}

function buildRumpunTree(data) {
  const rootMap = new Map();
  for (const item of data) {
    const employee = mapEmployee(item);
    const group1 = employee.rumpun_jabatan;
    const group2 = employee.jabatan_kepmenpan_11;
    if (!rootMap.has(group1)) rootMap.set(group1, { count: createCount(), children: new Map() });
    const level1 = rootMap.get(group1);
    if (!level1.children.has(group2)) level1.children.set(group2, createCount());
    const level2Count = level1.children.get(group2);
    bumpCount(level1.count, employee.jenis_pegawai);
    bumpCount(level2Count, employee.jenis_pegawai);
  }

  return [...rootMap.entries()]
    .sort(([a], [b]) => sortText(a, b))
    .map(([label, value]) => ({
      label,
      total: value.count.total,
      counts: value.count,
      children: [...value.children.entries()]
        .sort(([a], [b]) => sortText(a, b))
        .map(([label2, count]) => ({
          label: label2,
          total: count.total,
          counts: count
        }))
    }));
}

function buildJabatanTree(data) {
  const rootMap = new Map();
  for (const item of data) {
    const employee = mapEmployee(item);
    const group1 = employee.jabatan_kepmenpan_11;
    const group2 = employee.nama_ukpd;
    if (!rootMap.has(group1)) rootMap.set(group1, { count: createCount(), children: new Map() });
    const level1 = rootMap.get(group1);
    if (!level1.children.has(group2)) level1.children.set(group2, createCount());
    const level2Count = level1.children.get(group2);
    bumpCount(level1.count, employee.jenis_pegawai);
    bumpCount(level2Count, employee.jenis_pegawai);
  }

  return [...rootMap.entries()]
    .sort(([a], [b]) => sortText(a, b))
    .map(([label, value]) => ({
      label,
      total: value.count.total,
      counts: value.count,
      children: [...value.children.entries()]
        .sort(([a], [b]) => sortText(a, b))
        .map(([label2, count]) => ({
          label: label2,
          total: count.total,
          counts: count
        }))
    }));
}

function buildUkpdTree(data) {
  const rootMap = new Map();
  for (const item of data) {
    const employee = mapEmployee(item);
    const group1 = employee.nama_ukpd || "Tidak Diketahui";
    const group2 = employee.rumpun_jabatan || "Tidak Diketahui";
    const group3 = employee.jabatan_kepmenpan_11 || "Tidak Diketahui";

    if (!rootMap.has(group1)) rootMap.set(group1, { count: createCount(), children: new Map() });
    const level1 = rootMap.get(group1);
    if (!level1.children.has(group2)) level1.children.set(group2, { count: createCount(), children: new Map() });
    const level2 = level1.children.get(group2);
    if (!level2.children.has(group3)) level2.children.set(group3, createCount());
    const level3Count = level2.children.get(group3);

    bumpCount(level1.count, employee.jenis_pegawai);
    bumpCount(level2.count, employee.jenis_pegawai);
    bumpCount(level3Count, employee.jenis_pegawai);
  }

  return [...rootMap.entries()]
    .sort(([a], [b]) => sortText(a, b))
    .map(([label, value]) => ({
      label,
      total: value.count.total,
      counts: value.count,
      children: [...value.children.entries()]
        .sort(([a], [b]) => sortText(a, b))
        .map(([label2, value2]) => ({
          label: label2,
          total: value2.count.total,
          counts: value2.count,
          children: [...value2.children.entries()]
            .sort(([a], [b]) => sortText(a, b))
            .map(([label3, count3]) => ({
              label: label3,
              total: count3.total,
              counts: count3
            }))
        }))
    }));
}

function getCached(cacheKey) {
  const entry = responseCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    responseCache.delete(cacheKey);
    return null;
  }
  return entry.data;
}

function setCached(cacheKey, data) {
  responseCache.set(cacheKey, { timestamp: Date.now(), data });
}

export async function GET(request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const modeParam = searchParams.get("mode");
  const mode = modeParam === "jabatan" ? "jabatan" : modeParam === "ukpd" ? "ukpd" : "rumpun";
  const q = (searchParams.get("q") || "").toLowerCase();
  const group1 = searchParams.get("group1") || "";
  const group2 = searchParams.get("group2") || "";
  const group3 = searchParams.get("group3") || "";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(50, Math.max(10, Number.parseInt(searchParams.get("pageSize") || "20", 10)));
  const cacheKey = `${user.role}|${user.wilayah || "-"}|${user.nama_ukpd || "-"}|${mode}|${q}|${group1}|${group2}|${group3}|${page}|${pageSize}`;
  const cached = getCached(cacheKey);
  if (cached) return ok(cached);

  const pegawaiMaster = await getPegawaiData();
  const scoped = filterPegawaiByRole(pegawaiMaster, user);
  const filtered = q
    ? scoped.filter((item) =>
      [
        item.nama,
        item.nip,
        item.nama_ukpd,
        item.status_rumpun,
        item.nama_jabatan_menpan,
        item.nama_jabatan_orb
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
    : scoped;

  if (group1 && group2 && (mode !== "ukpd" || group3)) {
    const employeesAll = filtered
      .filter((item) => {
        if (mode === "ukpd") {
          const ukpd = item.nama_ukpd || "Tidak Diketahui";
          const rumpun = item.status_rumpun || "Tidak Diketahui";
          const jabatan = item.nama_jabatan_menpan || item.nama_jabatan_orb || "Tidak Diketahui";
          return ukpd === group1 && rumpun === group2 && jabatan === group3;
        }
        if (mode === "jabatan") {
          const jabatan = item.nama_jabatan_menpan || item.nama_jabatan_orb || "Tidak Diketahui";
          const ukpd = item.nama_ukpd || "Tidak Diketahui";
          return jabatan === group1 && ukpd === group2;
        }
        const rumpun = item.status_rumpun || "Tidak Diketahui";
        const jabatan = item.nama_jabatan_menpan || item.nama_jabatan_orb || "Tidak Diketahui";
        return rumpun === group1 && jabatan === group2;
      })
      .map(mapEmployee)
      .sort((a, b) => sortText(a.nama, b.nama));
    const start = (page - 1) * pageSize;
    const employees = employeesAll.slice(start, start + pageSize);
    const data = { mode, group1, group2, group3, page, pageSize, total: employeesAll.length, employees };
    setCached(cacheKey, data);
    return ok(data);
  }

  const tree = mode === "jabatan" ? buildJabatanTree(filtered) : mode === "ukpd" ? buildUkpdTree(filtered) : buildRumpunTree(filtered);
  const data = { mode, total: filtered.length, tree };
  setCached(cacheKey, data);
  return ok(data);
}
