import { getPegawaiWilayah } from "@/lib/auth/access";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getScopedDashboardData } from "@/lib/dashboardData";
import { fail, ok } from "@/lib/helpers/response";
import { JENIS_PEGAWAI_OPTIONS, normalizeJenisPegawai } from "@/lib/helpers/pegawaiStatus";
import { ROLES } from "@/lib/constants/roles";
import { PANGKAT_GOLONGAN_OPTIONS, normalizePangkatGolonganOption } from "@/lib/pegawaiReferenceOptions";

const DASHBOARD_CACHE_TTL = 60_000;
const DEFAULT_CHART_COLORS = ["#18a8e0", "#f97316", "#22c55e", "#facc15", "#8b5cf6", "#14b8a6", "#ef4444", "#64748b"];
const GENDER_CATEGORIES = [
  { key: "Laki-laki", label: "Laki-laki", color: "#0ea5e9" },
  { key: "Perempuan", label: "Perempuan", color: "#f59e0b" }
];
const EDUCATION_ORDER = ["SD", "SMP", "SMA/SMK", "D1", "D2", "D3", "D4", "S1", "Profesi", "S2", "Spesialis", "S3", "Tidak Diketahui"];
const ESELON_ORDER = ["Eselon I", "Eselon II", "Eselon III", "Eselon IV", "Non Eselon", "Tidak Diketahui"];
const AGE_RANGE_ORDER = ["<20", "20-24", "25-29", "30-34", "35-39", "40-44", "45-49", "50-54", "55-59", ">=60", "Tidak Diketahui"];
const PENSION_ASN_TYPES = new Set(["PNS", "CPNS", "PPPK", "PPPK Paruh Waktu"]);
const PENSION_RULE_CATEGORIES = [
  { key: "58", label: "BUP 58", color: "#38bdf8" },
  { key: "60", label: "BUP 60", color: "#facc15" },
  { key: "65", label: "BUP 65", color: "#22c55e" }
];
const MONTH_LOOKUP = {
  JAN: 1,
  JANUARY: 1,
  JANUARI: 1,
  FEB: 2,
  FEBRUARY: 2,
  FEBRUARI: 2,
  MAR: 3,
  MARCH: 3,
  MARET: 3,
  APR: 4,
  APRIL: 4,
  MAY: 5,
  MEI: 5,
  JUN: 6,
  JUNE: 6,
  JUNI: 6,
  JUL: 7,
  JULY: 7,
  JULI: 7,
  AUG: 8,
  AUGUST: 8,
  AGU: 8,
  AGUSTUS: 8,
  SEP: 9,
  SEPT: 9,
  SEPTEMBER: 9,
  OKT: 10,
  OCT: 10,
  OCTOBER: 10,
  OKTOBER: 10,
  NOV: 11,
  NOVEMBER: 11,
  DEC: 12,
  DESEMBER: 12,
  DECEMBER: 12
};

function getDashboardCache() {
  if (!globalThis.__sisdmkDashboardCache) {
    globalThis.__sisdmkDashboardCache = new Map();
  }
  return globalThis.__sisdmkDashboardCache;
}

function getDashboardCacheKey(user) {
  return [user?.role, user?.wilayah || "", user?.nama_ukpd || "", user?.username || ""].join("|");
}

