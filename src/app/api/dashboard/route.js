import { usulanMutasi, usulanPutusJf } from "@/data/mock";
import { filterPegawaiByRole, getPegawaiWilayah } from "@/lib/auth/access";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getPegawaiData, getUkpdData } from "@/lib/data/pegawaiStore";
import { ok } from "@/lib/helpers/response";
import { JENIS_PEGAWAI_OPTIONS, isJenisPegawai, normalizeJenisPegawai } from "@/lib/helpers/pegawaiStatus";

function countBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item) || "-";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function toChart(obj) {
  return { labels: Object.keys(obj), values: Object.values(obj) };
}

function sortByCount(rows) {
  return rows.sort((a, b) => b.jumlah - a.jumlah || String(a.label || a.nama_ukpd).localeCompare(String(b.label || b.nama_ukpd)));
}

function buildDashboardAnalytics(data, ukpdList) {
  const ukpdMap = new Map();
  const rumpunMap = new Map();
  const jabatanMenpanMap = new Map();
  const officialUkpdById = new Map(ukpdList.map((ukpd) => [Number(ukpd.id_ukpd), ukpd]));
  const officialUkpdByName = new Map(ukpdList.map((ukpd) => [ukpd.nama_ukpd, ukpd]));

  for (const item of data) {
    const jenisPegawai = normalizeJenisPegawai(item.jenis_pegawai);
    const officialUkpd = officialUkpdById.get(Number(item.id_ukpd)) || officialUkpdByName.get(item.nama_ukpd);
    const ukpdKey = officialUkpd?.id_ukpd || item.id_ukpd || item.nama_ukpd || "Tidak Diketahui";
    const namaUkpd = officialUkpd?.nama_ukpd || item.nama_ukpd || "Tidak Diketahui";
    const wilayah = officialUkpd?.wilayah || getPegawaiWilayah(item);

    if (!ukpdMap.has(ukpdKey)) {
      ukpdMap.set(ukpdKey, {
        id_ukpd: officialUkpd?.id_ukpd || item.id_ukpd,
        nama_ukpd: namaUkpd,
        wilayah,
        jenis_ukpd: officialUkpd?.jenis_ukpd || item.jenis_ukpd || "-",
        total: 0,
        byJenisPegawai: Object.fromEntries(JENIS_PEGAWAI_OPTIONS.map((option) => [option, 0]))
      });
    }
    const ukpd = ukpdMap.get(ukpdKey);
    ukpd.total += 1;
    ukpd.byJenisPegawai[jenisPegawai] = (ukpd.byJenisPegawai[jenisPegawai] || 0) + 1;

    const rumpun = item.status_rumpun || "Tidak Diketahui";
    const rumpunKey = `${jenisPegawai}||${rumpun}`;
    rumpunMap.set(rumpunKey, {
      jenis_pegawai: jenisPegawai,
      rumpun_jabatan: rumpun,
      jumlah: (rumpunMap.get(rumpunKey)?.jumlah || 0) + 1
    });

    const jabatan = item.nama_jabatan_menpan || "Tidak Diketahui";
    const jabatanKey = `${jenisPegawai}||${jabatan}`;
    jabatanMenpanMap.set(jabatanKey, {
      jenis_pegawai: jenisPegawai,
      jabatan_kepmenpan_11: jabatan,
      jumlah: (jabatanMenpanMap.get(jabatanKey)?.jumlah || 0) + 1
    });
  }

  return {
    jenisPegawaiOptions: JENIS_PEGAWAI_OPTIONS,
    ukpdSummary: [...ukpdMap.values()].sort((a, b) => b.total - a.total || a.nama_ukpd.localeCompare(b.nama_ukpd)),
    rumpunByJenisPegawai: sortByCount([...rumpunMap.values()].map((row) => ({ ...row, label: row.rumpun_jabatan }))),
    jabatanMenpanByJenisPegawai: sortByCount([...jabatanMenpanMap.values()].map((row) => ({ ...row, label: row.jabatan_kepmenpan_11 })))
  };
}

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const [pegawaiMaster, ukpdList] = await Promise.all([getPegawaiData(), getUkpdData()]);
  const data = filterPegawaiByRole(pegawaiMaster, user);
  const summary = {
    total: data.length,
    pnsCpns: data.filter((item) => ["PNS", "CPNS"].includes(normalizeJenisPegawai(item.jenis_pegawai))).length,
    pppk: data.filter((item) => isJenisPegawai(item, "PPPK")).length,
    pppkParuhWaktu: data.filter((item) => isJenisPegawai(item, "PPPK Paruh Waktu")).length,
    nonPns: data.filter((item) => isJenisPegawai(item, "NON PNS")).length,
    pjlp: data.filter((item) => isJenisPegawai(item, "PJLP")).length
  };

  const visibleUkpd = [...new Set(data.map((item) => item.nama_ukpd))];
  const wilayahUkpd = ukpdList.filter((item) => visibleUkpd.includes(item.nama_ukpd));

  return ok({
    user,
    summary,
    charts: {
      gender: toChart(countBy(data, (item) => item.jenis_kelamin)),
      pendidikan: toChart(countBy(data, (item) => item.jenjang_pendidikan)),
      rumpun: toChart(countBy(data, (item) => item.status_rumpun)),
      wilayah: toChart(countBy(data, getPegawaiWilayah)),
      ukpd: toChart(countBy(data, (item) => item.nama_ukpd))
    },
    latestEmployees: data.slice(0, 5),
    visibleUkpd: wilayahUkpd,
    analytics: buildDashboardAnalytics(data, ukpdList),
    usulanSummary: {
      mutasi: usulanMutasi.length,
      putusJf: usulanPutusJf.length
    }
  });
}
