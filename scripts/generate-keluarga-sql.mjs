import fs from "node:fs";
import path from "node:path";

const generatedDir = path.resolve("src/data/generated");
const outputPath = path.resolve("sql/import_keluarga_generated.sql");

const pasanganPath = path.join(generatedDir, "pasangan.json");
const anakPath = path.join(generatedDir, "anak.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeText(value) {
  const text = String(value ?? "").replace(/\u0000/g, "").trim();
  return text || null;
}

function normalizeDate(value) {
  const text = normalizeText(value);
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const dmy = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, "0");
    const month = dmy[2].padStart(2, "0");
    return `${dmy[3]}-${month}-${day}`;
  }
  return text;
}

function sqlValue(value) {
  if (value === null || value === undefined || value === "") return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  const text = String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "''")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
  return `'${text}'`;
}

const pasangan = readJson(pasanganPath);
const anak = readJson(anakPath);

const keluarga = [
  ...pasangan.map((item) => ({
    id_pegawai: Number(item.id_pegawai),
    hubungan: "pasangan",
    status_punya: normalizeText(item.status_punya),
    urutan: null,
    nama: normalizeText(item.nama),
    jenis_kelamin: null,
    tempat_lahir: null,
    tanggal_lahir: null,
    no_tlp: normalizeText(item.no_tlp),
    email: normalizeText(item.email),
    pekerjaan: normalizeText(item.pekerjaan),
    sumber_tabel: "pasangan",
    sumber_id: Number(item.id),
    created_at: normalizeDate(item.created_at)
  })),
  ...anak.map((item) => ({
    id_pegawai: Number(item.id_pegawai),
    hubungan: "anak",
    status_punya: null,
    urutan: Number(item.urutan),
    nama: normalizeText(item.nama),
    jenis_kelamin: normalizeText(item.jenis_kelamin),
    tempat_lahir: normalizeText(item.tempat_lahir),
    tanggal_lahir: normalizeDate(item.tanggal_lahir),
    no_tlp: null,
    email: null,
    pekerjaan: normalizeText(item.pekerjaan),
    sumber_tabel: "anak",
    sumber_id: Number(item.id),
    created_at: normalizeDate(item.created_at)
  }))
].sort((a, b) => {
  if (a.id_pegawai !== b.id_pegawai) return a.id_pegawai - b.id_pegawai;
  if (a.hubungan !== b.hubungan) return a.hubungan.localeCompare(b.hubungan);
  return (a.urutan || 0) - (b.urutan || 0);
});

const lines = [
  "-- Import data keluarga gabungan dari src/data/generated/pasangan.json dan anak.json",
  "-- Jalankan setelah tabel `keluarga` dibuat. Aman dijalankan berulang.",
  "SET NAMES utf8mb4;",
  "USE `si_data`;",
  "",
  "INSERT INTO `keluarga` (`id_pegawai`, `hubungan`, `status_punya`, `urutan`, `nama`, `jenis_kelamin`, `tempat_lahir`, `tanggal_lahir`, `no_tlp`, `email`, `pekerjaan`, `sumber_tabel`, `sumber_id`, `created_at`) VALUES"
];

keluarga.forEach((item, index) => {
  const row = [
    item.id_pegawai,
    item.hubungan,
    item.status_punya,
    item.urutan,
    item.nama,
    item.jenis_kelamin,
    item.tempat_lahir,
    item.tanggal_lahir,
    item.no_tlp,
    item.email,
    item.pekerjaan,
    item.sumber_tabel,
    item.sumber_id,
    item.created_at
  ];
  lines.push(`(${row.map(sqlValue).join(", ")})${index === keluarga.length - 1 ? "" : ","}`);
});

lines.push(
  "",
  "ON DUPLICATE KEY UPDATE",
  "  `id_pegawai` = VALUES(`id_pegawai`),",
  "  `hubungan` = VALUES(`hubungan`),",
  "  `status_punya` = VALUES(`status_punya`),",
  "  `urutan` = VALUES(`urutan`),",
  "  `nama` = VALUES(`nama`),",
  "  `jenis_kelamin` = VALUES(`jenis_kelamin`),",
  "  `tempat_lahir` = VALUES(`tempat_lahir`),",
  "  `tanggal_lahir` = VALUES(`tanggal_lahir`),",
  "  `no_tlp` = VALUES(`no_tlp`),",
  "  `email` = VALUES(`email`),",
  "  `pekerjaan` = VALUES(`pekerjaan`),",
  "  `created_at` = VALUES(`created_at`);",
  "",
  `SELECT ${keluarga.length} AS total_keluarga_generated, ${pasangan.length} AS total_pasangan_generated, ${anak.length} AS total_anak_generated;`,
  ""
);

fs.writeFileSync(outputPath, lines.join("\n"));
console.log(`Generated ${outputPath} with ${keluarga.length} rows (${pasangan.length} pasangan + ${anak.length} anak).`);
