import { fail, ok } from "@/lib/helpers/response";
import { extractWorkflowLogPayload, writeAiWorkflowLog } from "@/lib/n8n-ai/audit";
import { isN8nAiEnabled } from "@/lib/n8n-ai/security";
import { normalizeWorkflowResponse } from "@/lib/n8n-ai/response";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const message = String(body.message || "").trim();

    if (!message) {
      return fail("Pesan tidak boleh kosong", 400);
    }

    if (!isN8nAiEnabled()) {
      return fail("AI n8n belum aktif. Set AI_ENABLE_N8N=true.", 503);
    }

    const webhookUrl = process.env.N8N_PUBLIC_WEBHOOK_URL;
    const secret = process.env.N8N_API_SECRET;

    if (!webhookUrl || !secret) {
      return fail("Konfigurasi n8n public belum tersedia", 500);
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ai-secret": secret
      },
      body: JSON.stringify({
        message,
        source: "public_chat"
      })
    });

    const rawResult = await response.text();
    let result = null;
    if (rawResult.trim()) {
      try {
        result = JSON.parse(rawResult);
      } catch {
        return fail("Workflow n8n public harus mengembalikan JSON valid.", 502);
      }
    }

    if (!response.ok) {
      await writeAiWorkflowLog({
        source: "public_chat",
        message,
        verification: "n8n_error",
        response: result?.error || result?.message || "Workflow n8n public gagal diproses"
      });
      return fail("Workflow n8n public gagal diproses", 500, result);
    }

    if (!result) {
      return fail("Workflow n8n public belum mengembalikan response JSON.", 502);
    }

    const normalized = normalizeWorkflowResponse(result, message);
    await writeAiWorkflowLog(extractWorkflowLogPayload({
      result: normalized,
      message,
      source: "public_chat"
    }));

    return ok(normalized, "Public AI n8n selesai memproses pesan.");
  } catch (error) {
    console.error("AI n8n public chat error:", error);
    return fail("Public chat gagal diproses", 500);
  }
}
