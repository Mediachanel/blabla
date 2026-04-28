import JSZip from "jszip";
import { WILAYAH } from "@/lib/constants/roles";
import { JENIS_PEGAWAI_OPTIONS, normalizeJenisPegawai } from "@/lib/helpers/pegawaiStatus";
import { JABATAN_STANDAR_OPTIONS, normalizeJabatanStandarOption } from "@/lib/jabatanStandar";
import {
  AGAMA_OPTIONS,
  JENIS_KONTRAK_OPTIONS,
  PANGKAT_GOLONGAN_OPTIONS,
  normalizeAgamaOption,
  normalizeJenisKontrakOption,
  normalizePangkatGolonganOption
} from "@/lib/pegawaiReferenceOptions";

export const PEGAWAI_IMPORT_COLUMNS = [
  { key: "id_pegawai", label: "ID Pegawai", rule: "Opsional. Isi hanya jika ingin update data berdasarkan ID pegawai." },
  { key: "nama", label: "Nama", required: true, rule: "Wajib. Minimal 3 karakter." },
  { key: "gelar_depan", label: "Gelar Depan" },
  { key: "gelar_belakang", label: "Gelar Belakang" },
  { key: "jenis_kelamin", label: "Jenis Kelamin", rule: "Contoh: Laki-laki atau Perempuan." },
  { key: "tempat_lahir", label: "Tempat Lahir" },
  { key: "tanggal_lahir", label: "Tanggal Lahir", rule: "Format tanggal: YYYY-MM-DD. Contoh: 1990-12-31." },
  { key: "nik", label: "NIK" },
  { key: "agama", label: "Agama", rule: `Pilihan: ${AGAMA_OPTIONS.join(", ")}.` },
  { key: "nama_ukpd", label: "Nama UKPD", required: true, rule: "Wajib. Harus sama dengan nama UKPD yang ada di sistem." },
  { key: "jenis_pegawai", label: "Jenis Pegawai", required: true, rule: `Pilihan: ${JENIS_PEGAWAI_OPTIONS.join(", ")}.` },
  { key: "status_rumpun", label: "Status Rumpun" },
  { key: "jenis_kontrak", label: "Jenis Kontrak", rule: `Pilihan: ${JENIS_KONTRAK_OPTIONS.join(", ")}.` },
  { key: "nrk", label: "NRK", rule: "Dipakai sebagai kunci update bila ID pegawai dan NIP kosong." },
  { key: "nip", label: "NIP", rule: "Dipakai sebagai kunci update bila ID pegawai kosong." },
  { key: "nama_jabatan_orb", label: "Jabatan ORB" },
  { key: "nama_jabatan_menpan", label: "Jabatan Standar Kepgub 11", rule: "Gunakan daftar jabatan_standar pada sheet Referensi." },
  { key: "struktur_atasan_langsung", label: "Struktur Atasan Langsung" },
  { key: "pangkat_golongan", label: "Pangkat / Golongan", rule: "Gunakan daftar pada sheet Referensi." },
  { key: "tmt_pangkat_terakhir", label: "TMT Pangkat Terakhir", rule: "Format tanggal: YYYY-MM-DD." },
  { key: "jenjang_pendidikan", label: "Jenjang Pendidikan", rule: "Contoh: SMA, D3, S1, S2, S3, PROFESI." },
  { key: "program_studi", label: "Program Studi" },
  { key: "nama_universitas", label: "Universitas / Institusi" },
  { key: "no_hp_pegawai", label: "No HP Pegawai" },
  { key: "email", label: "Email", rule: "Opsional, tetapi jika diisi harus format email valid." },
  { key: "no_bpjs", label: "No BPJS" },
  { key: "kondisi", label: "Kondisi", rule: "Contoh: Aktif, Pensiun, Mutasi." },
  { key: "status_perkawinan", label: "Status Perkawinan" },
  { key: "tmt_kerja_ukpd", label: "TMT Kerja UKPD", rule: "Format tanggal: YYYY-MM-DD." }
];

