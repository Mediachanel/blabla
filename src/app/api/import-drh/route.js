import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { ROLES } from "@/lib/constants/roles";
import { requireAuth } from "@/lib/auth/requireAuth";
import { fail, ok } from "@/lib/helpers/response";
import { getConnectedPool } from "@/lib/db/mysql";
import { ensureDrhSchema } from "@/lib/db/ensureDrhSchema";
import { importDrhToDatabase } from "@/lib/import/drhImport";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);
const DRH_PDF_MAX_BYTES = 10 * 1024 * 1024;

function getPythonCandidates() {
  const configured = process.env.DRH_PYTHON_BIN?.trim();
  if (configured) return [{ command: configured, argsPrefix: [] }];

  return [
    { command: "python3", argsPrefix: [] },
    { command: "python", argsPrefix: [] },
    { command: "py", argsPrefix: ["-3"] },
  ];
}

function normalizeFileName(value) {
  return String(value || "").replace(/[^\w.-]+/g, "_");
}

async function runDrhParser(parserPath, tempPath) {
  const candidates = getPythonCandidates();
  const missingCommands = [];

  for (const candidate of candidates) {
    try {
      return await execFileAsync(candidate.command, [...candidate.argsPrefix, parserPath, tempPath], {
        cwd: process.cwd(),
        maxBuffer: 20 * 1024 * 1024,
      });
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
      missingCommands.push(candidate.command);
    }
  }

  throw new Error(
    `Interpreter Python tidak ditemukan. Dicoba: ${missingCommands.join(", ")}. Pastikan image Docker sudah di-rebuild atau set DRH_PYTHON_BIN.`
  );
}

function formatParserError(error) {
  const stderr = String(error.stderr || "");
  if (stderr.includes("No module named 'pdfplumber'") || stderr.includes('No module named "pdfplumber"')) {
    return "Parser PDF membutuhkan package Python `pdfplumber`. Jalankan `pip install -r requirements.txt` atau rebuild image Docker terbaru.";
  }
  return error.message;
}

async function parseDrhPdf(file) {
  const uploadName = normalizeFileName(file?.name || "drh.pdf");
  const tempPath = path.join(os.tmpdir(), `drh-${Date.now()}-${uploadName}`);
  const parserPath = path.join(process.cwd(), "scripts", "parse_drh_pdf.py");
  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.length <= 0) {
    throw new Error("File PDF DRH kosong atau tidak dapat dibaca.");
  }
  if (buffer.length > DRH_PDF_MAX_BYTES) {
    throw new Error(`Ukuran PDF DRH maksimal ${DRH_PDF_MAX_BYTES / (1024 * 1024)} MB.`);
  }
  if (buffer.subarray(0, 5).toString("utf8") !== "%PDF-") {
    throw new Error("File tidak terbaca sebagai PDF yang valid.");
  }

  await fs.writeFile(tempPath, buffer);

  try {
    const { stdout, stderr } = await runDrhParser(parserPath, tempPath);
    if (!stdout) {
      throw new Error(stderr || "Parser PDF tidak mengembalikan data.");
    }
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`Gagal membaca PDF DRH: ${formatParserError(error)}`);
  } finally {
    await fs.unlink(tempPath).catch(() => {});
  }
}

export async function POST(request) {
  const { error } = await requireAuth([ROLES.SUPER_ADMIN], request);
  if (error) return error;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return fail("File PDF DRH wajib dipilih.", 422);
  }
  if (!String(file.name || "").toLowerCase().endsWith(".pdf")) {
    return fail("Format file harus PDF.", 422);
  }
  if (file.size > DRH_PDF_MAX_BYTES) {
    return fail(`Ukuran PDF DRH maksimal ${DRH_PDF_MAX_BYTES / (1024 * 1024)} MB.`, 413);
  }

  let parsed;
  try {
    parsed = await parseDrhPdf(file);
  } catch (error) {
    return fail(error.message || "File PDF DRH tidak dapat diproses.", 422);
  }

  const pool = await getConnectedPool();
  const connection = await pool.getConnection();

  try {
    await ensureDrhSchema(connection);
    await connection.beginTransaction();
    const imported = await importDrhToDatabase(connection, parsed, { fileName: file.name });
    await connection.commit();
    return ok(
      {
        ...imported,
        parsedSummary: {
          pegawai: parsed.pegawai,
          counts: parsed.counts,
          pages: parsed?.metadata?.pages || 0,
        },
      },
      "Import PDF DRH berhasil diproses"
    );
  } catch (importError) {
    await connection.rollback();
    return fail(importError.message || "Import PDF DRH gagal diproses.", 500);
  } finally {
    connection.release();
  }
}