const CHART_VIEW_CONFIGS = {
  statusPegawai: {
    label: "Status Pegawai",
    titleSuffix: "Status",
    field: "jenis_pegawai",
    categories: [
      { key: "PNS", label: "PNS", color: "#18a8e0" },
      { key: "CPNS", label: "CPNS", color: "#13a8be" },
      { key: "PPPK", label: "PPPK", color: "#22c55e" },
      { key: "NON PNS", label: "PROFESIONAL", color: "#14b8a6" },
      { key: "PJLP", label: "PJLP", color: "#10b981" },
      { key: "PPPK Paruh Waktu", label: "PPPK Paruh Waktu", color: "#8b5cf6" }
    ],
    normalize: normalizeJenisPegawai
  },
  jenisKelamin: {
    label: "Jenis Kelamin",
    titleSuffix: "Jenis Kelamin",
    field: "jenis_kelamin",
    categories: [
      { key: "Laki-laki", label: "Laki-laki", color: "#18a8e0" },
      { key: "Perempuan", label: "Perempuan", color: "#f97316" }
    ],
    normalize(value) {
      const text = String(value || "").trim().toLowerCase();
      if (text.includes("laki")) return "Laki-laki";
      if (text.includes("perempuan") || text === "p") return "Perempuan";
      return "";
    }
  },
  statusPernikahan: {
    label: "Status Pernikahan",
    titleSuffix: "Status Pernikahan",
    field: "status_perkawinan",
    categories: [
      { key: "Belum Menikah", label: "Belum Menikah", color: "#18a8e0" },
      { key: "Menikah", label: "Menikah", color: "#22c55e" },
      { key: "Cerai Hidup", label: "Cerai Hidup", color: "#f97316" },
      { key: "Cerai Mati", label: "Cerai Mati", color: "#ef4444" }
    ],
    normalize(value) {
      const text = String(value || "").trim().toUpperCase().replace(/\s+/g, " ");
      if (!text) return "";
      if (text.includes("BELUM")) return "Belum Menikah";
      if (text.includes("CERAI") && text.includes("MATI")) return "Cerai Mati";
      if (text.includes("CERAI")) return "Cerai Hidup";
      if (text.includes("MENIKAH") || text.includes("KAWIN")) return "Menikah";
      return "";
    }
  }
};

function createSeriesChart(labels, categories, counts) {
  return {
    labels,
    datasets: categories.map((category) => ({
      label: category.label,
      backgroundColor: category.color,
      data: labels.map((label) => counts.get(`${label}||${category.key}`) || 0)
    }))
  };
}

function buildGroupedChart(items, groupFn, config, sortByTotal = true) {
  const groupTotals = new Map();
  const counts = new Map();

  for (const item of items) {
    const group = groupFn(item) || "Tidak Diketahui";
    const category = config.normalize(item[config.field]);
    if (!category || !config.categories.some((option) => option.key === category)) continue;
    groupTotals.set(group, (groupTotals.get(group) || 0) + 1);
    counts.set(`${group}||${category}`, (counts.get(`${group}||${category}`) || 0) + 1);
  }

  const labels = [...groupTotals.entries()]
    .sort((a, b) => (sortByTotal ? b[1] - a[1] : 0) || a[0].localeCompare(b[0]))
    .map(([label]) => label);

  return createSeriesChart(labels, config.categories, counts);
}

function buildDistributionChart(items, config) {
  const counts = new Map(config.categories.map((category) => [category.key, 0]));
  for (const item of items) {
    const category = config.normalize(item[config.field]);
    if (counts.has(category)) counts.set(category, counts.get(category) + 1);
  }

  return {
    labels: config.categories.map((category) => category.label),
    values: config.categories.map((category) => counts.get(category.key) || 0),
    colors: config.categories.map((category) => category.color)
  };
}

function buildChartViews(items) {
  return Object.fromEntries(Object.entries(CHART_VIEW_CONFIGS).map(([key, config]) => [
    key,
    {
      label: config.label,
      titles: {
        distribution: `Distribusi Pegawai per ${config.titleSuffix} (Aktif)`,
        ukpd: `Distribusi Pegawai per UKPD (${config.titleSuffix})`,
        pendidikan: `Distribusi Pegawai per Jenjang Pendidikan (${config.titleSuffix})`,
        rumpun: `Rumpun A - ${config.titleSuffix} Pegawai`
      },
      distribution: buildDistributionChart(items, config),
      ukpd: buildGroupedChart(items, (item) => item.nama_ukpd, config),
      pendidikan: buildGroupedChart(items, (item) => item.jenjang_pendidikan, config),
      rumpun: buildGroupedChart(items, (item) => item.status_rumpun, config)
    }
  ]));
}

function sortByCount(rows) {
  return rows.sort((a, b) => b.jumlah - a.jumlah || String(a.label || a.nama_ukpd).localeCompare(String(b.label || b.nama_ukpd)));
}