export const PEGAWAI_EXPORT_COLUMNS = [
  { header: "No", value: (_row, index) => index + 1 },
  { header: "NAMA UKPD", key: "nama_ukpd" },
  { header: "JENIS UKPD", key: "jenis_ukpd" },
  { header: "WILAYAH", key: "wilayah" },
  { header: "NAMA\n(TANPA GELAR)", key: "nama" },
  { header: "KONDISI", key: "kondisi" },
  { header: "NAMA JABATAN ORB (PERGUB 1 TAHUN 2017)", key: "nama_jabatan_orb" },
  { header: "NAMA JABATAN PERMENPAN RB NO 41 TAHUN 2018", value: (row) => row.nama_jabatan_menpan_raw || row.nama_jabatan_menpan || "" },
  { header: "STRUKTUR NAMA JABATAN PERMENPAN RB NO 11 TAHUN 2024", key: "nama_jabatan_menpan" },
  { header: "STRUKTUR ATASAN LANGSUNG", key: "struktur_atasan_langsung" },
  { header: "JENIS PEGAWAI", key: "jenis_pegawai" },
  { header: "Kode Jenis Pegawai", key: "kode_jenis_pegawai" },
  { header: "STATUS RUMPUN", key: "status_rumpun" },
  { header: "JENIS KONTRAK", key: "jenis_kontrak" },
  { header: "NRK", key: "nrk" },
  { header: "NIP", key: "nip" },
  { header: "PANGKAT / GOLONGAN", key: "pangkat_golongan" },
  { header: "TMT PANGKAT TERAKHIR", key: "tmt_pangkat_terakhir" },
  { header: "JENIS KELAMIN\n(L/P)", value: (row) => genderCode(row.jenis_kelamin || row.jenis_kelamin_raw) },
  { header: "TMT KERJA DI UKPD  SAAT INI", key: "tmt_kerja_ukpd" },
  { header: "TEMPAT LAHIR", key: "tempat_lahir" },
  { header: "TANGGAL LAHIR", key: "tanggal_lahir" },
  { header: "NIK", key: "nik" },
  { header: "AGAMA", key: "agama" },
  { header: "JENJANG PENDIDIKAN (BERDASARKAN SK PANGKAT TERAKHIR)", value: (row) => row.jenjang_pendidikan_raw || row.jenjang_pendidikan || "" },
  { header: "PROGRAM STUDI", key: "program_studi" },
  { header: "NAMA UNIVERSITAS", key: "nama_universitas" },
  { header: "NO. HP PEGAWAI", key: "no_hp_pegawai" },
  { header: "EMAIL AKTIF PEGAWAI", key: "email" },
  { header: "DOMISILI_JALAN", key: "domisili_jalan" },
  { header: "DOMISILI_KELURAHAN", key: "domisili_kelurahan" },
  { header: "DOMISILI_KECAMATAN", key: "domisili_kecamatan" },
  { header: "DOMISILI_KOTA/KABUPATEN", key: "domisili_kota_kabupaten" },
  { header: "DOMISILI_PROVINSI", key: "domisili_provinsi" },
  { header: "KTP_JALAN", key: "ktp_jalan" },
  { header: "KTP_KELURAHAN", key: "ktp_kelurahan" },
  { header: "KTP_KECAMATAN", key: "ktp_kecamatan" },
  { header: "KTP_KOTA/KABUPATEN", key: "ktp_kota_kabupaten" },
  { header: "KTP_PROVINSI", key: "ktp_provinsi" },
  { header: "NO_TELP_SUAMI/ISTRI", key: "pasangan_no_tlp" },
  { header: "EMAIL_SUAMI/ISTRI", key: "pasangan_email" },
  { header: "NAMA_SUAMI/ISTRI", key: "pasangan_nama" },
  { header: "PEKERJAAN", key: "pasangan_pekerjaan" },
  { header: "NAMA ANAK KE-1", key: "anak_1_nama" },
  { header: "JENIS KELAMIN ANAK KE-1", key: "anak_1_jenis_kelamin" },
  { header: "TEMPAT LAHIR ANAK KE-1", key: "anak_1_tempat_lahir" },
  { header: "TANGGAL LAHIR ANAK KE-1", key: "anak_1_tanggal_lahir" },
  { header: "PEKERJAAN ANAK KE-1", key: "anak_1_pekerjaan" },
  { header: "NAMA ANAK KE-2", key: "anak_2_nama" },
  { header: "JENIS KELAMIN ANAK KE-2", key: "anak_2_jenis_kelamin" },
  { header: "TEMPAT LAHIR", key: "anak_2_tempat_lahir" },
  { header: "TANGGAL LAHIR ANAK KE-2", key: "anak_2_tanggal_lahir" },
  { header: "PEKERJAAN ANAK KE-2", key: "anak_2_pekerjaan" },
  { header: "NAMA ANAK KE-3", key: "anak_3_nama" },
  { header: "JENIS KELAMIN ANAK KE-3", key: "anak_3_jenis_kelamin" },
  { header: "TEMPAT LAHIR ANAK KE-3", key: "anak_3_tempat_lahir" },
  { header: "TANGGAL LAHIR ANAK KE-3", key: "anak_3_tanggal_lahir" },
  { header: "PEKERJAAN ANAK KE-3", key: "anak_3_pekerjaan" },
  { header: "No BPJS", key: "no_bpjs" },
  { header: "Gelar Depan", key: "gelar_depan" },
  { header: "Gelar Belakang", key: "gelar_belakang" },
  { header: "Status Perkawinan", key: "status_perkawinan" },
  { header: "Kode KTP Provinsi", key: "ktp_kode_provinsi" },
  { header: "Kode KTP Kota/Kab", key: "ktp_kode_kota_kab" },
  { header: "Kode KTP Kecamatan", key: "ktp_kode_kecamatan" },
  { header: "Kode KTP Kelurahan", key: "ktp_kode_kelurahan" },
  { header: "Kode Domisili Provinsi", key: "domisili_kode_provinsi" },
  { header: "Kode  Domisili Kota/Kab", key: "domisili_kode_kota_kab" },
  { header: "Kode  Domisili  Kecamatan", key: "domisili_kode_kecamatan" },
  { header: "Kode  Domisili  Kelurahan", key: "domisili_kode_kelurahan" },
  { header: "", value: () => "" },
  { header: "BT", key: "bt" }
];

export const PEGAWAI_IMPORT_RULES = [
  "Gunakan sheet Pegawai untuk import. Sheet Contoh, Aturan, dan Referensi tidak akan diimport.",
  "Baris pertama adalah nama kolom teknis. Jangan diubah, digeser, atau digabung.",
  "Kolom wajib: nama, nama_ukpd, jenis_pegawai.",
  "Kolom dengan referensi sudah memiliki dropdown validasi di sheet Pegawai. Sumber nilainya tetap ada di sheet Referensi.",
  "Jika id_pegawai terisi dan datanya ada, sistem akan update pegawai tersebut.",
  "Jika id_pegawai kosong, sistem mencari pegawai lama dari NIP, lalu NRK, lalu NIK. Jika tidak ditemukan, sistem membuat pegawai baru.",
  "Kolom kosong pada data update tidak akan menghapus nilai lama. Isi kolom hanya untuk nilai yang ingin dibuat atau diperbarui.",
  "nama_ukpd harus sama dengan referensi UKPD aktif di sistem. Wilayah dan jenis UKPD akan diambil otomatis dari referensi UKPD.",
  "Tanggal harus memakai format YYYY-MM-DD, misalnya 2024-01-31.",
  "Jenis pegawai, agama, jenis kontrak, pangkat/golongan, dan jabatan standar harus mengikuti sheet Referensi.",
  "Import Excel hanya untuk data utama pegawai. Alamat, keluarga, dan riwayat detail tetap memakai form profil atau import DRH."
];

const DATE_FIELDS = ["tanggal_lahir", "tmt_pangkat_terakhir", "tmt_kerja_ukpd"];
const NUMERIC_ID_FIELDS = ["id_pegawai"];
const REQUIRED_FIELDS = PEGAWAI_IMPORT_COLUMNS.filter((column) => column.required).map((column) => column.key);
const TEMPLATE_VALIDATION_MAX_ROW = 10000;
const JENIS_KELAMIN_OPTIONS = ["Perempuan", "Laki-laki"];
const KONDISI_OPTIONS = ["Aktif", "Cuti", "Tugas Belajar", "Tidak Aktif"];
const STATUS_PERKAWINAN_OPTIONS = ["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"];

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function decodeXml(value) {
  return String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function columnName(index) {
  let name = "";
  let current = index;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
}

function columnIndexFromRef(ref) {
  const letters = String(ref || "").match(/[A-Z]+/i)?.[0]?.toUpperCase() || "";
  return letters.split("").reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0);
}