function parseLooseDate(value) {
  if (value && typeof value === "object" && "getTime" in value) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value || "").trim();
  if (!raw || raw === "0" || raw.includes("#")) return null;
  const cleaned = raw.replace(/^'+/, "").replace(/\s+/g, " ").trim();

  const isoMatch = cleaned.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    return createValidDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const numericMatch = cleaned.replace(/\s+/g, "").match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (numericMatch) {
    return createValidDate(normalizeYear(Number(numericMatch[3])), Number(numericMatch[2]), Number(numericMatch[1]));
  }

  const monthTextMatch = cleaned.match(/^(\d{1,2})[-\s/]([A-Za-z.]+)[-\s/](\d{2,4})$/);
  if (monthTextMatch) {
    const monthKey = monthTextMatch[2].replace(/\./g, "").toUpperCase();
    const month = MONTH_LOOKUP[monthKey];
    if (month) return createValidDate(normalizeYear(Number(monthTextMatch[3])), month, Number(monthTextMatch[1]));
  }

  return null;
}

function normalizeYear(year) {
  if (year >= 100) return year;
  return year <= 30 ? 2000 + year : 1900 + year;
}

function createValidDate(year, month, day) {
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) return null;

  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function getYearsOfService(date) {
  if (!date) return null;
  const today = new Date();
  let years = today.getFullYear() - date.getFullYear();
  const beforeAnniversary = (today.getMonth() < date.getMonth())
    || (today.getMonth() === date.getMonth() && today.getDate() < date.getDate());
  if (beforeAnniversary) years -= 1;
  return Math.max(0, years);
}

function getMasaKerjaRange(years) {
  if (years === null || years === undefined) return "Tidak Diketahui";
  if (years >= 30) return "30+ tahun";
  return `${years}-${years + 1} tahun`;
}

function normalizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeGender(value) {
  const text = normalizeText(value).toLowerCase();
  if (text.includes("laki")) return "Laki-laki";
  if (text.includes("perempuan") || text === "p") return "Perempuan";
  return "Tidak Diketahui";
}

function addCount(map, key, amount = 1) {
  map.set(key, (map.get(key) || 0) + amount);
}

function sortLabels(labels, preferredOrder = []) {
  const order = new Map(preferredOrder.map((label, index) => [label, index]));
  return [...labels].sort((a, b) => {
    const aUnknown = a === "Tidak Diketahui";
    const bUnknown = b === "Tidak Diketahui";
    if (aUnknown !== bUnknown) return aUnknown ? 1 : -1;
    const orderA = order.has(a) ? order.get(a) : Number.MAX_SAFE_INTEGER;
    const orderB = order.has(b) ? order.get(b) : Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return String(a).localeCompare(String(b), "id");
  });
}

function chartColorsFor(labels) {
  return labels.map((_, index) => DEFAULT_CHART_COLORS[index % DEFAULT_CHART_COLORS.length]);
}

function buildValueChart(items, labelFn, preferredOrder = []) {
  const counts = new Map();
  for (const item of items) {
    const label = labelFn(item) || "Tidak Diketahui";
    addCount(counts, label);
  }
  const labels = sortLabels([...counts.keys()], preferredOrder);
  return {
    labels,
    values: labels.map((label) => counts.get(label) || 0),
    colors: chartColorsFor(labels)
  };
}

function createTotalLineDataset(data) {
  return {
    type: "line",
    label: "Total",
    data,
    borderColor: "#38bdf8",
    backgroundColor: "rgba(56, 189, 248, 0.16)",
    pointBackgroundColor: "#38bdf8",
    pointBorderColor: "#ffffff",
    pointBorderWidth: 2,
    pointRadius: 4,
    pointHoverRadius: 5,
    borderWidth: 2,
    tension: 0.35,
    fill: false,
    order: 0,
    summary: false
  };
}

function buildGenderGroupedChart(items, labelFn, preferredOrder = []) {
  const labelsSet = new Set();
  const counts = new Map();

  for (const item of items) {
    const label = labelFn(item) || "Tidak Diketahui";
    const gender = normalizeGender(item.jenis_kelamin);
    if (!GENDER_CATEGORIES.some((category) => category.key === gender)) continue;
    labelsSet.add(label);
    addCount(counts, `${label}||${gender}`);
  }

  const labels = sortLabels([...labelsSet], preferredOrder);
  const barDatasets = GENDER_CATEGORIES.map((category) => ({
    label: category.label,
    backgroundColor: category.color,
    data: labels.map((label) => counts.get(`${label}||${category.key}`) || 0)
  }));

  return {
    labels,
    datasets: [
      ...barDatasets,
      createTotalLineDataset(labels.map((_, index) => barDatasets.reduce((sum, dataset) => sum + Number(dataset.data[index] || 0), 0)))
    ]
  };
}