function getAttr(value, attr) {
  const match = String(value || "").match(new RegExp(`${attr}="([^"]*)"`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function cellXml(rowIndex, columnIndex, value, style = 1) {
  const ref = `${columnName(columnIndex)}${rowIndex}`;
  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
}

function dataValidationsXml(validations = []) {
  if (!validations.length) return "";
  return `<dataValidations count="${validations.length}">${validations.map((validation) => (
    `<dataValidation type="list" allowBlank="1" showErrorMessage="1" errorTitle="${escapeXml(validation.errorTitle || "Nilai tidak valid")}" error="${escapeXml(validation.error || "Pilih nilai dari dropdown referensi.")}" sqref="${escapeXml(validation.sqref)}"><formula1>${escapeXml(validation.formula)}</formula1></dataValidation>`
  )).join("")}</dataValidations>`;
}

function sheetXml(rows, { freezeHeader = true, validations = [] } = {}) {
  const maxColumns = Math.max(1, ...rows.map((row) => row.length));
  const cols = Array.from({ length: maxColumns }, (_, index) => `<col min="${index + 1}" max="${index + 1}" width="${index === 0 ? 18 : 28}" customWidth="1" style="1"/>`).join("");
  const data = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => cellXml(rowIndex + 1, columnIndex + 1, value, rowIndex === 0 ? 2 : 1)).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");
  const pane = freezeHeader ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
${pane}<cols>${cols}</cols><sheetData>${data}</sheetData>
${dataValidationsXml(validations)}
</worksheet>`;
}

function definedNamesXml(definedNames = []) {
  if (!definedNames.length) return "";
  return `<definedNames>${definedNames.map((item) => `<definedName name="${escapeXml(item.name)}">${escapeXml(item.formula)}</definedName>`).join("")}</definedNames>`;
}

function workbookXml(sheets, definedNames = []) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${sheets.map((sheet, index) => `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("")}</sheets>
${definedNamesXml(definedNames)}
</workbook>`;
}

function workbookRelsXml(sheets) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheets.map((_sheet, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("")}
<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function contentTypesXml(sheets) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${sheets.map((_sheet, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}
</Types>`;
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/><color rgb="FFFFFFFF"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF166493"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border/><border><left style="thin"><color rgb="FFE2E8F0"/></left><right style="thin"><color rgb="FFE2E8F0"/></right><top style="thin"><color rgb="FFE2E8F0"/></top><bottom style="thin"><color rgb="FFE2E8F0"/></bottom></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="49" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyBorder="1"/><xf numFmtId="49" fontId="1" fillId="2" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/></cellXfs>
</styleSheet>`;
}

function uniqueSorted(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "id"));
}

function referenceConfig(ukpdRows = []) {
  return [
    { key: "jenis_kelamin", header: "Jenis Kelamin", values: JENIS_KELAMIN_OPTIONS, name: "ref_jenis_kelamin" },
    { key: "agama", header: "Agama", values: AGAMA_OPTIONS, name: "ref_agama" },
    { key: "nama_ukpd", header: "Nama UKPD", values: uniqueSorted(ukpdRows.map((row) => row.nama_ukpd)), name: "ref_nama_ukpd" },
    { key: "jenis_pegawai", header: "Jenis Pegawai", values: JENIS_PEGAWAI_OPTIONS, name: "ref_jenis_pegawai" },
    { key: "jenis_kontrak", header: "Jenis Kontrak", values: JENIS_KONTRAK_OPTIONS, name: "ref_jenis_kontrak" },
    { key: "nama_jabatan_menpan", header: "jabatan_standar", values: JABATAN_STANDAR_OPTIONS, name: "ref_jabatan_standar" },
    { key: "pangkat_golongan", header: "Pangkat / Golongan", values: PANGKAT_GOLONGAN_OPTIONS, name: "ref_pangkat_golongan" },
    { key: "kondisi", header: "Kondisi", values: KONDISI_OPTIONS, name: "ref_kondisi" },
    { key: "status_perkawinan", header: "Status Perkawinan", values: STATUS_PERKAWINAN_OPTIONS, name: "ref_status_perkawinan" },
    { key: "wilayah", header: "Wilayah", values: WILAYAH, name: "ref_wilayah" }
  ];
}

function referenceRows(config) {
  const maxLength = Math.max(...config.map((item) => item.values.length));
  return [
    config.map((item) => item.header),
    ...Array.from({ length: maxLength }, (_, index) => [
      ...config.map((item) => item.values[index] || "")
    ])
  ];
}

function buildTemplateDefinedNames(config) {
  return config
    .map((item, index) => {
      if (!item.values.length) return null;
      const column = columnName(index + 1);
      return {
        name: item.name,
        formula: `'Referensi'!$${column}$2:$${column}$${item.values.length + 1}`
      };
    })
    .filter(Boolean);
}

function buildPegawaiSheetValidations(headers, config) {
  const byKey = new Map(config.map((item) => [item.key, item]));
  return headers
    .map((key, index) => {
      const item = byKey.get(key);
      if (!item?.values.length) return null;
      const column = columnName(index + 1);
      return {
        sqref: `${column}2:${column}${TEMPLATE_VALIDATION_MAX_ROW}`,
        formula: item.name,
        error: `Pilih ${item.header} dari dropdown referensi.`
      };
    })
    .filter(Boolean);
}

export async function buildPegawaiImportTemplate({ ukpdRows = [] } = {}) {
  const headers = PEGAWAI_IMPORT_COLUMNS.map((column) => column.key);
  const config = referenceConfig(ukpdRows);
  const definedNames = buildTemplateDefinedNames(config);
  const sample = {
    nama: "Contoh Pegawai",
    jenis_kelamin: "Perempuan",
    tempat_lahir: "Jakarta",
    tanggal_lahir: "1990-01-31",
    nik: "3171000000000001",
    agama: "Islam",
    nama_ukpd: "Dinas Kesehatan",
    jenis_pegawai: "PNS",
    status_rumpun: "Tenaga Kesehatan",
    jenis_kontrak: "Tetap",
    nrk: "123456",
    nip: "199001312020121001",
    nama_jabatan_orb: "Analis Kesehatan",
    nama_jabatan_menpan: "Administrator Kesehatan Ahli Pertama",
    pangkat_golongan: "Penata Muda - III/a",
    tmt_pangkat_terakhir: "2024-04-01",
    jenjang_pendidikan: "S1",
    program_studi: "Kesehatan Masyarakat",
    nama_universitas: "Universitas Indonesia",
    no_hp_pegawai: "081234567890",
    email: "pegawai@example.go.id",
    kondisi: "Aktif",
    status_perkawinan: "Kawin",
    tmt_kerja_ukpd: "2020-01-01"
  };
  const sheets = [
    { name: "Pegawai", rows: [headers], validations: buildPegawaiSheetValidations(headers, config) },
    { name: "Contoh", rows: [headers, headers.map((key) => sample[key] || "")] },
    { name: "Aturan", rows: [["No", "Aturan"], ...PEGAWAI_IMPORT_RULES.map((rule, index) => [index + 1, rule]), ["", ""], ["Kolom", "Keterangan"], ...PEGAWAI_IMPORT_COLUMNS.map((column) => [column.key, column.rule || column.label])] },
    { name: "Referensi", rows: referenceRows(config) }
  ];

  const zip = new JSZip();
  zip.file("[Content_Types].xml", contentTypesXml(sheets));
  zip.folder("_rels").file(".rels", rootRelsXml());
  const xl = zip.folder("xl");
  xl.file("workbook.xml", workbookXml(sheets, definedNames));
  xl.file("styles.xml", stylesXml());
  xl.folder("_rels").file("workbook.xml.rels", workbookRelsXml(sheets));
  const worksheets = xl.folder("worksheets");
  sheets.forEach((sheet, index) => worksheets.file(`sheet${index + 1}.xml`, sheetXml(sheet.rows, { validations: sheet.validations || [] })));
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

function genderCode(value) {
  const text = normalizeCellValue(value).toUpperCase().replace(/\s+/g, " ");
  if (!text) return "";
  if (text === "P" || text.includes("PEREMPUAN") || text.includes("WANITA")) return "P";
  if (text === "L" || text.includes("LAKI") || text.includes("PRIA")) return "L";
  return value;
}

function exportCellValue(row, column, index) {
  if (typeof column.value === "function") return column.value(row, index);
  return row?.[column.key] ?? "";
}

function buildWorkbookBuffer(sheets, definedNames = []) {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", contentTypesXml(sheets));
  zip.folder("_rels").file(".rels", rootRelsXml());
  const xl = zip.folder("xl");
  xl.file("workbook.xml", workbookXml(sheets, definedNames));
  xl.file("styles.xml", stylesXml());
  xl.folder("_rels").file("workbook.xml.rels", workbookRelsXml(sheets));
  const worksheets = xl.folder("worksheets");
  sheets.forEach((sheet, index) => worksheets.file(`sheet${index + 1}.xml`, sheetXml(sheet.rows, { validations: sheet.validations || [] })));
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

export function buildPegawaiExportRows(rows = []) {
  return [
    PEGAWAI_EXPORT_COLUMNS.map((column) => column.header),
    ...rows.map((row, index) => PEGAWAI_EXPORT_COLUMNS.map((column) => exportCellValue(row, column, index)))
  ];
}

export async function buildPegawaiExportWorkbook({ rows = [] } = {}) {
  return buildWorkbookBuffer([
    { name: "Data Pegawai", rows: buildPegawaiExportRows(rows) }
  ]);
}

function normalizeHeader(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

const HEADER_ALIASES = new Map(
  PEGAWAI_IMPORT_COLUMNS.flatMap((column) => [
    [normalizeHeader(column.key), column.key],
    [normalizeHeader(column.label), column.key]
  ])
);
HEADER_ALIASES.set("jabatan_standar", "nama_jabatan_menpan");

function normalizeCellValue(value) {
  return String(value ?? "").trim().replace(/^`+/, "");
}

function parseCsv(text) {
  const normalized = String(text || "").replace(/^\uFEFF/, "");
  const firstLine = normalized.split(/\r?\n/, 1)[0] || "";
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    const next = normalized[index + 1];
    if (char === "\"") {
      if (inQuotes && next === "\"") {
        cell += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  rows.push(row);
  return rows.filter((item) => item.some((value) => normalizeCellValue(value)));
}

function extractTextNodes(xml) {
  const values = [];
  const regex = /<t[^>]*>([\s\S]*?)<\/t>/g;
  let match;
  while ((match = regex.exec(xml))) {
    values.push(decodeXml(match[1]));
  }
  return values.join("");
}

function parseSharedStrings(xml) {
  if (!xml) return [];
  const strings = [];
  const regex = /<si[^>]*>([\s\S]*?)<\/si>/g;
  let match;
  while ((match = regex.exec(xml))) {
    strings.push(extractTextNodes(match[1]));
  }
  return strings;
}

function cellValue(attrs, inner, sharedStrings) {
  const type = getAttr(attrs, "t");
  if (type === "inlineStr") return extractTextNodes(inner);
  const raw = decodeXml((inner.match(/<v[^>]*>([\s\S]*?)<\/v>/) || [])[1] || "");
  if (type === "s") return sharedStrings[Number(raw)] || "";
  if (type === "str") return raw;
  return raw;
}

function parseSheetRows(xml, sharedStrings) {
  const rows = [];
  const rowRegex = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(xml))) {
    const values = [];
    const cellRegex = /<c([^>]*)>([\s\S]*?)<\/c>/g;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowMatch[2]))) {
      const ref = getAttr(cellMatch[1], "r");
      const index = columnIndexFromRef(ref);
      if (index > 0) values[index - 1] = cellValue(cellMatch[1], cellMatch[2], sharedStrings);
    }
    rows.push(values.map((value) => value ?? ""));
  }
  return rows;
}