function getPangkatLabel(item) {
  return normalizePangkatGolonganOption(item.pangkat_golongan) || "Tidak Diketahui";
}

function getEselonLabel(item) {
  const text = normalizeText(item.eselon).toUpperCase();
  if (text.includes("NON")) return "Non Eselon";
  const romanMatch = text.match(/\b(IV|III|II|I)\b/);
  if (romanMatch) return `Eselon ${romanMatch[1]}`;
  if (/\b4\b/.test(text)) return "Eselon IV";
  if (/\b3\b/.test(text)) return "Eselon III";
  if (/\b2\b/.test(text)) return "Eselon II";
  if (/\b1\b/.test(text)) return "Eselon I";

  const rumpun = normalizeText(item.status_rumpun).toUpperCase();
  if (rumpun.includes("PIMPINAN TINGGI") || rumpun.includes("TINGGI PRATAMA")) return "Eselon II";
  if (rumpun.includes("ADMINISTRATOR")) return "Eselon III";
  if (rumpun.includes("PENGAWAS")) return "Eselon IV";
  return "Non Eselon";
}

function getAge(date, reference = new Date()) {
  if (!date) return null;
  let age = reference.getFullYear() - date.getFullYear();
  const beforeBirthday = reference.getMonth() < date.getMonth()
    || (reference.getMonth() === date.getMonth() && reference.getDate() < date.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 100 ? age : null;
}

function getAgeRange(item) {
  const age = getAge(parseLooseDate(item.tanggal_lahir));
  if (age === null || age === undefined) return "Tidak Diketahui";
  if (age < 20) return "<20";
  if (age >= 60) return ">=60";
  const start = Math.floor(age / 5) * 5;
  return `${start}-${start + 4}`;
}

function isPensionProjectionEmployee(item) {
  return PENSION_ASN_TYPES.has(normalizeJenisPegawai(item.jenis_pegawai));
}

function getPensionTargetAge(item) {
  const jabatan = normalizeText(item.nama_jabatan_menpan || item.nama_jabatan_orb).toUpperCase();
  const rumpun = normalizeText(item.status_rumpun).toUpperCase();

  if (jabatan.includes("AHLI UTAMA")) return 65;
  if (rumpun.includes("PIMPINAN TINGGI PRATAMA") || rumpun.includes("JABATAN TINGGI PRATAMA")) return 60;
  if (jabatan.includes("AHLI MADYA")) return 60;
  return 58;
}

function buildPensionProjection(items) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, index) => String(currentYear + index));
  const yearSet = new Set(years);
  const ruleCounts = new Map();
  const genderCounts = new Map();
  const projectedByRule = new Map(PENSION_RULE_CATEGORIES.map((category) => [category.key, 0]));
  let eligibleTotal = 0;
  let invalidBirthDate = 0;
  let projectedTotal = 0;

  for (const item of items) {
    if (!isPensionProjectionEmployee(item)) continue;
    eligibleTotal += 1;

    const birthDate = parseLooseDate(item.tanggal_lahir);
    if (!birthDate) {
      invalidBirthDate += 1;
      continue;
    }

    const targetAge = getPensionTargetAge(item);
    const pensionYear = String(birthDate.getFullYear() + targetAge);
    if (!yearSet.has(pensionYear)) continue;

    const ruleKey = String(targetAge);
    const gender = normalizeGender(item.jenis_kelamin);
    addCount(ruleCounts, `${pensionYear}||${ruleKey}`);
    if (GENDER_CATEGORIES.some((category) => category.key === gender)) {
      addCount(genderCounts, `${pensionYear}||${gender}`);
    }
    addCount(projectedByRule, ruleKey);
    projectedTotal += 1;
  }

  return {
    eligibleTotal,
    invalidBirthDate,
    projectedTotal,
    yearRange: `${years[0]}-${years[years.length - 1]}`,
    byRule: {
      labels: years,
      datasets: [
        ...PENSION_RULE_CATEGORIES.map((category) => ({
        label: category.label,
        backgroundColor: category.color,
        data: years.map((year) => ruleCounts.get(`${year}||${category.key}`) || 0)
        })),
        createTotalLineDataset(years.map((year) => PENSION_RULE_CATEGORIES.reduce((sum, category) => sum + Number(ruleCounts.get(`${year}||${category.key}`) || 0), 0)))
      ]
    },
    byGender: {
      labels: years,
      datasets: [
        ...GENDER_CATEGORIES.map((category) => ({
          label: category.label,
          backgroundColor: category.color,
          data: years.map((year) => genderCounts.get(`${year}||${category.key}`) || 0)
        })),
        createTotalLineDataset(years.map((year) => GENDER_CATEGORIES.reduce((sum, category) => sum + Number(genderCounts.get(`${year}||${category.key}`) || 0), 0)))
      ]
    },
    statCards: [
      { label: "ASN Diproyeksikan", value: projectedTotal, helper: years.join(", ") },
      { label: "BUP 60", value: projectedByRule.get("60") || 0, helper: "JPT Pratama dan Ahli Madya" },
      { label: "BUP 65", value: projectedByRule.get("65") || 0, helper: "Ahli Utama" },
      { label: "Tanggal Lahir Kosong", value: invalidBirthDate, helper: `${eligibleTotal} ASN dicek` }
    ]
  };
}

function buildDashboardMenus(items, summary, options = {}) {
  const pensionProjection = buildPensionProjection(items);
  const dashboardCharts = [
    {
      id: "status-pegawai",
      title: "Berdasarkan Status Pegawai",
      type: "doughnut",
      heightClass: "h-80",
      ...buildDistributionChart(items, CHART_VIEW_CONFIGS.statusPegawai)
    },
    {
      id: "jenis-kelamin",
      title: "Berdasarkan Jenis Kelamin",
      type: "doughnut",
      heightClass: "h-80",
      ...buildDistributionChart(items, CHART_VIEW_CONFIGS.jenisKelamin)
    }
  ];

  if (options.includeUkpdStatusChart) {
    dashboardCharts.push({
      id: "ukpd-status",
      title: "Status Pegawai per UKPD",
      horizontal: true,
      stacked: true,
      fullWidth: true,
      heightClass: "h-[420px] lg:h-[520px]",
      ...buildGroupedChart(items, (item) => item.nama_ukpd, CHART_VIEW_CONFIGS.statusPegawai)
    });
  }

  return {
    dashboard: {
      label: "Dashboard",
      title: "Data Pegawai Aktif",
      subtitle: "Ringkasan status pegawai, jenis kelamin, dan sebaran UKPD.",
      charts: dashboardCharts,
      statCards: [
        { label: "Total Pegawai", value: summary.total, helper: "Seluruh data sesuai akses" },
        { label: "PNS/CPNS", value: summary.pnsCpns, helper: "Pegawai ASN" },
        { label: "PPPK", value: summary.pppk + summary.pppkParuhWaktu, helper: "Penuh dan paruh waktu" },
        { label: "Non ASN", value: summary.nonPns + summary.pjlp, helper: "NON PNS dan PJLP" }
      ]
    },
    pangkat: {
      label: "Berdasarkan Pangkat",
      title: "Data Pegawai Berdasarkan Pangkat/Golongan",
      subtitle: "Menggunakan pangkat/golongan terakhir pada data pegawai.",
      charts: [
        {
          id: "pangkat-gender",
          title: "Pangkat/Golongan per Jenis Kelamin",
          heightClass: "h-96",
          ...buildGenderGroupedChart(items, getPangkatLabel, [...PANGKAT_GOLONGAN_OPTIONS, "Tidak Diketahui"])
        },
        {
          id: "pangkat-total",
          title: "Total Pegawai per Pangkat/Golongan",
          heightClass: "h-96",
          ...buildValueChart(items, getPangkatLabel, [...PANGKAT_GOLONGAN_OPTIONS, "Tidak Diketahui"])
        }
      ]
    },
    eselon: {
      label: "Berdasarkan Eselon",
      title: "Data Pegawai Berdasarkan Eselon",
      subtitle: "Eselon diambil dari riwayat jabatan terakhir bila tersedia.",
      charts: [
        {
          id: "eselon-gender",
          title: "Eselon per Jenis Kelamin",
          heightClass: "h-80",
          ...buildGenderGroupedChart(items, getEselonLabel, ESELON_ORDER)
        },
        {
          id: "eselon-total",
          title: "Total Pegawai per Eselon",
          heightClass: "h-80",
          ...buildValueChart(items, getEselonLabel, ESELON_ORDER)
        }
      ]
    },
    umur: {
      label: "Berdasarkan Umur",
      title: "Data Pegawai Berdasarkan Kelompok Umur",
      subtitle: "Umur dihitung dari tanggal lahir pegawai.",
      charts: [
        {
          id: "umur-gender",
          title: "Kelompok Umur per Jenis Kelamin",
          heightClass: "h-80",
          ...buildGenderGroupedChart(items, getAgeRange, AGE_RANGE_ORDER)
        },
        {
          id: "umur-total",
          title: "Total Pegawai per Kelompok Umur",
          heightClass: "h-80",
          ...buildValueChart(items, getAgeRange, AGE_RANGE_ORDER)
        }
      ]
    },
    pendidikan: {
      label: "Berdasarkan Pendidikan",
      title: "Data Pegawai Berdasarkan Jenjang Pendidikan",
      subtitle: "Menggunakan jenjang pendidikan terakhir yang sudah dinormalisasi.",
      charts: [
        {
          id: "pendidikan-gender",
          title: "Jenjang Pendidikan per Jenis Kelamin",
          heightClass: "h-80",
          ...buildGenderGroupedChart(items, (item) => item.jenjang_pendidikan || "Tidak Diketahui", EDUCATION_ORDER)
        },
        {
          id: "pendidikan-total",
          title: "Total Pegawai per Jenjang Pendidikan",
          heightClass: "h-80",
          ...buildValueChart(items, (item) => item.jenjang_pendidikan || "Tidak Diketahui", EDUCATION_ORDER)
        }
      ]
    },
    pensiun: {
      label: "Berdasarkan Pensiun",
      title: "Data ASN Berdasarkan Perkiraan Pensiun",
      subtitle: `Proyeksi ${pensionProjection.yearRange}; BUP umum 58, JPT Pratama/Ahli Madya 60, Ahli Utama 65.`,
      statCards: pensionProjection.statCards,
      charts: [
        {
          id: "pensiun-rule",
          title: "Proyeksi Pensiun 5 Tahun per BUP",
          heightClass: "h-80",
          ...pensionProjection.byRule
        },
        {
          id: "pensiun-gender",
          title: "Proyeksi Pensiun 5 Tahun per Jenis Kelamin",
          heightClass: "h-80",
          ...pensionProjection.byGender
        }
      ]
    }
  };
}