function parseRowsToObjects(rows) {
  const headerRow = rows[0] || [];
  const headers = headerRow.map((value) => HEADER_ALIASES.get(normalizeHeader(value)) || "");
  return rows.slice(1).map((row, index) => {
    const record = {};
    headers.forEach((key, columnIndex) => {
      if (!key) return;
      record[key] = normalizeCellValue(row[columnIndex]);
    });
    return { rowNumber: index + 2, record };
  }).filter(({ record }) => Object.values(record).some((value) => normalizeCellValue(value)));
}

async function readWorkbookRows(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const workbookXmlFile = await zip.file("xl/workbook.xml")?.async("string");
  const relsXml = await zip.file("xl/_rels/workbook.xml.rels")?.async("string");
  const sharedStringsFile = zip.file("xl/sharedStrings.xml");
  const sharedStrings = parseSharedStrings(sharedStringsFile ? await sharedStringsFile.async("string") : "");

  let sheetPath = "xl/worksheets/sheet1.xml";
  const sheetMatch = String(workbookXmlFile || "").match(/<sheet[^>]*name="Pegawai"[^>]*r:id="([^"]+)"/i)
    || String(workbookXmlFile || "").match(/<sheet[^>]*r:id="([^"]+)"/i);
  if (sheetMatch && relsXml) {
    const relMatch = relsXml.match(new RegExp(`<Relationship[^>]*Id="${sheetMatch[1]}"[^>]*Target="([^"]+)"`, "i"));
    if (relMatch) sheetPath = `xl/${decodeXml(relMatch[1]).replace(/^\/?xl\//, "")}`;
  }

  const sheet = await zip.file(sheetPath)?.async("string");
  if (!sheet) throw new Error("Sheet Pegawai tidak ditemukan di file Excel.");
  return parseSheetRows(sheet, sharedStrings);
}