function buildDashboardMenuStatusVariants(items, menuOptions = {}) {
  const totalSummary = buildSummary(items);
  const variants = {
    total: buildDashboardMenus(items, totalSummary, menuOptions)
  };

  const statusOptions = [
    { value: "total", label: "Total Pegawai", total: totalSummary.total }
  ];

  for (const status of JENIS_PEGAWAI_OPTIONS) {
    const filtered = items.filter((item) => normalizeJenisPegawai(item.jenis_pegawai) === status);
    const summary = buildSummary(filtered);
    variants[status] = buildDashboardMenus(filtered, summary, menuOptions);
    statusOptions.push({ value: status, label: status, total: summary.total });
  }

  return { variants, options: statusOptions };
}

function buildDashboardAnalytics(data, ukpdList) {
  const ukpdMap = new Map();
  const rumpunMap = new Map();
  const jabatanMenpanMap = new Map();
  const pendidikanJurusanMap = new Map();
  const masaKerjaMap = new Map();
  const officialUkpdById = new Map(ukpdList.map((ukpd) => [Number(ukpd.id_ukpd), ukpd]));
  const officialUkpdByName = new Map(ukpdList.map((ukpd) => [ukpd.nama_ukpd, ukpd]));

  for (const item of data) {
    const jenisPegawai = normalizeJenisPegawai(item.jenis_pegawai);
    const officialUkpd = officialUkpdById.get(Number(item.id_ukpd)) || officialUkpdByName.get(item.nama_ukpd);
    const ukpdKey = officialUkpd?.id_ukpd || item.id_ukpd || item.nama_ukpd || "Tidak Diketahui";
    const namaUkpd = officialUkpd?.nama_ukpd || item.nama_ukpd || "Tidak Diketahui";
    const wilayah = officialUkpd?.wilayah || getPegawaiWilayah(item, ukpdList);

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

    const pendidikanJurusan = [item.jenjang_pendidikan || "Tidak Diketahui", item.program_studi || "Tidak Diketahui"]
      .filter(Boolean)
      .join(" - ");
    const pendidikanJurusanKey = `${jenisPegawai}||${pendidikanJurusan}`;
    pendidikanJurusanMap.set(pendidikanJurusanKey, {
      jenis_pegawai: jenisPegawai,
      pendidikan_jurusan: pendidikanJurusan,
      jumlah: (pendidikanJurusanMap.get(pendidikanJurusanKey)?.jumlah || 0) + 1
    });

    const masaKerjaTahun = getYearsOfService(parseLooseDate(item.tmt_kerja_ukpd));
    const masaKerjaRange = getMasaKerjaRange(masaKerjaTahun);
    const masaKerjaKey = `${jenisPegawai}||${masaKerjaRange}`;
    masaKerjaMap.set(masaKerjaKey, {
      jenis_pegawai: jenisPegawai,
      masa_kerja_rentang: masaKerjaRange,
      jumlah: (masaKerjaMap.get(masaKerjaKey)?.jumlah || 0) + 1
    });
  }

  return {
    jenisPegawaiOptions: JENIS_PEGAWAI_OPTIONS,
    ukpdSummary: [...ukpdMap.values()].sort((a, b) => b.total - a.total || a.nama_ukpd.localeCompare(b.nama_ukpd)),
    rumpunByJenisPegawai: sortByCount([...rumpunMap.values()].map((row) => ({ ...row, label: row.rumpun_jabatan }))),
    jabatanMenpanByJenisPegawai: sortByCount([...jabatanMenpanMap.values()].map((row) => ({ ...row, label: row.jabatan_kepmenpan_11 }))),
    pendidikanJurusanByJenisPegawai: sortByCount([...pendidikanJurusanMap.values()].map((row) => ({ ...row, label: row.pendidikan_jurusan }))),
    masaKerjaByJenisPegawai: sortByCount([...masaKerjaMap.values()].map((row) => ({ ...row, label: row.masa_kerja_rentang })))
  };
}