export async function parsePegawaiImportFile(buffer, fileName = "") {
  const name = String(fileName || "").toLowerCase();
  const rows = name.endsWith(".csv")
    ? parseCsv(Buffer.from(buffer).toString("utf8"))
    : await readWorkbookRows(buffer);
  return parseRowsToObjects(rows);
}

function normalizeDateValue(value) {
  const text = normalizeCellValue(value);
  if (!text) return { value: "", valid: true };

  if (/^\d+(\.\d+)?$/.test(text)) {
    const serial = Number(text);
    if (serial >= 20000 && serial <= 60000) {
      const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
      return { value: date.toISOString().slice(0, 10), valid: true };
    }
  }

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const local = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  const normalized = iso
    ? `${iso[1]}-${iso[2]}-${iso[3]}`
    : local
      ? `${local[3]}-${String(local[2]).padStart(2, "0")}-${String(local[1]).padStart(2, "0")}`
      : "";
  if (!normalized) return { value: text, valid: false };

  const date = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== normalized) {
    return { value: text, valid: false };
  }
  return { value: normalized, valid: true };
}

function addError(errors, field, message) {
  errors.push({ field, message });
}

function normalizeReferenceField(data, errors, field, allowed, normalize, label) {
  const value = normalize(data[field]);
  data[field] = value;
  if (value && !allowed.includes(value)) {
    addError(errors, field, `${label} harus mengikuti daftar referensi.`);
  }
}

export function normalizePegawaiImportRecord(record) {
  const errors = [];
  const data = {};

  for (const column of PEGAWAI_IMPORT_COLUMNS) {
    const value = normalizeCellValue(record[column.key]);
    if (value) data[column.key] = value;
  }

  for (const field of REQUIRED_FIELDS) {
    if (!normalizeCellValue(data[field])) {
      addError(errors, field, `${field} wajib diisi.`);
    }
  }
  if (data.nama && data.nama.length < 3) addError(errors, "nama", "Nama minimal 3 karakter.");

  for (const field of NUMERIC_ID_FIELDS) {
    if (!data[field]) continue;
    if (!/^\d+$/.test(data[field])) {
      addError(errors, field, `${field} harus berupa angka.`);
    } else {
      data[field] = Number(data[field]);
    }
  }

  if (data.jenis_pegawai) {
    data.jenis_pegawai = normalizeJenisPegawai(data.jenis_pegawai);
    if (!JENIS_PEGAWAI_OPTIONS.includes(data.jenis_pegawai)) {
      addError(errors, "jenis_pegawai", `Jenis pegawai harus salah satu dari: ${JENIS_PEGAWAI_OPTIONS.join(", ")}.`);
    }
  }

  normalizeReferenceField(data, errors, "agama", AGAMA_OPTIONS, normalizeAgamaOption, "Agama");
  normalizeReferenceField(data, errors, "jenis_kontrak", JENIS_KONTRAK_OPTIONS, normalizeJenisKontrakOption, "Jenis kontrak");
  normalizeReferenceField(data, errors, "pangkat_golongan", PANGKAT_GOLONGAN_OPTIONS, normalizePangkatGolonganOption, "Pangkat/golongan");
  normalizeReferenceField(data, errors, "nama_jabatan_menpan", JABATAN_STANDAR_OPTIONS, normalizeJabatanStandarOption, "Jabatan standar Kepgub 11");

  for (const field of DATE_FIELDS) {
    if (!data[field]) continue;
    const date = normalizeDateValue(data[field]);
    data[field] = date.value;
    if (!date.valid) addError(errors, field, `${field} harus memakai format YYYY-MM-DD.`);
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    addError(errors, "email", "Format email tidak valid.");
  }

  return { data, errors };
}

export function buildPegawaiImportError(rowNumber, errors) {
  return {
    rowNumber,
    messages: errors.map((error) => error.message),
    fields: errors.map((error) => error.field)
  };
}