function buildSummary(data) {
  return data.reduce((summary, item) => {
    const jenisPegawai = normalizeJenisPegawai(item.jenis_pegawai);
    summary.total += 1;
    if (jenisPegawai === "PNS" || jenisPegawai === "CPNS") summary.pnsCpns += 1;
    if (jenisPegawai === "PPPK") summary.pppk += 1;
    if (jenisPegawai === "PPPK Paruh Waktu") summary.pppkParuhWaktu += 1;
    if (jenisPegawai === "NON PNS") summary.nonPns += 1;
    if (jenisPegawai === "PJLP") summary.pjlp += 1;
    return summary;
  }, {
    total: 0,
    pnsCpns: 0,
    pppk: 0,
    pppkParuhWaktu: 0,
    nonPns: 0,
    pjlp: 0
  });
}

export async function GET() {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const cache = getDashboardCache();
    const cacheKey = getDashboardCacheKey(user);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.createdAt < DASHBOARD_CACHE_TTL) {
      return ok(cached.data);
    }

    const { data, ukpdList } = await getScopedDashboardData(user);
    const summary = buildSummary(data);
    const activeData = data.filter((item) => String(item.kondisi || "").toUpperCase() === "AKTIF");
    const chartItems = activeData.length ? activeData : data;
    const dashboardMenuStatus = buildDashboardMenuStatusVariants(chartItems, {
      includeUkpdStatusChart: [ROLES.SUPER_ADMIN, ROLES.ADMIN_WILAYAH].includes(user.role)
    });

    const payload = {
      user,
      summary,
      chartViews: buildChartViews(chartItems),
      dashboardMenus: dashboardMenuStatus.variants.total,
      dashboardMenusByStatus: dashboardMenuStatus.variants,
      dashboardMenuStatusOptions: dashboardMenuStatus.options,
      latestEmployees: data.slice(0, 5),
      analytics: buildDashboardAnalytics(data, ukpdList),
      usulanSummary: {
        mutasi: 0,
        putusJf: 0
      }
    };

    cache.set(cacheKey, { createdAt: Date.now(), data: payload });
    return ok(payload);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return fail(`Dashboard gagal dimuat: ${error.message || "Terjadi kesalahan server."}`, 500);
  }
}
